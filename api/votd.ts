/**
 * Verse of the Day API Endpoint (sourced from https://www.bible.com/verse-of-the-day)
 * Route: /api/votd
 */

export interface ParsedUsfmRef {
  raw: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface VotdImage {
  id: number;
  url: string;
  thumbnailUrl: string;
  attribution: string;
  category: string;
}

export interface VotdEntry {
  day: string;
  dateIso?: string;
  referenceHuman: string;
  usfm: string[];
  parsedRef: ParsedUsfmRef | null;
  content: string;
  versionAbbr: string;
  versionTitle?: string;
  images: VotdImage[];
}

export interface VotdPayload {
  source: 'bible.com' | 'fallback';
  sourceUrl: string;
  fetchedAt: string;
  numericDayOfYear?: number;
  today: VotdEntry;
  history: VotdEntry[];
}

interface CacheRecord {
  dayKey: string;
  timestamp: number;
  payload: VotdPayload;
}

const votdCache = new Map<string, CacheRecord>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const FALLBACK_VERSES: Array<{ referenceHuman: string; usfm: string; content: string }> = [
  {
    referenceHuman: 'John 14:27',
    usfm: 'JHN.14.27',
    content:
      'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
  },
  {
    referenceHuman: 'John 3:16',
    usfm: 'JHN.3.16',
    content:
      'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  },
  {
    referenceHuman: 'Proverbs 3:5-6',
    usfm: 'PRO.3.5-6',
    content:
      'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  },
  {
    referenceHuman: 'Philippians 4:13',
    usfm: 'PHP.4.13',
    content: 'I can do all this through him who gives me strength.',
  },
  {
    referenceHuman: 'Psalms 23:1',
    usfm: 'PSA.23.1',
    content: 'The Lord is my shepherd, I lack nothing.',
  },
  {
    referenceHuman: 'Romans 8:28',
    usfm: 'ROM.8.28',
    content:
      'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
  },
  {
    referenceHuman: 'Isaiah 41:10',
    usfm: 'ISA.41.10',
    content:
      'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
  },
];

export function parseUsfmList(usfmList: string[] = []): ParsedUsfmRef | null {
  if (!Array.isArray(usfmList) || usfmList.length === 0) return null;

  const first = String(usfmList[0] || '').trim();
  const last = String(usfmList[usfmList.length - 1] || first).trim();

  // Handles "JHN.14.27", "PRO.3.5-6", or "PRO.3.5-PRO.3.6"
  const m1 = first.match(/^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)(?:-(\d+))?/i);
  if (!m1) return null;

  const bookId = m1[1].toUpperCase();
  const chapter = parseInt(m1[2], 10);
  const verseStart = parseInt(m1[3], 10);
  let verseEnd = m1[4] ? parseInt(m1[4], 10) : verseStart;

  if (usfmList.length > 1) {
    const mLast = last.match(/^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)/i);
    if (mLast && mLast[1].toUpperCase() === bookId && parseInt(mLast[2], 10) === chapter) {
      verseEnd = Math.max(verseEnd, parseInt(mLast[3], 10));
    }
  }

  return {
    raw: usfmList.join(','),
    bookId,
    chapter,
    verseStart,
    verseEnd: Math.max(verseStart, verseEnd),
  };
}

function normalizeImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

function extractImages(rawImages: any): VotdImage[] {
  const list = Array.isArray(rawImages)
    ? rawImages
    : Array.isArray(rawImages?.images)
    ? rawImages.images
    : [];
  if (list.length === 0) return [];
  const results: VotdImage[] = [];

  for (const img of list) {
    if (!img || !Array.isArray(img.renditions) || img.renditions.length === 0) continue;
    const large =
      img.renditions.find((r: any) => r.width === 640) ||
      img.renditions.find((r: any) => r.width >= 640) ||
      img.renditions[img.renditions.length - 1];
    const small =
      img.renditions.find((r: any) => r.width === 320) ||
      img.renditions[0];

    const url = normalizeImageUrl(large?.url);
    if (!url) continue;

    results.push({
      id: Number(img.id) || results.length + 1,
      url,
      thumbnailUrl: normalizeImageUrl(small?.url) || url,
      attribution: String(img.attribution || '© YouVersion'),
      category: String(img.category || 'verse'),
    });
  }

  return results;
}

function parseBalancedJson(str: string, startIndex: number): any | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < str.length; i++) {
    const ch = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(str.slice(startIndex, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatIsoDate(dateStr?: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}

function buildEntryFromVersesArray(
  versesArr: any[],
  dayLabel: string,
  versionAbbr: string,
  versionTitle?: string,
  images: VotdImage[] = [],
  dateIso?: string
): VotdEntry | null {
  if (!Array.isArray(versesArr) || versesArr.length === 0) return null;

  const firstRef = versesArr[0]?.reference || {};
  const allUsfm: string[] = [];
  const contents: string[] = [];

  for (const v of versesArr) {
    if (v?.reference?.usfm && Array.isArray(v.reference.usfm)) {
      allUsfm.push(...v.reference.usfm);
    }
    if (v?.content) {
      contents.push(String(v.content).trim());
    }
  }

  const referenceHuman = String(firstRef.human || '').trim();
  const content = contents.join(' ').replace(/\s+/g, ' ').trim();
  if (!referenceHuman || !content) return null;

  return {
    day: dayLabel,
    dateIso,
    referenceHuman,
    usfm: allUsfm,
    parsedRef: parseUsfmList(allUsfm),
    content,
    versionAbbr: versionAbbr || 'NIV',
    versionTitle,
    images,
  };
}

function parseVotdFromBibleComHtml(html: string): VotdPayload | null {
  // 1. Decode Next.js App Router RSC payload chunks: self.__next_f.push([1,"..."])
  const chunks: string[] = [];
  const chunkRegex = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = chunkRegex.exec(html)) !== null) {
    try {
      chunks.push(JSON.parse(m[1]));
    } catch {
      // Ignore malformed chunk
    }
  }

  const decoded = chunks.join('');
  const votdMarkerIdx = decoded.indexOf('"VOTDPage"]');
  if (votdMarkerIdx !== -1) {
    const objStart = decoded.indexOf('{"arrayOfVerses"', votdMarkerIdx);
    if (objStart !== -1) {
      const pageProps = parseBalancedJson(decoded, objStart);
      if (pageProps && Array.isArray(pageProps.verses) && pageProps.verses.length > 0) {
        const versionAbbr = String(pageProps.versionData?.abbreviation || 'NIV')
          .replace(/^NIV11$/i, 'NIV');
        const versionTitle = pageProps.versionData?.title
          ? String(pageProps.versionData.title)
          : 'New International Version';

        const todayImages = extractImages(pageProps.images);
        const todayEntry = buildEntryFromVersesArray(
          pageProps.verses,
          formatIsoDate(pageProps.date),
          versionAbbr,
          versionTitle,
          todayImages,
          pageProps.date
        );

        if (todayEntry) {
          const history: VotdEntry[] = [];
          if (Array.isArray(pageProps.arrayOfVerses)) {
            for (const item of pageProps.arrayOfVerses.slice(0, 14)) {
              const entry = buildEntryFromVersesArray(
                item?.verses,
                String(item?.day || ''),
                String(item?.local_abbreviation || item?.version?.abbreviation || versionAbbr).replace(/^NIV11$/i, 'NIV'),
                item?.local_title || item?.version?.title,
                extractImages(item?.images || item?.image)
              );
              if (entry) {
                if (
                  entry.referenceHuman === todayEntry.referenceHuman &&
                  entry.day === todayEntry.day
                ) {
                  continue;
                }
                history.push(entry);
              }
            }
          }

          return {
            source: 'bible.com',
            sourceUrl: 'https://www.bible.com/verse-of-the-day',
            fetchedAt: new Date().toISOString(),
            numericDayOfYear:
              typeof pageProps.numericDayOfYear === 'number'
                ? pageProps.numericDayOfYear
                : undefined,
            today: todayEntry,
            history,
          };
        }
      }
    }
  }

  // 2. Fallback: parse OpenGraph meta tags if Next.js RSC layout changed
  const ogDescMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
  const ogImgMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
  if (ogDescMatch) {
    const desc = decodeHtmlEntities(ogDescMatch[1]).trim();
    const refSplit = desc.match(/^([1-3]?\s*[A-Za-z]+\s+\d+:\d+(?:-\d+)?)\s+([\s\S]+)$/);
    if (refSplit) {
      const referenceHuman = refSplit[1].trim();
      const content = refSplit[2].trim();
      const imgUrl = ogImgMatch ? decodeHtmlEntities(ogImgMatch[1]) : '';
      return {
        source: 'bible.com',
        sourceUrl: 'https://www.bible.com/verse-of-the-day',
        fetchedAt: new Date().toISOString(),
        today: {
          day: formatIsoDate(),
          referenceHuman,
          usfm: [],
          parsedRef: null,
          content,
          versionAbbr: 'NIV',
          images: imgUrl
            ? [{ id: 1, url: imgUrl, thumbnailUrl: imgUrl, attribution: '© YouVersion', category: 'verse' }]
            : [],
        },
        history: [],
      };
    }
  }

  return null;
}

function getFallbackPayload(): VotdPayload {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const pick = FALLBACK_VERSES[dayOfYear % FALLBACK_VERSES.length];
  return {
    source: 'fallback',
    sourceUrl: 'https://www.bible.com/verse-of-the-day',
    fetchedAt: now.toISOString(),
    numericDayOfYear: dayOfYear,
    today: {
      day: formatIsoDate(now.toISOString()),
      dateIso: now.toISOString(),
      referenceHuman: pick.referenceHuman,
      usfm: [pick.usfm],
      parsedRef: parseUsfmList([pick.usfm]),
      content: pick.content,
      versionAbbr: 'NIV',
      images: [],
    },
    history: FALLBACK_VERSES.filter((v) => v.usfm !== pick.usfm).map((v) => ({
      day: 'Featured',
      referenceHuman: v.referenceHuman,
      usfm: [v.usfm],
      parsedRef: parseUsfmList([v.usfm]),
      content: v.content,
      versionAbbr: 'NIV',
      images: [],
    })),
  };
}

export async function getVerseOfTheDay(
  forceRefresh = false,
  requestedDay?: number
): Promise<VotdPayload> {
  const validDay =
    typeof requestedDay === 'number' &&
    Number.isInteger(requestedDay) &&
    requestedDay >= 1 &&
    requestedDay <= 366
      ? requestedDay
      : undefined;

  const utcDayKey = new Date().toISOString().slice(0, 10);
  const cacheKey = validDay ? `day-${validDay}-${utcDayKey.slice(0, 4)}` : `utc-${utcDayKey}`;
  const cached = votdCache.get(cacheKey);

  if (
    !forceRefresh &&
    cached &&
    cached.payload.source === 'bible.com' &&
    Date.now() - cached.timestamp < CACHE_TTL_MS
  ) {
    return cached.payload;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const targetUrl = validDay
      ? `https://www.bible.com/verse-of-the-day?day=${validDay}`
      : 'https://www.bible.com/verse-of-the-day';

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const parsed = parseVotdFromBibleComHtml(html);
      if (parsed) {
        votdCache.set(cacheKey, {
          dayKey: cacheKey,
          timestamp: Date.now(),
          payload: parsed,
        });
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch bible.com/verse-of-the-day:', err);
  }

  if (cached) {
    return cached.payload;
  }
  return getFallbackPayload();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  try {
    const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    const forceRefresh = url.searchParams.get('refresh') === '1';
    const dayParam = url.searchParams.get('day');
    const requestedDay = dayParam ? parseInt(dayParam, 10) : undefined;
    const payload = await getVerseOfTheDay(forceRefresh, requestedDay);

    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    res.statusCode = 200;
    res.end(JSON.stringify(getFallbackPayload()));
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get('refresh') === '1';
  const dayParam = url.searchParams.get('day');
  const requestedDay = dayParam ? parseInt(dayParam, 10) : undefined;
  const payload = await getVerseOfTheDay(forceRefresh, requestedDay);
  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
