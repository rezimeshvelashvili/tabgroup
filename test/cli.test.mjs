import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pickGroup } from "../extension/match.js";

const cli = new URL("../bin/tabgroup", import.meta.url).pathname;
const dry = (...args) => execFileSync(cli, [...args, "--dry-run"], { encoding: "utf8" }).trim().split("\n");

test("local files become encoded file:// URLs the extension understands", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "tabgroup-")), "My Drive", "a＠b é");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "lesson #1.html");
  writeFileSync(file, "");

  const [url] = dry("Café Notes", file, "--color", "GREEN");
  const u = new URL(url);
  assert.equal(u.protocol, "file:");
  assert.ok(decodeURIComponent(u.pathname).endsWith("/My Drive/a＠b é/lesson #1.html"));
  assert.deepEqual(pickGroup(url), { group: "Café Notes", color: "green" });
});

test("URLs keep their own fragment", () => {
  assert.deepEqual(dry("R", "https://ex.com/a#intro", "https://ex.com/b#"), [
    "https://ex.com/a#intro&tabgroup=R",
    "https://ex.com/b#tabgroup=R",
  ]);
});

test("bad input fails without opening anything", () => {
  for (const args of [["X"], ["X", "no-such-file.html"], ["X", "https://a.com", "-c", "magenta"], ["  ", "https://a.com"]]) {
    const r = spawnSync(cli, [...args, "--dry-run"], { encoding: "utf8" });
    assert.equal(r.status, 1, `expected failure for ${JSON.stringify(args)}`);
    assert.equal(r.stdout, "");
  }
});
