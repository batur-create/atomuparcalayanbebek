# Kütüp ✳

**Aynı masa. Aynı motivasyon.** Milli Kütüphane’ye giden arkadaşlar için gerçek zamanlı, telefona uygun bir buluşma alanı.

Bu klasör bağımsız bir projedir. Üst klasördeki mağaza uygulamasını kullanmaz; Firebase anahtarı veya hesabı gerekmez. `kutup/` içeriğini daha sonra yeni bir Git deposunun köküne taşıyabilirsin.

## İçindekiler

- Davet bağlantısı ve isimle özel ekibe katılma; 12 avatar, 6 profil rengi, kişisel masa notu ve 3 arayüz teması.
- **Kütüpte / Yolda / Molada / Dışarıda**, salon ve masa bilgisi. Konum izni veya GPS takibi yok. Durum 8 saat sonra kapanır.
- Anlık ekip panosu, kalpler, kahve molası davetleri.
- Önümüzdeki 14 gün için planlar ve “Ben de gelirim” katılımı. Saatler Türkiye saatidir.
- 25, 45 ve 50 dakikalık odak seansları, arkadaşının seansına katılma, günlük dakika toplamı ve isteğe bağlı ortam sesi. İptal edilen seans puan yazmaz.
- **Batur’a ilet:** özel fikir/bug/mesaj kutusu. Gönderen, mesajını “Batur’a ulaştı / Batur’un listesinde / Halledildi” olarak takip eder.
- **`/batur`** adresinde anahtarla korunan yönetici kutusu.
- Kurulabilir PWA; geliş ve kahve davetleri için isteğe bağlı Web Push.
- Kalıcı SQLite veritabanı, ekip bazlı yetkilendirme, HttpOnly oturum çerezi, yazma isteklerinde kaynak kontrolü ve istek sınırlama.

İlk ziyaretçiye açıkça “ön izleme” olarak işaretlenen örnek ekip gösterilir. Gerçek ekip kurulduğunda örnek kayıtlar kullanılmaz.

## Çalıştırma

**Node.js 24+** gerekir. Yeni uygulamanın kendi dizininde:

```sh
cd kutup
npm ci
npm run dev
```

Geliştirme sunucusu 3001 portunda açılır. React/Vite ve API aynı sunucudadır; ikinci bir servis veya ayrı API adresi gerekmez. Başka port için `PORT=3002 npm run dev` kullanabilirsin.

Üretim:

```sh
npm run build
npm start
```

Kontroller:

```sh
npm test
```

Testler geçici, izole bir veritabanı kullanır. Davetle giriş, ekipler arası izolasyon, canlı olay akışı, pano/kalpler, plan katılımı, odak doğrulaması, Batur kutusunun gizliliği ve sunucu yeniden başlayınca verilerin korunması test edilir.

## Arkadaşlara açmak: Render

Depo kökündeki `render.yaml`, bu projeyi `kutup/` altından tek bir Node web servisi olarak yayınlayacak şekilde hazırdır.

1. Değişiklikleri kendi GitHub depona gönder.
2. Render’da **New → Blueprint** ile depoyu seç; kökteki `render.yaml` dosyasını kullan.
3. Yapılandırmanın **Starter servis + 1 GB kalıcı disk** kullandığını ve bunun ücretli olduğunu kontrol edip yayını başlat.
4. Verilen HTTPS adresini aç, ekibinizi oluştur, **Arkadaşını çağır** bağlantısını gruba gönder.
5. Render’ın Environment bölümündeki otomatik üretilen `ADMIN_KEY` değerini güvenli şekilde al. Sitenin **`/batur`** adresindeki kutuyu bu anahtarla aç. Anahtarı arkadaşlarınla paylaşma.

Henüz bu çalışma kapsamında internete yayın yapılmadı. Dosyalar ve yerel üretim akışı hazırlandı.

Yeni, ayrı bir depoya taşırken `kutup/` içeriğini yeni deponun köküne koy. `render.yaml` dosyasını da yeni köke taşı ve içindeki `rootDir: kutup` satırını kaldır.

### Diğer barındırmalar

Node 24 ve kalıcı disk sağlayan Railway/Fly/VPS gibi servislerde `npm ci --include=dev && npm run build` ve `npm start` yeterlidir. `PORT` sağlayıcıdan okunur. `DATA_DIR` değerini kalıcı diske bağla. HTTPS kullan.

Docker alternatifi, `kutup/` içinde:

```sh
docker build -t kutup .
docker run -d --name kutup --restart unless-stopped -p 3001:3001 -v kutup-data:/app/data kutup
```

Docker dosyası hazırlandı; bu ortamda Docker imajı ayrıca çalıştırılmadı. VPS’de HTTPS için ters vekil kullan. Nginx gibi bir vekilde `/api/events` için tamponlamayı kapat (`proxy_buffering off`) ve uzun bağlantıya izin ver.

**Sadece statik dosya barındıran GitHub Pages veya standart statik Vercel/Netlify dağıtımı yeterli değildir:** gerçek zamanlı sunucu ve SQLite diski de çalışmalıdır. Bu sürüm tek sunucu örneği için tasarlanmıştır.

## Batur’un özel kutusu

Üretimde uzun, rastgele `ADMIN_KEY` ortam değişkenini barındırma panelinde tut. Yerel geliştirmede verilmezse uygulama `data/batur-key.txt` dosyasına bir anahtar üretir. Bu dosya, veritabanı ve `.env` Git’e dahil edilmez. Anahtar tarayıcıdaki localStorage’a yazılmaz; paneli yenileyince tekrar gerekir.

Arkadaşların gönderirken mesajın yalnızca Batur’a gittiğini görür. Mesajlar ekip panosunda paylaşılmaz. Yönetici **Yeni / Listemde / Hallettim** olarak ayırır; gönderen Batur sayfasına tekrar geldiğinde durumunu görür. Panelde **Yenile** yeni iletileri getirir.

## Bildirim ve telefona ekleme

- Bildirimler otomatik istenmez. Girişten sonra üstteki zile basarak izin verilir; aynı düğme o cihazda bildirimleri kapatır.
- HTTPS üzerinde desteklenen Android/masaüstü tarayıcılarda Web Push çalışacak şekilde uygulanmıştır. iPhone/iPad’de iOS 16.4+ Safari’den **Paylaş → Ana Ekrana Ekle** yaptıktan sonra uygulamayı ana ekrandan açıp izin vermek gerekir.
- Web Push anahtarları ilk açılışta üretilir ve veritabanında saklanır. Dışarıya HTTPS bağlantısı açık olmalıdır; tarayıcıya göre `fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.push.apple.com` kullanılır.
- Gerçek cihazlara arka plan bildirimi teslimi bu yerel kurulumda doğrulanmadı. Tarayıcı, işletim sistemi, internet ve izinler teslimi etkiler. Canlı pano, uygulama açıkken ayrıca SSE üzerinden çalışır.
- Odak süresi sekme yenilense de sunucudaki bitiş zamanından devam eder. Tamamlanan süre uygulama yeniden açıldığında da kaydedilir.

## Veriler ve sınırlar

`DATA_DIR` varsayılan olarak `kutup/data` dizinidir. SQLite veritabanı, bildirim anahtarları ve yerel yönetici anahtarı burada bulunur. Dağıtımlarda bu dizin kalıcı olmalı; düzenli yedek alınmalı. Dosya kopyasıyla yedeklerken sunucuyu durdur ve WAL/SHM dahil dizinin tamamını al veya SQLite’ın çevrimiçi backup özelliğini kullan.

Davet bağlantısı ekipteki bilgileri görebilmenin anahtarıdır. İsimle giriş bilerek hızlı tutuldu; tarayıcı verisi silinirse veya başka cihaza geçilirse eski profil için hesap kurtarma yoktur. Yeni bir takma adla katılınabilir. Eski profil tekrar sahiplenilmez. Bir tarayıcıda aynı anda bir ekip oturumu tutulur. Ekipler 80 kişiyle sınırlandırılır.

Bu sürümde e-posta/Google girişi, özel kişiler arası mesaj, otomatik GPS, resmi kütüphane doluluk verisi, rezervasyon veya resmi kurum bağlantısı bulunmaz. Görülen durumlar arkadaşların kendi bildirimidir.

## Yapı

```text
src/App.jsx       Arayüz ve etkileşimler
src/styles.css    Duyarlı tasarım, temalar ve bileşenler
src/api.js        İstemci API’si ve açıkça etiketlenmiş ön izleme verisi
server/index.js   Node/Express, SQLite, SSE, Web Push ve yönetici API’si
public/sw.js      Bildirim service worker’ı
tests/api.test.js İzole sunucu entegrasyon testleri
```

Yazı tipleri uygulamayla birlikte servis edilir; Google Fonts bağlantısına ihtiyaç yoktur.
