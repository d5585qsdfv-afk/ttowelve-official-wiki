import { defaultEntries } from './data.js';
import { theme } from './theme.js';

const initialData = JSON.stringify(defaultEntries).replaceAll('<', '\\u003c');

export function renderPage(config = {}) {
  const supabaseConfig = JSON.stringify({
    url: typeof config.supabaseUrl === 'string' ? config.supabaseUrl : '',
    anonKey: typeof config.supabaseAnonKey === 'string' ? config.supabaseAnonKey : '',
  }).replaceAll('<', '\\u003c');
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080b12">
  <meta name="description" content="ゲーム作成サークル TTwowelve 公式Webアプリ。十の救現主の図鑑・攻略情報を収録。">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>TTowelve Archive｜公式Webアプリ</title>
  <style>${theme}</style>
</head>
<body>
  <a class="skip" href="#main">本文へ移動</a>
  <div class="paper-noise" aria-hidden="true"></div>
  <header class="topbar">
    <button class="brand" data-action="home" aria-label="作品選択へ戻る">
      <img class="brand-logo" src="/assets/ttowelve-studio.webp" alt="TTowelve GAME STUDIO">
      <span><strong>TTowelve</strong><small>STORIES ON SCREEN</small></span>
    </button>
    <div class="top-actions">
      <span class="sync" id="syncState"><i></i>同期を確認中</span>
      <button class="icon-button account-button" data-action="open-account" aria-label="ログインと編集提案">♙ <span id="accountButtonLabel">ログイン</span></button>
      <button class="icon-button" data-action="open-editor" aria-label="管理・編集">✦ <span>編集</span></button>
    </div>
  </header>

  <main id="main">
    <section class="mode-select" id="modeSelect" aria-labelledby="modeTitle">
      <div class="lobby-heading"><span class="eyebrow">TTOWELVE CINEMA</span><span class="lobby-caption">ここから、物語の中へ。</span></div>
      <div class="studio-hero">
        <img src="/assets/ttowelve-studio.webp" alt="TTowelve GAME STUDIO ロゴ">
        <div class="studio-hero-copy"><small>THE SCREEN IS YOUR GATEWAY</small><span>まだ見ぬ世界が、<br>幕を開ける。</span><p>物語を選び、その世界の記録へ。</p></div><span class="screen-label">THE GRAND LOBBY / TTOWELVE</span>
      </div>
      <div class="program-heading"><div><div class="eyebrow">CHOOSE YOUR SCREEN</div><h1 id="modeTitle">上映作品</h1></div><p class="lead">スクリーンの先に、あなたの冒険を。</p></div>
      <div class="mode-grid">
        <button class="mode-card active" data-game="ten-saviors">
          <span class="mode-number">01</span><span class="mode-art"><img src="/assets/ten-saviors.webp" alt="十の救現主のキービジュアル"><i>十</i></span>
          <span class="mode-copy"><span class="showing">NOW SHOWING / SCREEN 01</span><strong>十の救現主</strong><small>現実 × ファンタジー<br>世界を知り、戦いの記録をひらく。</small></span><span class="arrow">入場する ↗</span>
        </button>
        <button class="mode-card disabled" data-game="soleil" disabled>
          <span class="mode-number">02</span><span class="mode-art"><img src="/assets/soleil.webp" alt="ソレイユの伝承：エナルゴス戦記のキービジュアル"><i>陽</i></span>
          <span class="mode-copy"><span class="showing">COMING SOON / SCREEN 02</span><strong>ソレイユの伝承</strong><small>エナルゴス戦記</small></span><span class="lock">上映準備中</span>
        </button>
        <button class="mode-card disabled" data-game="idlet" disabled>
          <span class="mode-number">03</span><span class="mode-art"><img src="/assets/idlet.webp" alt="イドレット～競技性アライアンスゲーム～のキービジュアル"><i>競</i></span>
          <span class="mode-copy"><span class="showing">COMING SOON / SCREEN 03</span><strong>イドレット</strong><small>競技性アライアンスゲーム</small></span><span class="lock">上映準備中</span>
        </button>
      </div>
    </section>

    <section class="archive hidden" id="archive" aria-labelledby="archiveTitle">
      <div class="archive-heading">
        <div class="archive-intro"><button class="back" data-action="home">← 映画館ロビーへ</button><div class="eyebrow">SCREEN 01 / THE TEN SAVIORS</div><h1 id="archiveTitle">十の救現主</h1><p class="archive-description">現実と空想が交わる、その先へ。</p><div class="archive-subline"><span>WORLD ARCHIVE</span><span>属性 × 攻撃分類</span><span>状態異常 × 蓄積</span></div></div>
        <div class="archive-branding"><div class="archive-keyvisual"><img src="/assets/ten-saviors.webp" alt="金と銀の光、翼と円環が交わる十の救現主のキービジュアル"></div><div class="game-logo"><img src="/assets/ten-saviors-logo.webp" alt="十の救現主 ロゴ"></div></div>
      </div>

      <nav class="categories" aria-label="図鑑カテゴリー">
        <button class="category active" data-category="all" aria-pressed="true"><b>総覧</b><small id="countAll">0</small></button>
        <button class="category" data-category="weapons" aria-pressed="false"><b>武器種</b><small>図鑑</small></button>
        <button class="category" data-category="weaponItems" aria-pressed="false"><b>武器</b><small>図鑑</small></button>
        <button class="category" data-category="cards" aria-pressed="false"><b>カード</b><small>図鑑</small></button>
        <button class="category" data-category="medicines" aria-pressed="false"><b>薬</b><small>図鑑</small></button>
        <button class="category" data-category="jobs" aria-pressed="false"><b>ジョブ</b><small>図鑑</small></button>
        <button class="category" data-category="emblems" aria-pressed="false"><b>紋章</b><small>図鑑</small></button>
        <button class="category" data-category="rings" aria-pressed="false"><b>リンクリング</b><small>図鑑</small></button>
        <button class="category" data-category="enemies" aria-pressed="false"><b>敵＆攻略</b><small>情報</small></button>
        <button class="category" data-category="other" aria-pressed="false"><b>戦闘・報酬</b><small>ルール／世界</small></button>
      </nav>

      <div class="tool-row">
        <label class="search"><span>⌕</span><input id="search" type="search" placeholder="武器・カード・チャンネル・状態異常から検索" autocomplete="off"></label>
        <label class="sort">表示順<select id="sort"><option value="order">公式順</option><option value="title">名前順</option><option value="updated">更新順</option></select></label>
      </div>

      <section class="tag-browser" aria-labelledby="tagBrowserTitle">
        <div class="tag-browser-heading"><div><span class="tag-browser-kicker">QUICK FILTER</span><h2 id="tagBrowserTitle">タグで探す</h2></div><button type="button" class="secondary tag-clear" data-action="clear-tags">選択を解除</button></div>
        <div class="favorite-row"><span class="favorite-label">お気に入り</span><div class="favorite-tags" id="favoriteTags"><span class="tag-empty">まだありません。☆で追加できます。</span></div></div>
        <label class="tag-search"><span>タグ一覧</span><input id="tagSearch" type="search" placeholder="属性・効果・クラス名を検索" autocomplete="off"></label>
        <div class="tag-filter-list" id="tagFilters" aria-label="タグ一覧"></div>
        <p class="tag-filter-status" id="tagFilterStatus" role="status" aria-live="polite"></p>
      </section>

      <section class="pinned-panel" id="pinnedPanel" aria-labelledby="pinnedTitle">
        <header class="pinned-panel-heading"><div><span class="tag-browser-kicker">COMPARE DESK</span><h2 id="pinnedTitle">固定詳細 <span id="pinnedCount">0/4</span></h2></div><button type="button" class="secondary" data-action="clear-pinned">固定をすべて解除</button></header>
        <p class="pin-status" id="pinStatus" role="status" aria-live="polite">最大4件まで固定できます。武器やジョブを並べて効果を比較できます。</p>
        <div class="pinned-grid" id="pinnedGrid"></div>
      </section>

      <fieldset class="database-filters hidden" id="cardFilters"><legend>カードを絞り込む</legend><label>レベル<select id="cardLevel"><option value="">すべてのレベル</option></select></label><label>ロール<select id="cardRole"><option value="">すべてのロール</option></select></label><label>チャンネル<select id="cardChannel"><option value="">すべてのチャンネル</option></select></label><button type="button" class="secondary" data-action="reset-database-filters">条件を解除</button></fieldset>
      <fieldset class="database-filters medicine-filters hidden" id="medicineFilters"><legend>薬を絞り込む</legend><label>発動区分<select id="medicineTiming"><option value="">すべての区分</option></select></label><button type="button" class="secondary" data-action="reset-database-filters">条件を解除</button></fieldset>
      <fieldset class="database-filters hidden" id="jobFilters"><legend>ジョブをクラスで絞り込む</legend><label>クラス<select id="jobClass"><option value="">すべてのクラス</option></select></label><button type="button" class="secondary" data-action="reset-database-filters">条件を解除</button></fieldset>
      <fieldset class="enemy-filters hidden" id="enemyFilters"><legend>敵の記録を絞り込む</legend><label>VUNDクラス<select id="enemyVundClass"><option value="">すべてのVUNDクラス</option></select></label><label>分類<select id="enemyClass"><option value="">すべての分類</option></select></label><label>章<select id="enemyChapter"><option value="">すべての章</option></select></label><label>出現場所<select id="enemyLocation"><option value="">すべての場所</option></select></label><button type="button" class="secondary" data-action="reset-enemy-filters">絞り込みを解除</button></fieldset>
      <div class="result-meta"><p id="resultTitle">収録情報</p><span id="resultCount" role="status" aria-live="polite"></span></div>
      <div class="entry-grid" id="entryGrid"></div>
      <div class="empty hidden" id="empty"><div class="diamond small">?</div><h2>該当する記録がありません</h2><p>検索語を短くするか、別のカテゴリーを選んでください。</p></div>
    </section>
  </main>

  <dialog class="detail-dialog" id="detailDialog">
    <article class="detail-card">
      <button class="close" data-action="close-detail" aria-label="詳細を閉じる">×</button>
      <button type="button" class="detail-favorite" id="detailFavorite" data-action="toggle-favorite-current" aria-pressed="false">☆ お気に入りに追加</button>
      <button type="button" class="detail-pin" id="detailPin" data-action="toggle-pin-current" aria-pressed="false">□ 詳細を固定</button>
      <div class="detail-accent" id="detailAccent"></div>
      <img class="detail-image hidden" id="detailImage" alt="">
      <div class="detail-kind" id="detailKind"></div>
      <h2 id="detailTitle"></h2><p class="detail-subtitle" id="detailSubtitle"></p>
      <dl class="enemy-facts hidden" id="detailEnemyFacts"></dl>
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
        <label><span>カテゴリー</span><select name="category" required><option value="weapons">武器種図鑑</option><option value="weaponItems">武器図鑑</option><option value="cards">カード図鑑</option><option value="medicines">薬図鑑</option><option value="jobs">ジョブ図鑑</option><option value="emblems">紋章図鑑</option><option value="rings">リンクリング図鑑</option><option value="enemies">敵図鑑＆攻略情報</option><option value="other">その他情報</option></select></label>
        <label><span>識別色</span><select name="accent"><option value="lime">ライム</option><option value="amber">アンバー</option><option value="silver">シルバー</option><option value="rose">ローズ</option><option value="violet">バイオレット</option><option value="ice">アイス</option><option value="sky">スカイ</option><option value="red">レッド</option><option value="teal">ティール</option></select></label>
      </div>
      <label><span>名前</span><input name="title" required maxlength="80" placeholder="例：炎獣グラヴァ"></label>
      <fieldset id="enemyEditor" class="enemy-editor hidden"><legend>敵の分類と出現情報</legend><label><span>分類</span><input name="enemyClass" list="enemyClassOptions" maxlength="40" placeholder="通常敵・強敵・ボスなど"><datalist id="enemyClassOptions"><option value="通常敵"><option value="強敵"><option value="ボス"></datalist></label><div class="form-grid"><label><span>章</span><input name="enemyChapter" maxlength="100" placeholder="一章「探究者の道」"></label><label><span>出現場所</span><input name="enemyLocation" maxlength="120" placeholder="アマガミ滝高地"></label></div><small>ここで指定した内容を詳細本文の「分類・章・出現場所」に反映します。</small></fieldset>
      <label><span>分類・装備・現像元</span><input name="subtitle" maxlength="120" placeholder="例：発動武器：伸剣"></label>
      <label><span>一覧用の短い説明</span><textarea name="summary" rows="2" maxlength="240" placeholder="特徴を一文で"></textarea></label>
      <label><span>詳細情報</span><textarea name="body" rows="7" maxlength="6000" placeholder="技や効果は改行して入力できます"></textarea></label>
      <label><span>タグ</span><input name="tags" maxlength="240" placeholder="ジョブ, 氷属性, 支援"></label>
      <div class="import-box"><button type="button" data-action="paste-ccfolia">ココフォリアのコピーを貼り付け</button><small>駒やパネルからコピーした文章を、詳細情報へ追加します。</small></div>
      <p class="form-message" id="formMessage" role="status"></p>
      <footer><button type="button" class="secondary" data-action="close-editor">キャンセル</button><button type="submit" class="primary">下書きを保存</button></footer>
    </form>
  </dialog>

  <dialog class="account-dialog" id="accountDialog">
    <article class="account-card">
      <button class="close" data-action="close-account" aria-label="アカウント画面を閉じる">×</button>
      <div class="eyebrow">SUPABASE ACCOUNT</div>
      <h2 id="accountHeading">ログインと編集提案</h2>
      <p class="account-lead" id="accountStatus" role="status" aria-live="polite">ログインすると、編集提案を送れます。</p>
      <section id="authPanel">
        <form id="authForm">
          <label><span>メールアドレス</span><input id="authEmail" type="email" autocomplete="email" required></label>
          <label><span>パスワード</span><input id="authPassword" type="password" autocomplete="current-password" minlength="8" required></label>
          <label id="authNameField" class="hidden"><span>表示名（新規登録時）</span><input id="authName" autocomplete="nickname" maxlength="80"></label>
          <p class="form-message" id="authMessage" role="status"></p>
          <div class="account-actions"><button class="primary" id="authSubmit" type="submit">ログイン</button><button class="secondary" data-action="toggle-auth-mode" type="button">新規登録に切り替え</button></div>
        </form>
      </section>
      <section id="proposalPanel" class="hidden">
        <form id="proposalForm">
          <label><span>対象の図鑑</span><select id="proposalEntry" required></select></label>
          <label><span>提案タイトル</span><input id="proposalTitle" maxlength="200" required placeholder="例：分類名の修正案"></label>
          <label><span>概要</span><textarea id="proposalSummary" rows="2" maxlength="1000" placeholder="変更したい点を短く入力"></textarea></label>
          <label><span>変更案本文</span><textarea id="proposalContent" rows="8" maxlength="6000" required placeholder="正しい本文や修正案を入力"></textarea></label>
          <p class="form-message" id="proposalMessage" role="status"></p>
          <div class="account-actions"><button class="primary" id="proposalSubmit" type="submit">編集提案を送信</button><button class="secondary" data-action="sign-out" type="button">ログアウト</button></div>
        </form>
      </section>
    </article>
  </dialog>

  <script>window.__INITIAL_ENTRIES__=${initialData};</script>
  <script>window.__SUPABASE_CONFIG__=${supabaseConfig};</script>
  <script type="module" src="/app.js"></script>
</body></html>`;
}

export function renderFavicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4ae"/><stop offset=".45" stop-color="#d79b2b"/><stop offset="1" stop-color="#7b4a12"/></linearGradient></defs><rect width="64" height="64" rx="12" fill="#111820"/><path d="M32 5 59 32 32 59 5 32Z" fill="url(#g)" stroke="#f8e8aa" stroke-width="3"/><path d="M20 24h24M25 32h14M29 16v32M39 17l-4 31" stroke="#111" stroke-width="5" stroke-linecap="round"/></svg>`;
}
