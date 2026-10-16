# İkinci üs günlüğü

Kurallar `kutup/IKINCI-US.md` §9'da. Yeni kayıt en üste yazılır, saatler İstanbul saatiyle. Ana üs dönüşte işi buradan devralır.

**Panonun adresi (ikinci üs):** _H11'de yaz_
**Fork:** _H5'te yaz_

---

## Kurulum (hazırlık listesi, IKINCI-US.md §3)

| # | Adım | Durum | Not / sürüm |
|---|---|---|---|
| H1 | Claude, `Kutup-Us` klasörü | ☐ | |
| H2 | Git ve kimlik | ☐ | |
| H3 | Node ≥ 22.13 | ☐ | |
| H4 | Python ve Playwright | ☐ | |
| H5 | GitHub hesabı ve fork | ☐ | |
| H6 | Depo, `origin` ve `fork` | ☐ | |
| H7 | `npm ci`, `test:all` 99/99 | ☐ | |
| H8 | `test:browser` 66/66 | ☐ | |
| H9 | Hafıza (9 kural) | ☐ | |
| H10 | Önizleme `kutup` | ☐ | |
| H11 | Pano yayında, 49 kart, yan panelde | ☐ | |
| H12 | PR yolu denemesi | ☐ | |
| H13 | Kara v2 paketi `gelen/kara-v2/` | ☐ | |
| H14 | `get_usage` | ☐ | |
| H15 | Hazırım raporu, Batur "başla" dedi | ☐ | |

---

## 17 Ekim 2026 03:00 · Ana üs: devir hazırlığı

- **Neden:** Batur'un Claude'unun haftalık sınırı %94 doluydu ve 22 Ekim 01:00'de sıfırlanacak. Bu sürede iş arkadaşının bilgisayarına, arkadaşın kendi Claude hesabına geçti. Batur'un sözleri: "senle nasıl çalışıyorsam BİREBİR AYNISINI istiyom" ve "her şey smooth gitsin ve smooth geri dönsün".
- **Son yayın:** d22 ve n25, Worker 812f7ef9. `kutup-platform` en son belge commit'inde.
- **Hazırlanan:**
  - `IKINCI-US.md`: rehber ve hazırlık listesi.
  - `ikinci-us/pano.html`: panonun kodu.
  - `ikinci-us/pano-veri/`: 49 kart ve `meta/board`.
  - `ikinci-us/hafiza/`: ana üsün hafızası.
  - `scripts/owner-backup.mjs`: Batur'un göç öncesi yedeği.
- **Pano:** Batur'un panosuna n31 (Kara v2) kartı eklendi. Not ikinci üsü anlatıyor (`meta/board` sürüm 37).
- **Sıradaki:** n31 Kara v2 → n24 → n28 → n29 → n30 → n14.
- **Açık:** iki hesaplı bildirim gerçek iPhone ve Android'de denenmedi (n25). iOS 26'daki menü adları kontrol edilmedi.
