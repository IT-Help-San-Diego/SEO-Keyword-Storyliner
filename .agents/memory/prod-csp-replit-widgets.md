---
name: Prod CSP must allow Replit domains for injected widgets
description: Why the Replit feedback beacon (and similar injected widgets) vanish on the published site, and the fix.
---

# Strict prod CSP silently blocks Replit's injected feedback widget

Storyliner sets a hand-written `Content-Security-Policy` in `server/index.ts` (prod only). A locked-down policy (`script-src 'self'`, `connect-src 'self'`, frames falling back to `default-src 'self'`) **blocks Replit's published-app feedback beacon** — it loads a script + iframe from Replit domains and phones home, so it never appears bottom-right on the live site even though the feature is "on".

**Fix:** allow Replit origins in `script-src`, `connect-src`, `frame-src`, and `img-src`. Do NOT add `'unsafe-inline'` to script-src — the beacon loads via external `<script src>`, and unsafe-inline would gut the app's security posture (security/Lighthouse is a stated goal).

**The widget is NOT served from `replit.com`.** Inspecting the live deployed HTML (`curl https://<app>.replit.app/`) shows the injected tag is:
`<script src="https://replit-cdn.com/feedback-widget/widget.global.js" data-logo-src="https://storage.googleapis.com/replit/images/...">`.
So the allowlist must include `https://replit-cdn.com https://*.replit-cdn.com` (script/connect/frame) AND `https://storage.googleapis.com` in `img-src` for the widget's logo. The earlier `*.replit.com/.replit.dev/.replit.app` list alone was insufficient and the widget stayed hidden. When in doubt, `curl` the deployed page and read the exact injected `src`/`data-*` domains rather than guessing.

**Note:** `frame-ancestors 'none'` and `X-Frame-Options: DENY` are fine to keep — they govern whether OUR page can be framed, not the iframes the beacon injects into our page (that's `frame-src`).

**Why:** the user reported the feedback widget missing on the live site; the CSP was the cause. Only verifiable after republish — dev has no prod CSP.
