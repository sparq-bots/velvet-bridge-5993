// Offline search over the Bible already saved on this device.
//
// Works on any script: matching ignores case, Latin accents, Hebrew points
// and Arabic vowel marks, so "jesus" finds "Jésus" and "الله" finds "اللَّه".
// Every word typed must appear in the verse (in any order). Languages written
// without spaces (Chinese, Japanese, Thai…) match as a plain substring.

const MARKS = /[̀-֑ͯ-ׇؐ-ًؚ-ٰٟۖ-ۭـ]/g;

export function fold(s) {
  return String(s).normalize('NFD').replace(MARKS, '').toLocaleLowerCase().normalize('NFC');
}

// Split the query into words to match. Very short Latin/Cyrillic words (a, of)
// are dropped unless they're the only word.
export function terms(q) {
  const words = fold(q).split(/[\s\p{P}\p{S}]+/u).filter(Boolean);
  const long = words.filter(w => w.length > 1 || /[^\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}]/u.test(w));
  return long.length ? long : words;
}

// "John 3:16", "jn 3", "Juan 3.16", "يوحنا 3:16" → { book, ch, v }.
export function parseRef(q, books) {
  const m = /^\s*(.+?)\s*([0-9٠-٩۰-۹०-९]+)(?:\s*[:.,]\s*([0-9٠-٩۰-۹०-९]+))?\s*$/u.exec(q);
  if (!m) return null;
  const name = fold(m[1]).replace(/\s+/g, ' ');
  if (!name) return null;
  const toInt = d => Number(String(d).replace(/[٠-٩]/g, c => c.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, c => c.charCodeAt(0) - 0x6f0).replace(/[०-९]/g, c => c.charCodeAt(0) - 0x966));
  const exact = books.find(b => fold(b.name) === name || b.code.toLowerCase() === name);
  const book = exact || books.find(b => fold(b.name).startsWith(name));
  if (!book) return null;
  const ch = toInt(m[2]);
  if (!book.chapters.includes(ch)) return null;
  return { book: book.code, ch, v: m[3] ? toInt(m[3]) : null };
}

// Search verse by verse. `volumes` is an async iterable of { book, ch, items }
// in reading order; stops after `max` hits. Calls onHit as results come in.
export async function search(q, chapters, { max = 200, onHit } = {}) {
  const ts = terms(q);
  if (!ts.length) return { hits: [], more: false };
  const hits = [];
  for await (const { book, ch, items } of chapters) {
    for (const it of items) {
      if (!it.v || !it.t) continue;
      const f = fold(it.t);
      if (ts.every(t => f.includes(t))) {
        const hit = { book, ch, v: it.v, t: it.t };
        hits.push(hit); onHit?.(hit);
        if (hits.length >= max) return { hits, more: true };
      }
    }
  }
  return { hits, more: false };
}

// Verse text with the matched words wrapped in <mark>, as safe HTML.
// Works on the original text so accents and marks are kept.
export function highlight(text, q, esc) {
  const ts = terms(q);
  if (!ts.length) return esc(text);
  // Map each folded character back to its position in the original string.
  const chars = [...text];
  let folded = '';
  const pos = [];
  chars.forEach((c, i) => { const f = fold(c); for (const x of f) { folded += x; pos.push(i); } });
  const on = new Array(chars.length).fill(false);
  for (const t of ts) {
    let from = 0, at;
    while ((at = folded.indexOf(t, from)) !== -1) {
      for (let k = at; k < at + t.length; k++) on[pos[k]] = true;
      from = at + t.length;
    }
  }
  let out = '', open = false;
  chars.forEach((c, i) => {
    if (on[i] && !open) { out += '<mark>'; open = true; }
    if (!on[i] && open) { out += '</mark>'; open = false; }
    out += esc(c);
  });
  return open ? out + '</mark>' : out;
}
