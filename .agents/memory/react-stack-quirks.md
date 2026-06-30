---
name: React/TS stack quirks in Storyliner
description: Non-obvious build/runtime gotchas that have caused repeated loops.
---

# The `fetchpriority` image hint cannot be expressed cleanly — omit it

On the hero `<img>` there is no spelling of the resource-priority hint that satisfies both the type-checker and the runtime in this stack:
- lowercase `fetchpriority="high"` → **tsc error** (`@types/react` 18.3 only knows the camelCase prop, "Did you mean 'fetchPriority'?").
- camelCase `fetchPriority="high"` → tsc passes but the **react-dom runtime logs a console warning** ("React does not recognize the `fetchPriority` prop … spell it as lowercase").

**Resolution:** just remove the attribute. It is a non-essential perf hint; dropping it keeps `tsc --noEmit` clean AND the browser console warning-free. Do NOT re-add it.

# Map/iterator spreads need `Array.from`

`tsconfig.json` sets no `target`, so spreading or `for…of`-ing a `Map`/iterator (e.g. `[...map.entries()]`, `for (const x of map)`) trips TS2802 (downlevelIteration). Wrap in `Array.from(...)`. The app still *runs* (tsx/esbuild ignore this), but it fails `tsc --noEmit`.

# HMR can emit transient "Invalid hook call" warnings

During a Fast-Refresh hot update you may briefly see "Invalid hook call … at img/div" in the console. These are HMR transients — they clear on a full page reload. Confirm against a fresh load before chasing them as real bugs.
