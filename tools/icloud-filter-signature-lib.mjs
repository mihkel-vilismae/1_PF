import { createHash } from 'node:crypto';

const MEDIA_TYPES = new Set(['any', 'photo', 'video']);
const ORDER_MODES = new Set(['newest_first', 'oldest_first']);

export function normalizeIcloudDownloadFilter(input = {}) {
  const mediaType = String(input.media_type ?? input.mediaType ?? 'any').trim().toLowerCase();
  const order = String(input.order ?? input.order_mode ?? input.orderMode ?? 'newest_first').trim().toLowerCase();
  const limit = Number(input.limit ?? input.recentCount ?? input.count ?? 5);
  if (!MEDIA_TYPES.has(mediaType)) throw new Error(`Unsupported media_type: ${mediaType}`);
  if (!ORDER_MODES.has(order)) throw new Error(`Unsupported order: ${order}`);
  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) throw new Error('limit must be an integer between 1 and 500');
  const normalized = { media_type: mediaType, order, limit };
  if (input.album_label_hash) normalized.album_label_hash = String(input.album_label_hash).trim();
  if (input.date_from) normalized.date_from = normalizeDate(input.date_from, 'date_from');
  if (input.date_to) normalized.date_to = normalizeDate(input.date_to, 'date_to');
  return sortObject(normalized);
}

export function createIcloudFilterSignature(filter) {
  const normalized = normalizeIcloudDownloadFilter(filter);
  const canonicalJson = JSON.stringify(normalized);
  const sha256 = createHash('sha256').update(canonicalJson).digest('hex');
  return { normalized, canonical_json: canonicalJson, filter_signature: `sha256:${sha256}` };
}

function normalizeDate(value, key) {
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`${key} must be YYYY-MM-DD`);
  return text;
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, sortObject(entry)]));
  }
  return value;
}
