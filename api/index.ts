/**
 * API Index & Documentation
 * Route: /api
 */

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const documentation = {
    name: 'Bible Reader Serverless API',
    description: 'Serverless data endpoints for retrieving scripture translations, chapter texts, passages, and health checks.',
    authentication: 'Environment-based (keys read securely on server from BIBLE_API_KEY, ESV_API_KEY, API_KEY; no keys required in client requests)',
    endpoints: [
      {
        path: '/api/health',
        method: 'GET',
        description: 'Server health check, runtime status, and configured API keys check',
        example: '/api/health',
      },
      {
        path: '/api/bible',
        method: 'GET',
        description: 'Pull scripture chapter data with verse numbers and text',
        parameters: {
          book: 'Standard 3-letter Bible book code (e.g. JHN, GEN, PSA, MAT, ROM)',
          chapter: 'Chapter number (e.g. 1, 3, 23)',
          version: 'Translation code (e.g. NIV, ESV, CUV, CNVS, WEB)',
        },
        example: '/api/bible?book=JHN&chapter=3&version=WEB',
      },
      {
        path: '/api/passage',
        method: 'GET',
        description: 'Pull specific scripture passage or verse range',
        parameters: {
          ref: 'Passage reference string (e.g. "John 3:16", "Psalm 23:1-6")',
          version: 'Translation code (e.g. ESV, WEB, CUV)',
        },
        example: '/api/passage?ref=John+3:16&version=WEB',
      },
      {
        path: '/api/search',
        method: 'GET',
        description: 'Search scriptures by keyword or phrase',
        parameters: {
          q: 'Search query string',
          limit: 'Max results count (default 25)',
        },
        example: '/api/search?q=grace&limit=10',
      },
      {
        path: '/api/data',
        method: 'GET / POST',
        description: 'Proxy connector to upstream Bible API endpoints using server-side credentials',
        parameters: {
          endpoint: 'Upstream API relative path or target URL',
        },
        example: '/api/data?endpoint=data/web/JHN/1',
      },
    ],
  };

  res.statusCode = 200;
  res.end(JSON.stringify(documentation, null, 2));
}

export async function GET() {
  return new Response(JSON.stringify({
    name: 'Bible Reader Serverless API',
    endpoints: ['/api/health', '/api/bible', '/api/passage', '/api/search', '/api/data'],
  }, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
