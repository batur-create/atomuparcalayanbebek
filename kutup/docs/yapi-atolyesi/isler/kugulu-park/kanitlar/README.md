# Kuğulu Park — doğrulama kanıtları

Yalnız geçici yerel veritabanı ve sentetik hesaplar kullanıldı. Canlı köy, gerçek kullanıcı verisi, Cloudflare yayını veya etkinleştirme yapılmadı.

## Görsellerin anlamı

- `uygulama-yakin.png`: gerçek React uygulamasının hediye teslim ekranı; üretim `ConstructionScene` ve bitmiş Kuğulu Park.
- `uygulama-koy.png`, `uygulama-gece.png`: gerçek uygulamanın yerel v2 köyü; bir park ve ölçek karşılaştırması için mevcut bir ev. Gece park lambaları, kafe pencereleri ve sabit ışık havuzları açık.
- `uygulama-telefon-light.png`, `uygulama-telefon-dark.png`: aynı uygulama, 375 × 812 px; açık/koyu ve taşma kontrolü. Fiziksel telefon değil.
- `insaat-asamalari.png`: altı ilerleme noktasında üretim `ConstructionScene` bileşeninin izole galerisi. Gerçek kullanıcının kaydı veya çalışan normal odak seansı değil; gerçek seansın aynı arsada tek park üretmesi API testinde ayrıca denetleniyor.
- `hareket-1.png`, `hareket-2.png`: çalışan üretim bileşeninden farklı zamanlarda iki kare. Tek başlarına video yerine geçmez; `sonuc.json` içindeki değişen çizim ve Sakin ayarında sabit kalan çizim kontrolleriyle birlikte değerlendirilir.
- `../onizleme/`: kullanıcı onayından önceki düşük ayrıntılı hacim çalışması; nihai uygulama kanıtıyla karıştırılmaz.

## Sayısal kanıtlar

- `sonuc.json`: gerçek uygulama/telefon kontrolleri, sıfır tarayıcı hatası; hareket çiziminin değişmesi, Sakin'de sabitlik; bu masaüstündeki su hareketi katmanının süreleri.
- `performans.json`: 375 × 812 görünüm ve 4× CPU yavaşlatmalı masaüstü Chromium; yalnız parkın su hareketi çizim katmanı. 40 örnekte medyan yaklaşık 14,1 ms, p95 yaklaşık 44,9 ms. Tam uygulama kare süresi, fiziksel iPhone/Android veya pil ölçümü değildir; yüksek yüzdeliklerde kare bütçesi aşımı olabilir.
- `model-denetimi.json`: bütün katalogdaki aşama sürekliliği, açıklamalar, sonlu çizimler, hakediş ve SVG çizim seçenekleri taraması. 49 katalog / 32 özel / 15 nadir, sıfır bulgu.

İlk su katmanı ölçümünde gereksiz bütün örtücüler çizildiğinden masaüstü medyanı yaklaşık 46 ms idi. Örtücüler yalnız sprite'ın küçük ekran alanını kesiyorsa çizilecek biçimde daraltıldı; son standart masaüstü örneğinde medyan yaklaşık 3,8 ms, p95 32,2 ms. Bunlar diğer doğrulamalar çalışırken alınan, farklı yük altındaki örneklerdir; kesin cihazlar arası hızlanma garantisi değildir.

Tam test paketi ve genel tarayıcı/tema günlükleri son doğrulama tamamlanınca buraya eklenir. Yapı başına son sonuç ve kalan işler bir üst klasörün README dosyasındadır.

## Yeniden üretme

`kutup/` içinde:

```sh
node --test tests/kugulu-park.test.js
python tests/kugulu_park_browser.py --artifacts /tmp/kugulu-park-kanit
node docs/yapi-atolyesi/araclar/model-denetimi.mjs --repo . --out /tmp/kugulu-model-denetimi.json
npm run test:all
npm run test:browser -- --artifacts /tmp/kugulu-genel-tarayici
node scripts/theme-check.mjs
```

Derlemede mevcut büyük çıktı parçası ve PostCSS `from` uyarıları var. Uyarısız derleme veya fiziksel telefon performansı iddia edilmiyor. Yeni servis, yeni bağımlılık veya genel render motoru eklenmedi.
