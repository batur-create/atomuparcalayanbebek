# Bir Taş da Senden — ortak proje ve hareket paketi

20 Ekim 2026 · Dal: `codex/anitkabir-imece` · Hedef: `kutup-platform`

Batur doğrudan kodlama istedi; ayrı tasarım önizlemesi istenmedi. Teslim PR'dır. Canlıya yayın, etkinliği başlatma ve eski yapıları kaldırma Batur'dadır. Gerçek kullanıcı verisine veya `kutup/data/` klasörüne dokunulmadı.

## Ürün ve işleyiş

- Tüm köylerden erişilen **tek ortak Anıtkabir projesi**. Kişisel haritadaki bina satırlarından bağımsızdır; Köy ve ana sayfa kartından açılan ortak şantiyede büyük çizilir. Eski Anıtkabirler korunur.
- **2.000 dakika:** İlk Taş 400, Birlikte Yükselir 1.200, Son Taş Hepimizden 400. Takvim kilidi yok.
- **Dört kişi:** komuta merkezinde Batur farklı ekiplerden dört gerçek profil seçerek başlatır. Göç, proje veya katılımcı oluşturmaz. Başlangıçta kadro ve hedef kilitlenir.
- Her kişi üç bölümde **50 + 150 + 50 = 250 dakika** kişisel görev yapar. Geri kalan 1.000 dakika paylaşılır. Bir sonraki bölüm için hem bölüm hedefi hem dört kişisel pay tamamlanmalıdır.
- 25/50/75 dakikalık görevler. Varsayılan **Rahat** ekran kapalıyken sunucu zamanıyla tamamlanır. Ayrı **Takipli** seçeneği, seansın tamamının uygulamada görülmesini ister; yarım seans projeye yazılmaz. Mevcut kişisel Sıkı/Rahat inşaat kuralları değişmedi.
- Malzeme maliyeti ve kişisel bina yok. Her iki görev seçeneği serbest çalışma gibi yarım maaş alır; mevcut günlük/seri/atölye bonusları korunur. Aynı anda kişisel bina veya ikinci görev başlatılamaz.
- Kara'nın mevcut yaşayan SVG karakteri: adla başlayan kişisel mektup, dört sorumluluk metni, çalışırken/beklerken/bitince farklı açıklamalar. İlk ziyarette tanıtır; yeniden anlatma ve doğrudan göreve geçme var. Ücretli AI veya görsel üretim servisi eklenmedi.
- Açık açıklamalar: seansın nasıl başlatılacağı, telefonun kapanıp kapanamayacağı, görevin ne zaman yazılacağı, kişisel ve ortak payın farkı, neden arkadaş beklenebileceği. Görev defterindeki 22 işin her birinde eylem ve inşaat gerekçesi bulunur.
- Dönüşte **kalıcı teslim kaydı**: yeni kişisel katkı ve o arada şantiyede gerçekleşen ilerleme hızlandırılmış izlenir; atlanabilir. Teslim almak ödül oluşturmaz. Ekranda gösterilen kaydın sonrasındaki yeni emek yanlışlıkla teslim alınmış sayılmaz.

## Çizim ve yapım sırası

`shared/imece.js` aynı süre planını sunucuya, görev defterine ve çizime verir. `src/imeceArt.js` eski kişisel anıt çiziminden bağımsızdır. Yeni Canvas çiziminde katmanlar **çizilmeden önce** derinlik sırasına konur; ön sütunları duvarın örtmesi giderildi.

Tek ölçü birimi x/y/z için 30 m. Eski anıtın yatay sıkıştırması ve dikey büyütmesi kullanılmaz. Referanslar Batur'un uydu görüntüleri/yerleşim planı ve incelenen cephe fotoğrafıdır; ölçülü mimari röleve veya fotogerçekçilik iddiası yoktur.

İçerik: Şeref Holü kütlesi, sekizer ön/arka ve on dörder yan sütun sırası, taş derzleri, saçak dişleri, üst örtü ayrıntıları, 42 gerçek basamak, kürsü, kabartmaların temsili, lahit, bağlı yan galeriler, karşılıklı geçitler, on kule, meydan bordürü ve kilim desenleri, uzun Aslanlı Yol ve 24 aslan, giriş heykel grupları, çevre ağaçları, doğru konumlu bayrak direği ve düzeltilmiş hilal-yıldız.

Yapım sırası: aplikasyon → kazı → grobeton → donatı/kalıp → temel betonu → platform → taşıyıcılar → duvarlar → sütunlar → üst örtü → merdiven → kuleler → galeriler → meydan → Aslanlı Yol → aslanlar → kaplama → desenler → kabartmalar → çevre → bayrak → ortak kontrol. Kaplama ve renkli desenler temel aşamasında bitmiş olarak gösterilmez. Bazı dekoratif çizimler temsili kalır.

Mozole başlangıçta yakın açılır. Meydan, bütün yerleşim ve bayrak kameraları; yakınlaştırma/kaydırma; yön değişiminde ortalama. Bayrak kamerası direk görevi gelmeden açılmaz. Ayrıntı yakınlaştırınca yükselir. Sabit sahne her saniye tekrar çizilmez. Kilim motiflerinde 32 ayrı çizgi yerine tek kapalı yol kullanılır. İlk masaüstü ölçümünde tam detay çizim ~34 ms'den ~14 ms'ye indi; cihazlar için performans garantisi değildir.

## Veri ve güvenlik

**Göç 29:** üyede `focus_imece`, `focus_imece_phase`, `focus_imece_personal`, `focus_imece_ref`; `imece_project`, `imece_crew`, `imece_contributions`, indeksler. Yayınlanmış 1–28 değiştirilmedi.

- Katkı, odak kaydı ve ücret **aynı SQLite/D1 işleminde** yazılır. Sunucu süreyi belirler; istemci dakika veya tamamlanma yüzdesi göndererek ilerleyemez.
- Kişisel görev alanları korunur. Eşzamanlı seansların ortak kapasitesi rezerve edilir. Ekip revizyonuna ek **küresel proje revizyonu** farklı köylerde aynı son dakikaların iki kez alınmasını engeller.
- Her seansın değişmeyen benzersiz referansı vardır. Tekrar/aynı anda tamamlama katkıyı veya ücreti çoğaltmaz. Durdurma rezervasyonu bırakır; geçmiş emeği silmez. Süresi bitmiş seansla durdurma yarışırsa önce hak edilen iş tamamlanır.
- Başka ekiplerin durum/pano/davet verisi paylaşılmaz. Ortak alanda yalnızca seçilen dört kişinin görünen profili ve proje katkısı görünür. `/imece` üye, başlatma ve yönetim owner doğrulaması ister.
- Yedek tablosu listesi `shared/backup.js` içinde tek kaynak oldu; owner yedekleme ve Node geri yükleme bunu kullanır. Üç yeni tablo ve etkin görev alanları korunur.
- Kişi hesabını silerse emek ve görünen tarihi profil korunur; katılımcı bağlantısı NULL olur. Eksik kişisel görev tamamlanmış sayılmaz. **Bu sürümde başladıktan sonra kadro değiştirme yoktur.** Böyle bir ayrılış projeyi bekletebilir; komuta ekranında açıkça anlatılır. İleride devretme istenirse ayrı ürün kararı gerekir.
- Canlılık: ortak proje açık sayfada 15 saniyede bir ve görünürlük/ağ dönüşünde yenilenir; normal ekip WebSocket akışı korunur. Sürekli kilit ekranı sayacı veya yeni ara aşama push'u bu paketin özelliği değildir. Başlatma bildirimi mevcut push altyapısıyla gönderilir.

## Eski Anıtkabirler

Mevcut komuta merkezi kaldırma yetkisi kullanılır: Ekipler → kişi → 🎁 → Köyü → **Yalnız Anıtkabir**. Filtre sunucuda da uygulanır; en yeni 200 başka yapı yüzünden eski anıt gizlenmez. Silme tek tek mevcut onay penceresinden yapılır; tuğla ve odak dakikaları değişmez, yapı/beğeni/teslim satırları mevcut kuralla silinir. Bu teslimde kimsenin yapısı kaldırılmadı.

Proje başladıktan sonra katalogdaki Anıtkabir ortak şantiyeye götürür. Üye API'si yeni kişisel Anıtkabir başlatmayı reddeder; başlamış eski seanslar bozulmaz. Batur'un mevcut yönetici hediye yetkisi korunur.

## Doğrulama ve teslim

- Başlangıçtaki `npm run test:all` yeşildi.
- `npm run test:all`: **167/167**. Gerçek Node hostu ve yerel workerd/D1 üzerinde 2.000 dakikanın tamamı, kişisel kapılar ve ekipler arası çalışma testli.
- `npm run test:browser`: **100/100** mevcut uygulama kontrolü.
- `npm run test:browser:relaxed`: **18/18**, mevcut Rahat ve iPhone boyut/yön kontrolleri.
- `npm run test:browser:imece`: **17/17**, gerçek owner başlatması, Kara, görev, teslim, 360/375/390/844 genişlikler ve tüm etkinliğin gerçek API akışı.
- Tema kontrolü: **252/252** renk çifti. `git diff --check` temiz.
- Yeni tarayıcı testi `kutup/data/` kullanmaz; geçici veritabanı ve geçici profiller kurar. Görseller `/workspace/artifacts/anitkabir-imece/` altında; depoya eklenmedi.
- Fiziksel iPhone ve ODTÜ ağı denenmedi. Canlı yayın/duman testi yapılmadı; yayın Batur'da.

**Yayına alma:** mevcut yedek akışıyla yedek al → PR'ı `kutup-platform`'a birleştir → mevcut yayın komutunu kullan → gerçek cihazda kontrol et → Komuta merkezi / Ortak Anıtkabir'den dört gerçek profili seç ve başlat. Eski yapıları kaldırmak ayrıca Batur'un seçimidir.

## İkinci paket — çalışanlar, vinç, teslim filmi ve açılış

20 Ekim 2026: Batur ayrıntılı hareket/açılış planına **“onay”** verdi. Bu paket aynı PR #43'e ayrı commit olarak eklendi. Aşağıdaki sonuçlar ilk teslimin üzerine geçer; ilk teslimin test sayıları yukarıda tarihsel kayıt olarak korunur.

- **22 işe bağlı canlı çalışma:** aplikasyon/ölçüm, katmanlı kazı ve yükleme, donatı taşıma/bağlama, beton hortumu/mastar, taşıyıcı montaj, duvar/taş/merdiven, mozaik, kabartma, fidan, bayrak halatı ve son kontrol. İnsan yüksekliği yaklaşık 1,8 m; anıtla aynı 30 m birimi kullanılır. Baret renkleri dört kadro konumunu ayırır. Ana cephede yüksekteki ekip ayaklı, çaprazlı, merdivenli ve korkuluklu iş platformunda durur.
- **Kule vinci:** ayak/denge ağırlığı, kafes gövde, kabin, bom/gergiler, hareketli araba, halat/kanca ve dört noktalı sapan. Kapalı 10 sn çevrimde stoktan yük alır, kaldırır, bom/arabayla hedefe taşır, indirir, bırakır ve boş döner. Kazı makinesinde iki parçalı bomun eklem çözümü, kamyona dönüş ve dökme hareketi var. Bunlar görev akışının temsili canlandırmalarıdır; gerçek makine simülasyonu veya her taşın ayrı envanteri değildir.
- **Pil bütçesi:** detaylı anıt sabit Canvas'ta; işçiler/makineler ve yalnız bayrak kumaşı şeffaf canlı Canvas'ta. Kumaş eski geometrinin aynısını kullanır; ikinci bayrak veya değişmiş hilal/yıldız çizilmez. Masaüstünde en fazla 24, kaba işaretçili telefonda 18 kare/sn. Ekran dışı ve gizli sekmede sürekli döngü yok. Etkin seans yoksa ekip görünmez; tamamlanmış anıtta yalnız Şölen ayarında bayrak dalgalanır. Sakin'de ortam hareketi durur, açıkça başlatılan gösteri oynar.
- **Teslim filmi:** geçtiği her işe gösterim süresi ayırır; bir kısa katkı yaklaşık 6 sn, uzun aralık en fazla 22 sn. Sadece teslimin gerçek `from`–`to` aralığını gösterir. Anıtın ilerlemesi film örneklerinde yeniden çizilir; normal canlı seyirde yeniden çizilmez. Duraklat/devam/atla/tekrar izle var. Ekran dışında hem canlı resim hem film saati durur; dönünce kaldığı yerden sürer. Gösteriden bağımsız gerçek görev süresi sunucuda işlemeye devam eder.
- **Teslim bütünlüğü:** film başladıktan sonra başka cihazdan yeni seans tamamlansa bile kabul işlemi izlenen kaydın `through` sınırını yollar; sonraki katkı yeni teslim olarak bekler. Kapatmak yalnız filmi kapatır, teslim kaydını silmez. Hesap değişiminde eski replay temizlenir.
- **Açılış:** sunucu `complete` vermeden düğme yok. Kullanıcının başlattığı 15 sn tur Aslanlı Yol → meydan → mozole → bayrak → bütün yerleşim rotasını izler; son durakta dört gerçek isim, dakika ve sorumluluklarıyla emek defteri açılır. Duraklar arasında kamera seçilir; her durakta sabit çizim üzerinde hafif yaklaşma vardır. Tam yerleşimde sürekli kamera uçuşu yoktur. Tur atlanabilir ve tekrar açılabilir; katkı/ödül/teslim durumuna yazmaz.
- **Erişilebilirlik/mobil:** altı açık isimli kamera, büyük dokunma alanları, film ilerleme bilgisi, klavye odağını film kontrollerine ve tekrar haritaya verme. Etkili Kıpırtısız/sistem hareket azaltmada film doğrudan son görüntüye, açılış katkı defterine geçer; kullanıcı kameraları elle gezebilir. Hareket ayarı açıkken değiştirilirse de işler. Daha özgül CSS seçiciyle ortak anıt penceresi masaüstünde 1.080 px'e kadar açılır. Telefon/yön değişiminde ölçülüp yeniden ortalanır.

**Dosyalar:** `imeceMotion.js` (iş konumu, görev türü, yük çevrimi, teslim zaman çizelgesi, tur), `imeceLive.js` (hafif makine/ekip çizimi), `useImecePlayback.js` (görünürlük/hareket/saat kapısı); `ImeceScene.jsx`, `Imece.jsx`, `imeceArt.js`, `imece.css`. Eski `construction.js`, `crew.js`, `crane.js`, `Village.jsx`, `villageView.js`, `villageWorld.js`, `iso.js` değiştirilmedi. Sunucu, göç, ücret, kadro ve çalışma hedefleri de değişmedi.

**Güncel doğrulama:**

- `npm run test:all`: **170/170**, Node ve gerçek yerel Worker/D1 dahil. Üç yeni test, kaydedilmiş süreyi aşmayan eksiksiz teslim aralığını, vinçte yük/boş dönüş/halat sınırlarını ve 22 işin hareket uçlarında sonlu Canvas geometrisini denetler.
- `npm run test:browser:imece`: **35/35**, geçici gerçek veritabanı/API ve Chromium. Canlı ekip hareket ederken sabit Canvas çizim sayısının değişmemesi; gizli/ekran dışı durma; çalışma bitmeden kredi olmaması; duraklatma ve hareket azaltma; ikinci cihazda biten yeni teslimin korunması; gerçek 2.000 dakika akışı; beş açılış durağı ve dört isim; klavye odağı; 360/375/390/844 px taşma ve 44 px harita kontrolleri.
- `npm run test:browser`: **100/100**; `npm run test:browser:relaxed`: **18/18**. Eski köy/kişisel inşaat, Rahat teslim ve iPhone boyut-yön kontrolleri de yeniden geçti.
- Tema kontrolü **252/252**; `git diff --check` temiz. Masaüstü sabit mozole çizimi son görsel koşuda **11,2 ms** ölçüldü; cihazlar için garanti değildir.
- Görseller: `/workspace/artifacts/anitkabir-imece-motion/` (iş başı, yakın/genel vinç, bitmiş yapı/kameralar, telefon açık/koyu tema, dört usta açılış defteri). Depoya ikili görsel eklenmedi.
- Fiziksel iPhone, üretim yayını ve canlı duman testi yapılmadı. PR açık; birleştirme, yedek ve yayın Batur'da. Yeni ücretli servis veya bağımlılık yok.

**Sonraki iş yalnız ayrıca istenirse:** başladıktan sonra katılımcı devretme. Bu paketin kapsamı değildir; eksik kişisel görev kuralı korunur.
