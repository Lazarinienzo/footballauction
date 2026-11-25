// Registro das salas públicas abertas. As salas avisam aqui quando mudam e a cada 30s (heartbeat); o que não dá sinal em 75s some da lista.
import { DurableObject } from 'cloudflare:workers';
const TTL = 75000;
const dayKey = t => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);   // dia no horário de Brasília

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
    if (url.pathname === '/stat' && req.method === 'POST') {          // contadores diários agregados (sem IP, sem identificar ninguém)
      const { k, n } = await req.json(); if (!['rooms', 'joins', 'games', 'players', 'done'].includes(k)) return new Response('bad', { status: 400 });
      const key = 'd:' + dayKey(now), cur = (await this.ctx.storage.get(key)) || {}; cur[k] = (cur[k] || 0) + (Math.min(8, n | 0) || 1);
      await this.ctx.storage.put(key, cur); return new Response('ok');
    }
    if (url.pathname === '/stats') {
      const all = await this.ctx.storage.list({ prefix: 'd:', reverse: true, limit: 30 });
      const days = [...all.entries()].map(([k, v]) => ({ day: k.slice(2), rooms: 0, joins: 0, games: 0, players: 0, done: 0, ...v }));
      return new Response(JSON.stringify({ days, openPublicRooms: [...this.rooms.values()].filter(r => r.open && now - r.ts <= TTL).length }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    }
    for (const [k, v] of this.rooms) if (now - v.ts > TTL) this.rooms.delete(k);
    const list = [...this.rooms.values()].filter(r => r.open).sort((a, b) => b.n - a.n).slice(0, 30)
      .map(r => ({ code: r.code, host: r.host, auto: r.auto, emb: r.emb, n: r.n, max: r.max, lock: !!r.lock }));
    return new Response(JSON.stringify({ rooms: list }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
}
