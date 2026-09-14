import Link from "next/link";
import { categories } from "@/lib/wiki";
import type { CategorySlug } from "@/types/wiki";
export function WikiSidebar({active}:{active?:CategorySlug|"home"}) { return <aside className="wiki-sidebar"><nav aria-label="十の救現主 Wiki"><Link className="sidebar-link" data-active={active==="home"} href="/games/juno">HOME</Link>{categories.map((item)=><Link className="sidebar-link" data-active={active===item.slug} href={`/games/juno/${item.slug}`} key={item.slug}>{item.label}</Link>)}</nav><p className="sidebar-meta">掲載内容は初期版確認用の架空データです。<br/>Wiki v0.2.0</p></aside>; }
