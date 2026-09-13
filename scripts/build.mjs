import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const clientSource = await readFile(resolve(root, 'src', 'client.browser.js'), 'utf8');
await writeFile(
  resolve(root, 'src', 'client-asset.generated.js'),
  `export const clientSource = ${JSON.stringify(clientSource)};\n`,
);
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'server'), { recursive: true });
await mkdir(resolve(dist, 'out'), { recursive: true });
await mkdir(resolve(dist, '.openai'), { recursive: true });
await mkdir(resolve(dist, '.openai', 'drizzle'), { recursive: true });
await cp(resolve(root, 'src'), resolve(dist, 'server'), { recursive: true });
await cp(resolve(root, 'public'), resolve(dist, 'out'), { recursive: true });
// Bundle the existing artwork with the Worker: this host does not supply an
// automatic static-file binding for dist/out. Never send the HTML fallback for assets.
const assets = {};
for (const [name, type] of Object.entries({
  'ttowelve-studio.webp': 'image/webp', 'ten-saviors.webp': 'image/webp',
  'soleil.webp': 'image/webp', 'idlet.webp': 'image/webp',
  'ten-saviors-logo.png': 'image/png',
})) {
  assets['/assets/' + name] = { type, base64: (await readFile(resolve(root, 'public', 'assets', name))).toString('base64') };
}
assets['/entry-metadata.js'] = { type: 'text/javascript; charset=utf-8', base64: (await readFile(resolve(root, 'src', 'entry-metadata.js'))).toString('base64') };
await writeFile(resolve(dist, 'server', 'assets.generated.js'), `export const assets = ${JSON.stringify(assets)};\n`);
await cp(resolve(root, 'drizzle'), resolve(dist, '.openai', 'drizzle'), { recursive: true });
const hosting = JSON.parse(await readFile(resolve(root, '.openai', 'hosting.json'), 'utf8'));
await writeFile(resolve(dist, '.openai', 'hosting.json'), JSON.stringify(hosting, null, 2) + '\n');
console.log('Built dist/server/index.js');
