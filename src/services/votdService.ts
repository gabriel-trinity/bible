import { BIBLE_BOOKS, getBookById } from '../data/bibleBooks';
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { fetchChapter } from './bibleService';
import { stripVerseMarkup } from './pinyinService';
import { BibleBook, TranslationId, VerseItem, VotdData, VotdEntry, VotdParsedRef } from '../types/bible';

let cachedVotd: VotdData | null = null;
let pendingPromise: Promise<VotdData> | null = null;

/**
 * Resolve either a parsed USFM ref or a human-readable string like "John 14:27" or "Psalms 139:10"
 * into bookId, chapter, verseStart, verseEnd.
 */
export function resolveVotdRef(entry: VotdEntry): VotdParsedRef | null {
  if (entry.parsedRef && getBookById(entry.parsedRef.bookId)) {
    return entry.parsedRef;
  }

  const ref = entry.referenceHuman.trim();
  const m = ref.match(/^([1-3]?\s*[A-Za-z\s]+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/);
  if (!m) return null;

  const bookNameInput = m[1].trim().toLowerCase().replace(/^psalm$/, 'psalms');
  const chapter = parseInt(m[2], 10);
  const verseStart = parseInt(m[3], 10);
  const verseEnd = m[4] ? parseInt(m[4], 10) : verseStart;

  const matchedBook = BIBLE_BOOKS.find(
    (b) =>
      b.nameEn.toLowerCase() === bookNameInput ||
      b.abbrEn.toLowerCase() === bookNameInput ||
      b.id.toLowerCase() === bookNameInput
  );

  if (!matchedBook) return null;

  return {
    raw: `${matchedBook.id}.${chapter}.${verseStart}${verseEnd > verseStart ? `-${verseEnd}` : ''}`,
    bookId: matchedBook.id,
    chapter,
    verseStart,
    verseEnd,
  };
}

export async function fetchVerseOfTheDay(forceRefresh = false): Promise<VotdData> {
  if (!forceRefresh && cachedVotd) {
    return cachedVotd;
  }
  if (!forceRefresh && pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = (async () => {
    try {
      const url = forceRefresh ? '/api/votd?refresh=1' : '/api/votd';
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        const data: VotdData = await res.json();
        cachedVotd = data;
        return data;
      }
    } catch (err) {
      console.warn('Failed to load /api/votd:', err);
    } finally {
      pendingPromise = null;
    }

    // Client-side emergency fallback if API is unreachable
    const fallback: VotdData = {
      source: 'fallback',
      sourceUrl: 'https://www.bible.com/verse-of-the-day',
      fetchedAt: new Date().toISOString(),
      today: {
        day: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        referenceHuman: 'John 14:27',
        usfm: ['JHN.14.27'],
        parsedRef: {
          raw: 'JHN.14.27',
          bookId: 'JHN',
          chapter: 14,
          verseStart: 27,
          verseEnd: 27,
        },
        content:
          'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
        versionAbbr: 'NIV',
        images: [],
      },
      history: [],
    };
    return fallback;
  })();

  return pendingPromise;
}

export interface HydratedVotd {
  entry: VotdEntry;
  book: BibleBook | null;
  chapter: number | null;
  verseStart: number | null;
  verseEnd: number | null;
  verses: VerseItem[];
  textZhCombined: string;
  textEnCombined: string;
  textEnRaw: string;
}

/**
 * Hydrate a VOTD entry with our local bilingual Chinese + Pinyin + English translations.
 */
export async function hydrateVotdEntry(
  entry: VotdEntry,
  englishTrans: TranslationId = 'NIV'
): Promise<HydratedVotd> {
  const ref = resolveVotdRef(entry);
  if (!ref) {
    return {
      entry,
      book: null,
      chapter: null,
      verseStart: null,
      verseEnd: null,
      verses: [],
      textZhCombined: '',
      textEnCombined: entry.content,
      textEnRaw: entry.content,
    };
  }

  const book = getBookById(ref.bookId) || null;
  try {
    const chap = await fetchChapter(ref.bookId, ref.chapter);
    const matchedVerses = chap.verses.filter(
      (v) => v.number >= ref.verseStart && v.number <= ref.verseEnd
    );

    if (matchedVerses.length > 0) {
      const targetEnTrans = englishTrans === 'CNVS' ? 'NIV' : englishTrans;
      const zhParts = matchedVerses.map((v) => v.textZhCnvs || v.textZh);
      const enParts = matchedVerses.map((v) => getVerseTextForTranslation(v, targetEnTrans));
      const textEnRaw = matchedVerses
        .map((v) => stripVerseMarkup(getVerseTextForTranslation(v, targetEnTrans), { stripNotes: true }))
        .join(' ');

      return {
        entry,
        book,
        chapter: ref.chapter,
        verseStart: ref.verseStart,
        verseEnd: ref.verseEnd,
        verses: matchedVerses,
        textZhCombined: zhParts.join(' '),
        textEnCombined: enParts.join(' '),
        textEnRaw: textEnRaw || entry.content,
      };
    }
  } catch (err) {
    console.warn('Failed to hydrate VOTD entry from chapter data:', err);
  }

  return {
    entry,
    book,
    chapter: ref.chapter,
    verseStart: ref.verseStart,
    verseEnd: ref.verseEnd,
    verses: [],
    textZhCombined: '',
    textEnCombined: entry.content,
    textEnRaw: entry.content,
  };
}
