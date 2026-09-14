import type { WeaponType } from "@/types/wiki";
import { base } from "./shared";

export const weaponTypes = [
  { ...base("wt-01", "sunblade", "weaponType", "陽刻剣", "剣", "刻印を重ねて瞬間火力を伸ばす標準的な片手剣。", ["斬撃", "初心者向け"]), recommendedRange: "近距離", traits: ["扱いやすい", "刻印連携"] },
  { ...base("wt-02", "rift-lance", "weaponType", "裂界槍", "槍", "間合いを保ち、直線上の敵をまとめて貫く長柄武器。", ["刺突", "範囲"]), recommendedRange: "中距離", traits: ["長い射程", "直線攻撃"] },
  { ...base("wt-03", "echo-bow", "weaponType", "残響弓", "弓", "標的へ残響印を付け、追撃を誘発する射撃武器。", ["射撃", "追撃"]), recommendedRange: "遠距離", traits: ["安全距離", "印管理"] },
  { ...base("wt-04", "orbit-orb", "weaponType", "環星器", "星", "属性軌道を切り替えながら支援と攻撃を両立する法具。", ["術式", "支援"]), recommendedRange: "全距離", traits: ["属性切替", "味方支援"] },
  { ...base("wt-05", "iron-gauntlet", "weaponType", "鉄誓拳", "拳", "防御成功を反撃へ変換する重量級の拳具。", ["打撃", "カウンター"]), recommendedRange: "近距離", traits: ["高耐久", "反撃"] },
  { ...base("wt-06", "mist-fan", "weaponType", "霧詠扇", "扇", "霧を展開し、敵の命中と行動順を乱す戦扇。", ["妨害", "術式"]), recommendedRange: "中距離", traits: ["行動阻害", "範囲支援"] },
] satisfies WeaponType[];
