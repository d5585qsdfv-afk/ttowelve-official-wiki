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
await mkdir(resolve(dist, '.openai'), { recursive: true });
await mkdir(resolve(dist, '.openai', 'drizzle'), { recursive: true });
await cp(resolve(root, 'src'), resolve(dist, 'server'), { recursive: true });
await cp(resolve(root, 'drizzle'), resolve(dist, '.openai', 'drizzle'), { recursive: true });
const hosting = JSON.parse(await readFile(resolve(root, '.openai', 'hosting.json'), 'utf8'));
await writeFile(resolve(dist, '.openai', 'hosting.json'), JSON.stringify(hosting, null, 2) + '\n');
console.log('Built dist/server/index.js');
