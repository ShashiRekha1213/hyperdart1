

export function compactNumber(value) {
  if (value == null) return 'Unavailable';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function fullNumber(value) {
  if (value == null) return 'Unavailable';
  return new Intl.NumberFormat('en').format(value);
}

export function formatBytes(bytes) {
  if (bytes == null) return 'Unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(date) {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function daysSince(date, now = Date.now()) {
  const t = date ? new Date(date).getTime() : NaN;
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / 86400000);
}

export function relativeTime(date, now = Date.now()) {
  const days = daysSince(date, now);
  if (days == null) return 'Unknown';
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}


export function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export const FORMAT_LABELS = {
  esm: 'ESM only',
  cjs: 'CommonJS only',
  dual: 'ESM + CommonJS',
  unknown: 'Unknown'
};

export const TYPES_LABELS = {
  bundled: 'Bundled types',
  'types-pkg': 'Via @types',
  none: 'None detected'
};
