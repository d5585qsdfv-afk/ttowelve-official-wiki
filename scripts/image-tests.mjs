// Run only when image testing is requested. Build the Worker first.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import worker from '../dist/server/index.js';

const images = {
  'ttowelve-studio.webp': 'image/webp',
  'ten-saviors.webp': 'image/webp',
  'soleil.webp': 'image/webp',
  'idlet.webp': 'image/webp',
  'ten-saviors-logo.png': 'image/png',
};
for (const [name, type] of Object.entries(images)) {
  test(`${name}: correct MIME, original bytes, cache, HEAD`, async () => {
    const url = 'https://example.test/assets/' + name;
    const response = await worker.fetch(new Request(url), {}, {});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), type);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('cache-control'), /max-age=/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, await readFile(new URL('../public/assets/' + name, import.meta.url)));
    if (type === 'image/webp') {
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    } else assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const head = await worker.fetch(new Request(url, {method:'HEAD'}), {}, {});
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-type'), type);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  });
}
test('missing image returns 404 instead of HTML with a success status', async () => {
  const response = await worker.fetch(new Request('https://example.test/assets/missing.webp'), {}, {});
  assert.equal(response.status, 404);
  assert.doesNotMatch(response.headers.get('content-type'), /text\/html/);
});
test('image URL query strings preserve the original image', async () => {
  const response = await worker.fetch(new Request('https://example.test/assets/ten-saviors.webp?v=2'), {}, {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/webp');
});
test('image paths reject writes', async () => {
  const response = await worker.fetch(new Request('https://example.test/assets/ten-saviors.webp', {method:'POST'}), {}, {});
  assert.equal(response.status, 405);
});
test('every image referenced by the rendered page resolves to an image', async () => {
  const page = await worker.fetch(new Request('https://example.test/'), {}, {});
  const html = await page.text();
  const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
  assert.equal(sources.length, 7);
  for (const src of sources) {
    const response = await worker.fetch(new Request(new URL(src,'https://example.test')), {}, {});
    assert.equal(response.status, 200, src);
    assert.match(response.headers.get('content-type'), /^image\//, src);
  }
});
