---
name: Ethos/pathos/logos statistical tracking (planned direction)
description: User wants to go beyond live meters and study the three appeals statistically.
---

# Direction the user wants to pursue

The user wants to "really dive into ethos, pathos, and logos statistically" — beyond the current live per-story appeal meters (rule-based, client-side in `story-coach.ts`). Think: measuring how the three appeals distribute across many 160-char stories, proving the claim that all three fit in one SEO meta description, possibly scoring/aggregating.

**Constraint that shapes any design:** the privacy-architecture promise (see privacy-architecture.md) — the server stores nothing. Any statistics must be client-side, opt-in, or aggregate-anonymous by explicit user decision; don't quietly start collecting stories to analyze them.

Status: idea only — nothing built yet. Raise it when the user returns to the topic.
