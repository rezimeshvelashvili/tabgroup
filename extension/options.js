import { COLORS } from "./match.js";

const list = document.getElementById("rules");
const empty = document.getElementById("empty");
const status = document.getElementById("status");

let rules = [];

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const clean = rules
      .map((r) => ({
        group: r.group.trim(),
        color: r.color,
        match: r.matchText.split(",").map((s) => s.trim()).filter(Boolean),
      }))
      .filter((r) => r.group && r.match.length);
    await chrome.storage.sync.set({ rules: clean });
    status.textContent = "Saved";
    setTimeout(() => (status.textContent = ""), 1200);
  }, 300);
}

function render() {
  list.replaceChildren(
    ...rules.map((r, i) => {
      const name = el("input", { value: r.group, placeholder: "e.g. Work Notes" });
      name.addEventListener("input", () => { r.group = name.value; save(); });

      const color = el("select", {}, COLORS.map((c) => el("option", { value: c, textContent: c })));
      color.value = r.color;
      color.addEventListener("change", () => { r.color = color.value; save(); });

      const match = el("input", {
        className: "match",
        value: r.matchText,
        placeholder: "e.g. my-notes, /projects/work/",
      });
      match.addEventListener("input", () => { r.matchText = match.value; save(); });

      const remove = el("button", { className: "remove", textContent: "Remove" });
      remove.addEventListener("click", () => { rules.splice(i, 1); render(); save(); });

      return el("div", { className: "rule" }, [name, color, match, remove]);
    })
  );
  empty.hidden = rules.length > 0;
}

document.getElementById("add").addEventListener("click", () => {
  rules.push({ group: "", color: "blue", matchText: "" });
  render();
  list.lastElementChild?.querySelector("input")?.focus();
});

const stored = await chrome.storage.sync.get({ rules: [] });
rules = (stored.rules ?? []).map((r) => ({
  group: r.group ?? "",
  color: COLORS.includes(r.color) ? r.color : "blue",
  matchText: (r.match ?? []).join(", "),
}));
render();
