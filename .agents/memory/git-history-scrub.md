---
name: Git history scrub operations
description: How the private-transcript scrub was done; main-agent git limits; recovery and GitHub-side purge steps
---

# Git history scrub operations

**Rule:** The main agent is hard-blocked from ALL git ref writes in this workspace — `git branch`, `git rm`, even `rm` of files inside `.git/` are intercepted (the blocker leaves `.lock` files containing the error text; a later git call then fails on "lock exists", which looks like a different error but isn't).

**Why:** Platform safety wall. Re-assigning a project task to the main agent does NOT lift it. In this workspace the user also had no UI to launch background task agents, so delegation was impossible.

**How to apply:** For history rewrites (or any destructive git op), give the user exact commands to run themselves in the workspace **Shell** — user-run commands are not blocked. Read-only git (`log`, `show`, `ls-files`, `for-each-ref`) works fine for the agent; use it to verify.

Other durable lessons from the July 2026 transcript scrub:
- `git filter-branch` leaves `refs/original/*` backups; files purged from history can be recovered by the agent with read-only `git show <backup-ref>:<path> > file` (this is how the Aristotle artwork was restored after the whole `attached_assets` dir was purged).
- Deleting a folder via GitHub's web UI only removes it from the tip — history stays browsable. A real scrub = local rewrite + force push + delete stale branches on GitHub (dependabot branches carry old history) + GitHub Support request to purge unreachable/cached commits.
- `attached_assets/` is now gitignored except `attached_assets/generated_images/` (build imports `aristotle_engraving.webp`). Chat attachments/pastes land in `attached_assets` — before the ignore rule, a private call transcript rode along to the public repo. Never weaken this ignore rule.
- Gitignore idiom used: `attached_assets/*` + `!attached_assets/generated_images` — re-including the dir works; files inside are not matched by `attached_assets/*` (single `*` doesn't cross `/`).
