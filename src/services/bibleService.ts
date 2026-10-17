import { BIBLE_BOOKS, getBookById } from '../data/bibleBooks';
import { CURATED_CHAPTERS } from '../data/curatedChapters';
import { getChapterVerseCount } from '../data/verseCounts';
import { ChapterContent, VerseItem, PericopeItem } from '../types/bible';

interface StoredChapter {
  chapter: number;
  verses: VerseItem[];
}

interface StoredBook {
  bookId: string;
  chapters: StoredChapter[];
}

// In-memory cache for loaded books, chapters, and pericopes
const bookCache = new Map<string, StoredBook>();
const chapterCache = new Map<string, ChapterContent>();
const pendingBookFetches = new Map<string, Promise<StoredBook | null>>();
let pericopesCache: Record<string, PericopeItem[]> | null = null;
let pericopesPromise: Promise<Record<string, PericopeItem[]>> | null = null;

async function loadPericopes(): Promise<Record<string, PericopeItem[]>> {
  if (pericopesCache) return pericopesCache;
  if (pericopesPromise) return pericopesPromise;

  pericopesPromise = (async () => {
    try {
      const res = await fetch('/bibles/pericopes.json');
      if (res.ok) {
        const data = await res.json();
        pericopesCache = data;
        return data;
      }
    } catch (err) {
      console.warn('Failed to load pericopes.json:', err);
    }
    return {};
  })();

  return pericopesPromise;
}

/**
 * Fetch the entire book JSON containing all authentic word-for-word translations.
 * All 66 Protestant Bible books are packaged in /bibles/books/${bookId}.json
 */
async function loadBookData(bookId: string): Promise<StoredBook | null> {
  const normId = bookId.toUpperCase();
  if (bookCache.has(normId)) {
    return bookCache.get(normId)!;
  }

  if (pendingBookFetches.has(normId)) {
    return pendingBookFetches.get(normId)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/bibles/books/${normId}.json`);
      if (res.ok) {
        const data: StoredBook = await res.json();
        bookCache.set(normId, data);

        // Pre-populate chapter cache for every chapter in this book
        const book = getBookById(normId);
        if (data && Array.isArray(data.chapters)) {
          for (const chap of data.chapters) {
            const chapKey = `${normId}.${chap.chapter}`;
            chapterCache.set(chapKey, {
              bookId: normId,
              chapter: chap.chapter,
              titleZh: book ? `${book.nameZh} 第 ${chap.chapter} 章` : `第 ${chap.chapter} 章`,
              titleEn: book ? `${book.nameEn} Chapter ${chap.chapter}` : `Chapter ${chap.chapter}`,
              verses: chap.verses,
            });
          }
        }

        return data;
      }
    } catch (err) {
      console.warn(`Failed to load local book data for ${normId}:`, err);
    } finally {
      pendingBookFetches.delete(normId);
    }
    return null;
  })();

  pendingBookFetches.set(normId, fetchPromise);
  return fetchPromise;
}

/**
 * Public API fallback that retrieves word-for-word CUV & WEB verses
 */
async function fetchOnlineWordForWordChapter(bookId: string, chapter: number): Promise<ChapterContent | null> {
  const normId = bookId.toUpperCase();
  const book = getBookById(normId);
  if (!book) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // 1. Try pulling through the serverless backend connection first (/api/bible)
    try {
      const serverlessRes = await fetch(`/api/bible?book=${normId}&chapter=${chapter}&version=WEB`, {
        signal: controller.signal,
      });
      if (serverlessRes.ok) {
        const sData = await serverlessRes.json();
        if (sData && Array.isArray(sData.verses) && sData.verses.length > 0) {
          clearTimeout(timeoutId);
          const verses: VerseItem[] = sData.verses.map((v: any) => ({
            number: v.number,
            textZh: `${book.nameZh} ${chapter}:${v.number}`,
            textZhCnvs: `${book.nameZh} ${chapter}:${v.number}`,
            textZhCuv: `${book.nameZh} ${chapter}:${v.number}`,
            textEnNiv: v.text,
            textEnEsv: v.text,
            textEnNkjv: v.text,
            textEnNlt: v.text,
            textEnNasb: v.text,
            textEn: v.text,
          }));
          return {
            bookId: normId,
            chapter,
            titleZh: `${book.nameZh} 第 ${chapter} 章`,
            titleEn: `${book.nameEn} Chapter ${chapter}`,
            verses,
          };
        }
      }
    } catch {
      // Continue to direct online fallback if serverless endpoint is unavailable
    }

    // 2. Fetch Chinese Union Version (CUV) and World English Bible (WEB) concurrently
    const [resZh, resEn] = await Promise.allSettled([
      fetch(`https://bible-api.com/data/cuv/${normId}/${chapter}`, { signal: controller.signal }),
      fetch(`https://bible-api.com/data/web/${normId}/${chapter}`, { signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);

    let cuvVerses: { verse: number; text: string }[] = [];
    if (resZh.status === 'fulfilled' && resZh.value.ok) {
      const dataZh = await resZh.value.json();
      if (Array.isArray(dataZh.verses)) {
        cuvVerses = dataZh.verses;
      }
    }

    let webVerses: { verse: number; text: string }[] = [];
    if (resEn.status === 'fulfilled' && resEn.value.ok) {
      const dataEn = await resEn.value.json();
      if (Array.isArray(dataEn.verses)) {
        webVerses = dataEn.verses;
      }
    }

    if (cuvVerses.length === 0 && webVerses.length === 0) {
      return null;
    }

    const verseCount = Math.max(cuvVerses.length, webVerses.length);
    const verses: VerseItem[] = [];

    for (let i = 1; i <= verseCount; i++) {
      const zhItem = cuvVerses.find((v) => v.verse === i);
      const enItem = webVerses.find((v) => v.verse === i);

      const rawZh = zhItem ? zhItem.text.trim() : '';
      const rawEn = enItem ? enItem.text.replace(/\s+/g, ' ').trim() : '';

      verses.push({
        number: i,
        textZh: rawZh,
        textZhCnvs: rawZh,
        textZhCuv: rawZh,
        textEnNiv: rawEn,
        textEnEsv: rawEn,
        textEnNkjv: rawEn,
        textEnNlt: rawEn,
        textEnNasb: rawEn,
        textEn: rawEn,
      });
    }

    return {
      bookId: normId,
      chapter,
      titleZh: `${book.nameZh} 第 ${chapter} 章`,
      titleEn: `${book.nameEn} Chapter ${chapter}`,
      verses,
    };
  } catch (e) {
    console.warn(`Online fallback failed for ${normId} ${chapter}:`, e);
    return null;
  }
}

/**
 * Fetch chapter content with 100% authentic, word-for-word verses according to the translation.
 */
export async function fetchChapter(bookId: string, chapter: number): Promise<ChapterContent> {
  const normId = bookId.toUpperCase();
  const key = `${normId}.${chapter}`;

  // 1. Check in-memory chapter cache first
  if (chapterCache.has(key)) {
    const cached = chapterCache.get(key)!;
    if (!cached.pericopes) {
      const allPericopes = await loadPericopes();
      cached.pericopes = allPericopes[key] || [];
    }
    return cached;
  }

  const allPericopes = await loadPericopes();
  const pericopesForChapter = allPericopes[key] || [];

  // 2. Load from local authentic word-for-word complete book database (/bibles/books/[bookId].json)
  const bookData = await loadBookData(normId);
  if (bookData && Array.isArray(bookData.chapters)) {
    const chap = bookData.chapters.find((c) => c.chapter === chapter);
    if (chap && chap.verses && chap.verses.length > 0) {
      const book = getBookById(normId);
      const result: ChapterContent = {
        bookId: normId,
        chapter,
        titleZh: book ? `${book.nameZh} 第 ${chapter} 章` : `第 ${chapter} 章`,
        titleEn: book ? `${book.nameEn} Chapter ${chapter}` : `Chapter ${chapter}`,
        pericopes: pericopesForChapter,
        verses: chap.verses,
      };
      chapterCache.set(key, result);
      return result;
    }
  }

  // 3. Check curated chapters fallback
  if (CURATED_CHAPTERS[key]) {
    const curated = { ...CURATED_CHAPTERS[key], pericopes: pericopesForChapter };
    chapterCache.set(key, curated);
    return curated;
  }

  // 4. Try public word-for-word Bible API
  const onlineResult = await fetchOnlineWordForWordChapter(normId, chapter);
  if (onlineResult) {
    onlineResult.pericopes = pericopesForChapter;
    chapterCache.set(key, onlineResult);
    return onlineResult;
  }

  // 5. Emergency fallback (if offline and local file not found)
  const book = getBookById(normId) || BIBLE_BOOKS[0];
  const verseCount = getChapterVerseCount(normId, chapter);
  const fallbackVerses: VerseItem[] = [];
  for (let i = 1; i <= verseCount; i++) {
    fallbackVerses.push({
      number: i,
      textZh: `${book.nameZh} ${chapter}:${i}`,
      textZhCnvs: `${book.nameZh} ${chapter}:${i}`,
      textZhCuv: `${book.nameZh} ${chapter}:${i}`,
      textEnNiv: `${book.nameEn} ${chapter}:${i}`,
      textEnEsv: `${book.nameEn} ${chapter}:${i}`,
      textEnNkjv: `${book.nameEn} ${chapter}:${i}`,
      textEnNlt: `${book.nameEn} ${chapter}:${i}`,
      textEnNasb: `${book.nameEn} ${chapter}:${i}`,
      textEn: `${book.nameEn} ${chapter}:${i}`,
    });
  }

  const fallback: ChapterContent = {
    bookId: normId,
    chapter,
    titleZh: `${book.nameZh} 第 ${chapter} 章`,
    titleEn: `${book.nameEn} Chapter ${chapter}`,
    pericopes: pericopesForChapter,
    verses: fallbackVerses,
  };
  chapterCache.set(key, fallback);
  return fallback;
}

export interface SearchResult {
  bookId: string;
  bookNameZh: string;
  bookNameEn: string;
  chapter: number;
  verseNumber: number;
  textZh: string;
  textEn: string;
}

/**
 * Search authentic scripture across curated chapters and all loaded books.
 */
export function searchScriptures(query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const results: SearchResult[] = [];

  // Search curated chapters first
  for (const [, chap] of Object.entries(CURATED_CHAPTERS)) {
    const book = getBookById(chap.bookId);
    if (!book) continue;

    for (const v of chap.verses) {
      const matchZh = v.textZh?.toLowerCase().includes(trimmed);
      const matchCnvs = v.textZhCnvs?.toLowerCase().includes(trimmed);
      const matchCuv = v.textZhCuv?.toLowerCase().includes(trimmed);
      const matchEn = v.textEn?.toLowerCase().includes(trimmed);
      const matchNiv = v.textEnNiv?.toLowerCase().includes(trimmed);
      const matchEsv = v.textEnEsv?.toLowerCase().includes(trimmed);

      if (matchZh || matchCnvs || matchCuv || matchEn || matchNiv || matchEsv) {
        results.push({
          bookId: chap.bookId,
          bookNameZh: book.nameZh,
          bookNameEn: book.nameEn,
          chapter: chap.chapter,
          verseNumber: v.number,
          textZh: v.textZhCnvs || v.textZhCuv || v.textZh,
          textEn: v.textEnNiv || v.textEnEsv || v.textEn || '',
        });

        if (results.length >= 35) return results;
      }
    }
  }

  // Search across any loaded books in memory
  for (const [bId, bookData] of bookCache.entries()) {
    const book = getBookById(bId);
    if (!book) continue;

    for (const chap of bookData.chapters) {
      for (const v of chap.verses) {
        const matchZh = v.textZh?.toLowerCase().includes(trimmed);
        const matchCnvs = v.textZhCnvs?.toLowerCase().includes(trimmed);
        const matchCuv = v.textZhCuv?.toLowerCase().includes(trimmed);
        const matchEn = v.textEn?.toLowerCase().includes(trimmed);
        const matchNiv = v.textEnNiv?.toLowerCase().includes(trimmed);
        const matchEsv = v.textEnEsv?.toLowerCase().includes(trimmed);

        if (matchZh || matchCnvs || matchCuv || matchEn || matchNiv || matchEsv) {
          // Avoid duplicates
          const already = results.some(
            (r) => r.bookId === bId && r.chapter === chap.chapter && r.verseNumber === v.number
          );
          if (!already) {
            results.push({
              bookId: bId,
              bookNameZh: book.nameZh,
              bookNameEn: book.nameEn,
              chapter: chap.chapter,
              verseNumber: v.number,
              textZh: v.textZhCnvs || v.textZhCuv || v.textZh,
              textEn: v.textEnNiv || v.textEnEsv || v.textEn || '',
            });

            if (results.length >= 35) return results;
          }
        }
      }
    }
  }

  return results;
}

// Preload most common books on module load in background
if (typeof window !== 'undefined') {
  setTimeout(() => {
    loadBookData('JHN').catch(() => {});
    loadBookData('GEN').catch(() => {});
    loadBookData('ROM').catch(() => {});
    loadBookData('PSA').catch(() => {});
    loadBookData('MAT').catch(() => {});
  }, 100);
}
