import type { GameSlug } from "@/types/wiki";

export interface GameInfo {
  slug: GameSlug;
  title: string;
  shortTitle: string;
  status: "active" | "coming-soon";
  code: string;
  description: string;
  theme: "juno" | "soleil" | "idlet";
}

export const games: GameInfo[] = [
  { slug: "juno", title: "十の救現主", shortTitle: "十の救現主", status: "active", code: "DATABASE / GUIDE / ARCHIVE", description: "武器・ジョブ・紋章・敵攻略を横断する公式データベース。", theme: "juno" },
  { slug: "soleil", title: "ソレイユの伝承：エナルゴス戦記", shortTitle: "ソレイユの伝承", status: "coming-soon", code: "COMING SOON", description: "乞うご期待", theme: "soleil" },
  { slug: "idlet", title: "イドレット～競技性アライアンスゲーム～", shortTitle: "イドレット", status: "coming-soon", code: "COMING SOON", description: "乞うご期待", theme: "idlet" },
];

export function getGame(slug: string) { return games.find((game) => game.slug === slug); }
