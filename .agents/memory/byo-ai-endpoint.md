---
name: BYO AI endpoint + free-coach fallback
description: How Storyliner does optional AI without a paid/managed provider, and the free fallbacks.
---

# Optional AI via bring-your-own OpenAI-compatible endpoint

The user explicitly does NOT want a paid/managed AI dependency (declined Replit-managed OpenAI). The agreed design:

- AI is **optional**. It activates only when env vars `AI_BASE_URL` + `AI_MODEL` are set (optional `AI_API_KEY`). The server calls `{AI_BASE_URL}/chat/completions` with the standard OpenAI chat shape via plain `fetch` — no SDK, no npm install. This means it works with LM Studio, Ollama, llama.cpp, Google Gemini free tier, or Groq — all OpenAI-compatible.
- **Why:** keeps the app free by default and lets the user self-host or use a free-tier key later without a rewrite. Recommended free path for real AI = Google Gemini free tier (OpenAI-compatible endpoint, no paid account).
- `/api/ai/status` reports `{enabled, provider}`; the client only calls `/api/ai/coach` when enabled. (AI status is NOT surfaced in the header — see line below on why pricing/AI-status language was removed from the top strip.)

# Free fallbacks (always on, no cost, no key)

- **Story coach** is rule-based and client-side: `client/src/lib/story-coach.ts` analyzes Aristotelian arc (hook/tension/payoff) + ethos/pathos/logos via keyword heuristics. The whole product concept is a compressed brand story in 160 chars (SEO meta length).
- **Keyword suggestions default to client-side extraction from the user's own typed story** (`extractStoryKeywords` in `home.tsx`), not an API — the user found generic API words "horrible" and wanted suggestions grounded in their sentences. The Datamuse `/api/suggest` proxy is now only the opt-in "Related words" mode (its `useEffect` is gated to that mode). **Thesaurus** still uses the free **Datamuse API** (`api.datamuse.com`, no key, CORS ok, `ml=` synonyms).
- **Celebration threshold = 4 woven-in keywords** (`REQUIRED_KEYWORDS`), chosen with the user: two anchors + two real supporting signals. **Why:** lower than the old 6 (which nudged toward keyword stuffing — contradicting the app's own anti-cheating message); 4 reads as natural and honest brands often only have a handful. Keep UI success copy number-agnostic so it doesn't drift if the threshold changes.

# AI rewrite is intentionally surfaced as "Coming soon" (key out of credits)

The configured Google/Gemini key returns **429 "Your prepayment credits are depleted"**, so live AI rewrites fail. By user decision, the UI presents AI rewrite as **"Coming soon"** rather than a dead button — all AI code is left intact.
- `story-coach-panel.tsx`: a "Coming soon" badge, the rewrite button is hard-disabled (`disabled`) and labeled "Coming soon", description says it's not available yet.
- **Why:** end-users never supply their own key (it's a server-side secret going to the owner's Gemini endpoint); a visible-but-broken button is worse than an honest "soon".
- **To re-enable when the key is funded:** remove the `disabled`/"Coming soon" badge in `story-coach-panel.tsx`. No backend change needed — the route/endpoint already work.
- **The header no longer shows AI status or "free coach" at all** — the user found pricing/AI-status language cheapening for that prime top-strip space. See the brand-intellectual-resistance memory.

# Guardrails on the proxy/AI routes

`/api/suggest`, `/api/thesaurus`, `/api/ai/coach` are unauthenticated proxies, so they have in-memory per-IP rate limiting (`rateLimited()` in `server/routes.ts`). AI responses are validated/normalized with a Zod schema before returning (model JSON can be malformed). Client suggestion fetch uses AbortController to avoid stale-response races.
**Why:** an unthrottled endpoint that spends an API key or amplifies outbound traffic is a cost/DoS risk — flagged in code review.
