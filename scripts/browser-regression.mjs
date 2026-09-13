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
  await send("Runtime.enable"); await send("Page.enable"); await waitFor(`document.querySelectorAll('[role="tab"]').length===4`); await wait(1000);
  await evaluate(`(()=>{const tab=Array.from(document.querySelectorAll('[role="tab"]')).find((el)=>el.textContent==="カード");tab.click();return true})()`); await wait(300);
  let state=await evaluate(`({selected:Array.from(document.querySelectorAll('[role="tab"]')).find((el)=>el.getAttribute("aria-selected")==="true")?.textContent,count:document.querySelector('.result-count')?.textContent})`);
  if(state.selected!=="カード"||!state.count.includes("5件")) throw new Error(`Tab failed: ${JSON.stringify(state)}`);
  await setInput('.catalog-tools input[type="search"]',"星"); await wait(150);
  state=await evaluate(`({count:document.querySelector('.result-count')?.textContent,cards:document.querySelectorAll('.entity-card').length})`);
  if(state.cards!==1) throw new Error(`Local search failed: ${JSON.stringify(state)}`);
  await setInput('.catalog-tools input[type="search"]',"一致しない語"); await wait(150);
  if(!(await evaluate(`document.body.textContent.includes("該当する情報がありません")`))) throw new Error("Empty state failed");
  await setInput('.catalog-tools input[type="search"]',""); await evaluate(`(()=>{const el=document.querySelector('[aria-label="レアリティで絞り込み"]');el.value="Legendary";el.dispatchEvent(new Event("change",{bubbles:true}));return true})()`); await wait(150);
  if((await evaluate(`document.querySelectorAll('.entity-card').length`))!==1) throw new Error("Rarity filter failed");
  await setInput('.global-search input[type="search"]',"白環"); await wait(150);
  if(!(await evaluate(`document.querySelector('#global-search-results')?.textContent.includes("白環竜ネヴァ")`))) throw new Error("Global search failed");
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await navigate("http://127.0.0.1:4173/games/idlet/");
  if(!(await evaluate(`document.body.textContent.includes("COMING SOON")`))) throw new Error("Coming Soon failed");
  const viewport=await evaluate(`({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})`);
  if(viewport.scroll>viewport.client) throw new Error(`Horizontal overflow: ${JSON.stringify(viewport)}`);
  const notFound=await fetch("http://127.0.0.1:4173/games/juno/jobs/invalid-slug/");
  if(notFound.status!==404) throw new Error(`Invalid slug returned ${notFound.status}`);
  console.log("Browser regression passed: tabs, local search, empty state, rarity filter, global search, Coming Soon, invalid-slug 404.");
} finally {
  socket.close(); chrome.kill();
}
