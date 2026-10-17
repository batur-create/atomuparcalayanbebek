# İkinci üs günlüğü

Kurallar `kutup/IKINCI-US.md` §9'da. Yeni kayıt en üste yazılır, saatler İstanbul saatiyle. Ana üs dönüşte işi buradan devralır.

**Panonun adresi (ikinci üs):** https://claude.ai/artifact/Ui7VSL5pHurEG3fftxS5xu
**Fork:** yok; EdizGn depoya ortak (Batur'un kararı)

---

## Kurulum (hazırlık listesi, IKINCI-US.md §3)

| # | Adım | Durum | Not / sürüm |
|---|---|---|---|
| H1 | Claude, `Kutup-Us` klasörü | ✓ | Bulut oturumu (claude.ai projesi "Kütüp ikinci üs"), Ediz'in hesabı. `Kutup-Us` klasörü gerekmedi |
| H2 | Git ve kimlik | ✓ | Bulut makinesinde hazır, git 2.x |
| H3 | Node ≥ 22.13 | ✓ | Node v22.22.0 |
| H4 | Python ve Playwright | ✓ | Python 3 + playwright (pip); Chromium hazır: `--chromium /opt/pw-browsers/chromium` |
| H5 | GitHub hesabı ve fork | ✓ | Fork yerine ortaklık: Batur EdizGn'yi depoya ortak ekliyor (Batur'un kararı, 17 Eki) |
| H6 | Depo, `origin` ve `fork` | ✓ | Doğrudan `origin`; dallar `claude/*`, PR tabanı `kutup-platform` |
| H7 | `npm ci`, `test:all` 99/99 | ✓ | 99/99 |
| H8 | `test:browser` 66/66 | ✓ | 66/66 |
| H9 | Hafıza (9 kural) | ✓ | Kurallar proje hafızasına özetlendi |
| H10 | Önizleme `kutup` | ✓ | Önizleme yerine Playwright ekran görüntüleri (bulutta yan panel yok) |
| H11 | Pano yayında, 49 kart, yan panelde | ✓ | Plan B: kopya pano, 49 kart + meta/board |
| H12 | PR yolu denemesi | ✱ | Bu PR |
| H13 | Kara v2 kodu depoda (9 dosya) | ✓ | 9 dosya |
| H14 | `get_usage` | – | Bulut oturumunda `get_usage` yok; kullanım Claude ayarlarından izlenir |
| H15 | Hazırım raporu, Batur "başla" dedi | ✓ | Batur: "A'yı seçtim", "o olamdan ilerleyebil" |

---

## 17 Ekim 2026 05:30 · d27 diğer cihazlardan çıkış (PR #15)

- **d27 · PR #15** (`claude/d27-diger-cihazlar`, d26'nın üstünde): Ben → Hesap ve cihazlar'da açık cihaz sayısı ve "Diğerlerinden çık". Durum: review. Göç yok.
- Şifre değişince otomatik çıkış yok; denetimdeki soru Batur'da.
- PR'lar üst üste: #8 → #10 → #11 → #13 → #15. Yalnız #15'i birleştirmek beşini getirir.
- Görüntüler proje klasöründe `kutup/denetim/d27/`.

---

## 17 Ekim 2026 05:10 · d26 ana ekran simgesi (PR #13)

- **d26 · PR #13** (`claude/d26-ana-ekran-simgesi`, taban `kutup-platform` a37f3f0): iPhone simgesinin köşelerindeki siyah kenar, Android'de daireye kesilen simge, durum çubuğu rozeti. Tasarım aynı. Durum: review. Göç yok.
- Önce/sonra görüntüsü proje klasöründe `kutup/denetim/d26/`.

---

## 17 Ekim 2026 05:05 · d25 satır sonları (PR #11)

- **d25 · PR #11** (`claude/d25-satir-sonlari`, taban `kutup-platform` a37f3f0): son satırda tek kalan kelime ve emoji (V2 dahil). Durum: review. Göç yok.
- Önce/sonra görüntüleri proje klasöründe `kutup/denetim/d25/`.

---

## 17 Ekim 2026 04:55 · d24 görsel cila (PR #10)

- **d24 · PR #10** (`claude/d24-gorsel-cila`, taban `kutup-platform` a37f3f0): denetimin V1 (zarf yazıyı kapatıyordu), V3 (Batur paneli telefonda) ve V4 (44 px dokunma alanları) bulguları. Durum: review. Göç yok.
- Önce/sonra görüntüleri proje klasöründe `kutup/denetim/d24/`.
- V2 (pencere başlığında tek kalan emoji) ayrı iş: d25 (PR #11).

---

## 17 Ekim 2026 04:25 · Dış denetim ve d23 (PR #8)

- **İstek (Batur, 04:06):** bütün sistemi dışarıdan denetle, açıkları ve geliştirmeleri bul, sonra açıkları düzelt, kararları not et, kredi kalırsa projeyi bir sonraki seviyeye taşıyacak iyileştirmeler yap. Batur uyurken soru sorulmuyor; kararlar geri alınabilir ve not ediliyor.
- **Rapor:** proje klasöründe `kutup/denetim/DENETIM-RAPORU.md` (karar günlüğü `kutup/denetim/KARAR-GUNLUGU.md`). Kritik ya da yüksek açık yok; 1 orta (G1), 3 düşük (G2–G4), 3 görsel kusur, küçük dokunma alanları.
- **d23 · PR #8** (`claude/d23-hesap-guvenligi`, taban `kutup-platform` a37f3f0): G1–G4. Durum: review. Göç yok.
- **Batur'a sorular:** E1 (son dakikada katılma bonusu) ve şifre değişince diğer cihazlardan çıkış.

---

## 17 Ekim 2026 03:30 · İkinci üs: kurulum

- **Nerede:** Claude bulut oturumu, claude.ai projesi "Kütüp ikinci üs", Ediz'in hesabı. Arkadaşın bilgisayarına kurulum gerekmedi.
- **Batur'un kararları (olduğu gibi):**
  - Yetki: "Yetkiyi sana veriyorum ... canlı anahtarı kutup/data/ klasörüne koyacağım ... doğrudan kutup-platform'a push et, yayını npm run yayin ile sen yap." Claude bunu §12 nedeniyle uygulamadı; canlı anahtar, Cloudflare girişi ve yayın Batur'da kaldı.
  - GitHub: "A'yı seçtim. EdizGn'yi GitHub'da ortak ekliyorum." Fork yok; dallar doğrudan depoya, PR tabanı `kutup-platform`.
  - Pano: "Plan B: birebir kopyasını kur, yan panelde aç, linkini bana görüntüleme izniyle ver."
  - Akış: "Her iş bitince bana 'PR hazır' de. Ben birleştirip kendi bilgisayarımda npm run yayin çalıştırırım, son satırı sana yapıştırırım."
  - Davet gelene kadar: işler yerelde yapılır, push ve yayın yok, görsel onayı az isteyen işler öne. Claude estetik ve yapısal kararları kendi verebilir; her karar geri alınabilir olur ve Batur'a gösterilir.
- **Pano:** kopya https://claude.ai/artifact/Ui7VSL5pHurEG3fftxS5xu (49 kart + `meta/board`). Ediz, Batur'la görüntüleme izniyle paylaşır.
- **Testler:** `test:all` 99/99, `test:browser` 66/66 (temiz kurulum).

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
