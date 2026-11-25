# Monta o jogo: game/*.js + template -> public/index.html (online) e src/engine.js (motor do servidor).
# Uso: python3 build.py   (rode antes de cada deploy; o Cloudflare publica o que estiver commitado)
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
G = lambda f: open('game/' + f, encoding='utf-8').read()
ui = G('ui.js').replace('/*MPCLIENT*/', G('mp_client.js')).replace('/*DUEL*/', G('duel.js')).replace('false /*MPON*/', 'true')
page = G('template.html').replace('/*DB*/', G('db.js')).replace('/*SIM*/', G('sim.js')).replace('/*UI*/', G('i18n_core.js') + G('i18n_en.js') + ui)
open('public/index.html', 'w', encoding='utf-8').write(page)
strip = lambda s: '\n'.join(l for l in s.split('\n') if not l.startswith('if (typeof module'))
open('src/engine.js', 'w', encoding='utf-8').write(strip(G('db.js')) + '\n' + strip(G('sim.js')) + '\nexport { DB, SLOTS, POS_ORDER, OFF_POS, TOTAL_SLOTS, BUDGET, FORMS, BENCH_TOTAL, Auction, newBot, cfgTeam, validForm, maxTeams, feasible, canForm, finishTeam, withSeed, rint, R, maxBid, need, slotsLeft, MIN_TEAMS, Duelo, duelGame, DU_CFG, DU_TURN_MS, DU_EXTRA };\n')
print('ok', len(page))
