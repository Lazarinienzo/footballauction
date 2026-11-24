// ---------- idiomas (PT é a chave; EN vem do dicionário) ----------
const LANGS = ['pt', 'en'];
let LANG = 'pt';
try { const sv = localStorage.getItem('fa-lang'); LANG = LANGS.includes(sv) ? sv : (/^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en'); } catch (e) { LANG = /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en'; }
const I18N = { en: {} };
// t('texto {n}', { n: 3 }): traduz a chave e troca {vars}
function t(k, v) {
  let s = LANG !== 'pt' && I18N[LANG] && I18N[LANG][k] != null ? I18N[LANG][k] : k;
  return v ? s.replace(/\{(\w+)\}/g, (m, n) => v[n] != null ? v[n] : m) : s;
}
// plural simples: tn1('{n} vaga', '{n} vagas', n)
const tpl = (one, many, n) => t(n === 1 ? one : many, { n });
// texto estático do HTML: guarda o original em PT e reescreve ao trocar de idioma
const STATIC = [];
function collectStatic() {
  const w = document.createTreeWalker(document.getElementById('app').parentNode, NodeFilter.SHOW_TEXT, { acceptNode: n => /\S/.test(n.nodeValue) && !/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) ? 1 : 2 });
  let n; while ((n = w.nextNode())) STATIC.push({ n, pt: n.nodeValue });
  document.querySelectorAll('[placeholder],[aria-label],[alt]').forEach(el => ['placeholder', 'aria-label', 'alt'].forEach(a => { if (el.hasAttribute(a)) STATIC.push({ el, a, pt: el.getAttribute(a) }); }));
}
function applyStatic() {
  for (const s of STATIC) {
    const core = s.pt.trim(), tr = LANG === 'pt' ? core : (I18N[LANG] && I18N[LANG][core] != null ? I18N[LANG][core] : core);
    if (s.n) s.n.nodeValue = s.pt.replace(core, () => tr); else s.el.setAttribute(s.a, tr);
  }
  document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : LANG;
  document.title = t('Football Auction');
}
function langBar() {
  return `<div class="lang" role="group" aria-label="Idioma">${LANGS.map(l => `<button type="button" data-lang="${l}" class="${l === LANG ? 'on' : ''}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join('')}</div>`;
}
function mountLang() {
  document.querySelectorAll('header.top').forEach(h => h.insertAdjacentHTML('beforeend', langBar()));
  const r = document.querySelector('#results .title'); if (r) r.insertAdjacentHTML('beforebegin', `<div class="langrow">${langBar()}</div>`);
}
const tt = (k, v) => t(k, v);   // alias para usar onde "t" é variável local (time)
