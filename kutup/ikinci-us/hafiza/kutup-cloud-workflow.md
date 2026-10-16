---
name: kutup-cloud-workflow
description: "Batur (16 Oct 2026) wants Kütüp work done by Claude cloud sessions; the local session only reviews PRs, merges, deploys, smoke-tests and records"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 27781df9-437c-4f81-8167-5ecf60882eda
  modified: 2026-10-16T23:33:22.007Z
---

Batur, 16 Oct 2026: "aga cloud sessiona yaptıralım işleri deneyelim sen sadece yayınla". He has a separate pool of cloud session credits ($100, expiring 5 Nov 2026) while his weekly local limit was at ~82%.

**Why:** Saves the local weekly budget; cloud sessions run in parallel. They cannot deploy: the Cloudflare login, live D1 and the owner key exist only on his Windows machine.

**How to apply:**
- Start each package as a cloud session (`start_session`, target "cloud", "fresh"). The brief must say:
  - Branch from `origin/kutup-platform` (the cloud default is `main`), into its own `claude/...` branch.
  - Never push `main` or `kutup-platform`, never deploy, never touch `kutup/data/` or the live DB.
  - Open a PR into `kutup-platform`; measure on a slow phone; report in Turkish.
- Locally:
  - review the diff;
  - `git merge --ff-only` and push;
  - run `npm run test:all` and the browser smoke;
  - `npm run deploy` and the live smoke;
  - write KARARLAR, DESIGN §9, HANDOFF and the board.
- No note arrives when a cloud session finishes; Batur pastes its report ("PR hazır").
- The cloud session may push to its own assigned branch (n25 used `claude/exciting-fermat-13p5ta`, not the briefed name): `git fetch` and look at `git branch -r`.
- If `kutup-platform` moved since the PR's base, merge with `git merge --no-ff` (a merge commit). GitHub then marks the PR merged; a rebase would not.
- `gh` is not logged in here; read PR state through the public API with `curl https://api.github.com/repos/batur-create/atomuparcalayanbebek/pulls/<n>`.
- Before a migration, the owner backup (`/api/owner/backup`) leaves out sessions and subscriptions on purpose; the live smoke's "push: members N/N bound" line shows whether subscriptions survived.
- Never run two writers on the same files at once.
- Runs so far: PR #1 (n26 part 2), #2 (n27), #3 (n23), #4 (n25). Credit after n25: ~$13, not enough for another package.
- ChatGPT (Batur's other tool) writes to `C:\Users\İzzettin\.codex\.chatgpt-projects\g-p-6a5736b1cb708191ae5fed4be0c55a93\output\` (Kara v2 is in `kara\v2` and `kara\Kara-v2.zip`).

- **Second base, 17–22 Oct 2026:** Batur's weekly limit was at 94%, so work moved to his friend's machine and the friend's own Claude account (fork + PR into `kutup-platform`; guide `kutup/IKINCI-US.md`, commit c65d1a7d). Batur merges on GitHub and deploys by hand (`scripts/owner-backup.mjs` before migrations). When he is back, sync the board from those PR descriptions. Do not suggest sharing or taking over someone else's account: Anthropic's terms forbid it.

Visual approvals still go through Batur first; see [[kutup-ask-before-visuals]] and [[kutup-work-mode]].
