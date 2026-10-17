/**
 * Serverless Scripture Search Endpoint
 * Route: /api/search?q=faith&limit=25
 */

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
  const q = String(query.q || query.query || '').trim();
  const limit = Math.min(Math.max(parseInt(String(query.limit || '25'), 10), 1), 100);

  if (!q) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Query parameter "q" is required.' }));
    return;
  }

  try {
    const results = await performSearch(q, limit);
    res.statusCode = 200;
    res.end(JSON.stringify(results));
  } catch (err: any) {
    res.statusCode = 502;
    res.end(JSON.stringify({
      error: 'Search failed',
      message: err.message,
      query: q,
    }));
  }
}

async function performSearch(q: string, limit: number) {
  const bibleApiKey = (process.env.BIBLE_API_KEY || process.env.API_KEY || '').trim();
  const customBaseUrl = (process.env.BIBLE_API_BASE_URL || '').trim();

  // 1. If custom upstream API with search is available
  if (customBaseUrl) {
    const searchUrl = `${customBaseUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (bibleApiKey) {
      headers['api-key'] = bibleApiKey;
      headers['Authorization'] = `Bearer ${bibleApiKey}`;
    }

    const resp = await fetch(searchUrl, { headers });
    if (resp.ok) {
      const data = await resp.json();
      return {
        query: q,
        total: (data.results || []).length,
        results: data.results || data.data || [],
        source: 'custom-upstream',
      };
    }
  }

  // 2. Default upstream search proxy
  return {
    query: q,
    message: 'To enable full external remote search, provide BIBLE_API_BASE_URL and BIBLE_API_KEY in your environment.',
    total: 0,
    results: [],
    source: 'local-gateway',
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get('q') || url.searchParams.get('query') || '').trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25', 10), 1), 100);

  if (!q) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const results = await performSearch(q, limit);
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
