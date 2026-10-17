/**
 * Generic Serverless Data Connector
 * Route: /api/data?endpoint=/v1/bibles
 * Securely proxies calls to configured upstream Bible APIs with server-side keys
 */

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.statusCode = 204;
    res.end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const query = req.query || {};
  const endpoint = String(query.endpoint || '').trim();

  if (!endpoint) {
    res.statusCode = 400;
    res.end(JSON.stringify({
      error: 'Missing endpoint parameter',
      message: 'Provide ?endpoint=/path/to/resource to query configured upstream API.',
    }));
    return;
  }

  // Safety check: endpoint must not attempt SSRF against localhost or local network
  if (endpoint.includes('127.0.0.1') || endpoint.includes('localhost') || endpoint.includes('169.254.')) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden', message: 'Invalid target endpoint' }));
    return;
  }

  const apiKey = (process.env.BIBLE_API_KEY || process.env.API_KEY || '').trim();
  const baseUrl = (process.env.BIBLE_API_BASE_URL || 'https://bible-api.com').trim();

  let targetUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['api-key'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(targetUrl, {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers,
      body: req.method === 'POST' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.statusCode = response.status;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.end(data);
  } catch (err: any) {
    res.statusCode = 502;
    res.end(JSON.stringify({
      error: 'Upstream Fetch Failed',
      message: err.message,
      targetUrl,
    }));
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const endpoint = String(url.searchParams.get('endpoint') || '').trim();

  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Missing endpoint parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const apiKey = (process.env.BIBLE_API_KEY || process.env.API_KEY || '').trim();
  const baseUrl = (process.env.BIBLE_API_BASE_URL || 'https://bible-api.com').trim();

  const targetUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) {
      headers['api-key'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const resp = await fetch(targetUrl, { headers });
    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Fetch failed', message: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
