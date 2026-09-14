"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { WikiEntity } from "@/types/wiki";
import { searchEntities } from "@/lib/search";
import { entityHref, kindLabels } from "@/lib/wiki";

export function GlobalSearch({ entities }:{entities:WikiEntity[]}) {
  const [query,setQuery]=useState("");
  const results=useMemo(()=>searchEntities(entities,query),[entities,query]);
  const groups=useMemo(()=>{
    const grouped=new Map<string,WikiEntity[]>();
    for(const item of results){const label=kindLabels[item.kind]; grouped.set(label,[...(grouped.get(label)??[]),item]);}
    return [...grouped.entries()];
  },[results]);
  return <div className="global-search"><label className="search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Wiki横断検索</span><input type="search" role="combobox" aria-autocomplete="list" placeholder="Wikiを横断検索…" value={query} onChange={(e)=>setQuery(e.target.value)} aria-expanded={Boolean(query)} aria-controls="global-search-results"/></label>{query && <div id="global-search-results" className="search-results" role="region" aria-live="polite">{groups.length ? groups.map(([label,items])=><section className="search-group" key={label}><h3>{label}</h3>{items.slice(0,5).map((entity)=><Link className="search-result" href={entityHref(entity)} key={entity.id} onClick={()=>setQuery("")}><strong>{entity.name}</strong><small>{entity.description}</small></Link>)}</section>) : <p className="result-count">「{query}」に一致する情報はありません。</p>}</div>}</div>;
}
