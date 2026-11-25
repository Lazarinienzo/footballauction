import sys, time
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8787'
drive = """()=>{ const A=G.A; if(!A||A.phase!=='bidding'||A.hold>0) return; const M=me(); if(A.leader===M||A.passed.has(M)||!A.elig.includes(M)) return;
  const cap=maxBid(M,A.cur); if(A.price+1<=cap && Math.random()<.4) A.bid(M,A.price+1+Math.floor(Math.random()*3)>cap?cap:A.price+1); else A.pass(M); }"""
ok = lambda n, c: print(('ok: ' if c else 'FALHOU: ') + n)
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    def mk(n, w=390, h=800):
        ctx = b.new_context(viewport={'width': w, 'height': h}, locale='pt-BR'); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(n + ': ' + str(e))); pg.goto(BASE); return pg
    A = mk('A'); B = mk('B')
    A.click('#go-online'); A.click('#on-pub'); A.wait_for_selector('#lobby:not([hidden])'); code = A.inner_text('#lb-code')
    B.click('#go-online'); B.wait_for_timeout(1200); B.click(f'#on-list [data-join="{code}"]'); B.wait_for_selector('#lobby:not([hidden])')
    # recarrega no lobby
    B.reload(); B.wait_for_selector('#lobby:not([hidden])', timeout=8000); ok('rejoin no lobby', True)
    A.click('#lb-add'); A.click('#lb-add'); B.click('#lb-go'); A.wait_for_timeout(500)
    A.click('#lb-go'); A.wait_for_selector('#auction:not([hidden])'); B.wait_for_selector('#auction:not([hidden])')
    A.wait_for_timeout(15000)
    B.reload(); B.wait_for_selector('#auction:not([hidden])', timeout=10000); B.wait_for_timeout(1500)
    ok('rejoin no leilão', B.evaluate("()=>G.A && G.A.i>=0 && G.teams.length===4"))
    t0 = time.time()
    while time.time() - t0 < 900:
        for pg in (A, B):
            try: pg.evaluate(drive)
            except Exception: pass
        if A.is_visible('#results') and B.is_visible('#results'): break
        time.sleep(.25)
    ok('resultados em A e B', A.is_visible('#results') and B.is_visible('#results'))
    confs = "()=>JSON.stringify(G.confs.map(c=>c.ids))"
    ok('conferências iguais', A.evaluate(confs) == B.evaluate(confs))
    A.click('#sim'); A.wait_for_timeout(800); A.click('[data-act=start]'); A.wait_for_timeout(4000)
    B.reload(); B.wait_for_selector('#results:not([hidden])', timeout=10000); B.wait_for_timeout(2500)
    ok('B voltou pra temporada', B.is_visible('#season'))
    ok('conferências iguais depois do reload', A.evaluate(confs) == B.evaluate(confs))
    sig = "()=>JSON.stringify(SV.S.games.map(g=>[g.a,g.b,g.sa,g.sb]))+SV.S.champion.id"
    ok('temporada igual depois do reload', A.evaluate(sig) == B.evaluate(sig))
    ok('rodada rolando em A e B', A.evaluate('()=>LV.running') and B.evaluate('()=>LV.running'))
    da, db = A.evaluate('()=>LV.now'), B.evaluate('()=>LV.now'); print('LV.now A/B', round(da), round(db))
    ok('relógio da rodada alinhado (<1.5s)', abs(da - db) < 1500)
    # espera a rodada acabar, A inicia a 2ª, B recarrega entre rodadas
    t0 = time.time()
    while time.time() - t0 < 120 and A.evaluate('()=>LV.running'): time.sleep(1)
    A.click('[data-act=start]'); A.wait_for_timeout(1500)
    t0 = time.time()
    while time.time() - t0 < 120 and A.evaluate('()=>LV.running'): time.sleep(1)
    B.reload(); B.wait_for_selector('#results:not([hidden])', timeout=10000); B.wait_for_timeout(2500)
    print('SV.done A/B', A.evaluate('()=>SV.done'), B.evaluate('()=>SV.done'))
    ok('rodadas concluídas iguais depois de reload', A.evaluate('()=>SV.done') == B.evaluate('()=>SV.done'))
    ok('B continua sem botão de iniciar', B.locator('[data-act=start]').count() == 0)
    print('erros:', errs)
