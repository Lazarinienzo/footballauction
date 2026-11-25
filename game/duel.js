// ----- modo Duelo (1 contra 1): cartas viradas. Contra o bot roda aqui mesmo; com amigo o servidor (src/duel.js) manda e este código só mostra. -----
const DU = { mode: 'menu', show: false, ws: null, local: null, v: null, code: '', host: false, you: 0, seats: [], deadline: 0, tick: 0, botT: [], played: false, watch: 0, left: true, tries: 0, retryT: 0, pingT: 0, wait: null, msg: '', seat: null };
const DU_FULL = { QB: 'Quarterback', RB: 'Running back', WR: 'Wide receiver', TE: 'Tight end', OL: 'Linha ofensiva', EDGE: 'Edge rusher', DT: 'Tackle defensivo', LB: 'Linebacker', CB: 'Cornerback' };
const duMe = () => ({ name: L.auto || !L.name ? emN(L.emb) : L.name, emb: L.emb });
const duP = id => DB[id];
function duStop() {
  DU.botT.forEach(clearTimeout); DU.botT = []; DU.botRun = false; clearInterval(DU.tick); DU.tick = 0; DU.local = null; DU.v = null; DU.wait = null; DU.played = false; DU.watch = 0;
  clearInterval(DU.pingT); clearTimeout(DU.retryT);
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
  duTurn(); show('duel'); duLocalPush(); DU.tick = setInterval(duTickUI, 250);
}
function duTurn() { DU.deadline = Date.now() + DU_TURN_MS; }
function duLocalPush() {
  const D = DU.local; if (!D) return;
  DU.v = { ...D.view(0), you: 0, seed: D.done ? DU.seed : null, seats: DU.seats, left: Math.max(0, DU.deadline - Date.now()), ph: D.done ? 'done' : 'play', again: [] };
  duPaint(); duBot();
}
// o bot vira uma carta por vez, depois escolhe: dá tempo de ver o que ele fez
function duBot() {
  const D = DU.local; if (DU.botRun || !D || D.done || D.cur !== 1 || D.ok[1]) return;
  DU.botRun = true; DU.botSc = {};
  const go = () => {
    if (DU.local !== D || D.done || D.cur !== 1 || D.ok[1]) { DU.botRun = false; return; }
    const c = D.cfg; let wait = 650;
    if (D.fl[1].length < c.f) { const rest = [...Array(c.n).keys()].filter(i => !D.fl[1].includes(i)); D.flip(1, rest[rint(0, rest.length - 1)]); }
    else if (D.sel[1].length < c.k) {
      const sc = i => DU.botSc[i] != null ? DU.botSc[i] : (DU.botSc[i] = D.db[D.board[1][i]].ovr + (R() - .5) * 2 * (D.show ? 4 : 8));
      const left = D.fl[1].filter(i => !D.sel[1].includes(i)).sort((x, y) => sc(y) - sc(x)); D.pick(1, left[0]); wait = 450;
    } else { const r = D.r; D.confirm(1); duTurn(); DU.botRun = false; duLocalPush(); void r; return; }
    duLocalPush(); DU.botT.push(setTimeout(go, wait));
  };
  DU.botT.push(setTimeout(go, 800));
}
function duLocalMove(m) {
  const D = DU.local; if (!D || D.cur !== 0) return;
  const cur = D.cur, r = D.r, ok = m.t === 'flip' ? D.flip(0, m.i) : m.t === 'pick' ? D.pick(0, m.i) : D.confirm(0);
  if (ok && (D.cur !== cur || D.r !== r)) duTurn();
  duLocalPush();
}
function duLocalTimeout() { const D = DU.local; if (D && !D.done && D.cur === 0 && Date.now() >= DU.deadline) { const cur = D.cur; D.auto(0); duTurn(); void cur; duLocalPush(); } }

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
    case 'dwait': DU.joined = true; DU.mode = 'wait'; DU.wait = m; DU.code = m.code; DU.you = m.you; DU.seats = m.seats; DU.show = m.show; DU.v = null; DU.played = false; try { sessionStorage.setItem('fa-duel', m.code); } catch (e) { } if (!vis('duel')) show('duel'); return duPaint();
    case 'd': {
      DU.joined = true; DU.mode = 'mp';
      DU.v = m; DU.you = m.you; DU.seats = m.seats; DU.code = m.code; DU.deadline = Date.now() + m.left; DU.show = m.show;
      if (m.ph === 'play' && DU.played) DU.played = false;
      try { sessionStorage.setItem('fa-duel', m.code); } catch (e) { } if (!vis('duel')) show('duel'); return duPaint();
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
function duCard(id, o) {
  o = o || {};
  if (id == null) return `<button class="dc down ${o.can ? 'can' : ''}" data-i="${o.i}" ${o.can ? '' : 'disabled'} aria-label="${t('Carta virada')}"><svg viewBox="0 0 48 48" width="${o.small ? 22 : 34}" height="${o.small ? 22 : 34}" aria-hidden="true"><ellipse cx="24" cy="24" rx="19" ry="11" transform="rotate(-35 24 24)" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 31l18-14M20 27l2.2 2.4M24 24l2.2 2.4M28 21l2.2 2.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>${o.small ? '' : '<small>touchdown<b>auction</b></small>'}</button>`;
  const p = duP(id), ovr = o.show || o.reveal;
  return `<button class="dc up ${o.sel ? 'sel' : ''} ${o.can ? 'can' : ''} ${o.fresh ? 'fresh' : ''}" data-i="${o.i}" ${o.can ? '' : 'disabled'}>${badge(frIdx(p), o.small ? 26 : 40)}<span class="dn">${esc(o.small ? shortName(p.name) : p.name)}</span><span class="dp">${p.pos} · ${esc(p.tm)}</span><span class="dov num">${ovr ? p.ovr : '??'}</span>${o.sel ? '<i class="ck">✓</i>' : ''}</button>`;
}
function duPicksHTML(ids, reveal) {
  const by = {}; POS_ORDER.forEach(p => by[p] = []); ids.forEach(id => by[duP(id).pos].push(id));
  const rows = POS_ORDER.filter(p => by[p].length).map(p => by[p].map(id => { const q = duP(id); return `<span class="dpk"><b>${p}</b>${badge(frIdx(q), 18)}<i>${esc(shortName(q.name))}</i>${DU.show || reveal ? `<em class="num">${q.ovr}</em>` : ''}</span>`; }).join('')).join('');
  return rows || `<p class="note">${t('Ninguém escolhido ainda.')}</p>`;
}
function duPaint() {
  const el = $('#du-body'); if (!el || $('#duel').hidden) return;
  $('#du-tag').textContent = DU.mode === 'solo' ? t('Contra o bot') : DU.mode === 'menu' ? t('Duelo') : t('Duelo online');
  if (DU.mode === 'menu') return duMenu(el);
  if (DU.mode === 'wait') return duWait(el);
  const v = DU.v; if (!v) { el.innerHTML = `<p class="note" style="text-align:center;padding:40px 0">${t('Conectando…')}</p>`; return; }
  if (v.done) return duDone(el, v);
  duPlay(el, v);
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
  const w = DU.wait, link = `${location.origin}/?duelo=${w.code}`, two = w.seats.length === 2;
  el.innerHTML = `<div class="lb-hero"><small class="eyebrow">${t('SALA DE DUELO')}</small><h1>${two ? t('Tudo pronto.') : t('Chame um amigo.')}</h1></div>
  <div class="ticket"><div><small>${t('CÓDIGO DA SALA')}</small><b class="num">${esc(w.code)}</b></div><p>${t('Passe o código ou o link pro seu amigo entrar.')}</p><button class="cp" id="du-copy" type="button">${t('Copiar link')}</button></div>
  <div class="yard">${t('Na sala')} <span class="cnt num">${w.seats.length}/2</span></div>
  <div class="seats">${w.seats.map((s, i) => `<div class="seat ${i === w.you ? 'me' : ''}">${badge(s.emb, 48)}<div class="sn"><b>${esc(s.name || emN(s.emb))}</b><small>${i === 0 ? t('Anfitrião') : t('Convidado')}${s.on ? '' : ' · ' + t('fora')}</small></div></div>`).join('')}${two ? '' : `<div class="seat dash off"><span class="plus">+</span><div class="sn"><b>${t('Esperando o amigo…')}</b><small>${t('A vaga está aberta')}</small></div></div>`}</div>
  <button class="bopt ${w.show ? 'on' : ''}" id="du-show" type="button" aria-pressed="${w.show}" ${w.host ? '' : 'disabled'} style="margin-top:14px"><span class="sw"><i></i></span><span class="bt"><b>${t('Mostrar o OVR nas cartas')}</b><small>${w.show ? t('Você vê o OVR de cada carta virada.') : t('OVR escondido: você só vê nome e time. O OVR aparece no fim.')}</small></span></button>
  ${w.host ? `<button class="btn full" id="du-start" ${two ? '' : 'disabled'} style="margin-top:14px">${two ? t('Começar o duelo') : t('Falta 1 jogador')}</button>` : `<p class="note" style="margin-top:14px;text-align:center">${t('Aguardando o anfitrião começar.')}</p>`}`;
}
function duPlay(el, v) {
  const mine = v.cur === v.you, c = v.cfg, me = duSeat(v.you), op = duSeat(1 - v.you);
  const used = v.me.fl.length, picking = mine && !v.me.ok && used >= c.f, flipping = mine && !v.me.ok && used < c.f;
  const status = mine ? (v.me.ok ? t('Aguardando o rival…') : flipping ? tpl('Sua vez: vire {n} carta.', 'Sua vez: vire {n} cartas.', c.f - used) : t('Escolha {k} das {f} cartas viradas.', { k: c.k, f: c.f })) : (v.opp.ok ? t('Aguardando…') : t('Vez de {n}: ele vira as cartas.', { n: esc(op.name) }));
  const rival = v.first === 1 - v.you ? t('{n} começa a rodada.', { n: esc(op.name) }) : t('Você começa a rodada.');
  const board = (side, who, big) => `<div class="dboard ${big ? 'big' : 'small'} n${v.cfg.n}">${side.cards.map((id, i) => {
    const flipped = side.fl.includes(i), pk = side.sel.includes(i);
    return duCard(flipped ? id : null, { i, show: DU.show, small: !big, sel: pk, can: big && ((flipping && !flipped) || (picking && flipped)), fresh: DU.fresh === who + ':' + i });
  }).join('')}</div>`;
  el.innerHTML = `<div class="dhead"><div><small>${t('RODADA {r} DE {n}', { r: v.r + 1, n: v.of })}</small><b class="dpos">${v.pos}</b><em>${t(DU_FULL[v.pos])} · ${t('vire {f}, fique com {k}', { f: c.f, k: c.k })}</em></div><div class="dtm"><b id="du-time" class="num">--</b><small>${t('segundos')}</small></div></div>
  <div class="dbar"><i id="du-bar"></i></div>
  <p class="note dstat ${mine ? 'mine' : ''}" id="du-stat">${status}</p><p class="note" style="margin:-4px 0 10px;font-size:12.5px">${rival}</p>
  <div class="dwho"><span class="tn">${badge(me.emb, 24)}${esc(me.name)}</span><small>${t('seu tabuleiro')}</small></div>${board(v.me, 'm', true)}
  ${picking ? `<button class="btn full" id="du-ok" ${v.me.sel.length === c.k ? '' : 'disabled'} style="margin-top:12px">${t('Confirmar')} (${v.me.sel.length}/${c.k})</button>` : ''}
  <div class="dwho" style="margin-top:18px"><span class="tn">${badge(op.emb, 24)}${esc(op.name)}</span><small>${t('tabuleiro do rival')}${v.opp.ok ? ' · ' + t('escolheu') : ''}</small></div>${board(v.opp, 'o', false)}
  <div class="yard" style="margin-top:28px;font-size:20px">${t('Times até agora')}</div>
  <div class="dteams"><div class="card"><div class="dtn">${badge(me.emb, 22)}<b>${esc(me.name)}</b><span class="num">${v.picks[0].length}/16</span></div><div class="dpks">${duPicksHTML(v.picks[0])}</div></div>
  <div class="card"><div class="dtn">${badge(op.emb, 22)}<b>${esc(op.name)}</b><span class="num">${v.picks[1].length}/16</span></div><div class="dpks">${duPicksHTML(v.picks[1])}</div></div></div>`;
  duTickUI();
}
function duTickUI() {
  const v = DU.v; if (!v || v.done) return; if (DU.mode === 'solo') duLocalTimeout();
  const bar = $('#du-bar'), tm = $('#du-time'); if (!bar) return;
  const ms = Math.max(0, DU.deadline - Date.now()); bar.style.width = (100 * ms / DU_TURN_MS).toFixed(1) + '%'; bar.classList.toggle('low', ms < 8000); tm.textContent = Math.ceil(ms / 1000);
}
function duTeamsFor(v) {
  const sh = new Duelo(DB, {}), mine = v.picks[0], opp = v.picks[1];
  sh.picks = v.you === 0 ? [mine, opp] : [opp, mine];
  return sh.teams(DU.seats);
}
function duDone(el, v) {
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
  const b = e.target.closest('button'); if (!b) return;
  const v = DU.v;
  if (b.classList.contains('dc') && v) {
    const i = +b.dataset.i; if (v.cur !== v.you || v.me.ok) return;
    if (!v.me.fl.includes(i)) { DU.fresh = 'm:' + i; duMove({ t: 'flip', i }); } else duMove({ t: 'pick', i });
    return;
  }
  switch (b.id) {
    case 'du-shuf': L.emb = rint(0, EMB.length - 1); L.auto = !$('#du-name').value.trim(); if (L.auto) L.name = emN(L.emb); duPaint(); return;
    case 'du-show': if (DU.mode === 'wait') { if (DU.wait.host) duSend({ t: 'opt', show: !DU.wait.show }); } else { DU.show = !DU.show; duPaint(); } return;
    case 'du-bot': duSolo(); return;
    case 'du-create': duReadName(); DU.msg = ''; duConnect(mkCode(), true); return;
    case 'du-join': duReadName(); duJoin($('#du-code').value); return;
    case 'du-start': duSend({ t: 'start' }); return;
    case 'du-ok': duMove({ t: 'ok' }); return;
    case 'du-play': case 'du-replay': duPlayGame(); return;
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
document.addEventListener('input', e => { if (e.target.id === 'du-code') e.target.value = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''); });
$('#du-back').onclick = () => { duStop(); show('setup'); };
$('#go-duel').onclick = duOpen;
if (MP_ON) {
  try {
    const c = (new URLSearchParams(location.search).get('duelo') || '').toUpperCase();
    if (/^[A-Z2-9]{4}$/.test(c)) { history.replaceState(null, '', location.pathname); setTimeout(() => { duOpen(); duConnect(c, false); }, 0); }
    else { const sv = sessionStorage.getItem('fa-duel'); if (/^[A-Z2-9]{4}$/.test(sv || '') && !sessionStorage.getItem('fa-room')) setTimeout(() => { duOpen(); duConnect(sv, false); }, 0); }
  } catch (e) { }
}
