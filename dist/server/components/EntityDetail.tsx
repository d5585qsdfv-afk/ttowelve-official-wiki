import type { WikiEntity } from "@/types/wiki";
import Image from "next/image";
import { Badge } from "./Badge";
import { DetailSection } from "./DetailSection";

function List({items}:{items:string[]}) { return <ul>{items.map((item)=><li key={item}>{item}</li>)}</ul>; }
export function EntityDetail({entity}:{entity:WikiEntity}) {
  return <><header className="detail-hero">{entity.kind==="enemy"?<Image className="detail-icon" src={entity.image} alt={entity.imageAlt} width={88} height={88}/>:<div className="detail-icon" aria-hidden="true">{entity.icon}</div>}<div><p className="kicker">FICTIONAL SAMPLE / {entity.kind}</p><h1>{entity.name}</h1><p>{entity.description}</p><div className="entity-meta">{entity.tags.map((tag)=><Badge key={tag}>{tag}</Badge>)}</div></div></header>
  <DetailSection title="基本情報"><div className="stat-grid"><div className="stat"><small>Game Version</small>{entity.gameVersion}</div><div className="stat"><small>追加日</small>{entity.createdAt}</div><div className="stat"><small>最終更新日</small>{entity.updatedAt}</div></div></DetailSection>
  {entity.kind==="weaponType"&&<><DetailSection title="特徴"><List items={entity.traits}/></DetailSection><DetailSection title="得意距離"><p>{entity.recommendedRange}</p></DetailSection></>}
  {entity.kind==="weapon"&&<DetailSection title="装備性能"><p>武器種：{entity.weaponType} / 属性：{entity.attribute} / レアリティ：{entity.rarity} / 基礎威力：{entity.power}</p><p>入手方法：{entity.obtainMethod}</p></DetailSection>}
  {entity.kind==="card"&&<DetailSection title="カード効果"><p>{entity.effect}</p><p>属性：{entity.attribute} / レアリティ：{entity.rarity} / 入手方法：{entity.obtainMethod}</p></DetailSection>}
  {entity.kind==="medicine"&&<DetailSection title="薬効果"><p>{entity.effect}</p><p>属性：{entity.attribute} / レアリティ：{entity.rarity} / 入手方法：{entity.obtainMethod}</p></DetailSection>}
  {entity.kind==="job"&&<><DetailSection title="特徴"><List items={entity.features}/></DetailSection><DetailSection title="得意武器"><List items={entity.recommendedWeapons}/></DetailSection>{entity.skills?.length&&<DetailSection title="スキル"><List items={entity.skills}/></DetailSection>}<DetailSection title="今後追加できる情報" tone="note"><p>相性・関連装備・攻略情報を同じデータモデルへ追加できます。</p></DetailSection></>}
  {entity.kind==="emblem"&&<><DetailSection title="紋章効果"><p>{entity.effect}</p></DetailSection><DetailSection title="分類"><p>{entity.classification} / {entity.rarity}</p></DetailSection></>}
  {entity.kind==="enemy"&&<><DetailSection title="基本情報"><div className="stat-grid"><div className="stat"><small>種別</small>{entity.classification}</div><div className="stat"><small>属性</small>{entity.attribute}</div><div className="stat"><small>出現場所</small>{entity.location}</div></div></DetailSection><DetailSection title="弱点"><List items={entity.weakness}/></DetailSection><DetailSection title="注意する攻撃" tone="warning">{entity.attacks.map((attack)=><article className="attack-card" key={attack.name}><strong>{attack.name}</strong><dl><dt>予兆</dt><dd>{attack.telegraph}</dd><dt>対処方法</dt><dd>{attack.response}</dd></dl></article>)}</DetailSection><DetailSection title="攻略"><List items={entity.strategy}/></DetailSection><DetailSection title="ドロップ"><List items={entity.drops}/></DetailSection><DetailSection title="出現場所"><p>{entity.location}</p></DetailSection><DetailSection title="関連情報"><p>同エリアの敵・有効な装備・記事を将来ここへ関連付けできます。</p></DetailSection><DetailSection title="対応ゲームバージョン"><p>{entity.gameVersion}</p></DetailSection><DetailSection title="最終更新日"><time dateTime={entity.updatedAt}>{entity.updatedAt}</time></DetailSection></>}
  {entity.kind==="article"&&entity.content.map((section)=><DetailSection title={section.heading} tone={section.tone} key={section.heading}><p>{section.body}</p></DetailSection>)}
  </>;
}
