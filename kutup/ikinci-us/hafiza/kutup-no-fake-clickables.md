---
name: kutup-no-fake-clickables
description: "Batur hates UI that looks tappable but does nothing (team name, library card, top-left \"kütüp\"); everything that looks clickable must act, or must not look clickable"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 27781df9-437c-4f81-8167-5ecf60882eda
  modified: 2026-10-16T12:07:29.391Z
---

Batur said (16 Oct 2026): "basınca bir şey olacakmış gibi duran ama hiçbir şey olmayan tuşlar, yazılar görünce rahatsız oluyorum." Examples he hit: the side bar's team name, the "Milli Kütüphane ↗" card, the top-left "kütüp" on his Android phone (also "fazla sade").

**Why:** It breaks trust in the interface; he taps around a lot while exploring.

**How to apply:** Every card, chip, arrow or label that looks tappable gets a real, useful action (open the thing it names, give directions, scroll home); otherwise remove the affordance (no arrow, no hover, no card look). Check this in every visual package and in reviews. Also in kutup/DESIGN.md §1. See [[kutup-ask-before-visuals]].
