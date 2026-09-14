export function Badge({ children, accent=false }: { children:React.ReactNode; accent?:boolean }) { return <span className={`badge${accent ? " badge-accent" : ""}`}>{children}</span>; }
