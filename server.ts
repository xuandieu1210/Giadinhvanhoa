import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, schema } from './src/db/index.ts';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', postgresConnected: !!db });
  });

  // Example API endpoint for communes
  app.get('/api/communes', async (req, res) => {
    try {
      if (db) {
        const result = await db.select().from(schema.communes);
        return res.json(result);
      }
      res.json([]);
    } catch (error) {
      console.error('Error fetching communes from DB:', error);
      res.status(500).json({ error: 'Failed to fetch communes' });
    }
  });

  // Vite middleware for frontend development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
