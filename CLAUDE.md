# launchpad-search (gnome-spotlight repository)

GNOME Shell 50 and 51 extension written in TypeScript 7, published on extensions.gnome.org as “Launchpad Search.” Read `doc/` before making changes: it contains the architecture, search rules, and Shell pitfalls.

The store name appears only in `metadata.json`, the schema ID, the translation domain, and the log prefix. Classes, files, and CSS classes use the generic `Launcher`/`launcher-` name.

## Repository rules

- Layers: `domain/` (pure), `service/` (orchestration), `provider/` (search strategies), `infra/gnome/` (the only layer that talks to `gi://` and the Shell), `ui/` (pure presenter and St view), `app/` (composition root), `prefs/` (GTK 4). The domain, service, providers, and presenter NEVER import values from `gi://` or `resource://`, only `import type`. This keeps `bun test` runnable without GNOME.
- Always import through aliases (`@domain/*`, `@service/*`, etc.). The aliases are defined in both `tsconfig.base.json` AND `bunfig.toml`. The build transpiles every module reachable from `extension.ts` and `prefs.ts` to a `.js` file in `dist/`, replaces aliases with relative paths (`scripts/build/moduleTranspiler.ts`, aliases read from `tsconfig.base.json`), and formats with oxfmt. Do not bundle everything into one file: extensions.gnome.org reviewers read `dist/`.
- `src/` contains no comments (the `sourceComments` test rejects them). Keep the reasoning behind decisions in `doc/` and the pitfalls below. extensions.gnome.org reviewers reject code that looks AI-generated.
- The extension does not change another schema's settings (for example, system shortcuts). The default shortcut is Super+Alt+Space to avoid conflicting with “switch to the next input source.”
- A new search source means a new class in `src/provider/` and one line in `searchProviderFactory.ts`. Do not add type-based `if` statements to the service.
- On-screen text in the code is English and marked with `t("...")` (domain) or `_("...")` (UI and preferences), always with double quotes and literal text. The `messageCatalog` test rejects messages missing from `po/pt_BR.po`, orphan translations, and em dashes.
- CSS belongs in the template in `src/style/stylesheet.ts`; light and dark themes come from the same template.
- Release gate: `bun run format:check && bun run lint && bun run typecheck && bun test`.
- Packaging: `bun run pack` creates the zip without `gschemas.compiled` (the Shell compiles it during installation).

## Pitfalls that have already cost time

- Typechecking spans three projects (`tsconfig.json` for src, `test/tsconfig.json`, `scripts/tsconfig.json`). `@types/bun` declares Node's `global`, which conflicts with the Shell's `global`. Also, tsgolint uses the nearest `tsconfig.json` for each file, so each directory has its own.
- `@girs/gnome-shell` 50.0.4 does not declare `Util.trySpawn` or the public `SystemActions` methods. Adapters use a minimal contract with a cast at the boundary.
- `Gio.DesktopAppInfo` is now `GioUnix.DesktopAppInfo`.
- In Shell 50, `Main.pushModal` no longer returns grab state (`Clutter.GrabState` was removed).
- Changes appear in the real Shell only after logging out and back in (Wayland).
- Shortcut capture in Preferences must request `inhibit_system_shortcuts` from the window. Otherwise, the Shell consumes every global shortcut (including the search shortcut itself) before the Preferences window receives the key.
- Panel position is explicit (`AlignConstraint` on X, calculated `y`). With `BinLayout` and `y_align: START`, Shell 50 centered the panel and moved it below the middle of the screen.
- `modalDialogGroup` uses `BinLayout`: `set_position` and `set_size` on the search backdrop have no effect, and the group covers every monitor (the panel landed across the seam between two). `Layout.MonitorConstraint`, as used by `ModalDialog`, attaches the backdrop to the pointer's monitor.
- Blur comes from Blur my Shell. Its popup component watches `modalDialogGroup` and blurs actors with a dialog class, including rounded corners. The panel uses `clipboard-dialog` (the GNOME theme does not style this class). Without Blur my Shell the panel is solid (`resolvePanelSurface`). The panel's 18px radius must match its `dialog-corner-radius`. A custom `Shell.BlurEffect` was tried and discarded: it has no corner radius, leaving square corners, and blurring the entire screen is not the desired effect.
- The theme's rule WINS over the extension stylesheet when both set the same property (the `StEntry:focus` ring remained even with `!important` in ours). To change a property already set by the theme on a native actor, use inline styling (`style:` / `set_style`), which St applies last.

## Intentional duplication

`scripts/build.ts`, `scripts/pack.ts`, `scripts/build/moduleTranspiler.ts` (and its test), the `sourceComments` test, `scripts/i18n/messageCatalog.ts`, `scripts/install.ts`, the oxlint/oxfmt configs, and `src/types/*.d.ts` are identical in the `quick-settings-notifications` repository. If you change one, make the same change there in the same task.
