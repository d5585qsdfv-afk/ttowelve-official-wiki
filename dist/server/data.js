import { weaponEntries } from './weapons.generated.js';
import { cardEntries } from './cards.generated.js';
import { medicineEntries } from './medicines.generated.js';
import { enemyEntries } from './enemies.generated.js';

export const GAME_ID = 'ten-saviors';

const baseEntries = [
  {
    id: 'job-hikawa-ringo', category: 'jobs', title: '日川 林檎',
    subtitle: '札箱', accent: 'lime', sortOrder: 10,
    summary: 'カードの入れ替えと抽選を軸に、状況へ柔軟に対応するジョブ。',
    tags: ['ジョブ', '札箱', 'サポート'],
    body: 'カードチェンジ｜戦闘中にセット済みのカードを入れ替える。\nカード抽選｜毎ターン開始時、入手済みのカードからランダムなサポート／カウンターカードを使用する。\nVUNDアルティメット：マンマリンゴ｜発動ターン中、好きなカードを3枚使用できる。'
  },
  {
    id: 'job-l00', category: 'jobs', title: 'L-00',
    subtitle: '拳具（クロー）', accent: 'rose', sortOrder: 20,
    summary: '弱体化、回復分配、自己消費への反応を組み合わせる近接ジョブ。',
    tags: ['ジョブ', '拳具', '弱体化'],
    body: '牙鱗削ぎ｜敵単体の攻撃威力を下げ、被ダメージを増加させる武器攻撃。\n血液供給｜「静心」の回復量の一部を味方へ分配する。\nVUNDアルティメット：ブラッドクラッシュ｜無属性イマジンダメージを与え、固有スタックを獲得する。'
  },
  {
    id: 'job-iris', category: 'jobs', title: 'イリス',
    subtitle: '伸剣', accent: 'violet', sortOrder: 30,
    summary: '二本の伸剣と「魔のバイド」を運用する、攻撃的なジョブ。',
    tags: ['ジョブ', '伸剣', '魔のバイド'],
    body: 'アイルバイド〈蝕〉｜魔のバイドとHPを消費し、次回行動時の攻撃を強化する。\n伝説級武器調整術｜条件を満たす伸剣を二つ所持できる。\nVUNDアルティメット：クロスバイド・裂｜敵全体を攻撃し、ターン終了時にメモリアルダメージを与える。'
  },
  {
    id: 'job-hoshimi-miyabi', category: 'jobs', title: '星見雅',
    subtitle: '斬刀', accent: 'ice', sortOrder: 40,
    summary: '「落霜」を蓄積し、溜め段階に応じて斬撃を大きく強化するジョブ。',
    tags: ['ジョブ', '斬刀', '氷属性'],
    body: '飛雪｜斬刀による攻撃で「落霜」を獲得する。\n寒炎｜氷属性を霜烈属性へ変換し、固有状態を付与する。\nVUNDアルティメット：なごり雪｜敵全体を攻撃し、「落霜」を獲得する。'
  },
  {
    id: 'emblem-history-personality', category: 'emblems', title: '歴と性格',
    subtitle: '現像元：十の救現主／イズール', accent: 'amber', sortOrder: 10,
    summary: 'VUNDアルティメット使用後、一定確率でもう一度必殺技を使用可能にする紋章。',
    tags: ['紋章', 'イズール', 'アルティメット'],
    body: '紋章効果｜VUNDアルティメット使用後、30％の確率でもう一度必殺技を使用可能にする。連続発動は一回まで。'
  },
  {
    id: 'emblem-counter-signal', category: 'emblems', title: '反撃の狼煙',
    subtitle: '現像元：十の救現主／トレンシス', accent: 'orange', sortOrder: 20,
    summary: 'リンクリング使用時の攻撃威力と回復量を強化する紋章。',
    tags: ['紋章', 'トレンシス', 'リンクリング'],
    body: '紋章効果｜リンクリング使用時、攻撃威力と回復量が＋50％。'
  },
  {
    id: 'emblem-deepnight-mix', category: 'emblems', title: '深夜の調合',
    subtitle: '現像元：Cause of Collapse／マグリア・ヴェンス', accent: 'teal', sortOrder: 30,
    summary: '小瓶装備時に「バフの薬」「デバフの薬」を調合できる紋章。',
    tags: ['紋章', '小瓶', '薬'],
    body: '紋章効果｜チャンネル4に「調合」を設定。行動時に判定し、複数の候補からバフの薬とデバフの薬を獲得する。薬の効果は使用したターン中のみ持続する。'
  },
  {
    id: 'emblem-new-world', category: 'emblems', title: '新世界の旅へと',
    subtitle: '現像元：Test Gamers2／テラ', accent: 'sky', sortOrder: 40,
    summary: '複数の武器種を対象に、属性倍率と与ダメージを強化する紋章。',
    tags: ['紋章', 'テラ', '神具'],
    body: '紋章効果｜武器の属性倍率値を上昇させ、チャンネル5に「武器攻撃［神具］」を設定する。対象武器種の与ダメージを強化する。'
  },
  {
    id: 'other-ring-monya', category: 'other', title: '愛娘の指輪：モニャ',
    subtitle: '輪霊覚醒対象：イズール', accent: 'rose', sortOrder: 10,
    summary: '味方全員の継続回復と復活支援を担う指輪。',
    tags: ['指輪', '回復', 'イズール'],
    body: '毎ターン終了時、味方全員のHPを回復する。\nリザラク｜味方単体の戦闘不能を解消し、HP50％で復活させる。\n輪霊覚醒ではアルティメットチャージ率とHP回復効果を強化する。'
  },
  {
    id: 'other-ring-tera', category: 'other', title: '無限の指輪：テラ',
    subtitle: '輪霊覚醒対象：オリヴィア', accent: 'violet', sortOrder: 20,
    summary: '武器攻撃、ガード、回避を強化し、戦闘中の交代を可能にする指輪。',
    tags: ['指輪', '武器強化', 'オリヴィア'],
    body: '味方全員の武器攻撃ダメージ、ガード成功率、回避を強化する。\nフォージ｜味方単体の武器攻撃族を一段階上昇させる。\n輪霊覚醒では戦闘中のパーティ交代を可能にする。'
  },
  {
    id: 'card-muku-iruka', category: 'cards', title: 'ムクイルカ',
    subtitle: 'Attack｜チャンネル9｜水属性魔法', accent: 'sky', sortOrder: 10,
    summary: 'レベルに応じてD10系の水属性魔法攻撃を行う、基本攻撃カード。',
    tags: ['カード', 'Attack', '水属性', 'CH 09'],
    body: 'チャンネル｜9\nロール｜Attack\nレベル1｜D10ダメージの単体水属性魔法攻撃。\nレベル2｜D10＋20ダメージの単体水属性魔法攻撃。\nレベル3｜D10＋40ダメージの単体水属性魔法攻撃。\nレベル4｜D10＋60ダメージの単体水属性魔法攻撃。'
  },
  {
    id: 'card-patapta-bomb', category: 'cards', title: 'ぱたぱたボム',
    subtitle: 'Attack｜セットで効果発動｜無属性イマジン', accent: 'red', sortOrder: 20,
    summary: '毎ターン開始時に敵全体へダメージを与え、レベル4では流血への追撃効果も得る。',
    tags: ['カード', 'Attack', 'セット発動', '流血'],
    body: '発動条件｜セットで効果発動\nレベル1｜毎ターン開始時、敵全体にD10の無属性イマジンダメージ。\nレベル2｜毎ターン開始時、敵全体にD10＋20の無属性イマジンダメージ。\nレベル3｜毎ターン開始時、敵全体にD10＋30の無属性イマジンダメージ。\nレベル4｜毎ターン開始時、敵全体にD10＋60の無属性イマジンダメージ。味方全員が「流血」を持つ敵へのダメージ1.5倍効果を獲得する。'
  },
  {
    id: 'card-yabusame-penguin', category: 'cards', title: 'やぶさめペンギン',
    subtitle: 'Attack｜チャンネル6｜氷属性物理', accent: 'ice', sortOrder: 30,
    summary: 'レベル上昇でD15系の氷属性物理攻撃が強化される単体アタッカー。',
    tags: ['カード', 'Attack', '氷属性', 'CH 06'],
    body: 'チャンネル｜6\nロール｜Attack\nレベル1｜D15ダメージの単体氷属性物理攻撃。\nレベル2｜D15＋25ダメージ。\nレベル3｜D15＋50ダメージ。\nレベル4｜D15＋75ダメージ。'
  },
  {
    id: 'card-cheer-sister', category: 'cards', title: 'チアシスター',
    subtitle: 'Support｜チャンネル8｜攻撃支援', accent: 'lime', sortOrder: 40,
    summary: '味方全員の攻撃威力を高め、レベル上昇で貫通値も支援するサポートカード。',
    tags: ['カード', 'Support', '攻撃威力', '貫通値'],
    body: 'チャンネル｜8\nレベル1｜味方全員の攻撃威力＋10％。\nレベル2｜味方全員の攻撃威力＋15％、貫通値＋10。\nレベル3｜味方全員の攻撃威力＋20％、貫通値＋20。'
  },
  {
    id: 'card-windman', category: 'cards', title: 'ウィンドマン',
    subtitle: 'Support｜チャンネル7｜回避・移動技支援', accent: 'teal', sortOrder: 50,
    summary: '味方全体の回避を上げ、レベルに応じて移動技の威力も強化する。',
    tags: ['カード', 'Support', '回避', '移動技'],
    body: 'チャンネル｜7\nレベル1｜味方全体の回避＋5。\nレベル2｜味方全体の回避＋5、移動技の威力1.5倍。\nレベル3｜味方全体の回避＋5、移動技の威力3倍。'
  },
  {
    id: 'card-nise-jizou', category: 'cards', title: 'ニセジゾウ',
    subtitle: 'Support｜チャンネル8｜幸運状態', accent: 'amber', sortOrder: 60,
    summary: 'ハード成功をイクストリーム成功へ変換する「幸運」を付与する。',
    tags: ['カード', 'Support', '幸運', 'イクストリーム'],
    body: 'チャンネル｜8\nレベル1｜味方一体に「幸運」状態を付与する。\nレベル2｜味方全体に「幸運」状態を付与する。\nレベル3｜味方全体に「幸運II」状態を付与する。\n幸運｜「武器攻撃」と「ガード」に用いる技能のハード成功をイクストリーム成功に変換する。\n幸運II｜すべての行動に用いる技能のハード成功をイクストリーム成功に変換する。'
  },
  {
    id: 'card-philfly', category: 'cards', title: 'フィルフライ',
    subtitle: 'Health｜チャンネル9｜回復・装甲', accent: 'ice', sortOrder: 70,
    summary: '味方単体を回復し、上位レベルでは装甲も付与するヒールカード。',
    tags: ['カード', 'Health', '回復', '装甲'],
    body: 'チャンネル｜9\nレベル1｜味方1名のHPを30％回復する。\nレベル2｜味方1名のHPを70％回復し、装甲を10％付与する。\nレベル3｜味方1名のHPを100％回復し、装甲を20％付与する。'
  },
  {
    id: 'card-tekkyu-baron', category: 'cards', title: 'テッキュウ男爵',
    subtitle: 'Attack｜チャンネル9｜貫通物理遠隔', accent: 'violet', sortOrder: 80,
    summary: 'レベルに応じて貫通値を伸ばし、武器攻撃相当の遠隔ダメージを与える。',
    tags: ['カード', 'Attack', '物理遠隔', '貫通値'],
    body: 'チャンネル｜9\nレベル1｜単体に武器攻撃と同等の物理遠隔ダメージ。\nレベル2｜貫通値30。\nレベル3｜貫通値70。\nレベル4｜貫通値100。'
  },
  {
    id: 'card-iron-body', category: 'cards', title: 'アイアンボディ',
    subtitle: 'Support｜チャンネル6｜ガード段階強化', accent: 'amber', sortOrder: 90,
    summary: '味方一体のガード段階を強化し、上位レベルでは軽減率も上げる。',
    tags: ['カード', 'Support', 'ガード', '鉄属性'],
    body: 'チャンネル｜6\nレベル1｜味方一体のガード段階を1段階強化する。\nレベル2｜さらにガード軽減率＋10％。\nレベル3｜さらにガード軽減率＋20％。\nレベル4｜さらにガード軽減率＋30％。'
  },
  {
    id: 'card-barrier-mage', category: 'cards', title: 'バリアメイジ',
    subtitle: 'Counter｜チャンネル7｜魔法反射', accent: 'sky', sortOrder: 100,
    summary: '魔法ダメージを無効化し、反射板のレベルに応じて反撃するカウンターカード。',
    tags: ['カード', 'Counter', '魔法', '反射'],
    body: 'チャンネル｜7\nレベル1｜味方一体に「反射板-魔法」を付与する。\nレベル2｜味方二体に付与する。\nレベル3｜味方全体に付与する。\nレベル4｜味方一体に「反射板-魔法II」を付与する。\n反射板-魔法｜受ける魔法ダメージを無効化し、半分のダメージを反射する。1ターン持続。\n反射板-魔法II｜受ける魔法ダメージを無効化し、自身の武器攻撃同等のダメージを反射する。1ターン持続。'
  },
  {
    id: 'battle-status-effects', category: 'other', title: '状態異常・戦闘状態',
    subtitle: '付与確率｜蓄積｜次回行動への影響', accent: 'red', sortOrder: 30,
    summary: '攻撃の通り方や次の行動を変える、十の救現主の戦闘状態一覧。',
    tags: ['状態異常', 'デバフ', '蓄積値', '戦闘ルール'],
    body: '延焼（100％）｜遠隔攻撃を受ける時、ダメージ＋50％。\n冷凍（100％）｜近接攻撃を受ける時、ダメージ＋50％。\n通電（100％）｜次回に受ける魔法攻撃威力＋50％。\n切傷（100％）｜次回に受ける物理攻撃威力＋50％。\n蹣跚（70％）｜対象の攻撃時、その攻撃対象の回避＋10。\n軟弱（90％）｜受けるダメージ＋10％。\n浄化（60％）｜次回、被属性込みのダメージ＋50％。\n汚染（60％）｜次回攻撃威力半減。\n過意（50％）｜物理攻撃を受けるか、2ターン経過するまで行動不可。\n脱心（50％）｜魔法攻撃を受けるか、2ターン経過するまで行動不可。\n停止（50％）｜イマジン攻撃を受けるか、2ターン経過するまで行動不可。\n\n弾槍などの状態異常弾は、状態異常蓄積値を重ね、発動量1.0で状態異常が発動する。'
  },
  {
    id: 'battle-channel-system', category: 'other', title: 'チャンネルと体勢',
    subtitle: 'CH 01–09｜技の発動条件｜ガード段階', accent: 'violet', sortOrder: 40,
    summary: 'チャンネル技の成功と、回避・ガード・カウンターを組み合わせて戦況を作る基本システム。',
    tags: ['チャンネル', 'ガード段階', '回避', '体勢'],
    body: 'チャンネル｜武器やカードに設定された技の発動条件。カードにはAttack、Support、Health、Counter、Characterなどの戦術ロールがある。\n回避｜ステップ回避（回避率＋10％）、回転回避（回避率＋20％）、スライド回避（回避時に威力1.2倍の反撃）、ジャンプ回避（回避不可攻撃も回避）、影残し回避（連続ヒットを一度避けると以降も自動回避）。\nガード段階1・半減｜ダメージ軽減50％。\nガード段階2・無効｜ダメージ軽減100％。\nガード段階3・吸収｜受けるダメージを40％にして回復へ変換。\nガード段階4・反射｜受けるはずのダメージを130％で攻撃者へ返す。\n注意｜ガード段階は防御効果そのものではなく、体勢として扱われる。'
  },
  {
    id: 'update-ver710-rewards', category: 'other', title: '報酬と新規コンテンツ',
    subtitle: '最終章番外編「果ての現実」第二弾｜アップデート記録', accent: 'amber', sortOrder: 50,
    summary: 'メダルラリー、蛇銭貨、リミットブレイクなど、戦闘の外側にも成長と報酬がつながる。',
    tags: ['アップデート', 'メダルラリー', '蛇銭貨', '報酬'],
    body: 'メダルラリー｜章ごとに報酬を分け、狙った報酬を優先して獲得できるよう調整。メダル1枚あたりのゲーム内通貨は6000円。第五章、最終章、最終章番外編1・2の項目も追加。\n温泉宿生万蛇魅｜週に一度まで施設を手伝い、繁盛度に応じた収益を「蛇銭貨」として受け取る。蛇銭貨は幸運チケット、クイックチケット、ドラコニックハートなどと交換できる。\n聖光戦記解読録｜Bright&Storyクラス専用の「リミットブレイク」を解放する高難度コンテンツ。完全クリアできなくても一定量の報酬を受け取れる。\n交換コード「命の遺志の答え」｜ゲーム内通貨120000円、ショップポイント1200、VUNDギア12個、クイックチケット12枚、蛇銭貨120枚など。'
  },
];

const allEntries = [...weaponEntries, ...cardEntries, ...medicineEntries, ...baseEntries, ...enemyEntries];
const uniqueEntries = allEntries.filter((entry, index, source) =>
  index === source.findIndex((candidate) => candidate.category === entry.category && candidate.title === entry.title)
);

export const defaultEntries = uniqueEntries.map((entry) => ({
  ...entry,
  game: GAME_ID,
  revision: 0,
  source: entry.source || '初期収録'
}));
