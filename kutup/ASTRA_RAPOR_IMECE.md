# Bir Taş da Senden — ilk büyük teslim

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

**Sonraki tur, ayrıca onayla:** görev bazında daha ayrıntılı çalışan/vinç koreografisi, özel açılış kamera turu veya katılımcı devretme. Bunların hazır olduğu iddia edilmez; mevcut teslimde anıt yapımı katkı ilerlemesi ve hızlandırılmış teslimle çizilir.
