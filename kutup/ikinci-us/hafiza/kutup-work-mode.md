---
name: kutup-work-mode
description: "Batur wants Kütüp work done back-to-back without asking for \"continue\"; use credits fully; save to disk then offer a ready /compact line per package; new sessions only for unrelated work, with full briefs"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 09074af8-0214-4871-90ea-01f3cf090c56
  modified: 2026-10-16T06:43:55.043Z
---

Batur (Kütüp app, handoff in kutup-platform/kutup/HANDOFF.md) wants the work packages done one after another without waiting for a "devam" prompt; only ask when a decision is truly his. Check plan usage (mcp__ccd_session_mgmt__get_usage) now and then.

**Why:** He doesn't want to babysit the session or leave credits unused, but also doesn't want work cut off half-done when credits run out.

**How to apply:** Keep going (test → deploy → smoke test → commit/push → short Turkish summary), in small parts. On 14 Oct 2026 he raised the stop threshold explicitly, first to 99% and then "push through 100%": use the credits fully, never stop early on usage alone. Because the cut-off can come at any moment, commit (and push) after every small part and keep HANDOFF.md's "where I stopped" note current, so a hard cut-off never loses work.

**Same session + /compact, not a fresh session per package (16 Oct 2026, replaces the 15 Oct rule):** Long sessions were the main credit drain (median ~420k context tokens re-read per message, ~75% of spend), but fresh sessions lost taste and context: the n13 avatars were drawn without looking at the site and rejected, and a handoff session wrote "I don't know the details of n16" and sent a thin brief anyway. Batur chose this system:
- **Package done →** first save everything to disk (KARARLAR.md entry, board `done` + `decisions`, DESIGN.md §9 line for visual decisions, HANDOFF 6b, commit + push), then give Batur a ready line in a code block to paste, written for this moment: `/compact Koru: <decisions and why, Batur's feedback in his words, current state, the next task's spec and open questions, work rules>. At: <tool output, test logs, file contents, screenshots, abandoned attempts — all on disk>.` Also suggest it mid-package when the chat has grown long (after an interim save). You cannot run /compact yourself; buttons cannot start with "/".
- **New session only for unrelated or parallel work.** The brief is written by the session that knows the task. If you don't know it, first read the board `spec`, KARARLAR.md and the transcript where it was discussed (search_session_transcripts); if still thin, the brief says "first ask Batur", never a guessed brief. Brief sections: Amaç · Batur'un sözleri (quoted) · Kararlaşan · Açık sorular · Ekranlar · Yöntem (visual → previews first) · Bitti ölçütü · what to record at the end.
- **Every Kütüp session starts by** opening the work board in the side panel (Artifact `open` https://claude.ai/artifact/Rm7oZuLi3ZjgqTn935kUVX), then HANDOFF.md (§0 has the reading order), DESIGN.md for visual work, only the KARARLAR.md index plus the entries for the task's code.
- **Browsers:** the side-pane browser is fine for looking (resize to mobile 375 px); its screenshots can come out mis-scaled, so images shown to Batur come from the Playwright script in HANDOFF ("Net ekran görüntüsü"). The old long sessions used a Playwright window; quality came from context, not the browser.
