---
name: kutup-ios-first
description: "Most of Batur's friends (Bensu, Zeynep, Sıla) use iPhones — every Kütüp design must work on iOS Safari and as a home-screen PWA, with guide-style help"
metadata:
  node_type: memory
  type: project
  originSessionId: 09074af8-0214-4871-90ea-01f3cf090c56
  modified: 2026-10-15T16:34:04.149Z
---

15 Oct 2026: Batur learned that Bensu, Zeynep and Sıla all use iPhones, and asked that designs always suit Apple from now on, with guide-like help for them.

**Why:** On iOS, web push only works when Kütüp is added to the Home Screen and opened from there; element fullscreen is not available on iPhone; wake lock and background behaviour differ. Notifications "not arriving" for them was most likely this.
**How to apply:** For every feature check iOS Safari and standalone PWA: no reliance on the Fullscreen API (hide its button on iOS), safe-area insets, no hover-only controls, tap targets ≥ 44px, step-by-step "Paylaş → Ana Ekrana Ekle" guidance where push matters, test with an iPhone-sized viewport and touch. See [[kutup-work-mode]].
