import WebSocket from 'ws';
const BASE = process.env.BASE || 'localhost:8787';
const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
let fails = 0; const ok = (n, c) => { if (!c) { fails++; console.log('FALHOU:', n); } else console.log('ok:', n); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cl(tok, o) { const c = { errs: [], lobby: null, wrong: null }; c.ws = new WebSocket(`ws://${BASE}/ws/${code}`);
  c.ws.on('open', () => c.ws.send(JSON.stringify({ t: 'join', tok, name: '', auto: true, create: false, pub: true, ...o })));
  c.ws.on('message', d => { const m = JSON.parse(d); if (m.t === 'err') { c.errs.push(m.code); c.wrong = m.wrong; } if (m.t === 'lobby') c.lobby = m; }); return c; }
const a = cl('tok-aaaaaaaa', { create: true, pw: 'abc' }); await sleep(400);
ok('host entra', a.lobby && a.lobby.lock === true);
const r = await (await fetch(`http://${BASE}/api/rooms`)).json();
const e = r.rooms.find(x => x.code === code); ok('lista mostra lock', e && e.lock === true);
const b = cl('tok-bbbbbbbb', {}); await sleep(400); ok('sem senha: erro pass', b.errs.includes('pass') && b.wrong === false && !b.lobby);
const c = cl('tok-cccccccc', { pw: 'zzz' }); await sleep(400); ok('senha errada: wrong', c.errs.includes('pass') && c.wrong === true && !c.lobby);
const d = cl('tok-dddddddd', { pw: 'abc' }); await sleep(400); ok('senha certa entra', d.lobby && d.lobby.seats.length === 2);
a.ws.close(); const a2 = cl('tok-aaaaaaaa', {}); await sleep(400); ok('host reconecta sem senha', a2.lobby && a2.lobby.seats.length === 2);
process.exit(fails ? 1 : 0);
