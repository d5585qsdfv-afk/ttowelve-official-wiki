import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml", ".json":"application/json" };
createServer(async (request,response)=>{
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    let file = normalize(join(root, pathname));
    if (!file.startsWith(normalize(root))) throw new Error("invalid path");
    try { if ((await stat(file)).isDirectory()) file=join(file,"index.html"); } catch { if (!extname(file)) file=join(file,"index.html"); }
    const body=await readFile(file); response.writeHead(200,{"content-type":types[extname(file)]??"application/octet-stream"}); response.end(body);
  } catch { const body=await readFile(join(root,"404.html")); response.writeHead(404,{"content-type":"text/html; charset=utf-8"}); response.end(body); }
}).listen(4173,"127.0.0.1",()=>console.log("Preview: http://127.0.0.1:4173"));
