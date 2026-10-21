import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import serverless API handlers directly from the /api folder
import healthHandler from './api/health.js';
import bibleHandler from './api/bible.js';
import passageHandler from './api/passage.js';
import searchHandler from './api/search.js';
import dataHandler from './api/data.js';
import indexHandler from './api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount serverless endpoints at /api/*
  app.all('/api/health', (req: Request, res: Response) => healthHandler(req, res));
  app.all('/api/bible', (req: Request, res: Response) => bibleHandler(req, res));
  app.all('/api/passage', (req: Request, res: Response) => passageHandler(req, res));
  app.all('/api/search', (req: Request, res: Response) => searchHandler(req, res));
  app.all('/api/data', (req: Request, res: Response) => dataHandler(req, res));
  app.all('/api', (req: Request, res: Response) => indexHandler(req, res));

  // Prevent stale mobile browser caching of Bible JSON data
  app.use('/bibles', (_req: Request, res: Response, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
  });

  if (!isProduction) {
    // Dev mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`Serverless health endpoint: http://0.0.0.0:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
