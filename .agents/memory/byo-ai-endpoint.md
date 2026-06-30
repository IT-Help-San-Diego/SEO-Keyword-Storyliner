---
name: BYO AI endpoint + free-coach fallback
description: How Storyliner does optional AI without a paid/managed provider, and the free fallbacks.
---

# Optional AI via bring-your-own OpenAI-compatible endpoint

The user explicitly does NOT want a paid/managed AI dependency (declined Replit-managed OpenAI). The agreed design:

- AI is **optional**. It activates only when env vars `AI_BASE_URL` + `AI_MODEL` are set (optional `AI_API_KEY`). The server calls `{AI_BASE_URL}/chat/completions` with the standard OpenAI chat shape via plain `fetch` — no SDK, no npm install. This means it works with LM Studio, Ollama, llama.cpp, Google Gemini free tier, or Groq — all OpenAI-compatible.
- **Why:** keeps the app free by default and lets the user self-host or use a free-tier key later without a rewrite. Recommended free path for real AI = Google Gemini free tier (OpenAI-compatible endpoint, no paid account).
- `/api/ai/status` reports `{enabled, provider}`; the UI shows "Free coach" vs "AI coach: on" and only calls `/api/ai/coach` when enabled.

# Free fallbacks (always on, no cost, no key)

- **Story coach** is rule-based and client-side: `client/src/lib/story-coach.ts` analyzes Aristotelian arc (hook/tension/payoff) + ethos/pathos/logos via keyword heuristics. The whole product concept is a compressed brand story in 160 chars (SEO meta length).
- **Thesaurus + keyword suggestions** use the free **Datamuse API** (`api.datamuse.com`, no key, CORS ok) proxied server-side: `ml=` for synonyms, `rel_trg=` for related/suggested keywords.

# Guardrails on the proxy/AI routes

`/api/suggest`, `/api/thesaurus`, `/api/ai/coach` are unauthenticated proxies, so they have in-memory per-IP rate limiting (`rateLimited()` in `server/routes.ts`). AI responses are validated/normalized with a Zod schema before returning (model JSON can be malformed). Client suggestion fetch uses AbortController to avoid stale-response races.
**Why:** an unthrottled endpoint that spends an API key or amplifies outbound traffic is a cost/DoS risk — flagged in code review.
