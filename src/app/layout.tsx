import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TTowelve 公式ゲームWiki", template: "%s | TTwowelve Wiki" },
  description: "TTowelve作品の公式データベース・攻略Wiki。掲載データは初期版の架空サンプルです。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body><a className="skip-link" href="#main-content">本文へ移動</a>{children}</body></html>;
}
