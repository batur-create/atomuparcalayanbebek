# Astra 2. tur — 15 Ekim 2026

## Yayındaki teslim

- Dal: `astra/gorevler`, taban `259c7315` (`kutup-platform`). Batur bu adımların uygulamasını ve doğrudan yayınını onayladı.
- 1A commit: `35ba3adb`. Mürekkep başlangıç tasarımı: `82b44941`.
- Canlı: https://kutup.ahmetbaturkaplanoglu.workers.dev
- Son Cloudflare sürümü: `2bcaa74b-fe63-4e14-beef-25541ef97f8f`.
- Önceki, yalnız 1A içeren sürüm: `6b851430-9dc1-4789-855b-8cfb7bcefc5b`.
- **Claude:** Bu dal henüz `kutup-platform` ile birleştirilmedi. Sonraki yayında bu commit'leri koru; eski daldan yayınlamak bildirim kuyruğunu ve maskotu geri alır.

## 1A — Kalıcı bildirim kuyruğu

`server/outbox.js` ile bildirim gönderilmeden önce SQLite/D1 kuyruğuna kaydediliyor. Toplam en fazla dört deneme; yeniden deneme aralıkları 30 sn, 2 dk, 10 dk. Dakikalık zamanlayıcı nedeniyle gerçek gönderim bir sonraki taramaya kalabilir. Tarama sekiz kayıtla, gönderim dört eşzamanlı istekle sınırlı. 60 saniyelik atomik kiralama aynı işi eşzamanlı sahiplenmeyi engelliyor; eski kiralama sonucu yeni denemeyi değiştiremiyor.

Her denemede süre, oturum, abonelik bağı ve yönetici anahtarı yeniden kontrol ediliyor. Ağ/429/5xx hataları yeniden deneniyor; kalıcı hatalar bırakılıyor. 404/410, yalnız hâlâ aynı bağa ait aboneliği kaldırıyor. Yeniden bağlama ve oturum iptali eski kuyruğu temizliyor. Push TTL kalan süreye indirgeniyor.

- Göç **13**: `push_outbox`, tarama/abonelik indeksleri ve dört temizleme tetikleyicisi. Önceki göçlere dokunulmadı.
- Diğer dosyalar: `server/app.js`, `server/index.js`, `server/schema.js`, `worker/index.js`, `wrangler.jsonc`, `tests/helpers.js`, `tests/outbox.test.js`, `tests/suite.js`, `package.json`.
- Node interval ve Worker cron aynı kuyruk mantığını kullanıyor. Gerçek workerd scheduled endpoint'i test edildi.
- Sınır: Push servisinin kabulü, cihazda teslim/okunma makbuzu değildir. Servis kabulünden hemen sonra süreç çökerse yinelenen gönderim mümkündür; sabit bildirim kimliği/etiketi korunur. Teslim makbuzu ve yönetici paneli **1B kapsamında, yapılmadı**.

## Mürekkep — onaylı küçük tasarım adımı

Üretilen gözlüklü, mor atkılı, mürekkep patili karakter 640×640 şeffaf WebP olarak optimize edildi (63.870 bayt). `src/Mascot.jsx`, `src/mascot.css`, `public/murekkep.webp`; `App.jsx` ana sayfa sağ kolonuna kart eklendi. Mobilde kart tam satır kaplıyor. Karaktere dokununca dört hazır cümle sırayla değişiyor; tanışma penceresi üç temel özelliği anlatıyor ve odak sekmesine geçiş sağlıyor. Küçültme tercihi cihazda saklanıyor, kart yeniden açılabiliyor. Mevcut erişilebilir Modal kullanılıyor, azaltılmış hareket tercihi korunuyor.

Bu teslim, Batur'un hızlı görsel üretim isteğine göre **Görev 4'ün küçük başlangıç tasarımıdır**. Dokuz pozlu parçalı SVG, temaya göre atkı değiştirme, olay mesaj bankası, otomatik üç aşamalı onboarding, görevler ve rozetler yapılmadı. Atkı bu görselde sabit mor; kartın çevresi mevcut tema renklerine uyuyor. Köy/şantiye dosyalarına dokunulmadı. PNG ekran görüntüleri depoya eklenmedi.

## Doğrulama ve yayın

- Son kodda `npm run test:all`: **78/78**, sıfır başarısız/atlanmış test.
- Mevcut tarayıcı paketi: **18/18**. Son mobil genişlik düzeltmesinden sonra ayrıca altı maskot kontrolü ve tüm testler yeniden geçti.
- Maskot kontrolleri: dokunma tepkisi, 375 px taşma kontrolü, Escape ile kapanma/odak dönüşü, küçültmenin yenilemede korunması/yeniden açma, odak sekmesi geçişi, konsol hatasızlığı. 375 px ve 1440 px ekran görüntüleri `/tmp/kutup-mascot-check/` altında, test betiği `/tmp/kutup-mascot-check.py` (geçici doğrulama araçları).
- Canlı sağlık 200; maskot dosyası yerel SHA-256 ile aynı; canlı JS yeni bileşeni içeriyor. Üretim test endpoint'i 404. D1 şema 13 ve outbox tablosu, `* * * * *` cron doğrulandı. Gerçek telefonda bildirim teslimi bu turda ölçülmedi.
- Mevcut `ADMIN_KEY`, `ASSETS`, `DB` bağları ve D1 hedefi yayın öncesi doğrulandı; `--keep-vars` ile korundu.
- 1A öncesi gizli yedek, depo dışında `/workspace/kutup-private-backups/2026-10-14-1a/`: SQL, doğrulanmış SQLite, manifest. Önceki turda integrity/foreign-key kontrolleri geçti; dosyaların mevcudiyeti bu turda doğrulandı. İçerikleri paylaşılmadı. Maskot yayını veritabanı göçü eklemedi; yayın öncesi Worker sürüm bilgisi `/tmp/kutup-pre-mascot-deployment.json` dosyasına kaydedildi.

Onaylı kapsam bitti. 1B, rozetler, oyunlar ve tam maskot sistemi için yeni adım onayı beklenir.
