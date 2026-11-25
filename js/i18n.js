// Interface words in the reader's language. When a language has no interface
// translation here, the reader gets the main trade language of where that
// language is spoken (e.g. Kinyarwanda → French, Mru → Bengali), then English.

export const UI = {
  en: { search: 'Search languages', language: 'Language', translation: 'Translation', listen: 'Listen', prev: 'Previous chapter', next: 'Next chapter', book: 'Book', chapter: 'Chapter', license: 'License', close: 'Close', missing: 'This book is not in this translation.', others: 'Read it in:', share: 'Save' },
  fr: { search: 'Rechercher une langue', language: 'Langue', translation: 'Traduction', listen: 'Écouter', prev: 'Chapitre précédent', next: 'Chapitre suivant', book: 'Livre', chapter: 'Chapitre', license: 'Licence', close: 'Fermer', missing: 'Ce livre ne figure pas dans cette traduction.', others: 'Le lire en :', share: 'Enregistrer' },
  es: { search: 'Buscar idioma', language: 'Idioma', translation: 'Traducción', listen: 'Escuchar', prev: 'Capítulo anterior', next: 'Capítulo siguiente', book: 'Libro', chapter: 'Capítulo', license: 'Licencia', close: 'Cerrar', missing: 'Este libro no está en esta traducción.', others: 'Leerlo en:', share: 'Guardar' },
  pt: { search: 'Pesquisar idioma', language: 'Idioma', translation: 'Tradução', listen: 'Ouvir', prev: 'Capítulo anterior', next: 'Próximo capítulo', book: 'Livro', chapter: 'Capítulo', license: 'Licença', close: 'Fechar', missing: 'Este livro não está nesta tradução.', others: 'Ler em:', share: 'Salvar' },
  de: { search: 'Sprache suchen', language: 'Sprache', translation: 'Übersetzung', listen: 'Anhören', prev: 'Vorheriges Kapitel', next: 'Nächstes Kapitel', book: 'Buch', chapter: 'Kapitel', license: 'Lizenz', close: 'Schließen', missing: 'Dieses Buch ist in dieser Übersetzung nicht enthalten.', others: 'Lesen auf:', share: 'Speichern' },
  ru: { search: 'Поиск языка', language: 'Язык', translation: 'Перевод', listen: 'Слушать', prev: 'Предыдущая глава', next: 'Следующая глава', book: 'Книга', chapter: 'Глава', license: 'Лицензия', close: 'Закрыть', missing: 'Этой книги нет в данном переводе.', others: 'Читать на:', share: 'Сохранить' },
  ar: { search: 'ابحث عن لغة', language: 'اللغة', translation: 'الترجمة', listen: 'استمع', prev: 'الأصحاح السابق', next: 'الأصحاح التالي', book: 'السفر', chapter: 'الأصحاح', license: 'الترخيص', close: 'إغلاق', missing: 'هذا السفر غير موجود في هذه الترجمة.', others: 'اقرأه بـ:', share: 'حفظ' },
  fa: { search: 'جستجوی زبان', language: 'زبان', translation: 'ترجمه', listen: 'گوش دادن', prev: 'باب قبلی', next: 'باب بعدی', book: 'کتاب', chapter: 'باب', license: 'مجوز', close: 'بستن', missing: 'این کتاب در این ترجمه نیست.', others: 'خواندن به:', share: 'ذخیره' },
  ur: { search: 'زبان تلاش کریں', language: 'زبان', translation: 'ترجمہ', listen: 'سنیں', prev: 'پچھلا باب', next: 'اگلا باب', book: 'کتاب', chapter: 'باب', license: 'لائسنس', close: 'بند کریں', missing: 'یہ کتاب اس ترجمے میں نہیں ہے۔', others: 'پڑھیں:', share: 'محفوظ کریں' },
  ps: { search: 'ژبه ولټوئ', language: 'ژبه', translation: 'ژباړه', listen: 'واورئ', prev: 'مخکنی څپرکی', next: 'بل څپرکی', book: 'کتاب', chapter: 'څپرکی', license: 'جواز', close: 'بندول', missing: 'دا کتاب په دې ژباړه کې نشته.', others: 'ولولئ په:', share: 'خوندي کړئ' },
  hi: { search: 'भाषा खोजें', language: 'भाषा', translation: 'अनुवाद', listen: 'सुनें', prev: 'पिछला अध्याय', next: 'अगला अध्याय', book: 'पुस्तक', chapter: 'अध्याय', license: 'लाइसेंस', close: 'बंद करें', missing: 'यह पुस्तक इस अनुवाद में नहीं है।', others: 'इसमें पढ़ें:', share: 'सहेजें' },
  ne: { search: 'भाषा खोज्नुहोस्', language: 'भाषा', translation: 'अनुवाद', listen: 'सुन्नुहोस्', prev: 'अघिल्लो अध्याय', next: 'अर्को अध्याय', book: 'पुस्तक', chapter: 'अध्याय', license: 'इजाजतपत्र', close: 'बन्द गर्नुहोस्', missing: 'यो पुस्तक यस अनुवादमा छैन।', others: 'यसमा पढ्नुहोस्:', share: 'सुरक्षित गर्नुहोस्' },
  bn: { search: 'ভাষা খুঁজুন', language: 'ভাষা', translation: 'অনুবাদ', listen: 'শুনুন', prev: 'আগের অধ্যায়', next: 'পরের অধ্যায়', book: 'পুস্তক', chapter: 'অধ্যায়', license: 'লাইসেন্স', close: 'বন্ধ করুন', missing: 'এই পুস্তকটি এই অনুবাদে নেই।', others: 'পড়ুন:', share: 'সংরক্ষণ' },
  ta: { search: 'மொழியைத் தேடு', language: 'மொழி', translation: 'மொழிபெயர்ப்பு', listen: 'கேளுங்கள்', prev: 'முந்தைய அதிகாரம்', next: 'அடுத்த அதிகாரம்', book: 'புத்தகம்', chapter: 'அதிகாரம்', license: 'உரிமம்', close: 'மூடு', missing: 'இந்தப் புத்தகம் இந்த மொழிபெயர்ப்பில் இல்லை.', others: 'படிக்க:', share: 'சேமி' },
  my: { search: 'ဘာသာစကား ရှာရန်', language: 'ဘာသာစကား', translation: 'ဘာသာပြန်', listen: 'နားထောင်ရန်', prev: 'ယခင်အခန်း', next: 'နောက်အခန်း', book: 'ကျမ်း', chapter: 'အခန်း', license: 'လိုင်စင်', close: 'ပိတ်ရန်', missing: 'ဤကျမ်းသည် ဤဘာသာပြန်တွင် မပါဝင်ပါ။', others: 'ဖတ်ရန်:', share: 'သိမ်းရန်' },
  th: { search: 'ค้นหาภาษา', language: 'ภาษา', translation: 'ฉบับแปล', listen: 'ฟัง', prev: 'บทก่อนหน้า', next: 'บทถัดไป', book: 'หนังสือ', chapter: 'บท', license: 'สัญญาอนุญาต', close: 'ปิด', missing: 'หนังสือเล่มนี้ไม่มีในฉบับแปลนี้', others: 'อ่านเป็น:', share: 'บันทึก' },
  lo: { search: 'ຊອກຫາພາສາ', language: 'ພາສາ', translation: 'ສະບັບແປ', listen: 'ຟັງ', prev: 'ບົດກ່ອນ', next: 'ບົດຕໍ່ໄປ', book: 'ໜັງສື', chapter: 'ບົດ', license: 'ໃບອະນຸຍາດ', close: 'ປິດ', missing: 'ໜັງສືນີ້ບໍ່ມີໃນສະບັບແປນີ້.', others: 'ອ່ານເປັນ:', share: 'ບັນທຶກ' },
  km: { search: 'ស្វែងរកភាសា', language: 'ភាសា', translation: 'ការបកប្រែ', listen: 'ស្ដាប់', prev: 'ជំពូកមុន', next: 'ជំពូកបន្ទាប់', book: 'គម្ពីរ', chapter: 'ជំពូក', license: 'អាជ្ញាប័ណ្ណ', close: 'បិទ', missing: 'គម្ពីរនេះមិនមាននៅក្នុងការបកប្រែនេះទេ។', others: 'អានជា៖', share: 'រក្សាទុក' },
  vi: { search: 'Tìm ngôn ngữ', language: 'Ngôn ngữ', translation: 'Bản dịch', listen: 'Nghe', prev: 'Chương trước', next: 'Chương sau', book: 'Sách', chapter: 'Chương', license: 'Giấy phép', close: 'Đóng', missing: 'Sách này không có trong bản dịch này.', others: 'Đọc bằng:', share: 'Lưu' },
  zh: { search: '搜索语言', language: '语言', translation: '译本', listen: '收听', prev: '上一章', next: '下一章', book: '书卷', chapter: '章', license: '许可', close: '关闭', missing: '此译本中没有这卷书。', others: '阅读：', share: '保存' },
  ko: { search: '언어 검색', language: '언어', translation: '번역본', listen: '듣기', prev: '이전 장', next: '다음 장', book: '책', chapter: '장', license: '라이선스', close: '닫기', missing: '이 번역본에는 이 책이 없습니다.', others: '다른 언어로 읽기:', share: '저장' },
  ja: { search: '言語を検索', language: '言語', translation: '翻訳', listen: '聞く', prev: '前の章', next: '次の章', book: '書', chapter: '章', license: 'ライセンス', close: '閉じる', missing: 'この翻訳にはこの書がありません。', others: '他の言語で読む:', share: '保存' },
  id: { search: 'Cari bahasa', language: 'Bahasa', translation: 'Terjemahan', listen: 'Dengarkan', prev: 'Pasal sebelumnya', next: 'Pasal berikutnya', book: 'Kitab', chapter: 'Pasal', license: 'Lisensi', close: 'Tutup', missing: 'Kitab ini tidak ada dalam terjemahan ini.', others: 'Baca dalam:', share: 'Simpan' },
  ms: { search: 'Cari bahasa', language: 'Bahasa', translation: 'Terjemahan', listen: 'Dengar', prev: 'Pasal sebelumnya', next: 'Pasal seterusnya', book: 'Kitab', chapter: 'Pasal', license: 'Lesen', close: 'Tutup', missing: 'Kitab ini tiada dalam terjemahan ini.', others: 'Baca dalam:', share: 'Simpan' },
  fil: { search: 'Maghanap ng wika', language: 'Wika', translation: 'Salin', listen: 'Makinig', prev: 'Nakaraang kabanata', next: 'Susunod na kabanata', book: 'Aklat', chapter: 'Kabanata', license: 'Lisensya', close: 'Isara', missing: 'Wala ang aklat na ito sa saling ito.', others: 'Basahin sa:', share: 'I-save' },
  tr: { search: 'Dil ara', language: 'Dil', translation: 'Çeviri', listen: 'Dinle', prev: 'Önceki bölüm', next: 'Sonraki bölüm', book: 'Kitap', chapter: 'Bölüm', license: 'Lisans', close: 'Kapat', missing: 'Bu kitap bu çeviride yok.', others: 'Şu dilde oku:', share: 'Kaydet' },
  az: { search: 'Dil axtar', language: 'Dil', translation: 'Tərcümə', listen: 'Dinlə', prev: 'Əvvəlki fəsil', next: 'Növbəti fəsil', book: 'Kitab', chapter: 'Fəsil', license: 'Lisenziya', close: 'Bağla', missing: 'Bu kitab bu tərcümədə yoxdur.', others: 'Bu dildə oxu:', share: 'Saxla' },
  uz: { search: 'Til qidirish', language: 'Til', translation: 'Tarjima', listen: 'Tinglash', prev: 'Oldingi bob', next: 'Keyingi bob', book: 'Kitob', chapter: 'Bob', license: 'Litsenziya', close: 'Yopish', missing: 'Bu kitob ushbu tarjimada yoʻq.', others: 'Bu tilda oʻqish:', share: 'Saqlash' },
  kk: { search: 'Тілді іздеу', language: 'Тіл', translation: 'Аударма', listen: 'Тыңдау', prev: 'Алдыңғы тарау', next: 'Келесі тарау', book: 'Кітап', chapter: 'Тарау', license: 'Лицензия', close: 'Жабу', missing: 'Бұл кітап осы аудармада жоқ.', others: 'Оқу тілі:', share: 'Сақтау' },
  tg: { search: 'Ҷустуҷӯи забон', language: 'Забон', translation: 'Тарҷума', listen: 'Гӯш кардан', prev: 'Боби қаблӣ', next: 'Боби навбатӣ', book: 'Китоб', chapter: 'Боб', license: 'Иҷозатнома', close: 'Пӯшидан', missing: 'Ин китоб дар ин тарҷума нест.', others: 'Хондан бо:', share: 'Нигоҳ доштан' },
  mn: { search: 'Хэл хайх', language: 'Хэл', translation: 'Орчуулга', listen: 'Сонсох', prev: 'Өмнөх бүлэг', next: 'Дараах бүлэг', book: 'Ном', chapter: 'Бүлэг', license: 'Лиценз', close: 'Хаах', missing: 'Энэ ном энэ орчуулгад байхгүй.', others: 'Унших хэл:', share: 'Хадгалах' },
  sw: { search: 'Tafuta lugha', language: 'Lugha', translation: 'Tafsiri', listen: 'Sikiliza', prev: 'Sura iliyotangulia', next: 'Sura inayofuata', book: 'Kitabu', chapter: 'Sura', license: 'Leseni', close: 'Funga', missing: 'Kitabu hiki hakimo katika tafsiri hii.', others: 'Soma kwa:', share: 'Hifadhi' },
  am: { search: 'ቋንቋ ፈልግ', language: 'ቋንቋ', translation: 'ትርጉም', listen: 'አዳምጥ', prev: 'ያለፈው ምዕራፍ', next: 'የሚቀጥለው ምዕራፍ', book: 'መጽሐፍ', chapter: 'ምዕራፍ', license: 'ፈቃድ', close: 'ዝጋ', missing: 'ይህ መጽሐፍ በዚህ ትርጉም ውስጥ የለም።', others: 'በዚህ ያንብቡ፦', share: 'አስቀምጥ' },
  ha: { search: 'Nemi harshe', language: 'Harshe', translation: 'Fassara', listen: 'Saurara', prev: 'Babin da ya gabata', next: 'Babi na gaba', book: 'Littafi', chapter: 'Babi', license: 'Lasisi', close: 'Rufe', missing: 'Wannan littafi ba ya cikin wannan fassara.', others: 'Karanta da:', share: 'Ajiye' },
  so: { search: 'Raadi luqad', language: 'Luqad', translation: 'Tarjumaad', listen: 'Dhegeyso', prev: 'Cutubkii hore', next: 'Cutubka xiga', book: 'Kitaab', chapter: 'Cutub', license: 'Shatiga', close: 'Xir', missing: 'Kitaabkan kuma jiro tarjumaaddan.', others: 'Ku akhri:', share: 'Kaydi' },
};

// ISO 639-3 / BCP-47 codes that map onto an interface language above.
const ALIAS = {
  eng: 'en', fra: 'fr', spa: 'es', por: 'pt', deu: 'de', rus: 'ru', arb: 'ar', ara: 'ar', apc: 'ar', ajp: 'ar', acm: 'ar', arz: 'ar', ayl: 'ar', apd: 'ar', shu: 'ar',
  pes: 'fa', prs: 'fa', fas: 'fa', urd: 'ur', pbu: 'ps', pst: 'ps', pus: 'ps', hin: 'hi', npi: 'ne', nep: 'ne', ben: 'bn', tam: 'ta', mya: 'my', tha: 'th', lao: 'lo',
  khm: 'km', vie: 'vi', cmn: 'zh', zho: 'zh', yue: 'zh', kor: 'ko', jpn: 'ja', ind: 'id', zsm: 'ms', msa: 'ms', fil: 'fil', tgl: 'fil', tur: 'tr', azj: 'az', aze: 'az',
  uzn: 'uz', uzb: 'uz', kaz: 'kk', tgk: 'tg', khk: 'mn', mon: 'mn', swh: 'sw', swa: 'sw', swc: 'sw', amh: 'am', hau: 'ha', som: 'so',
};

// Country → main trade language (ISO 3166 alpha-2 → interface language).
const T = (lang, cs) => Object.fromEntries(cs.split(' ').map(c => [c, lang]));
const REGION = {
  ...T('fr', 'FR BE CH LU MC SN ML BF NE GN CI TG BJ CM CF TD CG CD GA DJ KM MG BI RW HT NC PF'),
  ...T('pt', 'PT BR AO MZ GW CV ST TL'),
  ...T('es', 'ES MX GT HN SV NI CR PA CU DO PR CO VE EC PE BO CL AR UY PY GQ'),
  ...T('ar', 'SA AE QA KW BH OM YE IQ SY JO LB PS EG LY TN DZ MA MR SD EH'),
  ...T('sw', 'TZ KE UG'), ...T('am', 'ET'), ...T('so', 'SO'), ...T('en', 'NG GH LR SL GM ZA ZW ZM MW BW NA LS SZ SS ER PG SB VU FJ US GB IE AU NZ CA JM'),
  ...T('ru', 'RU BY UA KG MD GE AM'), ...T('kk', 'KZ'), ...T('uz', 'UZ'), ...T('tg', 'TJ'), ...T('tr', 'TR TM'), ...T('az', 'AZ'), ...T('mn', 'MN'),
  ...T('fa', 'IR AF'), ...T('ur', 'PK'), ...T('hi', 'IN'), ...T('ne', 'NP BT'), ...T('bn', 'BD'), ...T('my', 'MM'), ...T('th', 'TH'), ...T('lo', 'LA'),
  ...T('km', 'KH'), ...T('vi', 'VN'), ...T('zh', 'CN TW HK MO SG'), ...T('ko', 'KR KP'), ...T('ja', 'JP'), ...T('id', 'ID'), ...T('ms', 'MY BN'),
  ...T('fil', 'PH'), ...T('de', 'DE AT LI'), ...T('ta', 'LK'),
};

// Pick the interface language for a reading language.
// lang: { code, bcp, ci? (country code) }, related: config list, browser: navigator languages
export function uiFor(lang, related = [], browser = []) {
  const hit = c => { c = String(c || '').toLowerCase(); const base = c.split('-')[0]; return UI[c] ? c : UI[base] ? base : UI[ALIAS[base]] ? ALIAS[base] : null; };
  let r = hit(lang?.code) || hit(lang?.bcp);
  if (r) return r;
  for (const c of related) if ((r = hit(c))) return r;
  let region = lang?.ci;
  if (!region) { try { region = new Intl.Locale(lang.bcp).maximize().region; } catch {} }
  if (region && REGION[region.toUpperCase()]) return REGION[region.toUpperCase()];
  for (const c of browser) if ((r = hit(c))) return r;
  return 'en';
}

export const t = (ui, key) => (UI[ui] && UI[ui][key]) || UI.en[key];
