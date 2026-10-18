import { pickGroup } from "./match.js";

const NO_GROUP = -1; // chrome.tabGroups.TAB_GROUP_ID_NONE

async function loadRules() {
  const { rules } = await chrome.storage.sync.get({ rules: [] });
  return Array.isArray(rules) ? rules : [];
}

// Tabs are placed one at a time so two tabs opening together don't each
// create their own copy of the same group.
let queue = Promise.resolve();
function enqueue(fn) {
  queue = queue.then(fn).catch((e) => console.warn("[tabgroup]", e));
  return queue;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Chrome refuses tab edits while the user is dragging a tab; retry briefly.
async function withRetry(fn, tries = 5) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries - 1 || !/dragging|cannot be edited/i.test(String(e))) throw e;
      await sleep(300);
    }
  }
}

async function findGroup(title, preferWindowId) {
  const groups = (await chrome.tabGroups.query({})).filter(
    (g) => (g.title ?? "").trim().toLowerCase() === title.toLowerCase()
  );
  return groups.find((g) => g.windowId === preferWindowId) ?? groups[0] ?? null;
}

async function placeTab(tabId) {
  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return; // tab already closed
  }
  // Leave tabs that are already in a group (including ones the user moved).
  if (tab.groupId !== NO_GROUP || tab.incognito || tab.pinned) return;

  const target = pickGroup(tab.url || tab.pendingUrl, await loadRules());
  if (!target) return;

  const group = await findGroup(target.group, tab.windowId);

  await withRetry(async () => {
    if (group) {
      if (group.windowId !== tab.windowId) {
        await chrome.tabs.move(tabId, { windowId: group.windowId, index: -1 });
      }
      await chrome.tabs.group({ groupId: group.id, tabIds: tabId });
      if (group.collapsed) await chrome.tabGroups.update(group.id, { collapsed: false });
      await chrome.tabs.update(tabId, { active: true });
      await chrome.windows.update(group.windowId, { focused: true });
    } else {
      const groupId = await chrome.tabs.group({ tabIds: tabId });
      await chrome.tabGroups.update(groupId, {
        title: target.group,
        color: target.color,
        collapsed: false,
      });
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url || info.status === "complete") enqueue(() => placeTab(tabId));
});

// Sort matching tabs that were already open when Chrome or the extension started.
async function sweep() {
  for (const tab of await chrome.tabs.query({})) enqueue(() => placeTab(tab.id));
}
chrome.runtime.onInstalled.addListener(sweep);
chrome.runtime.onStartup.addListener(sweep);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.rules) sweep();
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
