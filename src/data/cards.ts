import type { Card, Rarity } from "@/types/wiki";
import { base } from "./shared";

const cardRows: [string,string,string,string,string,Rarity,string][] = [
  ["c-01", "scarlet-memory", "緋色の残像", "攻撃後、同じ対象へ小威力の追撃を行う。", "火", "Rare", "探索宝箱"],
  ["c-02", "blue-bulwark", "蒼壁の誓い", "味方全体へ1回分の軽減障壁を付与する。", "水", "Epic", "交換所"],
  ["c-03", "silent-step", "無音の歩法", "次の行動まで回避率と行動速度を上げる。", "風", "Common", "初期所持"],
  ["c-04", "star-ledger", "星読みの帳", "現在の属性軌道に応じて追加効果を得る。", "星", "Legendary", "章ボス報酬"],
  ["c-05", "iron-return", "鉄火の返礼", "ガード成功時、攻撃者へ反撃する。", "地", "Rare", "工房製作"],
];
export const cards: Card[] = cardRows.map(([id, slug, name, effect, attribute, rarity, obtainMethod], index) => ({ ...base(id, slug, "card", name, "札", effect, [attribute, "カード"]), rarity, obtainMethod, attribute, addedOrder: index + 1, effect }));
