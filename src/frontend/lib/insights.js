


import { compactNumber, formatBytes, relativeTime, daysSince, joinList, FORMAT_LABELS } from './format.js';





export function getSignals(pkg, now = Date.now()) {
  const signals = [];

  if (pkg.deprecated) signals.push({ tone: 'bad', text: 'Deprecated' });

  const age = daysSince(pkg.released, now);
  if (age != null) {
    if (age <= 180) signals.push({ tone: 'good', text: `Released ${relativeTime(pkg.released, now)}` });
    else if (age > 730) signals.push({ tone: 'warn', text: `No release for ${Math.floor(age / 365)}+ years` });
    else signals.push({ tone: 'neutral', text: `Released ${relativeTime(pkg.released, now)}` });
  }

  if (pkg.typescript.state === 'bundled') signals.push({ tone: 'good', text: 'Types included' });
  else if (pkg.typescript.state === 'types-pkg') signals.push({ tone: 'neutral', text: 'Types via @types' });
  else signals.push({ tone: 'neutral', text: 'No types detected' });

  if (pkg.format === 'esm' || pkg.format === 'dual') signals.push({ tone: 'good', text: 'ESM supported' });
  else if (pkg.format === 'cjs') signals.push({ tone: 'neutral', text: 'CommonJS only' });

  if (pkg.dependencies === 0) signals.push({ tone: 'good', text: 'No dependencies' });

  return signals;
}



export function buildTakeaways(packages, now = Date.now()) {
  if (packages.length < 2) return [];
  const lines = [];


  const byDownloads = packages.filter(p => p.downloads != null).sort((a, b) => b.downloads - a.downloads);
  if (byDownloads.length >= 2) {
    const [first, second] = byDownloads;
    const ratio = second.downloads ? first.downloads / second.downloads : Infinity;
    const counts = `${compactNumber(first.downloads)} vs ${compactNumber(second.downloads)}`;

    if (ratio < 1.1) {
      lines.push(`${first.name} and ${second.name} have similar weekly downloads (${counts}).`);
    } else {
      const times = Number.isFinite(ratio) ? `about ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}×` : 'far more';
      lines.push(`${first.name} has ${times} the weekly downloads of ${second.name} (${counts}). Downloads measure usage, not quality.`);
    }
  }


  const byRelease = packages.filter(p => p.released).sort((a, b) => new Date(b.released) - new Date(a.released));
  if (byRelease.length >= 2) {
    lines.push(`Latest releases: ${joinList(byRelease.map(p => `${p.name} ${relativeTime(p.released, now)}`))}.`);
  }


  const names = state => packages.filter(p => p.typescript.state === state).map(p => p.name);
  const bundled = names('bundled');
  const viaTypes = names('types-pkg');
  const untyped = names('none');
  if (bundled.length === packages.length) {
    lines.push('All of them include TypeScript types in the package.');
  } else {
    const parts = [];
    if (bundled.length) parts.push(`${joinList(bundled)} ${bundled.length === 1 ? 'ships' : 'ship'} bundled types`);
    if (viaTypes.length) parts.push(`${joinList(viaTypes)} ${viaTypes.length === 1 ? 'has a' : 'have'} separate @types package${viaTypes.length === 1 ? '' : 's'}`);
    if (untyped.length) parts.push(`no types detected for ${joinList(untyped)}`);
    lines.push(`${parts.join('; ')}.`);
  }


  const bySize = packages.filter(p => p.unpackedSize != null).sort((a, b) => a.unpackedSize - b.unpackedSize);
  if (bySize.length >= 2) {
    lines.push(`Unpacked size, smallest first: ${joinList(bySize.map(p => `${p.name} ${formatBytes(p.unpackedSize)}`))}. This is not the same as bundle size.`);
  }
  if (new Set(packages.map(p => p.dependencies)).size > 1) {
    lines.push(`Runtime dependencies: ${joinList(packages.map(p => `${p.name} ${p.dependencies}`))}.`);
  }


  if (new Set(packages.map(p => p.format)).size > 1) {
    lines.push(`Module formats differ: ${joinList(packages.map(p => `${p.name} (${FORMAT_LABELS[p.format]})`))}.`);
  }
  if (new Set(packages.map(p => p.license)).size > 1) {
    lines.push(`Licenses differ: ${joinList(packages.map(p => `${p.name} (${p.license})`))}.`);
  }


  const deprecated = packages.filter(p => p.deprecated).map(p => p.name);
  if (deprecated.length) {
    lines.unshift(`⚠ ${joinList(deprecated)} ${deprecated.length === 1 ? 'is' : 'are'} deprecated on npm.`);
  }

  return lines;
}



export function buildVersionTakeaways(set, now = Date.now()) {
  const lines = [];
  const rows = set.rows.filter(row => row.version);

  if (set.latest) {
    const when = set.latestReleased ? `, released ${relativeTime(set.latestReleased, now)}` : '';
    lines.push(`The latest tag for ${set.name} is ${set.latest}${when}.`);
  }
  if (rows.length < 2) return lines;

  if (new Set(rows.map(r => r.engines || 'not specified')).size > 1) {
    lines.push(`Node requirement: ${joinList(rows.map(r => `${r.version} needs ${r.engines || 'nothing specified'}`))}.`);
  }
  if (new Set(rows.map(r => r.dependencies)).size > 1) {
    lines.push(`Runtime dependencies: ${joinList(rows.map(r => `${r.version} has ${r.dependencies}`))}.`);
  }

  const sized = rows.filter(r => r.unpackedSize != null);
  if (sized.length > 1 && new Set(sized.map(r => r.unpackedSize)).size > 1) {
    lines.push(`Unpacked size: ${joinList(sized.map(r => `${r.version} ${formatBytes(r.unpackedSize)}`))}.`);
  }
  if (new Set(rows.map(r => r.format)).size > 1) {
    lines.push(`Module format: ${joinList(rows.map(r => `${r.version} ${FORMAT_LABELS[r.format]}`))}.`);
  }
  if (new Set(rows.map(r => r.typescript.state)).size > 1) {
    lines.push('TypeScript support differs between these versions.');
  }

  const withShare = rows.filter(r => r.share != null);
  if (withShare.length) {
    const percent = share => `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`;
    lines.push(`Share of last week’s downloads: ${joinList(withShare.map(r => `${r.spec}.x ${percent(r.share)}`))}.`);
  }

  return lines;
}
