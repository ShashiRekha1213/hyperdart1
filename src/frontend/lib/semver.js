

export function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(String(v));
  if (!m) return null;
  return { n: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] || null };
}

export function compareVersions(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  if (!x || !y) return 0;
  for (let i = 0; i < 3; i++) {
    if (x.n[i] !== y.n[i]) return x.n[i] - y.n[i];
  }

  return (x.pre ? 0 : 1) - (y.pre ? 0 : 1);
}



export function resolveVersion(versions, spec) {
  const keys = Array.isArray(versions) ? versions : Object.keys(versions || {});
  const wanted = String(spec).replace(/^v/, '').split('.').map(Number);

  return keys
    .filter(v => {
      const p = parseVersion(v);
      return p && !p.pre && wanted.every((n, i) => p.n[i] === n);
    })
    .sort((a, b) => compareVersions(b, a))[0] || null;
}

export function matchesPrefix(version, spec) {
  const p = parseVersion(version);
  const wanted = String(spec).replace(/^v/, '').split('.').map(Number);
  return Boolean(p) && wanted.every((n, i) => p.n[i] === n);
}
