// Mock Slate API. All three portals talk to this one process (via each Vite dev server's /api proxy),
// so a campaign booked in the advertiser portal shows up in SAC approvals and admin oversight.
// State persists to .data/db.json; POST /api/_reset or delete the file to reseed.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRoutes, createSeed } from './routes';
import type { Db } from './seed';

const PORT = Number(process.env.SLATE_API_PORT ?? 4100);
const FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../.data/db.json');
const fresh = process.argv.includes('--fresh');

const state: { db: Db } = { db: !fresh && existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : createSeed() };
const persist = () => {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(state.db));
};
persist();

const router = buildRoutes(state, () => { state.db = createSeed(); });
createServer((req, res) => router.handle(req, res, persist)).listen(PORT, () => {
  console.log(`Slate mock API on http://localhost:${PORT} (${fresh ? 'fresh seed' : FILE})`);
});
