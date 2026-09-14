import Link from "next/link";
import type { GameInfo } from "@/data/games";
export function ComingSoon({game}:{game:GameInfo}) { return <main id="main-content" className="coming-soon" data-theme={game.theme}><div><div className="coming-soon-mark"><span>{game.shortTitle.slice(0,1)}</span></div><p className="kicker">COMING SOON</p><h1>{game.title}</h1><p className="lead">乞うご期待。Wiki公開に向けてアーカイブを準備しています。</p><p><Link className="badge badge-accent" href="/">ゲーム選択へ戻る</Link></p></div></main>; }
