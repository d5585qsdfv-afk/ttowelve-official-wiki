import type { Medicine, Rarity } from "@/types/wiki";
import { base } from "./shared";

const medicineRows: [string,string,string,string,string,Rarity,string][] = [
  ["m-01", "sun-drop", "陽だまり雫", "HPを小回復し、暗闇を解除する。", "光", "Common", "調合"],
  ["m-02", "frost-tonic", "霜脈トニック", "3ターンの間、水属性耐性を上げる。", "水", "Rare", "調合"],
  ["m-03", "quick-salt", "迅風塩", "次の行動順を早める。", "風", "Rare", "探索宝箱"],
  ["m-04", "night-amber", "夜琥珀薬", "戦闘不能をHP25%で解除する。", "闇", "Epic", "交換所"],
  ["m-05", "clear-vial", "澄明の小瓶", "弱体効果を1つ解除する。", "無", "Common", "商店"],
];
export const medicines: Medicine[] = medicineRows.map(([id, slug, name, effect, attribute, rarity, obtainMethod], index) => ({ ...base(id, slug, "medicine", name, "薬", effect, [attribute, "薬"]), rarity, obtainMethod, attribute, addedOrder: index + 1, effect }));
