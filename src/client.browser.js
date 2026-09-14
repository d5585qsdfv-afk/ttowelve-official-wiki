import { enemyMetadata, updateEnemyBody } from '/entry-metadata.js';
const initial=window.__INITIAL_ENTRIES__||[];
let entries=[...initial],activeCategory='all',currentEntry=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const labels={all:'収録情報',weapons:'武器種図鑑',cards:'カード図鑑',medicines:'薬図鑑',jobs:'ジョブ図鑑',emblems:'紋章図鑑',rings:'リンクリング図鑑',enemies:'敵図鑑＆攻略情報',other:'戦闘・報酬'};
const vundClasses=['Gamers','Collapse','Adventure','Sun','Mirror','Saver','Reverse','Mixing','StarRail','Genshin','Bright&Story','#Compass'];
const accents={lime:'#a8dba8',amber:'#edcb80',rose:'#ff90ac',violet:'#a794ff',ice:'#8ee6ff',sky:'#78bfff',red:'#ff887b',teal:'#79dbca'};
const filterFields=[['#enemyVundClass','vundClass','すべてのVUNDクラス'],['#enemyClass','classification','すべての分類'],['#enemyChapter','chapter','すべての章'],['#enemyLocation','location','すべての場所']];
const cardFilterFields=['#cardLevel','#cardRole','#cardChannel'];
const medicineFilterFields=['#medicineTiming'];
const jobFilterFields=['#jobClass'];
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showArchive(){$('#modeSelect').classList.add('hidden');$('#archive').classList.remove('hidden');document.body.classList.add('archive-view');window.scrollTo({top:0});render()}
function showHome(){$('#archive').classList.add('hidden');$('#modeSelect').classList.remove('hidden');document.body.classList.remove('archive-view');window.scrollTo({top:0})}
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
  populateCardFilters();populateMedicineFilters();populateJobFilters();
}
function normalizeDigits(value=''){return String(value).replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0))}
function cardMetadata(entry){const subtitle=entry.subtitle||'',body=entry.body||'';return {role:subtitle.split('｜')[0]||'未分類',channel:(subtitle.match(/チャンネル([^｜]+)/)||[])[1]||'セット発動',levels:[...body.matchAll(/レベル([０-９0-9]+)/g)].map(match=>normalizeDigits(match[1])).filter((value,index,all)=>all.indexOf(value)===index)}}
function medicineMetadata(entry){const subtitle=entry.subtitle||'';return {timing:subtitle.split('｜')[1]||'通常'}}
function jobMetadata(entry){return {characterClass:entry.characterClass||'クラス未確定',sourceClass:(entry.subtitle||'').split('｜')[1]||''}}
function compactDamage(value=''){const values=value.split('/').map(item=>item.trim()).filter(Boolean);return values.length>1?values[0]+' → '+values.at(-1):value||'未設定'}
function weaponMetadata(entry){
  const parts=String(entry.subtitle||'').split('｜').map(value=>value.trim()).filter(Boolean),body=String(entry.body||'');
  const field=label=>(body.match(new RegExp('^'+label+'[｜|：:]\\s*(.*)$','m'))||[])[1]?.trim()||'';
  return {tacticalType:parts[0]||'—',type:parts[1]||'未分類',classification:field('基本分類')||parts.slice(2).join('、')||'未設定',damage:compactDamage(field('基礎ダメージ')),multiplier:(body.match(/属性倍率\s*([０-９0-9.]+倍)/)||[])[1]||'—'};
}
function enemyCardMetadata(entry){
  const body=String(entry.body||''),base=enemyMetadata(entry),lines=body.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  return {...base,number:String(entry.subtitle||'').split('｜')[0]||'No.—',hp:(body.match(/^HP[-｜|：:]\s*(.*)$/m)||[])[1]?.trim()||'未設定',affinity:lines.find(line=>/^炎.+氷.+雷/.test(line))||'属性情報なし',action:(lines.find(line=>/^.+?-\s*[０-９0-9]+[～~-]/.test(line))||'').split('-')[0]||'行動情報なし'};
}
function fillFilterSelect(selector,values,emptyLabel,format=value=>value){const select=$(selector),previous=select.value,counts=new Map();values.forEach(value=>counts.set(value,(counts.get(value)||0)+1));select.innerHTML=`<option value="">${emptyLabel}</option>`+[...counts.keys()].map(value=>`<option value="${esc(value)}">${esc(format(value))} (${counts.get(value)})</option>`).join('');select.value=counts.has(previous)?previous:''}
function populateCardFilters(){const cards=entries.filter(entry=>entry.category==='cards'),metas=cards.map(cardMetadata);fillFilterSelect('#cardLevel',metas.flatMap(meta=>meta.levels).sort((a,b)=>Number(a)-Number(b)),'すべてのレベル',value=>'Lv.'+value);const roleOrder=['Attack','Support','Health','Counter','Character'];fillFilterSelect('#cardRole',metas.map(meta=>meta.role).filter(role=>roleOrder.includes(role)),'すべてのロール');fillFilterSelect('#cardChannel',metas.map(meta=>meta.channel).sort((a,b)=>normalizeDigits(a).localeCompare(normalizeDigits(b),'ja',{numeric:true})),'すべてのチャンネル',value=>value==='セット発動'?'セット発動':'CH '+normalizeDigits(value))}
function populateMedicineFilters(){const timings=entries.filter(entry=>entry.category==='medicines').map(medicineMetadata).map(meta=>meta.timing);fillFilterSelect('#medicineTiming',timings,'すべての区分')}
function populateJobFilters(){const classTitles=new Map();for(const entry of entries.filter(entry=>entry.category==='jobs')){const className=jobMetadata(entry).characterClass;if(!classTitles.has(className))classTitles.set(className,new Set());classTitles.get(className).add(entry.title)}const counts=new Map([...classTitles].map(([className,titles])=>[className,titles.size]));const select=$('#jobClass'),previous=select.value;select.innerHTML='<option value="">すべてのクラス</option>'+vundClasses.map(value=>`<option value="${esc(value)}">${esc(value)} (${counts.get(value)||0})</option>`).join('')+`<option value="クラス未確定">クラス未確定 (${counts.get('クラス未確定')||0})</option>`;select.value=vundClasses.includes(previous)||previous==='クラス未確定'?previous:''}
function filtered(){
  const q=$('#search').value.trim().toLowerCase();
  const list=entries.filter(e=>{
    if(activeCategory!=='all'&&e.category!==activeCategory)return false;
    if(q&&![e.title,e.subtitle,e.summary,e.body,...(e.tags||[])].join(' ').toLowerCase().includes(q))return false;
    if(activeCategory==='enemies'){
      const meta=enemyMetadata(e);
      if(filterFields.some(([selector,key])=>$(selector).value&&$(selector).value!==meta[key]))return false;
    }
    if(activeCategory==='cards'){const meta=cardMetadata(e);if($('#cardLevel').value&&!meta.levels.includes($('#cardLevel').value))return false;if($('#cardRole').value&&meta.role!==$('#cardRole').value)return false;if($('#cardChannel').value&&meta.channel!==$('#cardChannel').value)return false}
    if(activeCategory==='medicines'&&$('#medicineTiming').value&&medicineMetadata(e).timing!==$('#medicineTiming').value)return false;
    if(activeCategory==='jobs'&&$('#jobClass').value&&jobMetadata(e).characterClass!==$('#jobClass').value)return false;
    return true;
  });
  const sort=$('#sort').value;
  return list.sort(sort==='title'?(a,b)=>a.title.localeCompare(b.title,'ja'):sort==='updated'?(a,b)=>(b.updatedAt||0)-(a.updatedAt||0):(a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
}
function render(){
  const list=filtered();$('#countAll').textContent=entries.length;$('#resultTitle').textContent=labels[activeCategory];$('#resultCount').textContent=list.length+'件';$('#empty').classList.toggle('hidden',list.length>0);$('#enemyFilters').classList.toggle('hidden',activeCategory!=='enemies');$('#cardFilters').classList.toggle('hidden',activeCategory!=='cards');$('#medicineFilters').classList.toggle('hidden',activeCategory!=='medicines');$('#jobFilters').classList.toggle('hidden',activeCategory!=='jobs');
  $('#entryGrid').innerHTML=list.map(e=>{
    const meta=e.category==='enemies'?enemyCardMetadata(e):null,weapon=e.category==='weapons'?weaponMetadata(e):null,job=e.category==='jobs'?jobMetadata(e):null;
    const card=e.category==='cards'?cardMetadata(e):null,medicine=e.category==='medicines'?medicineMetadata(e):null;
    const cardClass=[meta?'enemy-entry':weapon?'weapon-entry':medicine?'medicine-entry':'',e.image?'has-image':'',e.status&&e.status!=='実装済み'?'pending-entry':''].filter(Boolean).join(' ');
    const quickFacts=weapon?`<dl class="entry-stats weapon-stats"><div><dt>戦術タイプ</dt><dd>${esc(weapon.tacticalType)}</dd></div><div><dt>系統</dt><dd>${esc(weapon.type)}</dd></div><div><dt>基礎</dt><dd>${esc(weapon.damage)}</dd></div><div><dt>属性倍率</dt><dd>${esc(weapon.multiplier)}</dd></div></dl><p class="entry-classification"><span>戦闘特性</span>${esc(weapon.classification)}</p>`:meta?`<dl class="entry-stats enemy-stats"><div><dt>VUNDクラス</dt><dd>${esc(meta.vundClass||'—')}</dd></div><div><dt>HP</dt><dd>${esc(meta.hp)}</dd></div><div><dt>章</dt><dd>${esc(meta.chapter)}</dd></div><div class="wide"><dt>出現場所</dt><dd>${esc(meta.location)}</dd></div></dl><p class="affinity" aria-label="属性相性">${esc(meta.affinity)}</p><p class="enemy-action"><span>主な行動</span>${esc(meta.action)}</p>`:'';
    return `<button class="entry ${cardClass}" data-id="${esc(e.id)}" aria-label="${esc(e.title)}の詳細を開く" style="--accent:${accents[e.accent]||accents.lime}">${e.image?`<span class="entry-media"><img src="${esc(e.image)}" alt="${esc(e.imageAlt||e.title)}" loading="lazy"></span>`:''}<span class="entry-overline"><span class="entry-kind">${esc(labels[e.category]||e.category)}</span>${meta?`<span class="enemy-class-badge">◇ ${esc(meta.vundClass||meta.classification)}</span>`:e.status&&e.status!=='実装済み'?`<span class="status-badge">${esc(e.status)}</span>`:weapon?`<span class="weapon-type-badge">${esc(weapon.tacticalType)}</span>`:job?`<span class="weapon-type-badge">${esc(job.characterClass)}</span>`:''}</span><h2>${esc(e.title)}</h2>${meta?`<span class="subtitle">${esc(meta.number)}${meta.vundClass?`｜${esc(meta.vundClass)}`:''}</span>`:!weapon?`<span class="subtitle">${esc(e.subtitle)}</span>`:''}${quickFacts}${job?`<span class="entry-facts">クラス｜${esc(job.characterClass)}${job.sourceClass&&job.characterClass==='クラス未確定'?`｜原典｜${esc(job.sourceClass)}`:''}</span>`:''}${card?`<span class="entry-facts">Lv.${card.levels.join(' · ')}｜${esc(card.role)}｜${esc(card.channel==='セット発動'?'セット':'CH '+normalizeDigits(card.channel))}</span>`:''}${medicine?`<span class="entry-facts">${esc(medicine.timing)}｜調合薬</span>`:''}<p class="summary">${esc(e.summary)}</p><footer><span class="tags">${(e.tags||[]).filter(tag=>!weapon||![weapon.tacticalType,weapon.type].includes(tag)).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</span><span class="entry-open">詳細 <span aria-hidden="true">↗</span></span></footer></button>`;
  }).join('');
  $$('#entryGrid img').forEach(image=>{image.addEventListener('error',()=>markImageFailure(image));if(image.complete&&!image.naturalWidth)markImageFailure(image)});
}
function openDetail(id){
  currentEntry=entries.find(e=>e.id===id);if(!currentEntry)return;
  $('#detailAccent').style.background=accents[currentEntry.accent]||accents.lime;$('#detailKind').textContent=labels[currentEntry.category];$('#detailTitle').textContent=currentEntry.title;$('#detailSubtitle').textContent=currentEntry.subtitle||'';$('#detailSummary').textContent=currentEntry.summary||'';$('#detailBody').textContent=currentEntry.body||'';$('#detailSource').textContent=(currentEntry.source||'クラウド編集')+'｜改訂 '+(currentEntry.revision||0);$('#detailTags').innerHTML=(currentEntry.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');const detailImage=$('#detailImage');detailImage.classList.remove('image-failed');detailImage.parentElement?.classList.remove('image-unavailable');detailImage.classList.toggle('hidden',!currentEntry.image);detailImage.src=currentEntry.image||'';detailImage.alt=currentEntry.imageAlt||currentEntry.title;
  const isEnemy=currentEntry.category==='enemies';$('#detailEnemyFacts').classList.toggle('hidden',!isEnemy);
  if(isEnemy){const meta=enemyMetadata(currentEntry);$('#detailEnemyFacts').innerHTML=[['VUNDクラス',meta.vundClass||'—'],['分類',meta.classification],['章',meta.chapter],['出現場所',meta.location]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}
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
  else if(action==='reset-database-filters'){[...cardFilterFields,...medicineFilterFields,...jobFilterFields].forEach(selector=>$(selector).value='');$('#search').value='';render()}
  else if(action==='paste-ccfolia')navigator.clipboard.readText().then(text=>{const area=$('#editorForm').elements.body;area.value+=(area.value?'\n':'')+text;$('#formMessage').textContent='クリップボードの文章を追加しました。'}).catch(()=>$('#formMessage').textContent='詳細欄へ直接貼り付けてください。');
});
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);
filterFields.forEach(([selector])=>$(selector).addEventListener('change',render));
 [...cardFilterFields,...medicineFilterFields,...jobFilterFields].forEach(selector=>$(selector).addEventListener('change',render));
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
function markImageFailure(image){image.classList.add('image-failed');image.parentElement?.classList.add('image-unavailable')}
$$('img').forEach(image=>{image.addEventListener('error',()=>markImageFailure(image));if(image.getAttribute('src')&&image.complete&&!image.naturalWidth)markImageFailure(image)});
populateFilters();render();load();
