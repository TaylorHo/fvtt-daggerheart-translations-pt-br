// Adds keys present in lang/en.json but missing in lang/pt-BR.json (with empty values).
// Existing translations are kept; output follows en.json key order.
import { readFileSync, writeFileSync } from "node:fs";

const read = (f) =>
  JSON.parse(readFileSync(new URL(`../lang/${f}`, import.meta.url), "utf8"));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
let added = 0;

const merge = (src, dst = {}) =>
  Object.fromEntries(
    Object.entries(src).map(([k, v]) => {
      if (isObj(v)) return [k, merge(v, isObj(dst[k]) ? dst[k] : {})];
      if (k in dst) return [k, dst[k]];
      added++;
      return [k, ""];
    }),
  );

const out = merge(read("en.json"), read("pt-BR.json"));
writeFileSync(
  new URL("../lang/pt-BR.json", import.meta.url),
  JSON.stringify(out, null, 4) + "\n",
);
console.log(`Added ${added} untranslated keys.`);
if (added > 0) {
  console.log("Remember to fill the empty values in the translations file.");
}
