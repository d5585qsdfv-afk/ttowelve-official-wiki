// Existing imported records and cloud edits share these three body fields.
// Keep the source text authoritative; no invented classification or schema migration.
export function enemyMetadata(entry) {
  const field = label => (entry.body || '').match(new RegExp('^' + label + '[｜|：:][ \\t]*(.*)$', 'm'))?.[1]?.trim() || '';
  return {
    classification: field('分類') || '未分類',
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
