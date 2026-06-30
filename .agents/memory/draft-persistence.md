---
name: Draft persistence (localStorage)
description: How/why the brand-story draft persists in the browser and the rules that keep it from clobbering real work.
---

# Draft persistence

The working draft (story + 8 keyword slots) is autosaved to `localStorage` (versioned key) and rehydrated on mount, since there are no user accounts. Autosave is debounced.

**Rule: autosave is paused while the "perfect example" is loaded (`exampleLoaded`).**
**Why:** loading the example replaces the editor contents; if we persisted that, a reload would resurface the example and bury the user's own words. Pausing keeps the user's last real draft intact in storage, so a reload-while-example restores their words (the example is one click to reload). In-session, `handleReset` ("Clear example") restores the pre-example draft from a ref.
**How to apply:** any new flow that programmatically replaces editor contents with non-user text (templates, AI fills you don't want auto-kept) should follow the same pause-or-snapshot pattern before writing to storage.

**Rule: the "saved on this device" status must reflect the real write result.**
**Why:** this project's whole thesis is epistemic honesty — the trust cue must not claim "saved" when `localStorage` write actually failed (quota/private mode). `saveDraft` returns a boolean; status only goes to "saved" on a true write.
