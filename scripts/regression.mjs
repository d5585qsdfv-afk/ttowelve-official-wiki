import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defaultEntries } from "../src/data.js";

const root = resolve(".");
const out = resolve(root, "out");
const required = ["index.html", "_routes.json", "favicon.svg", "_headers"];
const missing = required.filter((file) => !existsSync(resolve(out, file)));
if (missing.length) throw new Error(`Missing Pages output:\n${missing.join("\n")}`);

const html = readFileSync(resolve(out, "index.html"), "utf8");
for (const marker of ["TTOWELVE CINEMA", "countAll", "window.__INITIAL_ENTRIES__", 'src="/app.js"']) {
  if (!html.includes(marker)) throw new Error(`Missing Worker UI marker: ${marker}`);
}
for (const legacyMarker of ["portal-nav", "context.next()", "高度なWiki管理"]) {
  if (html.includes(legacyMarker)) throw new Error(`Legacy portal leaked into current Pages output: ${legacyMarker}`);
}
const routes = JSON.parse(readFileSync(resolve(out, "_routes.json"), "utf8"));
if (!routes.include?.includes("/*") || routes.exclude?.length) throw new Error("Pages Functions route configuration is incomplete");
if (defaultEntries.length !== 807) throw new Error(`Catalog count changed unexpectedly: ${defaultEntries.length}`);
if (!existsSync(resolve(root, "dist/server/index.js"))) throw new Error("Worker build output is missing");
console.log(`Regression structure passed: Worker UI, Pages route configuration, ${defaultEntries.length} catalog entries, and legacy portal exclusion.`);
