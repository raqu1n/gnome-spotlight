/**
 * Installs `dist/` in ~/.local/share/gnome-shell/extensions/<uuid>. On Wayland, the Shell only
 * loads a new extension (or updated code) after logging out and back in.
 */
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

if (!existsSync(join(DIST, "metadata.json"))) throw new Error("Rode `bun run build` antes.");

const { uuid } = JSON.parse(readFileSync(join(DIST, "metadata.json"), "utf8")) as { uuid: string };
const target = join(
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
  "gnome-shell/extensions",
  uuid,
);

rmSync(target, { recursive: true, force: true });
cpSync(DIST, target, { recursive: true });
console.log(`Instalada em ${target}`);
