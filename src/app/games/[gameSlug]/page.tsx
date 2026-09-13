import { notFound } from "next/navigation";
import { games, getGame } from "@/data/games";
import { allEntities, getEntities } from "@/data/index";
import { categories, entityHref } from "@/lib/wiki";
import { ComingSoon } from "@/components/ComingSoon";
import { WikiShell } from "@/components/WikiShell";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryCard } from "@/components/CategoryCard";
import { VersionInfo } from "@/components/VersionInfo";
import Link from "next/link";

export function generateStaticParams() { return games.map((game)=>({gameSlug:game.slug})); }

export default async function GameHome({params}:{params:Promise<{gameSlug:string}>}) {
  const {gameSlug}=await params; const game=getGame(gameSlug); if(!game) notFound();
  if(game.status==="coming-soon") return <ComingSoon game={game}/>;
  const latest=[...allEntities].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,4);
  const updated=[...allEntities].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4);
  return <WikiShell entities={allEntities}><Breadcrumb items={[{label:game.title}]}/><div className="page-heading"><div><p className="kicker">Official database / fictional demo data</p><h1>{game.title}</h1><p>必要な情報へ最短で到達できる、公式アーカイブ兼攻略Wiki。</p></div></div><section aria-labelledby="category-title"><h2 id="category-title" className="section-title">カテゴリ</h2><div className="category-grid">{categories.map((category)=><CategoryCard href={`/games/juno/${category.slug}`} icon={category.icon} title={category.label} description={category.description} count={getEntities(category.slug).length} key={category.slug}/>)}</div></section><section aria-label="Wiki activity"><div className="activity-grid"><div><h2 className="section-title">最近追加された情報</h2><div className="info-panel"><ul className="activity-list">{latest.map((entity)=><li key={entity.id}><Link href={entityHref(entity)}>{entity.name}</Link><small>{entity.createdAt}</small></li>)}</ul></div></div><div><h2 className="section-title">最近更新された情報</h2><div className="info-panel"><ul className="activity-list">{updated.map((entity)=><li key={entity.id}>{entity.name}<small>{entity.updatedAt}</small></li>)}</ul></div></div></div></section><VersionInfo/></WikiShell>;
}
