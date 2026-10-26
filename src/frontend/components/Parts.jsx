import React, { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';

export function Chip({ tone, children }) {
  return <span className={`chip ${tone || ''}`}>{children}</span>;
}


export function Alert({ tone = 'danger', title, children }) {
  return (
    <div className={`alert ${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <AlertTriangle size={17} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        <p>{children}</p>
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <strong>{value}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}


const MARKS = { good: '✓', warn: '!', bad: '✕', neutral: '•' };

export function SignalList({ signals }) {
  return (
    <ul className="signals" aria-label="Quick facts">
      {signals.map(signal => (
        <li key={signal.text} className={signal.tone}>
          <span aria-hidden="true">{MARKS[signal.tone]}</span>
          {signal.text}
        </li>
      ))}
    </ul>
  );
}

export function CopyInstall({ name }) {
  const [copied, setCopied] = useState(false);
  const command = `npm i ${name}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {

    }
  }

  return (
    <button type="button" className="install" onClick={copy} aria-label={`Copy ${command}`}>
      <code>{command}</code>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
