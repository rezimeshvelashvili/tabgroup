#!/usr/bin/env bash
# Puts the `tabgroup` command on your PATH (as a symlink to this checkout)
# and shows how to load the browser extension.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd -P)"
src="$here/bin/tabgroup"
chmod +x "$src"

on_path() { [[ ":$PATH:" == *":$1:"* ]]; }

if [[ -n "${TABGROUP_BIN_DIR:-}" ]]; then
  dest="$TABGROUP_BIN_DIR"
elif [[ -w /usr/local/bin ]] && on_path /usr/local/bin; then
  dest=/usr/local/bin
else
  dest="$HOME/.local/bin"
fi
mkdir -p "$dest"
ln -sf "$src" "$dest/tabgroup"
echo "Installed: $dest/tabgroup -> $src"

if ! on_path "$dest"; then
  echo
  echo "Note: $dest is not on your PATH. Add this line to your shell profile (~/.zshrc or ~/.bashrc):"
  echo "  export PATH=\"$dest:\$PATH\""
fi

cat <<EOF

Next, load the browser extension (one time):
  1. Open chrome://extensions (or brave://extensions, edge://extensions)
  2. Turn on Developer mode
  3. Click "Load unpacked" and choose: $here/extension
  4. Click Details and turn on "Allow access to file URLs" (needed for local files)

Then try:
  tabgroup "Hello tabgroup" https://example.com
EOF
