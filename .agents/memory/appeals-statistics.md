---
name: Ethos/pathos/logos statistical tracking (planned direction)
description: User wants to go beyond live meters and study the three appeals statistically.
---

# Direction the user wants to pursue

The user wants to "really dive into ethos, pathos, and logos statistically" — beyond the current live per-story appeal meters (rule-based, client-side in `story-coach.ts`). Think: measuring how the three appeals distribute across many 160-char stories, proving the claim that all three fit in one SEO meta description, possibly scoring/aggregating.

**Built and live:** anonymous turnstile counters exist — a counts-only table (`stat_counters`) tallies milestones (stories coached, each appeal lit, all three lit, unicorns danced). Events are booleans computed client-side, sent at most once per browser session, never while the perfect example is loaded (would pollute the data). The tally is displayed in the trust section and disclosed there ("We count milestones, never people").

**Invariants when extending the statistics:** counts only — no words, no identifiers ever persisted; wording about IPs must stay exact (they pass transiently through the in-memory rate limiter, never disk); any new metric must be disclosed in the trust section in the same change (see privacy-architecture.md). Known accepted limitation: the unauthenticated counter endpoint can be inflated by a determined scripter — rate limiting reduces but doesn't eliminate skew; keep claims about the tally modest.
