// Mock Slate API. All three portals talk to this one process (via each Vite dev server's /api proxy),
// so a campaign booked in the advertiser portal shows up in SAC approvals and admin oversight.
// State persists to .data/db.json; POST /api/_reset or delete the file to reseed.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRoutes, createSeed } from './routes';
import { DB_SCHEMA, type Db } from './seed';

const PORT = Number(process.env.SLATE_API_PORT ?? 4100);
const FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../.data', PORT === 4100 ? 'db.json' : `db-${PORT}.json`);
const fresh = process.argv.includes('--fresh');

const load = (): Db => {
  if (fresh || !existsSync(FILE)) return createSeed();
  const saved = JSON.parse(readFileSync(FILE, 'utf8')) as Partial<Db>;
  if (saved.schema === DB_SCHEMA) return saved as Db;
  // Data from an older version lacks fields the rules depend on (e.g. screen-to-SAC mapping); start over.
  console.warn(`Mock data in ${FILE} is schema ${saved.schema ?? 1}, expected ${DB_SCHEMA}: reseeding.`);
  return createSeed();
};
const state: { db: Db } = { db: load() };
const persist = () => {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(state.db));
};
persist();

const router = buildRoutes(state, () => { state.db = createSeed(); });
createServer((req, res) => router.handle(req, res, persist)).listen(PORT, () => {
  console.log(`Slate mock API on http://localhost:${PORT} (${fresh ? 'fresh seed' : FILE})`);
});
