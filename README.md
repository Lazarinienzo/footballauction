# Touchdown Auction

Leilão de jogadores da NFL com temporada simulada. Online com salas privadas e públicas.

- `game/` — código do jogo (HTML/JS). Edite aqui.
- `src/` — servidor Cloudflare (Worker + Durable Objects). `engine.js` é gerado.
- `public/index.html` — página final, gerada por `python3 build.py`.

## Rodar local
```
npm install
python3 build.py
npx wrangler dev
```

## Publicar
Rode `python3 build.py`, faça commit e push. A Cloudflare publica sozinha (Workers Builds, comando de deploy `npx wrangler deploy`).
