// Uma sala do Touchdown Auction. O leilão roda aqui (servidor manda), os clientes só mostram e mandam lance/passar.
import { DurableObject } from 'cloudflare:workers';
import { DB, BUDGET, Auction, newBot, finishTeam, MIN_TEAMS, POS_ORDER, SLOTS } from './engine.js';

const MAX_SEATS = 8, EMB_N = 32, HOLD_MS = 3500, AWAY_BOT_MS = 12000, LOBBY_AWAY_MS = 25000;
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 44);
const seedNow = () => (Math.random() * 2 ** 32) >>> 0;

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.conns = new Set(); this.timers = [];
    this.init();
  }
  init() {
    Object.assign(this, { created: false, pub: false, pw: '', phase: 'lobby', seats: [], uid: 0, A: null, teams: null, seed: null, cseed: null, rd: 0, roundAt: 0, seasonOn: false, code: '', sentV: -1, lastSync: 0, hold: 0, key: '', active: Date.now(), emptyAt: 0, lastReg: 0 });
  }

  async fetch(req) {
    this.code = new URL(req.url).pathname.slice(4).toUpperCase();
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    server.accept();
    const c = { ws: server, seat: null, n: 0, win: Date.now() };
    this.conns.add(c);
    server.addEventListener('message', e => { try { this.onMsg(c, e.data); } catch (err) { this.send(c, { t: 'err', code: 'bug', msg: String(err && err.message || err) }); } });
    server.addEventListener('close', () => this.onClose(c));
    server.addEventListener('error', () => this.onClose(c));
    return new Response(null, { status: 101, webSocket: client });
  }

  // ---------- util ----------
  send(c, o) { try { c.ws.send(JSON.stringify(o)); } catch (e) { } }
  all(o) { const m = JSON.stringify(o); for (const c of this.conns) if (c.seat) try { c.ws.send(m); } catch (e) { } }
  seatOf(uid) { return this.seats.find(s => s.uid === uid); }
  humans() { return this.seats.filter(s => s.kind === 'human'); }
  host() { return this.seats.find(s => s.host); }
  freeEmb() { const t = new Set(this.seats.map(s => s.emb)), f = []; for (let i = 0; i < EMB_N; i++) if (!t.has(i)) f.push(i); return f[Math.floor(Math.random() * f.length)]; }
  validEmb(e) { return Number.isInteger(e) && e >= 0 && e < EMB_N && !this.seats.some(s => s.emb === e); }

  // ---------- conexão ----------
  onClose(c) {
    if (!this.conns.delete(c)) return;
    const s = c.seat; if (!s || s.c !== c) return;
    s.c = null; s.awayAt = Date.now();
    if (this.phase === 'lobby') this.pushLobby();
  }
  onMsg(c, raw) {
    if (typeof raw !== 'string' || raw.length > 4000) return;
    const now = Date.now(); if (now - c.win > 1000) { c.win = now; c.n = 0; } if (++c.n > 40) return;
    const m = JSON.parse(raw); this.active = now;
    if (m.t === 'join') return this.join(c, m);
    const s = c.seat; if (!s) return;
    switch (m.t) {
      case 'ping': return this.send(c, { t: 'pong' });
      case 'leave': return this.leave(s);
      case 'bid': case 'pass': return this.play(c, s, m);
      case 'ord': return this.order(s, m);
    }
    if (this.phase === 'lobby') this.lobbyMsg(c, s, m);
    else if (this.phase === 'done' && m.t === 'reseason' && s.host) { this.seed = seedNow(); this.rd = 0; this.roundAt = 0; this.seasonOn = true; this.all({ t: 'season', seed: this.seed }); }
    else if (this.phase === 'done' && m.t === 'round' && s.host) { const n = m.n | 0; if (this.seasonOn && n === (this.rd | 0)) { this.rd = n + 1; this.roundAt = Date.now(); this.all({ t: 'round', n }); } }
  }

  join(c, m) {
    if (c.seat) return;
    if (this.phase === 'closed') this.init();
    const tok = String(m.tok || '').slice(0, 64); if (tok.length < 8) return this.send(c, { t: 'err', code: 'tok' });
    let s = this.seats.find(x => x.tok === tok);
    if (!this.created) {
      if (!m.create) return this.send(c, { t: 'err', code: 'none' });
      this.created = true; this.stat('rooms'); this.pub = !!m.pub; this.pw = String(m.pw || '').slice(0, 24); this.startHousekeeping();
    } else if (m.create && !s) return this.send(c, { t: 'err', code: 'exists' });
    else if (!s && this.pw && String(m.pw || '').slice(0, 24) !== this.pw) return this.send(c, { t: 'err', code: 'pass', wrong: !!m.pw });
    if (s) {                                               // reconexão: assume o assento de volta
      if (s.c && s.c !== c) { s.c.seat = null; try { s.c.ws.close(1000, 'outra aba'); } catch (e) { } this.conns.delete(s.c); }
      s.c = c; s.awayAt = 0; c.seat = s;
      if (this.phase === 'auction' && s.team && s.botted) { s.botted = false; this.A.setHuman(s.team, true); }
    } else {
      if (this.phase !== 'lobby') return this.send(c, { t: 'err', code: 'started' });
      if (this.seats.length >= MAX_SEATS) {                // sala cheia de bots: o último bot cede a vaga
        const bi = this.seats.map(x => x.kind).lastIndexOf('bot');
        if (bi < 0) return this.send(c, { t: 'err', code: 'full' });
        this.seats.splice(bi, 1);
      }
      let emb = m.emb; if (!this.validEmb(emb)) emb = this.freeEmb();
      s = { uid: ++this.uid, kind: 'human', name: clean(m.name), emb, auto: !!m.auto || !clean(m.name), tok, c, awayAt: 0, host: !this.seats.some(x => x.host) };
      if (s.emb !== m.emb) s.auto = true;
      this.seats.push(s); c.seat = s; this.stat('joins');
    }
    this.active = Date.now();
    if (this.phase === 'lobby') { this.pushLobby(); this.register(); return; }
    this.sendStart(c); this.sendSnap(c, true);
    if (this.phase === 'done') { this.sendEnd(c); this.sendResume(c); }
  }

  leave(s) {
    if (this.phase === 'lobby') {
      this.seats = this.seats.filter(x => x !== s);
      if (s.c) { s.c.seat = null; try { s.c.ws.close(1000, 'saiu'); } catch (e) { } this.conns.delete(s.c); }
      this.fixHost(); this.pushLobby(); this.register();
    } else { s.awayAt = Date.now() - AWAY_BOT_MS; if (s.c) { s.c.seat = null; try { s.c.ws.close(1000, 'saiu'); } catch (e) { } this.conns.delete(s.c); s.c = null; } }
  }
  fixHost() {
    if (this.seats.some(x => x.host && x.kind === 'human')) return;
    this.seats.forEach(x => x.host = false);
    const h = this.seats.find(x => x.kind === 'human');
    if (h) h.host = true; else this.close('vazia');
  }

  // ---------- lobby ----------
  lobbyMsg(c, s, m) {
    switch (m.t) {
      case 'pick': if (this.validEmb(m.emb)) { s.emb = m.emb; s.auto = !!m.auto; if (s.auto) s.name = ''; } break;
      case 'name': s.name = clean(m.name); s.auto = !s.name; break;
      case 'addBot': if (s.host && this.seats.length < MAX_SEATS) { const e = this.validEmb(m.emb) ? m.emb : this.freeEmb(); this.seats.push({ uid: ++this.uid, kind: 'bot', name: '', emb: e, auto: true, host: false }); } break;
      case 'rm': { const t = this.seatOf(m.uid); if (s.host && t && t !== s) { if (t.kind === 'human') this.kick(t); this.seats = this.seats.filter(x => x !== t); } break; }
      case 'ready': if (!s.host) s.ready = !!m.on; break;
      case 'start': if (s.host && this.seats.length >= MIN_TEAMS && this.allReady()) return this.start(); break;
      default: return;
    }
    this.pushLobby(); this.register();
  }
  allReady() { return this.seats.every(x => x.kind === 'bot' || x.host || x.ready); }
  kick(t) { if (t.c) { this.send(t.c, { t: 'err', code: 'kicked' }); t.c.seat = null; try { t.c.ws.close(1000, 'expulso'); } catch (e) { } this.conns.delete(t.c); t.c = null; } }
  lobbyView() { return { t: 'lobby', code: this.code, pub: this.pub, lock: !!this.pw, max: MAX_SEATS, min: MIN_TEAMS, seats: this.seats.map(s => ({ uid: s.uid, kind: s.kind, name: s.name, emb: s.emb, auto: s.auto, host: !!s.host, ready: s.kind === 'bot' || !!s.host || !!s.ready, on: s.kind === 'bot' || !!s.c })) }; }
  pushLobby() { const v = this.lobbyView(); for (const c of this.conns) if (c.seat) this.send(c, { ...v, you: c.seat.uid }); }
  stat(k, n) { try { this.env.LOBBY.get(this.env.LOBBY.idFromName('main')).fetch('https://lobby/stat', { method: 'POST', body: JSON.stringify({ k, n }) }).catch(() => { }); } catch (e) { } }
  register() {
    const h = this.host(), open = this.created && this.pub && this.phase === 'lobby' && !!h;
    const body = open ? { code: this.code, host: h.name, auto: h.auto, emb: h.emb, n: this.seats.length, max: MAX_SEATS, lock: !!this.pw, open: true } : { code: this.code };
    this.lastReg = Date.now();
    try { this.env.LOBBY.get(this.env.LOBBY.idFromName('main')).fetch('https://lobby/' + (open ? 'upsert' : 'remove'), { method: 'POST', body: JSON.stringify(body) }).catch(() => { }); } catch (e) { }
  }

  // ---------- leilão ----------
  start() {
    this.teams = this.seats.map((s, i) => { const t = newBot(i, s.name || ('T' + i)); t.emb = s.emb; t.human = s.kind === 'human'; s.team = t; s.botted = false; if (t.human) s.awayAt = s.c ? 0 : Date.now(); return t; });
    this.A = new Auction(this.teams, DB);
    this.stat('games'); this.stat('players', this.seats.filter(x => x.kind === 'human').length);
    this.phase = 'auction'; this.hold = Date.now() + HOLD_MS; this.sentV = -1; this.key = '';
    this.register();
    for (const c of this.conns) if (c.seat) { this.sendStart(c); this.sendSnap(c, true); }
    this.last = Date.now();
    this.loop = setInterval(() => this.step(), 100); this.timers.push(this.loop);
  }
  sendStart(c) {
    const A = this.A;
    this.send(c, { t: 'start', you: c.seat.team ? c.seat.team.id : -1, host: !!c.seat.host, code: this.code,
      teams: this.seats.map((s, i) => ({ id: i, emb: s.emb, name: s.name, auto: s.auto, human: s.kind === 'human', uid: s.uid })),
      pool: A.pool.map(p => [p.name, p.pos, p.ovr, p.tm]), total: A.total });
  }
  snap(full) {
    const A = this.A, id = t => t.id;
    const o = { t: 's', i: A.i, ph: A.phase, pr: A.price, ld: A.leader ? A.leader.id : null, tl: Math.max(0, Math.round(A.timeLeft)), tm: A.timeMax, hi: !!A.humanIn,
      ps: [...A.passed].map(id), el: A.elig.map(id), nb: A.nBids, sc: A.soldCount, v: A.version,
      bd: A.bids.map(b => [b.team.id, b.kind, b.price, b.inc || 0, b.first ? 1 : 0]),
      sd: A.sold ? [A.sold.player.id, A.sold.team ? A.sold.team.id : -1, A.sold.price, A.sold.note || ''] : null, hold: Math.max(0, this.hold - Date.now()) };
    if (full || A.version !== this.sentV) {
      o.teams = this.teams.map(t => ({ b: t.budget, r: t.roster.map(p => [p.id, p.paid]), au: (t.auto || []).map(p => p.id), o: t.order || null }));
      o.lg = A.log.slice(0, 12).map(s => [s.player.id, s.team ? s.team.id : -1, s.price, s.note || '']);
    }
    return o;
  }
  sendSnap(c, full) { this.send(c, this.snap(full)); }
  pushSnap() { const o = this.snap(false); this.sentV = this.A.version; this.lastSync = Date.now(); this.all(o); }
  stateKey() { const A = this.A; return `${A.i}|${A.phase}|${A.price}|${A.nBids}|${A.version}|${A.passed.size}|${A.humanIn}`; }

  play(c, s, m) {
    if (this.phase !== 'auction' || !s.team || !s.team.human || Date.now() < this.hold) return;
    const A = this.A, ok = m.t === 'bid' ? (Number.isInteger(m.amount) && A.bid(s.team, m.amount)) : A.pass(s.team);
    if (ok) { this.key = this.stateKey(); this.pushSnap(); } else this.sendSnap(c, true);
  }
  // arranjo do campo (em que vaga cada titular joga): só humano, só durante o leilão; o servidor completa/valida na hora de usar (normOrder)
  order(s, m) {
    if (this.phase !== 'auction' || !s.team || !s.team.human || !m.o || typeof m.o !== 'object') return;
    const o = {}; for (const pos of POS_ORDER) { const a = m.o[pos]; if (Array.isArray(a)) o[pos] = a.slice(0, SLOTS[pos]).map(x => Number.isInteger(x) ? x : null); }
    s.team.order = o;
  }
  step() {
    const now = Date.now(), A = this.A; let dt = Math.min(500, now - this.last); if (dt <= 0) dt = 100; this.last = now;
    if (now >= this.hold) A.tick(dt);
    for (const s of this.seats) if (s.kind === 'human' && !s.c && !s.botted && s.team && now - s.awayAt > AWAY_BOT_MS) { s.botted = true; A.setHuman(s.team, false); }
    if (A.done) return this.finish();
    const k = this.stateKey();
    if (k !== this.key || now - this.lastSync >= 1000) { this.key = k; this.pushSnap(); }
  }
  endView() { return { t: 'end', seed: this.cseed, teams: this.teams.map(t => ({ b: t.budget, r: t.roster.map(p => [p.id, p.paid]), au: (t.auto || []).map(p => p.id), o: t.order || null })) }; }
  sendEnd(c) { this.send(c, this.endView()); }
  sendResume(c) { if (this.seasonOn) this.send(c, { t: 'resume', seed: this.seed, rd: this.rd | 0, since: this.roundAt ? Date.now() - this.roundAt : 0 }); }
  finish() {
    clearInterval(this.loop); this.teams.forEach(finishTeam);
    this.phase = 'done'; this.rd = 0; this.roundAt = 0; this.seasonOn = false; this.cseed = seedNow(); this.seed = this.cseed; this.active = Date.now();
    this.all(this.endView()); this.stat('done');
  }

  // ---------- manutenção ----------
  startHousekeeping() {
    this.timers.push(setInterval(() => {
      const now = Date.now(), live = this.seats.some(s => s.kind === 'human' && s.c);
      if (this.phase === 'lobby') {
        const gone = this.seats.filter(s => s.kind === 'human' && !s.c && now - s.awayAt > LOBBY_AWAY_MS);
        if (gone.length) { this.seats = this.seats.filter(s => !gone.includes(s)); this.fixHost(); if (this.phase === 'lobby') this.pushLobby(); this.register(); }
        else if (this.pub && now - this.lastReg > 30000) this.register();
      }
      if (live) this.emptyAt = 0; else if (!this.emptyAt) this.emptyAt = now;
      const idle = now - this.active, empty = this.emptyAt && now - this.emptyAt;
      if ((this.phase === 'lobby' && (idle > 30 * 60000 || empty > 20000)) || (this.phase === 'auction' && empty > 90000) || (this.phase === 'done' && (idle > 60 * 60000 || empty > 10 * 60000))) this.close('inativa');
    }, 5000));
  }
  close(why) {
    if (this.phase === 'closed') return;
    this.phase = 'closed'; this.register();
    this.timers.forEach(clearInterval); this.timers = [];
    for (const c of this.conns) { this.send(c, { t: 'closed', why }); try { c.ws.close(1000, why); } catch (e) { } }
    this.conns.clear(); this.seats = []; this.A = null; this.created = false; this.pw = '';
  }
}
