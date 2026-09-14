const categoryTags = {
  weapons: '武器種',
  weaponItems: '武器',
  cards: 'カード',
  medicines: '薬',
  jobs: 'ジョブ',
  emblems: '紋章',
  rings: 'リンクリング',
  enemies: '敵',
  other: '戦闘・報酬',
};

const contentTags = [
  ['Attack', /(?:^|[^A-Za-z])Attack(?:[^A-Za-z]|$)/i],
  ['Support', /(?:^|[^A-Za-z])Support(?:[^A-Za-z]|$)/i],
  ['Health', /(?:^|[^A-Za-z])Health(?:[^A-Za-z]|$)/i],
  ['Counter', /(?:^|[^A-Za-z])Counter(?:[^A-Za-z]|$)/i],
  ['Character', /(?:^|[^A-Za-z])Character(?:[^A-Za-z]|$)/i],
  ['攻撃', /攻撃/],
  ['物理', /物理/],
  ['魔法', /魔法/],
  ['近接', /近接/],
  ['遠隔', /遠隔/],
  ['イマジン', /イマジン/],
  ['回復', /回復|全回復/],
  ['復活', /復活|戦闘不能.*解消/],
  ['ガード', /ガード/],
  ['回避', /回避/],
  ['カウンター', /カウンター/],
  ['反射', /反射/],
  ['貫通', /貫通/],
  ['装甲', /装甲/],
  ['状態異常', /状態異常|異常耐性/],
  ['バフ', /バフ|プラス効果/],
  ['デバフ', /デバフ|マイナス効果/],
  ['連続行動', /連続行動/],
  ['追撃', /追撃/],
  ['移動', /移動/],
  ['HP', /HP/],
  ['VUND', /VUND/],
  ['ボス', /ボス/],
  ['出典', /現像元|原典|出典/],
];

const elementTags = ['炎属性', '氷属性', '水属性', '雷属性', '風属性', '土属性', '光属性', '闇属性', '鉄属性', '花属性', '毒属性', '霜烈属性', '聖光属性', '闇黒属性'];
const statusTags = ['延焼', '冷凍', '通電', '切傷', '蹣跚', '軟弱', '浄化', '汚染', '過意', '脱心', '停止', '流血', '中毒', '燃焼', 'ブレイク', '幸運', 'ダンス', '刻印', '電気', '金欲'];

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeDigits(value) {
  return String(value).replace(/[０-９]/g, character => String.fromCharCode(character.charCodeAt(0) - 0xfee0));
}

function channelTags(text) {
  const tags = new Set();
  for (const match of text.matchAll(/(?:チャンネル|CH\s*)([A-Za-z0-9０-９]+)/gi)) {
    const value = normalizeDigits(match[1]);
    if (/^\d+$/.test(value)) tags.add(`CH ${value.padStart(2, '0')}`);
    else tags.add(`CH ${value}`);
  }
  return tags;
}

function levelTags(text) {
  const tags = new Set();
  for (const match of text.matchAll(/(?:レベル|Lv\.?\s*)([0-9０-９]+)/gi)) tags.add(`Lv.${normalizeDigits(match[1])}`);
  return tags;
}

function chapterTags(text) {
  const tags = new Set();
  for (const match of text.matchAll(/(?:第\s*)?([一二三四五六七八九十百0-9０-９]+)章/g)) tags.add(`${normalizeDigits(match[1])}章`);
  return tags;
}

export function entryText(entry) {
  return [entry.title, entry.subtitle, entry.summary, entry.body, entry.source, entry.characterClass, entry.vundClass, entry.classification, entry.chapter, entry.location, ...(entry.tags || [])]
    .filter(Boolean)
    .join('\n');
}

export function deriveEntryTags(entry) {
  const text = entryText(entry);
  const tags = new Set((Array.isArray(entry.tags) ? entry.tags : []).map(normalize).filter(Boolean));
  const categoryTag = categoryTags[entry.category];
  if (categoryTag) tags.add(categoryTag);
  if (entry.characterClass) tags.add(normalize(entry.characterClass));
  if (entry.vundClass) tags.add(normalize(entry.vundClass));
  for (const [tag, pattern] of contentTags) if (pattern.test(text)) tags.add(tag);
  for (const tag of elementTags) if (text.includes(tag)) tags.add(tag);
  for (const tag of statusTags) if (text.includes(tag)) tags.add(tag);
  for (const tag of channelTags(text)) tags.add(tag);
  for (const tag of levelTags(text)) tags.add(tag);
  for (const tag of chapterTags(text)) tags.add(tag);
  return [...tags].map(normalize).filter(Boolean);
}

export function decorateEntry(entry) {
  return {...entry, tags: deriveEntryTags(entry)};
}

export function searchEntry(entry, query) {
  const normalizedQuery = normalize(query).toLocaleLowerCase('ja-JP');
  return !normalizedQuery || entryText(entry).toLocaleLowerCase('ja-JP').includes(normalizedQuery) || (entry.tags || []).some(tag => tag.toLocaleLowerCase('ja-JP').includes(normalizedQuery));
}

export function matchesTags(entry, selectedTags) {
  return [...selectedTags].every(tag => (entry.tags || []).includes(tag));
}
