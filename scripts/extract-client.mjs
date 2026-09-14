import { readFile, writeFile } from 'node:fs/promises';

const pagePath = new URL('../src/page.js', import.meta.url);
let page = await readFile(pagePath, 'utf8');
const marker = 'const client = String.raw`';
const start = page.indexOf(marker);
if (start < 0) throw new Error('Embedded client block was not found.');
const contentStart = start + marker.length;
const end = page.indexOf('\n`;', contentStart);
if (end < 0) throw new Error('Embedded client block terminator was not found.');
const client = page.slice(contentStart, end).replace(/^\r?\n/, '');
page = page.slice(0, start).trimEnd() + '\n';
page = page.replace('<script>${client}</script>', '<script src="/app.js"></script>');
await writeFile(new URL('../src/client.browser.js', import.meta.url), client + '\n', 'utf8');
await writeFile(pagePath, page, 'utf8');
console.log('Extracted browser client from src/page.js.');
