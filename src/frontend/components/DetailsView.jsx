import React from 'react';
import { ExternalLink, Package } from 'lucide-react';
import {
  compactNumber, fullNumber, formatBytes, formatDate, relativeTime, parseVersion, getSignals, FORMAT_LABELS, TYPES_LABELS
} from '../lib/index.js';
import Chart from './Chart.jsx';
import Followups from './Followups.jsx';
import { Alert, CopyInstall, SignalList, Stat } from './Parts.jsx';


export default function DetailsView({ pkg, onSearch, versionFirst = false }) {
  const major = parseVersion(pkg.version)?.n[0] || 0;
  const otherTags = Object.entries(pkg.distTags || {}).filter(([tag]) => tag !== 'latest').slice(0, 4);
  const typesLabel = TYPES_LABELS[pkg.typescript.state] + (pkg.typescript.pkg ? ` (${pkg.typescript.pkg})` : '');

  return (
    <article className="card details">
      {pkg.deprecated && <Alert title={`${pkg.name} is deprecated`}>{pkg.deprecated}</Alert>}

      {versionFirst && (
        <div className="version-hero">
          <small>LATEST VERSION</small>
          <strong>{pkg.version}</strong>
          <span>{pkg.released ? `Released ${formatDate(pkg.released)} · ${relativeTime(pkg.released)}` : 'Release date unavailable'}</span>
        </div>
      )}

      <header className="pkg-head">
        <span className="pkg-icon"><Package size={20} aria-hidden="true" /></span>
        <div>
          <h3>{pkg.name}</h3>
          {!versionFirst && <span className="version-pill">v{pkg.version}</span>}
        </div>
      </header>
      <p className="description">{pkg.description}</p>
      <SignalList signals={getSignals(pkg)} />

      <div className="stats">
        <Stat label="WEEKLY DOWNLOADS" value={compactNumber(pkg.downloads)} hint={pkg.downloads != null ? fullNumber(pkg.downloads) : null} />
        {!versionFirst && <Stat label="LAST RELEASE" value={relativeTime(pkg.released)} hint={pkg.released ? formatDate(pkg.released) : null} />}
        <Stat label="LICENSE" value={pkg.license} />
      </div>

      <div className="split">
        <section>
          <h4>Downloads, last 30 days</h4>
          <Chart series={[{ name: pkg.name, points: pkg.daily }]} height={170} area />
        </section>
        <section>
          <h4>Install cost &amp; compatibility</h4>
          <dl className="facts">
            <div><dt>Unpacked size</dt><dd>{formatBytes(pkg.unpackedSize)}</dd></div>
            <div><dt>Files</dt><dd>{pkg.fileCount ?? 'Unavailable'}</dd></div>
            <div><dt>Dependencies</dt><dd>{pkg.dependencies}{pkg.peerDependencies ? ` (+${pkg.peerDependencies} peer)` : ''}</dd></div>
            <div><dt>TypeScript</dt><dd>{typesLabel}</dd></div>
            <div><dt>Module format</dt><dd>{FORMAT_LABELS[pkg.format]}</dd></div>
            <div><dt>Node.js</dt><dd>{pkg.engines || 'Not specified'}</dd></div>
          </dl>
          <p className="note">Size is the unpacked tarball, not bundle size. Types and module format come from package metadata and may be incomplete.</p>
        </section>
      </div>

      {pkg.keywords.length > 0 && (
        <div className="keywords">
          {pkg.keywords.slice(0, 8).map(keyword => (
            <button type="button" key={keyword} onClick={() => onSearch(`best package for ${keyword}`)}>{keyword}</button>
          ))}
        </div>
      )}

      <details>
        <summary>Recent releases{otherTags.length ? ' and tags' : ''}</summary>
        {pkg.releases.length ? (
          <ul className="releases">
            {pkg.releases.map(release => (
              <li key={release.version}><code>{release.version}</code><span>{formatDate(release.date)}</span></li>
            ))}
          </ul>
        ) : (
          <p className="note">Release history is unavailable.</p>
        )}
        {otherTags.length > 0 && <p className="note">Other tags: {otherTags.map(([tag, version]) => `${tag} → ${version}`).join(' · ')}</p>}
      </details>

      <div className="links">
        <CopyInstall name={pkg.name} />
        <a href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noreferrer">npm <ExternalLink size={12} /></a>
        {pkg.repository && <a href={pkg.repository} target="_blank" rel="noreferrer">Repository <ExternalLink size={12} /></a>}
        {pkg.homepage && <a href={pkg.homepage} target="_blank" rel="noreferrer">Homepage <ExternalLink size={12} /></a>}
      </div>

      <Followups names={[pkg.name]} latestMajor={major} onSearch={onSearch} />
    </article>
  );
}
