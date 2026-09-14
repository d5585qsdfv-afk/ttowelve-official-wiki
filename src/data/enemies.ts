import type { Enemy } from "@/types/wiki";
import { base } from "./shared";

const enemyRows = [
  { ...base("n-01", "mossling", "enemy", "苔むす仔獣", "獣", "湿地に群れる小型の魔獣。", ["通常敵", "湿地"]), classification: "通常敵", attribute: "地", location: "薄明湿原", weakness: ["火"], attacks: [{ name: "苔散らし", telegraph: "体を大きく震わせる", response: "ガードで毒胞子を防ぐ" }], strategy: ["群れを範囲攻撃で処理する"], drops: ["湿苔", "小さな牙"] },
  { ...base("n-02", "glass-wing", "enemy", "硝子羽虫", "虫", "光を反射して狙いを乱す飛行敵。", ["通常敵", "飛行"]), classification: "通常敵", attribute: "光", location: "鏡砂丘", weakness: ["風"], attacks: [{ name: "乱反射", telegraph: "羽が白く明滅", response: "明滅後に回避する" }], strategy: ["残響弓で飛行を崩す"], drops: ["硝子翅"] },
  { ...base("n-03", "ember-hound", "enemy", "熾火猟犬", "犬", "熱を蓄えながら獲物へ突進する強敵。", ["強敵", "火"]), classification: "強敵", attribute: "火", location: "赤鉄街道", weakness: ["水", "ブレイク"], attacks: [{ name: "焦熱突進", telegraph: "地面へ爪を立てる", response: "横方向へ回避して背後を取る" }], strategy: ["蓄熱が3になる前にブレイクする"], drops: ["熾火核", "赤鉄皮"] },
  { ...base("n-04", "hollow-knight", "enemy", "虚殻騎士", "騎", "攻撃を受けるほど鎧が硬化する守護者。", ["強敵", "鎧"]), classification: "強敵", attribute: "闇", location: "忘却回廊", weakness: ["光", "打撃"], attacks: [{ name: "返し刃", telegraph: "盾を胸元に寄せる", response: "攻撃を止め、構え解除を待つ" }], strategy: ["連撃を避けて大技を差し込む"], drops: ["虚殻片"] },
  { ...base("n-05", "clockwork-regent", "enemy", "刻律の執政機", "機", "戦場の行動順を支配する大型機兵。", ["ボス", "機械"]), classification: "ボス", attribute: "雷", location: "第零鐘楼", weakness: ["地", "時針破壊"], attacks: [{ name: "逆刻命令", telegraph: "頭上の針が反時計回りに回る", response: "先行行動を控え、障壁を準備" }, { name: "十二連鐘", telegraph: "盤面に12個の光点", response: "安全な欠番へ移動" }], strategy: ["左右の時針を先に破壊", "逆刻中は回復を優先"], drops: ["刻律歯車", "執政核"] },
  { ...base("n-06", "pale-wyrm", "enemy", "白環竜ネヴァ", "竜", "霧と氷をまとい環状の嵐を生む章ボス。", ["ボス", "竜"]), classification: "ボス", attribute: "氷", location: "白環天蓋", weakness: ["火", "翼膜"], attacks: [{ name: "白環嵐", telegraph: "外周から霧が閉じる", response: "中央の風陰へ集合" }, { name: "凍尾薙ぎ", telegraph: "尾が青白く発光", response: "竜の前方へ回避" }], strategy: ["翼膜破壊後に火属性で集中攻撃"], drops: ["白環鱗", "凍天結晶"] },
] satisfies Omit<Enemy, "image" | "imageAlt">[];

export const enemies: Enemy[] = enemyRows.map((enemy) => ({
  ...enemy,
  image: "/enemy-placeholder.svg",
  imageAlt: `${enemy.name}の画像準備中を示す抽象プレースホルダー`,
}));
