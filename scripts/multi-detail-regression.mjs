import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { MAX_PINNED_ENTRIES, normalizePinnedIds, pinnedEntries, togglePinnedIds } from '../src/pin-state.js';

const root = resolve(import.meta.dirname, '..');
const client = await readFile(resolve(root, 'src', 'client.browser.js'), 'utf8');
const page = await readFile(resolve(root, 'src', 'page.js'), 'utf8');
const build = await readFile(resolve(root, 'scripts', 'build.mjs'), 'utf8');

assert.equal(MAX_PINNED_ENTRIES, 4, 'fixed detail limit should be four');
assert.deepEqual(normalizePinnedIds(['weapon-1', 'job-1', 'weapon-1', '', null]), ['weapon-1', 'job-1']);
let state = [];
for (const id of ['weapon-1', 'job-1', 'emblem-1', 'weapon-2']) state = togglePinnedIds(state, id).ids;
assert.deepEqual(state, ['weapon-1', 'job-1', 'emblem-1', 'weapon-2']);
const blocked = togglePinnedIds(state, 'job-2');
assert.equal(blocked.reason, 'limit');
assert.deepEqual(togglePinnedIds(state, 'job-1').ids, ['weapon-1', 'emblem-1', 'weapon-2']);
assert.deepEqual(pinnedEntries([{ id: 'emblem-1' }, { id: 'weapon-1' }], state).map(entry => entry.id), ['weapon-1', 'emblem-1']);

for (const marker of [
  'PINNED_ENTRIES_KEY', 'PINNED_DOCK_KEY', 'PINNED_COLLAPSED_KEY', 'renderPinnedEntries', 'toggle-pin-entry', 'toggle-pin-current', 'toggle-pinned-dock', 'toggle-pinned-collapse', 'clear-pinned', 'pinnedGrid', 'pinnedPanelContent', 'is-docked', 'is-collapsed', 'detailPin', 'MAX_PINNED_ENTRIES',
]) assert.match(client + page, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `multi-detail UI marker missing: ${marker}`);
assert.match(build, /pin-state\.js/, 'pin-state asset is not included in the Worker bundle');
console.log('Multi-detail regression passed: pin/unpin, four-item limit, ordering, filtering, UI markers, and asset delivery verified.');
