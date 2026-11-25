// Chapter and verse numbers in the digits of the language being read.
// The script is detected from the text itself (book names, title), so it
// works for any language, including ones the browser doesn't know.

const SCRIPTS = [
  [/\p{Script=Devanagari}/u, 'deva'], [/\p{Script=Bengali}/u, 'beng'], [/\p{Script=Gujarati}/u, 'gujr'],
  [/\p{Script=Gurmukhi}/u, 'guru'], [/\p{Script=Oriya}/u, 'orya'], [/\p{Script=Tamil}/u, 'tamldec'],
  [/\p{Script=Telugu}/u, 'telu'], [/\p{Script=Kannada}/u, 'knda'], [/\p{Script=Malayalam}/u, 'mlym'],
  [/\p{Script=Thai}/u, 'thai'], [/\p{Script=Lao}/u, 'laoo'], [/\p{Script=Myanmar}/u, 'mymr'],
  [/\p{Script=Khmer}/u, 'khmr'], [/\p{Script=Tibetan}/u, 'tibt'], [/\p{Script=Ethiopic}/u, 'ethi'],
  [/\p{Script=Arabic}/u, 'arab'],
];
// Arabic-script languages that write Persian-style (extended) digits.
const ARABEXT = new Set(['fa', 'pes', 'prs', 'fas', 'ur', 'urd', 'ps', 'pus', 'pbu', 'pst', 'sd', 'snd', 'skr', 'pnb', 'bal', 'bcc', 'bgp', 'ckb', 'ug', 'uig', 'hno', 'glk', 'mzn', 'haz', 'brh']);
// Arabic-script languages of North Africa write Western digits.
const LATN_ARABIC = new Set(['ary', 'arq', 'aeb', 'acx', 'shu', 'mey', 'ttq', 'kab']);

export function numberingFor(sample, code) {
  for (const [re, nu] of SCRIPTS) {
    if (!re.test(sample)) continue;
    if (nu !== 'arab') return nu;
    if (LATN_ARABIC.has(code)) return 'latn';
    return ARABEXT.has(code) ? 'arabext' : 'arab';
  }
  return 'latn';
}

const cache = new Map();
export function formatNumber(n, nu) {
  if (!nu || nu === 'latn') return String(n);
  if (nu === 'ethi') return ethiopic(Number(n));
  let f = cache.get(nu);
  if (!f) { try { f = new Intl.NumberFormat('en-u-nu-' + nu, { useGrouping: false }); } catch { f = null; } cache.set(nu, f); }
  return f ? f.format(Number(n)) : String(n);
}
// Converts every run of digits in a label like "3-4" or "12a".
export function localDigits(s, nu) {
  return !nu || nu === 'latn' ? String(s) : String(s).replace(/\d+/g, d => formatNumber(d, nu));
}

// Ethiopic numerals are not positional: ፩–፱, ፲–፺, ፻ (100), ፼ (10,000).
function ethiopic(n) {
  if (!(n > 0) || n >= 1e8) return String(n);
  const ones = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
  const tens = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];
  const pair = x => tens[Math.floor(x / 10)] + ones[x % 10];
  // Split into base-100 groups from the right; odd groups get ፻, even get ፼.
  const groups = [];
  for (let x = n; x > 0; x = Math.floor(x / 100)) groups.push(x % 100);
  let out = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    const sep = i === 0 ? '' : i % 2 ? '፻' : '፼';
    if (g === 0) { if (i % 2 === 0 && i > 0) out += sep; continue; }
    out += (g === 1 && i > 0 ? '' : pair(g)) + sep;   // a lone 1 before ፻/፼ is not written
  }
  return out;
}
