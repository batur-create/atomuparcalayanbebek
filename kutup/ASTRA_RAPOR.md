# Kütüp — Astra denetim raporu

**Tarih:** 14 Ekim 2026 · **Depo:** `batur-create/atomuparcalayanbebek` · **Dal:** `kutup-platform`  
**İncelenen başlangıç:** `d1ac228c` · **Yöntem:** kod/SQL incelemesi, Node ve yerel workerd/D1 regresyonları, gerçek Chromium akışları ve çizim kontrolü. Çalışma Codex tarafından yürütüldü.

## Özet

1. Önce `ASTRA_DENETIM.md`, ardından `HANDOFF.md` bütünüyle okundu; temiz çalışma kopyası güncel dala fast-forward edildi.
2. Tek kullanımlık kodların eşzamanlı kullanımı, kurtarma sonrası eski oturumlar ve iptal edilen cihazlara bildirim/SSE sızıntısı kapatıldı.
3. Giriş denemelerinin sınırı artık Worker belleğine bağlı değil; ortak veritabanında tutuluyor. Yeni katılışlarda hesap zorunlu, eski üyeler korunuyor.
4. Köyde boş arsa paylaşma, aynı isimle eşzamanlı katılma/profil düzenleme ve paralel odak başlatma yarışları işlem bütünlüğüyle korunuyor.
5. Geç işlenen odak seansının binasının artımlı senkronda kaybolması, süresi dolan durum ve eski yanıtın yeni veriyi ezmesi düzeltildi.
6. Haritanın son karosunun çizilmemesi ve büyük ekranlarda önbelleğin sürekli boşalıp dolması düzeltildi; 1.000 bina gerçek tarayıcıda doğrulandı.
7. Hesap bileşenleri ayrıldı; erişilebilir ortak modal, Batur için kopyalanabilir kod penceresi, haritada klavyeyle bina seçimi ve hareket azaltmada görünür enkaz eklendi.
8. Geliş/mola bildirimlerinin ayrı 45 dakika sınırı artık durum değiştirerek aşılamaz; eşzamanlı geliş tek bildirim üretir.
9. Sonuç: **63/63 otomatik test**, **18/18 tarayıcı kontrolü**, **0 bildirilen npm açığı**. Canlı veri değişmedi. **Bu değişiklikler yayın bekliyor.**

## Yapılan değişiklikler

| Commit | Dosyalar | Sorun ve yeni davranış | Risk / doğrulama |
| --- | --- | --- | --- |
| `2975294a` | `tests/suite.js` | Wrangler’ın yazılamayan kullanıcı dizinine bağımlılığı kaldırıldı. Geçici config/log dizini; erken süreç ölümü anında hata; test anahtarı hata çıktısında maskelenir. | Düşük. İlk ortam hatası giderilince başlangıçtaki 45 test geçti. TLS doğrulaması kapatılmadı. |
| `9cacccc5` | `server/app.js`, `schema.js`, `index.js`, `src/Owner.jsx`, testler | Transfer ve kurtarma kodu tüketimi koşullu tek batch; sadece kazanan oturum açar. Parola/kurtarma kodu eski cihazları kapatır; normal cihaz aktarımı ilk cihazı korur. | Orta: oturum davranışı bilinçli sıkılaştı. Node/D1 paralel kod denemeleri, eski cookie reddi ve normal transfer testleri. |
| `9cacccc5` | Aynı dosyalar | Push aboneliği cihaz oturumuna bağlı. Owner aboneliği ayrıca anahtar sürümüne bağlı. Çıkış bütün oturumları, abonelikleri ve verilmiş kodları iptal eder. Node SSE gönderim/heartbeat sırasında yetkiyi yeniden kontrol eder. | Orta: eski abonelikler ilk doğrulanmış ziyarette tekrar bağlanır. İptal sonrası SSE kapanması, push gelmemesi ve owner logout testleri. |
| `9cacccc5` | `server/app.js`, `schema.js` | Normal oturumda 365 gün, owner’da 30 gün sunucuda da uygulanır. SHA-256 anahtarlı, atomik SQLite/D1 deneme sayaçları; login, reset, transfer ve yönetici girişine ortak sınır. Yeni katılışta kullanıcı adı/şifre zorunlu. | Eski, süresi dolmamış hesaplar ve oturumlar korunur. Legacy göç, kopyalanmış eski cookie, iki app instance’ı ve eksik hesap testleri. |
| `9dbfe175` | `server/app.js`, `schema.js`, testler | Okuma/planlama ile yazma arasına revision kontrolü kondu. Aynı boş arsayı kapma, isim çakışması, profil çakışması ve iki cihazdan odak başlatma güvenli biçimde yeniden denenir/reddedilir. | Orta: göç 9 gerekli; geçersiz guard bütün batch’i geri alır. Yarış testleri ve koordinatların korunması doğrulandı. |
| `9dbfe175` | `server/app.js` | Sonradan işlenen bina `created=odak bitişi`, `touched=eklenme zamanı` alır. Süresi dolan durum kalıcı olarak `away` olur ve revision artar. Parola kontrolüyle session ekleme arasındaki hesap değişimi de denetlenir. | Düşük/orta. Geç kredilendirme, artımlı bina listesi, idle polling, eski koordinatlar ve hesap testleri. |
| `76ffbe8d` | `src/sync.js`, `App.jsx`, `api.js`, `VillageMap.jsx`, `villageWorld.js` | Düşük revision’lı cevap reddedilir; poll istekleri üst üste binmez, eski effect isteği iptal edilir. Köy hatası görünür, otomatik ve elle yeniden deneme vardır. Bozuk JSON başarılı veri sayılmaz. | Düşük. Saf merge testleri ve gerçek tarayıcıda ilk köy isteğini düşürüp toparlama kontrolü. |
| `76ffbe8d` | `src/villageView.js`, `villageWorld.js`, `tests/client.test.js` | Görünen karolar 40’lık önbelleğe sığacak çözünürlük seçer; çok uzak zoom desteklenir. Son üretilen karo uyumadan önce ekrana aktarılır. Yol üyeliği `Set` ile aranır; gizli sayfada çizim durur. | Görsel risk: büyük ekranda gerektiğinde daha düşük karo çözünürlüğü. Mobil, 1080p/4K boyut matematiği ve gerçek 1.000 bina çizimiyle doğrulandı. |
| `839645dc` | `src/Account.jsx`, `Modal.jsx`, `App.jsx`, `Owner.jsx`, `ui.jsx`, CSS | 578 satırlık hesap/profil akışı ayrıldı. Modal `inert` arka plan, Escape, Tab döngüsü ve odak geri dönüşü sağlar. Giriş sekmeleri ok tuşlarıyla seçilir. Batur kodu seçilebilir/kopyalanabilir pencerede; Busy düğmesi yüklenirken gerçekten devre dışı kalır. Eski “şifre yok” metni düzeltildi. | Orta: bileşen taşıma. Gerçek mobil signup, invite, kurtarma, owner, klavye ve tarayıcı hatası kontrolleri geçti. |
| `839645dc` | `src/Village*.jsx/js`, `styles.css` | Sayfalı bina listesi, canvas Enter seçimi, enkaz süresinin istemcide sona ermesi; küçük yazılar için ana muted rengi koyulaştırıldı. Uzakta kişi başına tek etiket, lamba ve seçili bina için doğrudan indeksler. | Düşük. Bina listesi/kart, mobil taşma ve 1.000 bina görselleri. Saklı konumlara dokunulmadı. |
| `839645dc` | `src/Village.jsx` | Hareket azaltmada çökme sahnesi ilk çizimde enkazı gösterir; 5 sn’lik sonraki tick’i beklemez. Zıplama/konfeti hareketi kapalıdır. | Düşük. Kulübe/ev/kule × temel/yükselme/bitiş/enkaz olmak üzere 12 sahne gerçek Chromium’da incelendi. |
| `839645dc` | `server/index.js`, tarayıcı testleri | Vite HMR Node HTTP portunu paylaşır; aynı makinedeki izole test sunucuları varsayılan WebSocket portunda çakışmaz. | Yalnız geliştirme. Yakalanan gerçek WebSocket hatası düzeltildi; final tarayıcı koşusunda JS hatası yok. |
| `c39bb63e` | `server/app.js`, `public/_headers`, `src/App.jsx`, testler | Geciken “görüldü” daha yeni istek aşamasını ezemez; geçmiş ve durum aynı işlemde korunur. Gövde akışı 16 KiB’ta durdurulur; bozuk URL 400, `Origin: null` 403 olur. Worker statik içeriğine Node ile aynı CSP eklendi. Eski hesap epoch’undaki focus yanıtı yok sayılır. | Düşük/orta. Zorlanmış gecikmeli seen yarışı, Node/D1 paralel panel işlemi, sınırsız stream’i erken kesme ve bozuk istek testleri. |

| `00251a00` | `server/app.js`, `schema.js`, çekirdek ve uçtan uca testler | Geliş/mola için ayrı kalıcı cooldown; durum işlemleri taze üye bilgisi ve revision guard ile yapılır. İki cihazdan geliş tek pano hareketi ve push üretir. | Göç 10 eski son bildirim zamanını korur. Node/Worker şifreli teslim, here/break döngüsü, süre dolumu ve migration doğrulandı. |

Küçük commit’ler sonunda `npm run test:all` yeşil bırakıldı. İlk başarısız koşu ortamın Wrangler dizinindendi. Geliştirme sırasında yeni güvenlik davranışına göre bildirim aboneliği yeniden kaydı ve test kullanıcısı girişleri güncellendi; hiçbir test kapatılmadı veya assertion boşaltılmadı.

## Şema ve veri bütünlüğü

- **Göç 1–7 aynen korundu.** Yeni göçler listede sona eklendi; her eleman tek SQL ifadesi.
- **8:** `auth_limits`, süre indeksi; `subscriptions.session_token` → `sessions` ve `owner_subscriptions.session_token` → `owner_sessions`, `ON DELETE CASCADE`; owner aboneliğine `key_hash`; oturum süre indeksleri.
- **9:** tek satırlık `write_guard`; `snapshot_changed` CHECK koşulu. Okunan grup revision’ı veya feedback sürümü artık aynı değilse tüm batch iptal edilir. En fazla beş deneme; başarısız işlem kısmi veri bırakmaz.
- **10:** `members.pushed_here_at` ve `pushed_break_at`; bilinen eski son bildirim ilgili alana taşınır. Artık tür değiştirmek önceki cooldown’ı sıfırlamaz. Durum yazmaları da göç 9 korumasını kullanır.
- Köy konumları, yönleri ve mevcut odak kayıtları yeniden hesaplanmadı. Eski veritabanından yükseltme, ikinci başlangıçta konum değişmemesi, silinen üyenin boş mahallesinin yeniden kullanılması test edildi.
- `auth_limits` ve `write_guard` sıcak, değişmeyen `/state?rev` yoklamasına ekstra yazma getirmez. Auth sayaçları sadece ilgili giriş işlemlerinde, guard ise ilgili değişikliklerde kullanılır.
- Mevcut API yolları, cevapların temel şekli ve `?tab=focus` bağlantıları korundu. Bilinçli doğrulama değişikliği: yeni `/groups` ve `/join` istekleri kullanıcı adı/şifre ister; güncel arayüz zaten bunları gönderiyordu.

## Test ve yayın durumu

| Kontrol | Sonuç |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` | Kilit dosyasıyla kuruldu; paket sürümleri değiştirilmedi. |
| `npm run test:all` | **63 geçti, 0 başarısız, 0 atlanan.** Vite build + çekirdek/istemci/push + Node + gerçek yerel workerd/D1. |
| `python tests/browser_smoke.py --chromium /usr/bin/chromium` | **18 kontrol geçti.** Kendi geçici veritabanını ve sunucusunu açar/kapatır. Chromium `154.0.8037.57`. |
| Mobil | 375×812: Kütüp, Planlar, Köy, Pano ve Batur’a sekmelerinde yatay taşma yok. Modal odağı, hesap açma/kurtarma, özel geri bildirim, ikinci tarayıcıya durum, bina seçimi doğrulandı. |
| Görsel | 12 SVG sahne, mobil Canvas harita ve 1.000 bina gerçek tarayıcıda çizildi ve ekran görüntüleri incelendi. |
| `npm audit --json` | **0** bildirilen açık; bu sonuç uygulamaya yönelik pentest sertifikası değildir. |
| Canlı salt okunur health isteği | Çevre proxy’si `CONNECT ... 403` döndürdü; siteye ulaşılamadı. Bu, canlı sitenin bozuk olduğu anlamına gelmez. |
| Deploy | Astra ortamında çalıştırılmadı (Cloudflare kimliği yoktu). **14 Ekim 2026’da Claude yayınladı:** önce JSON + D1 SQL yedeği, sonra deploy; canlı D1 şema 10, 33 adımlı canlı duman testi geçti. Ayrıntı HANDOFF §6b. |
| Bulut ortamı | Güncel `start_skill` taslağı kaydedildi. Kurulum betiği ve bilinmeyen sırlar değiştirilmedi. Taslak kaydı yayın değildir. |

Tarayıcı ölçümü: **1.000 bina, 122 mahalle, 4.497 çizim öğesi**. Dünya oluşturma **47,7 ms**; merkezdeki örnek alan sorgusu 128 öğe döndürdü. Bu yerel Chromium ölçümüdür; telefon FPS’i, Cloudflare CPU süresi veya D1 günlük kotası ölçümü değildir. DPR 2’de 40 adet 256px karo yaklaşık 40 MiB ham piksel belleğidir; ana canvas ve tarayıcı ek yükü buna dahil değildir.

Kanıtlar: [sonuç JSON’u](audit/2026-10-14/results.json), [mobil köy](https://github.com/batur-create/atomuparcalayanbebek/blob/c7988d81/kutup/audit/2026-10-14/mobile-village.png), [kod penceresi — kod maskeli](https://github.com/batur-create/atomuparcalayanbebek/blob/c7988d81/kutup/audit/2026-10-14/owner-recovery.png), [12 inşaat sahnesi](https://github.com/batur-create/atomuparcalayanbebek/blob/c7988d81/kutup/audit/2026-10-14/construction-scenes.png), [1.000 bina](https://github.com/batur-create/atomuparcalayanbebek/blob/c7988d81/kutup/audit/2026-10-14/village-1000.png). Hepsi sentetik yerel veridir. PNG’ler çalışma ağacından kaldırıldı (`.gitignore`: `audit/**/*.png`); bağlantılar `c7988d81` commit’indeki kopyalara gider.

## Tespit edilip değiştirilmeden bırakılanlar

1. **Kalıcı ayrılma/silme:** HANDOFF’taki açık gizlilik kararıyla uyumlu. Gizli 30 günlük kişisel arşiv eklemek ürün/saklama politikası değişikliği olurdu. Ad yazarak ayrılma onayı korunuyor. Kurtarma yolu ve sınırlar [RECOVERY.md](RECOVERY.md) içinde.
2. **JSON’dan otomatik restore yok:** Panel export’u bir veri kopyası; oturum ve push sırlarını taşımıyor. Canlı üstüne güvenli olmayan bir import eklenmedi. Ayrı boş hedef, şema doğrulama, FK/sayaç/konum karşılaştırması ve prova şartlarını belgeledim. D1 Time Travel bütün veritabanını geri alır; sonradan oluşan verileri ve eski oturumları da etkiler. Uzak kurtarma komutları burada denenmedi.
3. **PBKDF2 20.000 tur:** Ücretsiz Worker CPU bütçesi için alınmış karar korundu. Ortak DB rate limit’i eklendi; gerçek edge CPU ölçümü yapılmadan hash maliyeti yükseltilmedi. Daha geniş kullanıma geçilirse auth bütçesi ve güçlü parola maliyeti yeniden değerlendirilmelidir.
4. **Genel yazma/join burst sınırı hâlâ süreç belleğinde:** Kritik login/reset/transfer/owner denemeleri ortak veritabanına taşındı. Mesaj, plan ve diğer yazmalar için global abuse kontrolü ayrıca ele alınmalı. Node’da `TRUST_PROXY` varsayılanı güvenilen reverse proxy varsayar; Node doğrudan internete açılacaksa `TRUST_PROXY=0` kullanılmalı. Canlı Worker `cf-connecting-ip` kullanır.
5. **Köy zaman tabanlı delta:** Beş saniyelik overlap korunuyor. Geç odak kredisi hatası düzeltildi; birbirinden beş saniyeden fazla sapan sunucu saatleri ve çok büyük bbox akışları için revision tabanlı kalıcı değişiklik günlüğü ayrı bir geliştirme olabilir.
6. **Çok büyük ilk legacy yerleşimi:** Mevcut canlı köy zaten yerleşmiş durumda. Binlerce konumsuz eski bina içeren özel import/backfill’in gerçek D1 istek/kota limitleri altında parçalara bölünmesi ayrıca denenmeli. Yeni 1.000 bina tarayıcı testi, böyle bir uzak migration testi değildir.
7. **Gerçek telefon/push/offline:** Android/iOS fiziksel cihaz, VoiceOver/TalkBack, Safari, ekran kilidi ve gerçek push servis teslimi burada doğrulanmadı. Şifreleme, VAPID, teslim gövdesi ve yetkisiz aboneliğe göndermeme otomatik testli. Tam çevrimdışı uygulama/işlem kuyruğu yok; mevcut veri saklama ve retry davranışı korundu. Tam WCAG uygunluğu iddiası yok.
8. **Kalan yapı:** Ana uygulama ve CSS hâlâ büyük; hesap/modallar ayrıldı, geniş çaplı yeniden yazım yapılmadı. Mürekkep, kara delik, rozetler ve Paket 2–9 kapsamına girilmedi.

## Claude için devam notu

1. `kutup-platform` güncel commit’lerini al; `ASTRA_DENETIM.md`, bu rapor ve HANDOFF §6b’yi birlikte oku. Değişikliklerin canlıda olduğunu varsayma.
2. Yetkili ortamda önce yedek ve doğru D1 hedefini doğrula. Yeni göçler **8, 9 ve 10**. Testler geçmeden deploy etme; veri/sır dosyalarını ekrana veya Git’e çıkarma.
3. Publish sonrası eski oturumla giriş, owner paneli, bir normal transfer, kurtarma sonrası eski cihazın reddi ve bildirim yeniden bağlanmasını kontrol et. Eski abonelikler kaybolmuş sayılmaz; doğrulanmış ziyarette otomatik kaydolur. Sadece hiç geri açılmayan eski cihazlara bildirim durur.
4. Sabit bina konumlarını değiştirme. Artımlı API için `touched` yazma zamanıdır; `created` tarihî odak bitişidir. İstemcide revision sıralama ve istek iptalini koru.
5. `write_guard` CHECK hatasını başarısızlığın ortasında yutup sonraki SQL’lere devam etme. SQLite/D1 batch rollback sözleşmesi bu korumanın parçasıdır.
6. Tarayıcı testini çalıştırmak için Python Playwright ve Chromium gerekir; npm bağımlılıklarına eklenmedi. `tests/visual-harness.html` yalnız geliştirme fixture’ıdır; Vite üretim build’ine girmez. Testler `kutup/data/` kullanmaz.
7. Bundan sonraki özellik paketi öncesinde bu denetimin yayınını tamamla. Takip riskleri yukarıda açık; restore aracını veya veri saklama politikasını aceleyle canlıya ekleme.
