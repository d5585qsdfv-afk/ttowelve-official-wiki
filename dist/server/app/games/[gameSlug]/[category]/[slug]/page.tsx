import { notFound } from "next/navigation";
import { allEntities, getEntities, getEntity } from "@/data/index";
import { categories, getCategory, isCategorySlug } from "@/lib/wiki";
import { WikiShell } from "@/components/WikiShell";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EntityDetail } from "@/components/EntityDetail";

export function generateStaticParams() { return categories.flatMap((category)=>getEntities(category.slug).map((entity)=>({gameSlug:"juno",category:category.slug,slug:entity.slug}))); }
export const dynamicParams=false;

export default async function DetailPage({params}:{params:Promise<{gameSlug:string;category:string;slug:string}>}) {
  const {gameSlug,category,slug}=await params; if(gameSlug!=="juno"||!isCategorySlug(category)) notFound(); const entity=getEntity(category,slug); if(!entity) notFound(); const info=getCategory(category);
  return <WikiShell entities={allEntities} active={category}><Breadcrumb items={[{label:"十の救現主",href:"/games/juno"},{label:info.label,href:`/games/juno/${category}`},{label:entity.name}]}/><EntityDetail entity={entity}/></WikiShell>;
}
