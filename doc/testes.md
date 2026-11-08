# Tests

## Unit tests

`bun test` covers the domain, services, providers, factory, presenter, CSS, and translation catalog. Everything runs without GNOME, using fake ports (`test/support/fakes.ts`). New test files should follow `<subject>.unit.test.ts`.

## Real Shell, without changing the session

You can start an isolated gnome-shell instance and check that the extension activates without errors:

```bash
export XDG_DATA_HOME=$(mktemp -d) XDG_CONFIG_HOME=$(mktemp -d) XDG_CACHE_HOME=$(mktemp -d)
export XDG_RUNTIME_DIR=/tmp/gsrt GSETTINGS_BACKEND=memory   # short path, see below
mkdir -p $XDG_RUNTIME_DIR $XDG_DATA_HOME/gnome-shell/extensions && chmod 700 $XDG_RUNTIME_DIR
cp -r dist $XDG_DATA_HOME/gnome-shell/extensions/launchpad-search@mateusseiboth.github.io
dbus-run-session -- sh -c 'gnome-shell --headless --wayland --no-x11 --virtual-monitor 1600x1000 & \
  gdbus wait --session --timeout 40 org.gnome.Shell; \
  gnome-extensions enable launchpad-search@mateusseiboth.github.io; \
  gnome-extensions info launchpad-search@mateusseiboth.github.io; wait'
```

- `GSETTINGS_BACKEND=memory` prevents the test Shell from writing to the real session's dconf.
- The Wayland socket (`$XDG_RUNTIME_DIR/wayland-0`) has a path limit of 108 bytes. Mutter aborts with “Failed to create socket” if `XDG_RUNTIME_DIR` is too long.
- To open Preferences in this Shell, run `dbus-update-activation-environment WAYLAND_DISPLAY=wayland-0 ...`, then `gnome-extensions prefs <uuid>`. Only one Preferences window can be open at a time.
- Screenshots and D-Bus `Eval` require `unsafe_mode`, which is not enabled. Visual checks are done in the real session after logging out and back in.

Result on 2026-10-12: state `ACTIVE`, three disable/enable cycles without log errors, and Preferences opened without JavaScript errors.
