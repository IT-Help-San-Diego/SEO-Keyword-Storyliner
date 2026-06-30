---
name: Story Coach honesty rules
description: Epistemic-honesty constraints for Storyliner's rule-based Story Coach analyzer.
---

The Story Coach must "show its work": every signal it reports has to cite the
concrete word/phrase that triggered it, or honestly say "no signal yet".

**Lexicon matching must be boundary-aware, never substring.**
**Why:** plain `string.includes(word)` produced false evidence — `care` matched
inside `career`, `rate` inside `separate` — so the UI cited rhetorical signals
that weren't there. That is the exact opposite of the "shows its work" goal.
**How to apply:** match each lexicon entry on word/phrase boundaries
(`(?:^|[^A-Za-z0-9])word(?:[^A-Za-z0-9]|$)`). Use exact boundaries for the
ethos/pathos/logos appeal signals; a light inflection set (`s|es|ed|ing|d|r`)
is OK for hook/payoff action verbs but must still reject unrelated words
(`win`≠`winter`, `free`≠`freezer`). Verify with the Don McLean golden example
(all 3 arc beats present) plus the career/separate false-positive cases.

**Other honesty rules:** appeals report a discrete level 0..3 with a plain "why"
(no fake-precise percentages); the "craft signal" number is framed as a rough
guide, not a grade; the coach gently flags repetition (keyword stuffing) rather
than rewarding more keyword matches. Anti-stuffing repetition threshold is ≥4 so
the curated perfect example (which reuses "American" across distinct proper
names) isn't falsely flagged.
