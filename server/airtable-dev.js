import { loadEnv } from 'vite';
import handler from '../api/airtable.js';

// Run the same read API inside Vite for Bolt/local preview, without publishing
// AIRTABLE_API_KEY to browser code. Production uses the Vercel function.
export default function airtableDev() {
  return {
    name: 'swift-lore-airtable-dev',
    apply: 'serve',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, 'AIRTABLE_');
      if (!process.env.AIRTABLE_API_KEY && env.AIRTABLE_API_KEY) {
        process.env.AIRTABLE_API_KEY = env.AIRTABLE_API_KEY;
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/api/airtable') return next();
        handler(req, res).catch(next);
      });
    },
  };
}
