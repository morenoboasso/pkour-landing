# Cloudflare Worker — share Open Graph

Vedi anche il [README della landing](../README.md#open-graph-share-spot--trick).

## Ruolo

Proxy di `https://pkour.it/spots/:id` e `https://pkour.it/tricks/:id` verso:

`https://pkour-be-513506522652.europe-west1.run.app/share/{spots|tricks}/:id`

così i crawler ricevono HTML con `og:image` / `og:title` dinamici.

## Deploy rapido

1. DNS `pkour.it` su Cloudflare (proxy ON).
2. Crea Worker, incolla [`share-og.js`](share-og.js).
3. Route: `pkour.it/*` (e `www.pkour.it/*` se serve).
4. Oppure: `npx wrangler deploy` da questa cartella (dopo aver scommentato le `routes` in `wrangler.toml`).

## Test

```bash
# HTML diretto dal BE
curl -sI "https://pkour-be-513506522652.europe-west1.run.app/share/tricks/<id>" | head
curl -s "https://pkour-be-513506522652.europe-west1.run.app/share/tricks/<id>" | grep og:image

# Via dominio (dopo Worker)
curl -s "https://pkour.it/tricks/<id>" | grep og:
```

Poi Facebook Sharing Debugger → Scrape Again.
