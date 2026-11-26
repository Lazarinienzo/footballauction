// Motor do jogo: leilão, duelos e simulação de partidas.
const SLOTS = { QB: 1, RB: 1, WR: 2, TE: 1, OL: 3, EDGE: 2, DT: 2, LB: 2, CB: 2 };
const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'OL', 'EDGE', 'DT', 'LB', 'CB'];
const OFF_POS = ['QB', 'RB', 'WR', 'TE', 'OL'];
const TOTAL_SLOTS = 16, BUDGET = 200;
// Modo com reservas: 20 jogadores = os 16 da formação padrão (mínimo de cada posição) + 4 reservas LIVRES, de qualquer posição.
const BENCH_TOTAL = 20;
// Formações (só no modo com reservas): quantos titulares cada posição tem. Padrão = a do jogo clássico.
const FORMS = {
  // ataque: std = Singleback, w3 = Trips, te2 = Double TE, jb = Jumbo (4 OL). defesa: std = Base, cb3 = Nickel, lb3 = 3-4, dime = Dime (4 CB), blz = Blitz (4 EDGE)
  off: { std: { WR: 2, TE: 1 }, w3: { WR: 3, TE: 0 }, te2: { WR: 1, TE: 2 }, jb: { OL: 4, WR: 1, TE: 1 } },
  def: { std: { DT: 2, LB: 2, CB: 2 }, cb3: { DT: 2, LB: 1, CB: 3 }, lb3: { DT: 1, LB: 3, CB: 2 }, dime: { DT: 1, LB: 1, CB: 4 }, blz: { EDGE: 4, DT: 1, LB: 1, CB: 2 } }
};
const STD = { off: 'std', def: 'std' };
const formSlots = f => ({ QB: 1, RB: 1, OL: 3, EDGE: 2, ...FORMS.off[(f || STD).off], ...FORMS.def[(f || STD).def] });
// configura o time pro modo do leilão (cada time carrega suas vagas, então o servidor pode ter várias salas ao mesmo tempo)
function cfgTeam(t, bench) { t.bench = !!bench; t.slots = SLOTS; t.total = bench ? BENCH_TOTAL : TOTAL_SLOTS; if (!t.form) t.form = { ...STD }; return t; }
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
// order (opcional): { WR: [id, id], OL: [id, id, id], ... } = em que vaga do campo cada titular joga. Sem order, o melhor OVR ocupa a primeira vaga.
// form (opcional) = formação { off, def }: define quantas vagas cada posição tem. L.S[pos] = jogadores nas vagas (undefined = vaga vazia).
function lineup(roster, order, form) {
  form = form || STD; const fs = formSlots(form), S = {};
  for (const pos of POS_ORDER) {
    const sorted = roster.filter(x => x.pos === pos).sort((a, b) => b.ovr - a.ovr);
    S[pos] = Array.from({ length: fs[pos] }, (_, i) => order && Array.isArray(order[pos]) ? roster.find(x => x.id === order[pos][i] && x.pos === pos) : sorted[i]);
  }
  return { QB: S.QB[0], RB: S.RB[0], WR: S.WR, TE: S.TE[0], OL: S.OL, EDGE: S.EDGE, DT: S.DT, LB: S.LB, CB: S.CB, S, form };
}
// Peso de cada posição no OVR do time. A base é 1,0x; a média é sempre dividida pela soma dos pesos, então a escala do OVR não muda.
const WEIGHT = { QB: 2.5, RB: 1.0, WR: 1.5, TE: 1.0, OL: 1.0, EDGE: 2.0, DT: 1.0, LB: 1.5, CB: 1.5 };   // base 1,0x; degraus 1,5x e 2,0x; o QB vale 2,5x
// Peso de cada posição em cada formação (degraus de 0,5, nunca abaixo de 1,0x). A média é dividida pela soma dos pesos, então subir o foco
// da formação tira importância relativa das outras posições. A padrão é a de sempre.
const FW = {
  off: {
    std: { QB: 2.5, RB: 1, WR: 1.5, TE: 1, OL: 1 },
    w3: { QB: 3.5, RB: 1, WR: 2.5, TE: 1, OL: 1 },      // 3 WR, sem TE: passe manda, linha e RB ficam em segundo plano
    te2: { QB: 2, RB: 2.5, WR: 1.5, TE: 2, OL: 2 },     // 2 TE: jogo corrido e de bloqueio, o QB e o único WR perdem peso relativo
    jb: { QB: 2, RB: 1.5, WR: 1, TE: 1.5, OL: 1 }       // Jumbo (4 OL): são 4 jogadores na linha, então ela pesa mais no total sem subir o peso de cada um
  },
  def: {
    std: { EDGE: 2, DT: 1, LB: 1.5, CB: 1.5 },
    cb3: { EDGE: 2, DT: 1, LB: 1, CB: 2.5 },            // 3 CB, 1 LB: a secundária manda
    lb3: { EDGE: 2, DT: 1, LB: 2.5, CB: 1 },          // 3 LB, 1 DT: o meio manda
    dime: { EDGE: 2, DT: 1, LB: 1, CB: 2.5 },         // 4 CB: anti-passe total
    blz: { EDGE: 1.5, DT: 1, LB: 1, CB: 1.5 }          // 4 EDGE: pressão máxima (4 jogadores de 1,5x)
  }
};
const wOf = (side, f, pos) => FW[side][f][pos];
// Posições no campo (x, y em "casas"): o desenho da tela e as sinergias usam as MESMAS coordenadas.
// [posição, índice (0 = melhor OVR da posição), x, y]
const SPOT = {
  off: {
    std: [['OL', 0, 1.5, 0], ['OL', 1, 2.5, 0], ['OL', 2, 3.5, 0], ['TE', 0, 4.5, 0], ['WR', 0, 1, 1], ['QB', 0, 2.5, 1], ['WR', 1, 4, 1], ['RB', 0, 2.5, 2]],
    w3: [['OL', 0, 1.5, 0], ['OL', 1, 2.5, 0], ['OL', 2, 3.5, 0], ['WR', 2, 4.5, 0], ['WR', 0, 1, 1], ['QB', 0, 2.5, 1], ['WR', 1, 4, 1], ['RB', 0, 2.5, 2]],
    te2: [['TE', 1, 0.5, 0], ['OL', 0, 1.5, 0], ['OL', 1, 2.5, 0], ['OL', 2, 3.5, 0], ['TE', 0, 4.5, 0], ['WR', 0, 1, 1], ['QB', 0, 2.5, 1], ['RB', 0, 2.5, 2]],
    jb: [['TE', 0, 0.5, 0], ['OL', 0, 1.5, 0], ['OL', 1, 2.5, 0], ['OL', 2, 3.5, 0], ['OL', 3, 4.5, 0], ['WR', 0, 1, 1], ['QB', 0, 2.5, 1], ['RB', 0, 2.5, 2]]
  },
  def: {
    std: [['CB', 0, 1, 0], ['CB', 1, 4, 0], ['LB', 0, 2, 1], ['LB', 1, 3, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2, 2], ['DT', 1, 3, 2], ['EDGE', 1, 4, 2]],
    cb3: [['CB', 0, 1, 0], ['CB', 2, 2.5, 0], ['CB', 1, 4, 0], ['LB', 0, 2.5, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2, 2], ['DT', 1, 3, 2], ['EDGE', 1, 4, 2]],
    lb3: [['CB', 0, 1, 0], ['CB', 1, 4, 0], ['LB', 0, 1.5, 1], ['LB', 1, 2.5, 1], ['LB', 2, 3.5, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2.5, 2], ['EDGE', 1, 4, 2]],
    dime: [['CB', 0, 1, 0], ['CB', 2, 2, 0], ['CB', 3, 3, 0], ['CB', 1, 4, 0], ['LB', 0, 2.5, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2.5, 2], ['EDGE', 1, 4, 2]],
    blz: [['CB', 0, 1, 0], ['CB', 1, 4, 0], ['EDGE', 2, 1, 1], ['LB', 0, 2.5, 1], ['EDGE', 3, 4, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2.5, 2], ['EDGE', 1, 4, 2]]
  }
};
const SYN_DIST = 1.6;   // só jogadores vizinhos no campo se conectam
// Titulares de cada lado, com o peso e o lugar da posição.
function sideStarters(L, side) {
  return SPOT[side][(L.form || STD)[side]].map(([pos, i, x, y]) => ({ pos, i, x, y, p: L.S[pos][i], w: wOf(side, (L.form || STD)[side], pos) }));
}
// SINERGIA: dois titulares do MESMO lado, do mesmo time da NFL e VIZINHOS no campo formam um link.
// Cada link soma +SYN_W no PESO dos dois jogadores (RB 1,0x ligado ao QB vira 1,1x; o QB vai de 2,5x a 2,6x), e o peso extra
// conta inteiro no OVR do lado (a média continua dividida pelo peso base, então é bônus de verdade). Teto de SYN_CAP pontos por lado.
const SYN_W = 0.1, SYN_CAP = 4;
const sideW = (side, f) => SPOT[side][f].reduce((n, q) => n + wOf(side, f, q[0]), 0);   // soma dos pesos da formação do lado
function synLinks(L, side) {
  const xs = sideStarters(L, side).filter(x => x.p && x.p.tm), out = [];
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++)
    if (xs[i].p.tm === xs[j].p.tm && Math.hypot(xs[i].x - xs[j].x, xs[i].y - xs[j].y) <= SYN_DIST)
      out.push({ a: xs[i].p, b: xs[j].p, pa: xs[i].pos, pb: xs[j].pos, tm: xs[i].p.tm, pts: SYN_W * (xs[i].p.ovr + xs[j].p.ovr) / sideW(side, (L.form || STD)[side]) });
  return out;
}
// links, peso extra de cada jogador (id -> +x, já com o teto aplicado) e pontos de OVR que a sinergia dá ao lado
function synInfo(L, side) {
  const links = synLinks(L, side), bw = new Map(); let raw = 0;
  for (const l of links) { raw += l.pts; for (const q of [l.a, l.b]) bw.set(q.id, (bw.get(q.id) || 0) + SYN_W); }
  const k = raw > SYN_CAP ? SYN_CAP / raw : 1;
  if (k < 1) for (const [id, v] of bw) bw.set(id, v * k);
  return { links, bw, pts: raw * k, raw, capped: k < 1 };
}
// OVR do ataque / da defesa = média PONDERADA dos 8 titulares do lado + bônus de sinergia.
function ratings(L) {
  const wavg = side => { const xs = sideStarters(L, side).filter(x => x.p); return xs.length ? xs.reduce((n, x) => n + x.p.ovr * x.w, 0) / xs.reduce((n, x) => n + x.w, 0) : 0; };   // vagas abertas (Sandbox) ficam fora da média
  const off = wavg('off') + synInfo(L, 'off').pts;
  const def = wavg('def') + synInfo(L, 'def').pts;
  return { off, def, all: (off + def) / 2 };
}

// ---------- arranjo no campo: em que vaga cada titular joga ----------
// Completa e valida um arranjo { pos: [id|null, ...] } pra formação dada: ignora ids que não estão no elenco, corta o que passa das vagas
// (vai pro banco) e põe nas vagas livres o melhor OVR que estiver no banco. Quem não está nas vagas é reserva.
function normOrder(roster, order, form) {
  const out = {}, fs = formSlots(form);
  for (const pos of POS_ORDER) {
    const have = roster.filter(p => p.pos === pos), ids = new Set(have.map(p => p.id)), slots = Array(fs[pos]).fill(null);
    (order && Array.isArray(order[pos]) ? order[pos] : []).forEach((id, i) => { if (i < slots.length && id != null && ids.has(id) && !slots.includes(id)) slots[i] = id; });
    const rest = have.filter(p => !slots.includes(p.id)).sort((a, b) => b.ovr - a.ovr);
    for (let i = 0; i < slots.length && rest.length; i++) if (slots[i] == null) slots[i] = rest.shift().id;
    out[pos] = slots;
  }
  return out;
}
const validForm = f => { const o = {}; for (const sd of ['off', 'def']) o[sd] = f && FORMS[sd][f[sd]] ? f[sd] : 'std'; return o; };   // formações valem em todos os modos
// a formação do lado só dá pra montar se o elenco tem jogadores de sobra em cada posição dela
const feasible = (roster, side, f) => { const fs = formSlots({ ...STD, [side]: f }); return [...new Set(SPOT[side][f].map(q => q[0]))].every(pos => roster.filter(p => p.pos === pos).length >= fs[pos]); };
const kperms = (a, k) => k <= 0 ? [[]] : a.length === 0 ? [Array(k).fill(null)] : a.flatMap((x, i) => kperms(a.filter((_, j) => j !== i), k - 1).map(r => [x, ...r]));
// melhor plano (formação + quem joga onde) pra um elenco: maximiza o OVR de cada lado (média ponderada + sinergia). Usado pelos bots.
function autoPlan(roster, bench, stdOnly) {
  const form = { ...STD }; let order = normOrder(roster, null, form);
  for (const side of ['off', 'def']) {
    let best = null;
    for (const f of Object.keys(FORMS[side])) {
      if (f !== 'std' && (stdOnly || !feasible(roster, side, f))) continue;
      const fm = { ...form, [side]: f }, base = normOrder(roster, order, fm), fs = formSlots(fm);
      const poss = [...new Set(SPOT[side][f].map(q => q[0]))], pools = poss.map(pos => kperms(roster.filter(x => x.pos === pos).map(x => x.id), fs[pos]));
      const go = (k, cur) => {
        if (k === poss.length) { const o = { ...base, ...cur }, v = ratings(lineup(roster, o, fm))[side]; if (!best || v > best.v + 1e-9) best = { v, f, o }; return; }
        for (const pm of pools[k]) go(k + 1, { ...cur, [poss[k]]: pm });
      };
      go(0, {});
    }
    form[side] = best.f; order = normOrder(roster, best.o, form);
  }
  return { form, order };
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
const slotsLeft = t => (t.total || TOTAL_SLOTS) - t.roster.length;
// vagas obrigatórias que faltam na posição (o mínimo é a formação padrão) e reservas livres (qualquer posição) que ainda restam
// A formação do time define quantos titulares de cada posição ele precisa; o modo com reservas soma 4 vagas livres por cima.
const mand = (t, pos) => Math.max(0, formSlots(t.form)[pos] - t.roster.filter(p => p.pos === pos).length);
const freeSlots = t => Math.max(0, slotsLeft(t) - POS_ORDER.reduce((n, pos) => n + mand(t, pos), 0));
const need = (t, pos) => mand(t, pos) + freeSlots(t);
// dá pra trocar pra formação f? Só se o elenco ainda couber nela e der pra completar as vagas que faltam
const canForm = (t, f) => { const fs = formSlots(f); return POS_ORDER.reduce((n, pos) => n + Math.max(0, fs[pos] - t.roster.filter(p => p.pos === pos).length), 0) <= slotsLeft(t); };
const maxBid = (t, p) => need(t, p.pos) <= 0 ? 0 : Math.max(0, t.budget - (slotsLeft(t) - 1));

const FMAX = POS_ORDER.reduce((o, pos) => (o[pos] = Math.max(...[...Object.values(FORMS.off), ...Object.values(FORMS.def)].map(f => f[pos] != null ? f[pos] : SLOTS[pos])), o), {});
const posNeed = (pos, n, free) => Math.ceil((SLOTS[pos] + (FMAX[pos] - SLOTS[pos]) / 2) * n) + Math.ceil((free || 0) * n / POS_ORDER.length);   // sobra pra quem escolher formação com mais jogadores na posição   // reservas livres: espalha a demanda por todas as posições
function maxTeams(db, free) {
  const c = {}; db.forEach(p => c[p.pos] = (c[p.pos] || 0) + 1);
  return Math.min(...POS_ORDER.map(pos => { let n = 0; while (posNeed(pos, n + 1, free) <= (c[pos] || 0)) n++; return n; }));
}
function makePool(db, n, extra, free) {
  extra = extra == null ? .5 : extra;           // sobra de jogadores por posição (50% a mais, mínimo +2)
  const pool = [];
  for (const pos of POS_ORDER) {
    const all = db.filter(p => p.pos === pos), need = posNeed(pos, n, free);
    const take = Math.min(all.length, need + Math.max(2, Math.ceil(need * extra)));
    pool.push(...shuffle(all).slice(0, take));
  }
  return shuffle(pool).map((p, i) => ({ ...p, id: i, passes: 0, sold: false }));
}
function newBot(id, name, bench) {
  const pos = {}; POS_ORDER.forEach(p => pos[p] = .8 + R() * .45);
  const t = cfgTeam({ id, name, human: false, budget: BUDGET, roster: [], persona: { aggr: .85 + R() * .35, pos } }, bench);
  const pick = sd => { const alt = Object.keys(FORMS[sd]).filter(f => f !== 'std'); return R() < .6 ? 'std' : alt[rint(0, alt.length - 1)]; };
  t.form = { off: pick('off'), def: pick('def') };      // bot escolhe a formação desde o começo (é pública)
  return t;
}

class Auction {
  constructor(teams, db, extra) {
    this.teams = teams; this.pool = makePool(db, teams.length, extra, (teams[0].total || TOTAL_SLOTS) - TOTAL_SLOTS); this.i = -1; this.log = []; this.done = false; this.now = 0;
    this.total = teams.length * (teams[0].total || TOTAL_SLOTS); this.soldCount = 0; this.version = 0;
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
  demand(pos) { return this.teams.reduce((n, t) => n + mand(t, pos), 0); }                         // vagas obrigatórias ainda abertas (reserva é opcional)
  limit(t, p) {
    const s = this.stats[p.pos], z = (p.ovr - s.m) / s.sd, q = clamp(1 + .6 * z, .3, 2.8);
    // sobrou jogador na posição? bot sem pressa deixa os fracos passarem (até 2 vezes)
    if (this.supply(p.pos) > this.demand(p.pos) && p.passes < 2 && z < -.3 && R() < clamp((-z - .2) * .7, 0, .9)) return 0;
    const reserve = mand(t, p.pos) === 0;        // esse lote só serviria de reserva (ou de upgrade): bot paga menos e ignora jogador comum
    if (reserve && p.passes < 2 && z < .4) return 0;
    const urg = 1 + .6 * (1 - slotsLeft(t) / (t.total || TOTAL_SLOTS));
    const syn = 1 + .07 * Math.min(3, t.roster.filter(x => x.tm && x.tm === p.tm && (OFF_POS.includes(x.pos) === OFF_POS.includes(p.pos))).length);   // bot paga um pouco mais por quem liga com o elenco
    const share = Math.max(1, POS_ORDER.reduce((n, pos) => n + mand(t, pos), 0) + freeSlots(t) * .35);
    let w = (t.budget / share) * (reserve ? .5 : 1) * q * POSW[p.pos] * t.persona.aggr * t.persona.pos[p.pos] * urg * syn * (.85 + R() * .3);
    if (slotsLeft(t) === 1) w = Math.max(w, t.budget * .7);
    return clamp(Math.round(w), 1, maxBid(t, p));
  }
  next() {
    if (this.soldCount >= this.total) { this.done = true; this.phase = 'done'; return; }
    const n = this.pool.length; let found = -1;
    for (let k = 1; k <= n; k++) { const j = (this.i + k + n) % n, q = this.pool[j]; if (!q.sold && !q.deferred && this.teams.some(t => need(t, q.pos) > 0)) { found = j; break; } }
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
    for (const t of shuffle(this.teams.filter(x => slotsLeft(x) > 0))) {
      const give = p => {
        const price = Math.min(1, t.budget); t.budget -= price; t.roster.push({ name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id: p.id, paid: price });
        p.sold = true; this.soldCount++; (t.auto = t.auto || []).push(p);
        this.log.unshift({ player: p, team: t, price, note: 'sorteio no fim' }); this.log.length = Math.min(this.log.length, 40);
      };
      for (const pos of POS_ORDER) while (mand(t, pos) > 0) { const c = this.pool.filter(p => p.pos === pos && !p.sold); if (!c.length) break; give(c[rint(0, c.length - 1)]); }
      while (freeSlots(t) > 0) { const c = this.pool.filter(p => !p.sold); if (!c.length) break; give(c[rint(0, c.length - 1)]); }   // reservas livres: sobras de qualquer posição
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
function finishTeam(t) {
  if (t.order) {
    t.form = validForm(t.form, t.bench);
    const bad = ['off', 'def'].filter(sd => t.form[sd] !== 'std' && !feasible(t.roster, sd, t.form[sd]));     // formação escolhida sem jogador suficiente: o jogo escolhe a melhor viável
    if (bad.length) { const pl = autoPlan(t.roster, t.bench); bad.forEach(sd => t.form[sd] = pl.form[sd]); }
    t.order = normOrder(t.roster, t.order, t.form);
  }
  else { const pl = autoPlan(t.roster, t.bench); t.form = pl.form; t.order = pl.order; }
  t.lineup = lineup(t.roster, t.order, t.form); t.rt = ratings(t.lineup); return t;
}
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

// ---------- modo Duelo (1 contra 1): cartas viradas, posição por posição ----------
// Cada rodada sorteia uma posição. Cada jogador tem o SEU tabuleiro de n cartas (as mesmas pessoas podem aparecer nos dois). Vira f às cegas e escolhe k entre as viradas.
// Quem começa alterna a cada rodada; quem joga depois vê o que o outro virou. Formação padrão pros dois.
const DU_CFG = { QB: { n: 9, f: 3, k: 1 }, RB: { n: 9, f: 3, k: 1 }, WR: { n: 9, f: 3, k: 2 }, TE: { n: 9, f: 3, k: 1 }, OL: { n: 9, f: 4, k: 3 }, EDGE: { n: 9, f: 3, k: 2 }, DT: { n: 9, f: 3, k: 2 }, LB: { n: 9, f: 3, k: 2 }, CB: { n: 9, f: 3, k: 2 } };
// raridade no sorteio do tabuleiro: chance por carta de ser diamante (90+) e ouro (80–89); o resto é bronze (70–79). Se a faixa não existe na posição, a chance vai pra faixa de baixo (o diamante não cresce).
const BUILD = 'dev';   // o build.py troca pelo hash dos fontes: cliente e servidor comparam pra avisar quando a página está desatualizada
const DU_RARE = { d: .035, g: .35 };
function duDraw(all, n) {
  const B = [[], [], []]; shuffle(all).forEach(p => B[p.ovr >= 90 ? 2 : p.ovr >= 80 ? 1 : 0].push(p.id));
  const out = [];
  while (out.length < n) {
    const r = R(), want = r < DU_RARE.d ? 2 : r < DU_RARE.d + DU_RARE.g ? 1 : 0;
    const tier = [[0, 1, 2], [1, 0, 2], [2, 1, 0]][want].find(k => B[k].length); if (tier == null) break;
    out.push(B[tier].pop());
  }
  return shuffle(out);
}
const DU_TURN_MS = 30000;
const DU_EXTRA = { first: 7500, round: 12900, swap: 7900 };   // tempo extra no relógio do turno pras animações (sorteio, cartas entrando e saindo da mesa)
class Duelo {
  constructor(db, o) {
    o = o || {}; this.db = db.map((p, i) => ({ ...p, id: i })); this.show = !!o.show;
    this.first = o.first != null ? o.first : rint(0, 1); this.rounds = shuffle(POS_ORDER); this.r = 0; this.picks = [[], []]; this.done = false; this.draw();
  }
  get pos() { return this.rounds[this.r]; }
  get cfg() { return DU_CFG[this.pos]; }
  draw() {
    const pos = this.pos, c = DU_CFG[pos], all = this.db.filter(p => p.pos === pos);
    this.prev = this.board ? this.board.map(b => b.slice()) : null;       // tabuleiros da rodada anterior (pra revelar o que ficou de fora)
    this.board = [0, 1].map(() => duDraw(all, c.n));
    this.fl = [[], []]; this.sel = [[], []]; this.ok = [false, false]; this.cur = (this.r + this.first) % 2;
  }
  flip(p, i) { const c = this.cfg; if (this.done || p !== this.cur || this.ok[p] || !Number.isInteger(i) || i < 0 || i >= c.n || this.fl[p].includes(i) || this.fl[p].length >= c.f) return false; this.fl[p].push(i); return true; }
  pick(p, i) {
    const c = this.cfg; if (this.done || p !== this.cur || this.ok[p] || this.fl[p].length < c.f || !this.fl[p].includes(i)) return false;
    const s = this.sel[p], k = s.indexOf(i); if (k >= 0) s.splice(k, 1); else { if (s.length >= c.k) s.shift(); s.push(i); } return true;
  }
  confirm(p) {
    const c = this.cfg; if (this.done || p !== this.cur || this.ok[p] || this.sel[p].length !== c.k) return false;
    this.ok[p] = true; this.picks[p].push(...this.sel[p].map(i => this.board[p][i]));
    if (this.ok[1 - p]) { if (++this.r >= this.rounds.length) this.done = true; else this.draw(); } else this.cur = 1 - p;
    return true;
  }
  // jogada automática (tempo esgotado, jogador fora, bot): vira ao acaso e fica com os melhores OVR. noise > 0 deixa o bot menos perfeito.
  auto(p, noise) {
    if (this.done || p !== this.cur || this.ok[p]) return false;
    const c = this.cfg, rest = shuffle([...Array(c.n).keys()].filter(i => !this.fl[p].includes(i)));
    while (this.fl[p].length < c.f) this.fl[p].push(rest.shift());
    const sc = i => this.db[this.board[p][i]].ovr + (noise ? (R() - .5) * 2 * noise : 0);
    this.sel[p] = this.fl[p].slice().sort((a, b) => sc(b) - sc(a)).slice(0, c.k);
    return this.confirm(p);
  }
  // o que o jogador p pode ver: só as cartas viradas (as fechadas nem saem do servidor); as escolhas do rival aparecem quando ele confirma
  view(p) {
    const q = 1 - p, side = x => ({ cards: this.board[x].map((id, i) => this.ok[x] || this.fl[x].includes(i) ? id : null),   // quem já confirmou mostra o tabuleiro todo (o que ficou de fora)
     fl: this.fl[x].slice(), sel: x === p || this.ok[x] ? this.sel[x].slice() : [], ok: this.ok[x] });
    return { r: this.r, of: this.rounds.length, rounds: this.rounds, pos: this.done ? null : this.pos, cfg: this.done ? null : this.cfg, cur: this.cur, first: this.first, show: this.show, done: this.done, me: side(p), opp: side(q), picks: [this.picks[p].slice(), this.picks[q].slice()], prev: this.prev ? { me: this.prev[p].slice(), opp: this.prev[q].slice() } : null };
  }
  // times montados (formação padrão pros dois), prontos pra simular
  teams(info) {
    return [0, 1].map(p => {
      const roster = this.picks[p].map(id => ({ ...this.db[id], paid: 0 }));
      const t = cfgTeam({ id: p, name: (info && info[p] && info[p].name) || 'T' + p, emb: info && info[p] ? info[p].emb : p, human: true, budget: 0, roster }, false);
      t.form = { ...STD }; t.order = autoPlan(roster, false, true).order; return finishTeam(t);
    });
  }
}
function duelGame(teams, seed) { return withSeed(seed, () => simGame(teams[0], teams[1], { noTie: true })); }

if (typeof module !== 'undefined') module.exports = { SPOT, FORMS, STD, BENCH_TOTAL, FW, wOf, feasible, canForm, mand, freeSlots, formSlots, cfgTeam, validForm, SYN_W, SYN_CAP, synLinks, synInfo, normOrder, autoPlan, sideStarters, WEIGHT, SIM, POSSESSIONS, pTD, pFG, driveOdds, TAKE, SLOTS, POS_ORDER, OFF_POS, TOTAL_SLOTS, BUDGET, lineup, ratings, simGame, Auction, newBot, maxTeams, makePool, finishTeam, simSeason, drawConferences, buildTables, makeRounds, confName, qualifiers, MIN_TEAMS, MAX_CONF, need, slotsLeft, maxBid, duel, shortName, withSeed, mulberry32, rint, R, Duelo, duelGame, DU_CFG, DU_TURN_MS, DU_EXTRA };
