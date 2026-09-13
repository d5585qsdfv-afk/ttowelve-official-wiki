import { defaultEntries } from './data.js';

const initialData = JSON.stringify(defaultEntries).replaceAll('<', '\\u003c');

export function renderPage() {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#151817">
  <meta name="description" content="ゲーム作成サークル TTwowelve 公式Webアプリ。十の救現主の図鑑・攻略情報を収録。">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>TTowelve Archive｜公式Webアプリ</title>
  <style>${styles}</style>
</head>
<body>
  <a class="skip" href="#main">本文へ移動</a>
  <div class="paper-noise" aria-hidden="true"></div>
  <header class="topbar">
    <button class="brand" data-action="home" aria-label="作品選択へ戻る">
      <span class="brand-mark">T<span>12</span></span>
      <span><strong>TTowelve</strong><small>OFFICIAL ARCHIVE</small></span>
    </button>
    <div class="top-actions">
      <span class="sync" id="syncState"><i></i>同期を確認中</span>
      <button class="icon-button" data-action="open-editor" aria-label="管理・編集">✦ <span>編集</span></button>
    </div>
  </header>

  <main id="main">
    <section class="mode-select" id="modeSelect" aria-labelledby="modeTitle">
      <div class="eyebrow">MODE SELECT</div>
      <h1 id="modeTitle">記録をひらく</h1>
      <p class="lead">TTowelveが描く世界と、その遊び方をひとつの場所に。</p>
      <div class="mode-grid">
        <button class="mode-card active" data-game="ten-saviors">
          <span class="mode-number">01</span><span class="diamond lime">十</span>
          <span class="mode-copy"><strong>十の救現主</strong><small>図鑑・攻略情報を閲覧</small></span><span class="arrow">↗</span>
        </button>
        <button class="mode-card disabled" data-game="soleil">
          <span class="mode-number">02</span><span class="diamond amber">陽</span>
          <span class="mode-copy"><strong>ソレイユの伝承</strong><small>エナルゴス戦記｜乞うご期待</small></span><span class="lock">準備中</span>
        </button>
        <button class="mode-card disabled" data-game="idlet">
          <span class="mode-number">03</span><span class="diamond sky">競</span>
          <span class="mode-copy"><strong>イドレット</strong><small>競技性アライアンスゲーム｜乞うご期待</small></span><span class="lock">準備中</span>
        </button>
      </div>
    </section>

    <section class="archive hidden" id="archive" aria-labelledby="archiveTitle">
      <div class="archive-heading">
        <div><button class="back" data-action="home">← 作品選択</button><div class="eyebrow">THE TEN SAVIORS</div><h1 id="archiveTitle">十の救現主</h1></div>
        <div class="sigil"><span>十</span><small>ARCHIVE</small></div>
      </div>

      <nav class="categories" aria-label="図鑑カテゴリー">
        <button class="category active" data-category="all"><b>総覧</b><small id="countAll">0</small></button>
        <button class="category" data-category="weapons"><b>武器種</b><small>図鑑</small></button>
        <button class="category" data-category="cards"><b>武器カード・薬</b><small>図鑑</small></button>
        <button class="category" data-category="jobs"><b>ジョブ</b><small>図鑑</small></button>
        <button class="category" data-category="emblems"><b>紋章</b><small>図鑑</small></button>
        <button class="category" data-category="enemies"><b>敵＆攻略</b><small>情報</small></button>
        <button class="category" data-category="other"><b>その他</b><small>情報</small></button>
      </nav>

      <div class="tool-row">
        <label class="search"><span>⌕</span><input id="search" type="search" placeholder="名前・効果・タグから検索" autocomplete="off"></label>
        <label class="sort">表示順<select id="sort"><option value="order">公式順</option><option value="title">名前順</option><option value="updated">更新順</option></select></label>
      </div>

      <div class="result-meta"><p id="resultTitle">収録情報</p><span id="resultCount"></span></div>
      <div class="entry-grid" id="entryGrid"></div>
      <div class="empty hidden" id="empty"><div class="diamond small">?</div><h2>該当する記録がありません</h2><p>検索語を短くするか、別のカテゴリーを選んでください。</p></div>
    </section>
  </main>

  <dialog class="detail-dialog" id="detailDialog">
    <article class="detail-card">
      <button class="close" data-action="close-detail" aria-label="詳細を閉じる">×</button>
      <div class="detail-accent" id="detailAccent"></div>
      <div class="detail-kind" id="detailKind"></div>
      <h2 id="detailTitle"></h2><p class="detail-subtitle" id="detailSubtitle"></p>
      <div class="tag-list" id="detailTags"></div>
      <p class="detail-summary" id="detailSummary"></p>
      <div class="detail-body" id="detailBody"></div>
      <footer><span id="detailSource"></span><button class="edit-link" data-action="edit-current">この項目を編集</button></footer>
    </article>
  </dialog>

  <dialog class="editor-dialog" id="editorDialog">
    <form class="editor-card" id="editorForm">
      <header><div><div class="eyebrow">ARCHIVE EDITOR</div><h2 id="editorHeading">記録を追加</h2></div><button type="button" class="close" data-action="close-editor" aria-label="編集を閉じる">×</button></header>
      <div class="editor-notice"><i></i><span><strong>クラウド編集</strong> 保存内容は、このサイトを開ける端末間で同期されます。</span></div>
      <input type="hidden" name="id">
      <input type="hidden" name="revision" value="0">
      <div class="form-grid">
        <label><span>カテゴリー</span><select name="category" required><option value="weapons">武器種図鑑</option><option value="cards">武器カード・薬図鑑</option><option value="jobs">ジョブ図鑑</option><option value="emblems">紋章図鑑</option><option value="enemies">敵図鑑＆攻略情報</option><option value="other">その他情報</option></select></label>
        <label><span>識別色</span><select name="accent"><option value="lime">ライム</option><option value="amber">アンバー</option><option value="rose">ローズ</option><option value="violet">バイオレット</option><option value="ice">アイス</option><option value="sky">スカイ</option><option value="red">レッド</option><option value="teal">ティール</option></select></label>
      </div>
      <label><span>名前</span><input name="title" required maxlength="80" placeholder="例：炎獣グラヴァ"></label>
      <label><span>分類・装備・現像元</span><input name="subtitle" maxlength="120" placeholder="例：発動武器：伸剣"></label>
      <label><span>一覧用の短い説明</span><textarea name="summary" rows="2" maxlength="240" placeholder="特徴を一文で"></textarea></label>
      <label><span>詳細情報</span><textarea name="body" rows="7" maxlength="6000" placeholder="技や効果は改行して入力できます"></textarea></label>
      <label><span>タグ</span><input name="tags" maxlength="240" placeholder="ジョブ, 氷属性, 支援"></label>
      <div class="import-box"><button type="button" data-action="paste-ccfolia">ココフォリアのコピーを貼り付け</button><small>駒やパネルからコピーした文章を、詳細情報へ追加します。</small></div>
      <p class="form-message" id="formMessage" role="status"></p>
      <footer><button type="button" class="secondary" data-action="close-editor">キャンセル</button><button type="submit" class="primary">下書きを保存</button></footer>
    </form>
  </dialog>

  <script>window.__INITIAL_ENTRIES__=${initialData};</script>
  <script src="/app.js"></script>
</body></html>`;
}

export function renderFavicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#151817"/><path d="M32 5 59 32 32 59 5 32Z" fill="#caff00" stroke="#fff" stroke-width="3"/><path d="M20 24h24M25 32h14M29 16v32M39 17l-4 31" stroke="#111" stroke-width="5" stroke-linecap="round"/></svg>`;
}

const styles = String.raw`
:root{--ink:#151817;--paper:#e9dfcb;--paper2:#cdbf9f;--line:rgba(21,24,23,.18);--lime:#caff00;--amber:#ffc247;--rose:#ff5f7a;--violet:#9a7cff;--ice:#8ee6ff;--sky:#50bfff;--red:#ff4c39;--teal:#47d7bd;--shadow:0 20px 60px rgba(12,14,13,.2)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#d8ccb5;color:var(--ink);font-family:"Yu Gothic UI","Hiragino Kaku Gothic ProN",Meiryo,sans-serif;min-height:100vh}.paper-noise{position:fixed;inset:0;pointer-events:none;opacity:.32;background-image:radial-gradient(rgba(62,37,19,.15) .7px,transparent .7px),linear-gradient(118deg,rgba(255,255,255,.2),transparent 45%,rgba(95,55,25,.07));background-size:8px 8px,100% 100%;mix-blend-mode:multiply;z-index:0}.skip{position:fixed;top:-100px;left:1rem;z-index:99;background:#fff;padding:.7rem 1rem;color:#111}.skip:focus{top:1rem}.topbar{height:76px;background:rgba(20,23,22,.96);color:white;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(1rem,4vw,3.5rem);position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(255,255,255,.12)}button,input,select,textarea{font:inherit}.brand{display:flex;gap:.75rem;align-items:center;background:none;border:0;color:white;text-align:left;cursor:pointer}.brand-mark{width:42px;height:42px;display:grid;place-items:center;background:var(--lime);color:#111;font-size:1.4rem;font-weight:1000;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}.brand-mark span{font-size:.62rem;vertical-align:top}.brand strong{display:block;font-family:Georgia,serif;font-size:1.22rem;letter-spacing:.04em}.brand small{display:block;font-size:.62rem;letter-spacing:.2em;color:#a8afaa;margin-top:.1rem}.top-actions{display:flex;gap:1rem;align-items:center}.sync{font-size:.78rem;color:#b9c0bc;display:flex;align-items:center;gap:.45rem}.sync i,.editor-notice i{width:8px;height:8px;border-radius:50%;background:#f1b54c;box-shadow:0 0 0 4px rgba(241,181,76,.12)}.sync.ready i,.editor-notice i{background:#99dc47}.sync.error i{background:#ef6b5a}.icon-button{border:1px solid rgba(255,255,255,.25);background:#2a2e2c;color:white;border-radius:999px;padding:.62rem 1rem;cursor:pointer}.hidden{display:none!important}main{position:relative;z-index:1}.mode-select{max-width:1160px;margin:auto;padding:clamp(4rem,8vw,7.5rem) clamp(1.2rem,4vw,3rem)}.eyebrow{font-size:.72rem;font-weight:900;letter-spacing:.22em;text-transform:uppercase;margin-bottom:.8rem}.mode-select h1,.archive h1{font-family:Georgia,"Yu Mincho",serif;font-size:clamp(3.2rem,8vw,6.8rem);line-height:.9;margin:0;letter-spacing:-.07em}.lead{font-size:clamp(1rem,2vw,1.2rem);margin:1.4rem 0 3.5rem;max-width:34rem;color:#4f514c}.mode-grid{display:grid;gap:1rem}.mode-card{min-height:126px;border:1px solid var(--line);background:rgba(239,231,213,.68);display:grid;grid-template-columns:44px 76px 1fr auto;align-items:center;gap:1.2rem;padding:1rem 1.5rem;text-align:left;cursor:pointer;transition:.25s;box-shadow:0 2px 0 rgba(255,255,255,.5) inset}.mode-card:hover:not(.disabled),.mode-card:focus-visible:not(.disabled){transform:translateX(8px);background:#f4ecd9;box-shadow:var(--shadow)}.mode-number{font:700 .8rem Georgia;color:#747268}.diamond{width:64px;aspect-ratio:1;display:grid;place-items:center;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);font-weight:1000;font-size:1.6rem;background:var(--lime)}.diamond.lime{background:var(--lime)}.diamond.amber{background:var(--amber)}.diamond.sky{background:var(--sky)}.diamond.small{width:48px;margin:auto}.mode-copy strong{display:block;font-family:Georgia,"Yu Mincho",serif;font-size:clamp(1.25rem,3vw,2rem)}.mode-copy small{display:block;color:#67675f;margin-top:.4rem}.arrow{font-size:2rem}.lock{font-size:.72rem;border:1px solid var(--line);padding:.45rem .65rem}.disabled{opacity:.58;cursor:not-allowed}.archive{max-width:1240px;margin:auto;padding:clamp(2rem,5vw,4.5rem) clamp(1rem,4vw,3rem) 6rem}.archive-heading{display:flex;justify-content:space-between;align-items:end;border-bottom:2px solid var(--ink);padding-bottom:2rem}.back{background:none;border:0;padding:0;margin-bottom:2rem;font-weight:700;cursor:pointer}.sigil{width:110px;aspect-ratio:1;display:grid;place-content:center;text-align:center;background:var(--ink);color:var(--lime);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}.sigil span{font:900 2.6rem Georgia}.sigil small{font-size:.55rem;letter-spacing:.18em}.categories{display:grid;grid-template-columns:repeat(7,1fr);border:1px solid var(--ink);margin:2rem 0}.category{border:0;border-right:1px solid var(--line);background:rgba(239,231,213,.72);min-height:74px;padding:.7rem;cursor:pointer;color:#282a27}.category:last-child{border:0}.category b,.category small{display:block}.category small{font-size:.7rem;margin-top:.25rem;color:#74746b}.category.active{background:var(--ink);color:white;box-shadow:inset 0 -4px var(--lime)}.category.active small{color:var(--lime)}.tool-row{display:flex;gap:1rem;justify-content:space-between}.search{background:rgba(246,240,224,.75);border:1px solid var(--line);display:flex;align-items:center;gap:.5rem;padding:0 .9rem;flex:1;max-width:580px}.search input{border:0;background:none;width:100%;padding:.9rem 0;outline:none;font-size:1rem}.sort{display:flex;align-items:center;gap:.5rem;font-size:.78rem;font-weight:700}.sort select{border:1px solid var(--line);background:#eee5d2;padding:.8rem}.result-meta{display:flex;justify-content:space-between;margin:2.4rem 0 1rem;align-items:end}.result-meta p{font:700 1.2rem Georgia,"Yu Mincho",serif;margin:0}.result-meta span{font-size:.78rem}.entry-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.entry{--accent:var(--lime);border:1px solid var(--line);background:rgba(241,233,215,.86);min-height:270px;padding:1.35rem;text-align:left;cursor:pointer;display:flex;flex-direction:column;position:relative;overflow:hidden;transition:.22s}.entry:before{content:"";position:absolute;width:120px;height:120px;background:var(--accent);right:-64px;top:-64px;transform:rotate(45deg);opacity:.9}.entry:hover,.entry:focus-visible{transform:translateY(-5px);box-shadow:var(--shadow);border-color:rgba(21,24,23,.5)}.entry-kind{font-size:.66rem;letter-spacing:.15em;font-weight:900}.entry h2{font:700 1.5rem Georgia,"Yu Mincho",serif;margin:1.7rem 0 .4rem}.entry .subtitle{color:#66655d;font-size:.78rem;min-height:1.2rem}.entry .summary{line-height:1.8;font-size:.92rem}.entry footer{margin-top:auto;display:flex;justify-content:space-between;align-items:end}.tags{display:flex;gap:.35rem;flex-wrap:wrap}.tag{font-size:.68rem;border:1px solid var(--line);padding:.25rem .4rem;background:rgba(255,255,255,.28)}.entry-arrow{font-size:1.3rem}.empty{text-align:center;padding:5rem 1rem;border:1px dashed var(--line)}dialog{border:0;background:transparent;padding:0;color:var(--ink)}dialog::backdrop{background:rgba(9,11,10,.78);backdrop-filter:blur(5px)}.detail-dialog{width:min(680px,calc(100% - 1.2rem));max-height:92vh}.detail-card,.editor-card{background:#eee5d3;box-shadow:var(--shadow);position:relative;padding:clamp(1.4rem,5vw,3.5rem);max-height:92vh;overflow:auto;border-top:8px solid var(--ink)}.close{position:absolute;right:1rem;top:1rem;width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:transparent;font-size:1.5rem;cursor:pointer}.detail-accent{height:8px;width:86px;background:var(--lime);margin-bottom:2rem}.detail-kind{font-size:.7rem;letter-spacing:.16em;font-weight:900}.detail-card h2{font:700 clamp(2rem,6vw,3.5rem) Georgia,"Yu Mincho",serif;line-height:1;margin:.7rem 3rem .4rem 0}.detail-subtitle{color:#65655d}.tag-list{display:flex;gap:.4rem;flex-wrap:wrap;margin:1.5rem 0}.detail-summary{font-weight:700;line-height:1.8;border-block:1px solid var(--line);padding:1.3rem 0}.detail-body{line-height:2;white-space:pre-line}.detail-card footer{display:flex;justify-content:space-between;gap:1rem;border-top:1px solid var(--line);padding-top:1rem;margin-top:2rem;font-size:.74rem}.edit-link{border:0;background:none;text-decoration:underline;cursor:pointer;font-weight:700}.editor-dialog{width:min(760px,calc(100% - 1.2rem));max-height:94vh}.editor-card header{display:flex;justify-content:space-between;position:relative}.editor-card h2{font:700 2rem Georgia,"Yu Mincho",serif;margin:0 0 1.5rem}.editor-card .close{position:static}.editor-notice{display:flex;gap:.8rem;align-items:center;background:#dfe6cf;border:1px solid #b5c78b;padding:.9rem;margin-bottom:1.4rem;font-size:.8rem}.editor-card label{display:block;margin:.9rem 0}.editor-card label>span{display:block;font-size:.72rem;font-weight:900;margin-bottom:.4rem}.editor-card input,.editor-card select,.editor-card textarea{width:100%;border:1px solid var(--line);background:#f8f2e6;padding:.78rem;border-radius:0}.editor-card textarea{resize:vertical;line-height:1.7}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.import-box{display:flex;align-items:center;gap:.8rem;border:1px dashed var(--line);padding:.8rem}.import-box button{background:none;border:0;text-decoration:underline;font-weight:800;cursor:pointer}.import-box small{color:#68685f}.form-message{min-height:1.2rem;font-size:.78rem}.editor-card footer{display:flex;justify-content:flex-end;gap:.8rem;margin-top:1rem}.primary,.secondary{padding:.8rem 1.2rem;border:1px solid var(--ink);cursor:pointer}.primary{background:var(--ink);color:white;box-shadow:inset 0 -3px var(--lime)}.secondary{background:transparent}.accent-lime{--accent:var(--lime)}.accent-amber{--accent:var(--amber)}.accent-rose{--accent:var(--rose)}.accent-violet{--accent:var(--violet)}.accent-ice{--accent:var(--ice)}.accent-sky{--accent:var(--sky)}.accent-red{--accent:var(--red)}.accent-teal{--accent:var(--teal)}@media(max-width:900px){.categories{grid-template-columns:repeat(4,1fr)}.category{border-bottom:1px solid var(--line)}.entry-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.topbar{height:64px}.brand small,.sync,.icon-button span{display:none}.mode-select{padding-top:3rem}.mode-card{grid-template-columns:34px 54px 1fr;padding:.8rem;gap:.7rem;min-height:105px}.diamond{width:52px}.arrow,.lock{display:none}.archive-heading{align-items:center}.sigil{width:78px}.categories{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:-1rem;border-inline:0}.category{min-width:112px;scroll-snap-align:start}.tool-row{display:block}.search{max-width:none}.sort{margin-top:.7rem;justify-content:flex-end}.entry-grid{grid-template-columns:1fr}.entry{min-height:225px}.form-grid{grid-template-columns:1fr}.import-box{display:block}.import-box small{display:block;margin-top:.6rem}.detail-card footer{display:block}.edit-link{display:block;margin-top:1rem}}
`;
