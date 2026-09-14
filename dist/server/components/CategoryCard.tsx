import Link from "next/link";
export function CategoryCard({ href,icon,title,description,count }:{href:string;icon:string;title:string;description:string;count:number}) { return <Link className="category-card" href={href}><span className="category-icon" aria-hidden="true">{icon}</span><h2>{title}</h2><p>{description}</p><span className="category-count">{count} 件を収録 →</span></Link>; }
