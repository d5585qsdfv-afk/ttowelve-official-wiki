import { existsSync, readFileSync } from "node:fs";

const phases = [
  ["Phase 1", ["next.config.ts","tsconfig.json","src/types/wiki.ts","src/app/layout.tsx","src/app/page.tsx"]],
  ["Phase 2", ["src/components/WikiShell.tsx","src/components/WikiSidebar.tsx","src/components/MobileNavigation.tsx","src/components/CategoryCard.tsx"]],
  ["Phase 3", ["src/data/weaponTypes.ts","src/data/weapons.ts","src/data/cards.ts","src/data/medicines.ts","src/data/jobs.ts","src/data/emblems.ts","src/data/enemies.ts","src/data/articles.ts","src/components/EntityDetail.tsx"]],
  ["Phase 4", ["src/lib/search.ts","src/components/GlobalSearch.tsx","src/components/FilterBar.tsx","src/components/SortControl.tsx","src/components/CatalogExplorer.tsx"]],
  ["Phase 5", ["src/app/globals.css","src/app/not-found.tsx","public/favicon.svg"]],
];
for (const [phase,files] of phases) {
  const missing=files.filter((file)=>!existsSync(file));
  if(missing.length) throw new Error(`${phase}: missing ${missing.join(", ")}`);
  console.log(`${phase}: required architecture present (${files.length} files)`);
}
const css=readFileSync("src/app/globals.css","utf8");
for(const marker of ["@media (max-width:900px)","@media (max-width:700px)",":focus-visible","prefers-reduced-motion"]){if(!css.includes(marker))throw new Error(`Phase 5: missing ${marker}`);}
