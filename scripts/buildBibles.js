import fs from 'fs';
import path from 'path';

// Load cached translations
const cuv = JSON.parse(fs.readFileSync('.cache_bibles/zh_cunpss-shen.json', 'utf8'));
const cnvs = JSON.parse(fs.readFileSync('.cache_bibles/zh_cnvs.json', 'utf8'));
const niv = JSON.parse(fs.readFileSync('.cache_bibles/en_niv.json', 'utf8'));
const esv = JSON.parse(fs.readFileSync('.cache_bibles/en_esv.json', 'utf8'));
const nkjv = JSON.parse(fs.readFileSync('.cache_bibles/en_nkjv.json', 'utf8'));
const nlt = JSON.parse(fs.readFileSync('.cache_bibles/en_nlt.json', 'utf8'));
const nasb = JSON.parse(fs.readFileSync('.cache_bibles/en_nasb.json', 'utf8'));

// Book ID mappings from BIBLE_BOOKS (0 to 65)
const BOOK_IDS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
  'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
  'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
  '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

const outDir = path.resolve('public/bibles/books');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function cleanZh(str) {
  if (!str) return '';
  // Clean honorific spacing before 神 in Shen edition if needed, and trim
  return str.replace(/[\u3000\s]+神/g, '神').trim();
}

function cleanEn(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

for (let b = 0; b < 66; b++) {
  const bookId = BOOK_IDS[b];
  const cuvBook = cuv[b];
  const cnvsBook = cnvs[b];
  const nivBook = niv[b];
  const esvBook = esv[b];
  const nkjvBook = nkjv[b];
  const nltBook = nlt[b];
  const nasbBook = nasb[b];

  const totalChapters = cuvBook.chapters.length;
  const chapters = [];

  for (let c = 0; c < totalChapters; c++) {
    const chapterNum = c + 1;
    const cuvVerses = cuvBook.chapters[c] || [];
    const cnvsVerses = cnvsBook?.chapters[c] || [];
    const nivVerses = nivBook?.chapters[c] || [];
    const esvVerses = esvBook?.chapters[c] || [];
    const nkjvVerses = nkjvBook?.chapters[c] || [];
    const nltVerses = nltBook?.chapters[c] || [];
    const nasbVerses = nasbBook?.chapters[c] || [];

    const verseCount = Math.max(
      cuvVerses.length,
      cnvsVerses.length,
      nivVerses.length,
      esvVerses.length
    );

    const verses = [];
    for (let v = 0; v < verseCount; v++) {
      const verseNum = v + 1;
      const vCuv = cleanZh(cuvVerses[v]);
      const vCnvs = cleanZh(cnvsVerses[v]);
      const vNiv = cleanEn(nivVerses[v]);
      const vEsv = cleanEn(esvVerses[v]);
      const vNkjv = cleanEn(nkjvVerses[v]);
      const vNlt = cleanEn(nltVerses[v]);
      const vNasb = cleanEn(nasbVerses[v]);

      verses.push({
        number: verseNum,
        textZh: vCnvs || vCuv,
        textZhCnvs: vCnvs || vCuv,
        textZhCuv: vCuv || vCnvs,
        textEnNiv: vNiv,
        textEnEsv: vEsv || vNiv,
        textEnNkjv: vNkjv || vNiv,
        textEnNlt: vNlt || vNiv,
        textEnNasb: vNasb || vNiv,
        textEn: vNiv || vEsv,
      });
    }

    chapters.push({
      chapter: chapterNum,
      verses,
    });
  }

  const bookData = {
    bookId,
    chapters,
  };

  const filePath = path.join(outDir, `${bookId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(bookData));
}

console.log(`Successfully generated all 66 book JSON files in ${outDir}!`);
