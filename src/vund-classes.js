export const VUND_CLASSES = [
  'Gamers', 'Collapse', 'Adventure', 'Sun', 'Mirror', 'Saver',
  'Reverse', 'Mixing', 'StarRail', 'Genshin', 'Bright&Story', '#Compass',
];

const SOURCE_CLASS_ALIASES = new Map([
  ['Couse of Collapse', 'Collapse'],
  ['Breaking Night Mirror', 'Mirror'],
  ['Little Saver', 'Saver'],
  ['リバース:1999', 'Reverse'],
  ['テストゲーマーズ／テストゲーマーズ~Memories~／テストゲーマーズ2／テストゲーマーズ0／テストゲーマーズ3', 'Gamers'],
]);

const VUND_BOSS_CLASSES = new Map([
  ['enemy-V-101-20185', 'Gamers'],
  ['enemy-V-102-21140', 'Collapse'],
  ['enemy-V-103-21569', 'Adventure'],
  ['enemy-V-104-22159', 'Sun'],
  ['enemy-V-105-22438', 'Mirror'],
  ['enemy-V-106-22803', 'Saver'],
]);

export function canonicalJobClass(entry) {
  if (entry.category !== 'jobs') return '';
  if (entry.subtitle?.startsWith('StarRail｜')) return 'StarRail';
  const sourceClass = String(entry.characterClass || '').trim();
  return SOURCE_CLASS_ALIASES.get(sourceClass) || (VUND_CLASSES.includes(sourceClass) ? sourceClass : '');
}

export function vundClassForEntry(entry) {
  if (VUND_BOSS_CLASSES.has(entry.id)) return VUND_BOSS_CLASSES.get(entry.id);
  if (entry.id?.startsWith('enemy-starrail-')) return 'StarRail';
  return String(entry.vundClass || '').trim();
}
