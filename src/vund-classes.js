export const VUND_CLASSES = [
  'Gamers', 'Collapse', 'Adventure', 'Sun', 'Mirror', 'Saver',
  'Reverse', 'Mixing', 'StarRail', 'Genshin', 'Bright&Story', '#Compass',
];

const WIKI_CLASS_JOBS = {
  Gamers: [
    'テラ', 'ジョス', 'メル', 'イア', 'ニオ', 'リオン', 'レクサム', 'ラーク',
    'フォッズ', 'ルー', 'ミコ', 'セロ', 'リタ', 'ライア', 'ブナフェル',
  ],
  Collapse: [
    'カルパ・リュセンジュ・ライレス', 'アランテス・ロイ・ピュスト',
    'サンセル・チェルガード', 'エーメル&フェディ', 'マグリア・ヴェンス',
    'ニコクス', 'ハーヴァリー・オッツォ', 'ギューイ',
  ],
  Sun: [
    'ジニア・ウォード', 'アシティス・クィルソン', 'ペギント準教官',
    'シャグリマ・クレイン', 'ルーシャ・クレイン', '矢津 京介', 'ファッファモ',
    'ガガリアン・パラジュ', 'アスター・ブラン・ヴィオレ',
  ],
  Mirror: ['慈夜 明美', '伊崎 真日留', '沙羅石 椿', '榎木 春', '怪盗バサラール'],
  Saver: ['アジャナ・ウェン', 'ユルヴィ', 'ヘルフィ', 'ヴァング', 'ゲイト', 'リーザ', '翠蘭姫', 'ラシュタ', 'リズナ'],
};

const WIKI_JOB_CLASSES = new Map(
  Object.entries(WIKI_CLASS_JOBS).flatMap(([className, titles]) => titles.map((title) => [title, className])),
);

// Reverse:1999 roster names that are present in the imported Little Saver/legacy panels.
// The original Reverse group is handled by its source label below.
const REVERSE_TITLES = new Set([
  'ノワール', 'レコレータ', 'チューズデー', 'アンジョナナ', 'ロペラ', 'ヴィロー',
  'バルカローラ', '梁月', 'エル・アレフ', 'ノーティカ', '37', 'ルブシカ', 'J',
]);

// These are the eight characters explicitly assigned to Bright&Story in the
// latest class roster. Keep this list ahead of source-based game detection so
// the class assignment follows the roster rather than the imported origin.
const BRIGHT_STORY_TITLES = new Set([
  'サイゼル・エルケトラ', 'クレガ', 'マリス・ディガー', 'テオ・ベルナー',
  'エリザ・ナダトール', 'リエル', 'AF-G2(アネッサ・フレデンス)', 'トウル・マース',
]);

// These characters were explicitly identified as Adventure in the latest
// roster. The renamed Iris record is intentionally left unclassified.
const ADVENTURE_TITLES = new Set([
  '天泣 鯆晴', '二本滝 鬼才', 'ライゼル・ハーク', 'L-00',
  '想依華&子龍', '桃次郎', '日川 林檎',
]);

// These records are intentionally retained in the archive without a class.
// The old base Iris record is removed; the imported, latest Iris record is
// retained without a game/source class.
const UNCLASSIFIED_TITLES = new Set([
  '未草かなみ', '裕蓮 ふよう', 'イリス',
]);

const EXTERNAL_GAME_SOURCE = 'BRAVELY DEFAULT II／ゼンレスゾーンゼロ／ペルソナ5:The Phantom X／METAL GEAR RISING:REVENGEANCE／アサシンクリードII';
const TEST_GAMERS_SOURCE = 'テストゲーマーズ／テストゲーマーズ~Memories~／テストゲーマーズ2／テストゲーマーズ0／テストゲーマーズ3';

const VUND_BOSS_CLASSES = new Map([
  ['enemy-V-101-20185', 'Gamers'],
  ['enemy-V-102-21140', 'Collapse'],
  ['enemy-V-103-21569', 'Adventure'],
  ['enemy-V-104-22159', 'Sun'],
  ['enemy-V-105-22438', 'Mirror'],
  ['enemy-V-106-22803', 'Saver'],
]);

function normalizedTitle(title = '') {
  return String(title).trim().replace(/^・+/, '');
}

function sourceClass(entry) {
  return String(entry.characterClass || entry.subtitle?.split('｜')[1] || '').trim();
}

export function canonicalJobClass(entry) {
  if (entry.category !== 'jobs') return '';
  const title = normalizedTitle(entry.title);
  const source = sourceClass(entry);

  if (entry.subtitle?.startsWith('StarRail｜') || source.startsWith('装備・VUND・クラス「StarRail」')) return 'StarRail';
  if (UNCLASSIFIED_TITLES.has(title)) return '';
  if (ADVENTURE_TITLES.has(title)) return 'Adventure';
  if (BRIGHT_STORY_TITLES.has(title)) return 'Bright&Story';
  if (WIKI_JOB_CLASSES.has(title)) return WIKI_JOB_CLASSES.get(title);
  if (source === 'リバース:1999' || REVERSE_TITLES.has(title)) return 'Reverse';
  if (source === EXTERNAL_GAME_SOURCE || title === '星見雅') return 'Mixing';
  if (source === TEST_GAMERS_SOURCE) return 'Gamers';
  if (source === 'Death Reunion~五つの禁術~') return 'Sun';
  if (source === 'Little Saver') return 'Saver';
  if (source === 'Breaking Night Mirror') return 'Mirror';
  if (source === 'Couse of Collapse') return 'Collapse';

  // User rule for a job not identified as a public-game character.
  return 'Bright&Story';
}

export function vundClassForEntry(entry) {
  if (VUND_BOSS_CLASSES.has(entry.id)) return VUND_BOSS_CLASSES.get(entry.id);
  if (entry.id?.startsWith('enemy-starrail-')) return 'StarRail';
  return String(entry.vundClass || '').trim();
}
