---
name: Privacy by architecture
description: Storyliner's trust promise — no server storage of user stories — and the invariants any new code must keep.
---

# The promise (user's explicit trust strategy)

The page carries a "Trust · Private by architecture" section whose claims must stay literally true: no cookies, no accounts, no analytics, no server-side database of stories; drafts persist only in the visitor's localStorage; "Related words" passes the draft through the server transiently (Datamuse sees seed words only); AI rewrite sends the story to the AI provider only on explicit click.

**Why:** the user's positioning is radical transparency ("we need them to trust us") — a brand story is sensitive pre-launch (unregistered names, unannounced positioning; "trademark spies"). Epistemic cleanliness applies to the app itself: the disclosure must match the code, or the code must change.

**How to apply (invariants for any future change):**
- Do NOT reintroduce story-persisting endpoints. The old `POST/GET /api/stories` + Save button were deliberately removed (GET returned *everyone's* stories to anyone — a real leak vector). Saving = localStorage only.
- The request logger in `server/index.ts` excludes response bodies for routes carrying user words (`/api/ai/coach`, `/api/suggest`). Any new content-bearing route must be added to that exclusion.
- No cookies/sessions: SESSION_SECRET exists but is intentionally unused. Don't add express-session/analytics without revising the trust section first.
- If a feature ever requires storage, the trust section must be rewritten in the same change — never let the page overclaim.
