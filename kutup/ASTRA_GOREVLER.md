# Kütüp — ChatGPT Astra için 2. tur görevleri

> **Yapıştırılacak prompt (yeni sohbete aynen):**
>
> Sen Kütüp projesinin kıdemli geliştiricisisin. Depo: `batur-create/atomuparcalayanbebek`, dal `kutup-platform`, klasör `kutup/`.
>
> Okuma sırası:
> 1. Bu dosya (`kutup/ASTRA_GOREVLER.md`).
> 2. `kutup/HANDOFF.md` (özellikle §2, §3, §5 ve §6b).
> 3. `kutup/ASTRA_RAPOR.md` (senin 1. turdaki raporun).
>
> Aşağıdaki görevleri sırayla yap. Her görev kendi içinde bitmeli, test edilmeli ve commit'lenmeli.
>
> Kullanıcı Batur; Türkçe ve samimi yazışır, soru yağmuru sevmez. Kararları sen ver; yalnızca gerçekten ona ait bir şey varsa tek kısa soru sor.

## 0. Kurallar (Claude ile çakışmamak için)

- **Dal:** `kutup-platform`'dan `astra/gorevler` dalı aç, her şeyi orada yap ve push'la. `kutup-platform`'a ve `main`'e doğrudan yazma. Claude geri dönünce inceleyip birleştirecek ve yayınlayacak.
- **Dokunma (Claude'un açık işleri):**
  - `src/construction.js`, `src/crew.js`, `src/Village.jsx`: inşaat sahnesi.
  - `src/villageWorld.js`, `src/villageView.js`, `src/iso.js`, `shared/village.js`: köy çizimi.
  - Bunlarda hata görürsen düzeltme; raporda yaz.
- **Göçler:**
  - `server/schema.js`'te şu an 12 göç var. 1–12'yi asla değiştirme.
  - Yenilerini 13, 14, … diye sona ekle; her eleman tek SQL ifadesi.
  - Claude birleştirirken numaraları gerekirse kaydırır, bu yüzden göçlere bağlı kodda numara varsayma.
- **Testler:** her görevden sonra `npm run test:all` (şu an 68) ve imkân varsa `npm run test:browser` (18) yeşil olmalı. Yeni davranışa test ekle; mevcut testleri kapatma ya da gevşetme.
- **Yayın:** Cloudflare erişimin yok; yayınlama, raporda "yayın bekliyor" yaz. `kutup/data/` ve anahtarlar asla commit'e, loga ya da sohbete girmez.
- **Arayüz kuralları:**
  - Metinlerin hepsi Türkçe ve samimi.
  - 375px'te yatay taşma yok, telefonda yazı 10px'in altına inmiyor.
  - Dinamik isimden sonra Türkçe ek yok ("Kütüpte: Elif" gibi kalıplar).
  - Ana ekranda ilk soru hep "kim nerede?".
  - Hareket: tek açılış koreografisi, gerisi eyleme cevap; `prefers-reduced-motion` destekli.
  - Batur "silikleşerek, hayalet gibi beliren" animasyonları sevmiyor: şeyler yerine konarak, büyüyerek ya da açılarak gelsin.
- **Bitiş:** `kutup/ASTRA_RAPOR_2.md` yaz (görev başına: ne yapıldı, dosyalar, commit'ler, göç numaraları, testler, bilinen açıklar). `HANDOFF.md` §6b'ye kısa bir "Astra 2. tur" maddesi ekle. Batur'a 5–8 satırlık Türkçe özet ver.

## Görev 1 — Bildirimde teslim garantisi (bildirimin 2. katmanı)

1. katman yayında: abonelikler oturuma bağlı, geliş bildirimi `Urgency: high`, zil düğmesi deneme bildirimi gönderiyor (HANDOFF §6b, "Bildirim ve senkron sağlamlaştırma"). Şimdi bildirimin gerçekten ulaştığını bilmek ve ulaşmayanı yeniden denemek istiyoruz.

- **Giden kutusu:** yeni `push_outbox` tablosu (id, endpoint, tablo, payload, urgency, ttl, attempts, next_at, created, status). `deliver()` önce buraya yazsın, sonra hemen göndermeyi denesin.
  - 2xx gelirse kayıt silinir.
  - 404/410 gelirse abonelik ve kayıt silinir.
  - 429, 5xx ya da ağ hatasında `next_at` artan aralıkla (30 sn, 2 dk, 10 dk) ileri alınır. En fazla 4 deneme; TTL geçmişse bırakılır.
- **Zamanlayıcı:** `wrangler.jsonc`'ye dakikalık Cron Trigger ekle. Worker'da `scheduled()` bekleyen kayıtları sınırlı sayıda (ör. 50) göndersin. Node tarafında aynı işi `setInterval` yapsın.
  - D1 ücretsiz planda günlük 5M satır okuma bütçesi var: `next_at` için indeks kur, tam tarama yapma.
- **Teslim makbuzu:**
  - Servis çalışanı `push` olayında bildirimi gösterdikten sonra `POST /api/push/ack {id}` yapsın. Yük bir `id` taşısın; anonim, kimlik doğrulamasız ama tahmin edilemez bir id kullan.
  - Sunucu abonelik başına `last_ack` tutsun.
- **Görünürlük:**
  - `/batur` → Ekipler: üye satırında "🔔 2 cihaz · son ulaşan 3 dk önce" ya da "⚠ bildirim ulaşmıyor".
  - Kişinin profilinde: "Bu cihaza test bildirimi gönder" düğmesi.
- **İsteğe bağlı:** geliş bildiriminde "Yoldayım 🛵" eylem düğmesi (Android ve masaüstü). Servis çalışanı `POST /api/presence {status:"coming"}` yapsın (çerez aynı kökene gider).
- **Testler:** Node ve Worker'da, sahte push alıcısıyla:
  - 500 dönen alıcıya yeniden deneme yapılıyor.
  - 410'da abonelik siliniyor.
  - Makbuz `last_ack`'i güncelliyor.
  - Cron işi bir kaydı iki kez göndermiyor (eşzamanlı iki tetikleyici).

## Görev 2 — Gizli rozetler (Paket 4'ün tamamı)

Altyapı var: göç 12 `achievements(member_id, key, created)`, `POST /api/achievements` izin listesiyle (`ACHIEVEMENTS = ["black-hole"]`, `server/app.js`). Kara delik kâşifi rozeti çalışıyor. İstemci tarafındaki egg'ler HANDOFF §6b'de "Paket 4 ön sürümü" başlığında.

- **Rozetler** (mümkün olan sunucuda doğrulansın, istemcinin "kazandım" demesine güvenilmesin):
  - **Şşşt:** tamamı büyük harfli pano mesajı. Sunucu `/messages`'ta Türkçe büyük harf kuralıyla tespit edip yazar.
  - **Çay:** panoya tam "çay". Sunucuda.
  - **Gece kuşu:** 03.00–05.00 arası açılış (Türkiye saati). Sunucuda `/session` ya da `/state` ilk çağrısında saatle.
  - **Gizli not:** imzaya uzun basma. İstemci bildirir, izin listeli.
  - **Kedi dostu:** Mürekkep yokken köydeki kediye 3 dokunuş yerine şimdilik avatarına 5 hızlı dokunuş. İstemci bildirir.
  - **Kara delik kâşifi:** mevcut.
  - **Köy kilometre taşları:** ilk bina, 10. bina, 25. bina. Sunucu `settleFocus`'ta türetir.
  - **İlk "Ben geldim!", 7 gün üst üste kütüpte, ilk plan:** sunucuda.
  - Toplam 12 olsun.
- **Profil (Benim köşem):** "Gizli rozetler: n/12"; bulunmayanlar "???" ve silüet, bulunanlar adı ve tarihiyle.
  - Rozet kazanıldığı anda küçük bir kutlama: Mürekkep henüz yok, rozet rozet ekranın üstünden "yerine oturarak" insin.
  - Kazanılan rozetler `state` içinde yalnızca kişinin kendisine gitsin.
- **🦉 avatarı:** gece kuşu rozeti olanların avatar listesinde açılsın. Sunucu `profile()` izin verilen avatarı rozete göre doğrulasın.
- **Testler:** her sunucu rozeti için uçtan uca test; istemci rozetinin izin listesi dışında reddi; ayrılınca silinmesi.

## Görev 3 — Mola oyunları (Paket 8)

Onaylı karar: oyunlar **yalnızca molada** açılır, yani durum "Molada" ya da seans son 10 dakika içinde bitmiş. İnşaat sırasında kapalıdır.

- **Kahve çarkı ☕:** şu an kütüpte ya da molada olanlar arasında kahveyi kimin ısmarlayacağını seçer.
  - Sonuç sunucuda belirlensin (kriptografik rastgele) ki herkes aynı sonucu görsün.
  - Panoya sistem mesajı olarak düşsün: "Kahve çarkı: bu sefer Deniz ısmarlıyor ☕".
  - Çark animasyonu sonucu sunucudan alıp ona doğru yavaşlasın.
  - Kişi başına saatte en fazla 3 çevirme.
- **Kütüple:** günde bir Türkçe 5 harfli kelime (Wordle benzeri).
  - **Kelimeler:** temiz bir Türkçe kelime listesi hazırla: ≥ 400 yanıt kelimesi, ≥ 3000 geçerli tahmin. `shared/kutuple-words.js`; büyük dosyaysa ayrı chunk olsun.
  - **Türkçe harfler:** Ç Ğ I İ Ö Ş Ü doğru işlensin; i/İ ve ı/I ayrımına dikkat (HANDOFF'taki `toLocaleLowerCase("tr")` tuzağı).
  - **Günün kelimesi:** Türkiye tarihinden deterministik seç; sunucu da aynı kelimeyi bilsin. Sonuç sunucuda doğrulansın, kelime istemciye gitmesin.
  - **Paylaşım:** renkli kare sonucu panoya tek dokunuşla düşsün (🟩🟨⬜). Günlük tek oyun, ilerleme sunucuda.
  - **Klavye:** ekranda Türkçe Q klavye düzeni.
- **Yer:** "Pano" ya da "Kütüp" sekmesinde molada beliren küçük bir "Mola köşesi" kartı. Ana ekranda "kim nerede?" sorusunu gölgelemesin.
- **Testler:** kelime listesi testi (5 harf, yinelenen yok, Türkçe harf kümesi); günün kelimesinin sunucu ve istemcide aynı tarih için aynı olması; sonuç doğrulama; çark sonucunun herkes için aynı olması; molada değilken 403.

## Görev 4 (isteğe bağlı, en zorlu) — Mürekkep, maskot kedi (Paket 2)

Ayrıntılı tarif HANDOFF §7 "Paket 2". Özeti:
- **Karakter:** smokin desenli küçük kütüphane kedisi, bir patisi mürekkep lekeli, yuvarlak okuma gözlüğü, atkısı `var(--accent)`.
- **Çizim:** parçalı, gradyansız SVG. `Mascot` bileşeni `pose`, `size` ve `say` alır.
  - 9 poz: oturma, uyuma, el sallama, kitap okuma, alkış, şok, şşşt, baretli şef, gece kuşu.
  - Bekleme hareketleri: göz kırpma, kuyruk, kulak.
- **Mesaj bankası:** `src/mascotLines.js`; olay başına 8–15 doğal Türkçe cümle, ekran başına en fazla bir balon, aynı cümle arka arkaya gelmesin.
- **Tanıtım:** katıldıktan sonra cihaz başına bir kez 3 kart ("Kim nerede, artık sormak yok", "Odaklan, köyüne ev dik", "Batur'a ne istersen yaz"). Son kartta bildirimi açma ve iPhone için ana ekrana ekleme tarifi.
- **İlk gün görevleri kartı:** profilini süsle, ilk "Ben geldim!", bildirimleri aç, ilk kulübeni dik. Durumlar sunucudan türetilsin.
- **Yasak:** şantiye sahnesine ve köye Mürekkep yerleştirme. Claude onları kendi işiyle bağlayacak; sen bileşeni ve tanıtımı bitir.
- Kalite çıtası yüksek. Emin olmadığın tasarım kararlarını raporda göster (ekran görüntüleriyle, ama PNG'leri commit'leme).
