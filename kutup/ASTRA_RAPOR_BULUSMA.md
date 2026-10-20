# Ortak buluşma, kişiye özel geliş

20 Ekim 2026 · `codex/holistic-meetups` → `kutup-platform` · Başlangıç `4f3a3667`

Batur'un “14.00 buluşmasına 16.00 geliş” örneği ve “duplicate olmayan bütünsel bir sistem kur” talimatıyla yapıldı. Teslim ayrı PR; yedek, birleştirme ve yayın Batur'da. Gerçek veri veya `kutup/data/` kullanılmadı. Yapı planlarının ödül/şans dengesi bu teslimin kapsamı değil.

## Ürün

- Buluşmanın başlangıcı, herkesin kişisel gelişinden ayrıldı. 14.00 buluşmasına 16.00 katılım aynı kayıt içinde görünür. Kişisel not ve tercihli hatırlatma var.
- Ana sayfa, paylaşım ve bildirim aynı karta gider. Varım/Gelemem/Kararsızım ve açıkça yanıtı geri alma tek akıştadır. Aynı düğmeye tekrar basmak artık katılımı tersine çevirmez. Henüz cevap vermeyenle kararsız/yeniden onay bekleyen ayrı gösterilir. Organizatör de katılmayabilir; başkalarının buluşması iptal olmaz.
- Oluşturma formu o günkü mevcut buluşmaları gösterir; kişisel saatle birine katılmayı önerir. Ayrı çalışma grubu açık seçim ve kısa ad ister. Aynı dakika kopyaları yine birleşir. Mevcut eski buluşmalar otomatik birleştirilmez veya silinmez.
- İsteğe bağlı bitiş saati vardır. Bitiş yoksa Türkiye gününün sonuna kadar katılım kabul edilir; liste bir saat daha geçmiş kartı gösterebilir. Eski iki saatlik görünürlük kesintisi kaldırıldı. Geliş aynı gün veya belirtilmiş gece devamının bitişinden önce olmalıdır; başlangıçtan önce aynı gün gelmek de mümkündür.
- Organizatör ortak saati/notu düzenler veya iptal eder. Link değişmez. Ortak başlangıç/bitiş değişimi eski cevapları yeniden onay bekletir; yalnız açıklama değişirse cevaplar korunur. Kişisel saat değişimi ortak takvimi değiştirmez. İptal edilen kart linkten açıklamasıyla açılır ve yeni cevap almaz.
- Katılan/kararsız kişilere düzenleme/iptal haberi gider. Yeni buluşma ve hatırlatma bildirimi ilgili kartı doğrudan açar. Paylaşımda mutlak gün/ay/yıl/saat kullanılır. Tekrar iletilen “yarın” metninin belirsizliği giderildi.
- Takvime ekle `.ics` dosyası kişinin kendi gelişini kullanır. İkinci bir otomatik takvim alarmı eklenmez. Yoldayım/Geldim mevcut durum formunu açar; plan oluşturmak/katılmak fiziksel durumu kendiliğinden değiştirmez.

## Veri ve güvenlik

**Göç 30 eklemelidir; 1–29 değişmedi.**

- `plans`: bitiş, kayıt revizyonu, saat sürümü, iptal zamanı, güncelleme ve oluşturma istek anahtarı.
- Mevcut `attendees`, tek canlı cevap kaynağına dönüştü: cevap, kişisel geliş, onaylanan saat sürümü, hatırlatma ve kısa not. Bir kişi/buluşma anahtarı tekil. Eski `plan_skips` kayıtları buraya Gelemem olarak alınır; eski tablo kurtarma için saklanır, canlı cevap yazma/okumada kullanılmaz.
- `plan_push_events` hatırlatma tekilleştirme kaydıdır; yedek listesine eklendi. 30 öncesi yedek geri yüklenirken aynı dönüşüm uygulanır; Varım/Gelemem ve kişisel bilgiler kaybolmaz. Yeni sürüm yedeği yeni sütunları aynen taşır.
- Oluşturma ve düzenleme ekip revizyonuyla korunan işlemde yapılır. Aynı anda plan açanlar varsayılan aynı günkü kayda katılır; tekrar gönderilen oluşturma anahtarı ikinci plan üretmez. Yönetim `rev`, katılım `schedule` doğrular; eski cihaz yeni ortak saate sessizce onay veremez.
- Cevap isteği açık enum veya eski geçerli boolean ister. Eksik/yanlış değer Gelemem'e dönüşmez. Geliş/bitiş/gün/not sınırları sunucuda doğrulanır.
- Plan okuma, cevap ve yönetim ekip/üyelik doğrulamalıdır. Başka ekip kartı 404 verir. Yalnız organizatör ortak planı yönetir; herkes yalnız kendi cevabını yazar.
- İlk liste 30 satırdır; devam sayfaları yüklenir ve istemcide kimlikle tekilleştirilir. `GET /plans/:id` listeye bağımlı değildir; 31. kart, iptal veya geçmiş kayıt da doğru linkten açılır. Eski API bağlantıları tutuldu; `/join` artık idempotent Varım yazan uyumluluk ucudur.

## Hatırlatma

Kişi seçerse kendi gelişinden önceki 30 dakikalık pencerede bir kez hatırlatılır. Aboneliği açık cihaz gerekir. Mevcut dakikalık cron, `notifyMember` ve dayanıklı push outbox kullanılır; yeni servis yok.

Hatırlatma olayı ve cihazların kuyruk satırları tek işlemde, nonce korumasıyla yazılır. Eşzamanlı cron iki kez kuyruğa koymaz. Gönderim ve yeniden denemede cevap hâlâ Varım, saat sürümü aynı, geliş aynı, tercih açık ve plan iptal edilmemiş olmalıdır. Vazgeçme/iptal/retime/geliş değişimi eski kuyruğu geçersiz kılar. Cihaz oturumu ve abonelik bağlama kontrolleri korunur. Yeni seçilen farklı geliş saati yeni hatırlatma kaydı olabilir.

Push teslimi işletim sistemi/izin/ağa bağlıdır; tam 30. dakikada teslim garantisi verilmez. Sağlayıcının zaten aldığı bildirimi geri çekme garantisi yoktur; dokununca güncel kart ve iptal bilgisi açılır. `.ics` içe aktarma davranışı cihazın takvim uygulamasına bağlıdır. Fiziksel iPhone denenmedi.

## Dosyalar ve doğrulama

`shared/plans.js` kurallar/DTO/eski veri dönüşümü; `server/plans.js` tek servis; `src/Plans.jsx` tek form/kart; `src/Modals.jsx` yeniden dışa aktarır. `Home.jsx` yalnız kart özeti ve devam sayfaları. API/snapshot, mevcut outbox, şema, yedek/geri yükleme, takvim/paylaşım ve yardım metinleri bağlandı. İmece, köy/şantiye çizimleri ve yapı planı ödülleri değiştirilmedi.

- `npm run test:all`: **181/181**, Node + yerel Worker/D1. Kişisel saat, aynı gün/eşzamanlı oluşturma, tekrar istek, veri doğrulama, ekip izolasyonu, sayfa dışı kart, iptal, eski cihaz/yeniden onay, geç katılım, göç/eski yedek, paylaşım/takvim ve hatırlatma kuyruğu dahil.
- `npm run test:browser:plans`: **22/22**, gerçek yerel API/geçici veritabanı/Chromium. 14.00→16.00 senaryosu, üçüncü kişinin aynı buluşmaya katılması, kararsızlık, kişisel takvim, not/saat düzenleme, yeniden onay, iptal linki, ilk 30 dışında kart ve 35 kartlık sayfalama; 360/375/390/844 px taşma ve 44 px seçimler.
- `npm run test:browser`: **100/100** mevcut uygulama kontrolü.
- `npm run test:browser:imece`: **35/35** mevcut ortak Anıtkabir akışı.
- Tema kontrolü **252/252**; `git diff --check` temiz.
- Yerel görseller `/workspace/artifacts/bulusma-sistemi/`; depoya ikili görsel eklenmedi. Canlıya yayın veya gerçek kullanıcılara bildirim gönderilmedi.

**Yayın sırası:** mevcut yedek akışı → PR birleştirme/yayın (göç 30) → gerçek cihazda kişisel saat, düzenleme/iptal ve bildirim kontrolü. Ayrı sonraki adım: yapı planı ödül dengesi için yeni kapsam/onay.
