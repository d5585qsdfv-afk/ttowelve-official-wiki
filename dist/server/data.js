import { weaponEntries } from './weapons.generated.js';

export const GAME_ID = 'ten-saviors';

const baseEntries = [
  {
    id: 'job-hikawa-ringo', category: 'jobs', title: '日川 林檎',
    subtitle: '札箱', accent: 'lime', sortOrder: 10,
    summary: 'カードの入れ替えと抽選を軸に、状況へ柔軟に対応するジョブ。',
    tags: ['ジョブ', '札箱', 'サポート'],
    body: 'カードチェンジ｜戦闘中にセット済みのカードを入れ替える。\nカード抽選｜毎ターン開始時、入手済みのカードからランダムなサポート／カウンターカードを使用する。\nVUNDアルティメット：マンマリンゴ｜発動ターン中、好きなカードを3枚使用できる。'
  },
  {
    id: 'job-l00', category: 'jobs', title: 'L-00',
    subtitle: '拳具（クロー）', accent: 'rose', sortOrder: 20,
    summary: '弱体化、回復分配、自己消費への反応を組み合わせる近接ジョブ。',
    tags: ['ジョブ', '拳具', '弱体化'],
    body: '牙鱗削ぎ｜敵単体の攻撃威力を下げ、被ダメージを増加させる武器攻撃。\n血液供給｜「静心」の回復量の一部を味方へ分配する。\nVUNDアルティメット：ブラッドクラッシュ｜無属性イマジンダメージを与え、固有スタックを獲得する。'
  },
  {
    id: 'job-iris', category: 'jobs', title: 'イリス',
    subtitle: '伸剣', accent: 'violet', sortOrder: 30,
    summary: '二本の伸剣と「魔のバイド」を運用する、攻撃的なジョブ。',
    tags: ['ジョブ', '伸剣', '魔のバイド'],
    body: 'アイルバイド〈蝕〉｜魔のバイドとHPを消費し、次回行動時の攻撃を強化する。\n伝説級武器調整術｜条件を満たす伸剣を二つ所持できる。\nVUNDアルティメット：クロスバイド・裂｜敵全体を攻撃し、ターン終了時にメモリアルダメージを与える。'
  },
  {
    id: 'job-hoshimi-miyabi', category: 'jobs', title: '星見雅',
    subtitle: '斬刀', accent: 'ice', sortOrder: 40,
    summary: '「落霜」を蓄積し、溜め段階に応じて斬撃を大きく強化するジョブ。',
    tags: ['ジョブ', '斬刀', '氷属性'],
    body: '飛雪｜斬刀による攻撃で「落霜」を獲得する。\n寒炎｜氷属性を霜烈属性へ変換し、固有状態を付与する。\nVUNDアルティメット：なごり雪｜敵全体を攻撃し、「落霜」を獲得する。'
  },
  {
    id: 'emblem-history-personality', category: 'emblems', title: '歴と性格',
    subtitle: '現像元：十の救現主／イズール', accent: 'amber', sortOrder: 10,
    summary: 'VUNDアルティメット使用後、一定確率でもう一度必殺技を使用可能にする紋章。',
    tags: ['紋章', 'イズール', 'アルティメット'],
    body: '紋章効果｜VUNDアルティメット使用後、30％の確率でもう一度必殺技を使用可能にする。連続発動は一回まで。'
  },
  {
    id: 'emblem-counter-signal', category: 'emblems', title: '反撃の狼煙',
    subtitle: '現像元：十の救現主／トレンシス', accent: 'orange', sortOrder: 20,
    summary: 'リンクリング使用時の攻撃威力と回復量を強化する紋章。',
    tags: ['紋章', 'トレンシス', 'リンクリング'],
    body: '紋章効果｜リンクリング使用時、攻撃威力と回復量が＋50％。'
  },
  {
    id: 'emblem-deepnight-mix', category: 'emblems', title: '深夜の調合',
    subtitle: '現像元：Cause of Collapse／マグリア・ヴェンス', accent: 'teal', sortOrder: 30,
    summary: '小瓶装備時に「バフの薬」「デバフの薬」を調合できる紋章。',
    tags: ['紋章', '小瓶', '薬'],
    body: '紋章効果｜チャンネル4に「調合」を設定。行動時に判定し、複数の候補からバフの薬とデバフの薬を獲得する。薬の効果は使用したターン中のみ持続する。'
  },
  {
    id: 'emblem-new-world', category: 'emblems', title: '新世界の旅へと',
    subtitle: '現像元：Test Gamers2／テラ', accent: 'sky', sortOrder: 40,
    summary: '複数の武器種を対象に、属性倍率と与ダメージを強化する紋章。',
    tags: ['紋章', 'テラ', '神具'],
    body: '紋章効果｜武器の属性倍率値を上昇させ、チャンネル5に「武器攻撃［神具］」を設定する。対象武器種の与ダメージを強化する。'
  },
  {
    id: 'other-ring-monya', category: 'other', title: '愛娘の指輪：モニャ',
    subtitle: '輪霊覚醒対象：イズール', accent: 'rose', sortOrder: 10,
    summary: '味方全員の継続回復と復活支援を担う指輪。',
    tags: ['指輪', '回復', 'イズール'],
    body: '毎ターン終了時、味方全員のHPを回復する。\nリザラク｜味方単体の戦闘不能を解消し、HP50％で復活させる。\n輪霊覚醒ではアルティメットチャージ率とHP回復効果を強化する。'
  },
  {
    id: 'other-ring-tera', category: 'other', title: '無限の指輪：テラ',
    subtitle: '輪霊覚醒対象：オリヴィア', accent: 'violet', sortOrder: 20,
    summary: '武器攻撃、ガード、回避を強化し、戦闘中の交代を可能にする指輪。',
    tags: ['指輪', '武器強化', 'オリヴィア'],
    body: '味方全員の武器攻撃ダメージ、ガード成功率、回避を強化する。\nフォージ｜味方単体の武器攻撃族を一段階上昇させる。\n輪霊覚醒では戦闘中のパーティ交代を可能にする。'
  },
  {
    id: 'card-coming-soon', category: 'cards', title: '武器カード・薬',
    subtitle: 'データ整理中', accent: 'lime', sortOrder: 10,
    summary: 'カードと薬の個別データは、管理画面から順次登録できます。',
    tags: ['武器カード', '薬', '準備中'],
    body: 'ココフォリアからコピーした情報や、正式な原稿を使って追加するための登録先です。'
  },
  {
    id: 'enemy-coming-soon', category: 'enemies', title: '敵図鑑＆攻略情報',
    subtitle: '攻略情報募集中', accent: 'red', sortOrder: 10,
    summary: '敵の能力、弱点、行動パターン、攻略の要点をまとめます。',
    tags: ['敵', '攻略', '準備中'],
    body: '敵データを登録すると、能力情報と攻略メモを一つの詳細画面で閲覧できます。'
  }
];

export const defaultEntries = [...weaponEntries, ...baseEntries].map((entry) => ({
  ...entry,
  game: GAME_ID,
  revision: 0,
  source: entry.source || '初期収録'
}));
