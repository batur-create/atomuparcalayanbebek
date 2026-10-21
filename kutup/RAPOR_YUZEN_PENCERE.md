# Yüzen pencerenin siyah kalması — dar düzeltme

21 Ekim 2026. Taban: `5eca87e17c0869ec03bb50a4e84ef388be0f710d`.
Dal: `codex/fix-floating-black-window`. Birleştirme ve yayın Batur'da.

## İstek ve neden

Batur, Claude'un yarım kalan işlerini koruyarak yalnız siyah kalan yüzen pencereyi düzeltmemizi istedi.

`FocusCard`, devam eden ekran kapalı çalışmada da Document Picture-in-Picture penceresini açabiliyor. Ancak `App.jsx` içeriği çizen `FloatPanel` bileşenini yalnız `watchEnd > 0` iken bağlıyordu. `watchEnd`, ekran kapalı seanslarda özellikle sıfır olduğu için tarayıcı penceresi ve koyu zemini açılıyor, sayaç DOM'u hiç oluşmuyordu. Aynı koşul ekran kapalı ortak görevi de etkiliyordu.

Ek olarak `FloatPanel`, pencereyi ilk render'da okuyup daha sonra effect ile abone oluyordu. Bu iki adım arasında pencere açılırsa o bildirim kaçabiliyordu.

## Düzeltme

- `FloatPanel` uygulamada bağlı kalır; gerçek PiP penceresi yoksa hiçbir DOM çizmez. Sayaç görünürlüğü presence watcher zorunluluğundan ayrıldı.
- PiP pencere snapshot'ı React 18 `useSyncExternalStore` ile izlenir; render/abonelik arasındaki değişiklik tekrar denetlenir.
- Başlatma yanıtı henüz gelmediyse veya başlatma başarısızsa pencere boş kalmak yerine Kütüp'ten seans başlatma açıklaması gösterir; henüz var olmayan bir süre üretmez.
- Ekran kapalı seans doğru açıklamayı, ortak proje kendi Anıtkabir başlığını gösterir. Normal sayaç, mola ve mevcut uyarılar aynı bileşende kalır.

Ürün değişikliği yalnız `src/App.jsx` ve `src/Watch.jsx` içindedir. Sunucu/şema/ödül/seans kuralları, köy yenilemesi ve Claude'un cihaz senkronizasyonu uygulaması bu düzeltmeye alınmadı.

## Doğrulama

Önce eski kodla gerçek Chromium Document PiP penceresi açıldı: ekran kapalı inşaatta `.float .clock` bulunamadı ve koyu boş pencere görüntüsü alındı. Aynı test düzeltme sonrasında geçti. PiP API'si sahte pencere veya `window.open` ile değiştirilmedi.

- `npm run test:all`: **207/207**, Node + yerel Worker/D1 ve Vite build.
- `python tests/float_browser.py --artifacts /tmp/kutup-float-after`: **24/24**.
- Ekran kapalı inşaat, normal inşaat, mola/dönüş, binasız odak, ekran açık/kapalı ortak Anıtkabir; başka sekme öndeyken saat; pencereyi kapatıp açma; seans bitişinde kapanma.
- Başlatma HTTP isteği bekletilirken açıklama gösterilmesi, yanıt geldiğinde aynı pencerenin sayaca dönüşmesi.
- Uygulama ve gerçek PiP pencerelerinde JavaScript hatası yok.
- `git diff --check`: geçti.

Yerel görsel kanıtlar: `/tmp/kutup-float-before/screen-off-failure.png` ve `/tmp/kutup-float-after/screen-off.png`; test sonuçları `/tmp/kutup-float-after/results.json`. Bu yollar test ortamına aittir, üretim dosyaları değildir.

Tarayıcı: Linux Chromium 154, gerçek Document PiP, 240×170 CSS px pencere. Fiziksel Windows Chrome/Edge kontrolü bu ortamda yapılmadı.

## Claude'un çalışmaları

Çalışma, mevcut checkout değiştirilmeden ayrı worktree'de hazırlandı. Açık köy A–E dalları ve #61 cihaz senkronizasyonu dalı okunarak kapsam kontrol edildi. #61'in `68dc061d392ca5053116efeabff6a50576d58057` sürümünün patch'i düzeltme üstünde `git apply --check` ile geçti; bu, metinsel çakışma kontrolüdür ve iki paketin tam birlikte çalışma testi olduğu iddia edilmez. Claude'un dallarına yazılmadı, PR'ları birleştirilmedi. Sonraki kaynak değişiklikleri yeni kontrol gerektirebilir.

Canlı veri veya yayın işlemi yapılmadı. Teslim ayrı PR'dır.
