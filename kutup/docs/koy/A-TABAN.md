# n46 A — köy yenilemesinin başlangıç noktası

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) (dal `codex/koy-plan-devir-20261021`, d5f2fd74; yalnız plan alındı). Bu paket çalışma zamanı kodunu değiştirmez.

## Taban

| Konu | Değer |
|---|---|
| Kod tabanı | `kutup-platform` 8dde317 (PR #54 dahil) |
| Şema | 33 göç; yeni göçler 34'ten başlar |
| Katalog | 48 model, 5'i ayrı mahalleli büyük eser (`shared/olcek.js` MONUMENTS) |
| Testler | `npm run test:all` 206/206 bu tabanda (bu paketle 210/210) |
| Ekip yönetimi (§9) | PR #54 ile birleşti; istek anahtarı + başlangıç adı düzeltmesi ve testi `tests/owner.test.js` içinde. Yeniden yapılmadı. |

## Dosyalar

- `scripts/koy/fixtures.mjs`: dört sabit sahne, bugünkü planlayıcıyla (`shared/village.js`) kurulur. Sentetik etiketli; aynı ad aynı baytı üretir.
  - **baslangic** 4 kişi, 6 yapı, 1 süren şantiye.
  - **yapi32** 6 kişi, 32 yapı: dar/geniş/yüksek, su değirmeni, yüzen ev, iki köprü, istasyon, Eyfel; 2 binalı + 1 binasız süren seans.
  - **baskin100** 4 kişi, 76/8/8/8 yapı (test girdisi, kota değil); 2 süren şantiye.
  - **anitkabir** ekip projesi (640/2.000 dk, dört kişi) ve birkaç yapı; süren ortak görev seansı kişisel şantiye beklemez.
- `scripts/koy/legacy-metrics.mjs`: bugünkü çizimi (`src/villageWorld.js`) ölçer.
- `scripts/koy/baseline.mjs`: fixture'ları, `docs/koy/baseline/manifest.json`'u ve üretim handler'ından gelen gerçek `/api/village` yanıtını (`village-v1.json`, geçici veritabanı) yazar.
- `tests/koy-a.test.js`: fixture'lar baytı baytına, korunan satırların sağlaması, v1 tel biçimi, eski sorunların gerçekten yeniden üretildiği.
- `tests/koy_shots.py`: sahne görüntüleri (1440×900 ve 390×844). Sonraki paketler kendi kiplerini ekler.

## Korunan değerler

Her sahnede yapı başına kimlik, sahip, model, sınıf, tohum, dakika ve oluşturma zamanı; süren seanslarda sahip, model, süre, bitiş ve tohum; ekip projesinde kimlik, dakika, hedef ve dört kişi. Konum bilinçli olarak dışarıda: yeni düzen yerleri değiştirebilir, kazanımı değiştiremez. Sağlamalar manifestte (`protectedSha`).

## Eski köyün ölçülen sorunları

| Sahne | Kapı yolu yok | Kapı yolu başka yapıdan geçiyor | Kendi boyundan küçük çizilen eser | Bağlamsız su/ray yapısı | Örtüşme | Yolda yapı |
|---|---:|---:|---:|---:|---:|---:|
| baslangic | 0 | 0 | 0 | 0 | 0 | 0 |
| yapi32 | 1 | 1 | 6 | 5 | 0 | 0 |
| baskin100 | 3 | 7 | 0 | 0 | 0 | 0 |
| anitkabir | 1 | 0 | 1 | 0 | 0 | 0 |

- yapi32'de su değirmeni, yüzen ev, taş kemer ve asma köprü kuru zeminde; istasyonun bağlanacağı demiryolu hiç yok.
- Baskın üreticide kapıların bir kısmı yola bağlanmıyor ya da komşunun içinden bağlanıyor.
- Amfi, kemer, istasyon, kervansaray, Mardin evi ve Anıtkabir mahallede yer kalmadığı için kendi ölçeğinden küçük çiziliyor.
- **Ölçek kayması:** bu sentetik sahnelerde ve her sahneye bugünkü planlayıcıyla 100 yapı eklendiğinde eski yapıların çizim ölçeği **değişmedi** (0). Önceki analizdeki “37 ölçek değişimi” bu tabanda yeniden üretilemedi; n44 sonrası yer ayırma bunu önlüyor. Kural yine de V2'de kayda sabitlenecek.
- Örtüşme ve yolda yapı bugün de 0; V2'de de 0 kalmalı.

Görüntüler: `/mnt/project-files/kutup/n46/A/legacy-*.png`. Gerçek canlı köy okunmadı; bu sayılar canlı köyün ölçümü değildir.

## Sonraki kapı

Sorunlu kapı, ölçek ve bağlam örnekleri tekrarlanabilir şekilde ölçülüyor. B bunları aynı envanterle yeni düzende gösterecek.
