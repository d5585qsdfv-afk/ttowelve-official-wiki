import type { Weapon } from "@/types/wiki";
import { base } from "./shared";

export const weapons = [
  { ...base("w-01", "dawn-edge", "weapon", "曙光の刃", "剣", "初撃で光印を付与する陽刻剣。", ["光", "初撃"]), rarity: "Rare", obtainMethod: "第一章探索", attribute: "光", weaponType: "陽刻剣", addedOrder: 1, power: 68 },
  { ...base("w-02", "ashen-vow", "weapon", "灰誓の長槍", "槍", "弱点攻撃時に防御を一時低下させる裂界槍。", ["火", "弱体"]), rarity: "Epic", obtainMethod: "強敵報酬", attribute: "火", weaponType: "裂界槍", addedOrder: 2, power: 84 },
  { ...base("w-03", "still-rain", "weapon", "静雨弓", "弓", "連続命中で残響印の持続を延ばす弓。", ["水", "連撃"]), rarity: "Rare", obtainMethod: "工房製作", attribute: "水", weaponType: "残響弓", addedOrder: 3, power: 61 },
  { ...base("w-04", "astral-loop", "weapon", "星環メルキア", "星", "属性切替後の支援効果を強める環星器。", ["星", "支援"]), rarity: "Legendary", obtainMethod: "章ボス報酬", attribute: "星", weaponType: "環星器", addedOrder: 4, power: 76 },
  { ...base("w-05", "black-anvil", "weapon", "黒鉄アンヴィル", "拳", "ガード直後の打撃を強化する鉄誓拳。", ["地", "反撃"]), rarity: "Common", obtainMethod: "商店", attribute: "地", weaponType: "鉄誓拳", addedOrder: 5, power: 72 },
] satisfies Weapon[];
