// Uma sala de Duelo (1 contra 1): cartas viradas, posição por posição. O servidor manda; cada jogador só recebe as cartas que já foram viradas.
import { DurableObject } from 'cloudflare:workers';
import { DB, Duelo, DU_TURN_MS, DU_EXTRA } from './engine.js';

const EMB_N = 32, AWAY_MS = 12000, NEXT_MS = 700;
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 44);
const seedNow = () => (Math.random() * 2 ** 32) >>> 0;

export class Duel extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.conns = new Set(); this.timers = []; this.init(); }
  init() { Object.assign(this, { created: false, phase: 'wait', seats: [], show: false, G: null, seed: 0, deadline: 0, code: '', active: Date.now(), emptyAt: 0, again: new Set() }); }

  async fetch(req) {
    this.code = new URL(req.url).pathname.split('/').pop().toUpperCase();
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    server.accept();
    const c = { ws: server, seat: null, n: 0, win: Date.now() };
    this.conns.add(c);
    server.addEventListener('message', e => { try { this.onMsg(c, e.data); } catch (err) { this.send(c, { t: 'err', code: 'bug', msg: String(err && err.message || err) }); } });
    server.addEventListener('close', () => this.onClose(c));
    server.addEventListener('error', () => this.onClose(c));
    return new Response(null, { status: 101, webSocket: client });
  }
  send(c, o) { try { c.ws.send(JSON.stringify(o)); } catch (e) { } }
  idx(s) { return this.seats.indexOf(s); }
  onClose(c) { if (!this.conns.delete(c)) return; const s = c.seat; if (!s || s.c !== c) return; s.c = null; s.awayAt = Date.now(); if (this.phase === 'wait') this.pushWait(); else this.pushAll(); }

  onMsg(c, raw) {
    if (typeof raw !== 'string' || raw.length > 2000) return;
    const now = Date.now(); if (now - c.win > 1000) { c.win = now; c.n = 0; } if (++c.n > 30) return;
    const m = JSON.parse(raw); this.active = now;
    if (m.t === 'join') return this.join(c, m);
    const s = c.seat; if (!s) return;
    switch (m.t) {
      case 'ping': return this.send(c, { t: 'pong' });
      case 'leave': return this.leave(s);
      case 'opt': if (this.phase === 'wait' && this.idx(s) === 0) { this.show = !!m.show; this.pushWait(); } return;
      case 'start': if (this.phase === 'wait' && this.idx(s) === 0 && this.seats.length === 2) this.begin(); return;
      case 'again': if (this.phase === 'done') { this.again.add(this.idx(s)); if (this.again.size >= 2 || this.seats.some(x => !x.c)) { this.begin(); } else this.pushAll(); } return;
      case 'flip': case 'pick': case 'ok': return this.play(s, m);
    }
  }

  join(c, m) {
    if (c.seat) return;
    if (this.phase === 'closed') this.init();
    const tok = String(m.tok || '').slice(0, 64); if (tok.length < 8) return this.send(c, { t: 'err', code: 'tok' });
    let s = this.seats.find(x => x.tok === tok);
    if (!this.created) {
      if (!m.create) return this.send(c, { t: 'err', code: 'none' });
      this.created = true; this.show = !!m.show; this.startHousekeeping();
    } else if (m.create && !s) return this.send(c, { t: 'err', code: 'exists' });
    if (s) {
      if (s.c && s.c !== c) { s.c.seat = null; try { s.c.ws.close(1000, 'outra aba'); } catch (e) { } this.conns.delete(s.c); }
      s.c = c; s.awayAt = 0; c.seat = s;
    } else {
      if (this.phase !== 'wait') return this.send(c, { t: 'err', code: 'started' });
      if (this.seats.length >= 2) return this.send(c, { t: 'err', code: 'full' });
      let emb = Number.isInteger(m.emb) && m.emb >= 0 && m.emb < EMB_N ? m.emb : 0;
      if (this.seats.some(x => x.emb === emb)) emb = [...Array(EMB_N).keys()].find(e => !this.seats.some(x => x.emb === e));
      s = { tok, name: clean(m.name), emb, c, awayAt: 0 }; this.seats.push(s); c.seat = s;
    }
    this.active = Date.now();
    if (this.phase === 'wait') this.pushWait(); else this.pushAll();
  }
  leave(s) {
    if (this.phase === 'wait') {
      this.seats = this.seats.filter(x => x !== s); if (s.c) { s.c.seat = null; try { s.c.ws.close(1000, 'saiu'); } catch (e) { } this.conns.delete(s.c); }
      if (!this.seats.length) return this.close('vazia'); this.pushWait();
    } else { s.awayAt = Date.now() - AWAY_MS; if (s.c) { s.c.seat = null; try { s.c.ws.close(1000, 'saiu'); } catch (e) { } this.conns.delete(s.c); s.c = null; } this.pushAll(); }
  }

  info() { return this.seats.map(s => ({ name: s.name, emb: s.emb, on: !!s.c })); }
  pushWait() { for (const c of this.conns) if (c.seat) this.send(c, { t: 'dwait', code: this.code, show: this.show, host: this.idx(c.seat) === 0, you: this.idx(c.seat), seats: this.info() }); }
  begin() {
    this.G = new Duelo(DB, { show: this.show, first: Math.random() < .5 ? 0 : 1 }); this.phase = 'play'; this.again = new Set(); this.seed = seedNow();
    this.seats.forEach(s => { s.awayAt = s.c ? 0 : Date.now(); }); this.turn(DU_EXTRA.first); this.pushAll();
  }
  turn(extra) { this.deadline = Date.now() + DU_TURN_MS + (extra || 0); }
  extra(r, cur) { const G = this.G; return G.r !== r ? DU_EXTRA.round : G.cur !== cur ? DU_EXTRA.swap : 0; }
  view(c) {
    const p = this.idx(c.seat), G = this.G;
    return { t: 'd', you: p, ph: this.phase, code: this.code, ...G.view(p), left: Math.max(0, this.deadline - Date.now()), seed: G.done ? this.seed : null, seats: this.info(), again: [...this.again] };
  }
  pushAll() { if (!this.G) return this.pushWait(); for (const c of this.conns) if (c.seat) this.send(c, this.view(c)); }
  play(s, m) {
    if (this.phase !== 'play') return;
    const G = this.G, p = this.idx(s), cur = G.cur, r = G.r;
    const ok = m.t === 'flip' ? G.flip(p, m.i) : m.t === 'pick' ? G.pick(p, m.i) : G.confirm(p);
    if (!ok) { const c = s.c; if (c) this.send(c, this.view(c)); return; }
    const x = this.extra(r, cur); if (x) this.turn(x);
    this.afterMove();
  }
  afterMove() {
    if (this.G.done) { this.phase = 'done'; this.seed = seedNow(); }
    this.pushAll();
  }
  step() {
    if (this.phase !== 'play') return;
    const G = this.G, now = Date.now(), cur = G.cur, s = this.seats[cur], gone = s && !s.c && now - s.awayAt > AWAY_MS;
    if (now >= this.deadline || gone) { const r = G.r; G.auto(cur); this.turn(this.extra(r, cur)); if (gone) this.deadline = now + 1500; this.afterMove(); }
  }
  startHousekeeping() {
    this.timers.push(setInterval(() => this.step(), 500));
    this.timers.push(setInterval(() => {
      const now = Date.now(), live = this.seats.some(s => s.c);
      if (live) this.emptyAt = 0; else if (!this.emptyAt) this.emptyAt = now;
      const idle = now - this.active, empty = this.emptyAt && now - this.emptyAt;
      if ((this.phase === 'wait' && (idle > 30 * 60000 || empty > 20000)) || (this.phase === 'play' && empty > 5 * 60000) || (this.phase === 'done' && (idle > 30 * 60000 || empty > 5 * 60000))) this.close('inativa');
    }, 5000));
  }
  close(why) {
    if (this.phase === 'closed') return; this.phase = 'closed';
    this.timers.forEach(clearInterval); this.timers = [];
    for (const c of this.conns) { this.send(c, { t: 'closed', why }); try { c.ws.close(1000, why); } catch (e) { } }
    this.conns.clear(); this.seats = []; this.G = null; this.created = false;
  }
}
