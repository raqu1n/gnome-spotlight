/**
 * Exercita o callback registrado no Shell, sem precisar de uma sessão GNOME.
 * O grab da busca muda o modo do Shell para SYSTEM_MODAL; o atalho precisa continuar ativo.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type Gio from "gi://Gio";

import type { Translate } from "@i18n/translate";
import { SettingsKey } from "@infra/gnome/settingsKeys";

const ActionMode = { NORMAL: 1, OVERVIEW: 2, SYSTEM_MODAL: 4 };
const IGNORE_AUTOREPEAT = 1;
const MAIN_MODULE = "resource:///org/gnome/shell/ui/main.js";

let actionMode = ActionMode.NORMAL;
let binding: {
  name: string;
  settings: Gio.Settings;
  flags: number;
  modes: number;
  callback: () => void;
} | null = null;

const wm = {
  addKeybinding(
    name: string,
    settings: Gio.Settings,
    flags: number,
    modes: number,
    callback: () => void,
  ) {
    binding = { name, settings, flags, modes, callback };
  },
  removeKeybinding() {
    binding = null;
  },
};

const setActionMode = (mode: number) => {
  actionMode = mode;
  // Atualiza também o export vivo lido por LauncherSession no callback.
  void mock.module(MAIN_MODULE, () => ({ wm, actionMode }));
};

class FakeOverlay {
  static latest: FakeOverlay;
  isOpen = false;
  toggleCalls = 0;
  private previousMode = ActionMode.NORMAL;

  constructor() {
    FakeOverlay.latest = this;
  }

  attach() {}

  toggle() {
    this.toggleCalls += 1;
    if (this.isOpen) {
      this.isOpen = false;
      setActionMode(this.previousMode);
    } else {
      this.previousMode = actionMode;
      this.isOpen = true;
      setActionMode(ActionMode.SYSTEM_MODAL);
    }
  }

  destroy() {}
}

// Só as fronteiras GNOME são falsas; a sessão, factory, serviço e presenter são reais.
void mock.module("gi://GLib", () => ({ default: { get_home_dir: () => "/home/test" } }));
void mock.module("gi://Meta", () => ({ default: { KeyBindingFlags: { IGNORE_AUTOREPEAT } } }));
void mock.module("gi://Shell", () => ({ default: { ActionMode } }));
setActionMode(ActionMode.NORMAL);
void mock.module("@ui/launcherOverlay", () => ({ LauncherOverlay: FakeOverlay }));

for (const [module, name] of [
  ["gioDirectoryReader", "GioDirectoryReader"],
  ["shellAppCatalog", "ShellAppCatalog"],
  ["shellCommandRunner", "ShellCommandRunner"],
  ["shellLauncher", "ShellLauncher"],
  ["shellSystemActionCatalog", "ShellSystemActionCatalog"],
  ["shellWindowCatalog", "ShellWindowCatalog"],
  ["stClipboard", "StClipboard"],
] as const) {
  void mock.module(`@infra/gnome/${module}`, () => ({
    [name]: class {
      destroy() {}
    },
  }));
}

// Import indireto mantém os tipos globais do GJS fora do projeto de testes Bun/Node.
const sessionModule = "@app/launcherSession";
const { LauncherSession } = (await import(sessionModule)) as {
  LauncherSession: new (
    settings: Gio.Settings,
    translate: Translate,
  ) => { start(): void; stop(): void };
};

const pressShortcut = () => {
  if (!binding) throw new Error("O atalho não foi registrado");
  // O Shell só entrega o atalho nos modos registrados.
  if (binding.modes & actionMode) binding.callback();
};

describe("LauncherSession shortcut", () => {
  const settings = {} as Gio.Settings;
  let session: InstanceType<typeof LauncherSession>;

  beforeEach(() => {
    binding = null;
    setActionMode(ActionMode.NORMAL);
    session = new LauncherSession(settings, (message) => message);
    session.start();
  });

  afterEach(() => {
    session.stop();
  });

  test("registra o atalho nos modos normal, overview e modal, ignorando autorepeat", () => {
    expect(binding).toEqual({
      name: SettingsKey.TOGGLE_LAUNCHER,
      settings,
      flags: IGNORE_AUTOREPEAT,
      modes: ActionMode.NORMAL | ActionMode.OVERVIEW | ActionMode.SYSTEM_MODAL,
      callback: expect.any(Function),
    });
  });

  test.each([
    ["normal", ActionMode.NORMAL],
    ["overview", ActionMode.OVERVIEW],
  ])("atalho em %s abre, fecha no modo modal e permite reabrir", (_name, mode) => {
    setActionMode(mode);
    const overlay = FakeOverlay.latest;

    pressShortcut();
    expect(overlay.isOpen).toBe(true);
    expect(actionMode).toBe(ActionMode.SYSTEM_MODAL);
    expect(overlay.toggleCalls).toBe(1);

    pressShortcut();
    expect(overlay.isOpen).toBe(false);
    expect(overlay.toggleCalls).toBe(2);

    pressShortcut();
    expect(overlay.isOpen).toBe(true);
    expect(overlay.toggleCalls).toBe(3);
  });

  test("atalho não abre a busca sobre outro modal do sistema", () => {
    setActionMode(ActionMode.SYSTEM_MODAL);
    const overlay = FakeOverlay.latest;

    pressShortcut();
    pressShortcut();

    expect(overlay.isOpen).toBe(false);
    expect(overlay.toggleCalls).toBe(0);
    expect(actionMode).toBe(ActionMode.SYSTEM_MODAL);

    setActionMode(ActionMode.NORMAL);
    pressShortcut();
    expect(overlay.isOpen).toBe(true);
    expect(overlay.toggleCalls).toBe(1);
  });
});
