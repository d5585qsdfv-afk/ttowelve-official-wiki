import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const out = resolve("out");
const expected = [
  "index.html", "404.html", "games/juno/index.html", "games/soleil/index.html", "games/idlet/index.html",
  "games/juno/weapon-types/index.html", "games/juno/items/index.html", "games/juno/jobs/index.html",
  "games/juno/emblems/index.html", "games/juno/enemies/index.html", "games/juno/other/index.html",
  "games/juno/weapon-types/sunblade/index.html", "games/juno/items/dawn-edge/index.html",
  "games/juno/jobs/flare-warden/index.html", "games/juno/emblems/first-light/index.html",
  "games/juno/enemies/clockwork-regent/index.html", "games/juno/other/battle-basics/index.html",
];
const missing = expected.filter((file) => !existsSync(join(out, file)));
if (missing.length) throw new Error(`Missing routes:\n${missing.join("\n")}`);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const htmlFiles = walk(out).filter((file) => file.endsWith(".html"));
const broken = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const [, href] of html.matchAll(/href="([^"#?]+)"/g)) {
    if (!href.startsWith("/") || href.startsWith("/_next/")) continue;
    const target = href === "/" ? join(out, "index.html") : join(out, href, "index.html");
    const direct = join(out, href);
    if (!existsSync(target) && !existsSync(direct)) broken.push(`${file} -> ${href}`);
  }
}
if (broken.length) throw new Error(`Broken internal links:\n${broken.slice(0,20).join("\n")}`);

const combined = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");
for (const marker of ["架空データ", "COMING SOON", "Wikiを横断検索", "ページが見つかりません"]) {
  if (!combined.includes(marker)) throw new Error(`Missing rendered marker: ${marker}`);
}
console.log(`Regression structure passed: ${htmlFiles.length} HTML files, ${expected.length} representative routes, 0 broken internal links.`);
