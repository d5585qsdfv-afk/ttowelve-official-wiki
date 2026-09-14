import Link from "next/link";
import Image from "next/image";
import type { WikiEntity } from "@/types/wiki";
import { entityHref, kindLabels } from "@/lib/wiki";
import { Badge } from "./Badge";

function meta(entity: WikiEntity) {
  if (entity.kind === "weaponType") return entity.recommendedRange;
  if (entity.kind === "weapon" || entity.kind === "card" || entity.kind === "medicine") return entity.rarity;
  if (entity.kind === "job") return entity.role;
  if (entity.kind === "emblem") return entity.classification;
  if (entity.kind === "enemy") return `${entity.classification} / ${entity.attribute}`;
  return entity.category;
}

export function EntityCard({ entity }:{entity:WikiEntity}) { return <Link className="entity-card" href={entityHref(entity)}><div className="entity-card-head">{entity.kind==="enemy"?<Image className="entity-icon" src={entity.image} alt={entity.imageAlt} width={44} height={44}/>:<span className="entity-icon" aria-hidden="true">{entity.icon}</span>}<Badge accent>{kindLabels[entity.kind]}</Badge></div><h2>{entity.name}</h2><p>{entity.description}</p><div className="entity-meta"><Badge>{meta(entity)}</Badge>{entity.tags.slice(0,2).map((tag)=><Badge key={tag}>{tag}</Badge>)}</div></Link>; }
