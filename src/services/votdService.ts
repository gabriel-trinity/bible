import { BIBLE_BOOKS, getBookById } from '../data/bibleBooks';
import { getVerseTextForTranslation } from '../data/curatedChapters';
import { fetchChapter } from './bibleService';
import { stripVerseMarkup } from './pinyinService';
import { BibleBook, TranslationId, VerseItem, VotdData, VotdEntry, VotdParsedRef } from '../types/bible';

const CLIENT_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let cachedVotd: VotdData | null = null;
let cachedDayKey: string | null = null;
let cachedAt: number = 0;
let pendingPromise: Promise<VotdData> | null = null;
let pendingRequestId: number = 0;

export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getLocalDayOfYear(d: Date = new Date()): number {
  const startUtc = Date.UTC(d.getFullYear(), 0, 0);
  const currentUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(1, Math.min(366, Math.floor((currentUtc - startUtc) / 86_400_000)));
}

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
  const now = new Date();
  const localDayKey = getLocalDateKey(now);
  const localDayOfYear = getLocalDayOfYear(now);

  const cacheValid =
    !forceRefresh &&
    cachedVotd &&
    cachedVotd.source === 'bible.com' &&
    cachedDayKey === localDayKey &&
    Date.now() - cachedAt < CLIENT_CACHE_TTL_MS;

  if (cacheValid && cachedVotd) {
    return cachedVotd;
  }

  if (!forceRefresh && pendingPromise) {
    return pendingPromise;
  }

  const requestId = ++pendingRequestId;
  const requestPromise = (async () => {
    try {
      const params = new URLSearchParams();
      params.set('day', String(localDayOfYear));
      if (forceRefresh) {
        params.set('refresh', '1');
        params.set('_t', String(Date.now()));
      }
      const res = await fetch(`/api/votd?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data: VotdData = await res.json();
        if (data.source === 'bible.com') {
          cachedVotd = data;
          cachedDayKey = localDayKey;
          cachedAt = Date.now();
        }
        return data;
      }
    } catch (err) {
      console.warn('Failed to load /api/votd:', err);
    } finally {
      if (pendingRequestId === requestId) {
        pendingPromise = null;
      }
    }

    if (cachedVotd && cachedDayKey === localDayKey) {
      return cachedVotd;
    }

    // Client-side emergency fallback if API is unreachable
    const fallback: VotdData = {
      source: 'fallback',
      sourceUrl: 'https://www.bible.com/verse-of-the-day',
      fetchedAt: now.toISOString(),
      today: {
        day: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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

  pendingPromise = requestPromise;
  return requestPromise;
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
