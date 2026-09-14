import type { WikiEntity } from "@/types/wiki";

export function normalizeQuery(value: string) { return value.normalize("NFKC").toLocaleLowerCase("ja").trim(); }
export function searchEntities(entities: WikiEntity[], rawQuery: string) {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];
  return entities.filter((entity) => normalizeQuery([entity.name, entity.description, ...entity.tags].join(" ")).includes(query));
}
