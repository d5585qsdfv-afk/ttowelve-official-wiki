import type { CategorySlug, EntityKind, WikiEntity } from "@/types/wiki";

export const categories: { slug: CategorySlug; label: string; shortLabel: string; icon: string; description: string }[] = [
  { slug:"weapon-types", label:"武器種図鑑", shortLabel:"武器種", icon:"剣", description:"得意距離と戦い方から武器種を比較" },
  { slug:"items", label:"武器・カード・薬図鑑", shortLabel:"装備", icon:"具", description:"装備・カード・消耗品を横断して検索" },
  { slug:"jobs", label:"ジョブ図鑑", shortLabel:"ジョブ", icon:"職", description:"役割と得意武器から編成を検討" },
  { slug:"emblems", label:"紋章図鑑", shortLabel:"紋章", icon:"紋", description:"重要な装備効果と分類を一覧化" },
  { slug:"enemies", label:"敵図鑑・攻略情報", shortLabel:"敵", icon:"敵", description:"弱点・予兆・対処・ドロップを確認" },
  { slug:"other", label:"その他情報", shortLabel:"記事", icon:"文", description:"システム・用語・Tips・FAQ" },
];

export const categorySet = new Set(categories.map((item) => item.slug));
export function isCategorySlug(value: string): value is CategorySlug { return categorySet.has(value as CategorySlug); }
export function getCategory(slug: CategorySlug) { return categories.find((item) => item.slug === slug)!; }

export const kindLabels: Record<EntityKind,string> = { weaponType:"武器種", weapon:"武器", card:"カード", medicine:"薬", job:"ジョブ", emblem:"紋章", enemy:"敵", article:"その他記事" };
export function entityHref(entity: WikiEntity) {
  const category: CategorySlug = entity.kind === "weaponType" ? "weapon-types" : ["weapon","card","medicine"].includes(entity.kind) ? "items" : entity.kind === "job" ? "jobs" : entity.kind === "emblem" ? "emblems" : entity.kind === "enemy" ? "enemies" : "other";
  return `/games/${entity.gameSlug}/${category}/${entity.slug}`;
}
