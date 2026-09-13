import http from 'node:http';
import worker from '../src/index.js';

const rows = new Map();
const db = {
  prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async all() { return { results: [...rows.values()].filter(row => !row.is_deleted) }; },
      async first() { const row = rows.get(args[0]); return row ? { revision: row.revision } : null; },
      async run() {
        const [id, game, category, title, subtitle, summary, body, tags_json, accent, sort_order, revision, updated_at, updated_by] = args;
        rows.set(id, { id, game, category, title, subtitle, summary, body, tags_json, accent, sort_order, revision, is_deleted: 0, updated_at, updated_by });
        return { meta: { changes: 1 } };
      }
    };
  }
};

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(`http://localhost:4173${req.url}`, { method: req.method, headers: req.headers, body: ['GET','HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
  const response = await worker.fetch(request, { DB: db }, {});
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
