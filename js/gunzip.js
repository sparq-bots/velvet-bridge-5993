// Decode a content volume. Files are gzipped JSON with a neutral .dat
// extension; some hosts may still transfer-decode them, so check the magic
// bytes before inflating.
import { gunzipSync, strFromU8 } from '../vendor/fflate.js';

export async function decodeVolume(buf) {
  const u8 = new Uint8Array(buf);
  if (!(u8[0] === 0x1f && u8[1] === 0x8b)) return JSON.parse(new TextDecoder().decode(u8));
  if (typeof DecompressionStream === 'function') {
    try {
      const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
      return JSON.parse(await new Response(stream).text());
    } catch { /* fall through to JS inflate */ }
  }
  return JSON.parse(strFromU8(gunzipSync(u8)));
}
