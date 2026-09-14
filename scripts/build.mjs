import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const clientSource = await readFile(resolve(root, 'src', 'client.browser.js'), 'utf8');
await writeFile(
  resolve(root, 'src', 'client-asset.generated.js'),
  `export const clientSource = ${JSON.stringify(clientSource)};\n`,
);
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'server'), { recursive: true });
await mkdir(resolve(dist, '.openai'), { recursive: true });
await mkdir(resolve(dist, '.openai', 'drizzle'), { recursive: true });
await cp(resolve(root, 'src'), resolve(dist, 'server'), { recursive: true });
// Bundle the existing artwork with the Worker: this host does not supply an
// automatic static-file binding. Never send the HTML fallback for assets.
const assets = {};
const mediaTypes = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
for (const name of await readdir(resolve(root, 'public', 'assets'))) {
  const type = mediaTypes[extname(name).toLowerCase()];
  if (!type) continue;
  assets['/assets/' + name] = { type, base64: (await readFile(resolve(root, 'public', 'assets', name))).toString('base64') };
}
assets['/entry-metadata.js'] = { type: 'text/javascript; charset=utf-8', base64: (await readFile(resolve(root, 'src', 'entry-metadata.js'))).toString('base64') };
assets['/weapon-metadata.js'] = { type: 'text/javascript; charset=utf-8', base64: (await readFile(resolve(root, 'src', 'weapon-metadata.js'))).toString('base64') };
assets['/tagging.js'] = { type: 'text/javascript; charset=utf-8', base64: (await readFile(resolve(root, 'src', 'tagging.js'))).toString('base64') };
await writeFile(resolve(dist, 'server', 'assets.generated.js'), `export const assets = ${JSON.stringify(assets)};\n`);
await cp(resolve(root, 'drizzle'), resolve(dist, '.openai', 'drizzle'), { recursive: true });
const hosting = JSON.parse(await readFile(resolve(root, '.openai', 'hosting.json'), 'utf8'));
await writeFile(resolve(dist, '.openai', 'hosting.json'), JSON.stringify(hosting, null, 2) + '\n');
console.log('Built dist/server/index.js');
