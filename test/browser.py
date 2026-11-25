import json, sys, time, random
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8787'
with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    def mk(name, w=1280, h=900):
        ctx = b.new_context(viewport={'width': w, 'height': h}, locale='pt-BR'); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ': ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(BASE); return pg
    A = mk('A'); B = mk('B', 390, 800)
    A.click('#go-online'); A.click('#on-pub'); A.wait_for_selector('#lobby:not([hidden])', timeout=8000)
    code = A.inner_text('#lb-code'); print('código', code)
    A.screenshot(path='mp_lobbyA.png')
    B.click('#go-online'); B.wait_for_timeout(1500)
    print('lista B:', B.inner_text('#on-list').replace('\n', ' | '))
    B.screenshot(path='mp_online.png')
    B.click(f'#on-list [data-join="{code}"]'); B.wait_for_selector('#lobby:not([hidden])', timeout=8000)
    A.wait_for_timeout(500)
    print('assentos A:', A.inner_text('#lb-seats').replace('\n', ' | ')); print('assentos B:', B.inner_text('#lb-seats').replace('\n', ' | '))
    print('B botão:', B.inner_text('#lb-go'), 'disabled', B.is_disabled('#lb-go'))
    A.click('#lb-add'); A.click('#lb-add'); A.wait_for_timeout(500)
    print('B botão antes:', B.inner_text('#lb-go'), '| A botão (host, B não pronto):', A.inner_text('#lb-go'), A.is_disabled('#lb-go'))
    B.click('#lb-go'); B.wait_for_timeout(600)
    print('B botão depois:', B.inner_text('#lb-go'), '| A vê:', A.inner_text('#lb-seats').replace('\n', ' | ')[:160], '| A botão:', A.inner_text('#lb-go'), A.is_disabled('#lb-go'))
    B.screenshot(path='mp_ready.png')
    B.screenshot(path='mp_lobbyB.png'); A.screenshot(path='mp_lobbyA2.png')
    print('A botão:', A.inner_text('#lb-go'))
    A.click('#lb-go'); A.wait_for_selector('#auction:not([hidden])', timeout=8000); B.wait_for_selector('#auction:not([hidden])', timeout=8000)
    A.wait_for_timeout(5000); A.screenshot(path='mp_aucA.png'); B.screenshot(path='mp_aucB.png')
    A.evaluate("()=>{window.__up=0;const o=sfx.up;sfx.up=function(m){__up++;return o.call(sfx,m)}}")
    drive = """()=>{ const A=G.A; if(!A||A.phase!=='bidding'||A.hold>0) return; const M=me(); if(A.leader===M||A.passed.has(M)||!A.elig.includes(M)) return;
      const cap=maxBid(M,A.cur); if(A.price+1<=cap && Math.random()<.4) A.bid(M,A.price+1+Math.floor(Math.random()*3)>cap?cap:A.price+1); else A.pass(M); }"""
    t0 = time.time()
    while time.time() - t0 < 900:
        for pg in (A, B):
            try: pg.evaluate(drive)
            except Exception as e: pass
        if A.is_visible('#results') and B.is_visible('#results'): break
        time.sleep(.25)
    print('duração', round(time.time() - t0), 's; resultados visíveis A/B', A.is_visible('#results'), B.is_visible('#results'))
    ra = A.evaluate("()=>JSON.stringify(G.teams.map(t=>[t.id,t.budget,t.roster.map(p=>p.id)]))"); rb = B.evaluate("()=>JSON.stringify(G.teams.map(t=>[t.id,t.budget,t.roster.map(p=>p.id)]))")
    print('elencos iguais:', ra == rb, '| times com 16:', A.evaluate("()=>G.teams.every(t=>t.roster.length===16)"))
    A.wait_for_timeout(800); A.screenshot(path='mp_resA.png'); B.screenshot(path='mp_resB.png')
    print('sons tocados A:', A.evaluate('()=>__up'))
    print('botão sim A/B visível:', A.is_visible('#sim'), B.is_visible('#sim'), '| aviso B:', B.is_visible('#sim-wait'), '| voltar ao menu:', A.is_visible('#r-home'))
    A.click('#sim'); A.wait_for_timeout(800)
    print('B temporada aberta sozinha:', B.is_visible('#season'), '| aviso B some:', not B.is_visible('#sim-wait'))
    sig = "()=>JSON.stringify(SV.S.games.map(g=>[g.a,g.b,g.sa,g.sb]))+SV.S.champion.id"
    print('temporada igual:', A.evaluate(sig) == B.evaluate(sig))
    print('botão sim após iniciar (A anfitrião, B):', A.is_visible('#sim'), B.is_visible('#sim'))
    A.click('#sim'); A.wait_for_timeout(600)
    print('refazer pelo anfitrião -> igual de novo:', A.evaluate(sig) == B.evaluate(sig))
    print('B tem botão iniciar rodada:', B.locator('[data-act=start]').count(), '| aviso espera:', 'Aguardando' in B.inner_text('#season'))
    A.click('[data-act=start]'); A.wait_for_timeout(700)
    print('rodando A/B:', A.evaluate('()=>LV.running'), B.evaluate('()=>LV.running'))
    tl = "()=>JSON.stringify(Object.values(LV.games).map(l=>l.ev.map(e=>e.t)))"
    print('linhas do tempo iguais:', A.evaluate(tl) == B.evaluate(tl))
    print('placar A/B:', A.evaluate('()=>Math.round(LV.now/100)'), B.evaluate('()=>Math.round(LV.now/100)'))
    B.screenshot(path='mp_roundB.png')
    B.click('#r-home'); B.wait_for_timeout(500); print('B voltou ao menu:', B.is_visible('#go-online'), 'home-rooms', B.is_visible('#home-rooms'))
    A.screenshot(path='mp_seasonA.png')
    print('erros:', errs)
    b.close()
