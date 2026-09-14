import assert from 'node:assert/strict';
import { defaultEntries } from '../src/data.js';
import { weaponDisplayMetadata, weaponTypeForEntry } from '../src/weapon-metadata.js';

const items = defaultEntries.filter(entry => entry.category === 'weaponItems');
assert.equal(items.length, 93, 'weapon item count changed unexpectedly');

for (const entry of items) {
  const metadata = weaponDisplayMetadata(entry);
  const subtitleParts = String(entry.subtitle || '').split('｜');
  assert(metadata.weaponType?.trim(), `missing weapon type: ${entry.title}`);
  assert.notEqual(metadata.weaponType, '個別装備', `placeholder weapon type: ${entry.title}`);
  assert.equal(metadata.weaponType, weaponTypeForEntry(entry), `type resolver mismatch: ${entry.title}`);
  assert.equal(metadata.base, metadata.weaponType, `base is not weapon type: ${entry.title}`);
  assert.equal(subtitleParts[1], metadata.weaponType, `subtitle type mismatch: ${entry.title}`);
  assert(entry.tags.includes(metadata.weaponType), `weapon type tag missing: ${entry.title}`);
}

const fixtures = {
  '天泣ノ御神之石剣': '短剣',
  '桃印の桃次郎ハンド': '拳具',
  'アメジストの杖': '魔杖',
  'ランスタッフ': '長槍＆魔杖',
  '光剣ネクス': '片剣',
  '携帯式浮遊小瓶': '小瓶',
  '蓄電式機械バッグ': '軽鞄',
  '無限の可能性': '武器種なし',
  'イジャルドデュエット': '弾槍＆断鋏',
};
for (const [title, expected] of Object.entries(fixtures)) {
  const entry = items.find(item => item.title === title);
  assert(entry, `missing fixture: ${title}`);
  assert.equal(weaponTypeForEntry(entry), expected, `invalid referenced type: ${title}`);
}

console.log(`Weapon regression passed: ${items.length} items have non-placeholder types, matching subtitle/tags, and base equal to weapon type.`);
