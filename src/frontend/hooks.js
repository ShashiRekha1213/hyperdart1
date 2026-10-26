import { useEffect, useState } from 'react';
import { parseQuery, findPackages, isAbort } from './lib/index.js';
import { loadResult } from './loadResult.js';

const THEME_KEY = 'package-insight-theme';
const NEXT_THEME = { auto: 'light', light: 'dark', dark: 'auto' };


export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'auto';
    } catch {
      return 'auto'; 
    }
  });

  function cycleTheme() {
    const next = NEXT_THEME[theme];
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {

    }
  }

  return [theme, cycleTheme];
}






export function useQueryResult(query, hintNames, repoHints) {
  const [state, setState] = useState({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const hintKey = hintNames.join('|');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function run() {
      setState({ status: 'loading' });
      try {
        const entities = hintNames.map(name => ({ sourceID: name, collectionType: 'HD_PACKAGES' }));
        const parsed = parseQuery(query, { query, entities });

        if (parsed.mode === 'empty') {
          setState({ status: 'idle' });
          return;
        }

        const data = await loadResult(parsed, { signal, repoHints });
        if (!signal.aborted) setState({ status: 'done', parsed, ...data });
      } catch (error) {
        if (signal.aborted || isAbort(error)) return;
        setState({
          status: 'error',
          message: error.message || 'Something went wrong.',
          code: error.code,

          searched: error.code === 'notfound' ? query.split(/\s+/).pop() : null
        });
      }
    }

    run();
    return () => controller.abort();


  }, [query, hintKey, attempt]);

  return [state, () => setAttempt(n => n + 1)];
}


export function useSuggestions(state) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setSuggestions([]);
    if (state.status !== 'error' || !state.searched) return;

    const controller = new AbortController();
    findPackages(state.searched, { signal: controller.signal, size: 4 })
      .then(results => setSuggestions(results.slice(0, 3).map(r => r.name)))
      .catch(error => { if (!isAbort(error)) setSuggestions([]); });

    return () => controller.abort();
  }, [state]);

  return suggestions;
}
