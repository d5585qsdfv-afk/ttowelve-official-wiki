import { articles } from "./articles";
import { cards } from "./cards";
import { emblems } from "./emblems";
import { enemies } from "./enemies";
import { jobs } from "./jobs";
import { medicines } from "./medicines";
import { weapons } from "./weapons";
import { weaponTypes } from "./weaponTypes";
import type { CategorySlug, EntityKind, WikiEntity } from "@/types/wiki";

export { articles, cards, emblems, enemies, jobs, medicines, weapons, weaponTypes };
export const allEntities: WikiEntity[] = [...weaponTypes, ...weapons, ...cards, ...medicines, ...jobs, ...emblems, ...enemies, ...articles];

export const categoryKinds: Record<CategorySlug, EntityKind[]> = {
  "weapon-types": ["weaponType"], items: ["weapon", "card", "medicine"], jobs: ["job"], emblems: ["emblem"], enemies: ["enemy"], other: ["article"],
};

export function getEntities(category: CategorySlug) { return allEntities.filter((entity) => categoryKinds[category].includes(entity.kind)); }
export function getEntity(category: CategorySlug, slug: string) { return getEntities(category).find((entity) => entity.slug === slug); }
