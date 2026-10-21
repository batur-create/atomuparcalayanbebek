# Altı yeni nadir yapı ve Kara’nın plan postası

21 Ekim 2026 · `codex/rare-collection-celebration` · yayın Batur’da.

Batur’un “sonraki paketleri planla ve yap” talebinin dördüncü paketi. Ekip yönetimi, odakta köy ve doğal yerleşim ayrı PR’lardadır; bu paket onlardan bağımsız çalışır.

## Yapılar

Nadir havuzu 8’den 14 yapıya çıktı. Mardin Evi, Atakule, Kapadokya Kaya Evi, Yüzen Ev, Asma Köprü ve Kervansaray eklendi. Her biri kalıcı planla açılır; plan tüketilmez. İnşaatın tuğla maliyeti ve 25/50/75 dk sınıfı katalogda açıkça yazılıdır. %5/25 dk keşif, 500 dk garanti ve seri ödüllerinin hesabı değişmedi.

Katalog, şantiye ve köy aynı mimari kodu kullanır. Taş kemerler, teras, peribacası oyma odaları, pontonlar, güneş paneli, kablo/askı/ankrajlar, avlu ve Atakule’nin çekirdek/cam seyir başlığı ayrı geometrilerdir. Her yapının beş inşaat aşaması ve malzemesine uygun metrajı vardır. Kayaya oyulan evin doğal kayası önceden vardır; doğa inşa ediliyormuş gibi gösterilmez. Hazır resim eklenmedi.

## Kutlama ve veri

Yeni bulunan/hediye edilen plan, odağı veya başka pencereyi bölmeden Kara’nın postasında kendi çizimiyle açılır. Planın kalıcı olduğu, binanın ayrıca inşa edileceği açıklanır. “Planlarıma bak” gerçek kataloğu açar. Telefon/koyu tema ve hareket azaltma desteklenir.

`GET /blueprints/rewards` ve `POST /blueprints/rewards/seen` yalnız oturumdaki hesabın planlarını işler. Görüldü durumu mevcut `settings` içinde tutulur; yeni şema/migrasyon yoktur. Gösterilen kesin model listesi atomik kaydedilir: aynı anda bulunan sonraki plan yutulmaz, sahiplik ve ödül ilerlemesi değişmez. Farklı hesapla veya sahibi olunmayan planla onay reddedilir. Hesap silinince kayıt temizlenir.

Çevrimdışı kapatma cihazda bekletilir ve bağlantıda tekrar gönderilir. Gecikmiş bir GET, sunucu onayından sonra dönse bile kapatılan mesajı yeniden açamaz. Başka cihaz aynı sunucu onayını kullanır. İlk kullanımda 24 saatten eski koleksiyon geçmişi sessizce arşivlenir; sonraki okunmamış buluşların zaman aşımı yoktur. Yedekler gizli ayarları taşımadığı için geri yüklemede bu ilk kullanım kuralı yeniden uygulanır; plan sahipliği yedekte korunur.

## Doğrulama

- `npm run test:all`: 190/190; Node ve gerçek Worker adaptörü.
- `test:browser:blueprints`: 25/25; 12 yeni/önceki özgün yapı gerçek seansla başlatıldı, tamamlandı ve köye kaydedildi. Kilit, garanti, tamamlanmış koleksiyon; 360/375/390/844 px ve koyu tema.
- `test:browser:plan-reveal`: 8/8; gerçek çizim, azaltılmış hareket, telefon sığması, gecikmiş GET yarışı, yeniden yükleme ve ikinci cihazda tekrar etmeme, ana sayfadan kataloğa geçiş, JS hata kontrolü.
- `git diff --check` temiz.

Görseller: `/workspace/artifacts/yeni-planlar/oniki-nadir-yapi.png`, `mardin-plani-surpriz.png`, `atakule-plani-koyu.png`, `yeni-yapilar-koyde.png`.

Gerçek iPhone/üretim yayını yapılmadı. Yerel testler geçici veritabanlarında çalıştı.
