


import {
  getPackages, getVersionSet, getAlternatives, findPackages, enrichDownloads, isAbort
} from './lib/index.js';

export async function loadResult(parsed, { signal, repoHints = {} }) {
  switch (parsed.mode) {
    case 'usecase': {
      const matches = await findPackages(parsed.term, { signal });
      const usable = matches.filter(item => !item.name.startsWith('@types/')).slice(0, 10);
      return { candidates: await enrichDownloads(usable, { signal }) };
    }

    case 'versions':
      return { set: await getVersionSet(parsed.names[0], parsed.versions, { signal }) };

    case 'alternatives': {
      const { packages, failures } = await getPackages(parsed.names.slice(0, 1), { signal, hints: repoHints });
      try {
        return { packages, failures, candidates: await getAlternatives(packages[0], { signal }) };
      } catch (error) {
        if (isAbort(error)) throw error;

        return { packages, failures, candidates: [], alternativesError: error.message };
      }
    }

    default: {

      const { packages, failures } = await getPackages(parsed.names, { signal, hints: repoHints });
      return { packages, failures };
    }
  }
}
