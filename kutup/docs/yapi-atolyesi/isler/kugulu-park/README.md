# Kuğulu Park — yapı işi

Durum: Üretim. Kullanıcı v1 kapsamını onayladı; gece ışıkları açıkça istendi.

- Kimlik önerisi: `kugulupark`; henüz kataloğa eklenmedi.
- Açık kullanıcı talebi (22 Ekim 2026): “KUĞULU PARK”.
- Sınıflandırma: Ankara Kuğulu Park'ın gerçek yerleşiminden sanal minyatür.
- Ankara yorumu atölyenin varsayımıdır; kullanıcı başka bir park kastederse kapsam değişir.
- Tekrar kontrolü: güncel 48 kayıtlı katalogda Kuğulu Park yok.
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

Kaynaklar `KAYNAKLAR.md`; henüz onaylanmamış plan `ONAY_LISTESI.md`.

Belediye ve Bakanlık kaydı ile 2025 tarihli, belediyeden alınmış vaziyet planını içeren akademik çalışma bulundu. İlk aşamada web aracı kaynak görsellerini incelenebilir görüntü verisi olarak aktaramadı. Ardından kullanıcı dokuz görsel sundu; çizimli genel harita, farklı havuz açıları, kış/gece, oyun alanı, siyah/beyaz kuğular ve uydu görüntüsü birlikte incelendi. Bu set, minyatürün kütle/ölçek önizlemesi için yeterli. Havuzun kıvrımları, adacıklar, kuğu evleri, ahşap çitler, fıskiyeler, taş yollar ve ana işlev ilişkileri okunabiliyor. 2025 planı ve tarihsiz fotoğraflar 2026'nın ölçülü uygulama projesi sayılmıyor; eksiksiz rölöve iddiası yok. Kullanıcının sorusu “bitti, sence yeterli öi”; referans teslimi tasarım veya üretim onayı sayılmadı.

## Teknik ön inceleme

- `shared/catalog.js`: 25/50/75 dk sınıfları; yeni kimlik, maliyet ve plan erişimi yalnız onaydan sonra.
- `src/special.js`, `src/iso.js`, `src/kit.js`: ortak model ve ölçek sarmalayıcısı; park için kendi modülü gerekir.
- `src/construction.js`, `src/rareBuildings.js`: yapıya özgü ağırlıklı iş sırası; sıradan binanın kolon/döşeme aşamaları parka kopyalanmaz.
- `shared/olcek.js`, `shared/koy2/models.js`, `modelData.js`: çizilmiş havuz, ağaç taçları, giriş ve parsel birlikte ölçülmeli. Kendi havuzu olan kuru zemin modeli öneriliyor; köyün mevcut gölüne yerleşme zorunluluğu önerilmiyor.
- `src/koy2/world2.js`, `src/villageView.js`, `src/koy2/life.js`: bitmiş yapı statik çizim yolunda; kuğulara hareket ve park içi ziyaret davranışı hazır kabul edilemez. Özel hareket için küçük, bu modele bağlı bağlantı gerekebilir; yeni genel animasyon motoru önerilmiyor.
- Parkın çoklu gerçek girişleri ile oyunun ana yaklaşım yolu ayrılmalı; sıradan köy figürlerinin otomatik park içi dolaşımı ayrıca onaylanmadı.

## Onay geçmişi

| Tarih | Kayıt | Durum |
| --- | --- | --- |
| 22 Ekim 2026 | Kullanıcı yapı adını verdi | Araştırma yetkisi; ayrıntılı üretim onayı değil |
| 22 Ekim 2026 | Ön öneri v0 hazırlandı | Kullanıcıya ait karar yok |
| 22 Ekim 2026 | Kullanıcı dokuz görseli gönderdi ve yeterli olup olmadığını sordu | Araştırma boşluğu önizleme için kapandı; üretim onayı yok |
| 22 Ekim 2026 | Önizleme ve kapsam v1 | 28 × 24 m oyun alanı; onay bekliyor |
| 22 Ekim 2026 | “olur, ışık da olsun gece, uygula kapsamı” | v1 kapsamı onaylandı; gece park lambaları, kafe ışıkları ve suya yansımalar üretime dahil. Yayın yetkisi yok |

## Doğrulama ve kalan işler

- Uzak taban ve katalog tekrar kontrolü tamamlandı.
- Yalnız araştırma/kayıt yapıldı; model, ekonomi, sunucu veya oyun entegrasyonu değiştirilmedi.
- Ürün değişikliği olmadığı için test/build yeniden çalıştırılmadı; önceki paket testleri bu işe yeni kanıt sayılmıyor.
- Önizleme: `onizleme/` altında mevcut `iso.js` ve `kit.js` ilkelleriyle gündüz/gece ve aynı ölçekte mevcut ev/insan karşılaştırması. Bunlar izole hacim denemesi; çalışan ürün ekranı veya nihai model değil.
- Önizleme doğrulaması: üç SVG Node ile üretildi, yerel Chromium ile üç PNG alındı ve görsel olarak incelendi. İlk kamera denemesinde üstte kesilen ağaç ve metne taşma düzeltildi; son görüntülerde tamamı kadrajda. SVG içeriğinin XML ve sonlu sayısal değer kontrolü yapıldı. Bunlar ürünün kabul testlerinin yerine geçmez.
- Gerçek animasyon kanıtı ve yeni yapı testi henüz yok. Önizleme durağan; hareket uygulanmadı.
- Sıradaki: kullanıcının v1 kapsam/ölçek kararını bekle; açık onaydan sonra ayrıntılı üret.
- Uygulama tamamlandığında ilgili testler, zorunlu genel paketler, mobil/açık-koyu/gece/ayna kontrolleri; merkezi kayıtlar ve incelemeye hazır PR.
- Push, PR, birleştirme, canlı yayın, etkinleştirme ve canlı veri işlemi yapılmadı.
