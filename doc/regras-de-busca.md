# Search rules

## Prefix modes (`src/domain/query/queryParser.ts`)

| Prefix | Mode | Is the prefix kept in the term? |
| --- | --- | --- |
| none | default: apps, windows, automatic calculation, system actions, web last | |
| `=` | calculator | no |
| `>` | command in terminal | no |
| `$` | background command | no |
| `?` | web | no |
| `/` or `~` | files | yes, it is part of the path |

An empty term does not query any providers.

## Scores (0 to 1)

Text matching (`textMatcher.ts`) ignores accents and case, and uses the first matching rule: exact (1), prefix (0.85 to 0.95), word start (0.7 to 0.8), every query word starting a candidate word (0.65), substring (0.5 to 0.6), initials (0.45), letters in order (up to 0.3). Within each range, the bonus grows with the share of the candidate covered by the query, so `fi` scores “Files” higher than “Firefox Developer Edition.”

| Provider | Scoring |
| --- | --- |
| Apps | Best weighted field: name 1, generic name and keywords 0.8, executable 0.7, description 0.5. 95% of the score comes from this and 5% from usage frequency (`Shell.AppUsage`), which only breaks ties. |
| Windows | Title 0.9, app name 0.85, multiplied by 0.95. Always below an app with the same name. |
| Calculator | Fixed at 0.97; shown at the top. |
| System actions | Name score multiplied by 0.9, with a minimum of 0.5 (the Shell may match only a keyword). |
| Commands | 1 |
| Web | 1 with `?`; 0.01 in default mode, always last. |
| Files | Directories get +0.5. Matching is rounded to 0.1 increments so similar names tie and sort alphabetically, like in a file chooser. |

## Calculator

- In default mode, a calculation appears only if the text contains a digit and an operation (operator, parenthesis, or function). Without this rule, typing `e` to find the Editor would put 2.718 at the top.
- `-2^2` is -4 and `2^-1` is 0.5 (exponentiation binds more tightly than the sign and is right-associative).
- `%` divides by 100. `200 * 10%` gives 20. The desktop calculator rule where `200 + 10%` becomes 220 is not supported.
- Results are rounded to 12 significant digits to remove binary floating-point noise (`0.1 + 0.2` gives `0.3`).
- Division by zero, square roots of negative numbers, and factorials outside 0 to 170 produce no result.
- Known limitation: `1.000` is read as 1, not one thousand. Thousands separators are not supported.

## Commands

- `>` builds `<terminal> <args> sh -c '<command>; exec "${SHELL:-sh}"'`. The final shell keeps the window open.
- The terminal comes from `org.gnome.desktop.default-applications.terminal`. If the configured binary is missing, the first available of these is used: xdg-terminal-exec, ptyxis, kgx, gnome-terminal, konsole, kitty, alacritty, foot, wezterm, xterm.
- If no terminal is available, the error notification “Could not open the result” is shown.

## Files

- `~` by itself lists the home directory. A trailing slash lists the whole directory.
- Hidden files appear only when the query starts with a dot.
- At most 500 directory entries are read asynchronously.
- Tab completes the path (directories get a trailing slash); Enter opens it in the default app.

## Shortcut capture in Preferences

Esc cancels, Backspace clears the shortcut, and pressing a modifier by itself waits for the next key. A letter without Super, Ctrl, or Alt is rejected (Shift alone only makes it uppercase). A function key by itself (F1 to F12) is accepted.
