import { notFound } from "next/navigation";
import { allEntities, getEntities } from "@/data/index";
import { categories, getCategory, isCategorySlug } from "@/lib/wiki";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { WikiShell } from "@/components/WikiShell";
import { Breadcrumb } from "@/components/Breadcrumb";

export function generateStaticParams() { return categories.map((category)=>({gameSlug:"juno",category:category.slug})); }

export default async function CategoryPage({params}:{params:Promise<{gameSlug:string;category:string}>}) {
  const {gameSlug,category}=await params; if(gameSlug!=="juno"||!isCategorySlug(category)) notFound();
  const info=getCategory(category); const entities=getEntities(category);
  return <WikiShell entities={allEntities} active={category}><Breadcrumb items={[{label:"十の救現主",href:"/games/juno"},{label:info.label}]}/><div className="page-heading"><div><p className="kicker">{category.toUpperCase()}</p><h1>{info.label}</h1><p>{info.description}。すべて初期版確認用の架空データです。</p></div></div><CatalogExplorer entities={entities} showTabs={category==="items"}/></WikiShell>;
}
