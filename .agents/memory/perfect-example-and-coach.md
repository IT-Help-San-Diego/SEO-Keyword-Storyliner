---
name: Perfect example must embody ethos/pathos/logos; coach detection heuristics
description: Constraints the Don McLean "perfect example" must satisfy, and how the rule-based Story Coach scores appeals.
---

# The "perfect example" must demonstrate all three appeals — and stay honest

The one-click "See a perfect example" (Don McLean meta description) is meant to *teach*, so it must visibly light up **ethos, pathos, AND logos** in the Story Coach, while staying truthful and within 160 chars and weaving in ≥4 keywords.

**Why:** the user explicitly wants the example to model the rhetoric, not just fill slots. An example that scores 0 on the appeals undermines the whole tool.

**How the coach detects appeals (rule-based, `client/src/lib/story-coach.ts`):**
- ethos / pathos / logos are scored by **substring** keyword-list hits (case-insensitive `includes`), so "loved" satisfies pathos via "love", "since" satisfies ethos.
- **Any digit (or %) grants logos +2** even with no logos keyword — so a year like "1971" is enough to register logos.
- Each appeal is `clampScore(hits, 3)` → 3 hits = 100%.

**Location is optional in the "what" anchor.** Don McLean is a global/personal brand and must NOT reveal a city. The anchor guidance says add a place only if you're *local*; global/personal brands skip the "where". Keep the example location-free.
