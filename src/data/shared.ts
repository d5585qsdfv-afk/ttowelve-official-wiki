import type { BaseEntity, EntityKind } from "@/types/wiki";

export const RELEASE = "0.9.0-demo";
export const CREATED = "2026-08-01";
export const UPDATED = "2026-09-13";

export function base<K extends EntityKind>(id: string, slug: string, kind: K, name: string, icon: string, description: string, tags: string[]): BaseEntity & { kind: K; gameSlug: "juno" } {
  return { id, slug, gameSlug: "juno", kind, name, icon, description, tags, gameVersion: RELEASE, createdAt: CREATED, updatedAt: UPDATED, isFictional: true };
}
