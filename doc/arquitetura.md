# Architecture

## Search flow

1. `LauncherOverlay` (St) receives the query text and calls `LauncherPresenter.onQueryChanged`.
2. The presenter requests a token from `LatestRequestGate` and calls `SearchService.search`.
3. The service reads the mode with `parseQuery` (prefix), filters providers for that mode, and queries them in parallel with `Promise.allSettled`.
4. It combines the results, keeps the highest-scoring result when two share an `id`, sorts by score and then title, and applies the preferences limit.
5. If the token is still the newest, the presenter tells the view to render. Late responses (such as a slow directory) are discarded.
6. On Enter or click, the presenter closes the window before calling `result.activate()`. Closing first restores focus to other windows; otherwise the newly opened app appears behind the launcher.

## Layers

| Directory | Role | May import `gi://` values? |
| --- | --- | --- |
| `src/domain` | Pure rules: text matching, calculator, paths, terminal, shortcut | No |
| `src/service` | `SearchService` | No |
| `src/provider` | One strategy per result source, plus the factory | No |
| `src/ui/launcherPresenter.ts` | Interaction (arrows, Enter, Tab, Esc) | No |
| `src/ui` (rest) | St view | Yes |
| `src/infra/gnome` | Port adapters (`AppCatalog`, `WindowCatalog`...) | Yes |
| `src/app` | `LauncherSession`, the composition root | Yes |
| `src/prefs` | Shortcut capture row (GTK 4) | Yes |

Ports live in `src/domain/*/…Ports.ts`. Each Shell adapter implements one. Tests use fake ports in `test/support/fakes.ts`.

## Lifecycle

`enable()` creates a `LauncherSession` and calls `start()`, which registers the shortcut with `Main.wm.addKeybinding`. Mutter reloads the key automatically when the shortcut changes in Preferences. `disable()` calls `stop()`, which removes the shortcut, destroys the view, and disconnects the `AppSystem` signal.

The extension does not change system shortcuts. The default is Super+Alt+Space, which GNOME does not use; Super+Space remains “switch to the next input source.”

## Decisions

- The presenter is separate from the view so interactions can be tested without St. The view only translates events into calls (key mapping in `KEY_ACTIONS`).
- System actions use the Shell's `misc/systemActions.js`. It knows what is currently available and matches translated keywords, so the extension does not maintain its own list.
