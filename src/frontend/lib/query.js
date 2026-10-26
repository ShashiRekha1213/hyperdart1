




const PKG = '(?:@[a-z0-9._~-]+/)?[a-z0-9][a-z0-9._~-]*';
const VER = 'v?\\d+(?:\\.\\d+){0,2}';


const PREFIX = new RegExp(
  '^(?:(?:please\\s+)?(?:show\\s+(?:me\\s+)?)?(?:(?:npm\\s+)?(?:' +
    'compare(?:\\s+(?:npm\\s+)?packages?)?|' +
    '(?:latest|current)\\s+version\\s+of|' +
    'alternatives?\\s+(?:to|for)|' +
    'packages?\\s+(?:like|similar\\s+to)|' +
    'package\\s+info(?:\\s+for)?|' +
    'info\\s+(?:on|about)|' +
    'npm' +
  ')\\s+)+)',
  'i'
);


const VERSION_QUERY = new RegExp(
  `^(${PKG})(?:@|\\s+)${VER}(?:\\s*(?:,|&|vs\\.?|versus|and)?\\s*(?:\\1(?:@|\\s+))?${VER})*$`,
  'i'
);


const ALTERNATIVE_TAIL = new RegExp(
  '(?:alternatives?\\s+(?:to|for)|replace(?:ment)?(?:\\s+for)?|instead\\s+of|' +
    '(?:packages?|librar(?:y|ies))\\s+(?:like|similar\\s+to)|similar\\s+to)' +
    `\\s+(${PKG})(?:\\s+npm)?\\s*[?.!]?$`,
  'i'
);

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');





export function unwrapSearchData(data) {
  const list = (Array.isArray(data) ? data : data ? [data] : []).filter(Boolean);
  const entities = list.flatMap(item => {
    if (Array.isArray(item.entities)) return item.entities;
    return item.entities ? [item.entities] : [];
  });

  return {
    entities,
    query: list.find(item => item.query)?.query || '',
    suggestedPlace: list.find(item => item.suggestedPlace)?.suggestedPlace || ''
  };
}


export function normalizeEntities(data, query) {
  const unwrapped = unwrapSearchData(data);
  const text = String(query ?? unwrapped.query ?? '').toLowerCase();
  const seen = new Set();
  const found = [];

  unwrapped.entities.forEach((entity, order) => {
    if (!entity || !entity.sourceID) return;
    const isPackage = entity.collectionName === 'NPM_PACKAGES' || entity.collectionType === 'HD_PACKAGES';
    if (!isPackage || seen.has(entity.sourceID)) return;

    seen.add(entity.sourceID);
    const position = text.indexOf(String(entity.word || entity.sourceID).toLowerCase());
    found.push({ name: entity.sourceID, position: position < 0 ? Infinity : position, order });
  });

  return found
    .sort((a, b) => a.position - b.position || a.order - b.order)
    .slice(0, 3)
    .map(item => item.name);
}




export function extractUseCase(text) {
  const original = String(text).trim().replace(/[?.!]+$/, '');
  const fillers = /^(?:please|what|which|whats|what's|is|are|the|a|an|best|top|good|great|recommended?|popular|npm|node(?:\.?js)?|javascript|js|packages?|librar(?:y|ies)|modules?|for|to|that|can|i|need|want|use|using|should)\s+/i;

  let result = original;
  let previous;
  do {
    previous = result;
    result = result.replace(fillers, '');
  } while (result !== previous);

  return result || original;
}



function detectVersions(text, names) {
  if (names.length !== 1) return [];

  const versionToken = /(?<![\w.-])v?(\d+(?:\.\d+){0,2})(?![\w-])/g;
  const rest = text.replace(PREFIX, '').replace(new RegExp(escapeRegExp(names[0]), 'gi'), ' ');
  const versions = [...rest.matchAll(versionToken)].map(m => m[1]);
  if (!versions.length) return [];

  const leftover = rest
    .replace(versionToken, ' ')
    .replace(/\b(?:vs\.?|versus|and|compare|between|npm|version|versions|v)\b|[,@&]/gi, ' ')
    .trim();
  if (leftover) return [];

  return [...new Set(versions)].slice(0, 3);
}


function guessNames(text, flags) {
  const cleaned = text.replace(PREFIX, '').replace(/\s+npm$/i, '').replace(/[?.!]+$/, '').trim();

  if (flags.alternatives) {
    const match = text.match(ALTERNATIVE_TAIL);
    if (match) return [match[1]];
  }
  if (flags.usecase) return [];

  const versionMatch = cleaned.match(VERSION_QUERY);
  if (versionMatch) return [versionMatch[1]];

  const parts = cleaned
    .split(/\s*(?:,|&|\s+vs\.?\s+|\s+versus\s+|\s+and\s+)\s*/i)
    .map(part => part.trim())
    .filter(Boolean);
  const looksLikePackages = parts.length > 0 && parts.length <= 3 &&
    parts.every(part => new RegExp(`^${PKG}$`, 'i').test(part));

  return looksLikePackages ? [...new Set(parts)] : [];
}





export function parseQuery(query = '', searchData = {}) {
  const text = String(query).trim();

  const flags = {
    compare: /\b(compare|versus|vs\.?|difference between|differences between)\b/i.test(text),
    alternatives: /\b(alternatives?|similar|replace(?:ment)?|instead of|packages? like|librar(?:y|ies) like)\b/i.test(text),
    usecase: /\b(best|top|recommend(?:ed)?)\b|\b(?:librar(?:y|ies)|packages?|modules?)\s+(?:for|to)\b/i.test(text),
    latest: /\b(latest|current|newest)\b|\bversion of\b/i.test(text)
  };

  let names = normalizeEntities(searchData, text);
  if (!names.length && text) names = guessNames(text, flags);

  const versions = flags.alternatives || flags.usecase ? [] : detectVersions(text, names);

  let mode;
  if (flags.usecase && !flags.compare && !flags.alternatives) mode = 'usecase';
  else if (versions.length) mode = 'versions';
  else if (names.length > 1 && !flags.alternatives) mode = 'compare';
  else if (flags.alternatives && names.length) mode = 'alternatives';
  else if (!names.length) mode = text ? 'usecase' : 'empty';
  else if (flags.latest) mode = 'latest';
  else mode = 'details';

  return {
    mode,
    names,
    versions,
    term: mode === 'usecase' ? extractUseCase(text) : '',
    original: text
  };
}
