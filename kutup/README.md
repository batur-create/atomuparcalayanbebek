# Kütüp ✳

**Aynı masa. Aynı motivasyon.** Milli Kütüphane’ye giden, farklı okullardaki arkadaşlar için gerçek zamanlı, telefona uygun bir buluşma alanı. Kim kütüpte, kim yolda, kim yarın geliyor? Hepsi tek yerde.

**Canlı:** https://kutup.ahmetbaturkaplanoglu.workers.dev (Cloudflare, ücretsiz plan)

Bu klasör bağımsız bir projedir; üst klasördeki mağaza uygulamasını kullanmaz. `kutup/` içeriği istenirse yeni bir deponun köküne taşınabilir.

## Neler var

- **Davet bağlantısıyla özel ekip.** E-posta gerekmez; katılırken kullanıcı adı ve şifre belirlenir. İsim, 24 avatar, 6 renk, masa notu ve 5 ekran teması.
- **Kütüpte / Yolda / Molada / Dışarıda.** Salon ve masa bilgisi, “Başka bir yer…” seçeneği, “burada · 1 sa 35 dk” gibi süre bilgisi. Konum izni yok; durum 8 saat sonra kendiliğinden kapanır.
- **Bildirimler.** Biri kütübe gelince, molaya çıkınca, kahveye çağırınca ya da plan yapınca telefona bildirim gider. Aynı kişi 45 dakika içinde tekrar gelip giderse ikinci bildirim gitmez. Bildirime dokununca ilgili sekme açılır.
- **Planlar.** Önümüzdeki iki hafta için plan yapılır, “Ben de gelirim” ile katılınır. Plan kartlarında “Bugün / Yarın / Cumartesi” yazar.
- **Odak odası.** 25, 50 ve 75 dakikalık seanslar, arkadaşının seansına katılma, sekme başlığında geri sayım, **Haftanın odak tablosu** (🥇🥈🥉, pazartesi sıfırlanır). Bitmiş seanslar uygulama kapalıyken de sayılır.
- **İnşaat modu ve Kütüp köyü (Forest tarzı).** Odak sayfasında açılır. Süre binayı belirler: 25 dk kulübe, 50 dk iki katlı ev, 75 dk kule. Seans boyunca canlı bir şantiye görünür: kazıklar, temel, direkler, yükselen duvarlar, yerine oturan çatı, pencereler ve bahçe; vinç sıradaki malzemeyi indirir. Ekran açık kalır (Wake Lock). Uygulamadan 10 saniyeden uzun çıkarsan, sekmeyi kapatırsan ya da pes edersen bina çöker, dakikalar yazılmaz ve panoya “inşaatı çöktü 🧱” düşer. Sonuna kadar kalırsan bina köyüne kalıcı olarak eklenir; rengi ve malzemesi her zaman aynı kalır. Tek ortak köyde herkesin kendi mahallesi var; Köy sekmesinden gezilir. Sunucu, uygulamanın 20 saniyede bir gönderdiği sinyale bakar. Web sitesi telefon kilidini uygulamadan çıkmaktan ayıramaz, bu yüzden İnşaat modunda ekranı kilitleme.
- **Bizim pano.** Mesajlar, kalpler, kahve davetleri. Gelip gitme hareketleri gerçek mesajları panodan itmez.
- **Başka cihazda aç.** “Benim köşem → Başka cihazda aç” 15 dakikalık tek kullanımlık kod verir. iPhone’da Safari ile ana ekran uygulamasının oturumları ayrı tutulduğu için bu gerekli.
- **Batur’a ilet: kargo takibi gibi istek sistemi.** Fikir, hata ya da iki çift laf; farklı alanlardan tıklayınca dolan ilham örnekleri. Gönderince zarf uçar, “Kutuya düştü ✓” damgası iner. Her istek *Gönderildi → İncelendi → Kabul edildi → Yapılıyor → Yayında* (ya da *Bu sefer olmadı*) çizgisinde ilerler. Batur açtığı an “İncelendi” olur, sonraki aşamaları panelden tek tuşla seçer, isterse not yazar. Gönderene her adımda bildirim gider, menüde “yeni gelişme” rozeti çıkar, kabul ve yayın anında küçük bir kutlama patlar.
- **`/batur` paneli:** istekler (aşama filtreleri, gönderen ve ekip bilgisi, geçmiş, arkadaşın gördüğü takip çizgisinin önizlemesi), yeni istek bildirimleri, ekipler, davet bağlantısını yenileme, birini ekipten çıkarma.
- **Hareket ve tipografi:** başlıklar Bricolage Grotesque. Açılışta tek bir koreografi var: başlık satır satır maskeden kayar, kitaplar yerine oturur, kartlar masaya dağılır. Geri kalan hareketler bir eyleme cevap verir: sekme geçişi, gelen arkadaşın kartında parlama, odak sayacında rakam kayması. “Hareketi azalt” ayarı açık cihazlarda animasyonlar kapanır.
- **Ekipten ayrıl.** Profil, mesajlar ve planlar silinir.
- Kurulabilir PWA: ana ekran kısayolları (Ben geldim!, Odak, Pano).

## Yayınlama

Aynı kod iki farklı ortamda çalışır:

| Ortam | Veri | Canlı güncelleme | Ne zaman |
| --- | --- | --- | --- |
| Cloudflare Worker (`worker/`) | D1 | 5 sn’lik hafif yoklama | **Şu an canlı olan.** ChatGPT Sites da bunu kullanır. |
| Node (`server/index.js`) | SQLite dosyası | Server-Sent Events (anlık) | Yerel geliştirme, Docker, Render, VPS |

### 1. Cloudflare (ücretsiz, şu an yayında)

Güncellemek için `kutup/` içinde:

```sh
npm ci
npm run deploy
```

İlk kez başka bir bilgisayardan yayınlarken önce `npx wrangler login` çalıştır. D1 veritabanı ilk yayında otomatik oluşturuldu (adı `kutup`).

Ücretsiz plan sınırları 5–10 kişilik ekip için fazlasıyla yeter: günde 100.000 istek, 5 GB D1. Uygulama arka planda sorgu yapmaz; açık ve görünür bir ekran 5 saniyede bir küçük bir istek atar.

### 2. ChatGPT Sites

Proje Sites’a hazır. Sites Cloudflare Worker biçimini ve D1’i kullanır. `.openai/hosting.json` dosyası D1 bağlantı adını (`DB`) bildirir, `wrangler.jsonc` ise Worker girişini ve statik dosyaları.

1. Codex uygulamasında **`kutup` klasörünü** aç (deponun kökünü değil).
2. `@Sites bu projeyi yayınla. D1 bağlantısının adı DB, build komutu npm run build, statik dosyalar dist/.` yaz.
3. Sitenin **Settings** bölümünde `ADMIN_KEY` adında uzun, rastgele bir gizli değer ekle. Eklemezsen `/batur` ilk açılışta kendi anahtarını belirlemeni ister; bunu yayından hemen sonra yap.
4. Erişimi **herkese açık** yap. Arkadaşların ChatGPT hesabı olmadan girebilmeli.

Sites’ta site adresi değişeceği için Cloudflare’deki ekip ve mesajlar oraya taşınmaz. İkisinden birini seçip arkadaşlarına onun linkini at.

### 3. Node: Docker, Render, VPS

```sh
npm ci --include=dev && npm run build
npm start
```

`PORT` sağlayıcıdan okunur. `DATA_DIR` kalıcı bir diske bağlanmalı. Render için depo kökündeki `render.yaml` hazır: Starter plan + 1 GB disk, ücretli. Render’ın ücretsiz planında disk olmadığı için veriler her yeniden başlatmada silinir; ücretsiz yayın için Cloudflare’i kullan.

Docker: `docker build -t kutup . && docker run -d -p 3001:3001 -v kutup-data:/app/data kutup`. Nginx gibi bir ters vekil kullanıyorsan `/api/events` için `proxy_buffering off` ayarla.

## Batur’un kutusu (`/batur`)

- **Canlı site:** anahtar Cloudflare’de `ADMIN_KEY` gizli değeri olarak tanımlı. Bu bilgisayarda `kutup/data/batur-key-canli.txt` dosyasında duruyor; Git’e girmez. Değiştirmek için: `npx wrangler secret put ADMIN_KEY`.
- **Yerel (Node):** `ADMIN_KEY` verilmezse `data/batur-key.txt` oluşturulur.
- **ADMIN_KEY tanımlı değilse:** `/batur` ilk açılışta kendi anahtarını belirlemeni ister; bir kez belirlendikten sonra değiştirilemez (ADMIN_KEY tanımlayarak geçersiz kılınabilir).

Anahtarı bir kez girersin; o cihaz seni 30 gün hatırlar (HttpOnly çerez, sadece `/api/owner` için). “Bu cihazdan çık” çerezi siler. `ADMIN_KEY` değişirse bütün cihazlardaki Batur oturumları kapanır. Panelde “Yeni istekleri bana bildir” açıkken biri istek yolladığında telefonuna bildirim düşer.

## Bildirimler ve telefona ekleme

- Bildirimler otomatik istenmez. Ana sayfadaki kart ya da üstteki 🔔 ile açılır; aynı düğme o cihazda kapatır.
- **Android / masaüstü:** Chrome, Edge, Firefox, Samsung Internet doğrudan çalışır.
- **iPhone / iPad (iOS 16.4+):** Safari’de *Paylaş → Ana Ekrana Ekle*, sonra Kütüp’ü ana ekrandan aç. Ana ekran uygulaması Safari’den ayrı oturum tuttuğu için Safari’de *Benim köşem → Başka cihazda aç* ile kod al ve ana ekran uygulamasında *Zaten ekipteyim* diyerek gir. Ardından 🔔.
- Bildirim teslimi tarayıcının ve işletim sisteminin elindedir; şifreleme ve imza testlerde referans çözücüyle doğrulanır, ama gerçek bir telefona teslim burada denenmedi.

## Geliştirme

**Node 22.13+** (önerilen 24).

```sh
npm ci
npm run dev          # http://localhost:3001 — Vite + API + SSE
npm run worker:dev   # Cloudflare ortamı, yerel D1 ile
```

Telefonla aynı Wi-Fi’dan denemek için: `HOST=0.0.0.0 npm run dev`.

### Testler

```sh
npm test             # çekirdek + istemci mantığı + şifreleme + Node
npm run test:worker  # aynı senaryolar yerel Cloudflare/D1 üzerinde
npm run test:all      # build + 63 test (Node ve Worker dahil)
npm run test:browser  # isteğe bağlı: Python playwright + Chromium gerekir
```

Testler geçici, izole veritabanları kullanır: davet ve isim çakışması, ekipler arası izolasyon, yoklama ve SSE, pano limitleri, odak doğrulaması ve çevrimdışı kredilendirme, şifreli ve imzalı Web Push’un sahte bir push servisine teslimi ve bekleme süresi, cihaz kodu, Batur kutusu, davet yenileme, üye çıkarma, ekipten ayrılma, yeniden başlatmada kalıcılık ve ilk sürümün veritabanından otomatik geçiş.

## Yapı

```text
server/app.js       API: rotalar, doğrulama, durum anlık görüntüsü (Node ve Worker ortak)
server/schema.js    Sürümlü veritabanı şeması ve geçişler
server/push.js      Web Push (RFC 8291 şifreleme + VAPID), yalnızca Web Crypto
server/sqlite.js    node:sqlite bağdaştırıcısı
server/index.js     Node sunucusu: SSE, statik dosyalar, Vite geliştirme modu
worker/index.js     Cloudflare Worker girişi: D1 bağdaştırıcısı, ASSETS
shared/requests.js  İstek aşamaları ve metinleri (sunucu ve arayüz ortak)
src/App.jsx         Ana ekran, durum ve odak akışları
src/Account.jsx     Giriş, kurtarma, profil ve cihaz aktarımı
src/Modal.jsx       Ortak klavye odağı ve erişilebilir pencere
src/sync.js         Geç gelen yanıtları reddeden durum birleştirme
src/Requests.jsx    Batur’a ilet: ilham örnekleri, gönderme animasyonu, takip çizgisi
src/Owner.jsx       /batur paneli
src/ui.jsx          Ortak küçük bileşenler
src/api.js          İstemci API’si ve yardımcılar
src/styles.css      Tasarım, temalar, mobil düzen
src/motion.css      Açılış koreografisi, hareketler, takip çizgisi ve panel stilleri
public/sw.js        Bildirim service worker’ı
tests/              Uçtan uca (Node + Worker), çekirdek ve şifreleme testleri
wrangler.jsonc      Cloudflare yapılandırması
.openai/hosting.json  ChatGPT Sites bağlantı bilgisi
```

## Veriler ve sınırlar

- Davet bağlantısı ekibin anahtarıdır; yalnızca güvendiğin kişilerle paylaş. Sızarsa `/batur` → Ekipler → Daveti yenile.
- Ekipler en fazla 80 kişidir. 120 günden eski mesajlar ve 30 günden eski planlar kendiliğinden temizlenir.
- E-posta/Google girişi, özel mesaj, GPS, resmi kütüphane doluluk verisi veya rezervasyon yoktur. Görülen durumlar arkadaşların kendi bildirimidir.
- Yazı tipleri uygulamayla birlikte gelir; Google Fonts bağlantısı gerekmez.

## Denetim ve kurtarma

14 Ekim 2026 denetimi: [ASTRA_RAPOR.md](ASTRA_RAPOR.md). Claude için güncel durum: [HANDOFF.md](HANDOFF.md#6b-durum-son-güncelleme-14-ekim-2026). Yedek türleri, güvenli kurtarma provası ve D1 Time Travel sınırları: [RECOVERY.md](RECOVERY.md).

Gerçek tarayıcı kontrolleri kendi geçici sunucusunu başlatır; canlı veriye bağlanmaz:

```sh
python tests/browser_smoke.py --chromium /usr/bin/chromium --artifacts /tmp/kutup-audit-artifacts
```

Python `playwright` ve Chromium ayrı geliştirme araçlarıdır; `npm ci` bunları kurmaz. API testlerinde sahte push servisi kullanılır. Cihazdan çıkış, şifre kurtarma ve süresi dolmuş oturumlar o cihaza bağlı bildirimleri de durdurur. Eski abonelikler oturum açıkken bir sonraki ziyarette yeniden bağlanır.
