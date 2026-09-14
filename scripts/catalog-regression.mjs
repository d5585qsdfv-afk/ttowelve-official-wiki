import assert from 'node:assert/strict';
import { defaultEntries } from '../src/data.js';
import { decorateEntry, matchesTags, searchEntry } from '../src/tagging.js';

const allowedCategories = new Set(['weapons', 'weaponItems', 'cards', 'medicines', 'jobs', 'emblems', 'rings', 'enemies', 'other']);
const ids = new Set();

assert(defaultEntries.length > 0, 'catalog is empty');
for (const entry of defaultEntries) {
  assert(entry.id && !ids.has(entry.id), `duplicate id: ${entry.id}`);
  ids.add(entry.id);
  assert(allowedCategories.has(entry.category), `unknown category: ${entry.category}`);
  assert(entry.title?.trim(), `missing title: ${entry.id}`);
  assert(entry.body?.trim(), `missing body: ${entry.id}`);
  assert(Array.isArray(entry.tags) && entry.tags.length > 0, `missing tags: ${entry.id}`);
}

const searchCorpus = [
  ['ムクイルカ', 'ムクイルカ'],
  ['状態異常', '状態異常'],
  ['StarRail', 'StarRail'],
  ['現像元', '現像元'],
  ['CH 09', 'CH 09'],
];
for (const [query, expected] of searchCorpus) assert(defaultEntries.some(entry => searchEntry(entry, query) && `${entry.title} ${entry.subtitle} ${entry.body} ${(entry.tags || []).join(' ')}`.includes(expected)), `search miss: ${query}`);

const tagged = defaultEntries.find(entry => entry.tags.includes('カード') && entry.tags.includes('Attack'));
assert(tagged, 'tag intersection fixture missing');
assert(matchesTags(tagged, new Set(['カード', 'Attack'])));
assert(!matchesTags(tagged, new Set(['カード', '存在しないタグ'])));
assert.deepEqual(decorateEntry({...tagged, tags: []}).tags.includes('カード'), true);

console.log(`Catalog regression passed: ${defaultEntries.length} entries, ${ids.size} unique ids, complete tags, representative searches, and tag intersection verified.`);
