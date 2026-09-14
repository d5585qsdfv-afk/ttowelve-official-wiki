import type { Job } from "@/types/wiki";
import { base } from "./shared";

export const jobs = [
  { ...base("j-01", "flare-warden", "job", "暁衛士", "衛", "前線で攻撃を受け止め、光印で味方を守る防御役。", ["防御", "光"]), role: "タンク", recommendedWeapons: ["陽刻剣", "鉄誓拳"], features: ["味方への攻撃を肩代わり", "ガードから反撃へ展開"], skills: ["曙の城壁", "誓護反転"] },
  { ...base("j-02", "rift-runner", "job", "裂走士", "走", "間合いを操作し、直線攻撃を連鎖させる攻撃役。", ["攻撃", "刺突"]), role: "アタッカー", recommendedWeapons: ["裂界槍"], features: ["位置取りで威力上昇", "複数敵へ貫通"] },
  { ...base("j-03", "echo-hunter", "job", "響狩人", "狩", "残響印を管理して安全圏から追撃する射撃役。", ["射撃", "追撃"]), role: "アタッカー", recommendedWeapons: ["残響弓"], features: ["遠距離維持", "印の消費で追撃"] },
  { ...base("j-04", "orbit-reader", "job", "環読師", "読", "属性軌道を読み替え、味方の行動を支える術師。", ["支援", "術式"]), role: "サポーター", recommendedWeapons: ["環星器", "霧詠扇"], features: ["属性相性の補助", "行動順の調整"] },
  { ...base("j-05", "mist-mender", "job", "霧療師", "療", "霧の結界で継続回復と状態異常対策を行う回復役。", ["回復", "霧"]), role: "ヒーラー", recommendedWeapons: ["霧詠扇"], features: ["継続回復", "状態異常解除"] },
  { ...base("j-06", "iron-duelist", "job", "鉄誓闘士", "闘", "敵の予兆を受け、強烈なカウンターを返す近接役。", ["反撃", "打撃"]), role: "ブレイカー", recommendedWeapons: ["鉄誓拳"], features: ["予兆への割り込み", "防御力破壊"] },
] satisfies Job[];
