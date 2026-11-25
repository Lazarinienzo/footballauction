// Teste ponta a ponta: 3 humanos (um cai no meio e volta) + bots numa sala pública. Roda o leilão inteiro e confere que todos veem o mesmo resultado.
import WebSocket from 'ws';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
const load = f => { const m = { exports: {} }; new Function('module', 'exports', 'require', fs.readFileSync(new URL('../game/' + f, import.meta.url), 'utf8'))(m, m.exports, p => load(p.replace('./', ''))); return m.exports; };   // package type=module: carrega os arquivos como CommonJS
const S = load('sim.js'); const { DB } = load('db.js');

const BASE = process.env.BASE || 'localhost:8787';
const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
let fails = 0; const ok = (n, c) => { if (!c) { fails++; console.log('FALHOU:', n); } else console.log('ok:', n); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function client(name, tok, create, opts = {}) {
  const c = { name, tok, msgs: [], lobby: null, start: null, snap: null, end: null, teams: null, pool: null, errs: [], bids: 0, seasons: [], rounds: [] };
  const open = () => new Promise(res => {
    c.ws = new WebSocket(`ws://${BASE}/ws/${code}`);
    c.ws.on('open', () => { c.ws.send(JSON.stringify({ t: 'join', tok, name: '', auto: true, emb: opts.emb, create, pub: true })); res(); });
    c.ws.on('message', d => {
      const m = JSON.parse(d); c.msgs.push(m.t);
      if (m.t === 'lobby') c.lobby = m;
      if (m.t === 'err') c.errs.push(m.code);
      if (m.t === 'start') { c.start = m; c.pool = m.pool.map((p, i) => ({ id: i, name: p[0], pos: p[1], ovr: p[2], tm: p[3] })); }
      if (m.t === 's') { c.snap = m; if (m.teams) c.teams = m.teams; if (opts.play) c.act(m); }
      if (m.t === 'end') c.end = m;
      if (m.t === 'season') c.seasons.push(m.seed);
      if (m.t === 'round') c.rounds.push(m.n);
    });
  });
  c.connect = open; c.send = o => c.ws.send(JSON.stringify(o));
  c.act = m => {
    if (c.start == null || m.ph !== 'bidding' || m.hold > 0) return;
    const me = c.start.you, key = m.i + ':' + m.nb; if (c.lastKey === key) return; c.lastKey = key;
    const t = c.teams && c.teams[me], budget = t ? t.b : 200, have = t ? t.r.length : 0;
    const cap = Math.max(0, budget - (16 - have - 1));
    if (m.ld === me || !m.el.includes(me) || m.ps.includes(me)) return;
    if (m.pr + 1 <= cap && Math.random() < .35) { setTimeout(() => { try { c.send({ t: 'bid', amount: m.pr + 1 + Math.floor(Math.random() * 3) }); c.bids++; } catch (e) { } }, 200 + Math.random() * 900); }
    else setTimeout(() => { try { c.send({ t: 'pass' }); } catch (e) { } }, 300);
  };
  return c;
}

const a = client('A', 'tok-aaaaaaaa', true, { emb: 3, play: true });
await a.connect(); await sleep(300);
ok('sala criada, anfitrião é A', a.lobby && a.lobby.seats.length === 1 && a.lobby.seats[0].host);
const dup = client('X', 'tok-xxxxxxxx', true); await dup.connect(); await sleep(300);
ok('criar código existente dá erro', dup.errs.includes('exists')); dup.ws.close();
const b = client('B', 'tok-bbbbbbbb', false, { emb: 3, play: true }); await b.connect(); await sleep(300);
const c = client('C', 'tok-cccccccc', false, { play: true }); await c.connect(); await sleep(300);
ok('3 humanos na sala', a.lobby.seats.length === 3);
ok('franquia repetida foi trocada', new Set(a.lobby.seats.map(s => s.emb)).size === 3);
const r = await (await fetch(`http://${BASE}/api/rooms`)).json();
ok('sala pública aparece na lista', r.rooms.some(x => x.code === code && x.n === 3));
b.send({ t: 'start' }); await sleep(200); ok('só o anfitrião inicia (B ignorado)', !a.start);
for (let i = 0; i < 2; i++) a.send({ t: 'addBot' }); await sleep(300);
ok('5 assentos', a.lobby.seats.length === 5);
const bot = a.lobby.seats.find(s => s.kind === 'bot'); a.send({ t: 'rm', uid: bot.uid }); await sleep(200);
ok('bot removido', a.lobby.seats.length === 4);
a.send({ t: 'start' }); await sleep(400); ok('sem todos prontos o anfitrião não inicia', !a.start);
ok('lobby mostra ready=false para B', a.lobby.seats.find(x => x.kind === 'human' && !x.host && !x.ready));
b.send({ t: 'ready', on: true }); await sleep(200); a.send({ t: 'start' }); await sleep(300); ok('com só um pronto ainda não inicia', !a.start);
c.send({ t: 'ready', on: true }); await sleep(200); c.send({ t: 'ready', on: false }); await sleep(200); c.send({ t: 'ready', on: true }); await sleep(200);
a.send({ t: 'start' }); await sleep(500);
ok('todos receberam start', a.start && b.start && c.start);
ok('ids diferentes', new Set([a.start.you, b.start.you, c.start.you]).size === 3);
const r2 = await (await fetch(`http://${BASE}/api/rooms`)).json();
ok('sala sai da lista ao iniciar', !r2.rooms.some(x => x.code === code));

// C cai no meio e volta
const t0 = Date.now(); let dropped = false;
while (!a.end && Date.now() - t0 < 500000) {
  await sleep(500); if (Math.floor((Date.now()-t0)/30000) !== c.lastP) { c.lastP = Math.floor((Date.now()-t0)/30000); console.log('  ...', a.snap && a.snap.sc, 'vendas'); }
  if (!dropped && a.snap && a.snap.sc >= 12) { dropped = true; c.ws.close(); console.log('C caiu em', a.snap.sc, 'vendas'); await sleep(14000); await c.connect(); console.log('C voltou'); }
}
await sleep(500);
ok('leilão terminou', !!a.end); ok('todos receberam end', a.end && b.end && c.end);
console.log('duração', ((Date.now() - t0) / 1000).toFixed(0) + 's, lances humanos', a.bids + b.bids + c.bids);
ok('mesma semente pra todos', a.end.seed === b.end.seed && a.end.seed === c.end.seed);
ok('todos os times com 16 jogadores', a.end.teams.every(t => t.r.length === 16));
ok('orçamento nunca negativo', a.end.teams.every(t => t.b >= 0));
const ids = a.end.teams.flatMap(t => t.r.map(x => x[0])); ok('nenhum jogador repetido', new Set(ids).size === ids.length);
ok('c e a veem o mesmo elenco', JSON.stringify(a.end.teams) === JSON.stringify(c.end.teams));

// reconstrói os times como o cliente faz e roda a temporada semeada em dois "clientes"
const build = cl => cl.start.teams.map(t => { const E = cl.end.teams[t.id]; const x = S.newBot(t.id, 'T' + t.id); x.emb = t.emb; x.budget = E.b; x.roster = E.r.map(([id, paid]) => { const p = cl.pool[id]; return { name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id, paid }; }); return S.finishTeam(x); });
const run = cl => S.withSeed(cl.end.seed, () => { const T = build(cl), cf = S.drawConferences(T), s = S.simSeason(T, cf); return JSON.stringify(s.games.map(g => [g.a, g.b, g.sa, g.sb])) + s.champion.id; });
ok('temporada idêntica em A e B', run(a) === run(b)); ok('temporada idêntica em A e C', run(a) === run(c));
a.send({ t: 'reseason' }); await sleep(300);
ok('reseason só do anfitrião chega pra todos', b.seasons.length === 1 && c.seasons.length === 1 && b.seasons[0] !== a.end.seed);
b.send({ t: 'reseason' }); await sleep(200); ok('reseason de não-anfitrião ignorado', b.seasons.length === 1);
a.send({ t: 'round', n: 1 }); await sleep(200); ok('round fora de ordem ignorado', !b.rounds.length);
a.send({ t: 'round', n: 0 }); await sleep(300); ok('round 0 chega pra todos', b.rounds.join() === '0' && c.rounds.join() === '0' && a.rounds.join() === '0');
b.send({ t: 'round', n: 1 }); await sleep(200); ok('round de não-anfitrião ignorado', b.rounds.length === 1);
a.send({ t: 'round', n: 1 }); await sleep(200); ok('round 1 em seguida', b.rounds.join() === '0,1');
[a, b, c].forEach(x => x.ws.close());
console.log(fails ? 'FALHAS: ' + fails : 'TUDO OK'); process.exit(fails ? 1 : 0);
