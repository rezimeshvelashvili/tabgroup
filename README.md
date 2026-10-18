# tabgroup

**Open browser tabs straight into named tab groups from the terminal, scripts, or AI coding agents.**

```bash
tabgroup "Research" https://arxiv.org/abs/1706.03762 notes.html --color purple
```

The group is created if it doesn't exist. If it already exists, the tab joins it, even when the group is in another window.

## Why

Chrome has no command-line flag, AppleScript command, or URL scheme for tab groups. Only extensions can use the tab groups API. So scripts and AI agents (Claude Code, Codex, Cursor, …) that open pages for you end up dumping tabs wherever Chrome puts them.

tabgroup is two small parts:

| Part | What it does |
| --- | --- |
| `bin/tabgroup` | A command that tags each address with `#tabgroup=<name>` and opens it in your browser. |
| `extension/` | A browser extension that sees the tag and moves the tab into that group, creating the group if needed. |

Because the group travels in the URL, **anything that can open a URL can pick a group**, not just this command.

## Install

```bash
git clone https://github.com/rezimeshvelashvili/tabgroup.git
cd tabgroup
./install.sh
```

`install.sh` links `tabgroup` into `/usr/local/bin` (or `~/.local/bin`), then prints the extension steps:

1. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Click **Details** and turn on **Allow access to file URLs** if you'll open local files.

## Usage

```
tabgroup <group name> <file-or-url>... [options]

  -c, --color <color>    color for a new group: grey blue red yellow green
                         pink purple cyan orange (existing groups keep theirs)
  -b, --browser <name>   browser to use (default: $TABGROUP_BROWSER, else Chrome)
  -n, --dry-run          print the tagged URLs instead of opening them
```

```bash
tabgroup "Work Notes" notes/week1.html notes/week2.html
tabgroup "Docs" https://developer.chrome.com/docs/extensions --color blue
TABGROUP_BROWSER="Brave Browser" tabgroup "Reading" article.html
```

Without `--color`, a new group gets a color derived from its name, so "Research" is always the same color.

## Use it with AI agents

Add this to your agent's instructions file, for example `~/.claude/CLAUDE.md` for Claude Code or `AGENTS.md` for others:

```markdown
## Opening pages in the browser
When you open a page or file in the browser for me, use
`tabgroup "<Group name>" <file-or-url>` instead of `open`.
Use the group I named for this project. When I name one, save it in this
project's instructions as `Browser tab group: <name>` so later sessions reuse it.
If no group is known yet, ask me once.
```

Then just tell the agent "open the docs in the *Research* group." A longer version is in [docs/agents.md](docs/agents.md).

## Folder rules (optional)

Click the extension's toolbar icon to open its settings. There you can add rules such as *anything whose address contains `my-notes` → group "Notes"*. Rules only apply to local pages (`file://`, `localhost`, `127.0.0.1`) that arrive **without** a `#tabgroup` tag. Ordinary websites are never grouped implicitly. Rules are stored in Chrome sync storage, not in this repo.

## URL format

The extension reads these parameters from the fragment (preferred) or the query string:

| Parameter | Meaning |
| --- | --- |
| `tabgroup=<name>` | Group to put the tab in (URL-encoded). |
| `tabcolor=<color>` | Color if the group gets created. Optional. |

```
file:///Users/me/notes/week1.html#tabgroup=Work%20Notes&tabcolor=green
https://example.com/page#section-2&tabgroup=Research
```

## Behavior notes

- Tabs that are already in a group, pinned, or in incognito are left alone. If you drag a tab out of its group, it stays out until it navigates again.
- Groups are matched by name, ignoring case. If the group is in another window, the tab moves there and that window is focused.
- Tabs that were already open are sorted when the extension starts or its rules change.

## Platform support

| | Status |
| --- | --- |
| Extension | Chrome 102+, and other Chromium browsers with tab groups (Brave, Edge) |
| CLI on macOS | Tested (bash 3.2+) |
| CLI on Linux | Should work. Uses `google-chrome`, `chromium`, `brave-browser` or `microsoft-edge`, or `--browser` |
| CLI on Windows | Not yet. Use `--dry-run` and open the printed URL, or add the tag yourself. |

## Development

```bash
npm test        # unit tests for the extension's matching logic and the CLI (Node 18+)
```

After editing `extension/`, click the reload icon on the extension's card in `chrome://extensions`.

## License

[MIT](LICENSE)
