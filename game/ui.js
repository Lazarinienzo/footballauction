const MP_ON = false /*MPON*/;      // o build online troca por true (precisa do servidor Cloudflare)
// ---------- interface ----------
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_BOTS = Math.min(7, maxTeams(DB) - 1);

// ----- franquias fictícias (paródias de times da NFL) e seus símbolos -----
const INK = '#0b1226';
const EMB = [
  ['Buffalo Wings', '#5aa9ff', `<path d="M3 18C3 9 9 4 21 4c0 9-5 15-14 15-1.5 0-2.7-.4-4-1z"/><path fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" d="M5 19L16 8"/>`],
  ['Miami Fishes', '#4fd8e6', `<path d="M2 12c3-5 8-6 12-3l5-3v12l-5-3c-4 3-9 2-12-3z"/><circle cx="7.5" cy="11" r="1.1" fill="${INK}"/>`],
  ['New England Colonials', '#9aa8ff', '<path d="M3 16 7 7l5 3 5-3 4 9c-4 3-14 3-18 0z"/>'],
  ['New York Planes', '#5bdc6e', `<path d="M2 11 22 3l-6 18-4-7z"/><path fill="none" stroke="${INK}" stroke-width="1.5" d="M12 14 22 3"/>`],
  ['Baltimore Crows', '#b18cff', `<circle cx="10" cy="11" r="7"/><path d="M16 9l7 3-7 3z"/><circle cx="8" cy="9.5" r="1.3" fill="${INK}"/>`],
  ['Cincinnati Tigers', '#ff8f4a', '<path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M3 5c4 1 6 3 7 6M3 11c4 0 6 2 7 5M21 5c-4 1-6 3-7 6M21 11c-4 0-6 2-7 5M10 19c1 1 3 1 4 0"/>'],
  ['Cleveland Beiges', '#e0c9a0', '<g transform="rotate(-45 12 12)"><rect x="6" y="10" width="12" height="4" rx="1"/><circle cx="6" cy="9.2" r="2.3"/><circle cx="6" cy="14.8" r="2.3"/><circle cx="18" cy="9.2" r="2.3"/><circle cx="18" cy="14.8" r="2.3"/></g>'],
  ['Pittsburgh Welders', '#f6d64a', `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="3.53 3.53"/><circle cx="12" cy="12" r="6.6"/><circle cx="12" cy="12" r="2.4" fill="${INK}"/>`],
  ['Houston Cattlemen', '#ff5a5f', '<path d="M3 5c0 8 4 11 9 11s9-3 9-11c-2 5-5 7-9 7S5 10 3 5z"/><rect x="9" y="15" width="6" height="6" rx="3"/>'],
  ['Indianapolis Ponies', '#8fb8ff', '<path fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" d="M6 20V10a6 6 0 0 1 12 0v10"/>'],
  ['Jacksonville Leopards', '#3fd6b0', '<ellipse cx="12" cy="16" rx="5.5" ry="4.5"/><circle cx="5.5" cy="11" r="2.2"/><circle cx="9.5" cy="6.5" r="2.2"/><circle cx="14.5" cy="6.5" r="2.2"/><circle cx="18.5" cy="11" r="2.2"/>'],
  ['Tennessee Titanium', '#4d8dff', `<path d="M12 2l8.7 5v10L12 22l-8.7-5V7z"/><path fill="none" stroke="${INK}" stroke-width="1.8" d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z"/>`],
  ['Denver Altitudes', '#ff9c5a', '<path d="M2 20L9.5 6l4 7 2.5-3.5L22 20z"/>'],
  ['Kansas City Chefs', '#ff6b6b', `<path d="M7 20v-5a4 4 0 0 1-1-7.7A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 6 3.3A4 4 0 0 1 17 15v5z"/><rect x="7" y="16.6" width="10" height="1.5" fill="${INK}"/>`],
  ['Las Vegas Gamblers', '#dfe6f5', `<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><g fill="${INK}"><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="8" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="8" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/></g>`],
  ['Los Angeles Rechargers', '#ffd84a', '<path d="M13.5 2 5 13.5h6L10 22l9-12h-6z"/>'],
  ['Dallas Cowpokes', '#9bb4ff', '<path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z"/>'],
  ['New York Skyscrapers', '#6fb4ff', '<path d="M8 21V7l4-5 4 5v14zM3 21v-8h4v8zM17 21v-6h4v6z"/>'],
  ['Philadelphia Pigeons', '#2fe0b0', '<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M2 9c3-3 7-2 10 3 3-5 7-6 10-3"/>'],
  ['Washington Colonels', '#ff7a7a', '<path fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" d="M4 8l8-5 8 5M4 14l8-5 8 5M4 20l8-5 8 5"/>'],
  ['Chicago Teddies', '#ffa15c', `<circle cx="12" cy="13" r="7.5"/><circle cx="5.8" cy="6.5" r="3"/><circle cx="18.2" cy="6.5" r="3"/><circle cx="12" cy="15.5" r="2.8" fill="${INK}" opacity=".55"/>`],
  ['Detroit Manes', '#6ab7ff', '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.8 11H4.8z"/>'],
  ['Green Bay Cheddars', '#f2cf4a', `<path d="M2 19 22 6v13z"/><g fill="${INK}"><circle cx="14" cy="15.6" r="1.6"/><circle cx="18.2" cy="13.6" r="1.1"/><circle cx="9.5" cy="16.4" r="1.1"/></g>`],
  ['Minnesota Longships', '#b18cff', '<path d="M3 14h18l-3 6H6z"/><path d="M12 3l6 9h-6z"/><rect x="11.2" y="3" width="1.6" height="11"/>'],
  ['Atlanta Peaches', '#ff8a7a', '<path d="M12 21c-5 0-8-4-8-8s3-7 8-5c5-2 8 1 8 5s-3 8-8 8z"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M12 8c0-3 1-5 4-5"/>'],
  ['Carolina Kittens', '#4fd8e6', `<path d="M4 3l5 4h6l5-4v10c0 5-3 8-8 8s-8-3-8-8z"/><g fill="${INK}"><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/></g>`],
  ['New Orleans Sinners', '#e8c97a', '<path d="M12 2c.6 3.6 5.5 5.6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.4-5.4.3 1.6 1.1 2.6 2.1 3C10.6 8.2 10.6 5 12 2z"/>'],
  ['Tampa Bay Pirates', '#ff5a5f', `<path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3.5 6V21h9v-5c2-1 3.5-3 3.5-6a8 8 0 0 0-8-8z"/><g fill="${INK}"><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/><rect x="11" y="14" width="2" height="2"/></g>`],
  ['Arizona Cactuses', '#5bdc6e', '<rect x="10" y="3" width="4" height="18" rx="2"/><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M5 9v3a2 2 0 0 0 2 2h3M19 7v3a2 2 0 0 1-2 2h-3"/>'],
  ['Los Angeles Lambs', '#7aa8ff', '<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6"/>'],
  ['San Francisco Prospectors', '#f0b44a', '<path fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" d="M3 9c4-4.5 14-4.5 18 0M12 5.5V21"/>'],
  ['Seattle Drizzles', '#7fe3f0', '<path d="M7 16a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 7a4.5 4.5 0 0 1 .5 9z"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M8 19.5l-1 2M12 19.5l-1 2M16 19.5l-1 2"/>'],
];
// nomes das franquias em português: paródias diretas dos nomes em inglês ("Os X de Cidade")
const EMB_CITY = ['Buffalo', 'Miami', 'New England', 'New York', 'Baltimore', 'Cincinnati', 'Cleveland', 'Pittsburgh', 'Houston', 'Indianapolis', 'Jacksonville', 'Tennessee', 'Denver', 'Kansas City', 'Las Vegas', 'Los Angeles', 'Dallas', 'New York', 'Philadelphia', 'Washington', 'Chicago', 'Detroit', 'Green Bay', 'Minnesota', 'Atlanta', 'Carolina', 'New Orleans', 'Tampa Bay', 'Arizona', 'Los Angeles', 'San Francisco', 'Seattle'];
const EMB_NICK = ['As Contas', 'Os Golfinhos', 'Os Patriotas', 'Os Jatos', 'Os Corvos', 'Os Tigres de Bengala', 'Os Marrons', 'Os Siderúrgicos', 'Os Texanos', 'Os Potros', 'Os Jaguares', 'Os Titãs', 'Os Cavalos Selvagens', 'Os Chefes', 'Os Invasores', 'Os Carregadores', 'Os Vaqueiros', 'Os Gigantes', 'As Águias', 'Os Comandantes', 'Os Ursos', 'Os Leões', 'Os Empacotadores', 'Os Vikings', 'Os Falcões', 'As Panteras', 'Os Santos', 'Os Bucaneiros', 'Os Cardeais', 'Os Carneiros', 'Os Garimpeiros', 'Os Gaviões-do-Mar'];
const emN = i => LANG === 'pt' ? EMB_NICK[i] + ' de ' + EMB_CITY[i] : EMB[i][0];
const emParts = i => LANG === 'pt' ? [EMB_CITY[i], EMB_NICK[i]] : (() => { const n = EMB[i][0], k = n.lastIndexOf(' '); return [n.slice(0, k), n.slice(k + 1)]; })();
// nome curto pra frases com verbo ("Dallas abre o placar"): em PT usa a cidade se o time tem o nome automático
const tsh = x => (LANG === 'pt' && x.name === emN(x.emb)) ? EMB_CITY[x.emb] : x.name;
const confTok = (nm, emb) => (LANG === 'pt' && emb != null && nm === emN(emb)) ? EMB_NICK[emb].replace(/^(Os|As) /, '').split(' ')[0] : nm;
const TEAM_CODES = ['BUF','MIA','NE','NYJ','BAL','CIN','CLE','PIT','HOU','IND','JAX','TEN','DEN','KC','LV','LAC','DAL','NYG','PHI','WAS','CHI','DET','GB','MIN','ATL','CAR','NO','TB','ARI','LAR','SF','SEA'];
const frIdx = p => Math.max(0, TEAM_CODES.indexOf(p.tm));
const NFL = ['Buffalo Bills','Miami Dolphins','New England Patriots','New York Jets','Baltimore Ravens','Cincinnati Bengals','Cleveland Browns','Pittsburgh Steelers','Houston Texans','Indianapolis Colts','Jacksonville Jaguars','Tennessee Titans','Denver Broncos','Kansas City Chiefs','Las Vegas Raiders','Los Angeles Chargers','Dallas Cowboys','New York Giants','Philadelphia Eagles','Washington Commanders','Chicago Bears','Detroit Lions','Green Bay Packers','Minnesota Vikings','Atlanta Falcons','Carolina Panthers','New Orleans Saints','Tampa Bay Buccaneers','Arizona Cardinals','Los Angeles Rams','San Francisco 49ers','Seattle Seahawks'];
const frName = p => NFL[frIdx(p)];
const badge = (i, px) => { const e = EMB[i] || EMB[0]; return `<span class="emb" style="--c:${e[1]};--s:${px || 32}px"><svg viewBox="0 0 24 24" fill="currentColor" aria-label="${emN(EMB.indexOf(e))}">${e[2]}</svg></span>`; };
const resL = r => t(RES[r]);
const RES = { TD: 'Touchdown', FG: 'Field goal', MISS: 'Chute errado', PUNT: 'Punt', INT: 'Interceptação', FUM: 'Fumble', DOWNS: '4ª descida', SACK: 'Sack' };
// aviso na tela de cada final de posse: título, tema, duração do aviso, pausa na rodada, quem aparece no escudo (o=ataque, d=defesa) e o texto de apoio
const FX = {
  TD:    { t: 'TOUCHDOWN!',      cls: 'td', ms: 2000, w: 2100, who: 'o', sub: (p, O, D) => `${O.name} · +${p.pts}` },
  FG:    { t: 'FIELD GOAL!',     cls: 'fg', ms: 1700, w: 1800, who: 'o', sub: (p, O, D) => `${O.name} · +${p.pts}` },
  MISS:  { t: 'CHUTE ERRADO!',   cls: 'to', ms: 1500, w: 1600, who: 'o', sub: (p, O, D) => t('{o} desperdiça o field goal', { o: tsh(O) }) },
  INT:   { t: 'INTERCEPTAÇÃO!',  cls: 'to', ms: 1700, w: 1800, who: 'd', sub: (p, O, D) => t('{d} rouba a bola', { d: tsh(D) }) },
  FUM:   { t: 'FUMBLE!',         cls: 'to', ms: 1700, w: 1800, who: 'd', sub: (p, O, D) => t('{d} recupera a bola', { d: tsh(D) }) },
  DOWNS: { t: '4ª DESCIDA!',     cls: 'to', ms: 1500, w: 1700, who: 'd', sub: (p, O, D) => t('{d} segura e fica com a bola', { d: tsh(D) }) },
  SACK:  { t: 'SACK!',           cls: 'to', ms: 1300, w: 1400, who: 'd', sub: (p, O, D) => t('{d} derruba o quarterback', { d: tsh(D) }) }
};
const chipCls = r => r === 'TD' ? 'td' : r === 'FG' ? 'fg' : FX[r] ? 'to' : '';
const G = { nBots: 3, name: 'Seu Time', A: null, teams: [], season: null, raf: 0, last: 0, shownI: -2, shownV: -1, fracShown: 1, phaseSeen: '', leaderKey: '', lastPrice: 0, flashedV: -1, btnKey: '' };

const dollars = n => '$' + n;
const ordn = n => LANG === 'pt' ? n + 'º' : n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
const rl = lab => { const m = String(lab).match(/^Rodada (\d+) de (\d+)$/); return m ? t('Rodada {a} de {b}', { a: m[1], b: m[2] }) : t(lab); };
const nf = s => LANG === 'pt' ? String(s).replace('.', ',') : String(s);
const setText = (el, s) => { if (el._t !== s) { el._t = s; el.textContent = s; } };
function anim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
// número que sobe/desce contando (ease-out)
function tween(el, to, fmt, from) {
  if (from != null) { el._shown = from; el._to = null; }
  if (el._to === to) return;
  const f = el._shown == null ? to : el._shown; el._to = to; cancelAnimationFrame(el._r);
  const dur = REDUCED ? 0 : Math.min(650, 180 + Math.abs(to - f) * 30);
  if (!dur || f === to) { el._shown = to; el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = n => {
    const k = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.round(f + (to - f) * e);
    el._shown = v; el.textContent = fmt(v);
    if (k < 1) el._r = requestAnimationFrame(step); else el._shown = to;
  };
  el._r = requestAnimationFrame(step);
}
function show(id) { if (id !== 'results' && id !== 'cup') svStop(); if (id === 'setup' && G.mp) mpLeave(); if (id === 'setup' && MP_ON && typeof homeRefresh === 'function') homeRefresh(); for (const s of ['setup', 'lab', 'cup', 'online', 'lobby', 'auction', 'results']) $('#' + s).hidden = s !== id; window.scrollTo(0, 0); }


// ----- banco de narração (sem números; {q}=QB {r}=RB {w}=WR {e}=TE {t}=tackle {g}=guard {c}=center | defesa: {ed}{dt}{lb}{cb} | {O}=ataque {D}=defesa {oc}=cidade do ataque) -----
const NARR = {
  TD: {
    base: [
      '{q} lança longo e {w} fecha no fundo da end zone.', '{r} abre pelo chão e entra na end zone.', '{q} acha {e} na zona vermelha. Touchdown!',
      '{q} corre pro meio e mergulha pra pontuar.', 'Passe curto pra {w}, que escapa de dois marcadores e pontua.', '{r} atravessa a linha e ninguém segura.',
      '{t} abre espaço pela esquerda e {r} corre até o fim.', '{q} finge a corrida, espera {w} cruzar e acerta o passe. Touchdown!',
      'Jogada de efeito: {q} escapa da pressão e encontra {w} livre na end zone.', '{e} vence o linebacker no corpo a corpo e pega o passe na linha de fundo.',
      '{cb} chega atrasado e {w} segura a bola com uma mão só. Touchdown!', '{r} salta por cima da pilha na linha de gol.',
      '{q} dá um passe perfeito na lateral e {w} pisa dentro da end zone.', 'Drive longo e paciente de {O} termina com {r} na end zone.',
      '{w} ganha da marcação de {cb} e a torcida de {oc} vai à loucura.', '{g} e {c} empurram a linha de {D} pra trás e {r} caminha pra pontuar.',
      '{q} aguenta a pressão de {ed} até o último segundo e lança pra {w}. Touchdown!', 'Em quarta descida, {O} aposta e {q} converte com um passe na linha de gol.',
      '{w} recebe no meio do campo, deixa {lb} pra trás e corre até o fim.', 'Screen pass pra {r}, que acha o corredor aberto e pontua.',
      '{dt} é engolido pela linha e {r} entra na end zone sem ser tocado.', '{q} muda a jogada na linha, vê a marcação errada e acerta {e} na end zone.',
      '{q} corre no sneak e mergulha por cima da pilha. Touchdown!', '{q} corre pela lateral depois de escapar da pressão e pisa na end zone.', '{q} corre pelo meio e ninguém consegue segurá-lo.',
      '{q} acha o alvo livre na zona vermelha e é touchdown de {O}.', 'Passe certeiro de {q} no canto da end zone. Touchdown!', 'Jogada ensaiada de {O}: {q} lança e a defesa de {D} fica olhando.'
    ],
    open: ['Começo avassalador: {q} comanda o drive inteiro e {w} abre o placar.', '{O} abre o jogo marcando. {r} termina o primeiro drive na end zone.', 'Primeiro ataque, primeiro touchdown. {q} não perdoou a defesa de {D}.', '{q} acerta {e} logo no primeiro drive e {oc} sai na frente.'],
    answer: ['Resposta imediata! {q} acha {w} e {O} responde na hora.', '{D} mal comemorou e {r} já devolve o touchdown.', '{O} não deixa o adversário respirar: {q} conecta com {w} e responde.', 'O silêncio na torcida de {oc} dura pouco: {r} corre e pontua.'],
    late: ['Na última posse, {q} faz o que precisava e acha {w} na end zone.', 'Pressão total no fim: {q} segura a calma e {w} pontua.', 'Com o relógio apertando, {r} atravessa a linha de gol.'],
    trail: ['{O} precisava disso: {q} lança no fundo e {w} traz o time de volta.', 'Reação em curso. {r} entra na end zone e {O} volta pro jogo.', '{q} se recusa a perder e acha {e} na linha de gol.'],
    blow: ['{O} só amplia: {r} passeia pela defesa de {D} e marca.', 'Domínio total. {q} nem precisa de pressa pra achar {w} livre.'],
    ot: ['Prorrogação! {q} acha {w} e a end zone vira festa.', 'Morte súbita emocional: {r} pontua na prorrogação e {oc} explode.']
  },
  FG: {
    base: [
      'A defesa de {D} segura na zona vermelha. O chute é bom.', '{ed} força a pressão, mas o drive chega ao alcance do chute. Field goal.', '{cb} evita o touchdown no último passe. Chute certo.',
      'Drive para na beirada da end zone. Field goal convertido.', '{dt} bloqueia o corredor perto da linha de gol e {O} se contenta com o chute.',
      '{q} tenta {w} duas vezes, {cb} desvia ambas. O chutador entra e acerta.', 'O snap, o holder, o chute: no meio das traves. Field goal de {O}.',
      '{lb} para {r} a um metro da linha. Sem touchdown, mas o field goal vale.', '{D} fecha a porta na zona vermelha e {O} cobra o chute. É bom.',
      'Mais um drive que morre perto: {O} pega os três pontos.'
    ],
    open: ['{O} abre o placar com um field goal depois de um drive que não passou da zona vermelha.'],
    late: ['No fim do jogo, {O} não arrisca e vai pro chute. Field goal.', 'O chutador de {O} sente a pressão... e acerta.'],
    trail: ['{O} diminui a diferença com um field goal seguro.'],
    blow: ['Mais três pontos pra {O} administrar a vantagem.'],
    ot: ['Prorrogação: o chute de {O} sobe, gira... e passa entre as traves.']
  },
  PUNT: {
    base: [
      '{ed} pressiona {q} e o drive morre. Punt.', '{cb} derruba o passe na quarta descida. Punt.', '{lb} para a corrida no meio. Punt.', '{dt} fecha o buraco e a ofensiva não anda. Punt.',
      'Três e fora pra {O}. Punt.', '{q} é sackeado por {ed}. Sem opção, punt.', '{cb} cola em {w} o tempo todo e não deixa passe. Punt.',
      'A linha de {O} cede, {q} corre pra todo lado e acaba derrubado. Punt.', '{D} lê a jogada de {r} antes de acontecer. Perda de jardas e punt.',
      '{lb} lê o plano de {O} na corrida e força o punt.', 'Chute longo do punter de {O}, a bola cai lá no fundo do campo.', 'A defesa de {D} está inspirada e {O} não passa do meio-campo. Punt.'
    ],
    open: ['Começo truncado: {O} não encontra espaço e dá o punt.'],
    late: ['O relógio corre e {O} não consegue avançar. Punt.', '{ed} chega rápido demais e {q} se desfaz da bola. Punt.'],
    trail: ['{O} precisava de pontos, mas {D} não cedeu. Punt.'],
    blow: ['{O} nem tenta forçar. Punt e segue o jogo.'],
    ot: ['Prorrogação travada: {ed} derruba {q} e {O} chuta.']
  }
};
NARR.MISS = {
  base: ['O chute de {O} sai torto e bate na trave. Sem pontos.', 'O snap vem baixo, o holder se atrapalha e o chute de {O} nem sai direito.', 'O chutador de {O} acerta mal a bola e ela passa longe das traves.',
    '{ed} salta e quase bloqueia: o chute de {O} sai fraco e errado.', 'A bola sobe, gira e vai pra fora pela esquerda. {O} perde três pontos fáceis.', 'Chute de {O} bate no travessão e volta. Ninguém acredita.'],
  open: ['{O} chega na zona vermelha, mas o chute errado deixa o placar zerado.'],
  late: ['No fim do jogo, o chute de {O} não vai. A pressão pesou.'],
  trail: ['{O} precisava dos pontos e o chute sai pela direita.'],
  blow: ['Até o chutador de {O} erra quando o jogo está resolvido.'],
  ot: ['Prorrogação: o chute de {O} vai pra fora e {D} respira aliviado.']
};
NARR.INT = {
  base: ['{cb} lê o passe de {q} e intercepta! A bola é de {D}.', '{q} força o passe pra {w} e {cb} pega no ar. Interceptação!', '{lb} sobe na rota, desvia e agarra a bola. {D} rouba a posse.',
    '{ed} pressiona {q}, que atira no desespero. {cb} fica com ela.', 'Passe errado de {q} na linha lateral e {cb} devolve até o meio do campo.', '{q} não vê o linebacker e {lb} intercepta. Virada de posse!',
    'Bola tocada em {e} e caiu nas mãos de {lb}. Interceptação!'],
  open: ['Começo desastroso: {q} é interceptado logo no primeiro drive.'],
  late: ['Na última posse, {q} arrisca demais e {cb} intercepta.'],
  trail: ['{O} precisava reagir, mas {q} é interceptado e o jogo piora.'],
  blow: ['{q} tenta forçar o jogo e {cb} aproveita pra ficar com a bola.'],
  ot: ['Prorrogação! {cb} intercepta {q} e {D} está com a bola em campo curto.']
};
NARR.FUM = {
  base: ['{r} perde a bola no choque e {lb} cai em cima. Fumble!', '{ed} chega por trás e arranca a bola de {q}. {D} recupera.', '{w} pega o passe, mas {cb} dá o tapa e a bola cai. Fumble de {O}!',
    'A bola escapa das mãos de {r} e rola no chão. {dt} se joga em cima.', 'O snap de {c} passa por {q} e {D} cai na bola.', '{e} é atingido logo depois de pegar, solta a bola e {D} fica com ela.',
    '{lb} arranca a bola de {r} na pilha. Posse de {D}!'],
  open: ['{O} entrega a bola logo no começo: fumble de {r}.'],
  late: ['Fumble na última posse! {r} perde a bola e {D} respira.'],
  trail: ['{O} precisava de pontos e perde a bola. Fumble de {q}.'],
  blow: ['Descuido de {O}: {r} solta a bola e {D} recupera.'],
  ot: ['Prorrogação! Fumble de {r} e {D} fica com tudo na mão.']
};
NARR.DOWNS = {
  base: ['{O} decide ir na quarta descida e {lb} para {r} antes da linha. A bola é de {D}.', '{q} procura {w} na quarta descida e {cb} derruba o passe. Posse de {D}!', '{O} aposta na quarta descida e {dt} fecha o buraco. Falhou!',
    'Quarta e curta: {q} tenta o sneak, mas a defesa de {D} segura na linha.', '{ed} chega rápido e {q} não acha ninguém na quarta descida. {D} fica com a bola.', 'O treinador de {O} arrisca e a aposta não paga. {D} segura!'],
  open: ['Começo ousado: {O} vai na quarta descida e não converte.'],
  late: ['Na última posse, {O} tenta na quarta e {D} segura.'],
  trail: ['{O} precisava arriscar e a quarta descida falha.'],
  blow: ['{O} insiste na quarta descida mesmo no sufoco e {D} segura.'],
  ot: ['Prorrogação! {O} arrisca na quarta e {D} para tudo.']
};
NARR.SACK = {
  base: ['{ed} passa pela linha e derruba {q} atrás da linha de scrimmage. Sack!', '{dt} esmaga o bolso e {q} vai ao chão. Sack, e a posse acaba.', '{lb} vem de blitz e acerta {q} sem dó. Sack de {D}!',
    '{q} segura a bola demais e {ed} pega por trás. Sack!', '{g} perde a marcação e {dt} chega em {q} antes do passe. Sack!', 'Pressão total de {D}: {ed} derruba {q} e a posse morre ali.'],
  open: ['Primeira posse de {O} termina em sack de {ed}.'],
  late: ['Sack na última posse. {ed} acaba com a esperança de {O}.'],
  trail: ['{O} precisava de espaço e {ed} derruba {q} de novo. Sack!'],
  blow: ['{D} está dominando: {ed} faz mais um sack em {q}.'],
  ot: ['Prorrogação! {ed} derruba {q} e {O} fica sem ação.']
};
const INTRO = {
  'Super Bowl': ['É o Super Bowl. Quem vencer entra pra história.', 'Super Bowl: o último jogo da temporada, sem segunda chance.', 'A final de tudo. As duas torcidas já estão de pé.'],
  'Semifinal da Conferência': ['Semifinal da conferência: quem perder vai pra casa.', 'Mata-mata. Um tropeço e a temporada acaba.', 'Vaga na final da conferência em jogo. Ninguém quer ir embora agora.'],
  'Final da Conferência': ['Final da conferência: o vencedor vai ao Super Bowl.', 'Quem ganhar carimba o passaporte pro Super Bowl.', 'Uma vitória separa esse time da grande final.'],
  'Semifinal': ['Semifinal: quem perder vai pra casa.', 'Mata-mata. Um tropeço e a temporada acaba.', 'Vaga na final em jogo. Ninguém quer ir embora agora.'],
  'Temporada': ['Jogo da temporada regular. Cada vitória conta na tabela.', 'Mais uma rodada. A classificação está no ar.', 'Bola rolando. Os dois times precisam desse resultado.']
};

// ----- laboratório da simulação -----
const LAB = { sc: [0, 0], n: 0, log: [] };
const labTeams = () => {
  const v = id => +$('#' + id).value;
  const mk = (off, def) => ({ rt: { off, def, all: (off + def) / 2 } });
  return [mk(v('r-a1'), v('r-a2')), mk(v('r-b1'), v('r-b2'))];
};
function labProbs() {
  const [A, B] = labTeams();
  ['a1', 'a2', 'b1', 'b2'].forEach(k => $('#o-' + k).textContent = $('#r-' + k).value);
  const lv = (A.rt.all + B.rt.all) / 2;
  const line = (nm, T, o, d, dn, D) => { const q = driveOdds(o, d, 3000, T, D), p1 = q.TD, fg = q.FG, nn = q.none;
    return `<div class="pl"><b>${t('{nm} ataca', { nm })}</b><span class="mu">${t('ataque {o} contra defesa {d} do {dn}', { o, d, dn })}</span><div class="pbar"><i class="td" style="width:${p1 * 100}%"></i><i class="fg" style="width:${fg * 100}%"></i><i class="pu" style="width:${nn * 100}%"></i></div><div class="pn num"><span>TD ${pct(p1)}</span><span>FG ${pct(fg)}</span><span>${t('Sem pontos')} ${pct(nn)}</span><span>≈ ${q.pts.toFixed(1)} pts</span></div></div>`; };
  $('#lab-probs').innerHTML = line(t('Time A'), A, A.rt.off, B.rt.def, 'B', B) + line(t('Time B'), B, B.rt.off, A.rt.def, 'A', A);
}
function labReset() {
  LAB.sc = [0, 0]; LAB.n = 0; LAB.log = []; LAB.carry = 0;
  $('#lab-sa').textContent = 0; $('#lab-sb').textContent = 0; $('#lab-log').hidden = true; $('#lab-log').innerHTML = '';
  $('#lab-status').textContent = t('Jogo ainda não começou.'); $('#lab-step').disabled = false; $('#lab-step').textContent = t('Próxima posse');
}
const labOver = () => LAB.n >= POSSESSIONS * 2 && (LAB.sc[0] !== LAB.sc[1] || LAB.n >= POSSESSIONS * 2 + 6);
function labStep() {
  if (labOver()) return false;
  const T2 = labTeams(), side = LAB.n % 2, rd = Math.floor(LAB.n / 2) + 1;
  const r = simPossession(T2[side], T2[1 - side], { short: LAB.carry || 0 });
  LAB.carry = TAKE[r.result] || 0;
  LAB.sc[side] += r.pts; LAB.n++;
  LAB.log.unshift({ side, rd, ot: rd > POSSESSIONS, ...r, sc: LAB.sc.slice() });
  labPaint();
  return true;
}
function labPaint() {
  $('#lab-sa').textContent = LAB.sc[0]; $('#lab-sb').textContent = LAB.sc[1];
  if (!LAB.log.length) { $('#lab-status').textContent = t('Jogo ainda não começou.'); return; }
  $('#lab-log').hidden = false;
  $('#lab-log').innerHTML = LAB.log.map((e, i) => `<div class="lrow ${i === 0 ? 'new' : ''}"><span class="chip ${chipCls(e.result)}">${resL(e.result)}</span><span>${t(e.side ? 'Time B' : 'Time A')} · ${e.ot ? t('posse OT {n}', { n: e.rd - POSSESSIONS }) : t('posse {n}', { n: e.rd })}<small>${tpl('{n} série', '{n} séries', e.series)} · ${t('bola da {a} à {b}', { a: Math.round(e.y0), b: e.yd })}${e.short ? ' · ' + t('campo curto') : ''}</small></span><span class="num" style="color:var(--mute)">${e.sc[0]}–${e.sc[1]}</span></div>`).join('');
  const done = labOver();
  $('#lab-status').textContent = done ? (LAB.sc[0] === LAB.sc[1] ? t('Fim: empate.') : t(LAB.sc[0] > LAB.sc[1] ? 'Fim: Time A venceu.' : 'Fim: Time B venceu.')) : t('Próxima: {side} ataca, posse {n}.', { side: t(LAB.n % 2 ? 'Time B' : 'Time A'), n: LAB.n >= POSSESSIONS * 2 ? 'OT' : Math.floor(LAB.n / 2) + 1 });
  $('#lab-step').disabled = done;
  return true;
}
function labBatch(n) {
  const T2 = labTeams(); let w = [0, 0], tie = 0, pts = [0, 0], td = 0, fg = 0, otn = 0, to = 0;
  for (let i = 0; i < n; i++) { const g = simGame(T2[0], T2[1]); pts[0] += g.sa; pts[1] += g.sb; if (g.sa > g.sb) w[0]++; else if (g.sb > g.sa) w[1]++; else tie++; if (g.ot) otn++; g.poss.forEach(p => { if (p.result === 'TD') td++; else if (p.result === 'FG') fg++; else if (TAKE[p.result]) to++; }); }
  $('#lab-stats').hidden = false;
  $('#lab-stats').innerHTML = `<div class="sg"><div><b class="num">${(w[0] / n * 100).toFixed(0)}%</b><span>${t('Time A vence')}</span></div><div><b class="num">${(w[1] / n * 100).toFixed(0)}%</b><span>${t('Time B vence')}</span></div><div><b class="num">${(tie / n * 100).toFixed(1)}%</b><span>${t('empates')}</span></div></div>
  <table class="cmp" style="margin-top:12px"><tr><th>${t('MÉDIA POR JOGO ({n})', { n })}</th><th></th></tr><tr><td>${t('Pontos A · B')}</td><td class="num">${(pts[0] / n).toFixed(1)} · ${(pts[1] / n).toFixed(1)}</td></tr><tr><td>${t('Touchdowns (os dois times)')}</td><td class="num">${(td / n).toFixed(2)}</td></tr><tr><td>${t('Field goals (os dois times)')}</td><td class="num">${(fg / n).toFixed(2)}</td></tr><tr><td>${t('Bolas roubadas (os dois times)')}</td><td class="num">${(to / n).toFixed(2)}</td></tr><tr><td>${t('Foi pra prorrogação')}</td><td class="num">${(otn / n * 100).toFixed(1)}%</td></tr></table>`;
}
['a1', 'a2', 'b1', 'b2'].forEach(k => $('#r-' + k).oninput = () => { labProbs(); labReset(); $('#lab-stats').hidden = true; });
$('#go-lab').onclick = () => { labProbs(); labReset(); show('lab'); };
$('#lab-back').onclick = () => show('setup');
$('#lab-step').onclick = labStep;
$('#lab-reset').onclick = () => { labReset(); $('#lab-stats').hidden = true; };
$('#lab-game').onclick = () => { labReset(); while (labStep()); };
$('#lab-batch').onclick = () => labBatch(2000);

// ----- lobby -----
const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const mkCode = () => Array.from({ length: 4 }, () => CODE_CH[rint(0, CODE_CH.length - 1)]).join('');
const L = { code: mkCode(), emb: rint(0, EMB.length - 1), name: '', bots: [], uid: 0, seen: new Set(), log: [] };
L.name = emN(L.emb); L.auto = true;
const taken = () => new Set([L.emb, ...L.bots.map(b => b.emb)]);
const freeEmb = () => { const t = taken(), f = EMB.map((_, i) => i).filter(i => !t.has(i)); return f[rint(0, f.length - 1)]; };
function logL(k, v) { L.log.unshift({ k, v, id: ++L.uid }); L.log.length = Math.min(L.log.length, 5); paintFeed(); }
function addBot(quiet) {
  if (L.bots.length >= MAX_BOTS) return;
  const e = freeEmb(), b = { name: emN(e), emb: e, uid: ++L.uid };
  L.bots.push(b); if (!quiet) logL('Entrou na sala: {n}', { n: b.name });
  paintLobby();
}
function openLobby(first) {
  if (first) { L.code = mkCode(); L.bots = []; L.log = []; L.seen = new Set(); for (let i = 0; i < 3; i++) addBot(true); logL('Sala criada. Escolha sua franquia.'); }
  $('#lb-name').value = L.name;
  show('lobby'); paintLobby();
}
function paintFeed() {
  $('#lb-feed').innerHTML = L.log.map((e, i) => `<div class="fl ${i === 0 ? 'new' : ''}">${esc(t(e.k, e.v))}</div>`).join('');
}
function paintLobby() {
  lobbyMode();
  $('#lb-code').textContent = L.code;
  const others = L.mp ? mpOthers() : L.bots, n = others.length + 1;
  $('#lb-prev').innerHTML = badge(L.emb, 76); anim($('#lb-prev'), 'pop');
  $('#lb-prevname').textContent = L.name || t('Seu Time');
  $('#lb-prevemb').textContent = L.auto ? t('Franquia fictícia') : emN(L.emb);
  // grade de escudos: os já escolhidos ficam apagados
  const ownerOf = {}; others.forEach(b => ownerOf[b.emb] = b.name);
  const parts = n => { const k = n.lastIndexOf(' '); return [n.slice(0, k), n.slice(k + 1)]; };
  $('#lb-grid').innerHTML = EMB.map((e, i) => { const [c, nk] = emParts(i); return `<button class="emo ${i === L.emb ? 'on' : ''}" data-e="${i}" ${ownerOf[i] ? 'disabled' : ''} aria-label="${ownerOf[i] ? t('{n}, já escolhido', { n: emN(i) }) : emN(i)}">${badge(i, 44)}<span><i>${esc(c)}</i><b>${esc(nk)}</b></span></button>`; }).join('');
  // assentos
  const seat = (key, emb, name, tag, cls, extra) => {
    const fresh = !L.seen.has(key); L.seen.add(key);
    return `<div class="seat ${cls} ${fresh ? 'in' : ''}" data-k="${key}">${badge(emb, 48)}<div class="sn"><b>${esc(name)}</b><small>${tag}</small></div>${extra || ''}</div>`;
  };
  if (L.mp) mpPaintSeats(seat);
  else $('#lb-seats').innerHTML = seat('me', L.emb, L.name || t('Seu Time'), t('Você · anfitrião'), 'me') +
    L.bots.map(b => seat('b' + b.uid, b.emb, b.name, t('Bot · pronto'), '', `<button class="x" data-rm="${b.uid}" aria-label="${esc(t('Tirar {n}', { n: b.name }))}">×</button>`)).join('') +
    (L.bots.length < MAX_BOTS ? `<button class="seat dash" id="lb-add"><span class="plus">+</span><div class="sn"><b>${t('Adicionar bot')}</b><small>${t('Preenche a vaga')}</small></div></button>` : '') +
    (MP_ON ? '' : `<div class="seat dash off"><span class="plus">＋</span><div class="sn"><b>${t('Convidar amigo')}</b><small>${t('Online em breve')}</small></div></div>`);
  $('#lb-count').textContent = `${n}/${L.mp ? MP.lobby.max : MAX_BOTS + 1}`;
  const c1 = Math.ceil(n / 2), c2 = n - c1;
  $('#lb-go').textContent = n < MIN_TEAMS ? t('Faltam {n} pra começar', { n: MIN_TEAMS - n }) : t('Abrir o leilão com {n} times', { n });
  $('#lb-note').textContent = n < MIN_TEAMS ? t('Mínimo de {n} times pra formar as 2 conferências.', { n: MIN_TEAMS }) : t('{s} vagas pra preencher. As conferências ({a} e {b} times) são sorteadas depois do leilão.', { s: TOTAL_SLOTS * n, a: c1, b: c2 });
  $('#lb-go').disabled = n < MIN_TEAMS;
  if (L.mp) mpPaintGo(n);
}
$('#go-lobby').onclick = $('#go-solo').onclick = () => { L.mp = false; openLobby(!L.log.length || L.wasMp); L.wasMp = false; };
$('#r-home').onclick = () => { svStop(); SV.el = null; show('setup'); };
$('#lb-back').onclick = () => show('setup');
$('#lb-name').oninput = e => {
  L.name = e.target.value.slice(0, 44); L.auto = L.name === emN(L.emb); if (L.mp) mpName();
  setText($('#lb-prevname'), L.name || t('Seu Time'));
  const s = document.querySelector('.seat.me b'); if (s) s.textContent = L.name || t('Seu Time');
};
$('#lb-name').onchange = () => { const n = L.name.trim(); if (n && !L.auto && n !== L.logged) { L.logged = n; logL('Você virou {n}', { n }); } };
$('#lb-grid').onclick = e => {
  const b = e.target.closest('.emo'); if (!b || b.disabled) return;
  const i = +b.dataset.e; if (i === L.emb) return;
  const keep = !L.auto; L.emb = i; if (!keep) { L.name = emN(i); $('#lb-name').value = L.name; }
  if (L.mp) { mpSend({ t: 'pick', emb: i, auto: L.auto }); if (!L.auto) mpName(); return; }
  logL('Você escolheu {n}', { n: emN(i) }); paintLobby();
};
$('#lb-seats').onclick = e => {
  if (L.mp) return mpSeatsClick(e);
  if (e.target.closest('#lb-add')) { addBot(); return; }
  const x = e.target.closest('[data-rm]');
  if (x) { const b = L.bots.find(q => q.uid === +x.dataset.rm); L.bots = L.bots.filter(q => q !== b); L.seen.delete('b' + b.uid); logL('Saiu da sala: {n}', { n: b.name }); paintLobby(); }
};
$('#lb-go').onclick = () => {
  if (L.mp) { if (mpIsHost()) mpSend({ t: 'start' }); else { const m = MP.lobby, me0 = m.seats.find(x => x.uid === m.you); mpSend({ t: 'ready', on: !(me0 && me0.ready) }); } return; }
  G.mp = false; G.meId = 0; G.A = null;
  const flat = {}; POS_ORDER.forEach(p => flat[p] = 1);
  G.name = (L.name.trim() || emN(L.emb)).slice(0, 44);
  G.teams = [{ id: 0, name: G.name, emb: L.emb, human: true, budget: BUDGET, roster: [], persona: { aggr: 1, pos: flat } }];
  L.bots.forEach((b, i) => { const t = newBot(i + 1, b.name); t.emb = b.emb; G.teams.push(t); });
  G.A = new Auction(G.teams, DB);
  Object.assign(G, { shownI: -2, shownV: -1, fracShown: 1, phaseSeen: '', leaderKey: '', lastPrice: 0, flashedV: -1, btnKey: '', feedKey: '', season: null });
  $('#season').hidden = true; $('#season').innerHTML = '';
  // estruturas fixas (só atualizam texto, pra animar sem recriar)
  $('#table').innerHTML = G.teams.map(t => `<div class="trow">${badge(t.emb, 26)}<span>${esc(t.name)}${t.human ? ' (' + tt('você') + ')' : ''}</span><span class="b num"></span><span class="v"></span><span class="bb"><i></i></span></div>`).join('');
  $('#a-bud')._shown = BUDGET; $('#a-bud')._to = BUDGET; $('#a-bud').textContent = dollars(BUDGET);
  show('auction'); paintAuction(true, 16);
  cancelAnimationFrame(G.raf); G.last = performance.now(); G.raf = requestAnimationFrame(frame);
};

// ----- sons (WebAudio, sem arquivos): "up" curtinho a cada lance -----
const sfx = {
  on: (() => { try { return localStorage.getItem('fa-snd') !== '0'; } catch (e) { return true; } })(), ctx: null,
  unlock() { if (!sfx.ctx) { try { sfx.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } } if (sfx.ctx.state === 'suspended') sfx.ctx.resume(); },
  up(mine) {
    if (!sfx.on || !sfx.ctx || sfx.ctx.state !== 'running') return;
    const nw = performance.now(); if (nw - (sfx.last || 0) < 110) return; sfx.last = nw;
    const c = sfx.ctx, t0 = c.currentTime, f = mine ? [620, 930] : [440, 560], v = mine ? .16 : .07;
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(f[0], t0); o.frequency.setValueAtTime(f[1], t0 + .07);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .015); g.gain.exponentialRampToValueAtTime(.001, t0 + .22);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + .24);
  },
  paint() { const b = $('#a-snd'); if (b) { b.classList.toggle('off', !sfx.on); b.setAttribute('aria-pressed', String(sfx.on)); b.setAttribute('aria-label', t(sfx.on ? 'Som ligado' : 'Som desligado')); } }
};
document.addEventListener('pointerdown', sfx.unlock); document.addEventListener('keydown', sfx.unlock);
$('#a-snd').onclick = () => { sfx.on = !sfx.on; try { localStorage.setItem('fa-snd', sfx.on ? '1' : '0'); } catch (e) { } sfx.paint(); if (sfx.on) sfx.up(true); };
sfx.paint();

// ----- leilão -----
const me = () => G.teams[G.meId || 0];
function frame(now) {
  G.raf = requestAnimationFrame(frame);
  const dt = Math.min(250, now - G.last); G.last = now;
  G.A.tick(dt);
  if (G.A.done) { cancelAnimationFrame(G.raf); showResults(); return; }
  paintAuction(false, dt);
}
function lineupRows(roster) {
  const out = [];
  for (const pos of POS_ORDER) {
    const have = roster.filter(p => p.pos === pos).sort((a, b) => b.ovr - a.ovr);
    for (let i = 0; i < SLOTS[pos]; i++) out.push({ pos, p: have[i] || null });
  }
  return out;
}
function slotHTML(r, o) {
  o = o || {};
  const side = OFF_POS.includes(r.pos) ? 'off' : 'def';
  const want = o.cur && !r.p && o.cur.pos === r.pos;
  const isNew = o.newId != null && r.p && r.p.id === o.newId;
  const rv = o.i != null ? ` rv" style="--i:${o.i}` : '';
  return `<div class="slot ${r.p ? '' : 'empty'} ${want ? 'want' : ''} ${isNew ? 'new' : ''}${rv}"><span class="pos ${side}">${r.pos}</span><span class="nm">${r.p ? `${esc(r.p.name)}<small>${esc(frName(r.p))}</small>` : t('vaga aberta')}</span><span class="o num">${r.p ? r.p.ovr : ''}</span><span class="pd num">${r.p && r.p.paid != null ? dollars(r.p.paid) : ''}</span></div>`;
}

// frase de impacto da venda (depende de quanto foi gasto)
function impactLine(s) {
  const T = s.team, price = s.price, left = T.budget, before = left + price, frac = price / before, ovr = s.player.ovr, who = T.human ? t('Você') : tsh(T);
  const open = TOTAL_SLOTS - T.roster.length, pick = a => a[rint(0, a.length - 1)];
  if (price <= 2 && ovr >= 88) return t(pick(['Roubo à luz do dia! Levou quase de graça.', 'Pechincha do leilão. Ninguém acreditou.', 'O leiloeiro até estranhou o preço.']));
  if (price >= 35 || frac >= .5) return t(pick(['{who} jogou quase o cofre inteiro nessa cartada.', 'Valor de Super Bowl. Agora é rezar pelo resto do time.', 'Que loucura! Esse lance vai pesar no resto do leilão.', 'Ninguém gasta tanto sem acreditar. Aposta alta.']), { who });
  if (left <= 3 && open > 1 && R() < .85) return t(pick(['Cofre quase vazio. Agora é economia pura.', 'Dinheiro acabando e ainda tem vaga pra preencher.']));
  if (price >= 20 && R() < .8) return t(pick(['Pagou caro, mas levou o craque.', 'Cheque grosso. Quem não arrisca não petisca.', '{who} sabia exatamente o que queria.', 'Investimento pesado, retorno em campo.']), { who });
  if (price >= 10 && R() < .55) return t(pick(['Preço de titular. Compra sólida.', 'Bom dinheiro por um bom jogador.', 'Negócio fechado sem drama.']));
  if (price <= 3 && R() < .5) return t(pick(['Barato. Sobra dinheiro pra gastar adiante.', 'Compra esperta, sem gastar muito.']));
  return '';
}
function paintAuction(force, dt) {
  const A = G.A, M = me(), p = A.cur; if (!p) return;
  const stage = $('#stage'), priceEl = $('#s-price'), lead = $('#s-leader');

  if (G.shownI !== A.i || force) {                       // jogador novo entrando
    G.shownI = A.i; G.fracShown = 1; G.phaseSeen = 'bidding'; G.leaderKey = ''; G.lastPrice = 0;
    $('#s-name').textContent = p.name;
    const ps = $('#s-pos'); ps.textContent = p.pos; ps.className = 'pos ' + (OFF_POS.includes(p.pos) ? 'off' : 'def');
    tween($('#s-ovr'), p.ovr, String, p.ovr - 30);
    priceEl._shown = 0; priceEl._to = 0; cancelAnimationFrame(priceEl._r); priceEl.textContent = '$0';
    anim($('#s-top'), 'swap'); anim(priceEl, 'swap');
    $('#stamp').hidden = true; stage.classList.remove('sold', 'won');
    $('#s-call').textContent = ''; $('#s-call')._t = ''; $('#s-call').className = 'call'; $('#s-impact').textContent = '';
    $('#s-frn').innerHTML = `<i class="tcode">${esc(p.tm)}</i><span>${esc(frName(p))}</span>`;
    $('#s-need').textContent = t('{a} de {b}', { a: A.i + 1, b: A.pool.length });
    paintLineup(); paintMarket();
  }
  // boletim do lote: últimas 3 ações (lance ou saída); a mais nova entra por cima e a mais antiga sai
  const fk = A.i + ':' + A.nBids;
  if (G.feedKey !== fk || force) {
    G.feedKey = fk;
    { const lb = A.bids[A.bids.length - 1]; if (!force && lb && lb.kind !== 'pass' && G.feedI === A.i) sfx.up(lb.team === M); G.feedI = A.i; }
    const nm = tm => tm === M ? t('Você') : tm.name, last = A.bids.slice(-3).reverse();
    $('#s-feed').innerHTML = last.length ? last.map((b, i) => b.kind === 'pass'
      ? `<div class="bl out ${b.team === M ? 'me' : ''} ${i === 0 ? 'new' : ''}"><span class="w">${esc(nm(b.team))}</span><span class="d">${t('saiu do lance')}</span><b></b></div>`
      : `<div class="bl ${b.team === M ? 'me' : ''} ${i === 0 ? 'new' : ''}"><span class="w">${esc(nm(b.team))}</span><span class="d">${b.first ? t('abriu') : '+' + dollars(b.inc)}</span><b class="num">${dollars(b.price)}</b></div>`).join('')
      : `<div class="bl empty"><span class="w">${t('Aguardando o primeiro lance')}</span></div>`;
  }
  if (G.shownV !== A.version || force) { G.shownV = A.version; paintLists(); paintMarket(); }

  // preço, líder e carimbo
  if (A.phase === 'sold') {
    const s = A.sold;
    if (G.phaseSeen !== 'sold') {
      G.phaseSeen = 'sold';
      const st = $('#stamp'), cl = $('#s-call'), im = $('#s-impact');
      cl.textContent = ''; cl._t = ''; cl.className = 'call';
      st.hidden = false; st.className = 'stamp' + (s.team ? (s.team.human ? ' me' : '') : ' none');
      st.innerHTML = s.team ? `<b>${t('VENDIDO')}</b><span>${esc(t('para {n}', { n: s.team.human ? t('você') : s.team.name }))} · ${dollars(s.price)}</span>` : `<b>${t('PASSOU')}</b><span>${s.note === 'fica pro sorteio' ? t('o jogo completa seu time no fim') : t('ninguém quis')}</span>`;
      st.style.animation = 'none'; void st.offsetWidth; st.style.animation = '';
      im.textContent = s.team ? impactLine(s) : ''; if (im.textContent) anim(im, 'slide');
      if (s.team) stage.classList.add('sold'); if (s.team && s.team.human) anim(stage, 'won');
      if (s.team) { tween(priceEl, s.price, dollars); anim(priceEl, 'pop'); }
      lead.className = 'l slide' + (s.team && s.team.human ? ' me' : '');
      lead.textContent = s.team ? (s.team.human ? t('Você levou') : t('Levou: {n}', { n: s.team.name })) + (s.note ? ' (' + t(s.note) + ')' : '') : (s.note === 'fica pro sorteio' ? t('Fica pro sorteio do fim') : t('Ninguém quis'));
      lead._t = null;
    }
    G.fracShown = Math.max(0, G.fracShown - dt / 220);
    setText($('#s-cd'), '0s'); $('#s-cd').classList.remove('low'); $('#clock').classList.remove('low');
  } else {
    tween(priceEl, A.price, dollars);
    if (A.price > G.lastPrice) { anim(priceEl, 'pop'); G.lastPrice = A.price; }
    const key = A.leader ? A.leader.id : 'none';
    if (key !== G.leaderKey) {
      G.leaderKey = key; lead.className = 'l slide' + (A.leader === M ? ' me' : '');
      lead.textContent = A.leader ? (A.leader === M ? t('Você lidera') : t('Líder: {n}', { n: A.leader.name })) : t('Sem lances'); lead._t = null;
    }
    const target = Math.max(0, Math.min(1, A.timeLeft / A.timeMax));
    G.fracShown = target > G.fracShown ? G.fracShown + (target - G.fracShown) * Math.min(1, dt / 70) : target;
    const late = A.timeLeft <= 3000 && A.humanIn;
    $('#clock').classList.toggle('low', late); $('#s-cd').classList.toggle('low', late);
    setText($('#s-cd'), Math.max(0, Math.ceil(A.timeLeft / 1000)) + 's');
    // pregão do leiloeiro
    let call = '';
    if (!A.humanIn) call = A.passed.has(M) ? t('Você passou. Avançando…') : (A.elig.includes(M) ? '' : t('Você está fora dessa vaga. Avançando…'));
    else if (A.leader) call = A.timeLeft <= 1000 ? t('Dou-lhe duas…') : A.timeLeft <= 2000 ? t('Dou-lhe uma…') : '';
    else if (A.timeLeft <= 3000) call = t('Ninguém dá o primeiro lance?');
    const cl = $('#s-call');
    if (cl._t !== call) { cl._t = call; cl.textContent = call; cl.className = 'call' + (A.humanIn ? ' bid' : ' soft'); if (call) anim(cl, 'pop'); }
  }
  stage.classList.toggle('lead', A.phase === 'sold' ? !!(A.sold && A.sold.team === M) : A.leader === M);
  $('#s-bar').style.transform = `scaleX(${G.fracShown.toFixed(4)})`;

  // botões de lance
  const bidding = A.phase === 'bidding', inRace = A.elig.includes(M), cap = maxBid(M, p);
  const out = A.passed.has(M), can = bidding && inRace && A.leader !== M && !out;
  const bkey = [A.i, A.price, cap, can].join('|');
  if (bkey !== G.btnKey) {
    G.btnKey = bkey;
    document.querySelectorAll('#bids button').forEach(b => {
      const inc = b.dataset.inc, amt = inc === 'max' ? cap : A.price + (+inc);
      b.disabled = !(can && amt > A.price && amt <= cap);
      b.innerHTML = inc === 'max' ? `${t('Teto')}<small>${dollars(cap)}</small>` : `+${inc}<small>${dollars(A.price + (+inc))}</small>`;
    });
  }
  $('#pass').hidden = !(bidding && inRace && !A.passed.has(M) && A.leader !== M);
  let hint = '';
  if (bidding) {
    if (!inRace) hint = M.roster.filter(x => x.pos === p.pos).length >= SLOTS[p.pos] ? t('Você já fechou {p}. Só assistindo.', { p: p.pos }) : t('Você não tem saldo pra essa vaga.');
    else if (out) hint = t('Você saiu desse lance. Só aguardar o próximo jogador.');
    else if (A.leader === M) hint = t('Você está na frente. Se ninguém cobrir até o relógio zerar, o jogador é seu.');
    else hint = t('Seu teto aqui: {c}, guardando $1 por vaga que sobra.', { c: dollars(cap) });
  }
  setText($('#a-hint'), hint);
  paintTable();
}
// ----- formação em campo -----
const POSINFO = {
  off: [
    ['QB', 'Quarterback', 1, 'O cérebro do ataque. Recebe a bola em toda jogada e decide: lança o passe ou entrega pra alguém correr.'],
    ['RB', 'Running back', 1, 'O corredor. Pega a bola do QB e avança pelo chão. Também recebe passes curtos.'],
    ['WR', 'Wide receiver', 2, 'Receptores abertos, nas pontas do campo. Correm rotas pra pegar os lançamentos, principalmente os longos.'],
    ['TE', 'Tight end', 1, 'Um híbrido: fica colado na linha bloqueando e também sai pra receber passes curtos e médios no meio.'],
    ['OL', 'Offensive lineman', 3, 'A linha ofensiva: center, guards e tackles. Protege o QB dos defensores e abre espaço pro corredor.']
  ],
  def: [
    ['EDGE', 'Pass rusher', 2, 'Defensores das pontas da linha. A missão é chegar no QB: sack, pressão e passe errado.'],
    ['DT', 'Defensive tackle', 2, 'Defensores do meio da linha. Param a corrida e empurram a linha adversária pra trás.'],
    ['LB', 'Linebacker', 2, 'Ficam atrás da linha. Fecham os buracos contra a corrida, cobrem passes curtos e às vezes vêm pressionar.'],
    ['CB', 'Cornerback', 2, 'Cobrem os receptores. Tentam derrubar ou interceptar o passe e não deixam o WR escapar.']
  ]
};
function fieldHTML(side, rows, o) {
  const by = {}; rows.forEach(r => (by[r.pos] = by[r.pos] || []).push(r));
  const tk = (pos, i, r, c) => {
    const x = by[pos][i], want = o.cur && !x.p && o.cur.pos === pos, isNew = o.newId != null && x.p && x.p.id === o.newId;
    return `<div class="tk ${side} ${x.p ? '' : 'empty'} ${want ? 'want' : ''} ${isNew ? 'new' : ''}" style="--r:${r};--c:${c}"><span class="c num">${x.p ? x.p.ovr : '+'}${WEIGHT[pos] > 1 ? `<i class="w">${nf(WEIGHT[pos])}x</i>` : ''}</span><b>${pos}</b><small>${x.p ? esc(shortName(x.p.name)) : ''}</small></div>`;
  };
  const cells = side === 'off'
    ? [tk('WR', 0, 1, 1), tk('OL', 0, 1, 2), tk('OL', 1, 1, 3), tk('OL', 2, 1, 4), tk('TE', 0, 1, 5), tk('WR', 1, 1, 6), tk('QB', 0, 2, 4), tk('RB', 0, 3, 4)]
    : [tk('CB', 0, 1, 1), tk('CB', 1, 1, 6), tk('LB', 0, 2, 3), tk('LB', 1, 2, 4), tk('EDGE', 0, 3, 2), tk('DT', 0, 3, 3), tk('DT', 1, 3, 4), tk('EDGE', 1, 3, 5)];
  const got = rows.filter(r => r.p).length;
  return `<div class="fld"><div class="fh"><span>${t(side === 'off' ? 'ATAQUE' : 'DEFESA')}</span><span class="num">${got}/8</span></div><div class="fg">${cells.join('')}<i class="los" style="grid-row:${side === 'off' ? 2 : 3}"></i></div></div>`;
}
function paintLineup() {
  const A = G.A, M = me(), rows = lineupRows(M.roster);
  const flash = A.sold && A.sold.team === M && G.flashedV !== A.version ? A.sold.player.id : null;
  if (flash != null) G.flashedV = A.version;
  const o = { cur: A.phase === 'bidding' ? A.cur : null, newId: flash };
  const off = rows.filter(r => OFF_POS.includes(r.pos)), def = rows.filter(r => !OFF_POS.includes(r.pos));
  $('#fm').innerHTML = fieldHTML('off', off, o) + fieldHTML('def', def, o);
  $('#lst').innerHTML = `<div class="sub" style="margin-top:0">${t('ATAQUE')}</div>${off.map(r => slotHTML(r, o)).join('')}<div class="sub">${t('DEFESA')}</div>${def.map(r => slotHTML(r, o)).join('')}`;
}
function openPosInfo() {
  const row = s => ([p, n, q, d]) => `<div class="pi"><span class="pos ${s}">${p}</span><div><b>${n}<em>${tpl('{n} vaga', '{n} vagas', q)} · ${nf(WEIGHT[p].toFixed(2).replace(/0$/, ''))}x</em></b><p>${t(d)}</p></div></div>`;
  $('#posinfo-b').innerHTML = `<div class="sub" style="margin-top:0">${t('ATAQUE · tem a bola')}</div>${POSINFO.off.map(row('off')).join('')}<div class="sub">${t('DEFESA · tenta tomar a bola')}</div>${POSINFO.def.map(row('def')).join('')}<p class="sh-n">${t('O OVR do ataque é a média dos 8 titulares do ataque, e o da defesa é a média dos 8 da defesa, com pesos. A base é 1,0x. Sobem pra 1,5x: WR, LB e CB. EDGE conta 2,0x e o QB conta 2,5x. Ou seja, um QB 90 pesa duas vezes e meia um jogador de linha 90.')}</p>`;
  $('#posinfo').hidden = false; $('#posinfo-b').scrollTop = 0;
}
$('#pos-info').onclick = openPosInfo;
$('#posinfo').addEventListener('click', e => { if (e.target.closest('[data-close]')) $('#posinfo').hidden = true; });
function paintLists() {
  const A = G.A, M = me();
  tween($('#a-bud'), M.budget, dollars);
  const left = slotsLeft(M); setText($('#a-slots'), tpl('{n} vaga', '{n} vagas', left));
  setText($('#a-prog'), `${A.soldCount}/${A.total}`);
  paintLineup();
  $('#sales').innerHTML = A.log.length ? A.log.slice(0, 6).map(s => s.team
    ? `<div class="sale"><b>${esc(s.player.name)}</b> <em>${s.player.pos} · ${s.player.ovr} · ${esc(frName(s.player))}</em><br>${t('{team} por {p}', { team: s.team.human ? '<b style="color:var(--flag)">' + t('Você') + '</b>' : esc(s.team.name), p: '<b>' + dollars(s.price) + '</b>' })} ${s.note ? '<em>(' + t(s.note) + ')</em>' : ''}</div>`
    : `<div class="sale"><b>${esc(s.player.name)}</b> <em>${s.player.pos} · ${s.player.ovr} · ${esc(frName(s.player))}</em><br><em>${s.note === 'fica pro sorteio' ? t('você passou: o jogo completa seu time no fim') : t('ninguém quis, volta depois')}</em></div>`).join('') : '<p class="note">' + t('Nenhuma venda ainda.') + '</p>';
}
function paintTable() {
  const A = G.A, rows = document.querySelectorAll('#table .trow');
  G.teams.forEach((t, i) => {
    const r = rows[i]; if (!r) return;
    r.classList.toggle('lead', A.leader === t && A.phase === 'bidding');
    r.classList.toggle('out', A.phase === 'bidding' && A.passed.has(t));
    r.dataset.t = t.id; r.tabIndex = 0; r.setAttribute('role', 'button');
    tween(r.children[2], t.budget, dollars);
    setText(r.children[3], `${t.roster.length}/${TOTAL_SLOTS}`);
    r.children[4].firstChild.style.width = t.budget + '%';
  });
  if (!$('#tview').hidden) tvPaint(false);
}
// elenco de qualquer time durante o leilão
const TV = { id: -1, key: '' };
function tvPaint(force) {
  const T = G.teams.find(x => x.id === TV.id); if (!T) return;
  const key = T.id + ':' + T.roster.map(p => p.id).join(',') + ':' + T.budget + ':' + LANG;
  if (!force && key === TV.key) return; TV.key = key;
  const rows = lineupRows(T.roster), off = rows.filter(r => OFF_POS.includes(r.pos)), def = rows.filter(r => !OFF_POS.includes(r.pos));
  $('#tv-h').textContent = T.name + (T.human ? ' (' + tt('você') + ')' : '');
  const st = tt('{n}/16 titulares · sobram {b}', { n: T.roster.length, b: dollars(T.budget) });
  $('#tv-b').innerHTML = `<div class="tvh">${badge(T.emb, 40)}<small>${esc(st)}</small></div><div class="lu"><div><div class="sub" style="margin-top:0">${tt('ATAQUE')}</div>${off.map(r => slotHTML(r)).join('')}</div><div><div class="sub">${tt('DEFESA')}</div>${def.map(r => slotHTML(r)).join('')}</div></div>`;
}
function tvOpen(id) { TV.id = id; TV.key = ''; tvPaint(true); $('#tview').hidden = false; $('#tv-b').scrollTop = 0; }
$('#table').addEventListener('click', e => { const r = e.target.closest('.trow[data-t]'); if (r) tvOpen(+r.dataset.t); });
$('#table').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.trow[data-t]')) { e.preventDefault(); tvOpen(+e.target.dataset.t); } });
$('#tview').addEventListener('click', e => { if (e.target.closest('[data-close]')) $('#tview').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#tview').hidden = true; });
// voltar pro início no meio do leilão
$('#a-back').onclick = () => {
  const ok = window.confirm(G.mp ? t('Sair do leilão? Um bot joga no seu lugar e você pode voltar pelo código da sala.') : t('Sair do leilão? O progresso desse leilão se perde.'));
  if (!ok) return;
  $('#tview').hidden = true; cancelAnimationFrame(G.raf); show('setup');
};
function paintMarket() {
  return;
  const A = G.A, cur = A.phase === 'bidding' || A.phase === 'sold' ? A.cur : null;
  document.querySelectorAll('#market div').forEach(d => {
    const pos = d.dataset.p, sup = A.supply(pos), tot = A.pool.filter(q => q.pos === pos).length;
    setText(d.children[1], String(sup)); setText(d.children[2], `de ${tot}`);
    d.classList.toggle('zero', sup === 0); d.classList.toggle('cur', !!cur && cur.pos === pos);
  });
}
$('#bids').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const A = G.A, M = me(), cap = maxBid(M, A.cur);
  const amt = b.dataset.inc === 'max' ? cap : A.price + (+b.dataset.inc);
  if (A.bid(M, Math.min(amt, cap))) { G.btnKey = ''; paintAuction(false, 16); }
});
$('#pass').onclick = () => { if (G.A.pass(me())) { G.btnKey = ''; paintAuction(false, 16); } };
// atalhos no PC: 1-4 dão lance, P passa a vaga
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || $('#auction').hidden || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase(), i = '1234'.indexOf(k);
  if (i >= 0) { const b = document.querySelectorAll('#bids button')[i]; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
  else if (k === 'p') { const b = $('#pass'); if (!b.hidden) { e.preventDefault(); b.click(); } }
});

// ----- resultados -----
function teamLineupHTML(t) {
  const rows = lineupRows(t.roster), off = rows.filter(r => OFF_POS.includes(r.pos)), def = rows.filter(r => !OFF_POS.includes(r.pos));
  return `<div class="lu"><div><div class="sub" style="margin-top:0">${tt('ATAQUE')} · ${t.rt.off.toFixed(1)}</div>${off.map((r, i) => slotHTML(r, { i })).join('')}</div><div><div class="sub">${tt('DEFESA')} · ${t.rt.def.toFixed(1)}</div>${def.map((r, i) => slotHTML(r, { i: i + off.length })).join('')}</div></div>`;
}
function showResults() {
  G.teams.forEach(finishTeam);
  G.confs = withSeed(G.mp ? MP.seed : null, () => drawConferences(G.teams)); fixConfNames(G.confs);
  show('results');
  paintResults();
}
function paintResults() {
  { const au = (me().auto || []); $('#r-lineup').innerHTML = teamLineupHTML(me()) + (au.length ? `<p class="note" style="margin-top:12px">${t('Você passou em alguns jogadores, então o jogo completou seu time por sorteio (US$ 1 cada): {l}.', { l: au.map(p => esc(p.name) + ' (' + p.pos + ' ' + p.ovr + ')').join(', ') })}</p>` : ''); }
  $('#r-confs').innerHTML = G.confs.map((c, ci) => `<div class="card cf rvf" style="--i:${ci + 4}"><div class="cfh"><small>${t('CONFERÊNCIA · {n} TIMES', { n: c.ids.length })}</small><h3>${esc(c.name)}</h3></div>${c.ids.map(id => { const t = tn(id); return `<div class="cfr ${t.human ? 'me' : ''}"><span class="tn">${badge(t.emb, 26)}${esc(t.name)}</span></div>`; }).join('')}</div>`).join('');
  const sorted = G.teams.slice().sort((a, b) => b.rt.all - a.rt.all);
  $('#r-teams').innerHTML = `<tr><th>${t('TIME')}</th><th>${t('ATQ')}</th><th>${t('DEF')}</th><th>${t('GERAL')}</th><th>${t('SOBROU')}</th></tr>` +
    sorted.map((t, i) => `<tr class="rvf ${t.human ? 'me' : ''}" style="--i:${i + 8}"><td><span class="tn">${badge(t.emb, 22)}${esc(t.name)}</span></td><td class="num">${t.rt.off.toFixed(1)}</td><td class="num">${t.rt.def.toFixed(1)}</td><td class="num"><b>${t.rt.all.toFixed(1)}</b></td><td class="num">${dollars(t.budget)}</td></tr>`).join('');
  $('#sim').textContent = t($('#season').hidden ? 'Simular temporada' : 'Refazer temporada');
  $('#sim').hidden = !!(G.mp && !MP.host);
  $('#sim-wait').hidden = !(G.mp && !MP.host && $('#season').hidden);
}
const tn = id => G.teams.find(t => t.id === id);
// ----- temporada em rodadas ao vivo: todos os jogos da rodada acontecem ao mesmo tempo -----
const SV = { S: null, done: 0, meId: -1, el: null, cup: false, speed: 1 };      // done = rodadas já concluídas
const LV = { running: false, now: 0, last: 0, raf: 0, games: {}, endAt: 0, nDone: 0 };
const svPlayed = g => g.round < SV.done || g.fin;
const svCard = i => SV.el && SV.el.querySelector(`.mt[data-g="${i}"]`);
function svStop() { LV.running = false; cancelAnimationFrame(LV.raf); }
function svStart(el, meId, cup) {
  svStop(); SV.el = el; SV.meId = meId; SV.cup = cup;
  SV.S = G.season = withSeed(G.mp && !cup ? MP.seed + 1 : null, () => simSeason(G.teams, G.confs)); SV.done = 0;
  SV.S.games.forEach(narrateGame); SV.S.stats = computeStats(SV.S);
  el.hidden = false; svRender();
}
// linha do tempo de um jogo (ms desde o apito inicial): cada posse aparece no seu tempo; TD e FG demoram mais por causa do aviso
function liveTimeline(g) {
  let t = 700 + rint(0, 900); const ev = [];
  g.poss.forEach((p, k) => {
    const prev = g.poss[k - 1];
    if (p.ot && !(prev && prev.ot)) { ev.push({ t, ot: true }); t += 1900; }
    ev.push({ t, k });
    t += (FX[p.result] ? FX[p.result].w : 650) * (.9 + R() * .3);
  });
  return { ev, end: t + 300 };
}
function svStartRound() {
  const r = SV.S.rounds[SV.done]; if (!r || LV.running) return;
  LV.games = {}; LV.now = 0; LV.endAt = 0; LV.nDone = 0; LV.running = true;
  const mk = () => r.games.forEach(g => { const i = SV.S.games.indexOf(g); LV.games[i] = Object.assign({ g, i, n: 0, shown: 0, done: false, score: [0, 0] }, liveTimeline(g)); });
  if (G.mp && !SV.cup) withSeed(MP.seed + 100 + SV.done, mk); else mk();
  svRender();
  const y = SV.el.querySelector('.yard'); if (y) y.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  LV.t0 = performance.now(); LV.raf = requestAnimationFrame(svTick);
}
function svTick(ts) {
  if (!LV.running) return;
  LV.raf = requestAnimationFrame(svTick);
  LV.now = (ts - LV.t0) * SV.speed;                   // relógio de parede: todo mundo vê o mesmo momento do jogo, mesmo se a aba ficou em segundo plano
  const Ls = Object.values(LV.games);
  for (const L of Ls) {
    while (L.n < L.ev.length && L.ev[L.n].t <= LV.now) svEvent(L, L.ev[L.n++]);
    if (!L.done && L.n >= L.ev.length && LV.now >= L.end) { L.done = true; L.g.fin = true; LV.nDone++; svGameDone(L); }
  }
  if (LV.nDone === Ls.length) { if (!LV.endAt) LV.endAt = LV.now + 1800; else if (LV.now >= LV.endAt) svRoundDone(); }
}
function svEvent(L, e) {
  const g = L.g, m = svCard(L.i), hook = G.liveHook && G.liveHook.i === L.i ? G.liveHook : null;
  if (e.ot) { if (m) m.querySelector('.stt').textContent = t('Prorrogação'); if (hook) hook.ot(); return; }
  const p = g.poss[e.k]; L.shown = e.k + 1; L.score = p.scoreAfter;
  if (m) {
    const sc = m.querySelectorAll('.sc'); sc[0].textContent = p.scoreAfter[0]; sc[1].textContent = p.scoreAfter[1];
    m.querySelector('.stt').textContent = p.ot ? t('Prorrogação') : t('Posse {a} de {b}', { a: e.k + 1, b: POSSESSIONS * 2 });
    if (p.result === 'TD' || p.result === 'FG') { m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); }
  }
  if (hook) hook.step(e.k);
}
function svGameDone(L) {
  const g = L.g, m = svCard(L.i);
  if (m) { m.classList.remove('live'); m.classList.add('done'); m.querySelector('.stt').textContent = t('FIM') + (g.ot ? ' · ' + t('prorrogação') : ''); if (g.sa !== g.sb) m.querySelectorAll('.mr')[g.sa > g.sb ? 1 : 0].classList.add('l'); }
  const tbl = $('#sv-tables'); if (tbl && SV.el.contains(tbl)) tbl.innerHTML = svTablesHTML();
  const f = SV.el.querySelector('#sv-fin'); if (f) f.textContent = t('{a} de {b}', { a: LV.nDone, b: Object.keys(LV.games).length });
  if (G.liveHook && G.liveHook.i === L.i) G.liveHook.end();
}
function svRoundDone() { LV.running = false; SV.done++; svRender(); }
function svOpen(i) {
  const g = SV.S.games[i]; if (!g || g.round > SV.done) return;
  if (g.round === SV.done && !LV.running) { if (G.mp && !SV.cup) return; svStartRound(); }
  openGame(i);
}
function svMatch(g) {
  const S = SV.S, A = tn(g.a), B = tn(g.b), i = S.games.indexOf(g), L = LV.running ? LV.games[i] : null;
  const state = g.round < SV.done ? 'played' : L ? (L.done ? 'played' : 'live') : 'up', ps = state === 'played', mine = g.a === SV.meId || g.b === SV.meId;
  const w = ps ? (g.sa > g.sb ? 0 : g.sb > g.sa ? 1 : -1) : -1;
  const sc = k => ps ? (k ? g.sb : g.sa) : state === 'live' ? L.score[k] : '';
  const row = (T, k, lose) => `<div class="mr ${lose ? 'l' : ''} ${T.id === SV.meId ? 'me' : ''}"><span class="tn">${badge(T.emb, 24)}${esc(T.name)}</span><span class="sc num">${sc(k)}</span></div>`;
  const where = g.stage === 'Temporada' ? t(g.inConf ? 'Mesma conferência' : 'Entre conferências') : g.conf >= 0 ? t('Conferência {n}', { n: S.confs[g.conf].name }) : t('Grande final');
  const stt = state === 'played' ? esc(where) + (g.ot ? ' · ' + t('prorrogação') : '') : state === 'live' ? (L.n ? (g.poss[L.shown - 1] && g.poss[L.shown - 1].ot ? t('Prorrogação') : t('Posse {a} de {b}', { a: L.shown, b: POSSESSIONS * 2 })) : t('Começando…')) : esc(where);
  return `<div class="mt ${state === 'played' ? 'done' : ''} ${state === 'live' ? 'live' : ''}" data-g="${i}">${row(A, 0, w === 1)}${row(B, 1, w === 0)}<div class="mf"><span>${mine ? '<i class="pill">' + t('SEU JOGO') + '</i> ' : ''}<span class="stt">${stt}</span></span><button class="watch" type="button">${t(state === 'played' ? 'Rever' : 'Assistir ao vivo')}</button></div></div>`;
}
function svFate() {
  const S = SV.S, M = tn(SV.meId), champ = S.champion;
  const ci = S.confs.findIndex(c => c.ids.includes(SV.meId)), cf = S.confs[ci], pos = cf.seeds.indexOf(M) + 1, rec = cf.table.find(r => r.id === SV.meId);
  const myPo = S.games.filter(g => g.stage !== 'Temporada' && (g.a === SV.meId || g.b === SV.meId)), lastPo = myPo[myPo.length - 1];
  const lost = lastPo && (lastPo.a === SV.meId ? lastPo.sa < lastPo.sb : lastPo.sb < lastPo.sa);
  const fate = champ === M ? t('campeão do Super Bowl') : !myPo.length ? t('fora dos playoffs') : lost ? t('eliminado em: {s}', { s: t(lastPo.stage) }) : t('nos playoffs');
  const cardTxt = champ === M ? t('Campeão do Super Bowl') : !myPo.length ? t('Fora dos playoffs') : lost ? t('Eliminado: {s}', { s: t(lastPo.stage) }) : t('Nos playoffs');
  return { M, champ, cf, pos, rec, fate, cardTxt, bye: pos <= cf.byes, rs: `${rec.w}-${rec.l}${rec.t ? '-' + rec.t : ''}` };
}
function svSummary() {
  const f = svFate();
  return t('Você terminou em {p} na conferência {c} ({r}) · {f}{b}.', { p: ordn(f.pos), c: esc(f.cf.name), r: f.rs, f: f.fate, b: f.bye ? t(' · começou com bye') : '' });
}
function svTablesHTML() {
  const S = SV.S, me = SV.meId, tb = buildTables(S.confs, S.games.filter(g => g.stage === 'Temporada' && svPlayed(g)));
  return S.confs.map((c, ci) => `<div class="psub">${t('Conferência {n}', { n: esc(c.name) })}</div><div class="card scroll"><table class="cmp"><tr><th>${tt('TIME')}</th><th>${tt('V-D')}</th><th>PF</th><th>${tt('PS')}</th></tr>${tb[ci].map((r, i) => `<tr class="${r.id === me ? 'me' : ''} ${i >= c.q ? 'out' : ''} ${i === c.q - 1 ? 'cut' : ''}"><td><span class="tn"><span class="rk">${i + 1}</span>${badge(tn(r.id).emb, 22)}${esc(tn(r.id).name)}</span></td><td class="num">${r.w}-${r.l}${r.t ? '-' + r.t : ''}</td><td class="num">${r.pf}</td><td class="num">${r.pa}</td></tr>`).join('')}</table></div><p class="note legend">${t('Os {c} de cima vão pro mata-mata', { c: c.q })}${c.byes ? t(' · o 1º começa com bye') : ''}.</p>`).join('');
}
function svRender() {
  const S = SV.S, R = S.rounds, d = SV.done, fin = d >= R.length, champ = S.champion, me = SV.meId;
  const cur = fin ? null : R[d], prev = d > 0 ? R[d - 1] : null;
  const byeTxt = r => r.bye.length ? `<p class="note" style="margin:4px 2px 0">${t(r.kind === 'reg' ? 'Folga' : 'De bye')}: ${r.bye.map(t => esc(t.name)).join(', ')}</p>` : '';
  const regTotal = R.filter(r => r.kind === 'reg').length;
  let head = '';
  if (fin) head = `<div class="champ pop"><div class="cb">${badge(champ.emb, 68)}<div><small>${t(champ.id === me ? 'VOCÊ GANHOU O SUPER BOWL' : 'CAMPEÃO DO SUPER BOWL')}</small><h2>${esc(champ.name)}</h2></div></div></div>${me >= 0 ? `<p class="note" style="margin-top:12px">${svSummary()}</p><div class="pact"><button class="btn ghost full" data-act="card">${t('Cartão da temporada')}</button></div>` : ''}${statsHTML(S)}`;
  else {
    const wait = G.mp && !SV.cup && !MP.host;
    const n = cur.games.length, hasMine = me >= 0 && cur.games.some(g => g.a === me || g.b === me);
    head = `<div class="card prog"><small>${t(cur.kind === 'reg' ? 'TEMPORADA REGULAR' : 'MATA-MATA')}</small><h3>${esc(rl(cur.label))}</h3>
      <div class="pbar"><i style="width:${(100 * d / R.length).toFixed(1)}%"></i></div>
      <p class="note">${LV.running ? t('Ao vivo · {b} jogos terminados. Todos rolam ao mesmo tempo.', { b: `<b id="sv-fin" style="color:var(--flag)">${t('{a} de {b}', { a: LV.nDone, b: n })}</b>` }) : `${d === 0 ? t('Sorteio feito: {n} rodadas + mata-mata. ', { n: regTotal }) : ''}${tpl('{n} jogo ao mesmo tempo, em tempo real.', '{n} jogos ao mesmo tempo, em tempo real.', n)}`}</p>
      <div class="pact">${LV.running ? '' : wait ? `<p class="note" style="margin:0">${t('Aguardando o anfitrião iniciar a rodada. Todos começam juntos.')}</p>` : `<button class="btn full" data-act="start">${t('Iniciar rodada')}</button>`}${hasMine && (LV.running || !wait) ? `<button class="btn ${LV.running ? '' : 'ghost'} full" data-act="mine">${t(LV.running ? 'Assistir meu jogo' : 'Iniciar e assistir meu jogo')}</button>` : ''}</div></div>`;
  }
  const poRounds = R.filter(r => r.kind === 'po');
  SV.el.innerHTML = `<div class="svg"><div class="svc">${head}
    ${cur ? `<div class="yard">${esc(rl(cur.label))}</div>${cur.games.map(svMatch).join('')}${byeTxt(cur)}` : ''}
    ${fin ? poRounds.slice().reverse().map(r => `<div class="yard">${esc(rl(r.label))}</div>${r.games.map(svMatch).join('')}${byeTxt(r)}`).join('') : prev ? `<div class="yard">${t('Resultados · {l}', { l: esc(rl(prev.label)) })}</div>${prev.games.map(svMatch).join('')}${byeTxt(prev)}` : ''}
    </div><div class="svc">
    <div class="yard">${t('Classificação')}</div>
    <div id="sv-tables">${svTablesHTML()}</div>
    </div></div>
    ${SV.cup ? `<div class="yard">${t('Elencos')}</div>
    <p class="note" style="margin:-6px 0 14px">${t('Leilão feito por 8 bots. Toque num time pra ver os titulares.')}</p>
    <div class="card scroll"><table class="cmp" id="cup-teams"><tr><th>${tt('TIME')}</th><th>${tt('ATQ')}</th><th>${tt('DEF')}</th><th>${tt('GERAL')}</th><th>${t('GASTOU')}</th></tr>${G.teams.slice().sort((a, b) => b.rt.all - a.rt.all).map(t => `<tr class="tap" data-t="${t.id}"><td><span class="tn">${badge(t.emb, 22)}${esc(t.name)}</span></td><td class="num">${t.rt.off.toFixed(1)}</td><td class="num">${t.rt.def.toFixed(1)}</td><td class="num"><b>${t.rt.all.toFixed(1)}</b></td><td class="num">${dollars(BUDGET - t.budget)}</td></tr>`).join('')}</table></div>
    <div class="card" id="cup-lineup" hidden></div>` : ''}
    ${d > 0 ? `<details class="allg"><summary class="yard">${t('Todas as rodadas')}</summary>${R.slice(0, d).map(r => `<div class="psub">${esc(rl(r.label))}</div>${r.games.map(svMatch).join('')}`).join('')}</details>` : ''}`;
}
document.addEventListener('click', e => {
  const el = SV.el; if (!el || el.hidden || !el.contains(e.target)) return;
  const act = e.target.closest('[data-act]');
  if (act) {
    const k = act.dataset.act;
    if (k === 'start') { if (G.mp && !SV.cup) { if (MP.host) mpSend({ t: 'round', n: SV.done }); } else svStartRound(); }
    else if (k === 'mine') {
      const r = SV.S.rounds[SV.done], g = r && r.games.find(x => x.a === SV.meId || x.b === SV.meId); if (!g) return;
      if (G.mp && !SV.cup && !LV.running) { MP.watch = SV.S.games.indexOf(g); mpSend({ t: 'round', n: SV.done }); return; }
      svOpen(SV.S.games.indexOf(g));
    }
    else if (k === 'card') { const f = svFate(); openShare(f.M, { text: f.cardTxt, rec: f.rs, gold: f.champ === f.M }); }
    return;
  }
  const m = e.target.closest('.mt[data-g]'); if (m) { svOpen(+m.dataset.g); return; }
  const r = e.target.closest('tr[data-t]'); if (!r) return;
  const tm = tn(+r.dataset.t), box = $('#cup-lineup');
  document.querySelectorAll('#cup-teams tr.me').forEach(x => x.classList.remove('me')); r.classList.add('me');
  box.hidden = false;
  box.innerHTML = `<div class="tn" style="margin-bottom:10px">${badge(tm.emb, 30)}<b style="font-family:var(--display);font-size:20px">${esc(tm.name)}</b></div>${teamLineupHTML(tm)}`;
  box.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest' });
});

// jogo de verdade: depois do leilão, a temporada anda jogo a jogo
$('#sim').onclick = () => {
  if (G.mp) { if (MP.host) mpSend({ t: 'reseason' }); return; }
  svStart($('#season'), me().id, false);
  $('#sim').textContent = t('Refazer temporada');
  $('#sim').hidden = !!(G.mp && !MP.host);
  $('#season').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
};

// ----- campeonato de teste: 8 bots fazem o leilão e a temporada roda do mesmo jeito -----
function cupAuction() {
  const embs = shuffle(EMB.map((_, i) => i)).slice(0, 8);
  const teams = embs.map((e, i) => { const t = newBot(i, emN(e)); t.emb = e; return t; });
  const A = new Auction(teams, DB); let n = 0;
  while (!A.done && n++ < 4e6) A.tick(100);
  teams.forEach(finishTeam);
  G.teams = teams;
}
function cupRun(newAuction) {
  if (newAuction || !G.teams.length || !G.teams[0].rt) cupAuction();
  G.confs = drawConferences(G.teams); fixConfNames(G.confs);
  svStart($('#cup-out'), -1, true);
}
$('#go-cup').onclick = () => { show('cup'); cupRun(true); };
$('#cup-back').onclick = () => { svStop(); SV.el = null; show('setup'); };
$('#cup-new').onclick = () => { cupRun(true); window.scrollTo(0, 0); };
$('#cup-again').onclick = () => { cupRun(false); window.scrollTo(0, 0); };
$('#again').onclick = () => { if (G.mp) { mpLeave(); onOpen(); return; } openLobby(false); };

// ----- partida -----
const pct = x => Math.round(x * 100) + '%';
let GT = [];                                        // timers da partida ao vivo
const stopGame = () => { GT.forEach(clearTimeout); GT = []; };
const stageLabel = g => g.stage === 'Temporada' ? t(g.inConf ? 'Temporada · conferência' : 'Temporada · entre conferências') : t(g.stage);

// ----- narração + atribuição de cada posse a jogadores (alimenta estatísticas e MVP) -----
const wpick = arr => { const ws = arr.map(p => Math.pow(Math.max(40, p.ovr) / 80, 3)); let x = R() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) if ((x -= ws[i]) < 0) return arr[i]; return arr[arr.length - 1]; };
const pSlim = (p, tid) => p ? { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, team: tid } : null;
const DEFROLE = { ed: 'EDGE', dt: 'DT', lb: 'LB', cb: 'CB' };
const tdRole = s => /\{w\}/.test(s) ? 'W' : /\{e\}/.test(s) ? 'E' : /\{r\}/.test(s) ? (/screen/i.test(s) ? 'RP' : 'R') : /\{q\} (corre|mergulha)/.test(s) ? 'Q' : 'P';
const defRole = s => { const m = s.match(/\{(ed|dt|lb|cb)\}/g); return m ? DEFROLE[m[m.length - 1].slice(1, -1)] : null; };
const narrText = (g, k) => { const r = g.nar[k], s = (LANG === 'pt' ? NARR : NARR_EN)[r.res][r.pn][r.i]; return s.replace(/\{(\w+)\}/g, (_, key) => r.v[key] != null ? r.v[key] : key); };
const introText = g => (LANG === 'pt' ? INTRO : INTRO_EN)[INTRO[g.stage] ? g.stage : 'Temporada'][g.introI];
function narrateGame(g) {
  const tm = [tn(g.a), tn(g.b)], used = new Set(), act = [], last = pl => pl ? shortName(pl.name) : tt('o time'), pick = a => a[rint(0, a.length - 1)];
  g.nar = g.poss.map((p, k) => {
    const O = tm[p.team], D = tm[1 - p.team], bank = NARR[p.result], prev = g.poss[k - 1], before = prev ? prev.scoreAfter : [0, 0];
    const diff = before[p.team] - before[1 - p.team], tags = [];
    if (p.ot) tags.push('ot'); else if (p.n === POSSESSIONS) tags.push('late');
    if (k < 2) tags.push('open');
    if (prev && prev.team !== p.team && (prev.result === 'TD' || prev.result === 'FG')) tags.push('answer');
    if (diff <= -8) tags.push('trail'); else if (diff >= 14) tags.push('blow');
    let pn = 'base';
    for (const t of tags) if (bank[t] && R() < .7) { pn = t; break; }
    const pool = bank[pn], fresh = pool.map((_, i) => i).filter(i => !used.has(p.result + pn + i)), ni = pick(fresh.length ? fresh : pool.map((_, i) => i), 0); used.add(p.result + pn + ni);
    const s = pool[ni];
    const lo = O.lineup, ld = D.lineup, city = EMB_CITY[O.emb] || O.name.split(' ').slice(0, -1).join(' ') || O.name, same = EMB_CITY[O.emb] === EMB_CITY[D.emb];
    const cast = { q: lo.QB, r: lo.RB, w: wpick(lo.WR), e: lo.TE, t: lo.OL[0], g: lo.OL[1], c: lo.OL[2], ed: wpick(ld.EDGE), dt: wpick(ld.DT), lb: wpick(ld.LB), cb: wpick(ld.CB) };
    const byPos = { EDGE: cast.ed, DT: cast.dt, LB: cast.lb, CB: cast.cb }, a = { res: p.result, o: O.id, d: D.id };
    if (p.result === 'TD') {
      const role = tdRole(s);
      const sc = role === 'W' ? cast.w : role === 'E' ? lo.TE : role === 'Q' ? lo.QB : role === 'P' ? wpick(lo.WR.concat([lo.TE])) : lo.RB;
      a.sc = pSlim(sc, O.id); if (role !== 'R' && role !== 'Q') a.qb = pSlim(lo.QB, O.id);
    } else if (p.result === 'INT' || p.result === 'FUM' || p.result === 'SACK' || p.result === 'DOWNS') {
      const role = defRole(s) || (p.result === 'INT' ? 'CB' : p.result === 'SACK' ? 'EDGE' : 'LB');
      a.df = pSlim(byPos[role], D.id); if (p.result === 'INT' || p.result === 'SACK') a.qb = pSlim(lo.QB, O.id);
    }
    act.push(a);
    const v = { O: same ? O.name : tsh(O), D: same ? D.name : tsh(D), oc: city }; for (const key in cast) v[key] = last(cast[key]);
    return { res: p.result, pn, i: ni, v };
  });
  g.act = act; g.introI = rint(0, (INTRO[g.stage] || INTRO['Temporada']).length - 1);
}
// estatísticas da temporada: touchdowns, passes de TD, interceptações, fumbles forçados, sacks e quartas descidas seguradas
function computeStats(S) {
  const m = new Map(), get = p => { let s = m.get(p.id); if (!s) { s = { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, team: p.team, td: 0, tdp: 0, int: 0, fum: 0, sk: 0, stop: 0, qi: 0 }; m.set(p.id, s); } return s; };
  for (const g of S.games) for (const a of (g.act || [])) {
    if (a.res === 'TD') { get(a.sc).td++; if (a.qb) get(a.qb).tdp++; }
    else if (a.res === 'INT') { get(a.df).int++; get(a.qb).qi++; }
    else if (a.res === 'FUM') get(a.df).fum++;
    else if (a.res === 'SACK') get(a.df).sk++;
    else if (a.res === 'DOWNS') get(a.df).stop++;
  }
  const all = [...m.values()]; all.forEach(s => { s.imp = 6 * s.td + 2 * s.tdp + 5 * s.int + 4 * s.fum + 3 * s.sk + 2 * s.stop - s.qi; s.def = s.int + s.fum + s.sk + s.stop; });
  const top = (key, n) => all.filter(s => s[key] > 0).sort((a, b) => b[key] - a[key] || b.ovr - a.ovr).slice(0, n);
  return { mvp: top('imp', 1)[0], td: top('td', 3), tdp: top('tdp', 3), def: top('def', 3), imp: top('imp', 5), all };
}
const statLine = s => [[s.td, 'TD'], [s.tdp, 'passes de TD'], [s.int, 'INT'], [s.fum, 'fumbles forçados'], [s.sk, 'sacks'], [s.stop, '4ªs descidas seguradas']].filter(x => x[0] > 0).map(x => `${x[0]} ${t(x[1])}`).join(' · ');
function statsHTML(S) {
  const st = S.stats; if (!st || !st.mvp) return '';
  const me = SV.meId, row = (s, v, u) => { const t = tn(s.team); return `<div class="strow ${s.team === me ? 'me' : ''}"><span>${badge(t.emb, 24)}</span><span class="stn">${esc(s.name)}<small>${s.pos} · ${esc(t.name)}</small></span><span class="num stv">${v}<i>${u}</i></span></div>`; };
  const list = (title, arr, f) => arr.length ? `<div class="psub">${title}</div><div class="card">${arr.map(s => row(s, ...f(s))).join('')}</div>` : '';
  const m = st.mvp, mt = tn(m.team);
  return `<div class="yard">${t('Destaques da temporada')}</div>
    <div class="card mvp ${m.team === me ? 'me' : ''}"><small>${t('MVP DA TEMPORADA')}</small><div class="mvh">${badge(mt.emb, 56)}<div><h3>${esc(m.name)}</h3><span>${m.pos} · ${esc(mt.name)}${m.team === me ? ' · ' + t('seu time') : ''}</span></div></div><p class="num">${statLine(m)}</p></div>
    ${list(t('Mais touchdowns'), st.td, s => [s.td, 'TD'])}${list(t('Passes de touchdown'), st.tdp, s => [s.tdp, 'TD'])}${list(t('Defesa (INT, fumbles, sacks e 4ªs)'), st.def, s => [s.def, t('jogadas')])}`;
}

// ----- cartão do time (imagem pra compartilhar) -----
const SHR = { url: '' };
const emblemImg = (i, px) => new Promise(res => { const e = EMB[i] || EMB[0], im = new Image(); im.onload = () => res(im); im.onerror = () => res(null);
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${px}" height="${px}" fill="${e[1]}" style="color:${e[1]}">${e[2]}</svg>`); });
async function teamCardURL(t, info) {
  info = info || {};
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  const W = 1080, H = 1450, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const F = (w, px) => `${w} ${px}px "Inter Tight","Helvetica Neue",Arial,sans-serif`, B = (w, px) => `${w} ${px}px "Inter","Helvetica Neue",Arial,sans-serif`;
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const fit = (txt, maxW) => { if (c.measureText(txt).width <= maxW) return txt; while (txt.length > 1 && c.measureText(txt + '…').width > maxW) txt = txt.slice(0, -1); return txt + '…'; };
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c2f7c'); g.addColorStop(.38, '#071a45'); g.addColorStop(.75, '#020817'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.fillStyle = '#f6d64a'; c.font = B(800, 26); if ('letterSpacing' in c) c.letterSpacing = '5px'; c.fillText('TOUCHDOWN AUCTION', 60, 70); if ('letterSpacing' in c) c.letterSpacing = '0px';
  const em = EMB[t.emb] || EMB[0], img = await emblemImg(t.emb, 96);
  c.fillStyle = em[1] + '30'; rr(60, 100, 118, 118, 38); c.fill(); c.strokeStyle = em[1] + '99'; c.lineWidth = 3; rr(60, 100, 118, 118, 38); c.stroke();
  if (img) c.drawImage(img, 71, 111, 96, 96);
  c.fillStyle = '#fff'; let nfz = 62; c.font = F(800, nfz); while (nfz > 34 && c.measureText(t.name).width > 840) { nfz -= 2; c.font = F(800, nfz); } c.fillText(fit(t.name, 840), 204, 160);
  c.font = B(700, 31); c.fillStyle = info.gold ? '#f6d64a' : '#a9b6d3';
  c.fillText(fit(info.text ? info.text + (info.rec ? ' · ' + info.rec : '') : tt('Elenco fechado · gastou {n}', { n: '$' + (BUDGET - t.budget) }), 840), 204, 206);
  const box = (x, lab, val, w) => { c.fillStyle = 'rgba(255,255,255,.07)'; rr(x, 244, w, 104, 24); c.fill(); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; rr(x, 244, w, 104, 24); c.stroke();
    c.fillStyle = '#a9b6d3'; c.font = B(700, 20); c.fillText(lab, x + 26, 282); c.fillStyle = '#fff'; c.font = F(800, 50); c.fillText(val, x + 26, 332); };
  const bw = (960 - 40) / 3; box(60, tt('ATAQUE'), t.rt.off.toFixed(1), bw); box(60 + bw + 20, tt('DEFESA'), t.rt.def.toFixed(1), bw); box(60 + 2 * (bw + 20), tt('GERAL'), t.rt.all.toFixed(1), bw);
  const rows = lineupRows(t.roster), by = {}; rows.forEach(r => (by[r.pos] = by[r.pos] || []).push(r));
  const field = (side, y0) => {
    c.fillStyle = 'rgba(30,140,95,.20)'; rr(60, y0, 960, 480, 34); c.fill(); c.strokeStyle = 'rgba(120,220,170,.28)'; c.lineWidth = 2; rr(60, y0, 960, 480, 34); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = B(800, 24); if ('letterSpacing' in c) c.letterSpacing = '3px';
    const got = rows.filter(r => (side === 'off') === OFF_POS.includes(r.pos) && r.p), tot = got.length;
    c.fillText(tt(side === 'off' ? 'ATAQUE' : 'DEFESA'), 92, y0 + 46); if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.textAlign = 'right'; c.fillText(`OVR ${(side === 'off' ? t.rt.off : t.rt.def).toFixed(1)}`, 988, y0 + 46); c.textAlign = 'left';
    const ly = y0 + (side === 'off' ? 182 : 310); c.setLineDash([16, 12]); c.strokeStyle = 'rgba(246,214,74,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, ly); c.lineTo(1000, ly); c.stroke(); c.setLineDash([]);
    const cells = side === 'off'
      ? [['WR', 0, 1, 1], ['OL', 0, 1, 2], ['OL', 1, 1, 3], ['OL', 2, 1, 4], ['TE', 0, 1, 5], ['WR', 1, 1, 6], ['QB', 0, 2, 4], ['RB', 0, 3, 4]]
      : [['CB', 0, 1, 1], ['CB', 1, 1, 6], ['LB', 0, 2, 3], ['LB', 1, 2, 4], ['EDGE', 0, 3, 2], ['DT', 0, 3, 3], ['DT', 1, 3, 4], ['EDGE', 1, 3, 5]];
    for (const [pos, i, r, col] of cells) {
      const x = by[pos][i], cx = 60 + 160 * (col - .5), cy = y0 + 96 + (r - 1) * 128, w = WEIGHT[pos];
      c.beginPath(); c.arc(cx, cy, 31, 0, 7);
      if (x.p) { c.fillStyle = side === 'off' ? '#1c47a8' : '#a83a30'; c.fill(); c.strokeStyle = side === 'off' ? '#7fa8ff' : '#ff9a8c'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#fff'; c.font = F(800, 30); c.textAlign = 'center'; c.fillText(String(x.p.ovr), cx, cy + 11); }
      else { c.fillStyle = 'rgba(3,10,28,.5)'; c.fill(); c.setLineDash([7, 6]); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3; c.stroke(); c.setLineDash([]); c.fillStyle = 'rgba(255,255,255,.45)'; c.font = F(800, 26); c.textAlign = 'center'; c.fillText('+', cx, cy + 9); }
      c.fillStyle = '#fff'; c.font = B(800, 21); c.textAlign = 'center'; c.fillText(pos, cx, cy + 58);
      c.fillStyle = 'rgba(255,255,255,.75)'; c.font = B(600, 19); c.fillText(x.p ? fit(shortName(x.p.name), 146) : '', cx, cy + 80);
      if (w > 1) { const lab = nf(w) + 'x'; c.font = B(800, 17); const tw = c.measureText(lab).width + 14; c.fillStyle = '#f6d64a'; rr(cx + 14, cy - 44, tw, 24, 12); c.fill(); c.fillStyle = '#0a1330'; c.fillText(lab, cx + 14 + tw / 2, cy - 26); }
      c.textAlign = 'left';
    }
  };
  field('off', 376); field('def', 876);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.font = B(600, 24); c.textAlign = 'center'; c.fillText(tt('Monte o seu time no Touchdown Auction'), W / 2, 1416); c.textAlign = 'left';
  return cv.toDataURL('image/png');
}
async function openShare(tm, info) {
  $('#shr').hidden = false; $('#shr-img').removeAttribute('src'); $('#shr-note').textContent = t('Gerando o cartão…');
  try { SHR.url = await teamCardURL(tm, info); $('#shr-img').src = SHR.url; $('#shr-note').textContent = t('Segure na imagem pra salvar, ou use os botões.'); $('#shr-share').hidden = !navigator.share; }
  catch (e) { $('#shr-note').textContent = t('Não consegui gerar o cartão neste navegador.'); }
}
const dataBlob = url => { const b = atob(url.split(',')[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Blob([a], { type: 'image/png' }); };
$('#shr').addEventListener('click', async e => {
  if (e.target.closest('[data-close]')) { $('#shr').hidden = true; return; }
  if (!SHR.url) return;
  if (e.target.closest('#shr-dl')) {
    let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (err) { dl = null; }
    if (dl) { try { await dl.save({ filename: 'meu-time-touchdown-auction.png', data: dataBlob(SHR.url) }); } catch (err) { if (err && err.code === 'host_unavailable') $('#shr-note').textContent = t('Este app não salva arquivos. Abra no navegador ou segure na imagem.'); } }
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(dataBlob(SHR.url)); a.download = 'meu-time-touchdown-auction.png'; document.body.appendChild(a); a.click(); a.remove(); }
  }
  else if (e.target.closest('#shr-share')) {
    try { const f = new File([dataBlob(SHR.url)], 'meu-time-touchdown-auction.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: t('Meu time no Touchdown Auction') }); else $('#shr-note').textContent = t('Este navegador não compartilha direto. Segure na imagem pra salvar.'); }
    catch (err) { if (err && err.name !== 'AbortError') $('#shr-note').textContent = t('O compartilhamento não abriu aqui. Segure na imagem pra salvar.'); }
  }
});
$('#r-card').onclick = () => openShare(me(), {});
function openGame(i) {
  stopGame(); G.liveHook = null;
  const g = G.season.games[i], A = tn(g.a), B = tn(g.b), tm = [A, B];
  if (!g.nar) narrateGame(g);
  const rowHTML = (p, k) => {
    const t = tm[p.team], cls = chipCls(p.result);
    return `<div class="lrow rv" style="--i:0"><span class="chip ${cls}">${resL(p.result)}</span><span>${esc(narrText(g, k))}<small>${esc(t.name)} · ${p.ot ? tt('prorrogação') : tt('posse {n}', { n: p.n })}</small></span><span class="num" style="color:var(--mute)">${p.scoreAfter[0]}–${p.scoreAfter[1]}</span></div>`;
  };
  const ovr = T => `<tr><td><span class="tn">${badge(T.emb, 22)}${esc(T.name)}</span></td><td class="num">${T.rt.off.toFixed(1)}</td><td class="num">${T.rt.def.toFixed(1)}</td></tr>`;
  $('#modal-in').innerHTML = `
    <div class="head"><span class="k" style="font-size:12px;font-weight:700;letter-spacing:.12em;color:var(--mute)">${esc(stageLabel(g)).toUpperCase()}</span><button class="btn ghost" id="close" style="min-height:42px;padding:8px 20px;font-size:15px">${t('Fechar')}</button></div>
    <div class="board"><div class="t">${badge(A.emb, 44)}<br>${esc(A.name)}</div><div class="s num" id="bs"><span id="bsa">0</span><span>–</span><span id="bsb">0</span></div><div class="t">${badge(B.emb, 44)}<br>${esc(B.name)}</div></div>
    <p class="note live" id="g-status" style="text-align:center"></p>
    <div class="gcols"><div class="gc">
    <div class="yard">${t('OVR dos times')}</div>
    <div class="card"><table class="cmp"><tr><th>${t('TIME')}</th><th>${t('ATAQUE')}</th><th>${t('DEFESA')}</th></tr>${ovr(A)}${ovr(B)}</table></div>
    </div><div class="gc">
    <div class="yard">${t('Posses')}</div>
    <div class="card" id="g-list"><p class="note" id="g-empty">${esc(introText(g))}</p></div>
    <button class="btn ghost full" id="g-skip" style="margin-top:14px">${t('Pular pro final')}</button>
    </div></div>`;
  $('#modal').hidden = false; $('#modal').scrollTop = 0; document.body.style.overflow = 'hidden';
  $('#close').onclick = closeGame;
  const list = $('#g-list'), st = $('#g-status'); let k = 0;
  const flash = (title, sub, cls, T, ms) => {
    const el = $('#g-flash'); el.className = 'gflash ' + cls; el.hidden = false;
    el.innerHTML = `${T ? badge(T.emb, 64) : ''}<b>${title}</b><span>${esc(sub)}</span>`;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = `gflash ${ms}ms ease both`;
    GT.push(setTimeout(() => { el.hidden = true; }, ms));
  };
  const finish = natural => {
    stopGame(); $('#g-flash').hidden = true; $('#g-skip').hidden = true;
    list.innerHTML = g.poss.map(rowHTML).join('').replace(/ rv" style="--i:0"/g, '"');
    tween($('#bsa'), g.sa, String, g.sa); tween($('#bsb'), g.sb, String, g.sb);
    const W = g.sa > g.sb ? A : g.sb > g.sa ? B : null;
    st.classList.remove('live'); st.textContent = !W ? t('Fim de jogo: empate.') : t(g.ot ? 'Fim de jogo: {w} venceu na prorrogação.' : 'Fim de jogo: {w} venceu.', { w: tsh(W) });
    if (natural === true && !REDUCED) flash(t('FIM DE JOGO'), W ? t('{w} vence por {a}–{b}', { w: tsh(W), a: Math.max(g.sa, g.sb), b: Math.min(g.sa, g.sb) }) : t('Empate em {a}–{b}', { a: g.sa, b: g.sb }), 'end', W, 2200);
  };
  const step = () => {
    const p = g.poss[k++], first = k === 1, prev = g.poss[k - 2], T = tm[p.team];
    if (first) list.innerHTML = '';
    list.insertAdjacentHTML('beforeend', rowHTML(p, k - 1));
    tween($('#bsa'), p.scoreAfter[0], String); tween($('#bsb'), p.scoreAfter[1], String);
    st.textContent = p.ot ? t('Ao vivo · prorrogação') : t('Ao vivo · posse {a} de {b}', { a: k, b: POSSESSIONS * 2 });
    let wait = p.result === 'PUNT' ? 650 : 1050;
    if (p.ot && !(prev && prev.ot)) { flash(t('PRORROGAÇÃO!'), t('Empatado no tempo normal'), 'ot', null, 1800); wait = 1900; }
    const fx = FX[p.result];
    if (fx) { flash(t(fx.t), fx.sub(p, T, tm[1 - p.team]), fx.cls, fx.who === 'o' ? T : tm[1 - p.team], fx.ms); wait = fx.w; }
    if (k >= g.poss.length) GT.push(setTimeout(() => finish(true), Math.max(wait, p.result === 'PUNT' ? 700 : 1100))); else GT.push(setTimeout(step, wait));
  };
  $('#g-skip').onclick = () => finish(false);
  const L = LV.running ? LV.games[i] : null;
  if (L && !L.done) {                                    // jogo da rodada em andamento: o modal só acompanha o relógio da rodada
    const fm = ms => Math.max(500, ms / SV.speed), T0 = k => tm[g.poss[k].team];
    $('#g-skip').hidden = true; st.classList.add('live');
    if (L.shown) {
      list.innerHTML = g.poss.slice(0, L.shown).map(rowHTML).join('').replace(/ rv" style="--i:0"/g, '"');
      const s = g.poss[L.shown - 1].scoreAfter; tween($('#bsa'), s[0], String, s[0]); tween($('#bsb'), s[1], String, s[1]);
      st.textContent = t('Ao vivo · posse {a} de {b}', { a: L.shown, b: POSSESSIONS * 2 });
    } else st.textContent = t('Ao vivo · começando');
    G.liveHook = { i,
      step: kk => {
        const p = g.poss[kk], T = T0(kk);
        if (kk === 0) list.innerHTML = '';
        list.insertAdjacentHTML('beforeend', rowHTML(p, kk));
        tween($('#bsa'), p.scoreAfter[0], String); tween($('#bsb'), p.scoreAfter[1], String);
        st.textContent = p.ot ? t('Ao vivo · prorrogação') : t('Ao vivo · posse {a} de {b}', { a: kk + 1, b: POSSESSIONS * 2 });
        const fx = FX[p.result];
        if (fx) flash(t(fx.t), fx.sub(p, T, tm[1 - p.team]), fx.cls, fx.who === 'o' ? T : tm[1 - p.team], fm(fx.ms));
      },
      ot: () => flash(t('PRORROGAÇÃO!'), t('Empatado no tempo normal'), 'ot', null, fm(1800)),
      end: () => {
        const W = g.sa > g.sb ? A : g.sb > g.sa ? B : null;
        list.innerHTML = g.poss.map(rowHTML).join('').replace(/ rv" style="--i:0"/g, '"');
        tween($('#bsa'), g.sa, String, g.sa); tween($('#bsb'), g.sb, String, g.sb);
        st.classList.remove('live'); st.textContent = !W ? t('Fim de jogo: empate.') : t(g.ot ? 'Fim de jogo: {w} venceu na prorrogação.' : 'Fim de jogo: {w} venceu.', { w: tsh(W) });
        flash(t('FIM DE JOGO'), W ? t('{w} vence por {a}–{b}', { w: tsh(W), a: Math.max(g.sa, g.sb), b: Math.min(g.sa, g.sb) }) : t('Empate em {a}–{b}', { a: g.sa, b: g.sb }), 'end', W, fm(2200));
      } };
    return;
  }
  if (REDUCED) finish(false); else { st.classList.add('live'); st.textContent = t('Ao vivo · começando'); GT.push(setTimeout(step, 700)); }
}
function closeGame() {
  stopGame(); $('#modal').hidden = true; document.body.style.overflow = '';
  $('#g-flash').hidden = true; G.liveHook = null;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGame(); });


// ----- idioma: troca na hora, sem recarregar -----
function fixConfNames(cs) {
  cs.forEach(c => { c.name = confName(c.ids.map(id => { const x = tn(id); return confTok(x.name, x.emb); })); });
  if (cs.length > 1 && cs[0].name === cs[1].name) cs[1].name += '²';
}
function renameForLang(from, to) {
  const nm = (l, i) => l === 'pt' ? EMB_NICK[i] + ' de ' + EMB_CITY[i] : EMB[i][0], map = {};
  EMB.forEach((_, i) => { map[nm(from, i)] = nm(to, i); });
  const fix = s => (typeof s === 'string' && map[s]) || s;
  L.name = fix(L.name); L.bots.forEach(b => { b.name = fix(b.name); });
  L.log.forEach(e => { if (e.v && e.v.n) e.v.n = fix(e.v.n); });
  G.teams.forEach(tm => { tm.name = fix(tm.name); }); G.name = fix(G.name);
  if (G.confs) fixConfNames(G.confs);
  const inp = $('#lb-name'); if (inp) inp.value = L.name;
}
function relang(from) {
  if (from) renameForLang(from, LANG);
  applyStatic();
  document.querySelectorAll('.lang button').forEach(b => { const on = b.dataset.lang === LANG; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const vis = id => { const e = $('#' + id); return e && !e.hidden; };
  if (vis('lobby')) { paintLobby(); paintFeed(); }
  if (vis('online')) onList();
  if (vis('lab')) { labProbs(); labPaint(); $('#lab-step').textContent = t('Próxima posse'); $('#lab-stats').hidden = true; }
  if (vis('results')) paintResults();
  if (SV.el && SV.S && !SV.el.hidden) { svRender(); if (vis('results') || vis('cup')) $('#sim').textContent = t($('#season').hidden ? 'Simular temporada' : 'Refazer temporada'); }
}
function setLang(l) {
  if (!LANGS.includes(l) || l === LANG) return;
  const from = LANG; LANG = l; try { localStorage.setItem('fa-lang', l); } catch (e) {}
  relang(from);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); });
/*MPCLIENT*/
collectStatic(); mountLang(); applyStatic();
document.querySelectorAll('.lang button').forEach(b => { const on = b.dataset.lang === LANG; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
