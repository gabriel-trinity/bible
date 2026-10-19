/**
 * Serverless Health Check Endpoint
 * Route: /api/health
 */
import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'healthy' | 'degraded';
  uptime: number;
  timestamp: string;
  environment: string;
  service: string;
  configuredApiKeys: {
    BIBLE_API_KEY: boolean;
    BIBLE_API_BASE_URL: boolean;
    ESV_API_KEY: boolean;
    API_KEY: boolean;
  };
  availableEndpoints: string[];
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.statusCode = 204;
    res.end();
    return;
  }

  // Set CORS and response headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed', message: 'Only GET and HEAD requests are supported.' }));
    return;
  }

  const responseData: HealthResponse = {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'Bible Reader Serverless API',
    configuredApiKeys: {
      BIBLE_API_KEY: Boolean(process.env.BIBLE_API_KEY && process.env.BIBLE_API_KEY.trim().length > 0),
      BIBLE_API_BASE_URL: Boolean(process.env.BIBLE_API_BASE_URL && process.env.BIBLE_API_BASE_URL.trim().length > 0),
      ESV_API_KEY: Boolean(process.env.ESV_API_KEY && process.env.ESV_API_KEY.trim().length > 0),
      API_KEY: Boolean(process.env.API_KEY && process.env.API_KEY.trim().length > 0),
    },
    availableEndpoints: [
      '/api/health',
      '/api/bible?book={BOOK}&chapter={NUM}&version={VER}',
      '/api/passage?ref={REF}&version={VER}',
      '/api/search?q={QUERY}&limit={NUM}',
      '/api/data?endpoint={PATH}',
    ],
  };

  res.statusCode = 200;
  res.end(JSON.stringify(responseData, null, 2));
}

// Support Web Fetch API standard handler for Edge runtime
export async function GET() {
  const data: HealthResponse = {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'Bible Reader Serverless API',
    configuredApiKeys: {
      BIBLE_API_KEY: Boolean(process.env.BIBLE_API_KEY && process.env.BIBLE_API_KEY.trim().length > 0),
      BIBLE_API_BASE_URL: Boolean(process.env.BIBLE_API_BASE_URL && process.env.BIBLE_API_BASE_URL.trim().length > 0),
      ESV_API_KEY: Boolean(process.env.ESV_API_KEY && process.env.ESV_API_KEY.trim().length > 0),
      API_KEY: Boolean(process.env.API_KEY && process.env.API_KEY.trim().length > 0),
    },
    availableEndpoints: [
      '/api/health',
      '/api/bible?book={BOOK}&chapter={NUM}&version={VER}',
      '/api/passage?ref={REF}&version={VER}',
      '/api/search?q={QUERY}&limit={NUM}',
      '/api/data?endpoint={PATH}',
    ],
  };

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
