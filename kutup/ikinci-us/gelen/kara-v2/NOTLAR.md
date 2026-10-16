# Kara v2 — Claude’a teslim

Onaylanan Kara’nın tipi, oranları, temel renkleri ve tüm ana siluet yolları korundu. Karakter fotoğraf kullanmaz; ayrı SVG eklemlerinden oluşur. Gerçek depoya değişiklik uygulanmadı ve yayın yapılmadı.

## Dosyalar ve yerleştirme

- `Kara.jsx`, `kara.css`: uygulamanın `kutup/src/` altındaki karşılıklarıyla karşılaştırılıp taşınacak iki dosya. Yeni paket bağımlılığı yok.
- `Kara-Canli-Onizleme.html`: fontlar ve 12 uygulama görüntüsü gömülü, sunucu gerektirmeyen çalışan önizleme. Poz, hareket, göz kırpma, tek göz açma, sürpriz ve aksesuar deneme kontrolleri içerir. “Sitede” bölümündeki görüntüler büyütülebilir.
- `Kara.svg`: düzenlenebilir tek poz referansı; davranış motorunun yerine kullanılmaz.
- `screenshots/`, `screenshots.json`: uygulama görüntüleri ve açıklamaları. Telefon görüntülerinin dosya genişliği tam 375 px, masaüstü görüntülerinin genişliği 1280 px’dir.
- `validation.json`, `keyframe-counts.json`, `gesture-checks.json`, `screenshots/*checks.json`: yapılan kontroller.
- `source-baseline.json`: okunan gerçek kaynakların başlangıç parmak izleri. Son kontrolde tamamı aynı kaldı.

Kaynak: yerel `kutup-platform` dalı, HEAD `e10c30a26a23d6730f8d5cb65df5902623b43395`. Ekranlar bu dalın güncel App, Home, FocusCard ve Köy bileşenlerinin ayrı çalışma kopyasında, örnek ekip verileriyle çekildi. Gerçek kullanıcı hesaplarına girilmedi. Ekranlar canlı hesabın fotoğrafları değildir; gerçek uygulama kodunun yerel örnek veriyle render’larıdır. Gündüz 13.00, gece 22.00 Türkiye saatiyle sabitlendi. Görüntüde hareket durduruldu; yapay masaüstü kaydırma çubuğu oluğu kaldırılarak 375 px içerik genişliği elde edildi. Çekim kancaları teslim edilen Kara dosyalarında yoktur.

## Korunan arayüz

`KaraRig({ pose, act, blink, wink, className })` ve `data-pose`, `data-act`, `data-blink`, `data-wink` aynıdır. Çizim kutusu 200×240, çatı temas çizgisi y=171’dir. `KaraHome` ve `KaraBuddy` çağrıları değişmez. `ACTS` ve `LASTS` eski anahtarları korur; yeni hareketler ve süreler eklenmiştir. Listeler önizleme tarafından da kullanılabilsin diye ayrıca dışa aktarılır.

`KaraSpot` eski konuşma, haber, dokunma, uyurken önce tek göz açma ve basılı tutma davranışlarını korur. Yalnız iç kullanıma yönelik isteğe bağlı `context` genişlemesi vardır: `id`, `groupId`, `now`, `season`, `break`, `allHere`, `surface`. Mevcut çağrı noktalarına yeni zorunlu prop eklenmedi. Önizleme için `KaraSpot`, `KARA_EGGS` ve gerçek okşama çözücüsü `advanceKaraStroke` de dışa aktarılır.

## Hareket ve 2,5B

- 34 küçük davranış, 10 mevcut poz. Gerinme, kuyruk yakalama, kelebek/ateş böceği takibi, yere yuvarlanma, kamburlaştırma, rüya patileri ve yoğurma eklendi.
- 77 ayrı eklem klibinin her biri 41–50 ara kare içerir. Eğriler önceden hesaplanan monoton kübik geçişlerden örneklenir; duruş noktaları korunurken ara noktalarda gereksiz dur-kalk oluşmaz. Çalışma anında yeni bir tween motoru veya çizim döngüsü yoktur.
- Zıplama öncesi çökme, yay çizen uçuş, inişte ezilme ve toparlanma vardır. Kulaklar, bıyıklar, kuyruk ve künye kısa gecikmelerle izler.
- Sağa/sola bakışta kafa genişliği, yüz düzlemi ve iki kulak/gözün derinliği ayrı değişir. Burun, gözlük, not ve baret baş eklemini izler. Göz bebeklerinin temel daire geometrisi değişmez.
- Göz kırpmada kapakla birlikte göz hacmi hafif ezilir; açılışta toparlanır. `wink` uyku hâlinde yalnız sol gözü açar.
- Gövdeye mevcut siyah/mavi-siyah paletten üç geniş hacim düzlemi eklendi. Hacim için hareketli parıltı, filtre veya doku yoktur. Gece kenar ışığı korunur.
- Nefeste göğüs ayrı kabarır. Uykuya geçişte gövde geriye yayılır ve baş alçalır; ayak temas çizgisi korunur.
- Yuvarlanma otomatik olarak yalnız `surface: 'floor'` olduğunda seçilir. Çatıda ve odak kartının dar kenarında kendiliğinden yuvarlanmaz. Önizleme geniş bir deneme yüzeyi kabul eder.

## Nadir sürprizlerin tetikleyicileri

| Sürpriz | Normal tetikleyici | Süre | Yeniden tetikleme |
|---|---|---:|---:|
| Küçük kara delik yıldızı yutar | Kara’ya 2,8 saniye içinde 7 dokunuş | 4,6 sn | 60 sn |
| Aya bakış | Türkiye saatinde 00.00–00.04; görünür ve hareket açık | 6,8 sn | Günde bir; en az 23 saat |
| Ekip tacı | En az 2 üyeli ekibin tüm üyeleri `here` veya `break` olduğunda | 5,6 sn | 6 saat |
| Ateş böceği | Kara’ya en az 120 sn dokunulmamış, temel poz `idle`, sayfa ve Kara görünür | 6,2 sn | En az 5 dakika |
| Mırlama ve yoğurma | Aynı basışta 1,8 sn içinde 3 yatay yön değişimi; toplam ≥35 SVG birimi, dikey sapma ≤22 SVG birimi | 4,6 sn | 12 sn |
| Batur’a tepki | Mevcut sürpriz açılırken `body` üzerinde `bh-pulling` veya `bh-calm` sınıfının gelmesi | 4,4 sn | 30 sn |

Gece yarısı, ekip tacı ve uzun sessizlik otomatik sürprizleri arasında ayrıca 45 saniye bulunur. Dokunma/okşama kendi bekleme sürelerine tabidir. Otomatik sürprizler önemli bir konuşma veya geliş bildiriminin üstüne binmez. Uyuyan Kara, yıldız yutma, ay ve Batur sürprizinde kısa süre uyanır; sonra temel pozuna döner. Ekip tamamlandığında okuma/inşaatla meşgulse kısa bir mırlama anı eşlik eder.

Uzun sessizlik kontrolü 120. saniyede başlar, sonra dakikada bir denenir; gizli/ekran dışı/odakla meşgul bir Kara için sürpriz oynatılmaz. Dikey sürükleme okşama sayılmaz, sayfa kaydırması tutulmaz. Efektler bir küçük SVG yıldızı veya böcekten oluşur; ekranı kaplayan katman veya tıklama engeli eklenmez.

Batur sürprizi mevcut body sınıflarından otomatik algılanır; `BlackHole.jsx` dosyasını değiştirmek gerekmez. İstenirse `openBlackHole()` çağrı yerinden `window.dispatchEvent(new CustomEvent('kutup:blackhole-open'))` olayı da kullanılabilir.

Önizlemedeki sürpriz düğmeleri beklemeyi atlar ve gerçek kullanımın nadirlik sayaçlarını tüketmez. İç deneme olayı `kutup:kara-test`, `{ id, act }`, `{ id, egg }`, `{ id, blink: true }` veya `{ id, wink: true }` ayrıntısıyla çalışır; normal uygulama için gönderilmesi gerekmez.

## Aksesuarlar

- Baret: siperlik y=55’te biter; göz halkası y=59,8’de başlar. Dönüşte de güvenli boşluk kalır. Baretli ekran çekiminde gözler açık ve altın halka görünür.
- Gözlük: kafa ve yüz düzlemine bağlıdır; yukarıdan bakışta gözlerle birlikte döner. Küçük çerçeve bağlantıları vardır.
- Kitap: sayfalar ve iki tutan pati aynı kitap eklemindedir. Not ağız/yüz eklemine bağlıdır.
- Örgü bere uygulanmıştır. `KaraHome` ve `KaraBuddy` Türkiye ayına göre aralık–ocak–şubatta `kara-winter` sınıfını verir. Bu, uygulamadaki `skyAt(now).season` kış kuralıyla aynıdır. Baret gerektiğinde bere gizlenir; taç bere üzerinde ayrıca oturur. Mevcut mevsim verisi doğrudan kullanılmak istenirse iç `context.season` alanına geçirilebilir; KaraRig’e prop gerekmez.
- İnce belli çay bardağı uygulanmıştır. `me.status === 'break'` veya odak molasında `focusPausedAt` varsa `kara-tea` kullanılır. Bardak ve destekleyen pati tek eklemdedir. Bardak zıplama/yuvarlanmada yerde kalır. Yudum alma yalnız uygun mola/uyanık bağlamında otomatik havuza girer; önizlemede ayrıca düğmesi vardır. Uyurken bardak kenarda dinlenir; kitap/baret anında gizlenir.
- Bere düzeltme yalnız kış bağlamında otomatik seçilir. Diğer zamanlarda deneme düğmesiyle görülebilir.

## Hareket ayarı ve maliyet

Yeni Kara’da sürekli CSS döngüsü, `requestAnimationFrame`, canvas çizimi, hareketli blur/filter veya path morph yoktur. Ara karelerde yalnız `transform` ve `opacity` değişir. Bütün klipler sonludur. Normal küçük anlar arasında 4,5–10,5 saniye bekleme bulunur; görünmez sayfada ve ekran dışındaki Kara’da küçük anlar durur. Gözler yalnız görünürken izler.

Sakin’de küçük anlar ve sürprizler kapanır, poz geçişleri kalır. Kıpırtısız’da animasyon ve geçişler sıfırdır; poz değişikliği anında olur. Kullanıcı seçim yapmadığında `prefers-reduced-motion` canlı izlenir. Önizlemedeki küçük 60 px örnekler sürekli animasyon oynatmaz.

## Kontroller

- Onaylanan sekiz ana siluet yolu birebir aynı: otomatik karşılaştırma geçti.
- 34 hareket düğmesi, 10 poz ve 6 sürpriz denemesi tarayıcıda çalıştırıldı; sonsuz animasyon bulunmadı.
- Gerçek 7 dokunuş, uyku hâlinden de çalıştı; Kara uyanıp gözleri açık biçimde yıldızı yuttu.
- Gece yarısı ve tüm ekibin gelmesi uygulama örnek verisiyle otomatik tetiklendi. Uygulamada `batur` yazılarak mevcut kapı açıldığında `portal` tepkisi görüldü.
- Göz kırpma ve tek göz açma çalıştı. Sakin’de 0 animasyon ve korunmuş poz geçişleri; Kıpırtısız’da 0 animasyon ve 0 saniyelik geçişler ölçüldü. Boşta seçili Kara’da aktif CSS klibi 0 idi.
- Okşamanın gerçek çözücüsü, yön değiştirme, dikey sayfa kaydırmasını bırakma, başka parmağı yok sayma ve yavaş sürüklemeyi reddetme sınırlarıyla çalıştırıldı. Tarayıcıda yoğurma klibi denendi; fiziksel parmakla çok yönlü okşama ve 120 saniyelik gerçek bekleyiş için ayrıca cihaz testi yapılabilir.
- 12 ekran dosyasının genişlikleri doğrulandı; telefonda yatay taşma yok. Tek dosyalık önizlemede ekranlar gömülü, tarayıcı hatası yok.
- Telefon CPU yüzdesi için yeni bir sayı iddia edilmiyor. Yayın öncesi Claude mevcut yavaş telefon kontrolünü tekrar çalıştırabilir. Gerçek depodaki kaynak parmak izleri teslim sonunda değişmedi.
