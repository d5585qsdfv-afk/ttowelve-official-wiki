import type { Article } from "@/types/wiki";
import { base } from "./shared";

export const articles = [
  { ...base("a-01", "battle-basics", "article", "戦闘の基本", "文", "行動順・距離・ブレイクの基礎。", ["初心者", "戦闘"]), title: "戦闘の基本", summary: "最初に覚えたい3つの戦闘ルール。", category: "ゲームシステム", content: [{ heading: "行動順", body: "速度と選択した行動によって次の手番が決まります。" }, { heading: "距離", body: "武器の得意距離を保つと命中と威力が安定します。", tone: "note" }] },
  { ...base("a-02", "starter-route", "article", "序盤の進め方", "文", "第一章を迷わず進めるための確認表。", ["初心者", "進行"]), title: "序盤の進め方", summary: "装備更新と探索の優先順位。", category: "初心者向け", content: [{ heading: "最初の目標", body: "工房を解放し、武器種ごとの基本装備を揃えます。" }] },
  { ...base("a-03", "status-glossary", "article", "状態変化用語集", "文", "強化・弱体・特殊状態の用語一覧。", ["用語集", "状態変化"]), title: "状態変化用語集", summary: "戦闘ログで使われる状態名を確認できます。", category: "用語集", content: [{ heading: "強化と弱体", body: "同系統の効果は最も高い値が適用されます。" }] },
  { ...base("a-04", "break-guide", "article", "ブレイク活用術", "文", "強敵の大技を止めるブレイクの考え方。", ["Tips", "ブレイク"]), title: "ブレイク活用術", summary: "蓄積と発動タイミングの実践Tips。", category: "Tips", content: [{ heading: "蓄積を温存する", body: "予兆前にブレイクさせず、危険な攻撃へ合わせます。", tone: "warning" }] },
  { ...base("a-05", "save-spec", "article", "セーブ仕様", "文", "オートセーブと手動記録の基本仕様。", ["基本仕様", "セーブ"]), title: "セーブ仕様", summary: "記録タイミングと注意点。", category: "基本仕様", content: [{ heading: "オートセーブ", body: "エリア移動と戦闘終了時に自動記録されます。" }] },
  { ...base("a-06", "faq-demo", "article", "よくある質問", "文", "体験版で寄せられた想定質問。", ["FAQ", "設定"]), title: "よくある質問", summary: "設定・操作に関する短い回答集。", category: "FAQ", content: [{ heading: "文字サイズは変えられますか", body: "設定のアクセシビリティ項目から3段階で変更できます。" }] },
] satisfies Article[];
