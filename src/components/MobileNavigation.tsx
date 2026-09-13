import Link from "next/link";
import { categories } from "@/lib/wiki";
export function MobileNavigation() { return <nav className="mobile-nav" aria-label="モバイルナビゲーション"><Link href="/games/juno"><span aria-hidden="true">⌂</span>HOME</Link>{categories.map((item)=><Link href={`/games/juno/${item.slug}`} key={item.slug}><span aria-hidden="true">{item.icon}</span>{item.shortLabel}</Link>)}</nav>; }
