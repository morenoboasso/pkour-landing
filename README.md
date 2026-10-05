# pkour-landing

Landing statica di [pkour.it](https://pkour.it) (GitHub Pages).

## Open Graph (share spot / trick)

I link dell’app sono `https://pkour.it/spots/:id` e `https://pkour.it/tricks/:id`.

I crawler social **non eseguono JavaScript**, quindi serve HTML con meta OG già nell’HTML iniziale.

### Architettura

1. **Backend** (`PKour-be`): `GET /share/spots/:id` e `GET /share/tricks/:id` restituiscono HTML con `og:title` / `og:image` (cover spot o thumbnail trick; fallback `https://pkour.it/og-default.png`).
2. **Cloudflare Worker** ([`workers/share-og.js`](workers/share-og.js)): su `/spots/*` e `/tricks/*` fa proxy all’HTML del BE; il resto resta su GitHub Pages.
3. **Asset**: [`og-default.png`](og-default.png) (1200×630) — non usare SVG come `og:image`.

```
https://pkour.it/spots/123
        │
        ▼
 Cloudflare Worker
        │
        ├─ /spots|tricks/:id  →  Cloud Run /share/...
        └─ altro              →  GitHub Pages
```

### Deploy Worker (obbligatorio per le preview social)

Prerequisito: DNS di `pkour.it` su Cloudflare con **proxy arancione**.

**Opzione A — Dashboard**

1. Workers & Pages → Create → Worker.
2. Incolla il contenuto di `workers/share-og.js`.
3. Settings → Triggers → Add route:
   - `pkour.it/*`
   - `www.pkour.it/*` (se usato)
4. Deploy.

**Opzione B — Wrangler**

```bash
cd workers
npx wrangler login
# Abilita le routes in wrangler.toml (zone_name)
npx wrangler deploy
```

Se l’URL Cloud Run del BE cambia, aggiorna `BE_SHARE_ORIGIN` in `share-og.js`.

### Verifica dopo il deploy

1. Apri direttamente (senza Worker non basta):  
   `https://pkour-be-….run.app/share/spots/<id>`  
   e controlla nel sorgente `og:image` / `og:title`.
2. Con Worker attivo: `https://pkour.it/spots/<id>` → stesso HTML.
3. [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) → **Scrape Again**.
4. WhatsApp: invia il link in una chat **nuova** (cache aggressiva).
5. Controlla che `https://pkour.it/og-default.png` e le cover R2/Cloudinary siano HTTPS pubblici.

### Fallback senza Worker

Finché il Worker non è attivo, GitHub Pages continua a servire [`404.html`](404.html) (preview via JS). Le preview social restano generiche (`og-default.png`) finché non c’è il proxy.
