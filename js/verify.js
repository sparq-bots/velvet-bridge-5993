// Verifies the signed live mirror list in the browser.
// Uses the vendored @noble/ed25519 (served from this mirror, no CDN).
import * as ed from '../vendor/ed25519.js';

export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const keys = Object.keys(value).filter(k => value[k] !== undefined).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}

const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

// Returns the list if it is validly signed by a trusted key and not expired, else null.
export async function verifyList(doc, trustedKeys, { minSeq = 0, now = Date.now() } = {}) {
  try {
    if (!doc || !doc.sig || doc.sig.alg !== 'ed25519') return null;
    if (!trustedKeys.includes(doc.sig.key)) return null;
    const { sig, ...body } = doc;
    const ok = await ed.verifyAsync(b64(sig.value), new TextEncoder().encode(canonical(body)), b64(sig.key));
    if (!ok) return null;
    if (typeof body.seq !== 'number' || body.seq < minSeq) return null;   // replay of an older list
    if (body.expires && Date.parse(body.expires) < now) return null;      // stale list
    return body;
  } catch { return null; }
}
