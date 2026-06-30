---
name: Storyliner visual identity
description: The locked-in design language for Storyliner and why it's shaped this way.
---

# Storyliner aesthetic — "intellectual engraving"

Premium, intellectual aesthetic modeled on the user's reference site intellectualresistance.com. Treat this as the established design language — deepen it, don't reinvent it.

- **Palette:** warm near-black background + muted gold accent. Light mode is a warm classical parchment with deeper gold ink. Green is reserved for the success/celebration payoff; gold marks matched/working states.
- **Type:** a grotesk display face for headings (via the `.font-display` utility), a neutral sans for body, and a mono face for uppercase letter-spaced eyebrow/labels. Fonts are loaded in client/index.html.
- **Default theme is dark**; the light toggle still works.
- **Concept/copy:** brand story as a foundation built on "2,500 years of logic" (Aristotle), framed like Disney's storytelling formula. Hero headline ends with one gold accent word. The hero has an "Enter the workshop" CTA + a green bouncing down-arrow that smooth-scrolls to the tool (`#workshop`) — keep it a single lightweight page, not multi-route.
- **"Stars Aligned" = honest findability + a reality check, NOT a market bet.** The teaching: you don't game/chase keywords — be honestly, publicly who you say you are (name/address/offering all match, "everything matches"), and you're simply found. The reality check: name what's actually true even if you wish it weren't (the classic example: an artist whose biggest hit is the keyword they can't escape). Do NOT frame keywords as "a bet on how you'll be found" — the user explicitly rejected that.
- **Aristotle artwork:** a gold engraving + golden-ratio spiral on near-black under attached_assets/generated_images, imported via `@assets`.
- **Dancing unicorns** are intentionally "horribly cute" (chibi). Keep them.

**Why:** the user wants Apple-level polish matching their personal brand site; consistency with this concept matters more than novelty.

# Security posture

The Express security-headers middleware enforces the strict set (CSP, frame-denial, cross-origin isolation) **only in production**, while always sending the universally-safe headers. 
**Why:** the Replit dev preview frames the app in an iframe and Vite HMR needs eval/websockets — enforcing strict CSP/framing in dev breaks the workspace preview. Keep the dev/prod split when touching these headers.
