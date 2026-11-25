// A copy of the whole Bible as ONE plain HTML file, made in the browser from
// the text already on this device. It needs no internet, no app and no
// JavaScript, so it opens on almost any phone or computer, including e-readers
// and iPhone's Files preview. Meant to be passed on by USB stick, SD card,
// Bluetooth or a messaging app where the internet is blocked or watched.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// tr: translation index ({title, copyright, license, dir, books:[{code,name,chapters}]})
// lang: {bcp, name}; volumes: {BOOK: {"1": items}} merged; num: n → local digits
export function buildBibleHtml({ tr, lang, volumes, num, digits }) {
  const dir = tr.dir === 'rtl' ? 'rtl' : 'ltr';
  const books = tr.books.filter(b => volumes[b.code]);
  const nav = books.map(b => `<a href="#${b.code}">${esc(b.name)}</a>`).join(' · ');
  let body = '';
  for (const b of books) {
    const chs = Object.keys(volumes[b.code]).map(Number).sort((x, y) => x - y);
    body += `<section id="${b.code}"><h2>${esc(b.name)}</h2><p class="chs">`
      + chs.map(c => `<a href="#${b.code}.${c}">${num(c)}</a>`).join(' ') + '</p>';
    for (const c of chs) {
      body += `<h3 id="${b.code}.${c}">${esc(b.name)} ${num(c)} <a class="up" href="#top" aria-label="top">↑</a></h3>`;
      let open = false;
      const p = cls => { if (open) body += '</p>'; body += `<p class="${esc(cls)}">`; open = true; };
      for (const it of volumes[b.code][String(c)] || []) {
        if (it.h) { if (open) { body += '</p>'; open = false; } body += `<h4>${esc(it.h)}</h4>`; }
        else if (it.p) p(it.p);
        else if (it.v) { if (!open) p('p'); body += (it.c ? '' : `<sup>${esc(digits(it.v))}</sup>`) + esc(it.t) + ' '; }
      }
      if (open) body += '</p>';
    }
    body += '</section>';
  }
  const credit = `<p><strong>${esc(tr.title)}</strong></p>${tr.copyright ? `<p>${esc(tr.copyright)}</p>` : ''}${tr.license ? `<p>${esc(tr.license)}</p>` : ''}`;
  return `<!DOCTYPE html>
<html lang="${esc(lang.bcp)}" dir="${dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tr.title)}</title>
<style>
body{font:1.1rem/1.65 Georgia,"Noto Serif",serif;max-width:42rem;margin:0 auto;padding:1rem;color:#111;background:#fff}
h1{font-size:1.5rem}h2{margin-top:2.5rem;border-top:1px solid #ddd;padding-top:1rem}h3{font-size:1.05rem;margin-top:1.6rem}
h4{font-size:1rem;font-style:italic}sup{color:#777;font-size:.7em;margin-inline-end:.15em}
a{color:#1f3f8f;text-decoration:none}.chs a{display:inline-block;min-width:2.2em;padding:.15em;text-align:center}
.up{font-size:.8em;margin-inline-start:.4em}nav{line-height:2}footer{margin-top:3rem;border-top:1px solid #ddd;font-size:.85rem;color:#555}
</style></head><body id="top">
<h1>${esc(tr.title)}</h1>
<nav>${nav}</nav>
${body}
<footer>${credit}</footer>
</body></html>`;
}
