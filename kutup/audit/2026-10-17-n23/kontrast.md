# n23 · Tema revizyonu: kontrast

Tarih: 17 Ekim 2026 · 1. aşama (Batur'un seçimi bekleniyor)

## Nasıl ölçüldü

- **Jetonlar:** `node scripts/theme-check.mjs` (`--md <dosya>` ile bu tabloyu yazar). `src/themes.css`'teki her temanın açık ve koyu jetonlarını okur, WCAG 2 kontrast oranını hesaplar. Yazı en az **4.5:1**, arayüz parçası (seçim halkası, stüdyo kartındaki pop) en az **3:1**. Bir çift kalırsa çıkış kodu 1.
- **Ekran:** Playwright ile gerçek uygulama, 375 px, 6 kişilik uydurma ekip. Ana sayfa, Köy, Pano, Ben ve Görünüm penceresindeki her görünür yazının rengi, arkasındaki gerçek zemine (yarı saydam katmanlar üst üste bindirilerek) karşı ölçüldü. Degrade zeminli öğeler (gökyüzü, üye kartlarının degradesi) bu sayıma girmedi.
- Araç taraması kısa tutuldu: OKLCH paletleyiciler ve WCAG/APCA denetleyicileri (ör. Spätzi, EDS Colour Palette Generator) çoğunlukla web aracı ya da ücretli. Depoda OKLCH matematiği zaten vardı (`scripts/dark-css.js`); paletler onunla küçük bir geliştirme betiğinde üretildi (açıklık basamakları Lavanta'dan, ton ve doygunluk temadan) ve bu betikle denetlendi. Çalışma anına yeni bağımlılık eklenmedi.

## Jeton tablosu: 6 tema × 2 mod × 14 çift = 168 çift, hepsi geçiyor

### Lavanta (`lilac`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 12.96 ✔ | 13.12 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 11.98 ✔ | 14.65 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 4.91 ✔ | 6.43 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 4.54 ✔ | 7.17 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.43 ✔ | 11.77 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 5.82 ✔ | 7.72 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 4.81 ✔ | 5.02 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 4.85 ✔ | 5.78 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 10.43 ✔ | 10.43 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.14 ✔ | 7.14 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 4.51 ✔ | 4.51 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 11.04 ✔ | 11.04 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 4.44 ✔ | 5.61 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 9.29 ✔ | 9.29 ✔ |

### Lacivert (`navy`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.51 ✔ | 13.23 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.21 ✔ | 14.87 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.38 ✔ | 6.57 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 4.87 ✔ | 7.39 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.66 ✔ | 11.48 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 9.75 ✔ | 9.22 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 8.12 ✔ | 6.41 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 8.26 ✔ | 7.28 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 12.61 ✔ | 10.90 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 8.09 ✔ | 6.99 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.32 ✔ | 4.60 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 9.54 ✔ | 9.54 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 7.34 ✔ | 7.21 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 9.23 ✔ | 7.97 ✔ |

### Petrol (`teal`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.26 ✔ | 13.21 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.04 ✔ | 14.83 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.23 ✔ | 6.58 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 4.75 ✔ | 7.39 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.39 ✔ | 10.82 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 7.28 ✔ | 9.20 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 5.67 ✔ | 6.62 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 5.76 ✔ | 7.47 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 11.49 ✔ | 11.49 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.41 ✔ | 7.41 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 4.86 ✔ | 4.86 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 8.21 ✔ | 8.21 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 5.15 ✔ | 7.43 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 7.16 ✔ | 7.16 ✔ |

### Kiremit (`clay`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.37 ✔ | 13.33 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.12 ✔ | 14.84 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.30 ✔ | 6.64 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 4.80 ✔ | 7.39 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.44 ✔ | 11.37 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 6.97 ✔ | 9.21 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 5.47 ✔ | 6.28 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 5.59 ✔ | 7.07 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 12.20 ✔ | 12.20 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.80 ✔ | 7.80 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.08 ✔ | 5.08 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 9.19 ✔ | 9.19 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 4.95 ✔ | 6.99 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 8.53 ✔ | 8.53 ✔ |

### Gül (`pink`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.59 ✔ | 13.36 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.41 ✔ | 14.89 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.36 ✔ | 6.57 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 4.89 ✔ | 7.32 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.50 ✔ | 11.50 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 7.49 ✔ | 9.25 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 5.94 ✔ | 6.14 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 6.02 ✔ | 6.89 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 12.44 ✔ | 12.44 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 7.97 ✔ | 7.97 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.20 ✔ | 5.20 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 8.80 ✔ | 8.80 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 5.42 ✔ | 6.84 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 8.28 ✔ | 8.28 ✔ |

### Grafit (`graphite`)

| Çift | Jetonlar | En az | Açık | Koyu |
|---|---|---|---|---|
| Yazı / kart | `ink` / `paper` | 4.5:1 | 13.77 ✔ | 13.30 ✔ |
| Yazı / zemin | `ink` / `canvas` | 4.5:1 | 12.50 ✔ | 14.90 ✔ |
| Soluk yazı / kart | `muted` / `paper` | 4.5:1 | 5.27 ✔ | 6.61 ✔ |
| Soluk yazı / zemin | `muted` / `canvas` | 4.5:1 | 4.78 ✔ | 7.41 ✔ |
| Yazı / kahraman alanı | `ink` / `hero` | 4.5:1 | 10.47 ✔ | 11.21 ✔ |
| Vurgu yazısı / vurgu zemini | `accent-deep` / `accent-soft` | 4.5:1 | 13.03 ✔ | 10.11 ✔ |
| Vurgu rengi yazı / kart | `accent` / `paper` | 4.5:1 | 11.95 ✔ | 8.19 ✔ |
| Düğme yazısı / vurgu | `on-accent` / `accent` | 4.5:1 | 12.15 ✔ | 9.17 ✔ |
| Stüdyo yazısı / stüdyo kartı | `studio-ink` / `studio` | 4.5:1 | 14.21 ✔ | 11.28 ✔ |
| Stüdyo ikincil / stüdyo kartı | `studio-soft` / `studio` | 4.5:1 | 9.16 ✔ | 7.27 ✔ |
| Stüdyo soluk / stüdyo kartı | `studio-faint` / `studio` | 4.5:1 | 5.97 ✔ | 4.74 ✔ |
| Pop üstü yazı / pop | `pop-ink` / `pop` | 4.5:1 | 6.58 ✔ | 6.58 ✔ |
| Vurgu parçası / zemin | `accent` / `canvas` | 3:1 | 10.85 ✔ | 9.17 ✔ |
| Pop parçası / stüdyo kartı | `pop` / `studio` | 3:1 | 7.09 ✔ | 5.63 ✔ |


## Ekran denetimi: n23 kontrastı düşürmüyor

Eşiğin altında kalan yazı sayısı / ölçülen yazı sayısı (5 ekran toplamı):

| Tema | Açık | Koyu |
|---|---|---|
| Lavanta, n23 öncesi | 130 / 244 | 18 / 244 |
| Lavanta | 129 / 247 | 9 / 247 |
| Lacivert | 124 / 247 | 9 / 247 |
| Petrol | 124 / 247 | 8 / 247 |
| Kiremit | 124 / 247 | 8 / 247 |
| Gül | 124 / 247 | 9 / 247 |
| Grafit | 125 / 247 | 9 / 247 |

- Koyu modda Lavanta 18'den 9'a indi: vurgu düğmelerinin yazısı artık `--on-accent` (koyu modda koyu mürekkep). Eski hâlde beyaz yazı lila düğmede 3.93:1 idi, şimdi 5.78:1. Lavanta'nın koyu vurgusu da bir tık açıldı (`#8272d8` → `#9483e8`); kart üstündeki vurgu yazısı 4.03'ten 5.02'ye çıktı.
- Açık modda kalanların hepsi n23'ten önce de vardı ve her temada aynı öğeler: sabit yazılmış soluk griler. 2. aşamada (tema seçildikten sonra) düzeltilecek. En düşükler:
  - Pano'daki sistem satırları ("ekibe katıldı", saatler 14:00, ✦): 2.0–2.2
  - Alt bilgi ("Biraz çalışma, biraz muhabbet"), "canlı", "Sadece bizim ekip": 2.1–2.5
  - Durum etiketleri (Kütüpte, Yolda, Molada, Dışarıda) ve filtre sayıları: 2.3–2.8
  - Sayfa üstü etiketleri (EKİPLE HER ŞEY DAHA İYİ…) ve alt başlıklar: 2.9–3.3
  - Alt menü etiketleri (Kütüp, Köy, Pano, Ben): 3.95; Pano baloncuklarındaki yazı: 3.9
- Koyu modda kalan 8–9 yazı: "Ekipten ayrıl" (3.6), "risk yok, yarım maaş" (3.8), baloncuk yazıları (3.9–4.1).
