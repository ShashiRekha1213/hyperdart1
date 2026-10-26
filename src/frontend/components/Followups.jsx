import React, { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';


export default function Followups({ names, latestMajor = 0, onSearch }) {
  const [adding, setAdding] = useState(false);
  const [extra, setExtra] = useState('');

  function compareWithExtra(event) {
    event.preventDefault();
    const name = extra.trim().replace(/\s+/g, '-');
    if (name) onSearch(`compare ${[...names, name].join(', ')}`);
  }

  return (
    <div className="followups">
      {names.map(name => (
        <button type="button" key={name} onClick={() => onSearch(`npm alternatives to ${name}`)}>
          See alternatives{names.length > 1 ? ` to ${name}` : ''} <ArrowRight size={13} />
        </button>
      ))}

      {names.length < 3 && !adding && (
        <button type="button" onClick={() => setAdding(true)}>
          <Plus size={13} /> Compare with…
        </button>
      )}
      {adding && names.length < 3 && (
        <form onSubmit={compareWithExtra}>
          <input autoFocus aria-label="Package to compare with" placeholder="package name" value={extra} onChange={e => setExtra(e.target.value)} />
          <button type="submit">Compare</button>
        </form>
      )}

      {names.length === 1 && latestMajor > 1 && (
        <button type="button" onClick={() => onSearch(`${names[0]} ${latestMajor - 1} vs ${latestMajor}`)}>
          v{latestMajor - 1} vs v{latestMajor} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}
