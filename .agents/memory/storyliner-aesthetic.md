---
name: Storyliner visual identity
description: The locked-in design language for Storyliner and why it's shaped this way.
---

# Storyliner aesthetic — "intellectual engraving"

Premium, intellectual aesthetic modeled on the user's reference site intellectualresistance.com. Treat this as the established design language — deepen it, don't reinvent it.

- **Palette:** warm near-black background + muted gold accent. Light mode is a warm classical parchment with deeper gold ink. Green is reserved for the success/celebration payoff; gold marks matched/working states.
- **Type:** a grotesk display face for headings (via the `.font-display` utility), a neutral sans for body, and a mono face for uppercase letter-spaced eyebrow/labels. Fonts are loaded in client/index.html.
- **Default theme is dark**; the light toggle still works.
- **Concept/copy:** brand story as a foundation built on "nearly 2,400 years of logic" (Aristotle), framed as writers'-room/screenplay engineering. NO brand names in copy — "Disney" was removed everywhere (user + his sister's call: never hitch copy to a corporation; it can decline, rebrand, or sue). Hero headline ends with one gold accent word. The hero has an "Enter the workshop" CTA + a green bouncing down-arrow that smooth-scrolls to the tool (`#workshop`) — keep it a single lightweight page, not multi-route.
- **"Stars Aligned" = honest findability + a reality check, NOT a market bet.** The teaching: you don't game/chase keywords — be honestly, publicly who you say you are (name/address/offering all match, "everything matches"), and you're simply found. The reality check: name what's actually true even if you wish it weren't (the classic example: an artist whose biggest hit is the keyword they can't escape). Do NOT frame keywords as "a bet on how you'll be found" — the user explicitly rejected that.
- **Aristotle artwork:** a gold engraving + golden-ratio spiral on near-black under attached_assets/generated_images, imported via `@assets`.
- **Dancing unicorns** are intentionally "horribly cute" (chibi). Keep them.
- **Discoverability stack (mirrors intellectualresistance.com):** the production domain is `https://seo-keyword-storyteller.replit.app` (user is keeping this one on Replit, with user feedback/messages enabled). Static SEO/LLM files live in `client/public/` (Vite copies → `dist/public`, served by `express.static` before the SPA fallback): `robots.txt`, `sitemap.xml`, `llms.txt` (short index), `llms-full.txt` (full reference), `og-card.png` (1408×768). `client/index.html` head carries full meta + one inline JSON-LD `@graph` (WebSite, WebApplication, Person, Organization, HowTo, BreadcrumbList). The Person node is the shared author identity **Carey Balboa** (ORCID 0009-0000-5237-9065; `sameAs` ties together it-help.tech, intellectualresistance.com, github IT-Help-San-Diego, dnstool, organiccomputer) — reuse this exact identity across his projects so they join one knowledge graph. Inline `application/ld+json` is a data block and is NOT blocked by the prod CSP `script-src 'self'`. If the domain ever changes, update every absolute URL in index.html + sitemap.xml + robots.txt + the llms files in lockstep.

**Why:** the user wants Apple-level polish matching their personal brand site; consistency with this concept matters more than novelty.

# Security posture

The Express security-headers middleware enforces the strict set (CSP, frame-denial, cross-origin isolation) **only in production**, while always sending the universally-safe headers. 
**Why:** the Replit dev preview frames the app in an iframe and Vite HMR needs eval/websockets — enforcing strict CSP/framing in dev breaks the workspace preview. Keep the dev/prod split when touching these headers.
