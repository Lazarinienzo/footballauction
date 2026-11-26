// ----- modo Duelo (1 contra 1): cartas viradas. Contra o bot roda aqui mesmo; com amigo o servidor (src/duel.js) manda e este código só mostra. -----
const DU = { mode: 'menu', show: false, ws: null, local: null, v: null, code: '', host: false, you: 0, seats: [], deadline: 0, tick: 0, botT: [], played: false, watch: 0, left: true, tries: 0, retryT: 0, pingT: 0, wait: null, msg: '', seat: null };
const DU_FULL = { QB: 'Quarterback', RB: 'Running back', WR: 'Wide receiver', TE: 'Tight end', OL: 'Linha ofensiva', EDGE: 'Edge rusher', DT: 'Tackle defensivo', LB: 'Linebacker', CB: 'Cornerback' };
const duMe = () => ({ name: L.auto || !L.name ? emN(L.emb) : L.name, emb: L.emb });
const duP = id => DB[id];
function duStop() {
  DU.botT.forEach(clearTimeout); DU.botT = []; DU.botRun = false; clearInterval(DU.tick); DU.tick = 0; DU.local = null; DU.v = null; DU.wait = null; DU.played = false; DU.watch = 0;
  clearInterval(DU.pingT); clearTimeout(DU.retryT); dtReset();
  if (DU.ws) { const w = DU.ws; DU.ws = null; try { w.onclose = null; if (w.readyState === 1) w.send(JSON.stringify({ t: 'leave' })); w.close(); } catch (e) { } }
  try { sessionStorage.removeItem('fa-duel'); } catch (e) { }
  netBanner(false);
}
function duOpen() { duStop(); DU.mode = 'menu'; DU.msg = ''; show('duel'); duPaint(); }

// ---------- contra o bot ----------
function duSolo() {
  duStop(); DU.mode = 'solo';
  const e = shuffle(EMB.map((_, i) => i).filter(i => i !== L.emb))[0];
  DU.seats = [{ ...duMe(), on: true }, { name: emN(e), emb: e, on: true }]; DU.you = 0;
  DU.local = new Duelo(DB, { show: DU.show }); DU.played = false; DU.seed = (Math.random() * 2 ** 32) >>> 0;
  duTurn(DU_EXTRA.first); show('duel'); duLocalPush(); DU.tick = setInterval(duTickUI, 250);
}
// o relógio do turno ganha um tempo extra pras animações (sorteio, cartas entrando e saindo da mesa)
function duTurn(extra) { DU.deadline = Date.now() + DU_TURN_MS + (extra || 0); }
const duExtra = (D, r, cur) => D.r !== r ? DU_EXTRA.round : D.cur !== cur ? DU_EXTRA.swap : 0;
function duLocalPush() {
  const D = DU.local; if (!D) return;
  DU.v = { ...D.view(0), you: 0, seed: D.done ? DU.seed : null, seats: DU.seats, left: Math.max(0, DU.deadline - Date.now()), ph: D.done ? 'done' : 'play', again: [] };
  dtStore(DU.v); duPaint();
}
// o bot age na mesa, devagar: vira uma carta por vez, depois escolhe. Só começa quando a mesa dele já está pronta.
function duBot() {
  const D = DU.local; if (DU.botRun || !D || D.done || D.cur !== 1 || D.ok[1] || !dtReady(1)) return;
  DU.botRun = true; DU.botSc = {};
  const go = () => {
    if (DU.local !== D || D.done || D.cur !== 1 || D.ok[1]) { DU.botRun = false; return; }
    const c = D.cfg; let wait = 1500;
    if (D.fl[1].length < c.f) { const rest = [...Array(c.n).keys()].filter(i => !D.fl[1].includes(i)); D.flip(1, rest[rint(0, rest.length - 1)]); }
    else if (D.sel[1].length < c.k) {
      const sc = i => DU.botSc[i] != null ? DU.botSc[i] : (DU.botSc[i] = D.db[D.board[1][i]].ovr + (R() - .5) * 2 * (D.show ? 4 : 8));
      const left = D.fl[1].filter(i => !D.sel[1].includes(i)).sort((x, y) => sc(y) - sc(x)); D.pick(1, left[0]); wait = 1200;
    } else { const r = D.r, cur = D.cur; D.confirm(1); duTurn(duExtra(D, r, cur)); DU.botRun = false; duLocalPush(); return; }
    duLocalPush(); DU.botT.push(setTimeout(go, wait));
  };
  DU.botT.push(setTimeout(go, 1500));
}
function duLocalMove(m) {
  const D = DU.local; if (!D || D.cur !== 0) return;
  const cur = D.cur, r = D.r, ok = m.t === 'flip' ? D.flip(0, m.i) : m.t === 'pick' ? D.pick(0, m.i) : D.confirm(0);
  if (ok) { const x = duExtra(D, r, cur); if (x) duTurn(x); }
  duLocalPush();
}
function duLocalTimeout() { const D = DU.local; if (D && !D.done && D.cur === 0 && Date.now() >= DU.deadline) { const cur = D.cur, r = D.r; D.auto(0); duTurn(duExtra(D, r, cur)); duLocalPush(); } }

// ---------- com amigo ----------
function duConnect(code, create) {
  duStop(); DU.mode = 'mp'; DU.code = code; DU.create = create; DU.left = false; DU.tries = 0; DU.joined = false;
  duWS(); DU.pingT = setInterval(() => duSend({ t: 'ping' }), 20000); DU.tick = setInterval(duTickUI, 250);
}
function duWS() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wsd/${DU.code}`); DU.ws = ws;
  ws.onopen = () => { netBanner(false); const me = duMe(); ws.send(JSON.stringify({ t: 'join', tok: mpTok(), name: L.auto ? '' : L.name, emb: me.emb, create: DU.create && !DU.joined, show: DU.show })); };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } duMsg(m); };
  ws.onclose = () => {
    if (DU.ws !== ws) return; DU.ws = null; if (DU.left) return;
    if (!DU.joined) return duFail(t('Não deu pra conectar. O servidor pode estar lotado ou fora do ar. Tente de novo em alguns minutos.'));
    netBanner(true); if (++DU.tries > 10) return duFail(t('Conexão perdida.'));
    DU.retryT = setTimeout(() => { if (!DU.left) duWS(); }, Math.min(4000, 700 * DU.tries));
  };
}
const duSend = o => { try { if (DU.ws && DU.ws.readyState === 1) DU.ws.send(JSON.stringify(o)); } catch (e) { } };
function duFail(msg) { duStop(); DU.mode = 'menu'; DU.msg = msg; show('duel'); duPaint(); }
function duMsg(m) {
  switch (m.t) {
    case 'dwait': dtReset(); DU.joined = true; DU.mode = 'wait'; DU.wait = m; DU.code = m.code; DU.you = m.you; DU.seats = m.seats; DU.show = m.show; DU.v = null; DU.played = false; DU.playSeen = null; if (m.seats[m.you]) L.emb = m.seats[m.you].emb; try { sessionStorage.setItem('fa-duel', m.code); } catch (e) { } if (!vis('duel')) show('duel'); return duPaint();
    case 'd': {
      DU.joined = true; DU.mode = 'mp'; DU.v = m; DU.you = m.you; DU.seats = m.seats; DU.code = m.code; DU.deadline = Date.now() + m.left; DU.show = m.show;
      if (m.ph === 'play' && DU.played) DU.played = false;
      if (DU.playSeen == null || m.ph === 'play') DU.playSeen = m.play || 0;                 // reconectar não reabre a partida
      else if (m.ph === 'done' && m.play > DU.playSeen) { DU.playSeen = m.play; setTimeout(() => { if (DU.v && DU.v.ph === 'done') duPlayGame(); }, 0); }
      try { sessionStorage.setItem('fa-duel', m.code); } catch (e) { } if (!vis('duel')) show('duel'); dtStore(m); return duPaint();
    }
    case 'closed': return duFail(t(m.why === 'inativa' ? 'A sala foi encerrada por inatividade.' : 'A sala foi encerrada.'));
    case 'err': {
      if (m.code === 'bug') return;
      if (m.code === 'exists' && DU.create && !DU.joined) return duConnect(mkCode(), true);
      return duFail(t({ none: 'Sala não encontrada. Confira o código.', started: 'O duelo dessa sala já começou.', full: 'Essa sala está cheia.', tok: 'Não foi possível entrar.' }[m.code] || 'Não foi possível entrar.'));
    }
  }
}
const duMove = m => { if (DU.mode === 'solo') duLocalMove(m); else duSend(m); };

// ---------- tela ----------
const duSeat = k => { const s = DU.seats[k]; return s ? { ...s, name: s.name || emN(s.emb) } : { name: '…', emb: 0 }; };
function duPicksHTML(ids, reveal) {
  const by = {}; POS_ORDER.forEach(p => by[p] = []); ids.forEach(id => by[duP(id).pos].push(id));
  const rows = POS_ORDER.filter(p => by[p].length).map(p => by[p].map(id => { const q = duP(id); return `<span class="dpk"><b>${p}</b>${badge(frIdx(q), 18)}<i>${esc(shortName(q.name))}</i>${DU.show || reveal ? `<em class="num">${q.ovr}</em>` : ''}</span>`; }).join('')).join('');
  return rows || `<p class="note">${t('Ninguém escolhido ainda.')}</p>`;
}
function duPaint() {
  const el = $('#du-body'); if (!el || $('#duel').hidden) return;
  $('#du-tag').textContent = DU.mode === 'solo' ? 'Bot' : DU.mode === 'menu' ? t('Duelo') : 'Online';
  if (DU.mode === 'menu' || DU.mode === 'wait') el.classList.remove('dwide');
  if (DU.mode === 'menu') return duMenu(el);
  if (DU.mode === 'wait') return duWait(el);
  if (!DU.v) { el.innerHTML = `<p class="note" style="text-align:center;padding:40px 0">${t('Conectando…')}</p>`; return; }
  dtStep();
}
function duMenu(el) {
  const me = duMe();
  el.innerHTML = `<div class="lb-hero"><small class="eyebrow">${t('1 CONTRA 1')}</small><h1>${t('Duelo de cartas.')}</h1></div>
  <p class="lead" style="margin:0 0 18px">${t('Sem leilão: a cada rodada sai uma posição e você vira cartas às cegas, escolhe as melhores e monta seu time. Quem montar o melhor, ganha a partida.')}</p>
  <div class="card form">
    <div class="duid"><span id="du-badge">${badge(L.emb, 52)}</span><div class="field" style="flex:1;margin:0"><label for="du-name">${t('Nome do time')}</label><input id="du-name" maxlength="44" autocomplete="off" value="${esc(L.auto ? '' : L.name)}" placeholder="${esc(emN(L.emb))}"></div><button class="mini" id="du-shuf" type="button">${t('Trocar escudo')}</button></div>
    <button class="bopt ${DU.show ? 'on' : ''}" id="du-show" type="button" aria-pressed="${DU.show}"><span class="sw"><i></i></span><span class="bt"><b>${t('Mostrar o OVR nas cartas')}</b><small>${DU.show ? t('Você vê o OVR de cada carta virada.') : t('OVR escondido: você só vê nome e time. O OVR aparece no fim.')}</small></span></button>
    <button class="btn full" id="du-bot">${t('Jogar contra o bot')}</button>
    ${MP_ON ? `<button class="btn ghost full" id="du-create">${t('Criar sala de duelo')}</button>
    <div class="join"><input id="du-code" maxlength="4" placeholder="${t('Código')}" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="${t('Código da sala')}"><button class="btn ghost" id="du-join">${t('Entrar')}</button></div>` : `<p class="note">${t('Duelo com amigo chega com o modo online.')}</p>`}
    <p class="note on-msg" role="status">${esc(DU.msg || '')}</p>
  </div>
  <div class="yard">${t('Como funciona')}</div>
  <ol class="steps"><li><i>1</i><h3>${t('Vire as cartas')}</h3><p>${t('Cada rodada tem uma posição. Você tem um tabuleiro de cartas fechadas e vira algumas, sem saber quem está embaixo.')}</p></li>
  <li><i>2</i><h3>${t('Escolha as melhores')}</h3><p>${t('Das cartas viradas, você fica com as que quiser. Quem joga depois vê o que o rival virou. Os dois podem ter o mesmo jogador.')}</p></li>
  <li><i>3</i><h3>${t('Jogue a partida')}</h3><p>${t('Depois de 9 posições, os dois times jogam na formação padrão: 6 posses cada, como no leilão.')}</p></li></ol>`;
}
function duWait(el) {
  const w = DU.wait, two = w.seats.length === 2, guest = !w.host, mine = w.seats[w.you] || { name: '', emb: L.emb }, rival = w.seats[1 - w.you];
  if (!el.querySelector('#dw-shell') || el.dataset.code !== w.code) {
    el.dataset.code = w.code;
    el.innerHTML = `<div id="dw-shell"><div class="lb-hero"><small class="eyebrow">${t('SALA DE DUELO')}</small><h1 id="dw-h"></h1></div>
    <div class="ticket"><div><small>${t('CÓDIGO DA SALA')}</small><b class="num">${esc(w.code)}</b></div><p>${t('Passe o código ou o link pro seu amigo entrar.')}</p><button class="cp" id="du-copy" type="button">${t('Copiar link')}</button></div>
    <div class="yard">${t('Na sala')} <span class="cnt num" id="dw-cnt"></span></div>
    <div class="seats" id="dw-seats"></div>
    <div class="yard">${t('Seu time')}</div>
    <div class="card form"><div class="duid"><span id="dw-badge"></span><div class="field" style="flex:1;margin:0"><label for="dw-name">${t('Nome do time')}</label><input id="dw-name" maxlength="44" autocomplete="off" value="${esc(mine.name)}"></div><button class="mini" id="dw-shuf" type="button">${t('Trocar escudo')}</button></div></div>
    <div id="dw-opt"></div><div id="dw-act"></div></div>`;
  }
  $('#dw-h').textContent = !two ? t('Chame um amigo.') : (w.seats[1].ready ? t('Tudo pronto.') : t('Ajeitem os times.'));
  $('#dw-cnt').textContent = `${w.seats.length}/2`;
  $('#dw-name').placeholder = emN(mine.emb);
  $('#dw-badge').innerHTML = badge(mine.emb, 52);
  $('#dw-seats').innerHTML = w.seats.map((s, i) => `<div class="seat ${i === w.you ? 'me' : ''}">${badge(s.emb, 48)}<div class="sn"><b>${esc(s.name || emN(s.emb))}</b><small>${i === 0 ? t('Anfitrião') : t('Convidado')}${s.on ? '' : ' · ' + t('fora')}${i > 0 && s.on ? ' · ' + (s.ready ? t('pronto') : t('ajustando…')) : ''}</small></div></div>`).join('') +
    (two ? '' : `<div class="seat dash off"><span class="plus">+</span><div class="sn"><b>${t('Esperando o amigo…')}</b><small>${t('A vaga está aberta')}</small></div></div>`);
  $('#dw-opt').innerHTML = `<button class="bopt ${w.show ? 'on' : ''}" id="du-show" type="button" aria-pressed="${w.show}" ${w.host ? '' : 'disabled'} style="margin-top:14px"><span class="sw"><i></i></span><span class="bt"><b>${t('Mostrar o OVR nas cartas')}</b><small>${w.show ? t('Você vê o OVR de cada carta virada.') : t('OVR escondido: você só vê nome e time. O OVR aparece no fim.')}</small></span></button>`;
  const rdy = two && w.seats[1].ready;
  $('#dw-act').innerHTML = guest
    ? `<button class="btn ${mine.ready ? 'ghost' : ''} full" id="du-ready" type="button" style="margin-top:14px">${mine.ready ? t('Pronto! Toque pra desfazer') : t('Estou pronto')}</button><p class="note" style="margin-top:10px;text-align:center">${mine.ready ? t('Aguardando o anfitrião começar.') : t('Ajuste seu nome e escudo e marque pronto.')}</p>`
    : `<button class="btn full" id="du-start" ${rdy ? '' : 'disabled'} style="margin-top:14px">${!two ? t('Falta 1 jogador') : rdy ? t('Começar o duelo') : t('Aguardando {n} ficar pronto…', { n: rival && (rival.name || emN(rival.emb)) })}</button>`;
}
function duSendMe() { const n = $('#dw-name'); if (!n) return; L.name = n.value.slice(0, 44).trim(); L.auto = !L.name; if (L.auto) L.name = emN(L.emb); duSend({ t: 'me', name: L.auto ? '' : L.name, emb: L.emb }); }
// ---------- mesa: uma só pros dois jogadores ----------
// Cena = (rodada, de quem é o tabuleiro). Entra o sorteio da posição (caça-níquel), as cartas descem na mesa, quem joga vira e escolhe,
// a escolha fica um instante na mesa e as cartas saem; aí vem a mesa do outro jogador. Os dois veem exatamente a mesma coisa.
const T_HOLD = 1800, T_EXIT = 1000, T_PRE = 800, T_SPIN = 3000, T_LAND = 1100, T_DEALK = 170, T_DEAL = 800, REEL_H = 96;
const DT = { disp: null, phase: 'none', lock: false, snaps: {}, pk: [[], []], timers: [], over: false, last: null };
const dtDur = ms => REDUCED ? Math.min(ms, 200) : ms;
const dtAt = (fn, ms) => { DT.timers.push(setTimeout(fn, dtDur(ms))); };
function dtReset() { DT.timers.forEach(clearTimeout); Object.assign(DT, { disp: null, phase: 'none', lock: false, snaps: {}, pk: [[], []], timers: [], over: false, last: null }); }
const dtSide = (s, who) => who === s.you ? s.me : s.opp;
const dtReady = who => !!(DT.phase === 'play' && !DT.lock && DT.disp && DT.disp.who === who && DU.v && DT.disp.r === DU.v.r);
const dtCan = () => { const v = DU.v, d = DT.disp; return !!(v && d && !v.done && v.ph === 'play' && !DT.lock && DT.phase === 'play' && d.r === v.r && d.who === v.you && v.cur === v.you && !v.me.ok); };
const duTier = ovr => ovr >= 90 ? 'diamond' : ovr >= 80 ? 'gold' : ovr >= 70 ? 'bronze' : 'plain';
const DU_BACK = '<svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true"><ellipse cx="24" cy="24" rx="19" ry="11" transform="rotate(-35 24 24)" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 31l18-14M20 27l2.2 2.4M24 24l2.2 2.4M28 21l2.2 2.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><small>touchdown<b>auction</b></small>';

function dtStore(v) {
  const prev = DT.last;
  if (prev && !v.done && v.r > prev.r) {        // a rodada virou: o servidor já mandou o tabuleiro novo, então completo a escolha de quem confirmou por último
    [prev.me, prev.opp].forEach((sd, x) => {
      if (sd.ok) return;
      const add = v.picks[x].slice(prev.picks[x].length);
      if (!sd.ok) sd.sel = sd.cards.map((id, i) => id != null && add.includes(id) ? i : -1).filter(i => i >= 0);
      sd.ok = true;
      if (v.prev && v.r === prev.r + 1) sd.cards = (x === 0 ? v.prev.me : v.prev.opp).slice();      // mostra o tabuleiro todo (o que ficou de fora)
    });
  }
  const s = v.done ? { ...v, r: v.of - 1, pos: v.rounds[v.of - 1], cfg: DU_CFG[v.rounds[v.of - 1]] } : v;
  DT.snaps[s.r] = s; DT.last = s;
}
function duShell(el) {
  el.classList.add('dwide');
  el.innerHTML = `<div class="dhead"><div><small id="dh-r">&nbsp;</small><b class="dpos" id="dh-pos">?</b><em id="dh-sub">&nbsp;</em></div><div class="dtm"><b id="du-time" class="num">--</b><small>${t('segundos')}</small></div></div>
  <div class="dbar"><i id="du-bar"></i></div>
  <p class="note dstat" id="du-stat">&nbsp;</p>
  <div class="dwho" id="dh-who"></div>
  <div class="dstage" id="dt-stage"></div>
  <div id="dt-act"></div><p class="dleg" id="dt-leg"></p>
  <div class="yard" style="margin-top:26px;font-size:20px">${t('Times até agora')}</div><div class="dcols" id="dt-teams"></div>`;
  dtTeams();
}
function dtStep() {
  const v = DU.v, el = $('#du-body'); if (!v || !el || DT.lock) return;
  if (DT.over && !v.done) { dtReset(); dtStore(v); }                 // revanche: começa tudo de novo
  if (DT.over) return duDone(el, v);
  const d = DT.disp, tg = v.done ? null : { r: v.r, who: v.cur };
  if (!d || !$('#dt-stage')) {
    if (v.done) { DT.over = true; return duDone(el, v); }
    duShell(el); DT.disp = tg;
    const fresh = !v.me.fl.length && !v.opp.fl.length && !v.me.ok && !v.opp.ok;
    return fresh ? dtIntro(tg) : dtShow(tg, false);
  }
  if (tg && d.r === tg.r && d.who === tg.who) return dtUpdate();
  dtLeave(() => {                                                    // a mesa atual acabou: sai e entra a próxima cena
    const v2 = DU.v;
    if (v2.done) { DT.over = true; DT.lock = false; return duPaint(); }
    const t2 = { r: v2.r, who: v2.cur };
    if (t2.r !== d.r) dtIntro(t2); else dtShow(t2, true);
  });
}
function dtHead(s, landed) {
  $('#dh-r').textContent = t('RODADA {r} DE {n}', { r: s.r + 1, n: s.of });
  $('#dh-pos').textContent = landed ? s.pos : '?';
  $('#dh-sub').innerHTML = landed ? `${t(DU_FULL[s.pos])} · ${t('vire {f}, fique com {k}', { f: s.cfg.f, k: s.cfg.k })}` : '&nbsp;';
}
// sorteio da posição: as que ainda não saíram rodam como num caça-níquel até parar na da rodada
function dtIntro(tg) {
  const v = DU.v, s = DT.snaps[tg.r], rem = [...new Set(v.rounds.slice(tg.r))], N = 28, seq = [];
  DT.lock = true; DT.phase = 'intro'; DT.disp = tg;
  while (seq.length < N - 1) shuffle(rem).forEach(p => { if (seq.length < N - 1) seq.push(p); });
  seq.push(s.pos);
  dtHead(s, false);
  $('#dt-stage').innerHTML = `<div class="dintro"><small>${t('Sorteando a posição…')}</small><div class="reel" id="dt-reel"><div class="strip" id="dt-strip" style="transition-duration:${dtDur(T_SPIN)}ms">${seq.map(p => `<span>${p}</span>`).join('')}</div></div><em id="dt-pn">&nbsp;</em></div>`;
  $('#dt-act').innerHTML = ''; $('#dt-leg').innerHTML = ''; $('#dh-who').innerHTML = ''; $('#du-stat').textContent = t('Sorteando a posição…');
  const strip = $('#dt-strip'); void strip.offsetHeight;
  dtAt(() => { strip.style.transform = `translateY(-${(N - 1) * REEL_H}px)`; sfx.reel(dtDur(T_SPIN) / 1000, N - 1, REDUCED); }, T_PRE);
  dtAt(() => { $('#dt-reel').classList.add('landed'); $('#dt-pn').textContent = t(DU_FULL[s.pos]); dtHead(s, true); }, T_PRE + T_SPIN);
  dtAt(() => dtShow(tg, true), T_PRE + T_SPIN + T_LAND);
}
function dtShow(tg, anim) {
  const s = DT.snaps[tg.r], c = s.cfg, root = $('#dt-stage');
  DT.disp = tg; DT.lock = !!anim; DT.phase = anim ? 'deal' : 'play'; dtHead(s, true);
  root.innerHTML = `<div class="dtable n${c.n} ${anim ? 'dealing' : ''} inst">${[...Array(c.n).keys()].map(i => `<div class="dc" data-i="${i}" style="--k:${i}" role="button"><div class="in"><div class="face fbk">${DU_BACK}</div><div class="face fft"></div></div></div>`).join('')}</div>`;
  dtUpdate(); const tb = root.firstChild; void tb.offsetHeight; tb.classList.remove('inst');
  const ready = () => { DT.phase = 'play'; DT.lock = false; dtUpdate(); if (DU.mode === 'solo') duBot(); dtStep(); };
  if (anim) dtAt(ready, c.n * T_DEALK + T_DEAL); else ready();
}
function dtFront(id) {
  const p = duP(id), tier = DU.show ? duTier(p.ovr) : 'plain';
  return [`face fft t-${tier}`, `${badge(frIdx(p), DU_CFG.QB.n > 6 ? 36 : 46)}<span class="dn">${esc(p.name)}</span><span class="dp">${p.pos} · ${esc(p.tm)}</span><span class="dov num">${DU.show ? p.ovr : '??'}</span><i class="ck">✓</i>`];
}
// carta 90+ virada: brilho, explosão de faíscas e faixa "DIAMANTE" na mesa
function dtLegend(el, root) {
  dtAt(() => {
    el.classList.add('legend');
    const b = document.createElement('div'); b.className = 'dlegend'; b.innerHTML = '<span>◆</span> ' + t('DIAMANTE') + ' <span>◆</span>';
    root.appendChild(b); root.classList.add('glow');
    setTimeout(() => { b.remove(); root.classList.remove('glow'); }, 2400);
  }, 650);
}
// carta que ficou de fora: vira só pra mostrar o que se perdeu
function dtMiss(el, id) {
  const f = el.querySelector('.fft'), [cls, html] = dtFront(id); f.className = cls; f.innerHTML = html; el.classList.add('flipped', 'missed');
  sfx.flip(cls.includes('t-diamond') ? 'diamond' : cls.includes('t-gold') ? 'gold' : 'bronze');
}
// atualiza a mesa no lugar (sem recriar as cartas, senão a animação de virar se perde)
function dtUpdate() {
  const d = DT.disp, v = DU.v; if (!d || !v) return;
  const s = DT.snaps[d.r], side = dtSide(s, d.who), c = s.cfg, root = $('#dt-stage');
  const can = dtCan(), canFlip = can && side.fl.length < c.f, canPick = can && side.fl.length >= c.f;
  const hold = DT.phase === 'hold'; let miss = 0;
  if (root.firstChild && root.firstChild.classList) root.firstChild.classList.toggle('hold', hold);
  root.querySelectorAll('.dc').forEach(el => {
    const i = +el.dataset.i, fl = side.fl.includes(i);
    if (hold && !fl && side.cards[i] != null && !el.classList.contains('flipped') && !el.dataset.rv) {   // a mesa segura a escolha: o que ficou de fora vira, devagar
      el.dataset.rv = 1; const id = side.cards[i]; dtAt(() => dtMiss(el, id), 300 + (miss++) * 170);
    }
    if (fl && !el.classList.contains('flipped')) { const f = el.querySelector('.fft'), [cls, html] = dtFront(side.cards[i]); f.className = cls; f.innerHTML = html; el.classList.add('flipped'); if (!root.firstChild.classList.contains('inst')) sfx.flip(cls.includes('t-diamond') ? 'diamond' : cls.includes('t-gold') ? 'gold' : 'bronze'); if (cls.includes('t-diamond') && !root.firstChild.classList.contains('inst')) dtLegend(el, root); }
    el.classList.toggle('sel', side.sel.includes(i));
    el.classList.toggle('can', (canFlip && !fl) || (canPick && fl));
    el.tabIndex = el.classList.contains('can') ? 0 : -1;
  });
  const me = d.who === v.you, nm = esc(duSeat(d.who).name);
  $('#dh-who').innerHTML = `<span class="tn">${badge(duSeat(d.who).emb, 26)}${t('Mesa de {n}', { n: nm })}</span>`;
  const flipping = !side.ok && side.fl.length < c.f;
  $('#du-stat').textContent = DT.phase === 'deal' ? t('As cartas estão chegando…') : me
    ? (side.ok ? t('Você escolheu.') : flipping ? tpl('Sua vez: vire {n} carta.', 'Sua vez: vire {n} cartas.', c.f - side.fl.length) : t('Escolha {k} das {f} cartas viradas.', { k: c.k, f: c.f }))
    : (side.ok ? t('{n} escolheu.', { n: duSeat(d.who).name }) : flipping ? t('{n} está virando as cartas…', { n: duSeat(d.who).name }) : t('{n} está escolhendo…', { n: duSeat(d.who).name }));
  $('#dt-act').innerHTML = canPick ? `<button class="btn full" id="du-ok" ${side.sel.length === c.k ? '' : 'disabled'} style="margin-top:12px">${t('Confirmar')} (${side.sel.length}/${c.k})</button>` : '';
  $('#dt-leg').innerHTML = DU.show ? `<i class="tdot b"></i>${t('Bronze')} 70–79 <i class="tdot g"></i>${t('Ouro')} 80–89 <i class="tdot d"></i>${t('Diamante')} 90+` : '';
  duTickUI();
}
// a escolha fica na mesa um instante, depois as cartas saem
function dtLeave(cb) {
  const d = DT.disp, s = DT.snaps[d.r]; DT.lock = true; DT.phase = 'hold'; dtUpdate();
  const sd0 = dtSide(s, d.who), nMiss = sd0.cards.filter((id, i) => id != null && !sd0.fl.includes(i)).length, hold = T_HOLD + (nMiss ? 300 + nMiss * 170 + 900 : 0);
  dtAt(() => {
    DT.phase = 'exit'; const tb = $('#dt-stage .dtable'); if (tb) tb.classList.add('leaving');
    dtAt(() => {
      const side = dtSide(s, d.who); DT.pk[d.who === s.you ? 0 : 1].push(...side.sel.map(i => side.cards[i]));
      dtTeams(); cb();
    }, T_EXIT + 300);
  }, hold);
}
// os dois times lado a lado (anfitrião à esquerda, igual pros dois), nick em cima, ATQ/DEF ao vivo conforme as escolhas entram
function dtTeams() {
  const box = $('#dt-teams'), v = DU.v; if (!box || !v) return;
  const pk = s => DT.pk[s === v.you ? 0 : 1];
  let rt = null; try { DU.shd = DU.shd || new Duelo(DB, {}); DU.shd.picks = [pk(0), pk(1)]; rt = DU.shd.teams(DU.seats).map(x => x.rt); } catch (e) { }
  const mk = s => {
    const sd = duSeat(s), ids = pk(s), by = {}; POS_ORDER.forEach(p => by[p] = []); ids.forEach(id => by[duP(id).pos].push(id));
    const rows = POS_ORDER.flatMap(p => by[p].map(id => { const q = duP(id); return `<div class="dpr"><b>${p}</b><i>${esc(shortName(q.name))}</i>${DU.show ? `<em class="num">${q.ovr}</em>` : ''}</div>`; })).join('');
    const val = k => rt && DU.show && rt[s][k] > .05 ? rt[s][k].toFixed(1) : '–';
    return `<div class="dcol ${s === v.you ? 'me' : ''}"><div class="dcn">${badge(sd.emb, 34)}<b>${esc(sd.name)}</b><small class="num">${ids.length}/16</small></div>
    <div class="drt"><span><small>${t('ATQ')}</small><b class="num">${val('off')}</b></span><span><small>${t('DEF')}</small><b class="num">${val('def')}</b></span></div>${rows || `<p class="note" style="text-align:center;margin:6px 0 0">${t('Ninguém escolhido ainda.')}</p>`}</div>`;
  };
  box.innerHTML = mk(0) + mk(1);
}
function duTickUI() {
  const v = DU.v; if (!v) return; if (DU.mode === 'solo') duLocalTimeout();
  const bar = $('#du-bar'), tm = $('#du-time'); if (!bar || !tm || v.done) return;
  const ms = Math.max(0, Math.min(DU_TURN_MS, DU.deadline - Date.now())); bar.style.width = (100 * ms / DU_TURN_MS).toFixed(1) + '%'; bar.classList.toggle('low', ms < 8000); tm.textContent = Math.ceil(ms / 1000);
  const n = Math.ceil(ms / 1000);                                  // cronômetro: tique a cada segundo nos últimos 10 s, só na sua vez
  if (dtCan() && n >= 1 && n <= 10) { if (DU.tickN !== n) { DU.tickN = n; sfx.tick(n); } } else DU.tickN = 0;
}

function duTeamsFor(v) {
  const sh = new Duelo(DB, {}), mine = v.picks[0], opp = v.picks[1];
  sh.picks = v.you === 0 ? [mine, opp] : [opp, mine];
  return sh.teams(DU.seats);
}
function duDone(el, v) {
  el.classList.remove('dwide');
  const T = duTeamsFor(v), g = duGameOf(T, v.seed), a = T[v.you], b = T[1 - v.you], win = (g.sa > g.sb ? 0 : 1) === v.you, mine = v.you === 0 ? [g.sa, g.sb] : [g.sb, g.sa];
  const nm = k => esc(duSeat(k).name), ov = x => `<td class="num">${x.rt.off.toFixed(1)}</td><td class="num">${x.rt.def.toFixed(1)}</td><td class="num"><b>${x.rt.all.toFixed(1)}</b></td>`;
  const banner = DU.played && $('#modal').hidden;
  const again = v.again && v.again.includes(v.you);
  el.innerHTML = `<div class="lb-hero"><small class="eyebrow">${t('TIMES MONTADOS')}</small><h1>${banner ? (win ? t('Você ganhou o duelo!') : t('Você perdeu o duelo.')) : t('Hora da partida.')}</h1></div>
  ${banner ? `<div class="champ pop"><div class="cb">${badge(duSeat(win ? v.you : 1 - v.you).emb, 68)}<div><small>${t('PLACAR FINAL')}${g.ot ? ' · ' + t('PRORROGAÇÃO') : ''}</small><h2 style="font-size:20px;line-height:1.15">${esc(duSeat(v.you).name)} ${mine[0]} – ${mine[1]} ${esc(duSeat(1 - v.you).name)}</h2></div></div></div>` : ''}
  <div class="card scroll"><table class="cmp"><tr><th>${t('TIME')}</th><th>${t('ATQ')}</th><th>${t('DEF')}</th><th>${t('GERAL')}</th></tr>
  <tr class="me"><td><span class="tn">${badge(a.emb, 22)}${esc(a.name)}</span></td>${ov(a)}</tr><tr><td><span class="tn">${badge(b.emb, 22)}${esc(b.name)}</span></td>${ov(b)}</tr></table></div>
  <div class="pact" style="margin-top:14px">${DU.played ? '' : `<button class="btn full" id="du-play">${t('Jogar a partida')}</button>`}
  ${DU.played ? `<button class="btn ghost full" id="du-replay">${t('Rever a partida')}</button>` : ''}
  <button class="btn ${DU.played ? '' : 'ghost'} full" id="du-again" ${again ? 'disabled' : ''} style="margin-top:10px">${again ? t('Aguardando o rival…') : t('Revanche')}</button></div>
  <div class="yard">${t('Os dois times')}</div>
  <div class="card"><div class="tn" style="margin-bottom:10px">${badge(a.emb, 30)}<b style="font-family:var(--display);font-size:20px">${esc(a.name)}</b></div>${teamLineupHTML(a)}</div>
  <div class="card" style="margin-top:12px"><div class="tn" style="margin-bottom:10px">${badge(b.emb, 30)}<b style="font-family:var(--display);font-size:20px">${esc(b.name)}</b></div>${teamLineupHTML(b)}</div>`;
}
function duGameOf(T, seed) {
  const key = T.map(x => x.roster.map(p => p.id).join(',')).join('|') + seed;
  if (DU.gk === key) return DU.g;
  const g = duelGame(T, seed); g.stage = 'Duelo'; DU.gk = key; DU.g = g; return g;
}
function duPlayGame() {
  const v = DU.v, T = duTeamsFor(v), g = duGameOf(T, v.seed);
  G.teams = T; G.season = { games: [g] }; DU.played = true; openGame(0);
  clearInterval(DU.watch); DU.watch = setInterval(() => { if ($('#modal').hidden) { clearInterval(DU.watch); DU.watch = 0; if (!$('#duel').hidden) duPaint(); } }, 300);
}

// ---------- cliques ----------
document.addEventListener('click', e => {
  const root = $('#duel'); if (!root || root.hidden || !root.contains(e.target)) return;
  const cd = e.target.closest('#dt-stage .dc');
  if (cd) { if (!dtCan() || !cd.classList.contains('can')) return; const i = +cd.dataset.i, side = dtSide(DT.snaps[DT.disp.r], DT.disp.who); duMove({ t: side.fl.includes(i) ? 'pick' : 'flip', i }); return; }
  const b = e.target.closest('button'); if (!b) return;
  switch (b.id) {
    case 'du-shuf': L.emb = rint(0, EMB.length - 1); L.auto = !$('#du-name').value.trim(); if (L.auto) L.name = emN(L.emb); duPaint(); return;
    case 'du-show': if (DU.mode === 'wait') { if (DU.wait.host) duSend({ t: 'opt', show: !DU.wait.show }); } else { DU.show = !DU.show; duPaint(); } return;
    case 'du-bot': duSolo(); return;
    case 'du-create': duReadName(); DU.msg = ''; duConnect(mkCode(), true); return;
    case 'du-join': duReadName(); duJoin($('#du-code').value); return;
    case 'du-start': duSend({ t: 'start' }); return;
    case 'du-ok': duMove({ t: 'ok' }); return;
    case 'du-play': case 'du-replay': if (DU.mode === 'solo') duPlayGame(); else duSend({ t: 'play' }); return;
    case 'du-ready': duSend({ t: 'ready', v: !(DU.wait && DU.wait.seats[DU.wait.you] && DU.wait.seats[DU.wait.you].ready) }); return;
    case 'dw-shuf': L.emb = rint(0, EMB.length - 1); duSendMe(); return;
    case 'du-again': if (DU.mode === 'solo') duSolo(); else duSend({ t: 'again' }); return;
    case 'du-copy': { const link = `${location.origin}/?duelo=${DU.code}`; (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => { b.textContent = t('Link copiado!'); }, () => { window.prompt(t('Copie o link:'), link); }); return; }
  }
});
function duReadName() { const n = $('#du-name'); if (!n) return; L.name = n.value.slice(0, 44).trim(); L.auto = !L.name; if (L.auto) L.name = emN(L.emb); }
function duJoin(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (code.length !== 4) { DU.msg = t('Digite o código de 4 letras.'); return duPaint(); }
  DU.msg = ''; duConnect(code, false);
}
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('dc')) { e.preventDefault(); e.target.click(); } });
let duNameT = 0;
document.addEventListener('input', e => { if (e.target.id === 'dw-name') { clearTimeout(duNameT); duNameT = setTimeout(duSendMe, 350); } if (e.target.id === 'du-code') e.target.value = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''); });
$('#du-back').onclick = () => { duStop(); show('setup'); };
$('#go-duel').onclick = duOpen;
if (MP_ON) {
  try {
    const c = (new URLSearchParams(location.search).get('duelo') || '').toUpperCase();
    if (/^[A-Z2-9]{4}$/.test(c)) { history.replaceState(null, '', location.pathname); setTimeout(() => { duOpen(); duConnect(c, false); }, 0); }
    else { const sv = sessionStorage.getItem('fa-duel'); if (/^[A-Z2-9]{4}$/.test(sv || '') && !sessionStorage.getItem('fa-room')) setTimeout(() => { duOpen(); duConnect(sv, false); }, 0); }
  } catch (e) { }
}
