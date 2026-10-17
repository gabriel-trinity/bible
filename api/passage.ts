/**
 * Serverless Passage Pull Endpoint
 * Route: /api/passage?ref=John+3:16&version=ESV
 */

interface VerseItem {
  bookId?: string;
  chapter: number;
  verse: number;
  text: string;
}

interface PassageResponse {
  reference: string;
  translation: string;
  text: string;
  verses: VerseItem[];
  source: string;
}

export default async function handler(req: any, res: any) {
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
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const query = req.query || {};
  const ref = String(query.ref || query.passage || 'John 3:16').trim();
  const version = String(query.version || 'WEB').trim().toUpperCase();

  try {
    const data = await fetchPassageData(ref, version);
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err: any) {
    res.statusCode = 502;
    res.end(JSON.stringify({
      error: 'Failed to pull passage data',
      message: err.message,
      reference: ref,
      version,
    }));
  }
}

async function fetchPassageData(ref: string, version: string): Promise<PassageResponse> {
  const esvKey = (process.env.ESV_API_KEY || '').trim();
  const bibleApiKey = (process.env.BIBLE_API_KEY || process.env.API_KEY || '').trim();
  const customBaseUrl = (process.env.BIBLE_API_BASE_URL || '').trim();

  // 1. If ESV version requested and ESV API key configured
  if (version === 'ESV' && esvKey) {
    const esvUrl = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(ref)}&include-passage-references=false&include-verse-numbers=true&include-first-verse-numbers=true&include-footnotes=false&include-headings=false`;
    const resp = await fetch(esvUrl, {
      headers: {
        'Authorization': `Token ${esvKey}`,
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      const rawPassages = data.passages || [];
      const text = rawPassages.join('\n\n').trim();
      return {
        reference: data.query || ref,
        translation: 'ESV',
        text,
        verses: [
          {
            chapter: 1,
            verse: 1,
            text,
          },
        ],
        source: 'api.esv.org',
      };
    }
  }

  // 2. If custom base URL is configured
  if (customBaseUrl) {
    const customUrl = `${customBaseUrl.replace(/\/$/, '')}/passage?ref=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (bibleApiKey) {
      headers['Authorization'] = `Bearer ${bibleApiKey}`;
      headers['api-key'] = bibleApiKey;
    }

    const resp = await fetch(customUrl, { headers });
    if (resp.ok) {
      const data = await resp.json();
      return {
        reference: data.reference || ref,
        translation: version,
        text: data.text || '',
        verses: data.verses || [],
        source: 'custom-upstream',
      };
    }
  }

  // 3. Fallback: Public Bible-API
  const publicUrl = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version.toLowerCase()}`;
  const response = await fetch(publicUrl);

  if (!response.ok) {
    // Retry with WEB fallback
    const fallbackRes = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
    if (!fallbackRes.ok) {
      throw new Error(`Upstream returned ${response.status} for reference "${ref}"`);
    }
    const fbData = await fallbackRes.json();
    return {
      reference: fbData.reference || ref,
      translation: 'WEB',
      text: fbData.text || '',
      verses: (fbData.verses || []).map((v: any) => ({
        bookId: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: (v.text || '').trim(),
      })),
      source: 'bible-api-fallback',
    };
  }

  const data = await response.json();
  return {
    reference: data.reference || ref,
    translation: data.translation_id?.toUpperCase() || version,
    text: data.text || '',
    verses: (data.verses || []).map((v: any) => ({
      bookId: v.book_id,
      chapter: v.chapter,
      verse: v.verse,
      text: (v.text || '').trim(),
    })),
    source: 'bible-api',
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = String(url.searchParams.get('ref') || url.searchParams.get('passage') || 'John 3:16').trim();
  const version = String(url.searchParams.get('version') || 'WEB').trim().toUpperCase();

  try {
    const data = await fetchPassageData(ref, version);
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
