// Motor do jogo: leilão, duelos e simulação de partidas.
const SLOTS = { QB: 1, RB: 1, WR: 2, TE: 1, OL: 3, EDGE: 2, DT: 2, LB: 2, CB: 2 };
const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'OL', 'EDGE', 'DT', 'LB', 'CB'];
const OFF_POS = ['QB', 'RB', 'WR', 'TE', 'OL'];
const TOTAL_SLOTS = 16, BUDGET = 200;
const LOT_MS = 6000, BID_MS = 4000;   // tempo do lote; cada lance leva o relógio pra BID_MS
let RNG = Math.random;                         // gerador trocável: com semente, todos os clientes sorteiam a mesma temporada
const R = () => RNG();
function mulberry32(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function withSeed(seed, fn) { if (seed == null) return fn(); const old = RNG; RNG = mulberry32(seed >>> 0); try { return fn(); } finally { RNG = old; } }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const expo = () => -Math.log(1 - R());
const rint = (a, b) => Math.floor(a + R() * (b - a + 1));
const duel = (a, b, k) => 1 / (1 + Math.exp(-(a - b) / (k || 8)));
const avg = (...x) => x.reduce((s, v) => s + v, 0) / x.length;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const shortName = n => { const t = n.replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, '').split(' '); return t[t.length - 1]; };

// ---------- escalação e OVR de ataque / defesa ----------
function lineup(roster) {
  const by = p => roster.filter(x => x.pos === p).sort((a, b) => b.ovr - a.ovr);
  return { QB: by('QB')[0], RB: by('RB')[0], WR: by('WR'), TE: by('TE')[0], OL: by('OL'),
           EDGE: by('EDGE'), DT: by('DT'), LB: by('LB'), CB: by('CB') };
}
// Peso de cada posição no OVR do time. A base é 1,0x; a média é sempre dividida pela soma dos pesos, então a escala do OVR não muda.
const WEIGHT = { QB: 2.5, RB: 1.0, WR: 1.5, TE: 1.0, OL: 1.0, EDGE: 2.0, DT: 1.0, LB: 1.5, CB: 1.5 };   // base 1,0x; degraus 1,5x e 2,0x; o QB vale 2,5x
// Posições no campo (x, y em "casas"): o desenho da tela e as sinergias usam as MESMAS coordenadas.
// [posição, índice (0 = melhor OVR da posição), x, y]
const SPOT = {
  off: [['OL', 0, 1.5, 0], ['OL', 1, 2.5, 0], ['OL', 2, 3.5, 0], ['TE', 0, 4.5, 0], ['WR', 0, 1, 1], ['QB', 0, 2.5, 1], ['WR', 1, 4, 1], ['RB', 0, 2.5, 2]],
  def: [['CB', 0, 1, 0], ['CB', 1, 4, 0], ['LB', 0, 2, 1], ['LB', 1, 3, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2, 2], ['DT', 1, 3, 2], ['EDGE', 1, 4, 2]]
};
const SYN_DIST = 1.6;   // só jogadores vizinhos no campo se conectam
// Titulares de cada lado, com o peso e o lugar da posição.
function sideStarters(L, side) {
  return SPOT[side].map(([pos, i, x, y]) => ({ pos, i, x, y, p: Array.isArray(L[pos]) ? L[pos][i] : L[pos], w: WEIGHT[pos] }));
}
// SINERGIA: dois titulares do MESMO lado, do mesmo time da NFL e VIZINHOS no campo formam um link.
// Cada link soma SYN pontos de OVR por peso das duas posições (QB+WR = +1,0; RB+QB ≈ +0,9; OL+OL = +0,5), com teto por lado.
const SYN = 0.25, SYN_CAP = 4;
function synLinks(L, side) {
  const xs = sideStarters(L, side).filter(x => x.p && x.p.tm), out = [];
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++)
    if (xs[i].p.tm === xs[j].p.tm && Math.hypot(xs[i].x - xs[j].x, xs[i].y - xs[j].y) <= SYN_DIST)
      out.push({ a: xs[i].p, b: xs[j].p, pa: xs[i].pos, pb: xs[j].pos, tm: xs[i].p.tm, pts: SYN * (xs[i].w + xs[j].w) });
  return out;
}
const synPts = links => Math.min(SYN_CAP, links.reduce((n, l) => n + l.pts, 0));
// OVR do ataque / da defesa = média PONDERADA dos 8 titulares do lado + bônus de sinergia.
function ratings(L) {
  const wavg = side => { const xs = sideStarters(L, side); return xs.reduce((n, x) => n + x.p.ovr * x.w, 0) / xs.reduce((n, x) => n + x.w, 0); };
  const off = wavg('off') + synPts(synLinks(L, 'off'));
  const def = wavg('def') + synPts(synLinks(L, 'def'));
  return { off, def, all: (off + def) / 2 };
}

// ---------- partida: 6 posses por time ----------
// 1ª rolagem: ataque vence = touchdown.
// 2ª rolagem: ataque vence = tenta o field goal (pode errar); defesa vence = a posse acaba sem pontos
//   (punt, interceptação, fumble, quarta descida perdida ou sack; a defesa forte rouba mais a bola).
// Bola roubada (interceptação, fumble, quarta perdida) dá campo curto: a posse seguinte do rival ganha bônus de OVR.
const POSSESSIONS = 6;
const SIM = { k1: 12, k2: 12, base1: 0.355, base2: 0.43, make: 0.85, td: 7, fg: 3, short: 6,
  start: 25, shortYd: 3, gain: 20, slope: 0.55, sd: 13, first: 10, fgRange: 52, ref: 84, lvl: 0.3, clean: 60, to: 0.034, downs: 0.30, sack: 0.20, maxSeries: 7 };
const logit = p => Math.log(p / (1 - p));
const pRoll = (off, def, k, base) => 1 / (1 + Math.exp(-((off - def) / k + logit(base))));
const pTD = (off, def) => pRoll(off, def, SIM.k1, SIM.base1);
const pFG = (off, def) => pRoll(off, def, SIM.k2, SIM.base2);
const TAKE = { INT: SIM.short, FUM: SIM.short, DOWNS: SIM.short / 2 };      // bônus da posse seguinte do rival
// Posse = DRIVE de campo. A bola começa na linha 25 (ou mais à frente se foi roubada: campo curto).
// Cada série tenta avançar 10 jardas: o ganho médio cresce com (ataque do time − defesa do rival).
// Chegou na linha 100 = touchdown. Série que falha: dentro do alcance (linha 60+) vem o field goal (que pode errar);
// fora dele, quarta descida arriscada, sack ou punt. A cada série, ataque fraco contra defesa forte também perde a bola.
// Ou seja: pontuar, não pontuar e roubar a bola dependem do ataque de um lado E da defesa do outro.
function simPossession(offT, defT, opts) {
  const short = (opts && opts.short) || 0, off = offT.rt.off, def = defT.rt.def, edge = off - def;
  const lvl = ((offT.rt.all + defT.rt.all) / 2 - SIM.ref);                // nível dos DOIS times: jogo entre times fortes é mais limpo e pontuado; entre fracos, truncado
  const tf = Math.max(.6, Math.min(1.6, 1 + (def - off) / 40));            // >1 quando a defesa manda
  const mean = SIM.gain + SIM.slope * edge + SIM.lvl * lvl, tOdds = SIM.to * tf * Math.max(.5, 1 - lvl / SIM.clean);
  let y = SIM.start + short * SIM.shortYd, y0 = y, series = 0;
  const end = (result, extra) => ({ result, pts: result === 'TD' ? SIM.td : result === 'FG' ? SIM.fg : 0, off, def, short, y0, yd: Math.min(100, Math.round(y)), series, ...extra });
  while (series < SIM.maxSeries) {
    series++;
    if (R() < tOdds) return end(R() < .55 ? 'INT' : 'FUM');
    const g = mean + SIM.sd * (R() + R() + R() - 1.5) * 2;
    if (g >= SIM.first) { y += g; if (y >= 100) return end('TD'); continue; }
    if (y >= SIM.fgRange) return end(R() < SIM.make ? 'FG' : 'MISS');
    if (y >= 45 && R() < SIM.downs) return end('DOWNS');
    return end(R() < SIM.sack * tf * Math.max(.6, 1 - lvl / SIM.clean) ? 'SACK' : 'PUNT');
  }
  return y >= SIM.fgRange ? end(R() < SIM.make ? 'FG' : 'MISS') : end('PUNT');
}
// distribuição real de um confronto (ataque × defesa), por amostragem — usada no laboratório
function driveOdds(off, def, n, offT, defT) {
  n = n || 4000; const c = { TD: 0, FG: 0, MISS: 0, PUNT: 0, INT: 0, FUM: 0, DOWNS: 0, SACK: 0 };
  const A = offT || { rt: { off, all: off } }, D = defT || { rt: { def, all: def } };
  for (let i = 0; i < n; i++) c[simPossession(A, D).result]++;
  for (const k in c) c[k] /= n; c.none = 1 - c.TD - c.FG; c.pts = c.TD * SIM.td + c.FG * SIM.fg; return c;
}
function simGame(tA, tB, opts) {
  opts = opts || {};
  const T2 = [tA, tB], sc = [0, 0], poss = [], carry = [0, 0];
  const play = (n, ot) => { for (let i = 0; i < 2; i++) { const r = simPossession(T2[i], T2[1 - i], { short: carry[i] }); carry[i] = 0; carry[1 - i] = TAKE[r.result] || 0; sc[i] += r.pts; poss.push({ n, team: i, ot, ...r, scoreAfter: sc.slice() }); } };
  for (let n = 1; n <= POSSESSIONS; n++) play(n, false);
  let ot = false;
  for (let r = 1; r <= 3 && sc[0] === sc[1]; r++) { ot = true; play(POSSESSIONS + r, true); }
  if (sc[0] === sc[1] && opts.noTie) sc[R() < pRoll(tA.rt.all, tB.rt.all, 6, .5) ? 0 : 1] += SIM.fg;
  return { a: tA.id, b: tB.id, sa: sc[0], sb: sc[1], ot, poss };
}

// ---------- leilão ----------
const POSW = { QB: 1.6, RB: 1.0, WR: 1.15, TE: 1.0, OL: 1.05, EDGE: 1.3, DT: 1.0, LB: 1.0, CB: 1.15 };
const need = (t, pos) => SLOTS[pos] - t.roster.filter(p => p.pos === pos).length;
const slotsLeft = t => TOTAL_SLOTS - t.roster.length;
const maxBid = (t, p) => need(t, p.pos) <= 0 ? 0 : Math.max(0, t.budget - (slotsLeft(t) - 1));

function maxTeams(db) {
  const c = {}; db.forEach(p => c[p.pos] = (c[p.pos] || 0) + 1);
  return Math.min(...POS_ORDER.map(pos => Math.floor((c[pos] || 0) / SLOTS[pos])));
}
function makePool(db, n, extra) {
  extra = extra == null ? .5 : extra;           // sobra de jogadores por posição (50% a mais, mínimo +2)
  const pool = [];
  for (const pos of POS_ORDER) {
    const all = db.filter(p => p.pos === pos), need = SLOTS[pos] * n;
    const take = Math.min(all.length, need + Math.max(2, Math.ceil(need * extra)));
    pool.push(...shuffle(all).slice(0, take));
  }
  return shuffle(pool).map((p, i) => ({ ...p, id: i, passes: 0, sold: false }));
}
function newBot(id, name) {
  const pos = {}; POS_ORDER.forEach(p => pos[p] = .8 + R() * .45);
  return { id, name, human: false, budget: BUDGET, roster: [], persona: { aggr: .85 + R() * .35, pos } };
}

class Auction {
  constructor(teams, db, extra) {
    this.teams = teams; this.pool = makePool(db, teams.length, extra); this.i = -1; this.log = []; this.done = false; this.now = 0;
    this.total = teams.length * TOTAL_SLOTS; this.soldCount = 0; this.version = 0;
    this.stats = {};
    for (const pos of POS_ORDER) {
      const xs = this.pool.filter(p => p.pos === pos).map(p => p.ovr), m = avg(...xs);
      this.stats[pos] = { m, sd: Math.max(2, Math.sqrt(avg(...xs.map(x => (x - m) ** 2)))) };
    }
    this.next();
  }
  get cur() { return this.pool[this.i]; }
  // online: humano que caiu vira bot (e volta a ser humano quando reconecta) sem travar o lote
  setHuman(team, on) {
    team.human = on;
    if (this.phase !== 'bidding' || !this.elig || !this.elig.includes(team)) return;
    if (!on) { this.passed.delete(team); this.lim[team.id] = this.limit(team, this.cur); this.botAt[team.id] = this.now + rint(600, 2000); }
    this.humanIn = this.elig.some(t => t.human && !this.passed.has(t));
    if (!this.humanIn) this.timeLeft = Math.min(this.timeLeft, 2000);
  }
  get human() { return this.teams.find(t => t.human); }
  supply(pos) { return this.pool.reduce((n, p) => n + (p.pos === pos && !p.sold ? 1 : 0), 0); }   // jogadores ainda no pool
  demand(pos) { return this.teams.reduce((n, t) => n + Math.max(0, need(t, pos)), 0); }            // vagas ainda abertas
  limit(t, p) {
    const s = this.stats[p.pos], z = (p.ovr - s.m) / s.sd, q = clamp(1 + .6 * z, .3, 2.8);
    // sobrou jogador na posição? bot sem pressa deixa os fracos passarem (até 2 vezes)
    if (this.supply(p.pos) > this.demand(p.pos) && p.passes < 2 && z < -.3 && R() < clamp((-z - .2) * .7, 0, .9)) return 0;
    const urg = 1 + .6 * (1 - slotsLeft(t) / TOTAL_SLOTS);
    const syn = 1 + .07 * Math.min(3, t.roster.filter(x => x.tm && x.tm === p.tm && (OFF_POS.includes(x.pos) === OFF_POS.includes(p.pos))).length);   // bot paga um pouco mais por quem liga com o elenco
    let w = (t.budget / slotsLeft(t)) * q * POSW[p.pos] * t.persona.aggr * t.persona.pos[p.pos] * urg * syn * (.85 + R() * .3);
    if (slotsLeft(t) === 1) w = Math.max(w, t.budget * .7);
    return clamp(Math.round(w), 1, maxBid(t, p));
  }
  next() {
    if (this.soldCount >= this.total) { this.done = true; this.phase = 'done'; return; }
    const n = this.pool.length; let found = -1;
    for (let k = 1; k <= n; k++) { const j = (this.i + k + n) % n, q = this.pool[j]; if (!q.sold && !q.deferred && this.demand(q.pos) > 0) { found = j; break; } }
    if (found < 0) { this.autoFill(); this.done = true; this.phase = 'done'; return; }
    this.i = found;
    const p = this.cur;
    this.price = 0; this.leader = null; this.sold = null; this.phase = 'bidding'; this.passed = new Set(); this.bids = []; this.nBids = 0;
    this.elig = this.teams.filter(t => maxBid(t, p) >= 1);
    this.humanIn = this.elig.some(t => t.human);
    this.timeLeft = this.timeMax = this.humanIn ? LOT_MS : 2000;
    this.lim = {}; this.botAt = {};
    for (const t of this.elig) if (!t.human) {
      this.lim[t.id] = this.limit(t, p);
      // alguns bots esperam a reta final pra dar o lance
      const sniper = this.humanIn && R() < .35;
      this.botAt[t.id] = this.now + (sniper ? rint(LOT_MS - 3500, LOT_MS - 500) : rint(600, 2400) * (this.humanIn ? 1 : .4));
    }
    // vaga obrigatória: não sobra jogador nessa posição e só um time precisa
    if (this.elig.length === 1 && !this.elig[0].human && this.supply(p.pos) <= this.demand(p.pos)) { this.leader = this.elig[0]; this.price = 1; this.sell('única vaga'); }
    else this.settle();
  }
  // quem ainda pode disputar: humano que não saiu desse lance e tem saldo, e qualquer bot com saldo.
  // O teto de um bot é segredo: ele nunca "sai" sozinho, só o relógio encerra o lote (senão o lance humano fecharia o lote na hora e entregaria o teto dos bots).
  active(t) {
    if (t === this.leader || maxBid(t, this.cur) <= this.price) return false;
    return t.human ? !this.passed.has(t) : true;
  }
  // todos os outros times saíram de verdade (humanos que passaram ou sem saldo): com líder, o lote é dele na hora; sem líder, o jogador sai da vez
  // Só encerra antes do relógio quando alguém saiu de verdade (passou) e não sobrou ninguém na disputa. Fora isso, o lote só acaba quando o tempo acaba.
  settle() {
    if (this.phase !== 'bidding' || !this.passed.size) return;
    if (!this.elig.some(t => this.active(t))) this.sell();
  }
  bid(team, amount) {
    if (this.phase !== 'bidding' || !this.elig.includes(team) || team === this.leader || this.passed.has(team)) return false;
    if (amount <= this.price || amount > maxBid(team, this.cur)) return false;
    this.bids.push({ team, kind: 'bid', price: amount, inc: amount - this.price, first: this.price === 0 }); this.nBids++; if (this.bids.length > 12) this.bids.shift();
    this.price = amount; this.leader = team;
    // lote dura 6s; cada lance leva o relógio pra 4s (dinâmico: quem dá lance recomeça a contagem)
    if (this.humanIn) { this.timeLeft = BID_MS; this.timeMax = BID_MS; }
    else { if (this.timeLeft <= 1300) this.timeLeft = 1300; this.timeMax = Math.max(this.timeMax, this.timeLeft); }
    this.settle();
    return true;
  }
  pass(team) {                                   // "passar" vale só pra quem clicou; o relógio só acelera quando nenhum humano resta na disputa
    if (this.phase !== 'bidding' || !team.human || !this.elig.includes(team) || this.leader === team || this.passed.has(team)) return false;
    this.passed.add(team); (this.cur.pb = this.cur.pb || new Set()).add(team.id);
    this.bids.push({ team, kind: 'pass', price: this.price }); this.nBids++; if (this.bids.length > 12) this.bids.shift();
    this.humanIn = this.elig.some(t => t.human && !this.passed.has(t));
    if (!this.humanIn) { this.timeLeft = Math.min(this.timeLeft, 1500); this.timeMax = 1500; }
    this.settle();
    return true;
  }
  sell(note) {
    const p = this.cur; let w = this.leader, price = this.price;
    if (!w) {
      // todo time que ainda precisa dessa posição é humano e recusou esse jogador: ele fica pro sorteio do fim (o jogo completa o time)
      const needers = this.teams.filter(t => need(t, p.pos) > 0);
      if (!this.elig.length || (needers.length && needers.every(t => t.human && p.pb && p.pb.has(t.id)))) {
        p.deferred = true;
        this.sold = { player: p, team: null, price: 0, note: 'fica pro sorteio' }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
        this.phase = 'sold'; this.pause = this.humanIn ? 800 : 300; this.version++; return;
      }
      if (this.supply(p.pos) > this.demand(p.pos)) {      // sobra jogador: ninguém quis, volta pro fim da fila
        p.passes++;
        this.sold = { player: p, team: null, price: 0, note: 'ninguém quis' }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
        this.phase = 'sold'; this.pause = this.humanIn ? 800 : 300; this.version++; return;
      }
      const cand = this.elig.filter(t => !(t.human && this.passed.has(t)));       // quem passou não é sorteado nessa hora
      if (!cand.length) {
        p.deferred = true;
        this.sold = { player: p, team: null, price: 0, note: 'fica pro sorteio' }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
        this.phase = 'sold'; this.pause = this.humanIn ? 800 : 300; this.version++; return;
      }
      w = cand[rint(0, cand.length - 1)]; price = 1; note = 'sem lances';
    }
    w.budget -= price; w.roster.push({ name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id: p.id, paid: price });
    p.sold = true; this.soldCount++;
    this.sold = { player: p, team: w, price, note }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
    this.phase = 'sold'; this.pause = this.humanIn ? 2600 : 450; this.version++;
  }
  // fim do leilão: quem ainda tem vaga aberta recebe, por sorteio, jogadores que sobraram nas posições que faltam (US$ 1 cada)
  autoFill() {
    for (const t of shuffle(this.teams.filter(x => slotsLeft(x) > 0))) for (const pos of POS_ORDER) {
      while (need(t, pos) > 0) {
        const c = this.pool.filter(p => p.pos === pos && !p.sold); if (!c.length) break;
        const p = c[rint(0, c.length - 1)], price = Math.min(1, t.budget);
        t.budget -= price; t.roster.push({ name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id: p.id, paid: price });
        p.sold = true; this.soldCount++; (t.auto = t.auto || []).push(p);
        this.log.unshift({ player: p, team: t, price, note: 'sorteio no fim' }); this.log.length = Math.min(this.log.length, 40);
      }
    }
    this.version++;
  }
  tick(dt) {
    this.now += dt;
    if (this.phase === 'done') return;
    if (this.phase === 'sold') { this.pause -= dt; if (this.pause <= 0) this.next(); return; }
    for (const t of this.elig) {
      if (t.human || t === this.leader || this.now < this.botAt[t.id]) continue;
      const lim = Math.min(this.lim[t.id], maxBid(t, this.cur));
      if (lim > this.price) {
        const P = this.price, W = P < 6 ? [[1, .75], [2, .25]] : P < 20 ? [[1, .5], [2, .2], [5, .3]] : [[1, .4], [2, .2], [5, .3], [10, .1]];
        const ok = W.filter(w => lim >= P + w[0]); let x = R() * ok.reduce((n, w) => n + w[1], 0), inc = 1;     // com orçamento maior, os lances grandes sobem de 1 em 1, de 2, de 5 ou de 10
        for (const w of ok) { if ((x -= w[1]) < 0) { inc = w[0]; break; } }
        this.bid(t, this.price + inc);
      }
      this.botAt[t.id] = this.now + rint(500, 1700) * (this.humanIn ? 1 : .35);
    }
    if (this.phase !== 'bidding') return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this.sell();
  }
}

// ---------- conferências ----------
const MIN_TEAMS = 4, MAX_CONF = 8;
const nextPow2 = n => { let s = 1; while (s < n) s *= 2; return s; };
// quantos classificam por conferência: 2→1, 3→2, 4→2, 5→3, 6→3, 7→4, 8→4 (o melhor fica de bye quando a chave não fecha em potência de 2)
const qualifiers = n => n <= 1 ? n : Math.ceil(n / 2);
const pieceLen = n => n <= 2 ? 6 : n === 3 ? 4 : n === 4 ? 3 : 2;
// nome da conferência = pedaço do nome de cada time (3 times: LazaPedrJonh; 6+ times: LaPeJoBuMiNe…)
function confName(names) {
  const len = pieceLen(names.length);
  return names.map(nm => {
    const ws = String(nm).normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).map(w => w.replace(/[^A-Za-z]/g, '')).filter(Boolean);
    const w = ws.length ? ws[ws.length - 1] : 'Time';
    return w.charAt(0).toUpperCase() + w.slice(1, len).toLowerCase();
  }).join('');
}
function drawConferences(teams) {
  if (teams.length > MAX_CONF * 2) throw new Error('máximo de ' + MAX_CONF * 2 + ' times');
  const sh = shuffle(teams), k = Math.ceil(sh.length / 2);
  const confs = [sh.slice(0, k), sh.slice(k)].map(g => { g.sort((a, b) => a.id - b.id); return { ids: g.map(t => t.id), name: confName(g.map(t => t.name)) }; });
  if (confs[0].name === confs[1].name) confs[1].name += '²';
  return confs;
}

// ---------- temporada ----------
function finishTeam(t) { t.lineup = lineup(t.roster); t.rt = ratings(t.lineup); return t; }
const rankRow = (x, y) => (y.w + y.t / 2) - (x.w + x.t / 2) || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf;
// classificação de cada conferência a partir de uma lista de jogos já disputados
function buildTables(confs, games) {
  const st = {}; confs.forEach((c, i) => c.ids.forEach(id => st[id] = { id, conf: i, w: 0, l: 0, t: 0, pf: 0, pa: 0 }));
  for (const g of games) {
    if (g.stage !== 'Temporada') continue;
    const A = st[g.a], B = st[g.b]; A.pf += g.sa; A.pa += g.sb; B.pf += g.sb; B.pa += g.sa;
    if (g.sa > g.sb) { A.w++; B.l++; } else if (g.sb > g.sa) { B.w++; A.l++; } else { A.t++; B.t++; }
  }
  return confs.map(c => c.ids.map(id => st[id]).sort(rankRow));
}
// distribui os jogos em rodadas: ninguém joga duas vezes na mesma rodada e as rodadas ficam com tamanho parecido
function makeRounds(sched, teams) {
  const deg = {}; teams.forEach(t => deg[t.id] = 0); sched.forEach(g => { deg[g[0].id]++; deg[g[1].id]++; });
  const D = Math.max(...Object.values(deg));
  for (let R = D; R <= sched.length; R++) {
    for (let k = 0; k < 300; k++) {
      const rounds = Array.from({ length: R }, () => ({ used: new Set(), games: [] })); let ok = true;
      for (const g of shuffle(sched)) {
        const free = rounds.filter(r => !r.used.has(g[0].id) && !r.used.has(g[1].id));
        if (!free.length) { ok = false; break; }
        const m = Math.min(...free.map(r => r.games.length)), pick = shuffle(free.filter(r => r.games.length === m))[0];
        pick.used.add(g[0].id); pick.used.add(g[1].id); pick.games.push(g);
      }
      if (ok) return rounds.map(r => r.games);
    }
  }
  return [sched];
}
const STAGE_RANK = { 'Temporada': 0, 'Semifinal da Conferência': 1, 'Final da Conferência': 2, 'Super Bowl': 3 };
function simSeason(teams, confs) {
  confs = confs || drawConferences(teams);
  const confOf = {}; confs.forEach((c, i) => c.ids.forEach(id => confOf[id] = i));
  const by = id => teams.find(t => t.id === id);
  const st = {}; teams.forEach(t => st[t.id] = { id: t.id, conf: confOf[t.id], w: 0, l: 0, t: 0, pf: 0, pa: 0 });
  const games = [];
  const rec = g => {
    const A = st[g.a], B = st[g.b]; A.pf += g.sa; A.pa += g.sb; B.pf += g.sb; B.pa += g.sa;
    if (g.sa > g.sb) { A.w++; B.l++; } else if (g.sb > g.sa) { B.w++; A.l++; } else { A.t++; B.t++; }
  };
  // calendário: 2 jogos contra cada time da própria conferência, 1 contra cada time da outra
  const sched = [];
  for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++) {
    const a = teams[i], b = teams[j];
    if (confOf[a.id] === confOf[b.id]) { sched.push([a, b, true]); sched.push([b, a, true]); }
    else sched.push(R() < .5 ? [a, b, false] : [b, a, false]);
  }
  const rounds = [];
  const reg = makeRounds(sched, teams);
  reg.forEach((rg, ri) => {
    const gs = rg.map(([a, b, inConf]) => { const g = simGame(a, b); g.stage = 'Temporada'; g.inConf = inConf; g.conf = inConf ? confOf[a.id] : -1; g.round = ri; games.push(g); rec(g); return g; });
    const playing = new Set(); gs.forEach(g => { playing.add(g.a); playing.add(g.b); });
    rounds.push({ kind: 'reg', label: `Rodada ${ri + 1} de ${reg.length}`, games: gs, bye: teams.filter(t => !playing.has(t.id)) });
  });
  const rank = rankRow;
  const table = Object.values(st).sort(rank);
  // mata-mata de cada conferência
  const po = [];
  const play = (a, b, stage, conf) => { const g = simGame(a, b, { noTie: true }); g.stage = stage; g.conf = conf; po.push(g); return g.sa > g.sb ? a : b; };
  const champs = confs.map((c, ci) => {
    c.table = c.ids.map(id => st[id]).sort(rank);
    c.seeds = c.table.map(r => by(r.id));
    c.q = qualifiers(c.ids.length);
    c.byes = nextPow2(c.q) - c.q;
    let alive = c.seeds.slice(0, c.q);
    while (alive.length > 1) {
      const S = nextPow2(alive.length), nb = S - alive.length, bye = alive.slice(0, nb), pl = alive.slice(nb), win = [];
      const stage = S >= 4 ? 'Semifinal da Conferência' : 'Final da Conferência';
      for (let i = 0; i < pl.length / 2; i++) win.push(play(pl[i], pl[pl.length - 1 - i], stage, ci));
      alive = bye.concat(win).sort((x, y) => c.seeds.indexOf(x) - c.seeds.indexOf(y));
    }
    c.champion = alive[0];
    return alive[0];
  });
  // Super Bowl: campeão de uma conferência contra o da outra
  const [x, y] = R() < .5 ? champs : champs.slice().reverse();
  const champion = champs.length > 1 ? play(x, y, 'Super Bowl', -1) : champs[0];
  po.sort((p, q) => STAGE_RANK[p.stage] - STAGE_RANK[q.stage]);
  const PL = { 'Semifinal da Conferência': 'Semifinais das conferências', 'Final da Conferência': 'Finais das conferências', 'Super Bowl': 'Super Bowl' };
  for (const stg of Object.keys(PL)) {
    const gs = po.filter(g => g.stage === stg); if (!gs.length) continue;
    gs.forEach(g => g.round = rounds.length);
    rounds.push({ kind: 'po', label: PL[stg], games: gs, bye: stg === 'Semifinal da Conferência' ? confs.flatMap(c => c.seeds.slice(0, c.byes)) : [] });
  }
  games.push(...po);
  return { confs, table, games, rounds, champion, finalists: champs.length > 1 ? [x, y] : [champs[0]] };
}

if (typeof module !== 'undefined') module.exports = { SPOT, SYN, SYN_CAP, synLinks, synPts, sideStarters, WEIGHT, SIM, POSSESSIONS, pTD, pFG, driveOdds, TAKE, SLOTS, POS_ORDER, OFF_POS, TOTAL_SLOTS, BUDGET, lineup, ratings, simGame, Auction, newBot, maxTeams, makePool, finishTeam, simSeason, drawConferences, buildTables, makeRounds, confName, qualifiers, MIN_TEAMS, MAX_CONF, need, slotsLeft, maxBid, duel, shortName, withSeed, mulberry32, rint, R };
