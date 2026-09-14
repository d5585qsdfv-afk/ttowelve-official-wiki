function enemyCode(entry) {
  const subtitleCode = String(entry?.subtitle || '')
    .split('｜')
    .map(value => value.trim())
    .find(value => /^No[.．]/i.test(value));
  if (subtitleCode) return subtitleCode.replace(/^No[.．]\s*/i, '').trim().toUpperCase();

  const idMatch = String(entry?.id || '').match(/^enemy-(.+?)-\d+$/i);
  return idMatch?.[1]?.trim().toUpperCase() || '';
}

export function enemyClassification(entry) {
  const code = enemyCode(entry);
  if (!code) {
    const existing = String(entry?.body || '').match(/^分類[｜|：:]\s*(.*)$/m)?.[1]?.trim();
    return existing || '通常敵';
  }
  const exception = code.match(/^EC[-]?(\d+)$/);
  if (exception && (exception[1] === '112' || exception[1] === '113' || (Number(exception[1]) >= 136 && Number(exception[1]) <= 158))) {
    return '通常敵';
  }
  if (/^(?:A|C|K|V|J)[-]?\d+$/.test(code)) return 'ボス';
  if (/^\d+$/.test(code) && Number(code) >= 801 && Number(code) <= 1499) return 'ボス';
  if (/^E[-]?\d+$/.test(code)) return 'ウェイクレス';
  return '通常敵';
}

export function updateEnemyClassification(body, classification) {
  const value = String(classification || '通常敵').replace(/[\r\n]/g, ' ').trim() || '通常敵';
  const lines = String(body || '').split(/\r?\n/);
  let replaced = false;
  const updated = lines.map(line => {
    if (/^分類[｜|：:]/.test(line)) {
      replaced = true;
      return `分類｜${value}`;
    }
    return line;
  });
  if (!replaced) updated.unshift(`分類｜${value}`);
  return updated.join('\n');
}

export function normalizeEnemyEntry(entry) {
  if (!entry || entry.category !== 'enemies') return entry;
  return { ...entry, body: updateEnemyClassification(entry.body, enemyClassification(entry)) };
}

// Existing imported records and cloud edits share these three body fields.
// Enemy classification follows the No. code while code-less special records retain their explicit label.
export function enemyMetadata(entry) {
  const field = label => (entry.body || '').match(new RegExp('^' + label + '[｜|：:][ \\t]*(.*)$', 'm'))?.[1]?.trim() || '';
  return {
    classification: enemyClassification(entry),
    chapter: field('章') || '未設定',
    location: field('出現場所').replace(/^[（(]|[）)]$/g, '') || '未設定',
    vundClass: entry.vundClass || '',
  };
}

export function updateEnemyBody(body, { classification, chapter, location }) {
  const values = [['章', chapter], ['出現場所', location], ['分類', classification]];
  const rest = String(body || '').split(/\r?\n/).filter(line => !/^(章|出現場所|分類)[｜|：:]/.test(line)).join('\n');
  const header = values.map(([label, value]) => `${label}｜${String(value || '').replace(/[\r\n]/g, ' ').trim()}`).join('\n');
  return header + '\n' + rest;
}
