"use client";
import { useMemo, useState } from "react";
import type { WikiEntity } from "@/types/wiki";
import { normalizeQuery } from "@/lib/search";
import { EntityCard } from "./EntityCard";
import { EmptyState } from "./EmptyState";
import { FilterBar, type FilterState } from "./FilterBar";
import type { SortKey } from "./SortControl";
import { kindLabels } from "@/lib/wiki";

const rarityWeight:Record<string,number>={Legendary:4,Epic:3,Rare:2,Common:1};
function field(entity:WikiEntity,key:"attribute"|"rarity") {
  if(key==="attribute" && "attribute" in entity) return entity.attribute;
  if(key==="rarity" && "rarity" in entity) return entity.rarity;
  return "";
}

export function CatalogExplorer({entities,showTabs=false}:{entities:WikiEntity[];showTabs?:boolean}) {
  const [tab,setTab]=useState("all");
  const [filters,setFilters]=useState<FilterState>({query:"",attribute:"",rarity:"",tag:""});
  const [sort,setSort]=useState<SortKey>("name");
  const tabs=showTabs ? ["all","weapon","card","medicine"] : [];
  const options=(key:"attribute"|"rarity")=>[...new Set(entities.map((entity)=>field(entity,key)).filter(Boolean))];
  const tags=[...new Set(entities.flatMap((entity)=>entity.tags))].sort((a,b)=>a.localeCompare(b,"ja"));
  const visible=useMemo(()=>entities.filter((entity)=>{
    const haystack=normalizeQuery([entity.name,entity.description,...entity.tags].join(" "));
    return (tab==="all"||entity.kind===tab) && (!filters.query||haystack.includes(normalizeQuery(filters.query))) && (!filters.attribute||field(entity,"attribute")===filters.attribute) && (!filters.rarity||field(entity,"rarity")===filters.rarity) && (!filters.tag||entity.tags.includes(filters.tag));
  }).sort((a,b)=>sort==="updated" ? b.updatedAt.localeCompare(a.updatedAt) : sort==="added" ? ("addedOrder" in b ? b.addedOrder:0)-("addedOrder" in a?a.addedOrder:0) : sort==="rarity" ? (rarityWeight[field(b,"rarity")]||0)-(rarityWeight[field(a,"rarity")]||0) : a.name.localeCompare(b.name,"ja")),[entities,filters,sort,tab]);
  return <><FilterBar filters={filters} onChange={setFilters} sort={sort} onSort={setSort} attributes={options("attribute")} rarities={options("rarity")} tags={tags}/>{showTabs&&<div className="tab-list" role="tablist" aria-label="アイテム種別">{tabs.map((kind)=><button className="tab-button" role="tab" aria-selected={tab===kind} onClick={()=>setTab(kind)} key={kind}>{kind==="all"?"すべて":kindLabels[kind as "weapon"|"card"|"medicine"]}</button>)}</div>}<p className="result-count">{visible.length}件 / {entities.length}件</p>{visible.length?<div className="entity-grid">{visible.map((entity)=><EntityCard entity={entity} key={entity.id}/>)}</div>:<EmptyState/>}</>;
}
