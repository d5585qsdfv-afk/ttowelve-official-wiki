import type { CategorySlug, WikiEntity } from "@/types/wiki";
import { AppHeader } from "./AppHeader";
import { MobileNavigation } from "./MobileNavigation";
import { WikiSidebar } from "./WikiSidebar";
export function WikiShell({children,entities,active="home"}:{children:React.ReactNode;entities:WikiEntity[];active?:CategorySlug|"home"}) { return <div className="page-shell" data-theme="juno"><AppHeader entities={entities}/><div className="wiki-grid"><WikiSidebar active={active}/><main id="main-content" className="wiki-main">{children}</main></div><MobileNavigation/></div>; }
