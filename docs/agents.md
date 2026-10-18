# Using tabgroup with AI agents

Coding agents often open generated pages, docs, or local previews in your browser. With tabgroup, each project's tabs land in their own named group instead of piling up.

## Instructions to paste

Put this in your agent's global instructions file:

| Agent | File |
| --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex CLI | `~/.codex/AGENTS.md` |
| Others | `AGENTS.md` in the project, or the tool's rules file |

```markdown
## Opening pages in the browser

When you open a page, file, or local preview in the browser for me, run:

    tabgroup "<Group name>" <file-or-url> [more...] [--color <color>]

instead of `open` / `xdg-open`.

- Which group: the one I named for this project (e.g. "open these in the Research group").
  When I name a group, save it in this project's instructions file as
  `Browser tab group: <name>` so future sessions reuse it. If no group is known yet, ask me once.
- The group is created if it doesn't exist. `--color` (grey, blue, red, yellow, green,
  pink, purple, cyan, orange) only applies when it's created.
- If tabs open but don't join a group, tell me to check that the tabgroup extension is
  enabled at chrome://extensions.
```

If `tabgroup` isn't on the agent's PATH, use the absolute path to `bin/tabgroup` in your clone.

## Per-project groups

After you tell the agent a group once, the project's instructions file gets a line like:

```markdown
Browser tab group: GRE Maths
```

Every later session in that project then opens pages in that group without asking.

## Without the CLI

Agents that can only open URLs can still choose a group by adding `#tabgroup=<name>` (URL-encoded) to the address:

```
file:///path/to/report.html#tabgroup=Weekly%20Reports
```
