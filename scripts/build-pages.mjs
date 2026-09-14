import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import './build.mjs';
import { renderPage } from '../src/page.js';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'out');
if (dirname(output) !== root) throw new Error('Unexpected output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, 'public'), output, { recursive: true });
await writeFile(resolve(output, 'index.html'), renderPage({
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}));
await writeFile(resolve(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
console.log('Generated the current cinema UI and Worker for Cloudflare Pages.');
