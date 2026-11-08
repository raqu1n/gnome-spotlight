# GNOME Shell 50 integration

Verified against the installed gnome-shell 50.5 source (extracted from `/usr/lib64/gnome-shell/libshell-18.so` with `gresource extract`).

| Need | API used | Location |
| --- | --- | --- |
| Installed apps | `Shell.AppSystem.get_installed()`, `lookup_app(id).activate()`, `installed-changed` signal | `shellAppCatalog.ts` |
| Usage frequency | `Shell.AppUsage.get_most_used()` | `shellAppCatalog.ts` |
| Windows | `global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null)`, `Shell.WindowTracker`, `Main.activateWindow` | `shellWindowCatalog.ts` |
| System actions | `misc/systemActions.js` `getMatchingActions`, `getName`, `getIconName`, `activateAction` | `shellSystemActionCatalog.ts` |
| Directories | `Gio.File.enumerate_children_async` + `next_files_async` (promisified) | `gioDirectoryReader.ts` |
| Open URLs and files | `Gio.AppInfo.launch_default_for_uri` with `global.create_app_launch_context` | `shellLauncher.ts` |
| Clipboard | `St.Clipboard.get_default().set_text(CLIPBOARD, ...)` | `stClipboard.ts` |
| Run a command | `misc/util.js` `trySpawn` | `shellCommandRunner.ts` |
| Global shortcut | `Main.wm.addKeybinding` / `removeKeybinding` | `launcherSession.ts` |
| Modal window | `Main.pushModal(actor, {actionMode: SYSTEM_MODAL})`, actor in `Main.layoutManager.modalDialogGroup` | `launcherOverlay.ts` |
| Panel blur | Blur my Shell: `clipboard-dialog` class on the panel; detected through `global.blur_my_shell` | `launcherOverlay.ts`, `blurProvider.ts` |
| Scroll to a row | `misc/animationUtils.js` `ensureActorVisibleInScrollView` | `launcherOverlay.ts` |
| Light/dark CSS | The Shell loads `stylesheet-<variant>.css` before `stylesheet.css` (`extensionSystem.js`) | `scripts/build.ts` |
| Translation | `this.gettext` from the `Extension` instance | `extension.ts` |

## Notes

- The `gettext` exported by `extension.js` finds the extension from the call stack. This works with a bundle, but the extension passes `this.gettext` from its instance, which does not depend on that behavior.
- The window opens on the monitor containing the pointer (`Main.layoutManager.currentMonitor`), with its top at 25% of the screen height. `Layout.MonitorConstraint` attaches the backdrop to that monitor: `modalDialogGroup` uses `BinLayout` and ignores fixed child position and size. If the Overview is open, it is closed first.
- Shell 50 already has a “Do Not Disturb” toggle. It is unrelated to this extension but appears in the same sources consulted.
