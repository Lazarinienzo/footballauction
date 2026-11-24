// ----- online (multiplayer) -----
// O servidor (Cloudflare) roda o leilão. Aqui o cliente guarda um espelho do Auction e só manda lance / passar.
const MP = { ws: null, code: '', create: false, pub: false, joined: false, left: true, tries: 0, lobby: null, host: false, seed: null, phase: 'lobby', list: [], poll: 0, pingT: 0, retryT: 0, nameT: 0, enter: false, newCode: 0, prev: null, copyT: 0 };
const vis = id => { const e = $('#' + id); return e && !e.hidden; };
const mpTok = () => {
  try { let k = sessionStorage.getItem('fa-tok'); if (!k) { k = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join(''); sessionStorage.setItem('fa-tok', k); } return k; }
  catch (e) { return MP._tok || (MP._tok = Math.random().toString(36).slice(2) + Date.now().toString(36) + 'xxxxxxxx'); }
};
const mpSend = o => { try { if (MP.ws && MP.ws.readyState === 1) MP.ws.send(JSON.stringify(o)); } catch (e) { } };
const netBanner = on => { $('#net').hidden = !on; };
const seatName = s => s.auto || !s.name ? emN(s.emb) : s.name;
const mpIsHost = () => !!(MP.lobby && MP.lobby.seats.some(s => s.uid === MP.lobby.you && s.host));
const mpOthers = () => MP.lobby ? MP.lobby.seats.filter(s => s.uid !== MP.lobby.you).map(s => ({ emb: s.emb, name: seatName(s) })) : [];

function mpConnect(code, create, pub) {
  if (MP.ws) { try { MP.ws.onclose = null; MP.ws.close(); } catch (e) { } }
  clearTimeout(MP.retryT);
  Object.assign(MP, { code, create, pub, joined: false, left: false, tries: 0, lobby: null, host: false, seed: null, phase: 'lobby', prev: null });
  G.mp = true; L.mp = true; L.bots = []; L.log = []; L.seen = new Set();
  mpOpen();
  clearInterval(MP.pingT); MP.pingT = setInterval(() => mpSend({ t: 'ping' }), 20000);
}
function mpOpen() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${MP.code}`); MP.ws = ws;
  ws.onopen = () => {
    netBanner(false);
    ws.send(JSON.stringify({ t: 'join', tok: mpTok(), name: L.auto ? '' : L.name, auto: L.auto, emb: L.emb, create: MP.create && !MP.joined, pub: MP.pub }));
  };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } mpMsg(m); };
  ws.onclose = () => {
    if (MP.ws !== ws) return; MP.ws = null; if (MP.left) return;
    if (!MP.joined) return mpFail(t('Não deu pra conectar. Tente de novo.'));
    netBanner(true); mpRetry();
  };
}
function mpRetry() {
  if (++MP.tries > 10) return mpFail(t('Conexão perdida.'));
  MP.retryT = setTimeout(() => { if (!MP.left) mpOpen(); }, Math.min(4000, 700 * MP.tries));
}
function mpFail(msg) {
  const wasIn = G.mp; mpLeave();
  if (wasIn) { show('online'); onSay(msg); onOpenPoll(); }
}
function mpLeave() {
  MP.left = true; clearTimeout(MP.retryT); clearInterval(MP.pingT);
  if (MP.ws) { const w = MP.ws; MP.ws = null; try { w.onclose = null; if (w.readyState === 1) w.send(JSON.stringify({ t: 'leave' })); w.close(); } catch (e) { } }
  if (G.mp) { cancelAnimationFrame(G.raf); G.A = null; }
  G.mp = false; L.mp = false; L.wasMp = true; L.bots = []; L.log = []; MP.lobby = null; netBanner(false);
}

function mpMsg(m) {
  switch (m.t) {
    case 'lobby': return mpLobby(m);
    case 'start': return mpStartMsg(m);
    case 's': return mpSnap(m);
    case 'end': return mpEnd(m);
    case 'season': MP.seed = m.seed; if (G.mp && vis('results') && !$('#season').hidden) svStart($('#season'), me().id, false); return;
    case 'closed': return mpFail(t('A sala foi encerrada.'));
    case 'err': {
      if (m.code === 'bug') return;
      if (m.code === 'exists' && MP.create && !MP.joined && MP.newCode++ < 8) return mpConnect(mkCode(), true, MP.pub);
      const msg = { none: 'Sala não encontrada. Confira o código.', started: 'O leilão dessa sala já começou.', full: 'Essa sala está cheia.', kicked: 'O anfitrião tirou você da sala.', tok: 'Erro de identificação. Recarregue a página.' }[m.code] || 'Não deu pra entrar na sala.';
      return mpFail(t(msg));
    }
  }
}

// ----- sala (antes do leilão) -----
function mpLobby(m) {
  MP.joined = true; MP.lobby = m; MP.host = mpIsHost(); MP.phase = 'lobby'; L.mp = true; L.code = m.code;
  const mine = m.seats.find(s => s.uid === m.you);
  if (mine) {
    L.emb = mine.emb;
    if (mine.auto) { L.auto = true; L.name = emN(L.emb); }
    const inp = $('#lb-name'); if (inp && document.activeElement !== inp) inp.value = L.name;
  }
  // boletim: quem entrou e quem saiu
  const prev = MP.prev, now = new Map(m.seats.map(s => [s.uid, s]));
  if (!prev) logL(MP.create ? 'Sala criada. Escolha sua franquia.' : 'Você entrou na sala.');
  else {
    for (const [u, s] of now) if (!prev.has(u)) logL('Entrou na sala: {n}', { n: seatName(s) });
    for (const [u, s] of prev) if (!now.has(u)) logL('Saiu da sala: {n}', { n: seatName(s) });
  }
  MP.prev = now;
  if (!vis('lobby')) { show('lobby'); }
  paintLobby();
}
function lobbyMode() {
  const on = !!L.mp;
  $('#lb-tag-l').hidden = on; $('#lb-tag-o').hidden = !on;
  const l = $('#lb-tk-l'), o = $('#lb-tk-o'); o.hidden = !on; l.hidden = on && true;
  if (!on && MP_ON) l.textContent = t('Sala de treino: você e os bots.');
  $('#lb-copy').hidden = !on; $('#lb-copy').textContent = t(MP.copyT ? 'Copiado!' : 'Copiar link');
}
function mpPaintSeats(seat) {
  const m = MP.lobby, host = mpIsHost(), me0 = m.seats.find(s => s.uid === m.you), rest = m.seats.filter(s => s.uid !== m.you);
  let h = seat('me', L.emb, L.name || t('Seu Time'), t(me0 && me0.host ? 'Você · anfitrião' : 'Você'), 'me');
  h += rest.map(s => {
    const nm = seatName(s), tag = s.kind === 'bot' ? t('Bot · pronto') : !s.on ? t('Reconectando…') : t(s.host ? 'Anfitrião' : 'Na sala');
    const x = host ? `<button class="x" data-rm="${s.uid}" aria-label="${esc(t('Tirar {n}', { n: nm }))}">×</button>` : '';
    return seat('u' + s.uid, s.emb, nm, tag, s.on ? '' : 'away', x);
  }).join('');
  if (host && m.seats.length < m.max) h += `<button class="seat dash" id="lb-add"><span class="plus">+</span><div class="sn"><b>${t('Adicionar bot')}</b><small>${t('Preenche a vaga')}</small></div></button>`;
  h += `<button class="seat dash" id="lb-invite"><span class="plus">＋</span><div class="sn"><b>${t('Convidar amigo')}</b><small>${t('Copiar o link da sala')}</small></div></button>`;
  $('#lb-seats').innerHTML = h;
}
function mpPaintGo(n) {
  if (mpIsHost()) return;
  $('#lb-go').textContent = t('Aguardando o anfitrião'); $('#lb-go').disabled = true;
  $('#lb-note').textContent = t('O anfitrião decide quando abrir o leilão.');
}
function mpSeatsClick(e) {
  if (e.target.closest('#lb-add')) { mpSend({ t: 'addBot' }); return; }
  if (e.target.closest('#lb-invite')) { mpCopy(); return; }
  const x = e.target.closest('[data-rm]'); if (x) mpSend({ t: 'rm', uid: +x.dataset.rm });
}
function mpName() { clearTimeout(MP.nameT); MP.nameT = setTimeout(() => mpSend({ t: 'name', name: L.auto ? '' : L.name }), 350); }
async function mpCopy() {
  const url = `${location.origin}/?sala=${MP.code}`;
  try { await navigator.clipboard.writeText(url); }
  catch (e) { if (navigator.share) { try { await navigator.share({ title: 'Touchdown Auction', url }); } catch (x) { } return; } window.prompt(t('Copie o link:'), url); return; }
  clearTimeout(MP.copyT); MP.copyT = setTimeout(() => { MP.copyT = 0; if (vis('lobby')) lobbyMode(); }, 1600); lobbyMode();
}
$('#lb-copy').onclick = mpCopy;

// ----- leilão online -----
function mpPool(list) { return list.map((p, i) => ({ id: i, name: p[0], pos: p[1], ovr: p[2], tm: p[3], passes: 0, sold: false })); }
function mpStartMsg(m) {
  MP.host = !!m.host; MP.phase = MP.phase === 'results' ? 'results' : 'auction';
  const same = G.A && G.mpCode === m.code && G.teams.length === m.teams.length && G.A.pool.length === m.pool.length;
  G.meId = m.you;
  if (same) { G.teams.forEach(t => { t.human = t.id === m.you; }); G.shownI = -2; return; }          // reconexão: o espelho continua valendo
  G.mpCode = m.code; MP.phase = 'auction';
  G.teams = m.teams.map(x => ({ id: x.id, name: x.auto || !x.name ? emN(x.emb) : x.name, emb: x.emb, human: x.id === m.you, hu: x.human, budget: BUDGET, roster: [], auto: [], persona: null }));
  G.name = G.teams[m.you].name;
  const A = Object.create(Auction.prototype);
  Object.assign(A, { pool: mpPool(m.pool), teams: G.teams, i: -1, log: [], done: false, now: 0, total: m.total, soldCount: 0, version: 0, phase: 'bidding', price: 0, leader: null, sold: null, passed: new Set(), bids: [], nBids: 0, elig: [], humanIn: true, timeLeft: LOT_MS, timeMax: LOT_MS, hold: 0, mirror: true });
  A.settle = A.sell = () => { };
  A.tick = function (dt) { if (this.hold > 0) { this.hold -= dt; return; } if (this.phase === 'bidding') this.timeLeft = Math.max(0, this.timeLeft - dt); };
  A.bid = function (team, amount) { if (this.hold > 0 || !Auction.prototype.bid.call(this, team, amount)) return false; mpSend({ t: 'bid', amount }); return true; };
  A.pass = function (team) { if (this.hold > 0 || !Auction.prototype.pass.call(this, team)) return false; mpSend({ t: 'pass' }); return true; };
  G.A = A; MP.enter = true;
}
function mpApplyTeams(list) {
  const A = G.A;
  list.forEach((x, k) => { const t = G.teams[k]; t.budget = x.b; t.roster = x.r.map(([id, paid]) => { const p = A.pool[id]; return { name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id, paid }; }); t.auto = x.au.map(id => A.pool[id]); });
  A.pool.forEach(p => { p.sold = false; }); G.teams.forEach(t => t.roster.forEach(p => { A.pool[p.id].sold = true; }));
}
function mpSnap(s) {
  const A = G.A; if (!A || !G.mp || MP.phase !== 'auction') return;
  const T = id => G.teams[id], P = id => A.pool[id];
  if (s.teams) {
    mpApplyTeams(s.teams);
    A.log = (s.lg || []).map(l => ({ player: P(l[0]), team: l[1] < 0 ? null : T(l[1]), price: l[2], note: l[3] || undefined }));
  }
  Object.assign(A, { i: s.i, phase: s.ph, price: s.pr, leader: s.ld == null ? null : T(s.ld), timeLeft: s.tl, timeMax: s.tm, humanIn: s.hi, nBids: s.nb, soldCount: s.sc, version: s.v, hold: s.hold || 0,
    passed: new Set(s.ps.map(T)), elig: s.el.map(T), bids: s.bd.map(b => ({ team: T(b[0]), kind: b[1], price: b[2], inc: b[3], first: !!b[4] })),
    sold: s.sd ? { player: P(s.sd[0]), team: s.sd[1] < 0 ? null : T(s.sd[1]), price: s.sd[2], note: s.sd[3] || undefined } : null });
  if (MP.enter) { MP.enter = false; mpEnter(); }
}
function mpEnter() {
  Object.assign(G, { shownI: -2, shownV: -1, fracShown: 1, phaseSeen: '', leaderKey: '', lastPrice: 0, flashedV: -1, btnKey: '', feedKey: '', season: null });
  $('#season').hidden = true; $('#season').innerHTML = '';
  $('#table').innerHTML = G.teams.map(t => `<div class="trow">${badge(t.emb, 26)}<span>${esc(t.name)}${t.human ? ' (' + tt('você') + ')' : ''}</span><span class="b num"></span><span class="v"></span><span class="bb"><i></i></span></div>`).join('');
  $('#a-bud')._shown = BUDGET; $('#a-bud')._to = BUDGET; $('#a-bud').textContent = dollars(BUDGET);
  show('auction'); paintAuction(true, 16);
  cancelAnimationFrame(G.raf); G.last = performance.now(); G.raf = requestAnimationFrame(frame);
}
function mpEnd(m) {
  if (!G.A || !G.mp) return;
  MP.seed = m.seed; mpApplyTeams(m.teams);
  if (MP.phase === 'results') return;
  MP.phase = 'results'; G.A.done = true; G.A.phase = 'done';
  if (MP.enter) { MP.enter = false; mpEnter(); }          // entrou só no fim (reconexão): a próxima volta do relógio abre os resultados
}

// ----- tela "online": criar, entrar por código e lista de salas públicas -----
function onSay(msg) { $('#on-msg').textContent = msg || ''; }
function onOpenPoll() {
  clearInterval(MP.poll); onRefresh();
  MP.poll = setInterval(() => { if (!vis('online')) { clearInterval(MP.poll); return; } onRefresh(); }, 5000);
}
function onOpen() { onSay(''); show('online'); onOpenPoll(); }
async function onRefresh() {
  try { const r = await fetch('/api/rooms', { cache: 'no-store' }); MP.list = (await r.json()).rooms || []; } catch (e) { MP.list = null; }
  if (vis('online')) onList();
}
function onList() {
  const el = $('#on-list'), L2 = MP.list;
  if (L2 === null) { el.innerHTML = `<div class="empty">${t('Não consegui carregar a lista.')}</div>`; return; }
  if (!L2.length) { el.innerHTML = `<div class="empty">${t('Nenhuma sala pública aberta agora. Crie a sua!')}</div>`; return; }
  el.innerHTML = L2.map(r => `<div class="seat">${badge(r.emb, 44)}<div class="sn"><b>${esc(r.auto || !r.host ? emN(r.emb) : r.host)}</b><small>${r.n}/${r.max} · ${r.code}</small></div><button class="go" data-join="${r.code}">${t('Entrar')}</button></div>`).join('');
}
function onJoin(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (code.length !== 4) { onSay(t('Digite o código de 4 letras.')); return; }
  onSay(''); MP.newCode = 0; mpConnect(code, false, false);
}
function onCreate(pub) { onSay(''); MP.newCode = 0; mpConnect(mkCode(), true, pub); }
$('#go-online').onclick = onOpen;
$('#on-back').onclick = () => { clearInterval(MP.poll); show('setup'); };
$('#on-priv').onclick = () => onCreate(false);
$('#on-pub').onclick = () => onCreate(true);
$('#on-join').onclick = () => onJoin($('#on-code').value);
$('#on-code').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''); };
$('#on-code').onkeydown = e => { if (e.key === 'Enter') onJoin(e.target.value); };
$('#on-refresh').onclick = onRefresh;
$('#on-list').onclick = e => { const b = e.target.closest('[data-join]'); if (b) onJoin(b.dataset.join); };

if (MP_ON) {
  $('#go-online').hidden = false; $('#go-solo').hidden = false; $('#go-lobby').hidden = true;
  $('#join-off').hidden = true; $('#note-off').hidden = true; $('#lead-off').hidden = true; $('#lead-on').hidden = false;
  // link de convite: ?sala=ABCD
  try {
    const c = (new URLSearchParams(location.search).get('sala') || '').toUpperCase();
    if (/^[A-Z2-9]{4}$/.test(c)) { history.replaceState(null, '', location.pathname); setTimeout(() => { onOpen(); $('#on-code').value = c; onJoin(c); }, 0); }
  } catch (e) { }
}
