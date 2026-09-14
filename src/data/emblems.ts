import type { Emblem } from "@/types/wiki";
import { base } from "./shared";

export const emblems = [
  { ...base("e-01", "first-light", "emblem", "第一光条", "紋", "戦闘開始時に光印を1つ得る。", ["開幕", "光"]), effect: "戦闘開始時、装備者へ光印を1つ付与。", classification: "起動型", rarity: "Common" },
  { ...base("e-02", "backflow", "emblem", "逆流する時針", "紋", "行動順が遅いほど与ダメージが増える。", ["行動順", "攻撃"]), effect: "行動順が最後の場合、与ダメージ+12%。", classification: "条件型", rarity: "Rare" },
  { ...base("e-03", "quiet-camp", "emblem", "静かな野営", "紋", "戦闘終了時に味方全体を小回復する。", ["回復", "探索"]), effect: "戦闘終了時、味方全体のHPを5%回復。", classification: "継続型", rarity: "Rare" },
  { ...base("e-04", "broken-crown", "emblem", "砕けた王冠", "紋", "ボスへ与えるブレイク値を高める。", ["ボス", "ブレイク"]), effect: "ボスへのブレイク蓄積量+18%。", classification: "特攻型", rarity: "Epic" },
  { ...base("e-05", "twin-orbit", "emblem", "双環の記録", "紋", "異なる属性を連続使用すると支援効果が発生。", ["属性", "連携"]), effect: "異属性を連続使用時、味方全体の速度を上昇。", classification: "連携型", rarity: "Legendary" },
  { ...base("e-06", "last-spark", "emblem", "最後の火花", "紋", "瀕死時に一度だけ攻撃力が大きく上がる。", ["瀕死", "火"]), effect: "HP25%以下になった時、一度だけ攻撃力+30%。", classification: "危機型", rarity: "Epic" },
] satisfies Emblem[];
