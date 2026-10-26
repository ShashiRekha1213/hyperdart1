import React, { useEffect, useMemo, useState } from 'react';
import { Search, Package, ArrowRight, Sun, Moon, Monitor, Hash } from 'lucide-react';
import { unwrapSearchData, normalizeEntities } from './lib/index.js';
import { useTheme, useQueryResult, useSuggestions } from './hooks.js';
import DetailsView from './components/DetailsView.jsx';
import CompareView from './components/CompareView.jsx';
import VersionsView from './components/VersionsView.jsx';
import CandidateList from './components/CandidateList.jsx';
import { Alert, Chip } from './components/Parts.jsx';
import { LoadingState, ErrorState } from './components/Status.jsx';
import './style.css';

const THEME_ICONS = { auto: Monitor, light: Sun, dark: Moon };

function headingFor(parsed) {
  const titles = {
    details: 'Package overview',
    latest: 'Latest version',
    compare: 'Side-by-side comparison',
    versions: 'Version comparison',
    alternatives: `Alternatives to ${parsed.names[0]}`,
    usecase: `Packages for “${parsed.term}”`
  };
  return titles[parsed.mode];
}

export default function PackageInsight({ searchData, query: queryProp }) {
  const data = useMemo(() => unwrapSearchData(searchData), [searchData]);
  const incomingQuery = queryProp || data.query;


  const isStandalone = !incomingQuery;

  const [query, setQuery] = useState(incomingQuery || '');
  const [input, setInput] = useState(incomingQuery || '');
  const [theme, cycleTheme] = useTheme();


  useEffect(() => {
    if (incomingQuery) {
      setQuery(incomingQuery);
      setInput(incomingQuery);
    }
  }, [incomingQuery]);



  const hintNames = useMemo(
    () => (query === data.query ? normalizeEntities(searchData, query) : []),
    [query, data.query, searchData]
  );
  const repoHints = useMemo(() => {
    const hints = {};
    data.entities.forEach(entity => {
      if (entity?.sourceID && entity.entityInfo?.repository_url) hints[entity.sourceID] = entity.entityInfo.repository_url;
    });
    return hints;
  }, [data.entities]);

  const [state, retry] = useQueryResult(query, hintNames, repoHints);
  const suggestions = useSuggestions(state);

  function search(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput(trimmed);
    setQuery(trimmed);
  }

  const parsed = state.parsed;
  const ThemeIcon = THEME_ICONS[theme];
  const missingData = state.packages
    ? [...new Set(state.packages.flatMap(p => p.missing.map(item => `${item} for ${p.name}`)))]
    : [];

  return (
    <div className="pi" data-theme={theme}>
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Package size={16} aria-hidden="true" /></span>
          package<span className="brand-accent">insight</span>
        </div>
        <button type="button" className="icon-button" onClick={cycleTheme} title={`Theme: ${theme}`} aria-label={`Theme: ${theme}. Click to change.`}>
          <ThemeIcon size={16} />
        </button>
      </header>

      {isStandalone && (
        <section className="intro">
          <span className="eyebrow">DISCOVER · COMPARE · DECIDE</span>
          <h1>Choose packages <em>with confidence.</em></h1>
          <p>Live npm data and download signals, without the tab overload.</p>
        </section>
      )}

      <form className="search" onSubmit={event => { event.preventDefault(); search(input); }}>
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search npm packages"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder=""
        />
        <button type="submit">Go <ArrowRight size={15} /></button>
      </form>

      <section className="results" aria-live="polite" aria-busy={state.status === 'loading'}>

        {state.status === 'loading' && <LoadingState />}

        {state.status === 'error' && (
          <ErrorState
            message={state.message}
            notFound={state.code === 'notfound'}
            suggestions={suggestions}
            onRetry={retry}
            onPick={search}
          />
        )}

        {state.status === 'done' && (
          <>
            <div className="results-head">
              <h2>{headingFor(parsed)}</h2>
              <span className="live"><span className="live-dot" />LIVE FROM NPM</span>
            </div>

            {state.failures?.length > 0 && (
              <Alert tone="warn">Could not load {state.failures.map(f => f.name).join(', ')}: {state.failures[0].error.message}</Alert>
            )}
            {missingData.length > 0 && <p className="note">Some data was unavailable: {missingData.join('; ')}.</p>}

            {(parsed.mode === 'details' || parsed.mode === 'latest' || (parsed.mode === 'compare' && state.packages.length === 1)) && (
              <DetailsView pkg={state.packages[0]} versionFirst={parsed.mode === 'latest'} onSearch={search} />
            )}

            {parsed.mode === 'compare' && state.packages.length > 1 && (
              <CompareView packages={state.packages} onSearch={search} />
            )}

            {parsed.mode === 'versions' && <VersionsView set={state.set} onSearch={search} />}

            {parsed.mode === 'alternatives' && (
              <section className="panel">
                <div className="based-on">
                  <Hash size={15} aria-hidden="true" />
                  Based on <strong>{state.packages[0].name}</strong>
                  {state.packages[0].deprecated && <Chip tone="danger">deprecated</Chip>}
                  {state.packages[0].keywords.length > 0 && <span>· keywords: {state.packages[0].keywords.slice(0, 4).join(', ')}</span>}
                </div>
                {state.packages[0].deprecated && <Alert>{state.packages[0].deprecated}</Alert>}

                {state.alternativesError ? (
                  <p className="note">Could not search for alternatives: {state.alternativesError}</p>
                ) : (
                  <>
                    <p className="note">Ordered by shared keywords, then npm search relevance. A starting list to check out, not a ranking of quality.</p>
                    <CandidateList items={state.candidates} base={state.packages[0].name} onSearch={search} />
                  </>
                )}
              </section>
            )}

            {parsed.mode === 'usecase' && (
              <section className="panel">
                <p className="note">Matches from npm search for “{parsed.term}”. Popularity and relevance are signals, not endorsements. Check maintenance and fit before choosing.</p>
                <CandidateList items={state.candidates} onSearch={search} sortable />
              </section>
            )}
          </>
        )}
      </section>

      <footer>Data from registry.npmjs.org and api.npmjs.org · may be delayed or incomplete</footer>
    </div>
  );
}
