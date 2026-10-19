/**
 * Serverless Bible Chapter Data Endpoint
 * Route: /api/bible?book=JHN&chapter=1&version=NIV
 */

interface VerseOutput {
  number: number;
  text: string;
  translation?: string;
}

interface BibleChapterResponse {
  book: string;
  chapter: number;
  version: string;
  source: string;
  verses: VerseOutput[];
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.statusCode = 204;
    res.end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed', message: 'Only GET requests are supported.' }));
    return;
  }

  // Parse query parameters
  const query = req.query || {};
  const book = String(query.book || 'JHN').trim().toUpperCase();
  const chapter = parseInt(String(query.chapter || '1'), 10);
  const version = String(query.version || 'WEB').trim().toUpperCase();

  if (isNaN(chapter) || chapter < 1) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Bad Request', message: 'Chapter must be a positive integer.' }));
    return;
  }

  try {
    const data = await fetchBibleData(book, chapter, version);
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err: any) {
    res.statusCode = 502;
    res.end(JSON.stringify({
      error: 'Upstream Fetch Failed',
      message: err.message || 'Failed to pull data from Bible service',
      book,
      chapter,
      version,
    }));
  }
}

// Fetch helper logic
async function fetchBibleData(book: string, chapter: number, version: string): Promise<BibleChapterResponse> {
  const apiKey = (process.env.BIBLE_API_KEY || process.env.API_KEY || '').trim();
  const baseUrl = (process.env.BIBLE_API_BASE_URL || '').trim();

  // 1. If user provided a custom base URL endpoint (e.g. API.Bible or custom microservice)
  if (baseUrl) {
    const url = `${baseUrl.replace(/\/$/, '')}/data/${version.toLowerCase()}/${book}/${chapter}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['api-key'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, { headers });
    if (response.ok) {
      const json = await response.json();
      const rawVerses = Array.isArray(json.verses) ? json.verses : (json.data || []);
      const verses: VerseOutput[] = rawVerses.map((v: any, idx: number) => ({
        number: typeof v.verse === 'number' ? v.verse : (v.number || idx + 1),
        text: (v.text || v.content || '').trim(),
        translation: version,
      }));

      return {
        book,
        chapter,
        version,
        source: 'custom-upstream',
        verses,
      };
    }
  }

  // 2. Default upstream connector (Public Bible API)
  const normVersion = version.toLowerCase();
  const targetUrl = `https://bible-api.com/data/${normVersion}/${book}/${chapter}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (apiKey) {
    headers['api-key'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(targetUrl, { headers });
  if (!response.ok) {
    // If specific version is not found, try fallback to web or cuv
    const fallbackVersion = normVersion.includes('zh') || normVersion === 'cuv' || normVersion === 'cnvs' ? 'cuv' : 'web';
    const fallbackUrl = `https://bible-api.com/data/${fallbackVersion}/${book}/${chapter}`;
    const fallbackRes = await fetch(fallbackUrl);
    if (!fallbackRes.ok) {
      throw new Error(`Upstream returned ${response.status} for ${book} ${chapter} (${version})`);
    }
    const fallbackJson = await fallbackRes.json();
    const verses: VerseOutput[] = (fallbackJson.verses || []).map((v: any) => ({
      number: v.verse,
      text: (v.text || '').trim(),
      translation: fallbackVersion.toUpperCase(),
    }));

    return {
      book,
      chapter,
      version: fallbackVersion.toUpperCase(),
      source: 'bible-api-fallback',
      verses,
    };
  }

  const data = await response.json();
  const verses: VerseOutput[] = (data.verses || []).map((v: any) => ({
    number: v.verse,
    text: (v.text || '').trim(),
    translation: version,
  }));

  return {
    book,
    chapter,
    version,
    source: 'bible-api',
    verses,
  };
}

// Web Fetch API standard handler
export async function GET(request: Request) {
  const url = new URL(request.url);
  const book = String(url.searchParams.get('book') || 'JHN').trim().toUpperCase();
  const chapter = parseInt(url.searchParams.get('chapter') || '1', 10);
  const version = String(url.searchParams.get('version') || 'WEB').trim().toUpperCase();

  try {
    const data = await fetchBibleData(book, chapter, version);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Fetch Failed', message: err.message }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
