// Registro das salas públicas abertas. As salas avisam aqui quando mudam e a cada 30s (heartbeat); o que não dá sinal em 75s some da lista.
import { DurableObject } from 'cloudflare:workers';
const TTL = 75000;

export class Lobby extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.rooms = new Map(); }
  async fetch(req) {
    const url = new URL(req.url), now = Date.now();
    if (url.pathname === '/upsert' && req.method === 'POST') {
      const r = await req.json(); this.rooms.set(r.code, { ...r, ts: now }); return new Response('ok');
    }
    if (url.pathname === '/remove' && req.method === 'POST') {
      const r = await req.json(); this.rooms.delete(r.code); return new Response('ok');
    }
    for (const [k, v] of this.rooms) if (now - v.ts > TTL) this.rooms.delete(k);
    const list = [...this.rooms.values()].filter(r => r.open).sort((a, b) => b.n - a.n).slice(0, 30)
      .map(r => ({ code: r.code, host: r.host, emb: r.emb, n: r.n, max: r.max }));
    return new Response(JSON.stringify({ rooms: list }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
}
