

import { searchUrl, downloadsUrl, fetchJson, firstOf, isAbort, throwIfAborted } from './npm.js';


const GENERIC_KEYWORDS = new Set([
  'javascript', 'js', 'node', 'nodejs', 'node.js', 'npm', 'typescript', 'ts', 'library', 'lib',
  'util', 'utils', 'utility', 'utilities', 'es6', 'es2015', 'esm', 'cjs', 'commonjs',
  'module', 'modules', 'tool', 'tools'
]);

const STOP_WORDS = new Set(
  'a an and the of for to in on with is are be by or as at from this that it its into using use used can your you our their which than more most any all not no'.split(' ')
);

export async function findPackages(term, { signal, size = 25 } = {}) {
  const data = await fetchJson(searchUrl(term, size), { signal });

  return (data.objects || []).map(item => ({
    name: item.package.name,
    version: item.package.version,
    description: item.package.description || 'No description provided.',
    score: item.score?.final || 0,
    keywords: item.package.keywords || [],
    date: item.package.date || null,
    downloads: null
  }));
}


export function enrichDownloads(candidates, { signal } = {}) {
  return Promise.all(candidates.map(async candidate => {
    try {
      const data = await firstOf([downloadsUrl(candidate.name)], signal);
      return { ...candidate, downloads: data.downloads ?? null };
    } catch (error) {
      if (isAbort(error)) throw error;
      return candidate;
    }
  }));
}

function specificKeywords(keywords) {
  const all = (keywords || []).map(k => String(k).toLowerCase());
  const specific = all.filter(k => !GENERIC_KEYWORDS.has(k));
  return specific.length ? specific : all;
}


export function descriptionTerms(description = '', limit = 3) {
  const words = description.toLowerCase().match(/[a-z][a-z0-9+#-]{2,}/g) || [];
  return [...new Set(words)].filter(word => !STOP_WORDS.has(word)).slice(0, limit);
}

export function alternativeQueries(base) {
  const keywords = specificKeywords(base.keywords);
  const queries = [];

  if (keywords.length) queries.push(keywords.slice(0, 3).join(' '));
  if (keywords.length > 1) queries.push(keywords.slice(0, 2).join(' '));
  if (!keywords.length) queries.push(descriptionTerms(base.description).join(' ') || base.name);

  return [...new Set(queries.filter(Boolean))].slice(0, 2);
}



export function rankAlternatives(base, candidates, limit = 8) {
  const baseKeywords = new Set(specificKeywords(base.keywords));
  const seen = new Set();

  return candidates
    .filter(candidate => {
      if (candidate.name === base.name || candidate.name.startsWith('@types/')) return false;
      if (seen.has(candidate.name)) return false;
      seen.add(candidate.name);
      return true;
    })
    .map(candidate => ({
      ...candidate,
      shared: (candidate.keywords || []).filter(k => baseKeywords.has(String(k).toLowerCase()))
    }))
    .sort((a, b) => b.shared.length - a.shared.length || b.score - a.score)
    .slice(0, limit);
}

export async function getAlternatives(base, { signal } = {}) {
  const searches = await Promise.allSettled(
    alternativeQueries(base).map(query => findPackages(query, { signal }))
  );
  throwIfAborted(signal);

  const succeeded = searches.filter(s => s.status === 'fulfilled');
  if (!succeeded.length) throw searches[0].reason;

  const ranked = rankAlternatives(base, succeeded.flatMap(s => s.value));
  return enrichDownloads(ranked, { signal });
}
