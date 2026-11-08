/**
 * Generates `po/launchpad-search.pot` from messages marked in the code. After running it,
 * update `pt_BR.po` (the catalog test reports missing and obsolete entries).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildPotFile, extractMessagesFromSources } from "@scripts/i18n/messageCatalog";

const ROOT = join(import.meta.dir, "..");
const DOMAIN = "launchpad-search";

writeFileSync(
  join(ROOT, "po", `${DOMAIN}.pot`),
  buildPotFile(extractMessagesFromSources(join(ROOT, "src")), DOMAIN),
);
