import { enemyMetadata, updateEnemyBody } from '/entry-metadata.js';
const initial=window.__INITIAL_ENTRIES__||[];
let entries=[...initial],activeCategory='all',currentEntry=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const labels={all:'収録情報',weapons:'武器種図鑑',cards:'カード図鑑',medicines:'薬図鑑',jobs:'ジョブ図鑑',emblems:'紋章図鑑',enemies:'敵図鑑＆攻略情報',other:'戦闘・報酬'};
const accents={lime:'#a8dba8',amber:'#edcb80',rose:'#ff90ac',violet:'#a794ff',ice:'#8ee6ff',sky:'#78bfff',red:'#ff887b',teal:'#79dbca'};
const filterFields=[['#enemyClass','classification','すべての分類'],['#enemyChapter','chapter','すべての章'],['#enemyLocation','location','すべての場所']];
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showArchive(){$('#modeSelect').classList.add('hidden');$('#archive').classList.remove('hidden');window.scrollTo({top:0});render()}
function showHome(){$('#archive').classList.add('hidden');$('#modeSelect').classList.remove('hidden');window.scrollTo({top:0})}
function populateFilters(){
  const enemies=entries.filter(e=>e.category==='enemies').map(enemyMetadata);
  for(const [selector,key,label] of filterFields){
    const select=$(selector),previous=select.value,counts=new Map();
    enemies.forEach(e=>counts.set(e[key],(counts.get(e[key])||0)+1));
    // Chapter labels use Japanese numerals: preserve the source order rather than kana sorting.
    const values=[...counts.keys()];
    if(key!=='chapter')values.sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}));
    select.innerHTML=`<option value="">${label}</option>`+values.map(value=>`<option value="${esc(value)}">${esc(value)} (${counts.get(value)})</option>`).join('');
    select.value=counts.has(previous)?previous:'';
  }
  $('#enemyClassOptions').innerHTML=[...new Set(['通常敵','強敵','ボス',...enemies.map(e=>e.classification)])].map(value=>`<option value="${esc(value)}"></option>`).join('');
}
function filtered(){
  const q=$('#search').value.trim().toLowerCase();
  const list=entries.filter(e=>{
    if(activeCategory!=='all'&&e.category!==activeCategory)return false;
    if(q&&![e.title,e.subtitle,e.summary,e.body,...(e.tags||[])].join(' ').toLowerCase().includes(q))return false;
    if(activeCategory==='enemies'){
      const meta=enemyMetadata(e);
      if(filterFields.some(([selector,key])=>$(selector).value&&$(selector).value!==meta[key]))return false;
    }
    return true;
  });
  const sort=$('#sort').value;
  return list.sort(sort==='title'?(a,b)=>a.title.localeCompare(b.title,'ja'):sort==='updated'?(a,b)=>(b.updatedAt||0)-(a.updatedAt||0):(a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
}
function render(){
  const list=filtered();$('#countAll').textContent=entries.length;$('#resultTitle').textContent=labels[activeCategory];$('#resultCount').textContent=list.length+'件';$('#empty').classList.toggle('hidden',list.length>0);$('#enemyFilters').classList.toggle('hidden',activeCategory!=='enemies');
  $('#entryGrid').innerHTML=list.map(e=>{
    const meta=e.category==='enemies'?enemyMetadata(e):null;
    return `<button class="entry ${meta?'enemy-entry':''}" data-id="${esc(e.id)}" style="--accent:${accents[e.accent]||accents.lime}"><span class="entry-kind">${esc(labels[e.category]||e.category)}</span>${meta?`<span class="enemy-class-badge">◇ ${esc(meta.classification)}</span>`:''}<h2>${esc(e.title)}</h2><span class="subtitle">${esc(meta?[meta.chapter,meta.location].join('｜'):e.subtitle)}</span><p class="summary">${esc(e.summary)}</p><footer><span class="tags">${(e.tags||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</span><span class="entry-arrow">↗</span></footer></button>`;
  }).join('');
}
function openDetail(id){
  currentEntry=entries.find(e=>e.id===id);if(!currentEntry)return;
  $('#detailAccent').style.background=accents[currentEntry.accent]||accents.lime;$('#detailKind').textContent=labels[currentEntry.category];$('#detailTitle').textContent=currentEntry.title;$('#detailSubtitle').textContent=currentEntry.subtitle||'';$('#detailSummary').textContent=currentEntry.summary||'';$('#detailBody').textContent=currentEntry.body||'';$('#detailSource').textContent=(currentEntry.source||'クラウド編集')+'｜改訂 '+(currentEntry.revision||0);$('#detailTags').innerHTML=(currentEntry.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
  const isEnemy=currentEntry.category==='enemies';$('#detailEnemyFacts').classList.toggle('hidden',!isEnemy);
  if(isEnemy){const meta=enemyMetadata(currentEntry);$('#detailEnemyFacts').innerHTML=[['分類',meta.classification],['章',meta.chapter],['出現場所',meta.location]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}
  $('#detailDialog').showModal();
}
function toggleEnemyEditor(){const enemy=$('#editorForm').elements.category.value==='enemies';$('#enemyEditor').classList.toggle('hidden',!enemy);$('#enemyEditor').disabled=!enemy}
function openEditor(entry){
  const f=$('#editorForm');f.reset();$('#formMessage').textContent='';$('#editorHeading').textContent=entry?'記録を編集':'記録を追加';
  if(entry){
    for(const key of ['id','revision','category','accent','title','subtitle','summary','body'])f.elements[key].value=entry[key]??'';
    f.elements.tags.value=(entry.tags||[]).join(', ');
    if(entry.category==='enemies'){const meta=enemyMetadata(entry);f.elements.enemyClass.value=meta.classification==='未分類'?'':meta.classification;f.elements.enemyChapter.value=meta.chapter==='未設定'?'':meta.chapter;f.elements.enemyLocation.value=meta.location==='未設定'?'':meta.location}
  }else{f.elements.id.value='';f.elements.revision.value='0';if(activeCategory!=='all')f.elements.category.value=activeCategory}
  toggleEnemyEditor();$('#editorDialog').showModal();
}
async function load(){
  try{const response=await fetch('/api/entries',{headers:{accept:'application/json'}});if(!response.ok)throw new Error();const data=await response.json();entries=data.entries||initial;$('#syncState').classList.remove('error');$('#syncState').classList.add('ready');$('#syncState').innerHTML='<i></i>クラウド同期'}
  catch{$('#syncState').classList.add('error');$('#syncState').innerHTML='<i></i>初期データ表示中'}
  populateFilters();render();
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;const action=b.dataset.action;
  if(b.dataset.game==='ten-saviors')showArchive();else if(b.dataset.id)openDetail(b.dataset.id);
  else if(b.dataset.category){activeCategory=b.dataset.category;$$('.category').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});render()}
  else if(action==='home')showHome();else if(action==='open-editor')openEditor();else if(action==='close-detail')$('#detailDialog').close();else if(action==='close-editor')$('#editorDialog').close();
  else if(action==='edit-current'){$('#detailDialog').close();openEditor(currentEntry)}
  else if(action==='reset-enemy-filters'){filterFields.forEach(([selector])=>$(selector).value='');$('#search').value='';render()}
  else if(action==='paste-ccfolia')navigator.clipboard.readText().then(text=>{const area=$('#editorForm').elements.body;area.value+=(area.value?'\n':'')+text;$('#formMessage').textContent='クリップボードの文章を追加しました。'}).catch(()=>$('#formMessage').textContent='詳細欄へ直接貼り付けてください。');
});
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);
filterFields.forEach(([selector])=>$(selector).addEventListener('change',render));
$('#editorForm').elements.category.addEventListener('change',toggleEnemyEditor);
for(const selector of ['#detailDialog','#editorDialog'])$(selector).addEventListener('click',event=>{if(event.target===$(selector))$(selector).close()});
$('#editorForm').addEventListener('submit',async event=>{
  event.preventDefault();const f=event.currentTarget,fd=new FormData(f),body={id:fd.get('id')||undefined,revision:Number(fd.get('revision')||0),game:'ten-saviors',category:fd.get('category'),accent:fd.get('accent'),title:fd.get('title'),subtitle:fd.get('subtitle'),summary:fd.get('summary'),body:fd.get('body'),tags:String(fd.get('tags')||'').split(/[,、]/).map(x=>x.trim()).filter(Boolean)};
  if(body.category==='enemies'){body.enemyClass=fd.get('enemyClass');body.enemyChapter=fd.get('enemyChapter');body.enemyLocation=fd.get('enemyLocation');body.body=updateEnemyBody(body.body,{classification:body.enemyClass,chapter:body.enemyChapter,location:body.enemyLocation})}
  const submit=f.querySelector('[type="submit"]');submit.disabled=true;$('#formMessage').textContent='保存しています…';
  try{
    const response=await fetch('/api/entries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await response.json();
    if(response.status===409){await load();const latest=entries.find(x=>x.id===body.id);if(latest)openEditor(latest);$('#formMessage').textContent='別の端末で更新されています。最新の内容を表示しました。編集内容を確認して保存してください。';return}
    if(!response.ok)throw new Error(data.error||'保存できませんでした');
    entries=entries.filter(x=>x.id!==data.entry.id).concat(data.entry);populateFilters();render();$('#syncState').classList.add('ready');$('#editorDialog').close();
  }catch(error){$('#formMessage').textContent=error.message||'保存できませんでした。'}finally{submit.disabled=false}
});
function markImageFailure(image){image.classList.add('image-failed');image.parentElement.classList.add('image-unavailable')}
$$('img').forEach(image=>{image.addEventListener('error',()=>markImageFailure(image));if(image.complete&&!image.naturalWidth)markImageFailure(image)});
populateFilters();render();load();
