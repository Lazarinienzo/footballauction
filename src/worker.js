// Touchdown Auction online: Worker (rotas) + Durable Objects (Room = uma sala, Lobby = lista de salas públicas)
import { Room } from './room.js';
import { Lobby } from './lobby.js';
import { Duel } from './duel.js';
export { Room, Lobby, Duel };

const CODE = /^[A-Z2-9]{4}$/;
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (path.startsWith('/ws/')) {
      const code = path.slice(4).toUpperCase();
      if (!CODE.test(code)) return json({ error: 'código inválido' }, 400);
      if (req.headers.get('Upgrade') !== 'websocket') return json({ error: 'use websocket' }, 426);
      return env.ROOM.get(env.ROOM.idFromName(code)).fetch(req);
    }
    if (path.startsWith('/wsd/')) {
      const code = path.slice(5).toUpperCase();
      if (!CODE.test(code)) return json({ error: 'código inválido' }, 400);
      if (req.headers.get('Upgrade') !== 'websocket') return json({ error: 'use websocket' }, 426);
      return env.DUEL.get(env.DUEL.idFromName(code)).fetch(req);
    }
    if (path === '/api/rooms') return env.LOBBY.get(env.LOBBY.idFromName('main')).fetch(new Request('https://lobby/list'));
    if (path === '/api/stats') return env.LOBBY.get(env.LOBBY.idFromName('main')).fetch(new Request('https://lobby/stats'));
    if (path === '/api/contact') return json({ email: env.CONTACT_EMAIL || '' });
    if (path === '/api/health') return json({ ok: true });
    return env.ASSETS.fetch(req);
  },
};
