import React, { useMemo, useState } from 'react';
import { compactNumber } from '../lib/index.js';
import { Chip } from './Parts.jsx';



export default function CandidateList({ items, base, onSearch, sortable = false }) {
  const [sortBy, setSortBy] = useState('relevance');

  const ordered = useMemo(() => {
    if (sortBy !== 'downloads') return items;
    return [...items].sort((a, b) => (b.downloads ?? -1) - (a.downloads ?? -1));
  }, [items, sortBy]);

  if (!items.length) return <p className="note">No matching packages found. Try different wording.</p>;

  const mostDownloads = Math.max(1, ...items.map(item => item.downloads || 0));

  return (
    <>
      {sortable && (
        <div className="sort" role="group" aria-label="Sort results">
          Sort by
          <button type="button" aria-pressed={sortBy === 'relevance'} onClick={() => setSortBy('relevance')}>npm relevance</button>
          <button type="button" aria-pressed={sortBy === 'downloads'} onClick={() => setSortBy('downloads')}>Weekly downloads</button>
        </div>
      )}

      <ol className="candidates">
        {ordered.map((item, index) => (
          <li className="candidate" key={item.name}>
            <span className="rank" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>

            <div className="candidate-body">
              <strong>{item.name}</strong> <Chip>v{item.version || '?'}</Chip>
              <p>{item.description}</p>
              {item.shared?.length > 0 && (
                <div className="shared">
                  <small>Shared keywords</small>
                  {item.shared.slice(0, 5).map(keyword => <Chip key={keyword} tone="accent">{keyword}</Chip>)}
                </div>
              )}
              <div className="downloads">
                <span className="meter" aria-hidden="true">
                  <i style={{ width: `${item.downloads ? Math.max(2, (item.downloads / mostDownloads) * 100) : 0}%` }} />
                </span>
                {compactNumber(item.downloads)} / week
              </div>
            </div>

            <div className="candidate-actions">
              <button type="button" onClick={() => onSearch(base ? `compare ${base} and ${item.name}` : `npm ${item.name}`)}>
                {base ? 'Compare' : 'Details'}
              </button>
              {base && <button type="button" className="quiet" onClick={() => onSearch(`npm ${item.name}`)}>Details</button>}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
