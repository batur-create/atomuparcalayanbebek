# Koddan doğrulanan yapı üretim zinciri

İnceleme: 22 Ekim 2026. Esas commit: `395c9b11acf5396484280b4bc405948bb484f5c3` (`kutup-platform`, PR #68 birleşmiş hâl). Bu belge mevcut altyapıyı açıklar; sonraki geliştirmede güncel kod yeniden kontrol edilir. Dosya yolları `kutup/` içinden verilmiştir.

## Mevcut parçalar

| Alan | Dosyalar | Gerçek görevi / eklemede dikkat |
| --- | --- | --- |
| Katalog ve ekonomi | `shared/catalog.js` | 48 kayıt; `id`, `kind`, `class`, `cost`, `category`, `look.special`, `rare`, haftalık erişim, bitiş metni. `small/medium/large` süreleri 25/50/75 dk. Kayıt eklemek tek başına çizim üretmez. |
| Plan keşfi | `shared/blueprints.js`, `server/blueprintNotices.js`, `src/BlueprintReveal.jsx` | 14 `rare:true` yapı mevcut; kurucu gözlemevi ayrı. Her 25 kredili dakikada %5 keşif adımı, 500 dk şanssızlık garantisi mevcut; seri ve hediye yolları da var. Plan kalıcı açar, binayı ücretsiz veya anında vermez. Yeni yapı bu davranışı değiştirmek zorunda değil. |
| Ortak çizim araçları | `src/iso.js`, `src/kit.js` | İzometrik projeksiyon; kutu, yüzey, profil, çizgi, malzeme, gölge, ilerleme yardımcıları. Aynı mimari çizim SVG ve Canvas ile kullanılabiliyor. `useCanvas`/`useSVG` global çizim durumuna dikkat. |
| Özel model kayıtları | `src/special.js` | 31 özel model. `look.special` anahtarı buradaki kayıtla eşleşir. Ölçek sarmalayıcısı çizim, yükseklik, ekip ve şantiye koordinatlarını birlikte ölçekler. |
| Örnek mimariler | `src/geodesic.js`, `src/vernacular.js`, `src/modern.js`, `src/towers.js`, `src/landmarks1.js`, `src/landmarks2.js`, `src/landmarks3.js` | Geometrisi ve yapım yöntemi farklı yapılar. Benzer taşıyıcı/yapım mantığı olan örnek seçilmeli; bütün dosyalar kopyalanmamalı. |
| Son nadir yapılar | `src/rareBuildings.js`, `src/rareBuildings2.js` | Ortak `design()` yardımcısı; model geometrisi ve beş ana özel iş: base/frame/skin/roof/fit. Mobilizasyon, aplikasyon, teslim ile 8 zaman dilimi. Mardin Evi ve Atakule burada zaten mevcut. |
| Yapım aşamaları | `src/construction.js` | `sitePlan`, `phaseAt`, `siteSVG`, `systemOf`, `workHeight`. Özel modelin `ground`, `steps`, `later`, `frameEnd` tanımlarını birleştirir. Betonarme, yığma, ahşap ve çeliğin genel yapım sıraları da burada. |
| Odak şantiyesi | `src/Village.jsx` | `ConstructionScene`: gerçek SVG katmanları, kamera, şantiye, işçi/vinç, kontroller, teslim/çökme. Modeli `scale:1` ile çizip kamerayla sığdırır; köy fiziksel ölçeğiyle karıştırılmamalı. Yaklaşık 30 fps sınırı, görünmez sekme/görünümde durma, hareket azaltma var. |
| İşçi/makine ve denetim | `src/crew.js`, `src/crane.js`, `src/sitedetail.js`, `src/quality.js` | Kaldırma, döküm, malzeme stokları, işçi pozisyonu/alet, kontrol ve teslim çizimleri. Özel model bunlara konum ve iş bilgisi sağlar. |
| Türkçe aşama açıklaması | `src/stageInfo.js` ve özel modelin `info` alanı | Ortak/özel açıklamalar, denetim metinleri; bilgi simgesinde gösterilir. Bazı modeller `OWN` tablosu, bazıları kendi `info` alanını kullanır. |
| Metraj ve hakediş | `src/metraj.js` | Malzeme toplamı ve iş maliyeti ağırlıklı hakediş. Hakediş seans yüzdesinden ayrı olabilir. Özel `metraj` ve `items` model verisini sağlar. Görsel ölçekte büyütme, gerçek malzeme miktarını otomatik fiziksel olarak yeniden hesaplamak anlamına gelmez. |
| Göreli gerçek ölçek | `shared/olcek.js`, `src/iso.js` | Metre, hedef yükseklik/plan açıklığı, büyük yapılarda sıkıştırılmış göreli ölçek, tekdüze büyütme. `REAL` içindeki ölçülerin varlığı, kaynaklarının bu incelemede bağımsız doğrulandığı anlamına gelmez. |
| Çizimden geometri ölçümü | `scripts/koy/measure-models.mjs`, `shared/koy2/modelData.js` | Çizimin zemin/üst izdüşümü ve yüksekliğini birkaç tohum üzerinden ölçer. `--check` dosya yazmaz, JSON yazdırır; karşılaştırma `tests/koy-b.test.js` içinde yapılır. Varsayılan komut ölçüm dosyasını yeniden yazar. |
| Yerleşim sözleşmesi | `shared/koy2/models.js` | Geometri sürümü 2; kayıtlı ölçek, zemin/üst alanı, kapı, ön/yan boşluk, desteklenen 2 ayna yönü, arazi bağlamı. Sürüm 2 yalnız Anıtkabir'e 1,25× fark uygular. Eski sürüm uyumunu koru. |
| Özel arazi ve yer seçimi | `shared/koy2/terrain.js`, `shared/koy2/planner.js` | Su değirmeni akarsu kıyısı, yüzen ev göl, fener kıyı, köprü akarsu geçişi, istasyon ray bağlamında. Sıradan özel model varsayılan kuru zemin; farklı ihtiyaç varsa sözleşme/veri/çizim birlikte ele alınmalı. |
| Köy görünümü | `src/koy2/world2.js`, `src/villageView.js`, `src/koy2/life.js` | Aynı modelden köy çizimi, yakın/uzak ayrıntı, parsel/yol, etiketler, canlılık ve derinlik. Eski `src/villageWorld.js`/`shared/village.js` yolu da uyumluluk için duruyor; desteklenen sürümler atlanmamalı. |
| Tarayıcı planlama ve sunucu | `src/koy2/browserPlan.js`, `src/koy2/planWorker.js`, `server/villageSpatial.js`, `server/villageStore.js`, `server/app.js`, `worker/index.js` | Tarayıcı aday hesaplar, sunucu doğrular. Gen3 Worker'da geçerli öneri olmadan pahalı arama yapılmaz. Rezervasyon, sonuçlandırma ve taşıma mevcut ortak işlem güvenliğini kullanmalı. |
| Odak/tamamlanma bağlantıları | `src/Economy.jsx`, `src/Focus.jsx`, `src/BuildDelivery.jsx`, `src/FocusScreen.jsx`, `src/VillageMap.jsx`, `server/app.js` | Katalogdan seçim, seans, teslim ve köy etkileşimleri. Dosya isimleri ve ilgili arayüz her yeni sürümde kontrol edilmeli; sadece görsel eklemek entegrasyon değildir. |
| Ortak Anıtkabir | `shared/imece.js`, `src/imeceArt.js`, `src/imeceLive.js`, `src/ImeceScene.jsx`, `src/imeceMotion.js` | Ayrı katkı/görev ve ayrıntılı ortak proje sahnesi. Olağan yeni kişisel yapının şablonu olarak körlemesine kopyalanmaz. |

## Özel yapı sözleşmesi

`special.js` başındaki açıklama doğrudan sözleşmeyi listeler: `spec`, `ridge`, `system`, `ground`, `steps`, `later`, `frameEnd`, `site`, `scene`, `shadow`, `building`, `workHeight`, `crew`, `metraj`, `items` ve gereken durumlarda `snow`, `chute`, `craneEnd`, `liftUntil`. Her alan her yapıda zorunlu değildir; mevcut çağıranların beklentileriyle birlikte okunmalı.

Bir aşamada `lift/liftAs`, `pour`, `inspect/next`, `stock`, `cost` gibi alanlar şantiye davranışını belirler. Aynı anahtarla birden çok kat/aşama olması normaldir; aşamayı yalnız anahtar adına göre eşsiz sanma. İş sırası ve zaman aralıkları birlikte değerlendirilir.

## Yeni eklemede muhtemel dosya değişiklikleri

Yeni özel model: kendi modülü + `special.js` kaydı + `catalog.js` + uygun `REAL` ölçek bilgisi + ölçülmüş `modelData.js` + gerekiyorsa giriş/bağlam tanımı + açıklama + testler + iş kaydı. Bu liste olasılıktır; her dosyayı sırf listede olduğu için değiştirme. Katalogdaki kaplama/eklentilerle çözülebilen basit varyant ayrı özel model gerektirmeyebilir.

`tests/site.test.js`, `tests/koy-b.test.js`, `tests/koy-e.test.js` ve başka yerlerde 48 gibi sabit sayılar bulunuyor. Yeni katalog büyürken bu beklentileri ve testlerin niyetini birlikte güncelle; kapsam testini kaldırıp hatayı örtme.

## Görsel örneklerin anlamı

- `referanslar/atlas-48.png`: Güncel koddan yeniden üretilmiş katalog atlası. Hücreler kendine göre sığdırıldığı için hücredeki piksel büyüklükleri ortak fiziksel ölçek karşılaştırması değildir. Yeşil zemin, turuncu üst izdüşüm, gri parsel, kırmızı giriş ve mavi yükseklik yardımcı çizgileridir; oyuna eklenecek dekor değildir. Etiketlerdeki metre değerleri oyun ölçeğinin karşılığıdır, tarihî yapının gerçek ölçüsü değildir.
- `referanslar/insaat-asamalari.png`: Güncel `ConstructionScene` bileşeninden dört yapı/dört durum. Şantiye aşamasıyla bitmiş modelin birlikte okunması için; gerçek kullanıcı seansı veya canlı veri değil.
- `referanslar/koy-yakin.png`, `koy-gece.png`: PR #68 sırasında gerçek React uygulamasından sentetik köyde alınmış görsel kalite referansları; kaynakları `docs/koy/komsu-koyler/`.
- Yeni gerçek yapı için yapı özelinde kaynak toplama yine gereklidir. Bu pakette bütün olası gerçek binaların fotoğrafı veya ölçüsü bulunmaz.
