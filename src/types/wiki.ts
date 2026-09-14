export type GameSlug = "juno" | "soleil" | "idlet";
export type EntityKind = "weaponType" | "weapon" | "card" | "medicine" | "job" | "emblem" | "enemy" | "article";
export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
export type EnemyClass = "通常敵" | "強敵" | "ボス";

export interface BaseEntity {
  id: string;
  slug: string;
  gameSlug: GameSlug;
  kind: EntityKind;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  gameVersion: string;
  createdAt: string;
  updatedAt: string;
  isFictional: true;
}

export interface WeaponType extends BaseEntity {
  kind: "weaponType";
  recommendedRange: "近距離" | "中距離" | "遠距離" | "全距離";
  traits: string[];
}

export interface ItemBase extends BaseEntity {
  rarity: Rarity;
  obtainMethod: string;
  attribute: string;
  weaponType?: string;
  addedOrder: number;
}
export interface Weapon extends ItemBase { kind: "weapon"; power: number; }
export interface Card extends ItemBase { kind: "card"; effect: string; }
export interface Medicine extends ItemBase { kind: "medicine"; effect: string; }

export interface Job extends BaseEntity {
  kind: "job";
  role: string;
  recommendedWeapons: string[];
  features: string[];
  skills?: string[];
}

export interface Emblem extends BaseEntity {
  kind: "emblem";
  effect: string;
  classification: string;
  rarity: Rarity;
}

export interface EnemyAttack { name: string; telegraph: string; response: string; }
export interface Enemy extends BaseEntity {
  kind: "enemy";
  image: string;
  imageAlt: string;
  classification: EnemyClass;
  attribute: string;
  location: string;
  weakness: string[];
  attacks: EnemyAttack[];
  strategy: string[];
  drops: string[];
}

export interface ArticleSection { heading: string; body: string; tone?: "default" | "note" | "warning"; }
export interface Article extends BaseEntity {
  kind: "article";
  title: string;
  summary: string;
  category: string;
  content: ArticleSection[];
}

export type WikiEntity = WeaponType | Weapon | Card | Medicine | Job | Emblem | Enemy | Article;
export type CategorySlug = "weapon-types" | "items" | "jobs" | "emblems" | "enemies" | "other";
