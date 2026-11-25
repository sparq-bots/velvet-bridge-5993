// Reader app. Everything is served from this mirror; preferences live only in
// this browser's localStorage; the reading position is kept in the URL hash,
// which browsers never send to the server.
import CONFIG from './config.js';
import { ORDER, OT, NT, EN_NAMES, maskHas } from './canon.js';
import { traditionFor, orderBooks } from './book-tradition.js';
import { USFX } from './book-orders.js';
import { uiFor, t as tr_ } from './i18n.js';
import { numberingFor, formatNumber, localDigits } from './numerals.js';
import { Follower } from './follow.js';
import { buildBibleHtml } from './share-file.js';
import { decodeVolume } from './gunzip.js';

const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('bmn.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('bmn.' + k, JSON.stringify(v)); } catch {} },
};
const S = { catalog: null, langs: [], lang: null, tr: null, book: null, ch: null, vols: new Map(), audio: null, dbs: null, dbsRecs: new Map(), dbsCur: null, ui: 'en', nu: 'latn' };
const T = key => tr_(S.ui, key);                 // interface word in the reader's language
const N = n => formatNumber(n, S.nu);            // number in the reading language's digits

// Data files that change between builds carry the build id, so no browser
// or host cache can hold on to an old catalog after an update.
const V = `?v=${CONFIG.build}`;
const fetchJson = async url => { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); };
const fold = s => String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
const userLangs = () => (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']).map(x => x.toLowerCase());

init().catch(err => { $('text').innerHTML = `<p class="notice">⚠ ${esc(err.message || err)}</p>`; });

async function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (CONFIG.title) document.title = CONFIG.title;

  S.catalog = await fetchJson('content/catalog.json' + V);
  // Languages shown with one translation only (e.g. English → World English Bible).
  for (const [code, id] of Object.entries(CONFIG.single || {})) {
    const l = S.catalog.languages[code];
    const keep = l?.translations.find(t => t.id === id);
    if (keep) { l.translations = [keep]; l.single = true; }
  }
  // DBS audio index: adds in-page audio, and audio-only languages to the list.
  S.dbs = await fetchJson('content/audio-dbs/index.json' + V).catch(() => null)
    || await liveDbsIndex().catch(() => null);
  addAudioOnlyLanguages();
  S.langs = Object.values(S.catalog.languages)
    .filter(l => l.translations && l.translations.length)
    .sort((a, b) => a.english.localeCompare(b.english));

  wireUi();
  wireAudio();
  // Optional audio index (public IDs only). Missing file = no Listen button.
  fetchJson('content/audio.json' + V).then(a => {
    S.audio = a; updateListen();
    if (S.tr?.audioOnly && !S.arcRec && S.audio.text?.[S.lang?.code]) go(S.book, S.ch, { replace: true });   // add the Bible.is text link
  }).catch(() => {});

  const fromHash = parseHash();
  const pref = store.get('pref', null);
  let langCode = fromHash.lang || pref?.lang || detectLanguage()?.code || (S.catalog.languages.eng ? 'eng' : S.langs[0]?.code);
  if (!S.catalog.languages[langCode]) langCode = S.langs[0].code;
  const trId = fromHash.tr || (pref?.lang === langCode ? pref.tr : null);
  await selectLanguage(langCode, trId, {
    book: fromHash.book || (pref?.tr === trId ? pref.book : null),
    ch: fromHash.ch || (pref?.tr === trId ? pref.ch : null),
  });
  window.addEventListener('hashchange', onHash);
}

// --- language detection & picker -----------------------------------------

function detectLanguage() {
  for (const tag of userLangs()) {
    const base = tag.split('-')[0];
    const exact = S.langs.filter(l => l.bcp.toLowerCase() === tag || l.code === tag);
    const byBase = S.langs.filter(l => l.bcp.toLowerCase().split('-')[0] === base || l.code === base);
    const pool = exact.length ? exact : byBase;
    if (pool.length) return pool.sort((a, b) => bestBooks(b) - bestBooks(a))[0];
  }
  return null;
}
const bestBooks = l => Math.max(...l.translations.map(t => t.books));

function wireUi() {
  const btn = $('langBtn'), panel = $('langPanel'), input = $('langSearch');
  const open = v => { panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)); if (v) { input.value = ''; renderLangList(''); input.focus(); } };
  btn.onclick = () => open(panel.hidden);
  input.oninput = () => renderLangList(input.value);
  input.onkeydown = e => {
    const items = [...$('langList').children];
    let i = items.findIndex(li => li.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      i = Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
      items.forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
      items[i]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { (items[i] || items[0])?.click(); }
    else if (e.key === 'Escape') open(false);
  };
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('.lang')) open(false); });
  $('langList').onclick = e => {
    const li = e.target.closest('li'); if (!li) return;
    open(false);
    selectLanguage(li.dataset.code);
  };
  $('trSel').onchange = e => selectTranslation(e.target.value, { book: S.book, ch: S.ch });
  $('bookSel').onchange = e => go(e.target.value, 1);
  $('chSel').onchange = e => go(S.book, Number(e.target.value));
  $('text').addEventListener('click', e => {
    if (e.target.closest('.lic-btn')) return showLicence();
    const w = e.target.closest('.w');
    if (w) showWord(w.dataset.s, w.textContent, w);
  });
  $('wordPop').addEventListener('click', e => {
    if (e.target === $('wordPop') || e.target.closest('.lic-close')) return hideWord();
    const ref = e.target.closest('.wd-ref');
    if (ref) showWord(ref.dataset.s);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('wordPop').hidden) hideWord(); });
  $('licPop').addEventListener('click', e => {
    if (e.target === $('licPop') || e.target.closest('.lic-close')) hideLicence();
    const b = e.target.closest('.share-file');
    if (b) (b.dataset.mode === 'audio' ? saveBookAudio(b) : shareBible(b));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('licPop').hidden) hideLicence(); });
  $('prev').onclick = () => step(-1);
  $('next').onclick = () => step(1);
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select')) return;
    const rtl = S.tr?.dir === 'rtl';
    if (e.key === 'ArrowLeft') step(rtl ? 1 : -1, { turn: true });
    if (e.key === 'ArrowRight') step(rtl ? -1 : 1, { turn: true });
  });
  wireSwipe();
}

// Swipe to turn the page, in the direction the language reads: in a
// left-to-right language swiping left goes forward; in a right-to-left
// language (Arabic, Persian, Hebrew, Urdu…) swiping right goes forward.
function wireSwipe() {
  const main = $('text');
  let x0 = null, y0 = 0, t0 = 0;
  main.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  main.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Date.now() - t0 > 800 || Math.abs(dx) < 60 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;
    if (String(window.getSelection?.() || '').length) return;      // selecting text, not swiping
    const forward = S.tr?.dir === 'rtl' ? dx > 0 : dx < 0;
    step(forward ? 1 : -1, { turn: true });
  }, { passive: true });
}

// Page-turn motion: the new chapter slides in from the side it comes from.
function turnPage(d) {
  const main = $('text');
  const fromRight = (d > 0) !== (S.tr?.dir === 'rtl');
  main.classList.remove('turn-r', 'turn-l');
  void main.offsetWidth;                         // restart the animation
  main.classList.add(fromRight ? 'turn-r' : 'turn-l');
}

function renderLangList(q) {
  const f = fold(q.trim());
  let list;
  if (!f) {
    const mine = new Set(userLangs().map(t => t.split('-')[0]));
    const top = S.langs.filter(l => mine.has(l.bcp.toLowerCase().split('-')[0]));
    list = [...top, ...S.langs.filter(l => !top.includes(l))];
  } else {
    const score = l => {
      const fields = [l.name, l.english, l.code, l.bcp, ...(l.alt || [])].map(fold);
      if (fields.some(x => x === f)) return 0;
      if (fields.some(x => x.startsWith(f))) return 1;
      if (fields.some(x => x.includes(f))) return 2;
      return 9;
    };
    list = S.langs.map(l => [score(l), l]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0]).map(([, l]) => l);
  }
  const html = list.slice(0, 300).map((l, i) => {
    const audio = l.audioOnly && !l.arc ? '<span class="badge">♪</span>' : '';
    const cur = l === S.lang;
    return `<li role="option" data-code="${esc(l.code)}"${cur ? ' class="current" aria-current="true"' : ''} aria-selected="${i === 0 && !!f}"><span lang="${esc(l.bcp)}">${esc(l.name)}${audio}</span>${l.name !== l.english ? `<small>${esc(l.english)}</small>` : ''}</li>`;
  });
  $('langList').innerHTML = html.join('') || '<li class="muted">—</li>';
}

// --- selection --------------------------------------------------------------

async function selectLanguage(code, trId, pos = {}) {
  S.lang = S.catalog.languages[code];
  const btn = $('langBtn');
  btn.dataset.name = S.lang.name;       // shown as the button's tooltip / screen-reader name
  btn.lang = S.lang.bcp;
  const trs = S.lang.translations;
  S.ui = uiFor(S.lang, CONFIG.related?.[code] || [], userLangs());
  applyUi();
  S.tradeNames = S.ui === 'en' ? null : await tradeBookNames().catch(() => null);
  const sel = $('trSel');
  sel.hidden = true;                    // one translation per language (chosen at build time)
  const audioCode = CONFIG.audioAlias?.[code] || code;     // e.g. Estonian: library ekk, DBS est
  S.dbsCur = S.dbs?.languages?.[audioCode] ? await loadDbs(audioCode).catch(() => null) : null;
  // Translations that DBS has recorded word for word get a ♪, and are the
  // default when they cover as much of the Bible as the first choice.
  const voiced = new Set((S.dbsCur || []).flatMap(r => CONFIG.audioText?.[r.id] || []));
  sel.innerHTML = trs.map(t => `<option value="${esc(t.id)}">${esc(t.title || t.shortTitle)}${voiced.has(t.id) ? ' ♪' : ''}</option>`).join('');
  const RANK = { full: 0, 'nt+': 1, nt: 2, ot: 3, portions: 4 };
  const matched = trs.find(t => voiced.has(t.id) && RANK[t.coverage] <= RANK[trs[0].coverage]);
  const chosen = trs.find(t => t.id === trId) || matched || trs[0];
  await selectTranslation(chosen.id, pos);
}

async function selectTranslation(id, pos = {}) {
  S.tr = id.startsWith('a-') ? audioOnlyTranslation(id) : await fetchJson(`content/${id}/index.json` + V);
  $('trSel').value = id;
  document.documentElement.lang = S.lang.bcp;
  // Books in the order this language's readers expect (config/books.csv).
  const hasDc = S.tr.books.some(b => !OT.includes(b.code) && !NT.includes(b.code));
  const trad = traditionFor(S.lang.code, S.tr.title, hasDc);
  const byCode = new Map(S.tr.books.map(b => [b.code, b]));
  S.tr.books = orderBooks([...byCode.keys()], trad, ORDER).map(c => byCode.get(c));
  S.order = orderBooks(hasDc ? [...new Set([...OT, ...NT, ...byCode.keys()])] : [...OT, ...NT], trad, ORDER);
  if (S.tr.audioOnly) await nameAudioBooks();
  setTimeout(warmCache, 1500);          // save this Bible for offline use
  S.nu = numberingFor(S.tr.books.map(b => b.name).join(' ') + ' ' + (S.tr.title || '') + ' ' + S.lang.name, S.lang.code);
  if (S.tr.audioOnly) {
    $('bookSel').innerHTML = S.tr.books.map(b => `<option value="${b.code}">${esc(b.name)}</option>`).join('');
    // Missing book: start at the first one of the same testament (NT link on an NT-only recording, etc.).
    const b = S.tr.books.find(x => x.code === pos.book) ? pos.book
      : (NT.includes(pos.book) && S.tr.books.find(x => NT.includes(x.code))?.code) || S.tr.books[0].code;
    showPlayer(true, { autoplay: false });
    return go(b, pos.ch || 1, { replace: true });
  }
  // Book menu lists the whole canon; books missing from this translation are
  // marked, and choosing one offers alternatives (fallback flow).
  const have = new Map(S.tr.books.map(b => [b.code, b]));
  const canon = S.order;
  $('bookSel').innerHTML = canon.map(c => {
    const b = have.get(c);
    return `<option value="${c}"${b ? '' : ' class="missing"'}>${esc(b ? b.name : (S.tradeNames?.[c] || EN_NAMES[c] || c))}${b ? '' : ' ✕'}</option>`;
  }).join('');
  let book = pos.book && have.has(pos.book) ? pos.book : null;
  if (!book) book = have.has('MAT') && S.tr.coverage !== 'full' ? 'MAT' : S.tr.books[0].code;
  if (pos.book && !have.has(pos.book)) book = pos.book; // show fallback notice
  await go(book, pos.ch || 1, { replace: true });
}

async function go(book, ch, { replace = false, turn = 0 } = {}) {
  S.book = book; S.ch = Number(ch) || 1;
  S.hl = null;
  $('text').dataset.ch = '';
  const hash = `#/${S.tr.id}/${book}/${S.ch}`;
  if (location.hash !== hash) (replace ? history.replaceState(null, '', hash) : history.pushState(null, '', hash));
  store.set('pref', { lang: S.lang.code, tr: S.tr.id, book, ch: S.ch });
  $('bookSel').value = book;
  const meta = S.tr.books.find(b => b.code === book);
  const main = $('text');
  main.dir = S.tr.dir;
  if (S.tr.audioOnly && meta) {
    if (!meta.chapters.includes(S.ch)) S.ch = meta.chapters[0];
    $('chSel').innerHTML = meta.chapters.map(n => `<option value="${n}">${N(n)}</option>`).join('');
    $('chSel').value = String(S.ch);
    updateNavButtons();
    updateListen();
    if (turn) turnPage(turn);
    // Text from DBS's ARC library where it has this language; else audio only.
    const want = `${book}/${S.ch}`;
    const text = S.lang.arc ? await arcChapter(S.lang.code, book, S.ch).catch(() => null) : null;
    if (`${S.book}/${S.ch}` !== want) return;      // reader moved on meanwhile
    S.arcRec = text?.rec || null;
    main.innerHTML = text ? renderChapter(meta, text.items)
      : `<h1>${esc(meta.name)} ${N(S.ch)}</h1>${textLinkHtml()}<p class="muted">♪ <button type="button" class="lic-btn" aria-haspopup="dialog" aria-label="${esc(T('license'))}">ⓘ</button></p>`;
    main.dataset.ch = want;
    followAlong();
    return;
  }
  if (!meta) {
    $('chSel').innerHTML = '';
    main.innerHTML = fallbackNotice(book);
    updateNavButtons();
    updateListen();
      return;
  }
  if (!meta.chapters.includes(S.ch)) S.ch = meta.chapters[0];
  $('chSel').innerHTML = meta.chapters.map(n => `<option value="${n}">${N(n)}</option>`).join('');
  $('chSel').value = String(S.ch);
  updateNavButtons();
  updateListen();
  if (turn) turnPage(turn);
  main.innerHTML = '<p class="muted">…</p>';
  try {
    const vol = await loadVolume(S.tr.id, meta.vol);
    main.innerHTML = renderChapter(meta, vol[book][String(S.ch)] || []);
    main.dataset.ch = `${book}/${S.ch}`;
    followAlong();
  } catch {
    main.innerHTML = `<div class="notice">⚠</div>`;
  }
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

async function loadVolume(id, vol) {
  const key = `${id}/${vol}`;
  if (!S.vols.has(key)) {
    S.vols.set(key, fetch(`content/${id}/${S.tr.files[vol]}`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decodeVolume));
    S.vols.get(key).catch(() => S.vols.delete(key));
  }
  return S.vols.get(key);
}

function renderChapter(meta, items) {
  let html = `<h1>${esc(meta.name)} ${N(S.ch)}</h1>`;
  let open = false;
  const openP = cls => { if (open) html += '</p>'; html += `<p class="${esc(cls)}">`; open = true; };
  for (const it of items) {
    if (it.h) { if (open) { html += '</p>'; open = false; } html += `<h2>${esc(it.h)}</h2>`; }
    else if (it.p) openP(it.p);
    else if (it.v) {
      if (!open) openP('p');
      html += `<span class="vs" data-v="${esc(it.v)}">` + (it.c ? '' : `<sup class="v">${esc(localDigits(it.v, S.nu))}</sup>`) + (it.s ? taggedHtml(it.t, it.s) : esc(it.t)) + '</span> ';
    }
  }
  // Small ⓘ right after the chapter's last word; tapping it opens the licence
  // (required by Creative Commons licences) in a pop-up.
  const info = ` <button type="button" class="lic-btn" aria-haspopup="dialog" aria-label="${esc(T('license'))}">ⓘ</button>`;
  html += open ? info + '</p>' : `<p>${info}</p>`;
  return html;
}

// Fallback: the book isn't in this translation. Offer (1) other translations
// in the same language, (2) related languages, (3) the reader's other
// browser languages — only ones that actually contain the book.
function fallbackNotice(book) {
  const name = S.tradeNames?.[book] || EN_NAMES[book] || book;
  const opts = [];
  const add = (lang, t) => { if (t.id !== S.tr.id && maskHas(t.has, book) && !opts.some(o => o.t.id === t.id)) opts.push({ lang, t }); };
  for (const t of S.lang.translations) add(S.lang, t);
  const base = S.lang.bcp.split('-')[0];
  const related = [...(CONFIG.related?.[S.lang.code] || [])];
  for (const l of S.langs) if (l !== S.lang && l.bcp.split('-')[0] === base) related.push(l.code);
  for (const tag of userLangs()) {
    const b = tag.split('-')[0];
    for (const l of S.langs) if (l.bcp.toLowerCase().split('-')[0] === b) related.push(l.code);
  }
  related.push(...(CONFIG.related?.['*'] || []));   // last resort: widely read languages
  for (const code of related) {
    const l = S.catalog.languages[code];
    if (l) for (const t of l.translations) add(l, t);
  }
  const links = opts.slice(0, 8).map(({ lang, t }) =>
    `<li><a href="#/${esc(t.id)}/${book}/1" data-lang="${esc(lang.code)}">${esc(lang.name)} — ${esc(t.title || t.shortTitle)}</a></li>`).join('');
  return `<div class="notice"><strong>${esc(name)}</strong><p>${esc(T('missing'))}</p>${links ? `<p>${esc(T('others'))}</p><ul>${links}</ul>` : ''}</div>`;
}

function chapterList() {
  return S.tr.books.flatMap(b => b.chapters.map(c => [b.code, c]));
}
function step(d, { turn = false } = {}) {
  const t = turn ? d : 0;
  const list = chapterList();
  let i = list.findIndex(([b, c]) => b === S.book && c === S.ch);
  if (i < 0) { // on a missing book: jump to nearest available
    const ord = S.order || ORDER, pos = ord.indexOf(S.book);
    i = d > 0 ? list.findIndex(([b]) => ord.indexOf(b) > pos) : list.map(([b]) => ord.indexOf(b) < pos).lastIndexOf(true);
    if (i >= 0) return go(...list[i], { turn: t });
    return;
  }
  const n = list[i + d];
  if (n) go(n[0], n[1], { turn: t });
}
function updateNavButtons() {
  const list = chapterList();
  const i = list.findIndex(([b, c]) => b === S.book && c === S.ch);
  $('prev').disabled = i === 0;
  $('next').disabled = i === list.length - 1;
}

function parseHash() {
  const [, tr, book, ch] = location.hash.split('/');
  if (!tr || !S.catalog) return {};
  const lang = Object.values(S.catalog.languages).find(l => l.translations.some(t => t.id === tr))
    || Object.values(S.catalog.languages).find(l => l.dropped?.includes(tr))       // old link to a translation no longer shown
    || S.catalog.languages[tr];                                                       // language code (chatbot links: #/spa/GEN/1)
  return lang ? { lang: lang.code, tr: lang.translations.some(t => t.id === tr) ? tr : lang.translations[0].id, book, ch: Number(ch) || 1 } : {};
}
async function onHash() {
  const h = parseHash();
  if (!h.tr) return;
  if (h.tr !== S.tr?.id) await selectLanguage(h.lang, h.tr, h);
  else if (h.book !== S.book || h.ch !== S.ch) await go(h.book, h.ch, { replace: true });
}

// --- offline --------------------------------------------------------------

// Keep the whole current Bible on this device (a few MB), not only the books
// already opened, so it keeps working offline and when every mirror is blocked.
async function warmCache() {
  if (!('serviceWorker' in navigator) || !S.tr || S.tr.audioOnly) return;
  const urls = ['./', 'content/catalog.json' + V, `content/${S.tr.id}/index.json` + V,
    ...Object.values(S.tr.files || {}).map(f => `content/${S.tr.id}/${f}`),
    ...(S.tr.strong ? ['content/lexicon/G.json' + V, 'content/lexicon/H.json' + V] : [])];
  try {
    const reg = await navigator.serviceWorker.ready;
    (navigator.serviceWorker.controller || reg.active)?.postMessage({ type: 'save', urls });
  } catch { /* no service worker: nothing to keep */ }
}

// --- a copy to pass on -------------------------------------------------------
// The whole Bible as one plain HTML file (see share-file.js). On phones the
// share sheet opens (Bluetooth, Nearby Share, messaging apps, Save to Files);
// elsewhere it downloads.
async function shareBible(btn) {
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = '…';
  try {
    const volumes = {};
    for (const vol of Object.keys(S.tr.files || {})) Object.assign(volumes, await loadVolume(S.tr.id, vol));
    const html = buildBibleHtml({ tr: S.tr, lang: S.lang, volumes, num: N, digits: v => localDigits(v, S.nu) });
    const name = `${S.lang.code}-${S.tr.id}.html`;
    const file = new File([html], name, { type: 'text/html' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60e3);
  } catch {
    btn.textContent = '⚠';
    return;
  } finally {
    if (btn.textContent === '…') btn.textContent = label;
    btn.disabled = false;
  }
}

// --- licence pop-up ---------------------------------------------------------

function showLicence() {
  const a = dbsAudio();
  const arc = S.tr.audioOnly && S.arcRec ? `<p><strong>${esc(S.arcRec.title || S.arcRec.id)}</strong>${S.arcRec.cr ? '<br>' + esc(S.arcRec.cr) : ''}</p>` : '';
  if (arc && !S.arcRec.title) arcTitle(S.arcRec).then(() => { if (!$('licPop').hidden) showLicence(); });
  $('licBody').innerHTML = arc + (S.tr.audioOnly ? '' : `<strong>${esc(S.tr.title)}</strong>`
    + (S.tr.copyright ? `<p>${esc(S.tr.copyright)}</p>` : '')
    + `<p><a href="${esc(S.tr.license)}" rel="noreferrer noopener" target="_blank">${esc(S.tr.source || 'eBible.org')} ↗</a></p>`)
    + (a ? `<p class="audio-credit">♪ <strong>${esc(a.rec.t)}</strong>${a.rec.cr ? '<br>' + esc(a.rec.cr) : ''}</p>` : '')
    + (bookAudioUrls().length || !S.tr.audioOnly ? `<p class="share-row"><button type="button" class="share-file" data-mode="${bookAudioUrls().length ? 'audio' : 'file'}">⤓ ${esc(T('share'))}</button></p>` : '');
  $('licPop').hidden = false;
  updateSaveAudio();
  $('licPop').querySelector('.lic-close').focus();
}
function hideLicence() {
  $('licPop').hidden = true;
  $('text').querySelector('.lic-btn')?.focus({ preventScroll: true });
}

// --- audio ------------------------------------------------------------------
// In-page playback streams from the Digital Bible Society's audio server
// (audio.dbs.org). Where DBS has no recording, the headphones button falls
// back to a link to the chapter on Bible.is (Faith Comes By Hearing's player).

const DBS = 'https://audio.dbs.org';
const hasCh = (c, ch) => typeof c === 'number' ? ch >= 1 && ch <= c : c.includes(ch);
const chList = c => typeof c === 'number' ? Array.from({ length: c }, (_, i) => i + 1) : c;

// Fallback when the mirror was built without a DBS index (e.g. the build
// server couldn't reach audio.dbs.org): read DBS's own index in the browser.
// Same data the build step makes; only used if content/audio-dbs is missing.
const SCOPE_RANK = { 'Full Bible': 0, 'New Testament': 1, 'Old Testament': 2, Portion: 3 };
async function liveDbsIndex() {
  const list = await fetchJson(`${DBS}/index.json`);
  const languages = {};
  for (const r of list) {
    if (!r.iso || !r.id) continue;
    const l = languages[r.iso] ||= { n: r.ln || r.iso, s: [], r: 0, ci: r.ci || undefined };
    if (r.scope && !l.s.includes(r.scope)) l.s.push(r.scope);
    l.r++;
  }
  S.dbsLive = list;
  return { live: true, languages };
}

// "43_John_01.mp3" → { JHN: ["43_John", 2, 21] } (full 1..n runs compacted to n)
function parseDbsList(txt) {
  const books = {};
  for (const line of (txt || '').split(/\r?\n/)) {
    const m = line.trim().match(/^(\d{2})_(.+)_(\d+)\.mp3$/);
    const code = m && ORDER_66[+m[1] - 1];
    if (!code) continue;
    const b = books[code] ||= [`${m[1]}_${m[2]}`, m[3].length, []];
    b[1] = Math.max(b[1], m[3].length);
    b[2].push(parseInt(m[3], 10));
  }
  for (const b of Object.values(books)) {
    b[2] = [...new Set(b[2])].sort((x, y) => x - y);
    if (b[2].every((c, i) => c === i + 1)) b[2] = b[2].length;
  }
  return books;
}
const ORDER_66 = [...OT, ...NT];

async function liveDbsRecordings(iso) {
  const recs = [];
  for (const r of (S.dbsLive || []).filter(x => x.iso === iso)) {
    const txt = await fetch(`${DBS}/${encodeURIComponent(r.id)}/index.txt`).then(x => x.ok ? x.text() : '').catch(() => '');
    const b = parseDbsList(txt);
    if (Object.keys(b).length) recs.push({ id: r.id, t: r.tt || r.id, v: r.tv, s: r.scope, cr: r.audio_copyright, b });
  }
  return recs.sort((x, y) => (SCOPE_RANK[x.s] ?? 9) - (SCOPE_RANK[y.s] ?? 9) || Object.keys(y.b).length - Object.keys(x.b).length);
}

function loadDbs(iso) {
  if (!S.dbsRecs.has(iso)) {
    const p = S.dbs?.live ? liveDbsRecordings(iso) : fetchJson(`content/audio-dbs/${iso}.json` + V);
    S.dbsRecs.set(iso, p);
    p.catch(() => S.dbsRecs.delete(iso));
  }
  return S.dbsRecs.get(iso);
}

function addAudioOnlyLanguages() {
  if (!S.dbs?.languages) return;
  let names = null;
  const aliased = new Set(Object.entries(CONFIG.audioAlias || {}).filter(([lib]) => S.catalog.languages[lib]).map(([, a]) => a));
  for (const [iso, l] of Object.entries(S.dbs.languages)) {
    if (S.catalog.languages[iso] || aliased.has(iso)) continue;
    let bcp = iso; try { bcp = Intl.getCanonicalLocales(iso)[0]; } catch {}
    let native = null;
    try { native = new Intl.DisplayNames([bcp], { type: 'language', fallback: 'none' }).of(bcp); } catch {}
    if (native && native.toLowerCase() === bcp.toLowerCase()) native = null;
    if (native) native = native.charAt(0).toLocaleUpperCase(bcp) + native.slice(1);
    S.catalog.languages[iso] = {
      code: iso, bcp, name: native || l.n, english: l.n, alt: native ? [l.n] : [], audioOnly: true,
      ci: l.ci, arc: !!CONFIG.arc?.[iso],
      translations: [{ id: `a-${iso}`, title: l.n, books: 0, audioOnly: true }],
    };
  }
}

function audioOnlyTranslation(id) {
  const recs = S.dbsCur || [];
  const books = [];
  for (const code of ORDER) {
    const chs = new Set();
    for (const r of recs) if (r.b[code]) for (const c of chList(r.b[code][2])) chs.add(c);
    if (chs.size) books.push({ code, name: EN_NAMES[code] || code, chapters: [...chs].sort((x, y) => x - y) });
  }
  return { id, title: recs[0]?.t || S.lang.english, dir: 'ltr', audioOnly: true, books, coverage: '' };
}

// The DBS recording and file URL for the chapter on screen, if any.
// Recordings that read the translation on screen come first (config/audio-text-map.json).
const readsText = (rec, trId = S.tr?.id) => !!trId && (CONFIG.audioText?.[rec.id] || []).includes(trId);
function dbsAudio(book = S.book, ch = S.ch) {
  const recs = [...(S.dbsCur || [])].sort((a, b) => readsText(b) - readsText(a));
  for (const rec of recs) {
    const b = rec.b[book];
    if (b && hasCh(b[2], ch)) {
      const file = `${b[0]}_${String(ch).padStart(b[1], '0')}.mp3`;
      return { rec, url: `${DBS}/${encodeURIComponent(rec.id)}/${encodeURIComponent(file)}` };
    }
  }
  return null;
}

// The text of this chapter on Bible.is (Faith Comes By Hearing), for
// languages with audio but no openly licensed text here. A link only.
function textLinkHtml() {
  const list = S.audio?.text?.[S.lang?.code];
  if (!list?.length) return '';
  const t = OT.includes(S.book) ? 'ot' : 'nt';
  const pick = list.find(e => e.covers.includes(t)) || list.find(e => !e.covers.length);
  if (!pick) return '';
  const url = S.audio.player.replace('{id}', encodeURIComponent(pick.id)).replace('{book}', S.book).replace('{chapter}', S.ch);
  return `<p><a class="ext" href="${esc(url)}" target="_blank" rel="noreferrer noopener">${esc(pick.name)} · Bible.is ↗</a></p>`;
}

function fcbhLink() {
  const list = S.audio?.languages?.[S.lang?.code];
  const t = OT.includes(S.book) ? 'ot' : NT.includes(S.book) ? 'nt' : null;
  const pick = t && list ? list.find(e => e.covers.includes(t)) : null;
  return pick ? { url: S.audio.player.replace('{id}', encodeURIComponent(pick.id)).replace('{book}', S.book).replace('{chapter}', S.ch), name: pick.name } : null;
}

function updateListen() {
  const a = $('listen'), aud = $('aud');
  const dbs = dbsAudio();
  if (dbs) {
    a.hidden = false;
    a.removeAttribute('href'); a.removeAttribute('target');
    a.setAttribute('role', 'button'); a.dataset.mode = 'play';
    a.title = dbs.rec.t;
    a.setAttribute('aria-pressed', String(!$('player').hidden));
    if (!$('player').hidden && aud.dataset.src !== dbs.url) {
      const resume = S.keepPlaying || !aud.paused;
      setAudioSrc(dbs.url).then(() => { if (resume) aud.play().catch(() => {}); });
    }
    return;
  }
  if (!$('player').hidden && !S.tr?.audioOnly) showPlayer(false);
  const link = fcbhLink();
  if (link) {
    a.hidden = false; a.dataset.mode = 'link'; a.removeAttribute('role'); a.removeAttribute('aria-pressed');
    a.href = link.url; a.target = '_blank'; a.title = `${link.name} — Bible.is ↗`;
    return;
  }
  a.hidden = true; a.removeAttribute('href');
}

function showPlayer(show, { autoplay = true } = {}) {
  const p = $('player'), aud = $('aud');
  p.hidden = !show;
  document.body.classList.toggle('with-player', show);
  $('listen').setAttribute('aria-pressed', String(show));
  if (!show) { aud.pause(); S.keepPlaying = false; clearHighlight(); return; }
  const dbs = dbsAudio();
  const ready = dbs && aud.dataset.src !== dbs.url ? setAudioSrc(dbs.url) : Promise.resolve();
  ready.then(() => { if (autoplay && dbs) aud.play().catch(() => {}); });
  updateSaveAudio();
}

function wireAudio() {
  $('listen').addEventListener('click', e => {
    if ($('listen').dataset.mode !== 'play') return;   // link mode: let it open Bible.is
    e.preventDefault();
    showPlayer($('player').hidden);
  });
  const aud = $('aud');
  // Carry on to the next chapter when one finishes.
  aud.addEventListener('ended', () => {
    const list = chapterList();
    const i = list.findIndex(([b, c]) => b === S.book && c === S.ch);
    const n = list[i + 1];
    if (n && dbsAudio(n[0], n[1])) { S.keepPlaying = true; go(n[0], n[1]); }
  });
  aud.addEventListener('playing', () => { S.keepPlaying = false; });
  aud.crossOrigin = 'anonymous';        // lets the follower hear pauses (DBS allows this)
  S.follow = new Follower(aud);
  aud.addEventListener('play', () => S.follow.listen());
  aud.addEventListener('pause', () => S.follow.stop());
  aud.addEventListener('timeupdate', followAlong);
  aud.addEventListener('seeked', followAlong);
}

// --- interface language ------------------------------------------------------

function applyUi() {
  const label = (id, key) => { const el = $(id); if (el) { el.setAttribute('aria-label', T(key)); el.title = T(key); } };
  label('langBtn', 'language'); label('trSel', 'translation');
  if ($('langBtn').dataset.name) { const n = `${T('language')}: ${$('langBtn').dataset.name}`; $('langBtn').setAttribute('aria-label', n); $('langBtn').title = n; } label('prev', 'prev'); label('next', 'next');
  label('bookSel', 'book'); label('chSel', 'chapter');
  $('listen').setAttribute('aria-label', T('listen'));
  $('langSearch').placeholder = T('search'); $('langSearch').setAttribute('aria-label', T('search'));
  $('langPanel').dir = /^(ar|fa|ur|ps)$/.test(S.ui) ? 'rtl' : 'ltr';
  $('licPop').querySelector('.lic-close').setAttribute('aria-label', T('close'));
  $('wordPop').querySelector('.lic-close').setAttribute('aria-label', T('close'));
  $('licPop').querySelector('.pop-box').setAttribute('aria-label', T('license'));
}

// Book names in the interface's trade language, from a Bible in that
// language in this library (used for audio-only languages and missing books).
const UI_BIBLE_LANG = { en: 'eng', fr: 'fra', es: 'spa', pt: 'por', de: 'deu', ru: 'rus', ar: 'arb', fa: 'pes', ur: 'urd', ps: 'pbu', hi: 'hin', ne: 'npi', bn: 'ben', ta: 'tam', my: 'mya', th: 'tha', lo: 'lao', km: 'khm', vi: 'vie', zh: 'cmn', ko: 'kor', ja: 'jpn', id: 'ind', ms: 'zsm', fil: 'tgl', tr: 'tur', az: 'azj', uz: 'uzn', kk: 'kaz', tg: 'tgk', mn: 'khk', sw: 'swh', am: 'amh', ha: 'hau', so: 'som' };
const tradeCache = new Map();
function tradeBookNames(ui = S.ui) {
  if (!tradeCache.has(ui)) {
    const l = S.catalog.languages[UI_BIBLE_LANG[ui]];
    const tr = l?.translations?.find(t => !t.audioOnly);
    const p = tr ? fetchJson(`content/${tr.id}/index.json` + V).then(ix => Object.fromEntries(ix.books.map(b => [b.code, b.name]))) : Promise.resolve(null);
    tradeCache.set(ui, p); p.catch(() => tradeCache.delete(ui));
  }
  return tradeCache.get(ui);
}

async function nameAudioBooks() {
  const names = (S.lang.arc && await arcBookNames(S.lang.code).catch(() => null)) || S.tradeNames;
  if (names) for (const b of S.tr.books) if (names[b.code]) b.name = names[b.code];
  if (/[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(S.tr.books.map(b => b.name).join(''))) S.tr.dir = 'rtl';
}

// --- DBS ARC text (languages that otherwise have audio only) ------------------
// arc.dbs.org is DBS's open scripture API (CORS, no key, about one request a
// second). One chapter is fetched as it's opened, and kept for offline reading.

const ARC = 'https://arc.dbs.org/api';
const arcCache = new Map();
function arcBookNames(iso) {
  const k = 'names/' + iso;
  if (!arcCache.has(k)) {
    const p = fetchJson(`${ARC}/bible-books/${encodeURIComponent(iso)}`)
      .then(rows => { const m = Object.fromEntries((rows || []).filter(r => r.book_id && r.name).map(r => [r.book_id, r.name])); return Object.keys(m).length ? m : null; });
    arcCache.set(k, p); p.catch(() => arcCache.delete(k));
  }
  return arcCache.get(k);
}
async function arcChapter(iso, book, ch) {
  for (const rec of CONFIG.arc?.[iso] || []) {
    const k = `${rec.id}/${book}/${ch}`;
    if (!arcCache.has(k)) {
      const p = fetchJson(`${ARC}/bible-text/${encodeURIComponent(rec.id)}/${book}/${ch}`).then(rows => {
        const all = Object.assign({}, ...(Array.isArray(rows) ? rows : [rows]));
        const pre = `${USFX[book] || book}${ch}.`;
        const verses = Object.entries(all).filter(([key, t]) => key.startsWith(pre) && String(t || '').trim())
          .map(([key, t]) => ({ v: key.slice(pre.length), t: String(t).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() }))
          .sort((a, b) => parseInt(a.v, 10) - parseInt(b.v, 10));
        return verses.length ? [{ p: 'p' }, ...verses] : null;
      });
      arcCache.set(k, p); p.catch(() => arcCache.delete(k));
    }
    const items = await arcCache.get(k).catch(() => null);
    if (items) return { rec, items };
  }
  return null;
}
async function arcTitle(rec) {
  const b = await fetchJson(`${ARC}/bibles/${encodeURIComponent(rec.id)}`).catch(() => null);
  rec.title = b?.title_vernacular || b?.title || rec.id;
}

// --- follow along -------------------------------------------------------------
// While the audio plays, the verse being read gets a blue highlight. There are
// no timing files yet, so the position is estimated from how much text comes
// before each verse (after a short spoken chapter title).

function followAlong() {
  const aud = $('aud'), main = $('text');
  if ($('player').hidden || !(aud.duration > 0) || !isFinite(aud.duration)) return;
  const cur = dbsAudio();
  if (!cur || aud.dataset.src !== cur.url || main.dataset.ch !== `${S.book}/${S.ch}`) return clearHighlight();
  if (!S.hl) {
    const spans = [...main.querySelectorAll('.vs')];
    if (!spans.length) return;
    S.follow.reset(spans.length, spans.map(sp => sp.textContent.length));
    S.hl = { spans, i: -1 };
  }
  const i = S.follow.current();
  if (i === S.hl.i) return;
  S.hl.spans[S.hl.i]?.classList.remove('hl');
  const el = S.hl.spans[i];
  el.classList.add('hl');
  S.hl.i = i;
  // Keep the highlighted verse on screen (above the bottom bar).
  const r = el.getBoundingClientRect();
  const bottom = innerHeight - ($('player').closest('.bottom')?.offsetHeight || 0);
  if (!aud.paused && (r.top < 56 || r.bottom > bottom)) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function clearHighlight() {
  $('text').querySelectorAll('.vs.hl').forEach(el => el.classList.remove('hl'));
  if (S.hl) S.hl.i = -1;
}

// --- tap a word: the original Greek or Hebrew word behind it ---------------
// For translations whose words carry Strong's numbers (the World English
// Bible). Dictionaries: Strong's Greek (CC0, Ulrik Sandborg-Petersen) and
// Strong's Hebrew (Open Scriptures, CC BY 4.0). Loaded on first tap, then
// kept on the device with the rest of the Bible.

function taggedHtml(t, tags) {
  let out = '', at = 0;
  for (const [a, b, code] of tags) {
    if (a < at || b > t.length) continue;
    out += esc(t.slice(at, a)) + `<span class="w" data-s="${esc(code)}">${esc(t.slice(a, b))}</span>`;
    at = b;
  }
  return out + esc(t.slice(at));
}

const lexicons = {};
function lexicon(kind) {
  lexicons[kind] ||= fetchJson(`content/lexicon/${kind}.json` + V).catch(e => { delete lexicons[kind]; throw e; });
  return lexicons[kind];
}

async function showWord(code, tapped, el) {
  if (!/^[GH]\d+$/.test(code || '')) return;
  const pop = $('wordPop'), body = $('wordBody');
  $('text').querySelectorAll('.w.on').forEach(x => x.classList.remove('on'));
  el?.classList.add('on');
  if (tapped != null) pop.dataset.tapped = tapped;
  pop.hidden = false;
  body.innerHTML = '<p class="muted">…</p>';
  let e;
  try { e = (await lexicon(code[0]))[code]; } catch { body.innerHTML = '<p class="muted">⚠</p>'; return; }
  if (!e) { body.innerHTML = `<p class="muted">${esc(code)}</p>`; return; }
  const [word, translit, pron, meaning, usage, from] = e;
  const heb = code[0] === 'H';
  const refs = s => esc(s).replace(/\b([GH])(\d+)\b/g, (m) => `<button type="button" class="wd-ref" data-s="${m}">${m}</button>`);
  body.innerHTML =
    (pop.dataset.tapped ? `<p class="wd-tapped">“${esc(pop.dataset.tapped)}”</p>` : '')
    + `<p class="wd-orig" lang="${heb ? 'hbo' : 'grc'}" dir="${heb ? 'rtl' : 'ltr'}">${esc(word)}</p>`
    + `<p class="wd-say">${esc(translit)}${pron ? ` · <span>${esc(pron)}</span>` : ''}</p>`
    + (meaning ? `<p class="wd-def">${esc(meaning)}</p>` : '')
    + (usage ? `<p class="wd-use"><span>KJV:</span> ${esc(usage)}</p>` : '')
    + (from ? `<p class="wd-from">${refs(from)}</p>` : '')
    + `<p class="wd-cred">Strong's ${esc(code)} · ${heb ? 'Hebrew: Open Scriptures, CC BY 4.0' : 'Greek: public domain (CC0)'}</p>`;
  pop.querySelector('.lic-close').focus({ preventScroll: true });
}

function hideWord() {
  $('wordPop').hidden = true;
  delete $('wordPop').dataset.tapped;
  $('text').querySelector('.w.on')?.classList.remove('on');
}

// --- save a book's audio for offline listening ----------------------------
// Downloads every chapter's recording of the current book into the browser's
// storage; the service worker plays them from there when offline. Runs in the
// page (not the worker) so a long book isn't cut off; tap again to resume.

const AUDIO_CACHE = 'audio-v1';

// Point the player at a chapter: the copy saved on this device if there is
// one (works offline, seeks instantly), otherwise DBS's stream.
// dataset.src always holds the DBS address, so the rest of the code can tell
// which chapter is loaded.
async function setAudioSrc(url) {
  const aud = $('aud');
  aud.dataset.src = url;
  let src = url;
  try {
    const hit = 'caches' in window && await (await caches.open(AUDIO_CACHE)).match(url);
    if (hit) src = URL.createObjectURL(await hit.blob());
  } catch { /* storage unavailable: stream */ }
  if (aud.dataset.src !== url) { if (src !== url) URL.revokeObjectURL(src); return; }   // moved on meanwhile
  if (aud.src.startsWith('blob:')) URL.revokeObjectURL(aud.src);
  aud.src = src;
}

function bookAudioUrls(book = S.book) {
  const meta = S.tr?.books.find(b => b.code === book);
  if (!meta) return [];
  return [...new Set(meta.chapters.map(c => dbsAudio(book, c)?.url).filter(Boolean))];
}

// The Save button in the licence pop-up saves the current book's audio when
// there is audio (shows progress, then ✓; tap again to remove it).
async function updateSaveAudio() {
  const btn = $('licPop').querySelector('.share-file[data-mode="audio"]');
  if (!btn || !('caches' in window)) return;
  const urls = bookAudioUrls();
  btn.title = T('saveAudio');
  if (S.audioSaving === S.book) return;             // progress shown while saving
  const c = await caches.open(AUDIO_CACHE);
  const saved = (await Promise.all(urls.map(u => c.match(u)))).every(Boolean);
  btn.classList.toggle('saved', saved);
  btn.textContent = saved ? `✓ ${T('savedAudio')}` : `⤓ ${T('share')}`;
  btn.dataset.state = saved ? 'saved' : 'save';
}

async function saveBookAudio(btn) {
  const book = S.book, urls = bookAudioUrls(book);
  if (!urls.length || !('caches' in window)) return;
  const c = await caches.open(AUDIO_CACHE);
  if (btn.dataset.state === 'saved') {             // tap again: free the space
    await Promise.all(urls.map(u => c.delete(u)));
    return updateSaveAudio();
  }
  navigator.storage?.persist?.().catch(() => {});
  S.audioSaving = book; btn.disabled = true; btn.classList.remove('saved');
  let done = 0;
  const live = () => $('licPop').querySelector('.share-file[data-mode="audio"]');
  const show = () => { const b = live(); if (b && S.book === book) b.textContent = `⤓ ${N(done)} / ${N(urls.length)}`; };
  show();
  for (const u of urls) {
    try {
      if (!(await c.match(u))) {
        const res = await fetch(u, { mode: 'cors' });
        if (res.ok && res.status === 200) await c.put(u, res);
      }
      done++;
    } catch { /* offline or blocked: stop, keep what's saved; tap again to resume */ break; }
    show();
  }
  S.audioSaving = null;
  const b = live(); if (b) b.disabled = false;
  updateSaveAudio();
}

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
