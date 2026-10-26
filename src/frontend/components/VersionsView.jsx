import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatBytes, formatDate, buildVersionTakeaways, FORMAT_LABELS, TYPES_LABELS } from '../lib/index.js';
import { Alert } from './Parts.jsx';

const ROWS = [
  ['Resolved version', r => r.version],
  ['Released', r => formatDate(r.released)],
  ['Share of weekly downloads', r => (r.share == null ? 'Unavailable' : `${(r.share * 100).toFixed(r.share < 0.1 ? 1 : 0)}%`)],
  ['Node.js', r => r.engines || 'Not specified'],
  ['Dependencies', r => r.dependencies],
  ['Unpacked size', r => formatBytes(r.unpackedSize)],
  ['TypeScript', r => TYPES_LABELS[r.typescript.state]],
  ['Module format', r => FORMAT_LABELS[r.format]],
  ['Deprecated', r => (r.deprecated ? 'Yes' : 'No')]
];


export default function VersionsView({ set, onSearch }) {
  const found = set.rows.filter(row => row.version);
  const notFound = set.rows.filter(row => !row.version);
  const takeaways = buildVersionTakeaways(set);

  return (
    <>
      {notFound.length > 0 && (
        <Alert tone="warn">No stable release found for {notFound.map(r => `${set.name} ${r.spec}`).join(', ')}.</Alert>
      )}

      <section className="panel takeaways">
        <h3>{set.name}: {set.rows.map(r => r.spec).join(' vs ')}</h3>
        <ul>{takeaways.map(line => <li key={line}>{line}</li>)}</ul>
        <p className="note">“4” means the highest stable 4.x.x release. Pre-releases are skipped.</p>
      </section>

      {found.length > 0 && (
        <section className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  {found.map(row => <th scope="col" key={row.spec}>{set.name} {row.spec}.x</th>)}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, read]) => {
                  const values = found.map(read);
                  return (
                    <tr key={label} className={new Set(values.map(String)).size > 1 ? 'differs' : ''}>
                      <th scope="row">{label}</th>
                      {values.map((value, i) => <td key={found[i].spec}>{value}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {found.filter(row => row.deprecated).map(row => (
        <Alert key={row.version} title={`${set.name}@${row.version} is deprecated`}>{row.deprecated}</Alert>
      ))}

      <div className="followups">
        <button type="button" onClick={() => onSearch(`npm ${set.name}`)}>Package details <ArrowRight size={13} /></button>
        <button type="button" onClick={() => onSearch(`npm alternatives to ${set.name}`)}>See alternatives <ArrowRight size={13} /></button>
      </div>
    </>
  );
}
