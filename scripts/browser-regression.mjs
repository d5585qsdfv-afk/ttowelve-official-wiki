import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(join(tmpdir(), "ttowelve-cdp-"));
const port = 9333;
const chrome = spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu"], { stdio:"ignore", windowsHide:true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cdpTarget() {
  for (let attempt=0;attempt<30;attempt++) {
    try {
      const response=await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:4173/games/juno/items/`,{method:"PUT"});
      if(response.ok) return response.json();
    } catch {}
    await wait(100);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

const target=await cdpTarget();
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
let nextId=0; const pending=new Map();
socket.addEventListener("message",(event)=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}});
function send(method,params={}) { return new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));}); }
async function evaluate(expression) { const result=await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true}); if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
async function waitFor(expression) { for(let attempt=0;attempt<30;attempt++){if(await evaluate(expression)) return; await wait(100);} throw new Error(`Timed out waiting for ${expression}`); }
async function setInput(selector,value) { return evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.focus();const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;Reflect.apply(setter,el,[${JSON.stringify(value)}]);el.dispatchEvent(new window.Event("input",{bubbles:true}));return true})()`); }
async function navigate(url) { await send("Page.navigate",{url}); await wait(550); }

try {
  await send("Runtime.enable"); await send("Page.enable");
  await waitFor(`document.querySelector('[data-game="ten-saviors"]')`);
  await waitFor(`document.querySelector('#countAll')?.textContent === "807"`);
  await evaluate(`(()=>{document.querySelector('[data-game="ten-saviors"]').click();return true})()`);
  await waitFor(`document.querySelector('[data-category="cards"]') && document.querySelector('#resultCount')?.textContent`);
  await evaluate(`(()=>{document.querySelector('[data-category="cards"]').click();return true})()`); await wait(300);
  let state=await evaluate(`({selected:document.querySelector('[data-category="cards"]')?.getAttribute("aria-pressed"),count:document.querySelector('#resultCount')?.textContent})`);
  if(state.selected!=="true"||state.count!=="35件") throw new Error(`Category failed: ${JSON.stringify(state)}`);
  await setInput('#search',"ムクイルカ"); await wait(150);
  state=await evaluate(`({count:document.querySelector('#resultCount')?.textContent,cards:document.querySelectorAll('#entryGrid .entry').length})`);
  if(state.cards!==1) throw new Error(`Local search failed: ${JSON.stringify(state)}`);
  await setInput('#search',"一致しない語"); await wait(150);
  if(!(await evaluate(`document.querySelector("#empty")?.classList.contains("hidden")===false`))) throw new Error("Empty state failed");
  await setInput('#search',""); await evaluate(`(()=>{const el=document.querySelector('#cardRole');el.value="Attack";el.dispatchEvent(new Event("change",{bubbles:true}));return true})()`); await wait(150);
  state=await evaluate(`({count:document.querySelector('#resultCount')?.textContent,cards:document.querySelectorAll('#entryGrid .entry').length})`);
  if(state.cards!==13||state.count!=="13件") throw new Error(`Card role filter failed: ${JSON.stringify(state)}`);
  await evaluate(`(()=>{document.querySelector('#cardRole').value="";document.querySelector('#cardRole').dispatchEvent(new Event("change",{bubbles:true}));document.querySelector('#entryGrid .entry-hit').click();return true})()`); await wait(150);
  if(!(await evaluate(`document.querySelector('#detailDialog')?.open&&document.querySelector('#detailTitle')?.textContent.includes("ムクイルカ")`))) throw new Error("Detail dialog failed");
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await navigate("http://127.0.0.1:4173/games/idlet/");
  if(!(await evaluate(`document.body.textContent.includes("COMING SOON")`))) throw new Error("Coming Soon failed");
  const viewport=await evaluate(`({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})`);
  if(viewport.scroll>viewport.client) throw new Error(`Horizontal overflow: ${JSON.stringify(viewport)}`);
  const missingAsset=await fetch("http://127.0.0.1:4173/assets/does-not-exist.webp");
  if(missingAsset.status!==404) throw new Error(`Missing asset returned ${missingAsset.status}`);
  console.log("Browser regression passed: lobby navigation, category selection, local search, empty state, role filter, detail dialog, mobile layout, Coming Soon, and missing-asset 404.");
} finally {
  socket.close(); chrome.kill();
}
