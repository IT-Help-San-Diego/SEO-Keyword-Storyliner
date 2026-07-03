---
name: AI coach prompt doctrine
description: How the /api/ai/coach system prompt must be written so a weak free model behaves honestly
---

# Weak models need recipes, not principles
The rule: brief the coach model with an explicit checklist + a DEFAULT SHAPE slot formula ([who, their words] + [what they do, THEIR nouns] + [where] + [turn] + [payoff]), not philosophy alone.
**Why:** philosophy-only prompts produced fabricated credentials ("certified techs, 10+ years") and category drift; checklist + formula fixed both in live tests.
**How to apply:** any new instruction to the coach model must be phrased as a numbered requirement with an example, not a value statement.

# Anti-fabrication
The model may use ONLY facts in the user's story/keywords; missing evidence becomes bracketed placeholders ("[X] years") plus a tip naming the fact to fill in. "An honest blank beats a confident lie."

# Category fidelity
Word choice IS market positioning (repair ≠ IT help ≠ managed services). The rewrite reuses the story's own category nouns; a supplied keyword that names a different category is left out and flagged in a neutral tip quoting both words — never rank tiers or judge "down-market" (the model can't verify market facts; epistemic-clean rule).
**Why:** live failure — "IT help" story got rewritten as "expert repair," repositioning the owner down-market.

# De-risk lever
If the model drifts from the rules again, drop temperature (0.7 → ~0.4) for more literal instruction-following BEFORE adding more prompt text.

# Naming doctrine
The AI feature is co-labeled "AI rewrite · data sampling"; result box "The silicon version · a data sample". Doctrine taught in disclosure: honest AI use = running your own data through a different machine and cross-checking — never outsourcing thinking. Disclosure claims must stay literally true to what the prompt enforces.
