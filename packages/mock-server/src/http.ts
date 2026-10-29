import type { IncomingMessage, ServerResponse } from 'node:http';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (what = 'Not found') => new HttpError(404, what);
export const forbidden = (what = 'You do not have access to this.') => new HttpError(403, what);
export const invalid = (what: string) => new HttpError(422, what);

export interface Req<B = unknown> {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: B;
  headers: IncomingMessage['headers'];
}

type Handler = (req: Req<any>) => unknown | Promise<unknown>;
interface Route { method: string; pattern: RegExp; keys: string[]; handler: Handler }

export class Router {
  private routes: Route[] = [];

  on(method: string, path: string, handler: Handler) {
    const keys: string[] = [];
    const pattern = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
    this.routes.push({ method, pattern, keys, handler });
    return this;
  }
  get(p: string, h: Handler) { return this.on('GET', p, h); }
  post(p: string, h: Handler) { return this.on('POST', p, h); }
  put(p: string, h: Handler) { return this.on('PUT', p, h); }
  patch(p: string, h: Handler) { return this.on('PATCH', p, h); }
  delete(p: string, h: Handler) { return this.on('DELETE', p, h); }

  async handle(req: IncomingMessage, res: ServerResponse, after: () => void) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-slate-user, x-slate-impersonator');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (method === 'OPTIONS') return void res.writeHead(204).end();
    const route = this.routes.find(r => r.method === method && r.pattern.test(url.pathname));
    try {
      if (!route) throw notFound(`No route for ${method} ${url.pathname}`);
      const m = url.pathname.match(route.pattern)!;
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1]!)]));
      const raw = await new Promise<string>(resolve => {
        let data = '';
        req.on('data', c => (data += c));
        req.on('end', () => resolve(data));
      });
      // Small latency so loading states are exercised in the UI.
      await new Promise(r => setTimeout(r, 120));
      const out = await route.handler({ method, path: url.pathname, params, query: url.searchParams, body: raw ? JSON.parse(raw) : undefined, headers: req.headers });
      if (method !== 'GET') after();
      res.writeHead(out === undefined ? 204 : 200, { 'content-type': 'application/json' }).end(out === undefined ? undefined : JSON.stringify(out));
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify({ error: (e as Error).message }));
    }
  }
}
