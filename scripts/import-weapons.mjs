import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-weapons.mjs <exported-markdown>');

const markdown = await readFile(resolve(input), 'utf8');
const startMarker = '## 最終章番外編アップデート最新性能';
const endMarker = '## 四章～五章以降の武器性能';
const start = markdown.indexOf(startMarker);
const end = markdown.indexOf(endMarker, start + startMarker.length);
if (start < 0 || end < 0) throw new Error('Latest weapon section was not found.');

const section = markdown.slice(start + startMarker.length, end);
const chunks = section.split(/^### /m).slice(1);
const slug = (value) => Array.from(value).map((char) => char.codePointAt(0).toString(16)).join('-');
const accents = ['lime', 'amber', 'rose', 'violet', 'ice', 'sky', 'red', 'teal'];

const entries = chunks.map((chunk, index) => {
  const lines = chunk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const heading = lines.shift().replaceAll('\\&', '&');
  const match = heading.match(/^(\S+)\s+([^\s]+)\s+(.+)$/);
  const title = match?.[1] || heading;
  const grade = match?.[2] || '';
  const alias = match?.[3] || '';
  const damage = lines.shift() || '';
  const profile = lines.shift() || '';
  const description = lines.join('\n').replaceAll('\\&', '&');
  const firstSentence = description.split(/(?<=[。！？])/)[0] || description.slice(0, 120);
  const tags = ['武器種', grade, alias, ...profile.split('、').slice(1)].filter(Boolean).slice(0, 6);
  return {
    id: `weapon-${slug(title)}`,
    category: 'weapons',
    title,
    subtitle: [grade, alias, profile].filter(Boolean).join('｜'),
    accent: accents[index % accents.length],
    sortOrder: (index + 1) * 10,
    summary: firstSentence.slice(0, 220),
    tags,
    body: [`基礎ダメージ｜${damage}`, `基本分類｜${profile}`, description].filter(Boolean).join('\n\n'),
    source: '武器種ごと基本性能／最終章番外編アップデート最新性能'
  };
});

const output = `// Googleドキュメントの「最終章番外編アップデート最新性能」から生成。\nexport const weaponEntries = ${JSON.stringify(entries, null, 2)};\n`;
await writeFile(resolve('src/weapons.generated.js'), output, 'utf8');
console.log(`Imported ${entries.length} weapon types.`);
