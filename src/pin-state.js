export const MAX_PINNED_ENTRIES = 4;
export const PINNED_LIMIT_OPTIONS = [2, 4, 6, 8];

export function normalizePinnedLimit(value, fallback = MAX_PINNED_ENTRIES) {
  const numeric = Number(value);
  return PINNED_LIMIT_OPTIONS.includes(numeric) ? numeric : fallback;
}

export function normalizePinnedIds(value, max = MAX_PINNED_ENTRIES) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && id.trim()))].slice(0, max);
}

export function togglePinnedIds(current, id, max = MAX_PINNED_ENTRIES) {
  const pinned = normalizePinnedIds(current, max);
  if (!id) return { ids: pinned, changed: false, reason: 'invalid' };
  if (pinned.includes(id)) return { ids: pinned.filter(item => item !== id), changed: true, reason: 'removed' };
  if (pinned.length >= max) return { ids: pinned, changed: false, reason: 'limit' };
  return { ids: [...pinned, id], changed: true, reason: 'added' };
}

export function pinnedEntries(entries, ids, max = MAX_PINNED_ENTRIES) {
  const byId = new Map((entries || []).map(entry => [entry.id, entry]));
  return normalizePinnedIds(ids, max).map(id => byId.get(id)).filter(Boolean);
}
