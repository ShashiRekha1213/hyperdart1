


export class NpmError extends Error {
  constructor(message, code = 'http') {
    super(message);
    this.name = 'NpmError';
    this.code = code; 
  }
}




const pathName = name => name.split('/').map(encodeURIComponent).join('/').replace(/^%40/, '@');

export const registryUrl = name => `https://registry.npmjs.org/${pathName(name)}`;
export const latestUrl = name => `${registryUrl(name)}/latest`;
export const downloadsUrl = name => `https://api.npmjs.org/downloads/point/last-week/${pathName(name)}`;
export const downloadsRangeUrl = name => `https://api.npmjs.org/downloads/range/last-month/${pathName(name)}`;
export const versionDownloadsUrl = name => `https://api.npmjs.org/versions/${name.replace('/', '%2F')}/last-week`;
export const searchUrl = (term, size = 25) => `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(term)}&size=${size}`;


export function typesPackageName(name) {
  return '@types/' + (name.startsWith('@') ? name.slice(1).replace('/', '__') : name);
}



const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const abortError = () => new DOMException('Aborted', 'AbortError');
export const isAbort = error => error?.name === 'AbortError';

async function request(url, { retries = 1, timeout = 15000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (response.ok) return await response.json();

      if (response.status === 404) throw new NpmError('Not found on npm.', 'notfound');

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < retries) {
        await wait(900 * (attempt + 1));
        continue;
      }
      if (response.status === 429) {
        throw new NpmError('npm is rate-limiting requests right now. Wait a moment and retry.', 'ratelimit');
      }
      throw new NpmError(`npm returned an error (${response.status}). Please try again.`, 'http');
    } catch (error) {
      if (error instanceof NpmError) throw error;
      if (attempt < retries) {
        await wait(900 * (attempt + 1));
        continue;
      }
      const message = controller.signal.aborted ? 'npm took too long to respond.' : 'Could not reach npm. Check your connection.';
      throw new NpmError(message, 'network');
    } finally {
      clearTimeout(timer);
    }
  }
}


const cache = new Map();
const MAX_CACHE_ENTRIES = 80;

export function clearCache() {
  cache.clear();
}



export function fetchJson(url, { signal, ...options } = {}) {
  if (!cache.has(url)) {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);

    const promise = request(url, options);
    cache.set(url, promise);
    promise.catch(() => {
      if (cache.get(url) === promise) cache.delete(url); 
    });
  }
  return waitFor(cache.get(url), signal);
}

function waitFor(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(abortError()), { once: true });
    promise.then(resolve, reject);
  });
}


export const optional = promise => promise.catch(() => null);

export function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}


export async function firstOf(urls, signal) {
  let lastError;
  for (const url of urls) {
    try {
      return await fetchJson(url, { signal });
    } catch (error) {
      if (isAbort(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
