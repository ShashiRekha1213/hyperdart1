

import {
  NpmError, latestUrl, registryUrl, downloadsUrl, downloadsRangeUrl, versionDownloadsUrl,
  typesPackageName, fetchJson, firstOf, optional, isAbort, throwIfAborted
} from './npm.js';
import { parseVersion, resolveVersion, matchesPrefix } from './semver.js';




export function detectFormat(info = {}) {
  const exportsText = info.exports ? JSON.stringify(info.exports) : '';
  const isModule = info.type === 'module';

  const hasEsm = isModule || Boolean(info.module) || /"import"|\.mjs/.test(exportsText);
  const hasCjs = !isModule || /"require"|\.cjs/.test(exportsText);

  if (hasEsm && hasCjs) return 'dual';
  if (hasEsm) return 'esm';
  if (hasCjs) return 'cjs';
  return 'unknown';
}


export function detectTypes(info = {}, typesPackage = null) {
  const exportsText = info.exports ? JSON.stringify(info.exports) : '';
  const bundled =
    Boolean(info.types || info.typings) ||
    /"types"|\.d\.[cm]?ts/.test(exportsText) ||
    /\.d\.[cm]?ts$/.test(info.main || '');

  if (bundled) return { state: 'bundled', pkg: null };
  if (typesPackage) return { state: 'types-pkg', pkg: typesPackage };
  return { state: 'none', pkg: null };
}


export function cleanRepoUrl(repository) {
  let url = typeof repository === 'string' ? repository : repository?.url;
  if (!url) return null;

  url = url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');

  if (url.startsWith('github:')) url = `https://github.com/${url.slice(7)}`;
  else if (/^[\w.-]+\/[\w.-]+$/.test(url)) url = `https://github.com/${url}`;

  return /^https?:\/\//.test(url) ? url : null;
}

function readLicense(info) {
  const license = info.license ?? info.licenses;
  if (typeof license === 'string') return license;
  if (Array.isArray(license)) return license.map(l => l.type || l).join(' / ') || 'Unknown';
  return license?.type || 'Unknown';
}

function readKeywords(info) {
  if (Array.isArray(info.keywords)) return info.keywords;
  if (typeof info.keywords === 'string') return info.keywords.split(/[,\s]+/).filter(Boolean);
  return [];
}


export function normalizeVersionDoc(info = {}, extra = {}) {
  return {
    name: info.name || extra.name,
    version: info.version || 'Unknown',
    description: info.description || 'No description provided.',
    license: readLicense(info),
    homepage: info.homepage || null,
    repository: cleanRepoUrl(info.repository) || extra.repoHint || null,
    keywords: readKeywords(info),
    deprecated: info.deprecated ? String(info.deprecated) : null,
    engines: info.engines?.node || null,
    typescript: detectTypes(info, extra.typesPackage),
    format: detectFormat(info),
    unpackedSize: info.dist?.unpackedSize ?? null,
    fileCount: info.dist?.fileCount ?? null,
    dependencies: Object.keys(info.dependencies || {}).length,
    peerDependencies: Object.keys(info.peerDependencies || {}).length,
    released: extra.released || null
  };
}


export function recentReleases(record, count = 6) {
  return Object.entries(record?.time || {})
    .filter(([version]) => {
      const parsed = parseVersion(version);
      return parsed && !parsed.pre;
    })
    .sort((a, b) => new Date(b[1]) - new Date(a[1]))
    .slice(0, count)
    .map(([version, date]) => ({ version, date }));
}



export async function getPackage(name, { signal, repoHint } = {}) {

  const latestRequest = fetchJson(latestUrl(name), { signal });
  latestRequest.catch(() => {}); 
  const fullRequest = optional(fetchJson(registryUrl(name), { signal, timeout: 25000 }));
  const weeklyRequest = optional(firstOf([downloadsUrl(name), downloadsUrl(name).replace('last-week', 'lastweek')], signal));
  const dailyRequest = optional(firstOf([downloadsRangeUrl(name), downloadsRangeUrl(name).replace('last-month', 'lastmonth')], signal));
  const typesRequest = optional(fetchJson(latestUrl(typesPackageName(name)), { signal, retries: 0 }));

  let latest = null;
  let latestError = null;
  try {
    latest = await latestRequest;
  } catch (error) {
    if (isAbort(error)) throw error;
    latestError = error;
  }

  const full = await fullRequest;
  throwIfAborted(signal);


  const info = latest || full?.versions?.[full['dist-tags']?.latest];
  if (!info) {
    if (latestError?.code === 'notfound') throw new NpmError(`“${name}” was not found on npm.`, 'notfound');
    throw new NpmError(`Could not load ${name}: ${latestError?.message || 'unknown error'}`, latestError?.code || 'http');
  }

  const [weekly, daily, typesDoc] = await Promise.all([weeklyRequest, dailyRequest, typesRequest]);
  throwIfAborted(signal);

  const missing = [];
  if (!full) missing.push('release dates');
  if (weekly?.downloads == null) missing.push('download counts');

  return {
    ...normalizeVersionDoc(info, {
      name,
      repoHint,
      released: full?.time?.[info.version] || null,
      typesPackage: typesDoc?.name || null
    }),
    downloads: weekly?.downloads ?? null,
    daily: Array.isArray(daily?.downloads) ? daily.downloads : null,
    releases: full ? recentReleases(full) : [],
    distTags: full?.['dist-tags'] || {},
    missing
  };
}


export async function getPackages(names, { signal, hints = {} } = {}) {
  const settled = await Promise.allSettled(names.map(name => getPackage(name, { signal, repoHint: hints[name] })));
  throwIfAborted(signal);

  const packages = [];
  const failures = [];
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') packages.push(result.value);
    else failures.push({ name: names[i], error: result.reason });
  });

  if (!packages.length) throw failures[0].error;
  return { packages, failures };
}



export async function getVersionSet(name, specs, { signal } = {}) {
  let record;
  try {
    record = await fetchJson(registryUrl(name), { signal, timeout: 25000 });
  } catch (error) {
    if (isAbort(error)) throw error;
    throw error.code === 'notfound' ? new NpmError(`“${name}” was not found on npm.`, 'notfound') : error;
  }

  const [weekly, perVersion] = await Promise.all([
    optional(fetchJson(downloadsUrl(name), { signal })),
    optional(fetchJson(versionDownloadsUrl(name), { signal, retries: 0 }))
  ]);
  throwIfAborted(signal);

  const counts = perVersion?.downloads || null;
  const totalDownloads = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;
  const latest = record['dist-tags']?.latest;

  const rows = specs.map(spec => {
    const version = resolveVersion(record.versions, spec);
    if (!version) return { spec, version: null };


    let share = null;
    if (counts && totalDownloads) {
      const matching = Object.entries(counts)
        .filter(([v]) => matchesPrefix(v, spec))
        .reduce((sum, [, n]) => sum + n, 0);
      share = matching / totalDownloads;
    }

    return {
      spec,
      share,
      ...normalizeVersionDoc(record.versions[version], { name, released: record.time?.[version] })
    };
  });

  return {
    name,
    latest,
    latestReleased: record.time?.[latest] || null,
    downloads: weekly?.downloads ?? null,
    rows
  };
}
