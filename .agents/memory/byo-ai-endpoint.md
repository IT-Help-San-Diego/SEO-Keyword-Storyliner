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

# AI rewrite is LIVE — and Gemini model names go stale

AI rewrite is live and working (the earlier "Coming soon"/depleted-credits state is over; user re-funded the key).
- **Pinned Gemini model names get retired** — `gemini-2.0-flash` started returning 404 "no longer available". Fix: `AI_MODEL=gemini-flash-lite-latest` (shared env var), Google's rolling alias for the current cheapest flash-lite tier. **Why:** the user's explicit goal is "the cheapest bot that still does the job," and an alias can't go stale. If AI breaks with a 404 again, first hit `{AI_BASE_URL}/models` to see what exists.
- **The header no longer shows AI status or "free coach" at all** — the user found pricing/AI-status language cheapening for that prime top-strip space. See the brand-intellectual-resistance memory.

# Guardrails on the proxy/AI routes

`/api/suggest`, `/api/thesaurus`, `/api/ai/coach` are unauthenticated proxies, so they have in-memory per-IP rate limiting (`rateLimited()` in `server/routes.ts`). AI responses are validated/normalized with a Zod schema before returning (model JSON can be malformed). Client suggestion fetch uses AbortController to avoid stale-response races.
**Why:** an unthrottled endpoint that spends an API key or amplifies outbound traffic is a cost/DoS risk — flagged in code review.
