// Book order and the "volume" bundles each translation is split into.
// Volumes keep the file count low (≤7 files per translation) so the full
// library stays under free-host file-count limits, while keeping each
// download small enough for slow connections.

export const OT = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL'];
export const NT = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
export const DC = ['TOB','JDT','ESG','WIS','SIR','BAR','LJE','S3Y','SUS','BEL','1MA','2MA','3MA','4MA','1ES','2ES','MAN','PS2','ODA','PSS','EZA','5EZ','6EZ','DAG','PS3','2BA','LBA','JUB','ENO','1MQ','2MQ','3MQ','REP','4BA','LAO'];

export const ORDER = [...OT, ...NT, ...DC];

// English fallback names, used only when a translation has no \h or \toc header.
export const EN_NAMES = {
  GEN:'Genesis',EXO:'Exodus',LEV:'Leviticus',NUM:'Numbers',DEU:'Deuteronomy',JOS:'Joshua',JDG:'Judges',RUT:'Ruth','1SA':'1 Samuel','2SA':'2 Samuel','1KI':'1 Kings','2KI':'2 Kings','1CH':'1 Chronicles','2CH':'2 Chronicles',EZR:'Ezra',NEH:'Nehemiah',EST:'Esther',JOB:'Job',PSA:'Psalms',PRO:'Proverbs',ECC:'Ecclesiastes',SNG:'Song of Songs',ISA:'Isaiah',JER:'Jeremiah',LAM:'Lamentations',EZK:'Ezekiel',DAN:'Daniel',HOS:'Hosea',JOL:'Joel',AMO:'Amos',OBA:'Obadiah',JON:'Jonah',MIC:'Micah',NAM:'Nahum',HAB:'Habakkuk',ZEP:'Zephaniah',HAG:'Haggai',ZEC:'Zechariah',MAL:'Malachi',
  MAT:'Matthew',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Romans','1CO':'1 Corinthians','2CO':'2 Corinthians',GAL:'Galatians',EPH:'Ephesians',PHP:'Philippians',COL:'Colossians','1TH':'1 Thessalonians','2TH':'2 Thessalonians','1TI':'1 Timothy','2TI':'2 Timothy',TIT:'Titus',PHM:'Philemon',HEB:'Hebrews',JAS:'James','1PE':'1 Peter','2PE':'2 Peter','1JN':'1 John','2JN':'2 John','3JN':'3 John',JUD:'Jude',REV:'Revelation',
  TOB:'Tobit',JDT:'Judith',ESG:'Esther (Greek)',WIS:'Wisdom',SIR:'Sirach',BAR:'Baruch',LJE:'Letter of Jeremiah',S3Y:'Song of the Three',SUS:'Susanna',BEL:'Bel and the Dragon','1MA':'1 Maccabees','2MA':'2 Maccabees','3MA':'3 Maccabees','4MA':'4 Maccabees','1ES':'1 Esdras','2ES':'2 Esdras',MAN:'Prayer of Manasseh',PS2:'Psalm 151',
};

const VOLUMES = [
  ['ot1', OT.slice(0, 5)],    // Law
  ['ot2', OT.slice(5, 17)],   // History
  ['ot3', OT.slice(17, 22)],  // Poetry & wisdom
  ['ot4', OT.slice(22)],      // Prophets
  ['nt1', NT.slice(0, 5)],    // Gospels & Acts
  ['nt2', NT.slice(5)],       // Letters & Revelation
  ['dc', DC],
];

export const VOLUME_OF = Object.fromEntries(VOLUMES.flatMap(([v, books]) => books.map(b => [b, v])));

export function testamentOf(code) {
  if (OT.includes(code)) return 'ot';
  if (NT.includes(code)) return 'nt';
  if (DC.includes(code)) return 'dc';
  return null;
}

// Compact hex bitmask of which books (in ORDER) a translation contains, so the
// reader can suggest alternatives without downloading every index.
export function bookMask(codes) {
  const set = new Set(codes);
  let hex = '';
  for (let i = 0; i < ORDER.length; i += 4) {
    let n = 0;
    for (let j = 0; j < 4; j++) if (set.has(ORDER[i + j])) n |= 1 << j;
    hex += n.toString(16);
  }
  return hex.replace(/0+$/, '');
}
export function maskHas(hex, code) {
  const i = ORDER.indexOf(code);
  if (i < 0 || !hex) return false;
  const d = parseInt(hex[i >> 2] || '0', 16);
  return (d & (1 << (i & 3))) !== 0;
}

// Describe how complete a translation is, for the "partial" label.
export function coverage(bookCodes) {
  const set = new Set(bookCodes);
  const ot = OT.filter(b => set.has(b)).length;
  const nt = NT.filter(b => set.has(b)).length;
  if (ot === OT.length && nt === NT.length) return 'full';
  if (nt === NT.length && ot === 0) return 'nt';
  if (nt === NT.length) return 'nt+';       // NT plus some OT books
  if (ot === OT.length && nt === 0) return 'ot';
  return 'portions';
}
