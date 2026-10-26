import React from 'react';
import { GitCompare } from 'lucide-react';
import {
  compactNumber, fullNumber, formatBytes, formatDate, relativeTime, buildTakeaways, FORMAT_LABELS, TYPES_LABELS
} from '../lib/index.js';
import Chart from './Chart.jsx';
import Followups from './Followups.jsx';
import { Alert, Chip } from './Parts.jsx';

const ROWS = [
  ['Latest version', p => p.version],
  ['Released', p => (p.released ? `${relativeTime(p.released)} (${formatDate(p.released)})` : 'Unavailable')],
  ['Weekly downloads', p => fullNumber(p.downloads)],
  ['License', p => p.license],
  ['Unpacked size', p => formatBytes(p.unpackedSize)],
  ['Dependencies', p => p.dependencies],
  ['TypeScript', p => TYPES_LABELS[p.typescript.state]],
  ['Module format', p => FORMAT_LABELS[p.format]],
  ['Node.js', p => p.engines || 'Not specified'],
  ['Deprecated', p => (p.deprecated ? 'Yes' : 'No')]
];


function DownloadShare({ packages }) {
  const known = packages.filter(p => p.downloads != null);
  const total = known.reduce((sum, p) => sum + p.downloads, 0);
  if (known.length < 2 || !total) return null;

  return (
    <div className="share">
      <div className="share-bar" role="img" aria-label={known.map(p => `${p.name} ${Math.round((p.downloads / total) * 100)}%`).join(', ')}>
        {known.map((p, i) => (
          <span key={p.name} style={{ width: `${(p.downloads / total) * 100}%`, background: `var(--series-${packages.indexOf(p) + 1})` }} />
        ))}
      </div>
      <ul>
        {known.map(p => (
          <li key={p.name}>
            <i style={{ background: `var(--series-${packages.indexOf(p) + 1})` }} />
            <b>{p.name}</b> {Math.round((p.downloads / total) * 100)}% <span>({compactNumber(p.downloads)}/week)</span>
          </li>
        ))}
      </ul>
      <p className="note">Share of the combined weekly downloads of these packages only, not of npm as a whole.</p>
    </div>
  );
}

export default function CompareView({ packages, onSearch }) {
  const takeaways = buildTakeaways(packages);

  return (
    <>
      <section className="panel takeaways">
        <h3>Key takeaways</h3>
        <ul>
          {takeaways.map(line => <li key={line} className={line.startsWith('⚠') ? 'warn' : ''}>{line}</li>)}
        </ul>
        <p className="note">These are facts from npm metadata, not a verdict on which package suits your project.</p>
      </section>

      <section className="panel">
        <h3>Downloads</h3>
        <DownloadShare packages={packages} />
        <Chart series={packages.map(p => ({ name: p.name, points: p.daily }))} />
      </section>

      <section className="panel">
        <h3><GitCompare size={17} aria-hidden="true" /> Side by side</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                {packages.map(p => (
                  <th scope="col" key={p.name}>
                    {p.name} {p.deprecated && <Chip tone="danger">deprecated</Chip>}
                    <button type="button" className="text-link" onClick={() => onSearch(`npm ${p.name}`)}>Details</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, read]) => {
                const values = packages.map(read);
                const differs = new Set(values.map(String)).size > 1;
                return (
                  <tr key={label} className={differs ? 'differs' : ''}>
                    <th scope="row">{label}</th>
                    {values.map((value, i) => (
                      <td key={packages[i].name} className={label === 'Deprecated' && packages[i].deprecated ? 'bad' : ''}>{value}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note">Rows with a coloured edge are the ones where the packages differ.</p>
      </section>

      {packages.filter(p => p.deprecated).map(p => (
        <Alert key={p.name} title={`${p.name} is deprecated`}>{p.deprecated}</Alert>
      ))}

      <Followups names={packages.map(p => p.name)} onSearch={onSearch} />
    </>
  );
}
