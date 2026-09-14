import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = file => readFile(resolve(root, file), 'utf8');
const [page, index, client, bridge, assets] = await Promise.all([
  read('src/page.js'),
  read('src/index.js'),
  read('src/client.browser.js'),
  read('src/supabase-bridge.js'),
  read('dist/server/assets.generated.js'),
]);

assert.match(page, /accountDialog/);
assert.match(page, /proposalForm/);
assert.match(page, /__SUPABASE_CONFIG__/);
assert.match(index, /SUPABASE_URL/);
assert.match(index, /SUPABASE_ANON_KEY/);
assert.match(client, /submitWikiProposal/);
assert.match(client, /togglePinnedEntry/);
assert.match(client, /toggleFavoriteEntry/);
assert.match(bridge, /wiki_edit_proposals/);
assert.match(bridge, /slug=eq\.juno/);
assert.doesNotMatch(page + index + client + bridge, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
assert.match(assets, /supabase-bridge\.js/);

console.log('Supabase bridge regression passed: UI, runtime config, proposal boundary, existing favorites, pinning, and secret-key guard are present.');
