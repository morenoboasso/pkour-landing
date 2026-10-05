/**
 * Cloudflare Worker: Open Graph HTML for PKour share links.
 *
 * Routes:
 *   /spots/:id  -> BE GET /share/spots/:id  (HTML + OG)
 *   /tricks/:id -> BE GET /share/tricks/:id (HTML + OG)
 *   everything else -> origin (GitHub Pages)
 *
 * Deploy (dashboard or wrangler):
 *   1. Cloudflare DNS for pkour.it must be proxied (orange cloud).
 *   2. Workers > Create > paste this script.
 *   3. Add route: pkour.it/* and www.pkour.it/* (or only path-based if preferred).
 *   4. Set BE_SHARE_ORIGIN if the Cloud Run URL changes.
 *
 * Optional wrangler.toml:
 *   name = "pkour-share-og"
 *   main = "share-og.js"
 *   compatibility_date = "2024-11-01"
 *   routes = [
 *     { pattern = "pkour.it/*", zone_name = "pkour.it" },
 *     { pattern = "www.pkour.it/*", zone_name = "pkour.it" }
 *   ]
 */

const BE_SHARE_ORIGIN =
  'https://pkour-be-513506522652.europe-west1.run.app';

const SHARE_PATH = /^\/(spots|tricks)\/([^/]+)\/?$/;

export default {
  async fetch(request, _env, _ctx) {
    const url = new URL(request.url);

    // Only intercept clean share paths; leave AASA / assetlinks / landing alone.
    const match = url.pathname.match(SHARE_PATH);
    if (!match) {
      return fetch(request);
    }

    // Preserve method for safety; share pages are GET/HEAD only.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fetch(request);
    }

    const kind = match[1];
    const id = match[2];
    const upstream = `${BE_SHARE_ORIGIN}/share/${kind}/${encodeURIComponent(id)}`;

    const headers = new Headers(request.headers);
    // Drop hop-by-hop / host so Cloud Run sees its own host.
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.set('Accept', 'text/html,application/xhtml+xml');

    const upstreamRequest = new Request(upstream, {
      method: request.method,
      headers,
      redirect: 'manual',
    });

    const response = await fetch(upstreamRequest);
    const outHeaders = new Headers(response.headers);
    // Ensure short cache at the edge too.
    if (!outHeaders.has('Cache-Control')) {
      outHeaders.set('Cache-Control', 'public, max-age=300');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    });
  },
};
