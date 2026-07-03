---
name: Ethos/pathos/logos statistical tracking (planned direction)
description: User wants to go beyond live meters and study the three appeals statistically.
---

# Direction the user wants to pursue

The user wants to "really dive into ethos, pathos, and logos statistically" — beyond the current live per-story appeal meters (rule-based, client-side in `story-coach.ts`). Think: measuring how the three appeals distribute across many 160-char stories, proving the claim that all three fit in one SEO meta description, possibly scoring/aggregating.

**User has confirmed the acceptable shape (July 2026):** anonymous aggregate counters are fine — e.g. "how many stories lit pathos", "how many made the unicorns dance", "how many hit all three appeals" — as long as we never know who anyone is. No stories, no identifiers, no cookies; just event tallies.

**Feasible design (agreed direction, not yet built):** the coach already computes arc + appeals client-side, so the browser can send a tiny anonymous event (booleans/levels only, never text) like `{allThreeAppeals: true, unicorns: true}`; the server only increments counters. The trust section must be updated in the same change to disclose the anonymous tallies — never let the page overclaim (see privacy-architecture.md).

Status: confirmed possible and welcomed by user; nothing built yet.
