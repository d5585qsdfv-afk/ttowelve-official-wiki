import { GameSelector } from "@/components/GameSelector";

export default function HomePage() {
  return <main id="main-content" className="home-main"><p className="kicker">TTowelve Official Game Wiki</p><h1 className="display-title">GAME<br/>DATABASE</h1><p className="lead">攻略するゲームを選択。公式資料と攻略情報を、プレイ中でも素早く引ける形で整理します。</p><GameSelector/><p className="result-count">※ 現在の図鑑・攻略データはUI確認用の架空サンプルです。</p></main>;
}
