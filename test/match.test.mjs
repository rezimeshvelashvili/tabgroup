import { test } from "node:test";
import assert from "node:assert/strict";
import { pickGroup, colorFor, COLORS } from "../extension/match.js";

const rules = [
  { group: "Writing", color: "blue", match: ["essays", "drafts"] },
  { group: "Maths", color: "red", match: ["math-course"] },
];

test("#tabgroup tag picks the group and color", () => {
  assert.deepEqual(
    pickGroup("file:///tmp/a%20b.html#tabgroup=Work%20Notes&tabcolor=green"),
    { group: "Work Notes", color: "green" }
  );
});

test("tag works after an existing fragment and in the query string", () => {
  assert.equal(pickGroup("https://ex.com/a#intro&tabgroup=Research").group, "Research");
  assert.equal(pickGroup("https://ex.com/?tabgroup=Research").group, "Research");
});

test("tag reuses a rule's name casing and color", () => {
  assert.deepEqual(pickGroup("file:///x.html#tabgroup=maths", rules), {
    group: "Maths",
    color: "red",
  });
});

test("unknown or missing color falls back to a stable non-grey color", () => {
  const a = pickGroup("https://ex.com/#tabgroup=Spanish&tabcolor=magenta");
  assert.equal(a.color, colorFor("Spanish"));
  assert.notEqual(a.color, "grey");
  assert.ok(COLORS.includes(a.color));
  assert.equal(colorFor("Spanish"), colorFor("spanish"));
});

test("tag beats folder rules", () => {
  assert.equal(pickGroup("file:///home/essays/a.html#tabgroup=Other", rules).group, "Other");
});

test("folder rules match local pages, including encoded paths", () => {
  assert.equal(pickGroup("file:///Users/me/My%20Drive/essays/01.html", rules).group, "Writing");
  assert.equal(pickGroup("http://localhost:5173/math-course/x", rules).group, "Maths");
  assert.equal(pickGroup("http://127.0.0.1:8000/drafts/", rules).group, "Writing");
});

test("folder rules never match ordinary websites", () => {
  assert.equal(pickGroup("https://www.google.com/search?q=essays", rules), null);
});

test("no match, bad input and browser pages return null", () => {
  assert.equal(pickGroup("file:///Users/me/other/w1.html", rules), null);
  assert.equal(pickGroup("chrome://newtab/", rules), null);
  assert.equal(pickGroup("not a url", rules), null);
  assert.equal(pickGroup(undefined, rules), null);
  assert.equal(pickGroup("file:///x.html#tabgroup=%20%20", rules), null);
});

test("blank match strings are ignored", () => {
  assert.equal(pickGroup("file:///anything.html", [{ group: "All", match: [" "] }]), null);
});
