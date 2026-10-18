// Decides which tab group a URL belongs in. Pure logic, no chrome.* calls,
// so it can be unit-tested with plain Node.

export const COLORS = [
  "grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange",
];

export const GROUP_PARAM = "tabgroup";
export const COLOR_PARAM = "tabcolor";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// The same name always gets the same color, so new groups look consistent.
export function colorFor(name) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[1 + (h % (COLORS.length - 1))]; // skip grey
}

function readParam(u, hash, key) {
  return (hash.get(key) ?? u.searchParams.get(key) ?? "").trim();
}

// rules: [{ group, color?, match: ["substring", ...] }]
// Returns { group, color } for the tab group this URL belongs in, or null.
export function pickGroup(url, rules = []) {
  if (!url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  // 1. An explicit #tabgroup=<name> (or ?tabgroup=<name>) always wins.
  const hash = new URLSearchParams(u.hash.slice(1));
  const name = readParam(u, hash, GROUP_PARAM);
  if (name) {
    const asked = readParam(u, hash, COLOR_PARAM).toLowerCase();
    const rule = rules.find((r) => r.group.toLowerCase() === name.toLowerCase());
    const color = COLORS.includes(asked) ? asked : rule?.color ?? colorFor(name);
    return { group: rule?.group ?? name, color };
  }

  // 2. Otherwise, local pages (file:// and localhost) are matched against the
  //    user's rules. Ordinary websites are never grouped implicitly.
  const isLocal = u.protocol === "file:" || LOCAL_HOSTS.has(u.hostname);
  if (!isLocal) return null;

  const haystack = safeDecode(u.href).toLowerCase();
  const rule = rules.find((r) =>
    (r.match ?? []).some((m) => m.trim() && haystack.includes(m.trim().toLowerCase()))
  );
  return rule ? { group: rule.group, color: rule.color ?? colorFor(rule.group) } : null;
}
