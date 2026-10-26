import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="skeleton" />
      <div className="skeleton short" />
      <div className="skeleton" />
      <span className="sr-only">Loading package data…</span>
    </div>
  );
}

export function ErrorState({ message, notFound, suggestions, onRetry, onPick }) {
  return (
    <div className="state error" role="alert">
      <AlertTriangle size={22} aria-hidden="true" />
      <p>{message}</p>

      {suggestions.length > 0 && (
        <div className="did-you-mean">
          Did you mean
          {suggestions.map(name => (
            <button type="button" key={name} onClick={() => onPick(`npm ${name}`)}>{name}</button>
          ))}
        </div>
      )}

      {!notFound && (
        <button type="button" className="retry" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
