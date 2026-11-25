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

function mpConnect(code, create, pub, pw) {
  if (MP.ws) { try { MP.ws.onclose = null; MP.ws.close(); } catch (e) { } }
  clearTimeout(MP.retryT);
  Object.assign(MP, { code, create, pub, pw: pw || '', joined: false, left: false, tries: 0, lobby: null, host: false, seed: null, phase: 'lobby', prev: null });
  G.mp = true; L.mp = true; L.bots = []; L.log = []; L.seen = new Set();
  mpOpen();
  clearInterval(MP.pingT); MP.pingT = setInterval(() => mpSend({ t: 'ping' }), 20000);
}
function mpOpen() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${MP.code}`); MP.ws = ws;
  ws.onopen = () => {
    netBanner(false);
    ws.send(JSON.stringify({ t: 'join', tok: mpTok(), name: L.auto ? '' : L.name, auto: L.auto, emb: L.emb, create: MP.create && !MP.joined, pub: MP.pub, pw: MP.pw }));
  };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } mpMsg(m); };
  ws.onclose = () => {
    if (MP.ws !== ws) return; MP.ws = null; if (MP.left) return;
    if (!MP.joined) return mpFail(t('Não deu pra conectar. O servidor pode estar lotado ou fora do ar. Tente de novo em alguns minutos.'));
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
function mpSave() { MP.wasIn = true; try { sessionStorage.setItem('fa-room', JSON.stringify({ code: MP.code, pw: MP.pw || '' })); } catch (e) { } }
function mpForget() { MP.wasIn = false; MP.rejoin = false; try { sessionStorage.removeItem('fa-room'); } catch (e) { } }
function mpLeave() {
  mpForget(); MP.left = true; clearTimeout(MP.retryT); clearInterval(MP.pingT);
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
    case 'season': MP.seed = m.seed; if (G.mp && vis('results')) { svStart($('#season'), me().id, false); $('#sim').textContent = t('Refazer temporada'); $('#sim').hidden = !MP.host; $('#sim-wait').hidden = true; $('#season').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); } return;
    case 'resume': MP.resume = m; if (G.mp && vis('results')) mpResume(m); return;
    case 'round': if (G.mp && vis('results') && SV.S && SV.done === m.n && !LV.running) { svStartRound(); if (MP.watch != null) { svOpen(MP.watch); MP.watch = null; } } return;
    case 'closed': return mpFail(t(m.why === 'inativa' ? 'A sala foi encerrada por inatividade.' : 'A sala foi encerrada.'));
    case 'err': {
      if (m.code === 'bug') return;
      if (m.code === 'exists' && MP.create && !MP.joined && MP.newCode++ < 8) return mpConnect(mkCode(), true, MP.pub, MP.pw);
      if (m.code === 'pass') { $('#on-code').value = MP.code; mpFail(t(m.wrong ? 'Senha incorreta.' : 'Essa sala tem senha. Digite a senha e toque em Entrar.')); setTimeout(() => $('#on-pw').focus(), 60); return; }
      if (m.code === 'none' && (MP.rejoin || MP.wasIn)) return mpFail(t('Sua sala não existe mais: foi encerrada por inatividade. Crie uma nova ou entre em outra.'));
      if (m.code === 'started' && MP.rejoin) return mpFail(t('Essa sala já começou o leilão e você não estava nela.'));
      const msg = { none: 'Sala não encontrada. Confira o código.', started: 'O leilão dessa sala já começou.', full: 'Essa sala está cheia.', kicked: 'O anfitrião tirou você da sala.', tok: 'Erro de identificação. Recarregue a página.' }[m.code] || 'Não deu pra entrar na sala.';
      return mpFail(t(msg));
    }
  }
}

// ----- sala (antes do leilão) -----
function mpLobby(m) {
  MP.joined = true; mpSave(); MP.lobby = m; MP.host = mpIsHost(); MP.phase = 'lobby'; L.mp = true; L.code = m.code;
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
  if (on) o.textContent = t(MP.lobby && MP.lobby.lock ? 'Sala com senha: passe o código e a senha. O link sozinho não entra.' : 'Passe o código ou o link pros amigos entrarem na sala.');
  if (!on && MP_ON) l.textContent = t('Sala de treino: você e os bots.');
  $('#lb-copy').hidden = !on; $('#lb-copy').textContent = t(MP.copyT ? 'Copiado!' : 'Copiar link');
}
function mpPaintSeats(seat) {
  const m = MP.lobby, host = mpIsHost(), me0 = m.seats.find(s => s.uid === m.you), rest = m.seats.filter(s => s.uid !== m.you);
  let h = seat('me', L.emb, L.name || t('Seu Time'), t(me0 && me0.host ? 'Você · anfitrião' : me0 && me0.ready ? 'Você · pronto' : 'Você'), me0 && me0.ready && !me0.host ? 'me rdy' : 'me');
  h += rest.map(s => {
    const nm = seatName(s), tag = s.kind === 'bot' ? t('Bot · pronto') : !s.on ? t('Reconectando…') : t(s.host ? 'Anfitrião' : s.ready ? 'Pronto' : 'Na sala');
    const x = host ? `<button class="x" data-rm="${s.uid}" aria-label="${esc(t('Tirar {n}', { n: nm }))}">×</button>` : '';
    return seat('u' + s.uid, s.emb, nm, tag, (s.on ? '' : 'away') + (s.kind === 'human' && s.ready && !s.host ? ' rdy' : ''), x);
  }).join('');
  if (host && m.seats.length < m.max) h += `<button class="seat dash" id="lb-add"><span class="plus">+</span><div class="sn"><b>${t('Adicionar bot')}</b><small>${t('Preenche a vaga')}</small></div></button>`;
  h += `<button class="seat dash" id="lb-invite"><span class="plus">＋</span><div class="sn"><b>${t('Convidar amigo')}</b><small>${t('Copiar o link da sala')}</small></div></button>`;
  $('#lb-seats').innerHTML = h;
}
function mpPaintGo(n) {
  const m = MP.lobby, mine = m.seats.find(x => x.uid === m.you), wait = m.seats.filter(x => !x.ready).length;
  if (mpIsHost()) {
    if (n >= MIN_TEAMS && wait) { $('#lb-go').textContent = tpl('Aguardando {n} jogador ficar pronto', 'Aguardando {n} jogadores ficarem prontos', wait); $('#lb-go').disabled = true; $('#lb-note').textContent = t('Os outros jogadores marcam "Estou pronto" pra você abrir o leilão.'); }
    return;
  }
  const r = !!(mine && mine.ready);
  $('#lb-go').textContent = t(r ? 'Cancelar pronto' : 'Estou pronto'); $('#lb-go').disabled = false;
  $('#lb-note').textContent = t(r ? 'Pronto! O anfitrião abre o leilão quando todos estiverem prontos.' : 'Marque pronto quando quiser começar. O anfitrião abre o leilão.');
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
  mpSave();
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
  $('#table').innerHTML = tableHTML();
  $('#a-bud')._shown = BUDGET; $('#a-bud')._to = BUDGET; $('#a-bud').textContent = dollars(BUDGET);
  show('auction'); paintAuction(true, 16);
  cancelAnimationFrame(G.raf); G.last = performance.now(); G.raf = requestAnimationFrame(frame);
}
// reconexão no meio da temporada: reconstrói a temporada e volta pra rodada que está rolando
function mpResume(m) {
  const have = SV.S && !$('#season').hidden && MP.seed === m.seed ? SV.done + (LV.running ? 1 : 0) : -1;
  MP.resume = null;
  if (have === m.rd) return;
  MP.seed = m.seed; svStart($('#season'), me().id, false);
  $('#sim').textContent = t('Refazer temporada'); $('#sim').hidden = !MP.host; $('#sim-wait').hidden = true;
  if (m.rd > 0) { SV.done = m.rd - 1; svStartRound(); LV.t0 = performance.now() - m.since; }
}
function mpEnd(m) {
  if (!G.A || !G.mp) return;
  MP.cseed = m.seed; mpApplyTeams(m.teams);
  if (MP.phase === 'results') return;
  MP.phase = 'results'; G.A.done = true; G.A.phase = 'done';
  if (MP.enter) { MP.enter = false; mpEnter(); }          // entrou só no fim (reconexão): a próxima volta do relógio abre os resultados
}

// ----- tela "online": criar, entrar por código e lista de salas públicas -----
function onSay(msg) { $('#on-msg').textContent = msg || ''; }
function onOpenPoll() {
  clearInterval(MP.poll); onRefresh();
  MP.poll = setInterval(() => { if (!vis('online')) { clearInterval(MP.poll); return; } if (!document.hidden) onRefresh(); }, 8000);
}
function onOpen() { onSay(''); show('online'); onOpenPoll(); }
async function onRefresh() {
  try { const r = await fetch('/api/rooms', { cache: 'no-store' }); MP.list = (await r.json()).rooms || []; } catch (e) { MP.list = null; }
  if (vis('online')) onList();
  if (vis('setup')) homeList();
}
const LOCK = '<svg class="lk" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label="com senha"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5A1.5 1.5 0 0 1 20 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.5 10zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>';
function roomsHTML() {
  const L2 = MP.list;
  if (L2 === null) return `<div class="empty">${t('Não consegui carregar a lista.')}</div>`;
  if (!L2.length) return `<div class="empty">${t('Nenhuma sala pública aberta agora. Crie a sua!')}</div>`;
  return L2.map(r => `<div class="seat">${badge(r.emb, 44)}<div class="sn"><b>${esc(r.auto || !r.host ? emN(r.emb) : r.host)}</b><small>${r.n}/${r.max} · ${r.code}${r.lock ? LOCK : ''}</small></div><button class="go" data-join="${r.code}" ${r.lock ? 'data-lock="1"' : ''}>${t('Entrar')}</button></div>`).join('');
}
function onList() { $('#on-list').innerHTML = roomsHTML(); }
function homeList() { $('#home-list').innerHTML = roomsHTML(); }
function homeRefresh() { if (MP_ON) onRefresh(); }
function roomClick(e) {
  const b = e.target.closest('[data-join]'); if (!b) return;
  if (b.dataset.lock) { onOpen(); $('#on-code').value = b.dataset.join; onSay(t('Essa sala tem senha. Digite a senha e toque em Entrar.')); setTimeout(() => $('#on-pw').focus(), 60); return; }
  onJoin(b.dataset.join);
}
function onJoin(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (code.length !== 4) { onSay(t('Digite o código de 4 letras.')); return; }
  onSay(''); MP.newCode = 0; mpConnect(code, false, false, $('#on-pw').value.trim());
}
function onCreate(pub) { onSay(''); MP.newCode = 0; mpConnect(mkCode(), true, pub, $('#on-pw').value.trim()); }
$('#go-online').onclick = onOpen;
$('#on-back').onclick = () => { clearInterval(MP.poll); show('setup'); };
$('#on-priv').onclick = () => onCreate(false);
$('#on-pub').onclick = () => onCreate(true);
$('#on-join').onclick = () => onJoin($('#on-code').value);
$('#on-code').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''); };
$('#on-code').onkeydown = e => { if (e.key === 'Enter') onJoin(e.target.value); };
$('#on-refresh').onclick = onRefresh;
$('#on-list').onclick = roomClick;
$('#home-list').onclick = roomClick;
$('#home-refresh').onclick = onRefresh;

if (MP_ON) {
  $('#go-online').hidden = false; $('#go-solo').hidden = false; $('#go-lobby').hidden = true;
  $('#home-rooms').hidden = false; homeRefresh(); setInterval(() => { if (vis('setup') && !document.hidden) onRefresh(); }, 10000);
  $('#join-off').hidden = true; $('#note-off').hidden = true; $('#lead-off').hidden = true; $('#lead-on').hidden = false;
  // link de convite: ?sala=ABCD
  try {
    const c = (new URLSearchParams(location.search).get('sala') || '').toUpperCase();
    if (/^[A-Z2-9]{4}$/.test(c)) { history.replaceState(null, '', location.pathname); setTimeout(() => { onOpen(); $('#on-code').value = c; onJoin(c); }, 0); }
    else {                                                       // recarregou a página no meio de uma sala: volta pra ela
      const sv = JSON.parse(sessionStorage.getItem('fa-room') || 'null');
      if (sv && /^[A-Z2-9]{4}$/.test(sv.code)) setTimeout(() => { MP.rejoin = true; onOpen(); onSay(t('Voltando pra sua sala…')); mpConnect(sv.code, false, false, sv.pw || ''); }, 0);
    }
  } catch (e) { }
}

// feedback: o contato vem do servidor (segredo CONTACT_EMAIL); sem ele, cai no GitHub
$('#fb-link').onclick = async e => {
  e.preventDefault();
  let to = ''; try { to = (await (await fetch('/api/contact')).json()).email || ''; } catch (x) { }
  if (!to) { window.open('https://github.com/Lazarinienzo/footballauction/issues/new', '_blank', 'noopener'); return; }
  const body = t('Conte o que aconteceu ou o que você sugere:') + '\n\n\n---\n' + t('Sala') + ': ' + (MP.code || '-') + '\n' + navigator.userAgent;
  location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Touchdown Auction: feedback') + '&body=' + encodeURIComponent(body);
};
