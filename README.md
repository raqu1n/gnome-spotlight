# Launchpad Search for GNOME Shell

Open the search bar with Super+Alt+Space. Type to find apps and open windows, calculate expressions, run commands, browse directories, trigger system actions, and search the web.

Built for GNOME Shell 50 and 51.

## What you can type

| Input | Results |
| --- | --- |
| `fire` | Matching apps and open windows, system actions, and a calculation when the text is an expression |
| `2 + 3 * 4`, `sqrt(2)`, `15%`, `5!` | The result. Press Enter to copy it to the clipboard |
| `= pi` | Explicit calculator mode (accepts a constant by itself) |
| `> htop` | Run the command in a terminal and leave the shell open so you can read its output |
| `$ notify-send hello` | Run the command in the background without a window |
| `~/Doc`, `/usr/sh` | Files and directories at that path. Tab completes; Enter opens |
| `? gnome shell` | Search the web |
| `lock`, `suspend` | System actions (lock, suspend, restart, power off, log out) |

Use the arrow keys to navigate, Enter to open, Tab to complete a path, and Esc to clear the query. Press Esc again to close the window. Clicking outside the window also closes it.

The window opens on the monitor containing the pointer, with its top at 25% of the screen height. When Blur my Shell's popup component is active, the panel is translucent and blurred like other GNOME popups; otherwise it is solid.

The calculator supports `+ - * / ^`, `×` and `÷`, parentheses, `%` (divide by 100), `!` (factorial), implicit multiplication (`2pi`, `2(3+1)`), comma or period decimals, the constants `pi`, `tau` and `e`, and the functions `sqrt cbrt abs ln log log2 exp sin cos tan asin acos atan round floor ceil`. If an expression uses a comma, the answer uses a comma too.

## Shortcut

The default is Super+Alt+Space. Change it in Preferences: choose the Shortcut row, click Change, then press the key combination. Backspace clears the shortcut.

The extension does not change system shortcuts. To use Super+Space, first remove that shortcut from “Switch to the next input source” in Settings > Keyboard > Shortcuts.

## Preferences

- Shortcut
- Maximum results (3 to 20, default 8)
- Web search URL, using `%s` for the query (Google by default)
- Prefix key hints

## Installation

```bash
bun install
bun run install:local   # build and copy to ~/.local/share/gnome-shell/extensions
gnome-extensions enable launchpad-search@mateusseiboth.github.io
```

On Wayland, the Shell loads a new extension or updated code only after you log out and back in.

## Development

```bash
bun run format:check   # oxfmt
bun run lint           # oxlint --type-aware
bun run typecheck      # TypeScript 7, three projects (src, test, scripts)
bun test               # domain, providers, service, and presenter
bun run build          # prepare dist/ for the Shell
bun run pack           # build a zip for extensions.gnome.org
bun scripts/extract-messages.ts   # regenerate po/launchpad-search.pot
```

The build transpiles each reachable module in `src/` to a `.js` file in `dist/` (same directory structure, relative imports, no comments) and formats it with oxfmt. The code submitted to extensions.gnome.org remains readable for review.

`pack` creates `launchpad-search@mateusseiboth.github.io.shell-extension.zip` without `gschemas.compiled`; the Shell compiles the schema during installation from the website.

The architecture, search rules, and findings about Shell 50 are documented in `doc/`.

## License

GPL-2.0-or-later. See `LICENSE`.
