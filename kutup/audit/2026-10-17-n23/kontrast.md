# n23 · Tema revizyonu: kontrast

Tarih: 17 Ekim 2026 · 2. aşama (Batur altı paketi onayladı)

## Sonuç

- **Jetonlar:** 6 tema × açık/koyu × 21 çift = **252 çiftin hepsi geçiyor**.
- **Ana ekranlar** (ana sayfa, Köy, Pano, Ben, Görünüm penceresi): 6 temanın hepsinde, açık ve koyu modda **4.5:1'in altında normal boy yazı kalmadı**. n23 öncesi Lavanta açık modda 247 yazının 130'u eşiğin altındaydı.
- **Diğer ekran ve pencereler** (giriş, davet, katalog, tuğla kasası, ortak anıt, haftanın tablosu, odak ekranı, istatistik, ekip kartı, profil, hesap, arkadaş davet, Batur'a ilet, plan): 14 sahne × 6 tema × 2 mod = 168 sahnede **3060 yazının hiçbiri** eşiğin altında değil.

## Ekran denetimi: önce ve sonra

Eşiğin altında kalan normal boy yazı / ölçülen yazı (5 ana ekranın toplamı, 375 px). Büyük yazı (24 px ya da 18.66 px kalın) için eşik 3:1.

| Tema | 1. aşama, açık | 1. aşama, koyu | 2. aşama, açık | 2. aşama, koyu |
|---|---|---|---|---|
| Lavanta, n23 öncesi | 130 / 244 | 18 / 244 | | |
| Lavanta | 129 / 247 | 9 / 247 | **0** / 248 | **0** / 248 |
| Lacivert | 124 / 247 | 9 / 247 | **0** / 248 | **0** / 248 |
| Petrol | 124 / 247 | 8 / 247 | **0** / 248 | **0** / 248 |
| Kiremit | 124 / 247 | 8 / 247 | **0** / 248 | **0** / 248 |
| Gül | 124 / 247 | 9 / 247 | **0** / 248 | **0** / 248 |
| Grafit | 125 / 247 | 9 / 247 | **0** / 248 | **0** / 248 |

## 2. aşamada ne değişti

- **Soluk yazının tabanı (`scripts/theme-css.js`):** Nötr bir yazı rengi artık `--muted`'dan daha soluk (koyu modda daha koyu) olamıyor. `--muted` her temada kâğıt, zemin, vurgu zemini, kahraman alanı ve çizgi tonu üstünde en az 4.5:1. Sıcak sepya griler (doygunluk ≤ 0.05) de bu tabana dahil. Koyu derlemenin dokunmadığı açık gri yazılar da `--muted`'a bağlandı. Koyu tasarımlı alanlar (stüdyo kartı, gece gökyüzü) ve kendi açık zemini olan çipler bu kuralın dışında.
- **`--muted` açık modda bir tık koyu:** her temada L ≈ 0.54 → 0.50 (Lavanta `#6f7169` → `#64665e`). Koyu moddaki `--muted` zaten geçiyordu, değişmedi. Stüdyo kartındaki en soluk yazı (`--studio-faint`) bir tık açıldı; artık stüdyodaki düğmelerin üstünde de 4.5:1.
- **Tek tek düzeltmeler:**
  - Durum çipleri (Kütüpte, Yolda, Molada) aynı renkte, bir adım koyu.
  - Kahve kartı ve "Bu haftanın yapısı" etiketi koyulaştı; kalbi atılmış mesaj daha koyu pembe.
  - Pano baloncuklarındaki yazı yarı saydam mürekkep oldu: her üye renginde, açık ve koyu modda okunuyor.
  - Gökyüzündeki küçük başlık temanın mürekkebinden türüyor.
  - "Ekipten ayrıl" gibi silme eylemleri için ortak bir kırmızı jeton (`--danger`) eklendi: açıkta `#ad4239`, koyuda `#f08b7f`.
- **Eski tema kalıntıları:** sabit lila ve leylak renkler temaya bağlandı.
  - Batur'a ilet sayfası, seçili istek türü.
  - Seçim rengi, birincil düğme gölgesi, masaüstü menü işareti.
  - Köy haritası düğmeleri, ses kutucukları, hesap metinleri.
  - Stüdyodaki ritim ve çay notları.
  - Giriş ekranının gökyüzü vurgusu, gece gökyüzündeki duvar, kütüphane, patika, bulut ve kapı.

  Bilerek kalanlar: kara delik bileşenleri (kendi moru), nadir yapıların moru, iPhone rehberindeki uygulama simgesi, köydeki çatı renklerinden biri, üyelerin "Lavanta" rengi.

## Yavaş telefonda tema geçişi

375 px, DPR 3, dokunmatik, 4× yavaşlatılmış işlemci, üretim derlemesi; her satır 18 geçiş (6 tema × 3 tur). Süre, dokunuştan (ya da `data-theme`'in değişmesinden) yeni temayı gösteren kareye kadar ölçüldü. Ham veri: [perf.json](perf.json).

| Geçiş | n23 öncesi (yalnız vurgu) | n23 paketleri | En uzun görev |
|---|---|---|---|
| Görünüm penceresinde dokunuş, açık | 67 ms (p95 101) | 80 ms (p95 123) | 90 ms |
| Görünüm penceresinde dokunuş, koyu | 81 ms (p95 114) | 93 ms (p95 139) | 100 ms |
| Ana sayfa, açık | 86 ms (p95 129) | 90 ms (p95 121) | 118 ms |
| Ana sayfa, koyu | 117 ms (p95 186) | 131 ms (p95 207) | 198 ms |
| Köy, açık | 48 ms (p95 89) | 64 ms (p95 108) | 103 ms |
| Köy, koyu | 80 ms (p95 106) | 84 ms (p95 127) | 117 ms |

Geçişten sonraki kareler 16.7 ms (60 fps). Kapsamlı tema, eski "yalnız vurgu" geçişine medyanda 5–16 ms ekliyor. Sürenin çoğu, iki durumda da React'in sayfayı yeniden çizmesi.

## Nasıl ölçüldü

- **Jetonlar:** `node scripts/theme-check.mjs` (`--md <dosya>` ile aşağıdaki tabloyu yazar). `src/themes.css`'teki her temanın açık ve koyu jetonlarını okur ve WCAG 2 kontrast oranını hesaplar. Yazı için en az **4.5:1**, arayüz parçası için en az **3:1**. Bir çift kalırsa çıkış kodu 1 olur; `tests/client.test.js` de aynı denetimi koşar.
- **Ekran:** Playwright ile gerçek uygulama, 375 px, 6 kişilik uydurma ekip. Her görünür yazının rengi, arkasındaki gerçek zemine karşı ölçüldü (yarı saydam katmanlar üst üste bindirildi, renkler tarayıcıda RGB'ye çevrildi). Degrade zeminli öğeler bu sayıma girmedi (gökyüzü kartı, üye kartlarının degradesi); gökyüzü yazısının rengi jetondan türüyor ve gözle denetlendi. `aria-hidden` süsler de sayılmadı.
- **Araçlar:** Depodaki OKLCH matematiği (`scripts/dark-css.js`) ve bu betik. Çalışma anına bağımlılık eklenmedi.

## Jeton tablosu

### Lavanta (`lilac`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 12.96 ✔ | 13.12 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 11.98 ✔ | 14.65 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.78 ✔ | 6.43 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 5.34 ✔ | 7.17 ✔ |
| Soluk yazı / vurgu zemini | `muted` / `accent-soft` | 4.5:1 | 4.98 ✔ | 5.68 ✔ |
| Soluk yazı / kahraman alanı | `muted` / `hero` | 4.5:1 | 4.65 ✔ | 5.77 ✔ |
| Soluk yazı / çizgi tonu | `muted` / `border` | 4.5:1 | 4.70 ✔ | 4.74 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.43 ✔ | 11.77 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 5.82 ✔ | 7.72 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 4.81 ✔ | 5.02 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 4.85 ✔ | 5.78 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 10.43 ✔ | 10.43 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.14 ✔ | 7.14 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.99 ✔ | 5.99 ✔ |
| Stüdyo soluk / stüdyo düğmesi | `studio-faint` / `studio+8%` | 4.5:1 | 4.67 ✔ | 4.67 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 11.04 ✔ | 11.04 ✔ |
| Pop üstü ikincil / pop | `pop-ink-soft` / `pop` | 4.5:1 | 5.92 ✔ | 5.92 ✔ |
| Uyarı yazısı / kart | `danger` / `paper` | 4.5:1 | 5.76 ✔ | 6.55 ✔ |
| Uyarı yazısı / zemin | `danger` / `canvas` | 4.5:1 | 5.32 ✔ | 7.32 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 4.44 ✔ | 5.61 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 9.29 ✔ | 9.29 ✔ |

### Lacivert (`navy`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.51 ✔ | 13.23 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.21 ✔ | 14.87 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.89 ✔ | 6.57 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 5.32 ✔ | 7.39 ✔ |
| Soluk yazı / vurgu zemini | `muted` / `accent-soft` | 4.5:1 | 5.05 ✔ | 5.62 ✔ |
| Soluk yazı / kahraman alanı | `muted` / `hero` | 4.5:1 | 4.65 ✔ | 5.70 ✔ |
| Soluk yazı / çizgi tonu | `muted` / `border` | 4.5:1 | 4.63 ✔ | 4.94 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.66 ✔ | 11.48 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 9.75 ✔ | 9.22 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 8.12 ✔ | 6.41 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 8.26 ✔ | 7.28 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 12.61 ✔ | 10.90 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 8.09 ✔ | 6.99 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 6.80 ✔ | 5.87 ✔ |
| Stüdyo soluk / stüdyo düğmesi | `studio-faint` / `studio+8%` | 4.5:1 | 5.32 ✔ | 4.61 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 9.54 ✔ | 9.54 ✔ |
| Pop üstü ikincil / pop | `pop-ink-soft` / `pop` | 4.5:1 | 5.55 ✔ | 5.55 ✔ |
| Uyarı yazısı / kart | `danger` / `paper` | 4.5:1 | 5.71 ✔ | 6.64 ✔ |
| Uyarı yazısı / zemin | `danger` / `canvas` | 4.5:1 | 5.16 ✔ | 7.46 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 7.34 ✔ | 7.21 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 9.23 ✔ | 7.97 ✔ |

### Petrol (`teal`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.26 ✔ | 13.21 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.04 ✔ | 14.83 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.98 ✔ | 6.58 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 5.44 ✔ | 7.39 ✔ |
| Soluk yazı / vurgu zemini | `muted` / `accent-soft` | 4.5:1 | 5.17 ✔ | 5.55 ✔ |
| Soluk yazı / kahraman alanı | `muted` / `hero` | 4.5:1 | 4.69 ✔ | 5.39 ✔ |
| Soluk yazı / çizgi tonu | `muted` / `border` | 4.5:1 | 4.72 ✔ | 4.90 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.39 ✔ | 10.82 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 7.28 ✔ | 9.20 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 5.67 ✔ | 6.62 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 5.76 ✔ | 7.47 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 11.49 ✔ | 11.49 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.41 ✔ | 7.41 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.85 ✔ | 5.85 ✔ |
| Stüdyo soluk / stüdyo düğmesi | `studio-faint` / `studio+8%` | 4.5:1 | 4.61 ✔ | 4.61 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 8.21 ✔ | 8.21 ✔ |
| Pop üstü ikincil / pop | `pop-ink-soft` / `pop` | 4.5:1 | 4.80 ✔ | 4.80 ✔ |
| Uyarı yazısı / kart | `danger` / `paper` | 4.5:1 | 5.72 ✔ | 6.59 ✔ |
| Uyarı yazısı / zemin | `danger` / `canvas` | 4.5:1 | 5.19 ✔ | 7.40 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 5.15 ✔ | 7.43 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 7.16 ✔ | 7.16 ✔ |

### Kiremit (`clay`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.37 ✔ | 13.33 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.12 ✔ | 14.84 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 6.06 ✔ | 6.64 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 5.49 ✔ | 7.39 ✔ |
| Soluk yazı / vurgu zemini | `muted` / `accent-soft` | 4.5:1 | 5.22 ✔ | 5.69 ✔ |
| Soluk yazı / kahraman alanı | `muted` / `hero` | 4.5:1 | 4.73 ✔ | 5.66 ✔ |
| Soluk yazı / çizgi tonu | `muted` / `border` | 4.5:1 | 4.77 ✔ | 4.95 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.44 ✔ | 11.37 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 6.97 ✔ | 9.21 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 5.47 ✔ | 6.28 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 5.59 ✔ | 7.07 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 12.20 ✔ | 12.20 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.80 ✔ | 7.80 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.93 ✔ | 5.93 ✔ |
| Stüdyo soluk / stüdyo düğmesi | `studio-faint` / `studio+8%` | 4.5:1 | 4.62 ✔ | 4.62 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 9.19 ✔ | 9.19 ✔ |
| Pop üstü ikincil / pop | `pop-ink-soft` / `pop` | 4.5:1 | 5.33 ✔ | 5.33 ✔ |
| Uyarı yazısı / kart | `danger` / `paper` | 4.5:1 | 5.68 ✔ | 6.72 ✔ |
| Uyarı yazısı / zemin | `danger` / `canvas` | 4.5:1 | 5.15 ✔ | 7.48 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 4.95 ✔ | 6.99 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 8.53 ✔ | 8.53 ✔ |

### Gül (`pink`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.59 ✔ | 13.36 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.41 ✔ | 14.89 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 6.04 ✔ | 6.57 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 5.51 ✔ | 7.32 ✔ |
| Soluk yazı / vurgu zemini | `muted` / `accent-soft` | 4.5:1 | 5.19 ✔ | 5.74 ✔ |
| Soluk yazı / kahraman alanı | `muted` / `hero` | 4.5:1 | 4.67 ✔ | 5.66 ✔ |
| Soluk yazı / çizgi tonu | `muted` / `border` | 4.5:1 | 4.80 ✔ | 4.89 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.50 ✔ | 11.50 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 7.49 ✔ | 9.25 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 5.94 ✔ | 6.14 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 6.02 ✔ | 6.89 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 12.44 ✔ | 12.44 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.97 ✔ | 7.97 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.93 ✔ | 5.93 ✔ |
| Stüdyo soluk / stüdyo düğmesi | `studio-faint` / `studio+8%` | 4.5:1 | 4.64 ✔ | 4.64 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 8.80 ✔ | 8.80 ✔ |
| Pop üstü ikincil / pop | `pop-ink-soft` / `pop` | 4.5:1 | 5.12 ✔ | 5.12 ✔ |
| Uyarı yazısı / kart | `danger` / `paper` | 4.5:1 | 5.73 ✔ | 6.73 ✔ |
| Uyarı yazısı / zemin | `danger` / `canvas` | 4.5:1 | 5.23 ✔ | 7.50 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 5.42 ✔ | 6.84 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 8.28 ✔ | 8.28 ✔ |

### Grafit (`graphite`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.77 ✔ | 13.30 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.50 ✔ | 14.90 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 6.13 ✔ | 6.61 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 5.56 ✔ | 7.41 ✔ |
| Soluk yazı / vurgu zemini | `muted` / `accent-soft` | 4.5:1 | 5.07 ✔ | 5.42 ✔ |
| Soluk yazı / kahraman alanı | `muted` / `hero` | 4.5:1 | 4.66 ✔ | 5.58 ✔ |
| Soluk yazı / çizgi tonu | `muted` / `border` | 4.5:1 | 4.85 ✔ | 4.89 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.47 ✔ | 11.21 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 13.03 ✔ | 10.11 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 11.95 ✔ | 8.19 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 12.15 ✔ | 9.17 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 14.21 ✔ | 11.28 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 9.16 ✔ | 7.27 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 7.45 ✔ | 5.92 ✔ |
| Stüdyo soluk / stüdyo düğmesi | `studio-faint` / `studio+8%` | 4.5:1 | 5.85 ✔ | 4.62 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 6.58 ✔ | 6.58 ✔ |
| Pop üstü ikincil / pop | `pop-ink-soft` / `pop` | 4.5:1 | 5.10 ✔ | 5.10 ✔ |
| Uyarı yazısı / kart | `danger` / `paper` | 4.5:1 | 5.71 ✔ | 6.70 ✔ |
| Uyarı yazısı / zemin | `danger` / `canvas` | 4.5:1 | 5.19 ✔ | 7.50 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 10.85 ✔ | 9.17 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 7.09 ✔ | 5.63 ✔ |


