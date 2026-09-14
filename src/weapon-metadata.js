const ITEM_WEAPON_TYPES = Object.freeze({
  'weapon-item-001': '短剣',
  'weapon-item-002': '拳具',
  'weapon-item-003': '小斧',
  'weapon-item-004': '長銃',
  'weapon-item-005': '斬刀',
  'weapon-item-006': '大鎌',
  'weapon-item-007': '両剣',
  'weapon-item-008': '片剣',
  'weapon-item-009': '大鎌',
  'weapon-item-010': '札箱',
  'weapon-item-011': '魔杖',
  'weapon-item-012': '斬刀',
  'weapon-item-013': '魔杖',
  'weapon-item-014': '片剣',
  'weapon-item-015': '大槌',
  'weapon-item-016': '拳具',
  'weapon-item-017': '伸剣',
  'weapon-item-018': '巨槍',
  'weapon-item-019': '両盾',
  'weapon-item-020': '長槍＆魔杖',
  'weapon-item-021': '短銃',
  'weapon-item-022': '札箱',
  'weapon-item-023': '磁弓',
  'weapon-item-024': '小斧',
  'weapon-item-025': '弾槍',
  'weapon-item-026': '射弓',
  'weapon-item-027': '電斧',
  'weapon-item-028': '舞棍',
  'weapon-item-029': '飛刃',
  'weapon-item-030': '霖傘',
  'weapon-item-031': '断鋏',
  'weapon-item-032': '瞬滑',
  'weapon-item-033': '弦笛',
  'weapon-item-034': '両剣',
  'weapon-item-035': '拳具',
  'weapon-item-036': '短剣',
  'weapon-item-037': '短銃',
  'weapon-item-038': '斬刀',
  'weapon-item-039': '射弓',
  'weapon-item-040': '片剣',
  'weapon-item-041': 'ブーメラン',
  'weapon-item-042': '短剣',
  'weapon-item-043': 'リーヴル',
  'weapon-item-044': 'ファン',
  'weapon-item-045': 'ファン',
  'weapon-item-046': '片剣',
  'weapon-item-047': '短銃',
  'weapon-item-048': '小瓶',
  'weapon-item-049': '魔杖',
  'weapon-item-050': '片剣',
  'weapon-item-051': '武器種なし',
  'weapon-item-052': '弾槍＆断鋏',
  'weapon-item-053': '短剣',
  'weapon-item-054': '両剣',
  'weapon-item-055': '飛刃',
  'weapon-item-056': '大槌',
  'weapon-item-057': '弦笛',
  'weapon-item-058': '戦旗',
  'weapon-item-059': '射弓',
  'weapon-item-060': '小瓶',
  'weapon-item-061': '伸剣',
  'weapon-item-062': '双銃',
  'weapon-item-063': '磁弓',
  'weapon-item-064': '電斧',
  'weapon-item-065': '巨槍',
  'weapon-item-066': '軽鞄',
  'weapon-item-067': '爆盾',
  'weapon-item-068': '流鞭',
  'weapon-item-069': '魔杖',
  'weapon-item-070': '霖傘',
  'weapon-item-071': '両盾',
  'weapon-item-072': '弾槍',
  'weapon-item-073': '刃翼',
  'weapon-item-074': '瞬滑',
  'weapon-item-075': '片剣',
  'weapon-item-076': '書冊',
  'weapon-item-077': '短銃',
  'weapon-item-078': '手車',
  'weapon-item-079': '両剣',
  'weapon-item-080': '斬刀',
  'weapon-item-081': '斬刀',
  'weapon-item-082': '大鎌',
  'weapon-item-083': '長銃',
  'weapon-item-084': '双剣',
  'weapon-item-085': '断鋏',
  'weapon-item-086': '拳具',
  'weapon-item-087': '書冊',
  'weapon-item-088': '片剣',
  'weapon-item-089': '舞棍',
  'weapon-item-090': '舞扇',
  'weapon-item-091': '小斧',
  'weapon-item-092': '札箱',
  'weapon-item-093': '砲綱',
});

const TYPE_ALIASES = Object.freeze({
  '片手剣': '片剣',
  '両手剣': '両剣',
  '刀': '斬刀',
  'カードケース': '札箱',
  '杖': '魔杖',
  'ハンマー': '大槌',
  'グローブ＆クロー': '拳具',
  'グローブ＆クロー(クロー)': '拳具',
  'ダブルシールド': '両盾',
  'ガーマ': '巨槍',
  'アイクシー': '伸剣',
  'マグネットアロー': '磁弓',
});

export function weaponTypeForEntry(entry) {
  if (!entry || entry.category !== 'weaponItems') return '';
  if (ITEM_WEAPON_TYPES[entry.id]) return ITEM_WEAPON_TYPES[entry.id];
  const parts = String(entry.subtitle || '').split('｜').map(value => value.trim());
  return TYPE_ALIASES[parts[1]] || parts[1] || '武器種未設定';
}

export function normalizeWeaponEntry(entry) {
  if (!entry || entry.category !== 'weaponItems') return entry;
  const weaponType = weaponTypeForEntry(entry);
  const parts = String(entry.subtitle || '').split('｜').map(value => value.trim()).filter(Boolean);
  const previousType = parts[1] || '';
  parts[1] = weaponType;
  const tags = (entry.tags || []).filter(tag => tag !== previousType && tag !== '個別装備');
  if (!tags.includes(weaponType)) tags.splice(1, 0, weaponType);
  return { ...entry, subtitle: parts.join('｜'), tags };
}

export function weaponDisplayMetadata(entry) {
  const parts = String(entry?.subtitle || '').split('｜').map(value => value.trim());
  const individual = entry?.category === 'weaponItems';
  const weaponType = individual ? weaponTypeForEntry(entry) : (parts[1] || '未分類');
  return {
    weaponType,
    attribute: parts[2] || '属性未設定',
    base: individual ? weaponType : '',
    individual,
  };
}
