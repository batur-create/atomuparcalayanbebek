# Kuğulu Park — yapı işi

Durum: Tamamlandı; inceleme teslimi. Kullanıcı v1 kapsamını onayladı; gece ışıkları açıkça istendi. [PR #69](https://github.com/batur-create/atomuparcalayanbebek/pull/69) → `kutup-platform`. Birleştirme veya yayın yapılmadı.

- Kimlik: `kugulupark`; kataloğun 49. modeli, 75 dk / 180 tuğla / nadir kalıcı plan.
- Açık kullanıcı talebi (22 Ekim 2026): “KUĞULU PARK”.
- Sınıflandırma: Ankara Kuğulu Park'ın gerçek yerleşiminden sanal minyatür.
- Ankara Kuğulu Park, kullanıcının dokuz görseli ve v1 onayıyla doğrulandı.
- Başlangıç tekrar kontrolünde 48 kayıtlı katalogda Kuğulu Park yoktu; mükerrer kimlik üretilmedi.
- Taban: `kutup-platform`, `395c9b11acf5396484280b4bc405948bb484f5c3`; uzak dal yeniden kontrol edildi.
- Çalışma dalı: `codex/kugulu-park`; ayrı çalışma ağacı `/workspace/kutup-yapi-atolyesi`.
- Mevcut `/workspace/atomuparcalayanbebek` çalışma ağacı ve `work` dalı korunuyor.
- Atölye klasörü yalnız `codex/building-workshop-kit` / `f13e2fd9c438031adb4da5779585d5b89b01c52c` dalından alındı; uygulama kodu güncel platform dalından.

## Kural kaynakları ve uyum

- `../../BASLANGIC_PROMPTU.md`: gerçek yapı araştırması, kapsam onayı, kalıcı kayıt, aynı SVG/Canvas geometrisi, yayın yasağı.
- `../../TEKNIK_HARITA.md`, `../../DOGRULAMA.md`, `../../ISTEK_SABLONU.md`: özel model sözleşmesi ve doğrulama kanıtının sınırları.
- `../../../../DESIGN.md` §1, §2, §6, §7, §9–10: izometrik malzeme dili; tema jetonları; 360/375 px, açık/koyu ve 44 px kontroller; hareket azaltma ve görünmeyen sahneyi durdurma. Model malzemeleri mevcut `iso.js`/`kit.js` yaklaşımıyla değerlendirilir; arayüze yeni sabit renk eklenmez.
- `../../../../HANDOFF.md` §0, §4, §6b, §10–11: ayrı dal/PR; güncel köy ve mevcut kazanımlar korunur; teslimde zorunlu test paketleri. Eski otomatik yayın notları bu sohbetin yetkisi değildir.
- `../../../../KARARLAR.md`: dizin; `n46`, `plan-kesfi`, `n36`, `n36b`, `n36c`; hakediş/seans yüzdesi ayrımı, yapım sistemine uygun sıralama, ölçülü parsel ve rezervasyon.
- `../../../../IKINCI-US.md` §4–6, §9, §12 ve ilgili hafıza/devir kayıtları: canlı veri yok; yerel/sentetik önizleme; PR tabanı `kutup-platform`. Tarihî ikinci üs kurulumu yeniden başlatılmadı.
- Taban commit'inde uygulanacak `AGENTS.md`/`CLAUDE.md` bulunmadı.
- Bu aşamada veri/yayın/göç işi yok. Böyle bir kapsam doğarsa güncel `RECOVERY.md` ayrıca uygulanır.
- Kural çelişkisi: etkilenen açık bir karar yok; kullanıcının güncel onay ve yayın sınırları esas.

## Araştırma ve temsil sınırları

Kaynaklar [KAYNAKLAR.md](KAYNAKLAR.md); onaylı ve uygulanmış kapsam [ONAY_LISTESI.md](ONAY_LISTESI.md).

Belediye ve Bakanlık kaydı ile 2025 tarihli, belediyeden alınmış vaziyet planını içeren akademik çalışma bulundu. İlk aşamada web aracı kaynak görsellerini incelenebilir görüntü verisi olarak aktaramadı. Ardından kullanıcı dokuz görsel sundu; çizimli genel harita, farklı havuz açıları, kış/gece, oyun alanı, siyah/beyaz kuğular ve uydu görüntüsü birlikte incelendi. Bu set, minyatürün kütle/ölçek önizlemesi için yeterli. Havuzun kıvrımları, adacıklar, kuğu evleri, ahşap çitler, fıskiyeler, taş yollar ve ana işlev ilişkileri okunabiliyor. 2025 planı ve tarihsiz fotoğraflar 2026'nın ölçülü uygulama projesi sayılmıyor; eksiksiz rölöve iddiası yok. Kullanıcının sorusu “bitti, sence yeterli öi”; referans teslimi tasarım veya üretim onayı sayılmadı.

## Uygulanan teknik kararlar

- `src/kuguluPark.js` ve `src/special.js`: tek SVG/Canvas geometrisi; katalog, şantiye, teslim ve köy aynı modeli kullanır. Fotoğraf kaplaması, yeni bağımlılık veya genel çizim motoru yok.
- `shared/catalog.js`: onaylı büyük/75 dk, 180 tuğla, nadir kalıcı plan. Mevcut plan kilidi, kişisel sahiplik, seans ve ödeme kuralları; ayrı ödül sayacı veya bonus yok.
- `src/construction.js`, `src/crew.js`: peyzaja özgü 16 açıklamalı aşama ve ağırlıklı hakediş. Ağaç koruma, kazı/drenaj, havuz kabuğu/sızdırmazlık, kıyı/yol, kafe/oyun, donatı/ışık, peyzaj/su ve teslim; bina katı veya betonarme döngüsü kopyalanmadı. Tahminî taş/ahşap metrajı gösterilir. Kuğular teslimde gelir.
- `shared/olcek.js`, `shared/koy2/models.js`, `modelData.js`: yaklaşık 28 × 24 m oyun zemini, çizimden ölçülen taçlar ve ana +y girişi. Kuru zeminde kendi havuzu; köy gölüne bağlanmaz. Eski 48 ölçüm satırı ve geometri sürümü 2 korunur. Eski köyde tam boy park mahallesi aranır; küçük parsele sıkıştırılmaz.
- `src/Village.jsx`, `src/villageView.js`: ayrı küçük su katmanında kuğu/ördek süzülmesi ve fıskiye; yakın görünümde çalışır. Uzakta, Sakin/Kıpırtısız ayarında ve görünmez sekmede mevcut durdurma yaklaşımı korunur. Hareketi kapatmak sabit sıcak gece lambalarını kapatmaz. Kafe ışıkları ve su yansımaları gece görünümünde vardır.
- Parkın gerçek girişleri modelde; oyunda tek ana yaklaşım. Park içi ziyaretçi yapay zekâsı eklenmedi.
- `scripts/koy/grow.mjs`: 49 modelde 7'lik örnekleme adımı bazı modelleri hiç seçmediği için katalog sayısıyla aralarında asal adım seçilir; eski 48 modelde aynı sıra korunur. Bu test verisi üreticisi düzeltmesidir.
- Veritabanı şeması/göç, Anıtkabir, keşif olasılığı, maaş/iade ve mevcut kazanımlar korunur.

## Onay geçmişi

| Tarih | Kayıt | Durum |
| --- | --- | --- |
| 22 Ekim 2026 | Kullanıcı yapı adını verdi | Araştırma yetkisi; ayrıntılı üretim onayı değil |
| 22 Ekim 2026 | Ön öneri v0 hazırlandı | Kullanıcıya ait karar yok |
| 22 Ekim 2026 | Kullanıcı dokuz görseli gönderdi ve yeterli olup olmadığını sordu | Araştırma boşluğu önizleme için kapandı; üretim onayı yok |
| 22 Ekim 2026 | Önizleme ve kapsam v1 sunuldu | 28 × 24 m oyun alanı; bu noktada onay beklendi |
| 22 Ekim 2026 | “olur, ışık da olsun gece, uygula kapsamı” | v1 kapsamı onaylandı; gece park lambaları, kafe ışıkları ve suya yansımalar üretime dahil. Yayın yetkisi yok |

## Son doğrulama ve teslim

- Son `npm run test:all`: **273/273 geçti**, sıfır atlanan/iptal edilen test; üretim derlemesi ve Node/Worker paketleri dahil. [Günlük](kanitlar/test-all.txt).
- Genel gerçek tarayıcı paketi: **100/100 geçti**, sıfır JavaScript hatası. [Günlük](kanitlar/tarayici-genel.txt). Tema: **252/252 çift geçti**. [Günlük](kanitlar/tema.txt).
- Yapıya özgü **5/5 test**: katalog/kilit/maliyet/ölçek; 16 aşama ve iki ayna yönü; son şantiye ile bitmiş çizimin eşitliği; havuz içinde yüzme; eski köyde tam boy alan; gerçek API ile kilit → açma → tek ödeme → aynı arsada tek teslim ve eşzamanlı sonuçlandırma. Bu beş test 273 testin içindedir. [Ayrı günlük](kanitlar/yapi-testleri.txt).
- Model taraması: **49 katalog / 32 özel / 15 nadir, sıfır bulgu**. [Ham sonuç](kanitlar/model-denetimi.json).
- Gerçek yerel uygulamada teslim, köy ve gece; 375 × 812 açık/koyu taşmasız görüntüler; altı şantiye noktası; hareketin zamanla değişmesi ve Sakin'de sabit kalması doğrulandı. [Kanıt açıklamaları](kanitlar/README.md), [sayısal sonuç](kanitlar/sonuc.json), [yakın görünüm](kanitlar/uygulama-yakin.png), [gece](kanitlar/uygulama-gece.png).
- Performans sınırı: yalnız su hareketi katmanının masaüstü ölçümü medyan 3,8 ms / p95 32,2 ms; 4× CPU yavaşlatmalı 375 px masaüstünde medyan 14,1 ms / p95 44,9 ms. Fiziksel Android/iPhone, pil veya Cloudflare CPU ölçümü yapılmadı; tam uygulama kare süresi iddia edilmez. [Ölçüm](kanitlar/performans.json).
- `onizleme/` onay öncesi üç SVG/PNG hacim çalışması olarak korunur; nihai uygulama görüntüsü değildir. Kaynak dokuz görsel ve SHA-256 manifesti `referanslar/` altındadır.
- Anlamlı kapsam değişikliği yok; gece ışıkları açık onayın parçası. İstenen kapsamın açık kalan üretim işi yok. `DESIGN.md`, `KARARLAR.md` ve `HANDOFF.md` güncellendi.
- Çalışma ayrı dalda push edildi ve PR #69 açıldı. Ana çalışma ağacı temiz bırakıldı; canlı veri, birleştirme, yayın veya etkinleştirme yapılmadı.
