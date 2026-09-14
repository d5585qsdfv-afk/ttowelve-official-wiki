import Link from "next/link";
import type { WikiEntity } from "@/types/wiki";
import { GlobalSearch } from "./GlobalSearch";
import { AuthStatus } from "./AuthStatus";
export function AppHeader({entities}:{entities:WikiEntity[]}) { return <header className="app-header"><Link className="brand-lockup" href="/games/juno"><span className="brand-glyph"><span>十</span></span><span className="brand-copy">十の救現主 Wiki</span></Link><GlobalSearch entities={entities}/><span className="header-actions"><Link className="header-link" href="/">ゲーム選択</Link><AuthStatus/></span></header>; }
