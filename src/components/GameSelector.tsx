import Link from "next/link";
import { games } from "@/data/games";

export function GameSelector() {
  return <div className="game-grid">{games.map((game,index) => {
    const content = <><span className="game-index">0{index + 1}</span><div className="game-mark"><span>{game.shortTitle.slice(0,1)}</span></div><h2>{game.title}</h2><p>{game.description}</p><span className="game-code">{game.code}</span></>;
    return game.status === "active" ? <Link className="game-card" data-theme={game.theme} href={`/games/${game.slug}`} key={game.slug}>{content}</Link> : <Link className="game-card" data-disabled="true" data-theme={game.theme} href={`/games/${game.slug}`} key={game.slug}>{content}</Link>;
  })}</div>;
}
