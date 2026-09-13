import { SortControl, type SortKey } from "./SortControl";

export interface FilterState { query:string; attribute:string; rarity:string; tag:string; }

export function FilterBar({filters,onChange,sort,onSort,attributes,rarities,tags}:{filters:FilterState;onChange:(value:FilterState)=>void;sort:SortKey;onSort:(value:SortKey)=>void;attributes:string[];rarities:string[];tags:string[]}) {
  const patch=(key:keyof FilterState,value:string)=>onChange({...filters,[key]:value});
  return <div className="catalog-tools" aria-label="検索と絞り込み"><label><span className="sr-only">一覧内検索</span><input type="search" placeholder="名前・説明・タグを検索" value={filters.query} onChange={(e)=>patch("query",e.target.value)}/></label><label><span className="sr-only">属性</span><select aria-label="属性で絞り込み" value={filters.attribute} onChange={(e)=>patch("attribute",e.target.value)}><option value="">すべての属性</option>{attributes.map((value)=><option key={value}>{value}</option>)}</select></label><label><span className="sr-only">レアリティ</span><select aria-label="レアリティで絞り込み" value={filters.rarity} onChange={(e)=>patch("rarity",e.target.value)}><option value="">すべてのレアリティ</option>{rarities.map((value)=><option key={value}>{value}</option>)}</select></label><label><span className="sr-only">タグ</span><select aria-label="タグで絞り込み" value={filters.tag} onChange={(e)=>patch("tag",e.target.value)}><option value="">すべてのタグ</option>{tags.map((value)=><option key={value}>{value}</option>)}</select></label><SortControl value={sort} onChange={onSort}/></div>;
}
