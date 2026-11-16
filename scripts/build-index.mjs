// Builds lang/packs/index.json: { <pack>: { <_id>: { f: <relative file>, n: <name> } } }
// Pack name = last directory of the file path. Run after translating (make index).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const root = new URL("../lang/packs/", import.meta.url).pathname;
const index = {};

for (const rel of readdirSync(root, { recursive: true })) {
  if (!rel.endsWith(".json") || rel === "index.json") continue;
  const { _id, name } = JSON.parse(readFileSync(join(root, rel), "utf8"));
  const pack = basename(dirname(rel));
  (index[pack] ??= {})[_id] = { f: rel, n: name };
}

writeFileSync(join(root, "index.json"), JSON.stringify(index));
console.log(`Indexed ${Object.values(index).reduce((n, p) => n + Object.keys(p).length, 0)} documents`);
