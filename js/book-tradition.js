// Which book order a translation is shown in, using the traditions in
// config/books.csv. Books a tradition doesn't number keep their usual place
// after the numbered ones.
import { ORDERS } from './book-orders.js';

const SYNODAL = new Set(['rus', 'ukr', 'bel', 'bul', 'srp', 'mkd']);       // Russian Synodal tradition
const ORTHODOX = new Set(['ell', 'grc', 'ron', 'kat', 'hye', 'amh', 'gez', 'tir', 'cop', 'syc']);
const PROTESTANT_DEFAULT = 'protestant';

// lang: ISO 639-3 code; title: translation title; hasDc: includes deuterocanon.
export function traditionFor(lang, title = '', hasDc = false) {
  const t = String(title).toLowerCase();
  if (lang === 'fin') return 'finnish';
  if (lang === 'deu' || lang === 'gsw') return /luther/.test(t) ? 'luther' : 'german';
  if (SYNODAL.has(lang)) return 'synodal';
  if (!hasDc) return PROTESTANT_DEFAULT;
  if (lang === 'lat') return 'vulgate';
  if (ORTHODOX.has(lang)) return 'orthodox';
  if (lang === 'eng') return /king james|kjv|\bkjva?\b/.test(t) ? 'kjva' : 'nrsva';
  return 'catholic';
}

// Sort book codes into the tradition's order.
export function orderBooks(codes, tradition, fallback) {
  const list = ORDERS[tradition] || ORDERS[PROTESTANT_DEFAULT];
  const rank = new Map(list.map((c, i) => [c, i]));
  const base = new Map((fallback || []).map((c, i) => [c, i]));
  return [...codes].sort((a, b) =>
    (rank.has(a) ? rank.get(a) : 1e4 + (base.get(a) ?? 999)) - (rank.has(b) ? rank.get(b) : 1e4 + (base.get(b) ?? 999)));
}
