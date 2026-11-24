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
    B.screenshot(path='mp_lobbyB.png'); A.screenshot(path='mp_lobbyA2.png')
    print('A botão:', A.inner_text('#lb-go'))
    A.click('#lb-go'); A.wait_for_selector('#auction:not([hidden])', timeout=8000); B.wait_for_selector('#auction:not([hidden])', timeout=8000)
    A.wait_for_timeout(5000); A.screenshot(path='mp_aucA.png'); B.screenshot(path='mp_aucB.png')
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
    print('botão sim A/B visível:', A.is_visible('#sim'), B.is_visible('#sim'))
    A.click('#sim'); B.click('#sim'); A.wait_for_timeout(500)
    sig = "()=>JSON.stringify(SV.S.games.map(g=>[g.a,g.b,g.sa,g.sb]))+SV.S.champion.id"
    print('temporada igual:', A.evaluate(sig) == B.evaluate(sig))
    print('botão sim após iniciar (A anfitrião, B):', A.is_visible('#sim'), B.is_visible('#sim'))
    A.click('#sim'); A.wait_for_timeout(600)
    print('refazer pelo anfitrião -> igual de novo:', A.evaluate(sig) == B.evaluate(sig))
    A.screenshot(path='mp_seasonA.png')
    print('erros:', errs)
    b.close()
