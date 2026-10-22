# Kuğulu Park — onay listesi v1

Durum: Onaylandı; üretim sürüyor. Kullanıcı (22 Ekim 2026): “olur, ışık da olsun gece, uygula kapsamı”. Gece park lambaları, kafe ışıkları ve suya yansımalar kapsamda.

v0 → v1: Dokuz görsel ile ana karakter netleşti. Beyaz ve siyah kuğular, adacıklar, ahşap kuğu evleri/çit, fıskiyeler ve taş döşeme kapsamda. 28 × 24 m oyun alanı önerisi eklendi. Kullanıcının referans vermesi bu listeye onay sayılmadı.

| Başlık | Öneri | Açık nokta / kabul |
| --- | --- | --- |
| Ad ve tür | Ankara Kuğulu Park; gerçek park minyatürü; `kugulupark` özel modeli | Kullanıcı yalnız adı verdi; detaylar öneri |
| Kapsam | Kıvrımlı iki ana su bölümü, adacıklar, küçük ahşap kuğu evleri ve çitler; beyaz/siyah kuğular, birkaç ördek; fıskiyeler; ağaçlar, banklar, taş yollar, oyun alanı, kafe ve üç heykelin sade siluetleri | Kullanıcının fotoğraf/uydu ilişkileri esas; el çizimi destek. Çevredeki kent blokları, işletme etiketleri ve mevsimlik propaganda/süsler yok |
| Malzeme ve görünüm | Mevcut izometrik çizim; eğimli taş havuz kenarı, kahverengi ahşap çit/evler, taş döşeme, su ve yaprak dokusu; sıcak gece aydınlığı; mevcut kış yaklaşımına uyum | Fotoğraflardan okundu; her taş ve ağacın tek tek kopyası değil. Kafe ve heykeller, okunaklı minyatür siluet olarak yorumlanır |
| Köy ölçeği | Yaklaşık 28 × 24 m park zemini (17,5 × 15 çizim birimi), sıradan evden belirgin geniş tek park parseli; ağaçlar yaklaşık 7–9 m oyun yüksekliğinde | Gerçek parkın boyutları değil. Giriş yaklaşımı, ağaç üst izdüşümü ve parsel boşlukları buna ayrıca eklenir; otomatik sığdırıp küçültme yok. Mevcut evle aynı ölçekte `onizleme/olcek.png` |
| Arazi ve giriş | Kuru zeminde kendi kapalı havuzu; köyün doğal dere/gölünü değiştirmeden ana yola tek güvenli yaklaşım; gerçek çoklu girişler model içinde temsil | Havuzun üstünden yaklaşım yolu geçmeyecek; yeni genel arazi türü önerilmiyor |
| Yapım sırası | Aplikasyon ve ağaç koruma → kontrollü kazı/drenaj → havuz altyapısı ve sızdırmazlık → kıyı/kenar → yollar ve yerel kot farkları → kafe/oyun donatısı → bank/heykel/aydınlatma → peyzaj → su ve son kontrol → kuğularla teslim | Bu, minyatürün inşaat anlatımı; parkın 1958'de kesin olarak böyle yapıldığı iddiası değil. Kuğular ancak havuz hazırken görünür; yetişkin ağaçlar aniden büyütülmez |
| İşçi ve makine | İşe uygun kazı, taş döşeme, havuz/tesisat ve peyzaj ekipleri; gereken yerde küçük makine | Parkın tümüne bina katı, kule vinç veya modern betonarme döngüsü uygulanmaz; Türkçe aşama açıklamaları ve tahminî malzeme hesabı birlikte |
| Hareket | Kuğular için havuz sınırı içinde yavaş süzülme, hafif su izi ve sade fıskiye hareketi; görünmezken ve hareket azaltmada durur | Mevcut bitmiş model çizimi statik; bu modele bağlı küçük canlı katman bağlantısı gerekir. Yeni genel motor, park içi ziyaretçi yapay zekâsı veya kuğu besleme oyunu kapsamda değil. Önizleme durağan; animasyon tamamlanmış değil |
| Süre ve sınıf | Büyük, 75 dakika | Mevcut sınıfın kullanımı; yeni uzun ortak görev değil |
| Malzeme bedeli | 180 tuğla | Yeni katalog bedeli önerisi; gerçek yapım bedeli değil; kullanıcı onayı gerekli |
| Kazanım | Mevcut nadir plan havuzundan kalıcı açılan kişisel yapı | Yeni havuz üyesi önerisi; %5/500 dk, maaş/iade/bonus kuralları aynı kalır. Plan ücretsiz bitmiş park vermez; ayrıca ekonomik bonus önerilmiyor |
| Entegrasyon | Kendi modülü ve özel kayıt; katalog, ölçek, çizimden ölçülen alan, giriş; şantiye/teslim/köyde aynı model | Mevcut bina/şantiye kimliği, rezervasyon, sahiplik ve kazanımlar korunur. Sırf yeni model için toplu göç yapılmaz |
| Doğrulama | Aşama sürekliliği ve açıklama; son şantiye/bitmiş model; giriş/ayna/üst izdüşüm; kilit/bedel; yakın/köy/gece/mobil; hareket kaydı ve pil davranışı | Önce ilgili testler; finalde mevcut zorunlu paketler. Fiziksel telefon ve Cloudflare CPU ölçülmediyse açıkça belirtilecek |
| Teslim | Kod, kaynak/onay kayıtları, çalışan uygulama kanıtları ve PR → `kutup-platform` | Birleştirme, canlı yayın, etkinleştirme veya canlı veri işlemi yok |

Bu liste kullanıcının “olur, ışık da olsun gece, uygula kapsamı” yanıtıyla onaylandı. `onizleme/` ilk onay öncesi hacim çalışması olarak korunur. Uygulama ve test kanıtları ayrı `kanitlar/` klasöründedir; son doğrulama sonucu README'de tutulur. Anlamlı kapsam değişikliği yapılmadı; gece ışıkları açık kullanıcı talebiyle tamamlanıyor. Canlı yayın ve birleştirme kapsam dışı olmaya devam ediyor.
