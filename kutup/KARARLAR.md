# Kütüp karar kaydı

Her biten işin ne yaptığı, hangi kararların neden verildiği ve Batur'un ne dediği burada durur.

**Nasıl okunur:** Tamamını okuma. Önce aşağıdaki dizine bak, sonra yalnızca işinle ilgili kayıtları kodla ara (ör. Grep `### n06`). Görsel kararların özeti ayrıca DESIGN.md bölüm 9'da.

**Nasıl yazılır:** İş bitince "Kayıtlar"ın en üstüne ve dizine ekle:

```
### <kod> · <iş adı>
<alan> · <tarih> · <commit>

**Ne yapıldı:** ...
**Kararlar ve nedenleri:** ...
**Batur'un sözleri:** "..."
**Denenip vazgeçilenler:** ...
**Dosyalar:** ...
```

## Dizin

Açık işler panoda, bu sırayla (Batur onayladı, 16 Ekim akşamı): Kara v2'nin yerleşmesi, n24 Ses turu, n28 Haftalık hikâye, n29 Anında ve hızlı, n30 Masa haritası, n14 Başarımlar. Kara'nın eski geçmişi Arşiv'deki "Kara yön değişikliği" bölümünde.

| Kod | İş | Alan | Tarih | Commit |
|---|---|---|---|---|
| n36 | İnşaat tam şov, 1. tur: pil, mobil vinç, kirişler, temel su yalıtımı, çatı OSB + örtü, mantolama | Şantiye | 17 Eki 20:15 | PR (claude/n36-insaat-sov) |
| n36b | İnşaat tam şov, 2. tur: duvara göre yapım sistemi (yığma kagir, ahşap karkas, çelik + cam) | Şantiye | 17 Eki | PR (claude/n36-insaat-sov-2) |
| d28 | Katılma eşiği: arkadaşın oturumuna katılmak için en az 5 dakika | Birlikte | 17 Eki 16:00 | 62386ef8 (PR #21) |
| n35 | Anket sonrası dört ekleme: rozet Pano duyurusu, zarf sallanması, cihaz adları, şifre değişince sor | Anket | 17 Eki 16:00 | 62386ef8 (PR #20) |
| n34 | Plan paylaşma: plan linki WhatsApp grubuna, linkten "Varım" ya da "Gelemem" | Birlikte | 17 Eki 15:50 | 62386ef8 (PR #19) |
| n32 | Çalışma eşi: kiminle beraberken en verimlisin, istatistiklerde ve haftanın hikâyesinde | Birlikte | 17 Eki 13:20 | 5b7d4593 (PR #17) |
| n14 | Başarımlar: 16 rozet (3'ü gizli), geçmişten geriye dönük, vitrin, kişi kartında rozetler, kazanma anı | Başarım | 17 Eki 05:35 | 5b7d4593 (PR #16) |
| d27 | Diğer cihazlardan çıkış: Hesap ve cihazlar'da açık cihazlar | Güvenlik | 17 Eki 05:30 | 5b7d4593 (PR #15) |
| n30 | Masa haritası: salonların kuşbakışı krokisi, arkadaşlar masalarında, boş sandalyeye dokununca "Geldim" | Kütüphane | 17 Eki 05:25 | 5b7d4593 (PR #14) |
| d26 | Ana ekran simgesi: iPhone köşeleri, Android dairesi, bildirim rozeti | Cila | 17 Eki 05:10 | 5b7d4593 (PR #13) |
| n28 | Haftanın hikâyesi: dokundukça ilerleyen haftalık özet, paylaşmalık okuyucu kartı, Pazar bildirimi | Birlikte | 17 Eki 05:06 | 5b7d4593 (PR #12) |
| d25 | Satır sonları: tek kalan kelime ve emoji yok | Cila | 17 Eki 05:05 | 5b7d4593 (PR #11) |
| d24 | Görsel cila: zarf, Batur paneli telefonda, 44 px dokunma alanları | Cila | 17 Eki 04:55 | 5b7d4593 (PR #10) |
| n24 | Ses turu: altı odak sesi yeniden, daha gerçekçi | Ses | 17 Eki 04:40 | 5b7d4593 (PR #9) |
| d23 | Hesap güvenliği: şifre değişikliğinde şu anki şifre, deneme ve bildirim sınırları | Güvenlik | 17 Eki 04:25 | 5b7d4593 (PR #8) |
| n29 | Anında ve hızlı: canlı oda, ihtiyaç anında yüklenen ekranlar, anında açılış | Altyapı | 17 Eki 04:10 | 5b7d4593 (PR #7) |
| n31 | Kara v2: ChatGPT'nin yeni Kara hareketlerini yerleştir | Maskot | 17 Eki 03:50 | 5b7d4593 (PR #6) |
| n25 | Hesaplar arası geçiş: bir cihazda birden fazla hesap | Hesap | 17 Eki 02:20 | 76381788 · eb4e2ba9 |
| d22 | Ana sayfa hata avı: 6 hata (ekip kartı, üst çubuk, filtre, kart hizası, ay, odak halkası) | Düzeltme | 17 Eki 02:30 | 4d5a5cfb |
| n23 | Tema revizyonu: altı kapsamlı tema paketi | Tema | 17 Eki 01:00 | 82f2136e · a0f366e1 |
| n27 | Vitrin ve cila: Gökyüzü girişi, gizli davet, sahte basılabilir avı | Tasarım | 16 Eki 23:00 | 1743855a |
| n26 | Köy 2.0: odak stüdyosu ve yaşayan harita | Köy | 16 Eki 21:00 | 00990aa5 · d5651113 · f541476a |
| n06 | Kara baştan: sevimli kara delik, çatıda yaşayan işlevli kedi | Maskot | 16 Eki 18:30 | 901347b4 |
| n18-2 | Görsel şölen turu: katmanlı gökyüzü, zengin ana sayfa, hareket ayarı, temalar, cevaplar | Tasarım | 16 Eki 19:00 | ea86b4c4 |
| n17 | Menü akışı: 4 sekme, Ben sayfası, yeni ana sayfa | Gezinme | 16 Eki 14:30 | c6162645 |
| n18 | Canlı site, aşama 1: yaşayan gökyüzü ve hareket anları | Tasarım | 16 Eki 14:30 | c6162645 |
| d21 | Yeni çalışma sistemi: tasarım rehberi, karar kaydı, kodlu pano | Sistem | 16 Eki 10:05 | ef11b80d |
| n16 | Tema düğmesi ana ekranın sağ üstünde | Tema | 16 Eki 10:05 | 16e35609 |
| n13 | Özgün çizilmiş avatarlar | Profil | 16 Eki 01:30 | da136d96 |
| n15 | Karanlık tema (hava kararınca otomatik) | Tema | 15 Eki 21:00 | 628de73a |
| n12 | Arkadaşlarla birlikte çalışma | Birlikte | 15 Eki 19:45 | b5f906fd · 949dc037 · e7d54230 |
| d20 | Gün ışığı ve mevsimler | Köy | 15 Eki 19:20 | 436f8dfb |
| n03 | Kalan şantiye cilası | Şantiye | 15 Eki 19:20 | 436f8dfb |
| n05 | Köy görselleri 2. parça | Köy | 15 Eki 19:20 | 436f8dfb |
| d19 | Ses mikseri, ekran açık tutma, Odak ekranı | Odak | 15 Eki 18:30 | e091904a · 3d180a1d |
| n11 | Ekonomi 3. faz | Katalog | 15 Eki 17:05 | ccd6df1b · 10ea953a |
| d18 | İnşaat kuralı cihaza göre | Şantiye | 15 Eki 14:15 | 701d6fbf |
| d17 | Haftanın yapısı, seri dondurma, sarmaşık | Katalog | 15 Eki 14:00 | ccd6df1b |
| n10 | Ekonomi 2. faz | Katalog | 15 Eki 13:45 | 7d52ac51 |
| d16 | Nadir planlar ve nadir yapılar | Katalog | 15 Eki 13:20 | a7b62152 |
| n04 | Olay Ufku Gözlemevi | Paket 3 | 15 Eki 13:20 | a7b62152 |
| d15 | İmece, yapı etkileri, koleksiyon | Katalog | 15 Eki 13:10 | 33fa1525 |
| d14 | Herkesin istatistikleri | İstatistik | 15 Eki 12:58 | 1cb7c5a3 |
| d13 | Komuta merkezi kapısı ve yeni avatarlar | Hesap | 15 Eki 12:45 | ec97f5e4 · 80fe6983 |
| d12 | Seri bonusu ve '+25 dk devam' | Katalog | 15 Eki 10:12 | 0ecfcfd5 |
| n02 | Tuğla ekonomisi ve yapı kataloğu (1. faz) | Katalog | 15 Eki 10:05 | 6af2c9a3 |
| n07 | Makinelerin birlikte çalışması | Şantiye | 15 Eki 09:00 | 964200e1 |
| n08 | Mikser → vinç kovası, malzeme teslim kamyonu | Şantiye | 15 Eki 09:00 | 964200e1 |
| n09 | Grobeton oluğu ve geri dolgu | Şantiye | 15 Eki 09:00 | 964200e1 |
| n01 | Ekskavatör ve damperli kamyon ayrıntısı | Şantiye | 15 Eki 08:10 | 11e77097 |
| d11 | Kule vinç, pompa, mikser, lentolar | Şantiye | 15 Eki 07:55 | f333d709 |
| d09 | Makineler ve işçiler | Şantiye | 15 Eki 07:30 | bc5f02d3 |
| d10 | Malzeme yığınları, çatı makası, teslim töreni | Şantiye | 15 Eki 07:30 | bc5f02d3 |
| d08 | Betonarme iş akışı (24 iş kalemi) | Şantiye | 14 Eki 20:45 | 792aeb1f |
| d07 | Köy görselleri 1. parça | Köy | 14 Eki 20:25 | e0c50e97 |
| d06 | Salonlar: Adnan ve Müjgan | Durum | 14 Eki 20:05 | 11332a9b |
| d03 | Planların görünmemesi | Senkron | 14 Eki 19:55 | 62d0fcb7 |
| d05 | Kara delik kapısı ve geliştirici rozeti | Paket 3 | 14 Eki 19:40 | 013f4da2 |
| d04 | Kayan oturum, JSON geri yükleme, tarayıcı testi | Hesap | 14 Eki 19:25 | 83674000 |
| d02 | Bildirimleri sağlamlaştırma | Bildirim | 14 Eki 19:05 | 4ea95d31 |
| d01 | Astra denetimini inceleme ve yayın | Denetim | 14 Eki 17:00 | 84f7f0fd |

## Kayıtlar (yeniden eskiye)

### n36b · İnşaat tam şov, 2. tur: yapım sistemleri
Şantiye · 17 Eki 2026 · PR (claude/n36-insaat-sov-2, 1. turun üstüne) · göç yok

**Ne yapıldı:** Her yapı duvarının söylediği sistemle yapılıyor (`systemOf` in `src/construction.js`). Temel (hafriyat, grobeton, su yalıtımı, radye) hepsinde aynı; katlar ve cephe değişiyor. Taşıyıcı sistemin bittiği an betonarmede 0,55, diğerlerinde 0,68 (betonarmenin dolgu duvarı da o an biter); çatıdan sonrası herkeste aynı zamanda.
- **Betonarme** (krem, adaçayı: Konak, Kır Kahvesi, Çiçekçi, Yel Değirmeni, Deniz Feneri): değişmedi. Dolgu duvar kalemi "Dolgu duvar: gazbeton bloklar ve lentolar" oldu.
- **Yığma kagir** (tuğla, taş: Fırın, Köy Postanesi, Kütüphane, Saat Kulesi, Gözlemevi, rastgele tuğla/taş evler): her katta duvar sıra sıra örülür (tuğlada şaşırtmalı derz, taşta iri sıra), lentolar her iki yana 20 cm oturur. Köşe ve duvar birleşimlerinde düşey hatıl donatısı önce dikilir, duvar dişli örülür, sonra kalıp ve beton. Ardından yatay hatıl + döşeme kalıbı, donatısı, betonu (betonarmedeki kod). Hatıllar cephede gri bant olarak görünür; son kalem "Cephe: derz dolgusu, hatıllara tuğla kaplama" (taşta taş).
- **Ahşap karkas** (ahşap: Bostan Evi, Sahaf, Çay Ocağı): taban kirişi ankrajı, 40 cm aralıklı dikmeler, pencere altı ve üstünde kısa dikmeler, lentolar, çift başlık, köşelerden gömme çaprazlar; döşeme (üst katta tavan) kirişleri ve OSB. Sonra dışa OSB levhalar ve rüzgâr bariyeri, en son ahşap dış kaplama. Betonda pompa ve mikser yalnız temelde.
- **Çelik + cam** (Cam Sera): ankraj bulonları temel betonundan çıkar, taban plakalı I-kolonlar, çevre kirişleri ve bulonlar, kenar açıklıklarda X çaprazlar; çelik makaslar, alüminyum kayıtlar, temperli cam çatı; cam cephe kapılardan önce takılır.
- Malzeme yığınları ve vinç yükleri sisteme göre: tuğla/taş paleti, kerestelik, çelik profil; vinç kereste demeti, OSB, I-profil (yönlendirme ipiyle) taşır, düşey hatıla betonu kovayla döker. İskele yığmada duvar baş hizasını geçince, ahşapta karkas çıkınca, çelikte cam için kurulur.
- **Testler:** `tests/site.test.js` sistemlere göre: her sistemin kendi kalemleri her katta var, ahşapta kaplama kirişlerden sonra, çelikte cam kapıdan önce, betonarme dışında kolon kalemi yok; katalogdaki 8 yapının sistemi beklenen.

**Kararlar ve nedenleri:**
- Sistem duvardan çıkıyor, katalog değişmedi: tuğla/taş görünen yapının içinde betonarme iskelet + mantolama tutarsızdı.
- Saat Kulesi ve kule 3 katlı yığma: TBDY 2018 yığma binada kat sayısını deprem tehlikesine göre sınırlar; 3 kat ancak düşük tehlikeli yerlerde olur. Oyunda bırakıldı, raporda not.
- Tüm sistemlerde radye temel: yığma ve ahşapta sürekli temel de olur, ama ortak temel kodu ve süre dengesi için tek tip kaldı.
- Cephe bitince (0,93) iç taşıyıcı çizilmiyor: görünmüyor, sahneyi hafifletiyor (Fırın'da 720 şekil gidiyor).

**Geri alma:** dalı geri al; göç yok, veri değişmedi.
**Dosyalar:** `src/construction.js`, `src/Village.jsx`, `src/crane.js`, `src/crew.js`, `src/sitedetail.js`, `tests/site.test.js`.

### n36 · İnşaat tam şov, 1. tur
Şantiye · 17 Eki 2026 · PR (claude/n36-insaat-sov) · göç yok

**Ne yapıldı:** Batur inşaatın baştan incelenmesini istedi (rapor: `/mnt/project-files/kutup/insaat-inceleme/RAPOR.md`) ve "Tam şov" kademesini seçti. Üç turun ilki:
- **Pil:** Sahne üst üste duran SVG sayfalarından oluşuyor; makineler, işçiler ve vinç kendi katmanlarında, yalnızca değişen parça yeniden çiziliyor, 12 kare/sn. Vincin direği bir kez çiziliyor. Sahne ekranda görünmezken, sekme arkadayken ve odak ekranı açıkken (altında kalan kopya) duruyor. Ölçüm (4x yavaş işlemci, 375 px, kulübe): hafriyat %46 → %38, döşeme betonu %57 → %45, duvar %49 → %38 meşgul. Odak ekranı açıkken artık tek sahne çalışıyor (önce iki).
- **Başlık:** şantiye başlığı katalogdaki yapının adını yazıyor ("🥖 Fırın"), eski türü ("İki katlı ev") değil.
- **Mobil vinç:** kule vinç yalnız kulede. Kulübe ve evde kamyona monteli teleskopik vinç kaldırma işleri için gelir: ön sol şeritte durur, ayaklarını açar, bomu önce kamyon yönünde kaldırır, sonra döner; işi bitince toplar ve gider. Pompalı dökümlerde (temel, döşeme) yerini pompaya bırakır. Gazbeton paletleri sağa kaydı ki vinç kamyonu üstlerine park etmesin.
- **Kirişler:** her katta kolonlar kiriş altına kadar dökülür; dikmeler, kiriş kalıpları (kolon aksından kolona, geniş planda ortada da), döşeme kalıbı; kiriş donatısı (üst çubuklar ve etriyeler), döşeme hasırı; kiriş ve döşeme birlikte dökülür, kirişler döşemenin altından sarkık görünür. İş kalemleri "dikmeler, kiriş ve döşeme kalıbı", "kiriş ve döşeme donatısı", "kiriş ve döşeme betonu".
- **Temel su yalıtımı:** grobetondan sonra yeni iş kalemi; bitümlü örtü şerit şerit, bindirmeli serilir; rulolar yığından eksilir.
- **Çatı:** makaslar ve aşıklar → OSB kaplama → su yalıtım örtüsü → kiremit, her biri saçaktan mahyaya. Üç ayrı iş kalemi; vinç OSB levhası da taşır.
- **Mantolama:** sıva + boya cepheli binalarda (krem ve adaçayı duvarlar) yalıtım levhaları şaşırtmalı sıra sıra yapıştırılır ve dübellenir, sonra file + ince sıva, sonra boya. Üç iş kalemi. Tuğla, taş, ahşap ve cam duvarlar 2. turda kendi yapım sistemlerine geçecek; şimdilik eski tek kalem.
- **Testler:** yeni `tests/site.test.js` (4 test): iş planı oturumu boşluksuz kaplar ve yeni kalemleri içerir, geniş planda 6 kiriş, mobil vinç pompalı dökümlerde yok, bütün katalog yapıları için her ilerlemede çizimlerde NaN yok.

**Kararlar ve nedenleri:**
- Mobil vinç pompalı dökümde gidiyor: gerçekte pompa ile vinç aynı şeritte çalışmaz, kiralık vinç işi bitince gider.
- Kiriş derinliği 0,3 birim, kolonlar kiriş altına kadar: kolon-kiriş birleşimi kirişle beraber dökülür.
- Mantolama yalnız boyalı cephelerde: tuğla ve taş gibi görünen yapıların doğru yapım sistemi 2. turun işi (n36b).
- Ölçüm aracı: `/mnt/project-files/kutup/araclar/site_measure.py`.

**Batur'un sözleri:** "aga inşaat işini animasyon ve sistem komple ele alırsak geliştirilecek yerler var mı" · "ben sonuçta ODTÜ'de inşaat mühendisliği okuyom ... sınırları zorlayalım, daha ne kadar accurate oluruz" · kademe kartında "Tam şov".
**Geri alma:** dalı geri al; göç yok, veri değişmedi.
**Dosyalar:** `src/Village.jsx`, `src/construction.js`, `src/crane.js`, `src/crew.js`, `src/sitedetail.js`, `src/VillageMap.jsx`, `src/App.jsx`, `src/motion.css`, `tests/site.test.js`, `package.json`.

### d28 · Katılma eşiği: arkadaşın oturumuna en az 5 dakika kala
Birlikte · 17 Eki 2026 · 62386ef8 (PR #21, Worker bfc56968) · göç yok

**Ne yapıldı:** Bir arkadaşın odak oturumuna son bir iki dakikada katılmak bitmiş oturum sayılıyor, günün ilk oturumu bonusunu (+10 🧱) ve nadir plan şansını neredeyse hiç odaklanmadan veriyordu (denetimde E1). Artık bitmesine 5 dakikadan az kalan oturuma katılınmıyor.
- Sunucu: `/api/focus` `joinMember` ile gelince arkadaşın oturumunun bitmesine en az `JOIN_LEAD` (5 dk, `shared/catalog.js`) kalmış olmalı; yoksa 400, "Bu oturumun bitmesine 5 dakikadan az kaldı. Yeni bir oturum başlat."
- Uygulama: odak kartındaki arkadaş satırında "Katıl" düğmesi ve "katılırsan imece +%5" yazısı en uzun oturumun 5 dakikadan azı kalınca gizleniyor; davet bildiriminden açılan katılma şeridi de aynı eşikle kayboluyor (önceden 1 dakika).
- **Testler:** 1 yeni birim testi (6 dakika kala katılır, 4 dakika kala 400 ve mesaj). Tarayıcı kontrolü eklenmedi; görünür değişiklik yalnız düğmenin son 5 dakikada gizlenmesi.

**Kararlar ve nedenleri:**
- **Eşik 5 dakika:** Batur'un anket cevabı (denetimde önerilen 10 dakikaydı; "Daha esnek: 5 dakikadan az kalana katılınamaz" seçildi).
- **"Ekibi çağır" bildirimi 10 dakikada kalıyor:** Batur'un seçtiği şıkta böyle yazıyordu; davet yalnız 10 dakika ve üstü oturumda gidiyor, bu değişmedi.
- Eşik sunucuyla uygulamada tek sabitten (`JOIN_LEAD`) okunuyor; değiştirmek tek satır.

**Batur'un sözleri:** anket kartında "5 dakika" (17 Eki, anket turu başlığı).
**Geri alma:** `shared/catalog.js`'te `JOIN_LEAD = 60000` eski davranışa en yakın hal (şerit 1 dakikada kayboluyordu, sunucu sınırı yoktu).
**Dosyalar:** `shared/catalog.js`, `server/app.js`, `src/Together.jsx`, `tests/core.test.js`.
### n35 · Anket sonrası dört ekleme
Anket · 17 Eki 2026 · 62386ef8 (PR #20, Worker bfc56968) · göç 23 (`sessions.device`)

**Ne yapıldı:** Batur 17 Ekim'de canlı sitede 12 anketi tek tek cevapladı (`/mnt/project-files/kutup/anket-cevaplari.md`). "İyi + fikir" seçtiği dördü:
- **Rozet Pano duyurusu (n14):** bir gün içinde kazanılan rozet Pano'ya "“Maraton” rozetini kazandı 🏅" diye düşer; gizliler "gizli bir rozet buldu 🤫". Aynı anda ikiden fazla açılan (geçmişin sayılması) sessiz. İki kişi kartı aynı anda açarsa satır bir kez yazılır (rozet satırından önce, yokken).
- **Zarf sallanması (d24):** isteğine yeni cevap gelince Ben'deki "Batur'a ilet" simgesi ve kartın 💌 zarfı bir kez sallanır; hareketi azalt ve Kıpırtısız'da durur.
- **Cihaz adları (d27):** Açık cihazlar kutusunda her cihaz kendi satırında ("iPhone · Safari", "Windows · Chrome", "iPhone · ana ekran") ve son görülmesiyle; tek tek "Çık". Birden çok cihazda "Hepsinden çık". Ad, uygulama her açıldığında tarayıcı bilgisinden yazılır.
- **Şifre değişince sor:** yeni şifre kaydedilince başka cihaz açıksa "onlardan da çıkayım mı?" sorulur.

**Kararlar ve nedenleri:**
- Cihaz kimliği saklanan özetin ilk 16 karakteri; çerezin kendisi hiç dönmez. Başkasının cihazı 404.
- Eski oturumların adı o cihaz bir sonraki açılışta dolar; o zamana kadar "Bilinmeyen cihaz".
- Rozet duyurusu bildirim göndermez, yalnız Pano satırı.

**Batur'un sözleri:** "iyi güzel tamam da ... alternatif eğer aklında bir fikir varsa ... onu bana söyleyebilirsin" (17 Ekim, anket).
**Geri alma:** rozet: `server/app.js` `badgeNews` ve iki duyuru bloğu; zarf: `src/polish.css` sondaki "Anket" bölümleri ve iki `wiggle` sınıfı; cihaz adları: `/devices` yolları ve `Account.jsx` `OtherDevices` (sütun zararsız); şifre: `AccountBox`'taki `if (value.password)` bloğu.
**Dosyalar:** `server/app.js`, `server/schema.js`, `src/Account.jsx`, `src/MePage.jsx`, `src/Requests.jsx`, `src/polish.css`, `tests/core.test.js`, `tests/browser_smoke.py`.
### n34 · Plan paylaşma: plan linki gruba, linkten "Varım" ya da "Gelemem"
Birlikte · 17 Eki 2026 · 62386ef8 (PR #19, Worker bfc56968) · göç 22 (`plan_skips` tablosu, otomatik)

**Ne yapıldı:**
- **Plan kartı (`PlanCardModal`, `src/Modals.jsx`):** bir planı tek başına gösterir: gün, saat, ad, kim planladı; "Varım" / "Gelemem" düğmeleri; "Geliyor" ve "Gelemiyor" listeleri; "Gruba gönder" düğmesi.
- **Link:** `/?plan=<id>`. Açan kişi giriş yapmışsa kart hemen açılır; giriş yapmamışsa önce girer, kart sonra açılır. Plan silinmiş ya da zamanı geçmişse "Bu plan artık yok." der.
- **Gruba gönder (`src/planShare.js`):** telefonda paylaşım menüsü açılır (WhatsApp dahil). Menü yoksa (bilgisayar) metin ve link panoya kopyalanır. Metin: "🗓️ Ada kütüp planı yaptı: Yarın 16:00 · Sınav haftası. Geliyor musun? Buradan söyle: <link>". Böylece grupta linke basmadan da ne zaman olduğu okunur.
- **Plan yapınca:** "Plan yap" kaydedince kart "Plan takvimde." başlığıyla açılır ve gruba atmayı önerir.
- **Ana sayfa:** plan adına dokununca kart açılır; planın sahibinde çöp kutusunun yanında gönder simgesi var. Biri "Gelemem" dediyse satırda "2 geliyor · 1 gelemiyor" yazar.
- **Sunucu:** `POST /plans/:id/answer {going}` cevabı ayarlar (aç/kapa değil; iki kez basmak bir şey değiştirmez). "Ben de" düğmesi eski "Gelemem"i siler. Plan, üye ve eski plan temizliklerinde `plan_skips` da silinir; yedek/geri yüklemeye eklendi.

**Kararlar ve nedenleri (Batur "geri alınabilir kararları sen ver" dedi):**
- **Link giriş ister:** planlar ekibe özel. Herkese açık önizleme yerine bilgiyi paylaşım metnine koydum; gruptaki herkes saati linke basmadan görüyor.
- **"Gelemem" ayrı tabloda:** "kaç kişi geliyor" sayan her yer (istatistikler, başarımlar) olduğu gibi kalsın diye `attendees`a dokunmadım.
- **Arkadaş satırında gönder simgesi yok:** telefonda "Ben de" ile yan yana sığmıyordu, başlık kısalıyordu. Arkadaşlar plana dokunup karttan gönderebiliyor.
- **Bildirim yok:** "Gelemem" kimseye bildirim atmaz; plan sahibi kartta görür.

**Batur'un sözleri:** "bir tane plan yaptım ... takvime koydum ama insanlara paylaşamıyorum ... bildirimi görmemiş olma ihtimallerine karşı ... WhatsApp'tan gruba atmak istiyorum. Millet o linkten girip plana katılıp katılmayacağını ... girebilir." (17 Ekim)
**Önizleme:** proje klasöründe `kutup/onizleme/n34/` (plan yapıldı, linkten açıldı, gelemem, ana sayfa, sahibin kartı; açık ve koyu). Araç: `kutup/araclar/plan_share_shots.py`.
**Geri alma:** `PlanModal`daki `onSaved` (kart açılmasın), `App.jsx` `openSharedPlan`, `Home.jsx` `home-plan-open` ve gönder simgesi. Tablo kalabilir; boşken bir şey değiştirmez.
**Açık:** Batur'un görsel onayı; gerçek iPhone'da WhatsApp paylaşımı denenmedi.
**Dosyalar:** server/schema.js, server/app.js, server/restore.js, src/planShare.js, src/Modals.jsx, src/App.jsx, src/Home.jsx, src/home.css, src/styles.css, tests/suite.js

### n32 · Çalışma eşi: kiminle beraberken en verimlisin
Birlikte · 17 Eki 2026 · 5b7d4593 (PR #17, Worker 3de3c058) · göç yok

**Ne yapıldı:**
- **Ölçü (`server/stats.js` `partnersOf()`):** arkadaşın bir oturumunun en az yarısında seninle aynı anda odaklandıysa o oturum "beraber" sayılır (İmece kuralıyla aynı). Böyle bir oturumun olduğu gün ikilinin "beraber günü". Verim: beraber günlerde ikisinin o gün toplam odağı, kişi başı günlük ortalama. En iyi ikili bu ortalaması en yüksek olan; eşitlikte aynı anda geçen süre, sonra üye sırası.
- **İstatistikler (Ben → İstatistiklerim):** "En iyi çalışma eşin" kutusu: yüz, ad, "beraber çalıştığınız N günde günde X odaklandın, diğer günlerinde Y", aynı anda geçen süre ve en az %10 fark varsa sağda "+%Z beraberken" (iki katı aşınca "2,3 kat"). Eş yoksa tek satır: üç ayrı gün aynı anda odaklanınca çıkar.
- **Haftanın hikâyesi:** müdavim kartından sonra "Haftanın ikilisi" kartı (iki yüz, "&", aynı anda odak süresi, kişi başı günlük odak). "Senin haftan"da "Çalışma eşin · N gün" satırı. Paylaşım kartlarında (ekip ve kişisel) birer satır; satır sınırı 5'ten 6'ya.

**Kararlar ve nedenleri (Batur "sorma, geri alınabilir karar ver" dedi):**
- **Verim = beraber günlerdeki toplam odak**, oturum uzunluğu değil: oturum süresini kişi baştan seçiyor, günlük toplam gerçekten "beraberken daha çok çalıştı mı" sorusunu cevaplıyor.
- **Eşik:** istatistikte son 30 günde en az 3 beraber gün, hikâyede o hafta en az 2. Değiştirmek için `server/app.js` `PARTNER_DAYS` / `PARTNER_MIN`, hikâye için `storyOf()` içindeki `min: 2`.
- **Gizlilik:** istatistiklerdeki eş yalnız sahibine görünür (başkasının istatistiğinde yok, sunucu hiç göndermiyor). Hikâyedeki "Haftanın ikilisi" ekibe açık, Haftanın Ustası gibi; kimsenin "en kötü eşi" ya da eş sıralaması gösterilmiyor.
- **Eş karşılıklı:** puan ikili için ortak, bu yüzden çoğu zaman iki kişi birbirini görür.
- **Video yok:** haftalık paylaşım n28'deki gibi görsel kart (PNG); eş bu kartlara eklendi.

**Batur'un sözleri:** "kim kiminle en en iyi çalıştı yani hangi insanlar beraberken en verimli, istatistiklerden herkes eşini görsün ve haftalık videoda da" (17 Ekim).
**Önizleme:** proje klasöründe `kutup/onizleme/n32/` (istatistik, ikili kartı, senin haftan, paylaşım kartları; açık ve koyu).
**Geri alma:** istatistik için `src/Stats.jsx` `Partner` satırı ve `/stats/:id` içindeki `if (id === m.id)` bloğu; hikâye için `Story.jsx` `cardsOf()` içindeki `duo` satırı.
**Açık:** Batur'un görsel onayı.
**Dosyalar:** server/stats.js, server/app.js, src/Stats.jsx, src/stats.css, src/Story.jsx, src/story.css, tests/core.test.js

### n14 · Başarımlar: rozet vitrini ve kazanma anı
Başarım · 17 Eki 2026 · 5b7d4593 (PR #16, Worker 3de3c058) · göç yok (göç 12'deki `achievements` tablosu kullanılıyor)

**Ne yapıldı:**
- **16 başarım (`shared/achievements.js`):** İlk tuğla (ilk yapı) · Bir hafta (7 gün seri) · Bir ay (30 gün seri) · Sabah erkencisi (09.00'dan önce başlayan 5 oturum, 30 dk+) · Gece kuşu (21.00–04.00 arası başlayan 5 oturum, 30 dk+) · Maraton (bir günde 4 saat) · Yüz saat (toplam 100 saat) · İmece ustası (arkadaşlarla aynı anda 10 oturum) · Koleksiyoncu (8 farklı yapı) · Gönüllerin mimarı (bir yapıya 5 beğeni) · Müdavim (20 ayrı gün kütüpte) · Haftanın Ustası (bir taç) · Anıt ustası (bir anıt). Gizli üç: Kara delik kâşifi (eski rozet), Şşşt! (panoda tamamı büyük harf), Çay saati (panoya yalnız "çay").
- **Sunucu hesaplar, geçmiş sayılır (`server/achievements.js`):** rozetler kayıtlardan (odak, binalar, tuğla defteri, haftalık taç, gelişler, mesajlar) çıkarılır; her rozetin tarihi onu kazandıran oturum, bina ya da gündür. İlk kez görülen rozet `achievements` tablosuna yazılır, sonra kayıtlar değişse de kalır. Yeni yol: `GET /api/achievements/:id` (yalnız aynı ekip).
- **Vitrin (Ben → Başarımlar):** 16 rozet üç sütunda; açılanlar renkli ve tarihli, açılmayanlar soluk, nasıl açılacağı ve ilerleme çubuğu ("12 / 30 gün"). Gizliler bulunana kadar "?".
- **Kişi kartı:** arkadaşın açtığı rozetler, en yenisi önde, "Başarımlar 4 / 16".
- **Kazanma anı:** alt menünün üstünde koyu küçük bir kart, rozet zıplayarak gelir, kıvılcım saçılır; dokununca vitrin açılır, 12 sn sonra kendi kapanır. Uygulama tuğla, durum ya da kendi pano mesajın değişince 20 sn'de bir en fazla bir kez sorar. İlk açılışta geçmişten gelenler tek kartta toplanır: "Geçmişinden 6 başarım açıldı".
- **Çizimler (`src/achievementArt.js`):** DESIGN.md §5 çizgisi; her rozet kendi pastel madalyonunda Kütüp dünyasından bir şey (tuğla ve bayrak, takvim, gün doğumu, ay, kum saati, saat, ince belli çay bardakları, üç ev, kalpli ev, kütüphane cephesi, taç, anıt, kara delik, "Şşşt" balonu, çay).

**Kararlar ve nedenleri (tanım eksikti; Batur "kararları sen ver, geri alınabilir olsun" dedi):**
- **Liste ve eşikler:** panodaki öneri listesi, sayılar yukarıdaki gibi. Eşikler tek dosyada; değiştirmek bir sayı (kazanılmış rozetler gitmez).
- **Tuğla ödülü yok:** ekonomi dengesine dokunmamak için. İstenirse rozet başına ödül ayrı iş.
- **Başkaları görür:** açılan rozetler kişi kartında herkese açık; açılmayanlar ve ilerleme yalnız sahibine.
- **Kutlama ölçülü:** tam ekran değil, alt kartta küçük bir an; Pano'ya mesaj ve bildirim yok (geriye dönük açılan onlarca rozet panoyu doldurmasın).
- **Paket 4'ün "n/12 gizli rozet" fikri:** gizliler 3 ile başladı; diğer easter egg'ler (Kedi dostu, Gizli not) rozete bağlanınca listeye eklenir.

**Batur'un sözleri:** kayıtlarda bu işi anlatan bir mesaj yok; liste Claude'un önerisi (eski Paket 4 ile birleşti). "inisiyatif alarak ... kararları sen ver ... geri dönülebilir olsun" (17 Ekim).
**Önizleme:** proje klasöründe `kutup/onizleme/n14/` (kutlama, vitrin, yeni rozet, arkadaş kartı; açık ve koyu) ve `rozetler.png` (bütün çizimler).
**Geri alma:** eşikler ve liste `shared/achievements.js`; kutlama için `App.jsx`'teki `useAchievementWatch` ve `AchievementCheer` satırları; kişi kartı için `Modals.jsx`'teki `AchievementShelf`; tamamı için `Achievements.jsx`, `achievementArt.js`, `achievements.css`, `achievementWatch.js` ve `/achievements/:id` yolu. Tabloya yazılan satırlar zararsız; istenirse `DELETE FROM achievements WHERE key <> 'black-hole'`.
**Açık:** Batur'un görsel onayı (çizimler ve kutlama).
**Dosyalar:** shared/achievements.js, shared/pano.js, server/achievements.js, server/app.js, src/Achievements.jsx, src/achievementArt.js, src/achievementWatch.js, src/achievements.css, src/App.jsx, src/MePage.jsx, src/Modals.jsx, src/later.jsx, tests/core.test.js, tests/browser_smoke.py, tests/live-smoke.mjs

### d27 · Diğer cihazlardan çıkış: Hesap ve cihazlar'da açık cihazlar
Güvenlik · 17 Eki 2026 · 5b7d4593 (PR #15, Worker 3de3c058) · göç yok

**Ne yapıldı:** Ben → Hesap ve cihazlar'da üçüncü kutu, "Açık cihazlar". Hesabın bu cihazdan başka kaç cihazda açık olduğunu söylüyor; **Diğerlerinden çık** onay sorup hepsini kapatıyor. Kaybolan telefon, arkadaşın bilgisayarında açık kalan hesap için. Önceden bunu yalnız Batur panelden yapabiliyordu (ve o, bu cihazı da kapatıyor).
- Sunucu: `GET /api/devices` → `{ others }` (süresi dolmamış diğer oturumlar), `POST /api/devices/signout` → o oturumlar ve onlara bağlı bildirim abonelikleri silinir, `{ ok, closed }`. Bu cihazın oturumu ve bu cihazdaki diğer hesaplar (n25) kalır.
- Kapanan cihaz bir sonraki istekte 401 alır; n25'teki akışla o cihazdaki başka hesaba ya da giriş ekranına düşer. Canlıda (Worker, yoklama) bu bir sonraki yoklamada olur; Node sunucusundaki SSE bağlantısı bir sonraki yayında ya da kalp atışında kapanır.
- Arayüz `Account.jsx`'te `OtherDevices`; "Başka cihazda da aç" kutusunun sınıfını (`device-transfer`) kullanıyor, temalarda onunla aynı görünür.
- **Testler:** 1 yeni birim testi (iki cihaz kapanır, bu cihaz ve takım arkadaşı açık kalır, kapanan cihazın aboneliği silinir, oturumsuz 401), 1 yeni tarayıcı kontrolü (dizüstünden giriş, "1 cihazda daha açık", onay, dizüstü 401). Dal d26'nın üstünde: 103 birim, 75 tarayıcı, tema 252/252.

**Kararlar ve nedenleri:**
- **Şifre değişince otomatik çıkış yok** (denetimdeki soru, Batur'un cevabı bekleniyor). Önerilen "kişi seçsin, varsayılan açık kalsın" bu düğmeyle karşılandı; şifre değiştiren kişi hemen altındaki düğmeyle diğerlerini kapatabilir. Batur otomatik isterse `/account`'ta tek satırlık değişiklik.
- **Şifre sorulmuyor.** Kötü niyetli biri en fazla sahibini diğer cihazlardan çıkarabilir; sahip şifresiyle geri girer. Kaybolan telefon anında, başka cihazdan hızlı çıkmak daha önemli.
- **Cihaz adı ya da son görülme yok.** Oturumlar cihaz bilgisi tutmuyor; yalnız sayı. Safari ve ana ekran uygulaması aynı iPhone'da iki ayrı "cihaz" sayılır (uygulamanın "Başka cihazda da aç" diliyle aynı).
- Şifresi olmayan hesapta da çalışıyor; onay metni oralarda yeniden açmak için "Giriş kodu al" gerektiğini söylüyor.

**Batur'un sözleri:** "Projeyi bir sonraki seviyeye taşıyacak iyileştirmeler. Ve özellikler."
**Geri alma:** `Account.jsx`'te `<OtherDevices … />` satırı silinir (sunucu yolları zararsız, kalabilir).
**Dosyalar:** `server/app.js`, `src/Account.jsx`, `tests/core.test.js`, `tests/browser_smoke.py`.

### n30 · Masa haritası: kim hangi masada
Kütüphane · 17 Eki 2026 · 5b7d4593 (PR #14, Worker 3de3c058) · göç yok (mevcut `location` + `desk` alanlarıyla çalışır, sunucuda değişiklik yok)

**Ne yapıldı:**
- **Harita penceresi (`src/DeskMap.jsx`, ihtiyaç anında yüklenir):** üstte salon seçimi (📚 Adnan · 📖 Müjgan, içerideki kişi sayısıyla), altında salonun kuşbakışı krokisi: üst duvarda raflar, solda pencereler, iki sıra okuma masası ve aralarında koridor, altta giriş. Her masanın iki uzun kenarında üçer sandalye.
- **Arkadaşlar masalarında:** "Geldim"de masa alanına sayı yazanlar ("24", "masa 24", "24 pencere yanı") o sandalyede avatarı ve adıyla görünür; moladakiler soluk ve ☕ ile. Sandalyeye dokununca kişinin kartı açılır. Aynı masayı iki kişi yazarsa ikisi de görünür (+1).
- **Boş sandalyeye dokun:** sandalye seçilir, altta koyu bir şerit çıkar: "Masa 14 · Adnan salonu · Buraya oturdum". Onaylayınca "Geldim" o salon ve masayla gönderilir (bildirim, Pano satırı, istatistik her zamanki gibi). Zaten içerideysen "Buraya geçtim" der.
- **Haritaya sığmayanlar:** masası sayı olmayanlar ("pencere yanı") "Salonda, masası haritada yok" altında; Kafeterya, Bahçe ya da başka yerdekiler "Başka yerde" altında.
- **Girişler:** Ana sayfa "Kim nerede?" başlığının yanında "Masa haritası" düğmesi; kütüpteyken durum kartında "Masa haritasında gör"; "Geldim" penceresinde salon seçiliyken "Masanı haritadan seç".
- **Kroki veri olarak:** `shared/rooms.js` içinde her salon için sıra sayısı ve kenar başına sandalye. Değiştirmek bütün numaraları ve haritayı değiştirir; kayıtlı bir şey bozulmaz.

**Kararlar ve nedenleri (tanım eksikti; Batur "kararları sen ver, geri alınabilir olsun" dedi):**
- **Salon düzeni temsilî:** gerçek kroki ya da fotoğraf gelmediği için Adnan 60, Müjgan 36 sandalyelik basit bir düzen. Haritanın altında "Kroki temsilî" yazıyor. Batur bir fotoğraf ya da kroki gönderince `shared/rooms.js` düzeltilir (birkaç satır).
- **Numaralandırma:** masa masa, sıra sıra; her masada önce üst kenar soldan sağa, sonra alt kenar. Gerçek numaralandırma farklıysa yine `rooms.js`.
- **Dokununca hemen "Geldim":** tanımdaki gibi; ama yanlış dokunuşa karşı bir onay şeridiyle (tek dokunuş seçer, ikinci dokunuş gönderir).
- **Masa alanı serbest kaldı:** yazıyla "pencere yanı" demek hâlâ mümkün; harita yalnız sayıları yerleştirir. Sunucu ve veritabanı değişmedi.
- **Telefonda:** pencere kenarları daraltıldı, sandalyeler 46 px (dokunma hedefi ≥ 44 px), yatay taşma yok.

**Batur'un sözleri:** Claude'un 5 önerisinden 4. madde, onaylandı (16 Ekim). "inisiyatif alarak ... kararları sen ver ... geri dönülebilir olsun" (17 Ekim).
**Önizleme:** proje klasöründe `kutup/onizleme/n30/` (telefon açık ve koyu, masaüstü).
**Geri alma:** salon düzeni için `shared/rooms.js`; girişler için `Home.jsx`'teki `map-open` düğmesi ve `status-route` bağlantısı, `Modals.jsx`'teki `map-pick`; tamamı için `DeskMap.jsx`, `deskmap.css` ve `App.jsx`'teki `modal?.map` bloğu.
**Açık:** Batur'un görsel onayı; salonların gerçek düzeni ve masa numaraları (bir fotoğraf ya da kroki yeter).
**Dosyalar:** shared/rooms.js, src/DeskMap.jsx, src/deskmap.css, src/home.css, src/Home.jsx, src/Modals.jsx, src/Modal.jsx, src/App.jsx, src/later.jsx, src/Requests.jsx, tests/core.test.js, tests/browser_smoke.py

### d26 · Ana ekran simgesi: iPhone köşeleri, Android dairesi, bildirim rozeti
Cila · 17 Eki 2026 · 5b7d4593 (PR #13, Worker 3de3c058) · göç yok

**Ne yapıldı:** Kütüp'ün telefon ana ekranındaki simgesi her gün görülen ilk şey; tasarımı (mor zeminde K ve yeşil nokta) aynı kaldı, telefonların istediği biçimlere getirildi.
- **iPhone:** `apple-touch-icon` köşeleri saydam, yuvarlak 192 px'lik simgeydi. iOS saydam yeri siyaha boyuyor ve kendi köşesini üstüne kesiyor; köşelerde ince siyah kenarlar kalıyordu. Yeni: 180×180, köşesiz, saydamlıksız `apple-touch-icon.png` (iOS köşeyi kendisi yuvarlıyor).
- **Android:** "maskable" simge saydam köşeli aynı resimdi; Android onu daireye kesince yeşil nokta kenara dayanıyordu. Yeni `icon-maskable-512.png`: zemin kenardan kenara, K ve nokta güvenli dairenin (çapın %80'i) içinde.
- **Bildirim rozeti:** Android'de durum çubuğunda Kütüp bildirimi artık genel bir simge yerine beyaz K ile görünüyor (`badge-96.png`, `sw.js`).
- Simgeler `public/icon.svg`'deki çizimden üretildi (aynı yollar; iPhone için `rx` yok, maskable'da %90 ölçek, rozette yalnız K).
- **Testler:** 99 birim (değişmedi), 67 tarayıcı (1 yeni: iPhone simgesi 180 px ve köşeleri dolu, maskable işaret güvenli dairede, rozet var; eski dosyalarla kırmızı), tema 252/252.

**Kararlar ve nedenleri:**
- Simgenin tasarımı değişmedi. Uygulamanın içindeki marka ✳ (kütüp✳), ana ekrandaki K; bu ayrılık Batur'un kararı, raporda öneri olarak duruyor.
- `icon-192.png`/`icon-512.png` ("any") ve tarayıcı sekmesi simgesi aynen kaldı.

**Batur'un sözleri:** "Şöyle baktığın zaman projenin bütünüyle uyumsuz ya da zayıf duran herhangi bir eleman olabilir."
**Geri alma:** `index.html`'de `apple-touch-icon` yeniden `/icon-192.png`, manifest'te maskable yeniden `/icon-512.png`, `sw.js`'te `badge` satırı silinir; üç yeni PNG silinir.
**Dosyalar:** `index.html`, `public/manifest.webmanifest`, `public/sw.js`, `public/apple-touch-icon.png`, `public/icon-maskable-512.png`, `public/badge-96.png`, `tests/browser_smoke.py`.

### n28 · Haftanın hikâyesi: dokundukça ilerleyen haftalık özet
Birlikte · 17 Eki 2026 · 5b7d4593 (PR #12, Worker 3de3c058) · göç yok (`weekly` tablosuna yeni bir tür satır: `story`)

**Ne yapıldı:**
- **Hikâye ekranı (`src/Story.jsx`, ihtiyaç anında yüklenir):** tam ekran kartlar; sağa dokun ilerler, sola dokun geri gelir, basılı tut durur, aşağı kaydır ya da ✕ kapatır, klavyede ok tuşları ve Esc. Üstte kart sayısı kadar ilerleme çizgisi.
- **Kartlar (söyleyecek sözü olmayan kart çıkmaz):** kapak (Kara kitap okuyor) · ekipçe odak (büyük sayı, geçen haftayla kıyas, günlere göre çubuklar) · Haftanın Ustası (taç düşer) · kütübün müdavimi (gelinen günlere "GELDİ" damgası) · sabah erkencisi / gece kuşu · rekorlar (en uzun seri, en uzun oturum, Pano mesajları) · köyde bu hafta (yeni binalar, en sevilen bina, "ANIT TAMAM" damgası) · senin haftan (yalnız sana) · kapanış. Sessiz bir haftada kapak, "Bu hafta sessiz geçti" ve kapanış.
- **Hareket:** sayılar büyükten "vurarak" iner, satırlar tek tek gelir, çubuklar sırayla yükselir, damgalar basılır. Yalnız `transform` ve `opacity`. Hareketi azalt ve Kıpırtısız'da her şey sade solarak gelir; ilerleme çizgisi ise Kıpırtısız'da da saat gibi yürür.
- **Paylaş:** o anki karta göre ekibin ya da senin "okuyucu kartı"n 1080 × 1920 PNG olarak çizilir (temanın renkleriyle, gün damgaları, kütüp mührü). Telefon paylaşma menüsünü açar (Instagram hikâyesi dahil); açamazsa resim iner.
- **Pazar 18.00 bildirimi:** "📖 Haftanın hikâyesi hazır · Ekipçe X saat odak…". O hafta odak yapan her ekibe bir kez gider (`weekly` tablosunda `story` satırı kilit görevi görür). Dokununca hikâye açılır.
- **Girişler:** Pazar 18.00'den sonra ana sayfada "Haftanın hikâyesi hazır" kartı (açılınca ya da iki gün geçince kaybolur); Ben → Ekip → "Haftanın hikâyesi" her zaman.
- **Sunucu:** `GET /api/story?week=` (son 8 hafta, yalnız kendi ekibin), hesap `server/stats.js` `storyOf()` içinde; hafta hesabı `shared/week.js`'te ortak.

**Kararlar ve nedenleri (Batur'un açık soruları):**
- **Hangi kartlar:** öneri listesindekilerin hepsi; "en çok kim geldi" kütübe gelinen gün sayısıyla, gece kuşu 21.00 sonrası, sabah erkencisi 09.00 öncesi başlayan oturumlarla (en az 30 dk).
- **Kişiye özel kart herkese mi?** Hayır: "Senin haftan" yalnız sahibine görünür, kartın üstünde yazar. Ekip kartlarındaki isimler zaten herkesin gördüğü istatistikler.
- **Video mu görsel mi?** Şimdilik görsel (PNG). Telefonda ek indirme olmadan çalışır, her telefonda paylaşılır. Video (hikâyenin hareketli kaydı) ayrı iş olarak eklenebilir.
- **Hangi hafta:** Pazar 18.00'den itibaren o hafta, öncesinde geçen hafta. Hafta bitmeden açılırsa usta kartı "şimdilik önde" der.
- **Rekabet tonu:** sıralama listesi yok; öne çıkanlar kutlanır, "senin haftan"da yalnız ekip odağındaki payın yazar.

**Batur'un sözleri:** "Instagram'da paylaşıp vay be dedirteceğin bir şeyler" · "bir şeyler giriyor, vuruyor, çıkıyor, tak tuk tuk böyle ekranda yazılar" (16 Ekim). Kararlar: "inisiyatif alarak ... kararları sen ver ... geri dönülebilir olsun" (17 Ekim).
**Önizleme:** proje klasöründe `kutup/onizleme/n28/` (kartlar açık ve koyu, paylaşım kartları, 51 sn'lik oynayan kayıt).
**Geri alma:** bildirim için `server/app.js` `tick()` içindeki n28 bloğu; ana sayfa kartı için `App.jsx`'teki `StoryNudge` satırı; tamamı için `Story.jsx`, `storyLink.jsx` ve `/story` yolu.
**Açık:** Batur'un görsel onayı; gerçek iPhone'da paylaşma menüsü (iOS Safari dosya paylaşımını destekliyor, denenmedi).
**Dosyalar:** src/Story.jsx, src/story.css, src/storyLink.jsx, src/home.css, src/App.jsx, src/MePage.jsx, src/later.jsx, server/app.js, server/stats.js, shared/week.js, tests/core.test.js, tests/browser_smoke.py, tests/live-smoke.mjs

### d25 · Satır sonları: tek kalan kelime ve emoji yok
Cila · 17 Eki 2026 · 5b7d4593 (PR #11, Worker 3de3c058) · göç yok

**Ne yapıldı:** Uygulamanın her yerinde bir paragrafın ya da başlığın son satırına tek bir kelime ya da emoji düşmesi önlendi. Denetimin V2 bulgusu ("Yolun kütübe mi düşüyor?" ve altında yalnız 🛵) da bununla kapandı, `Modals.jsx`'e (n29) dokunmadan.
- Başlıklar (h1–h3) `text-wrap: balance`: satırlar eşit bölünüyor ("Yolun kütübe / mi düşüyor? 🛵").
- Gövde `text-wrap: pretty`: tarayıcı son satırı tek kelimeye bırakmıyor ("köye bina, / tam maaş", "cam kenarı / boş 🌤️", "Küçük adımlar / da ilerlemedir.").
- Ölçüm: 4 sekme, Batur'a ilet, 14 pencere, karşılama ve davet ekranı; 375 ve 390 px'te 22 tek kalan satır vardı. Sonra 320–430 px'te 3 kaldı (320 px'te iki kısa etiket ve bilerek iki satır yazılmış "özel posta" pulu).
- **Testler:** 99 birim (değişmedi), 68 tarayıcı (2 yeni: "Yolun kütübe mi düşüyor? 🛵" penceresi ve dört sekmenin başlıkları; ilki eski kodda kırmızı), tema 252/252.

**Kararlar ve nedenleri:**
- Tek tek `&nbsp;` eklemek yerine iki CSS satırı: yeni yazılan her metin de kendiliğinden düzgün kırılıyor.
- Desteklemeyen tarayıcıda (eski iOS) hiçbir şey değişmiyor, yalnız bugünkü gibi kırılıyor.

**Batur'un sözleri:** "Şöyle baktığın zaman projenin bütünüyle uyumsuz ya da zayıf duran herhangi bir eleman olabilir."
**Geri alma:** `src/styles.css` başındaki `body` içindeki `text-wrap: pretty` satırı ve hemen altındaki `h1, h2, h3 { text-wrap: balance; }` kuralı silinir.
**Dosyalar:** `src/styles.css`, `tests/browser_smoke.py`.

### d24 · Görsel cila: zarf, Batur paneli telefonda, 44 px dokunma alanları
Cila · 17 Eki 2026 · 5b7d4593 (PR #10, Worker 3de3c058) · göç yok

**Ne yapıldı:** 17 Ekim dış denetiminin görsel bulguları V1, V3, V4 (rapor proje klasöründe, `kutup/denetim/DENETIM-RAPORU.md`).
- **V1:** "Batur'a ilet" kartında zarf artık yazının üstüne binmiyor. Paragraf zarfın yanında bitiyor (her ekran boyunda `.envelope-art` ölçüsüyle eşleşen `padding-right`); zarf yerinde ve aynı boyda. 320'den 1600 px'e 14 genişlikte ölçüldü.
- **V3:** Batur paneli telefonda: "Yenile" ve zil tek satırı dolduruyor (Yenile solda, zil kalanını kaplıyor), "Bu cihazdan çık" altında. Yedi aşama filtresi tek satırda yana kayıyor (kenardan kenara); seçili olan (çoğu zaman en sondaki "Hepsi") açılışta görünür kaydırılıyor, sayfa kaymıyor. Liste boşken Kara delik düğmesinin payı boş durum notunun altına geçiyor: not düğmenin altında kalmıyor, filtreyle not arasındaki fazla boşluk da kapandı.
- **V4:** 12 küçük denetim türüne görünmez, ortalanmış, en az 44 px dokunma katmanı (`::after`, n27'deki `.face-btn`/`.scribble` yöntemi): üst çubuk ikonları, metin düğmeleri, filtre çipleri, bildirim kapatma çarpısı, masa ritmi seçenekleri, ses düğmeleri, kalp ve "Yanıtla", gönder, "Ekibe seslen", yol tarifi bağlantısı, "Binalara göz at". Görünüm değişmedi: önce/sonra 38 ekran görüntüsü piksel piksel karşılaştırıldı; fark yalnız sayaç ve köy gibi kendiliğinden değişen yerlerde (iki "önce" çekimi arasında da aynı fark var).
- **Testler:** 99 birim (değişmedi), 70 tarayıcı (4 yeni: dokunma alanları, zarf, Batur çubuğu, Kara delik), tema 252/252.

**Kararlar ve nedenleri:**
- Dokunma katmanı `:where()` ile yazıldı (özgüllük sıfır): köşeye yerleşmiş düğmeler (`position: absolute`) yerinde kalıyor. Kendi katmanı olan Görünüm düğmesi listede yok.
- Zilin katmanı sola değil sağa büyüyor: Görünüm düğmesinin katmanı aradaki 8 px'i zaten dolduruyor, ikisi üst üste binmiyor (Görünüm'ün 44 px testi geçiyor).
- Aşama filtresi yana kayıyor, üç satıra sarılmıyor: Batur'un listesi yukarı çıkıyor; düzen Plan penceresindeki gün satırıyla aynı.
- Zarfı küçültmek ya da taşımak yerine yazı daraltıldı: kartın çizimi aynen kalıyor.

**Batur'un sözleri:** "Şöyle baktığın zaman projenin bütünüyle uyumsuz ya da zayıf duran herhangi bir eleman olabilir."
**Vazgeçilenler:** V2 (pencere başlığının sonundaki emojinin tek başına alt satıra düşmesi) bu PR'da yok; `Modals.jsx`'e (n29) dokunmadan bütün uygulama için d25'te (PR #11) çözüldü.
**Geri alma:** `src/polish.css` sonundaki "d24" bölümü; `src/styles.css`'te `.feedback-intro p` `padding-right` satırları ve telefondaki `.owner-toolbar`/`.owner-filters` kuralları; `src/blackhole.css`'te `.owner-requests:empty` kuralları; `src/Owner.jsx`'te `stages` kaydırması silinir.
**Dosyalar:** `src/styles.css`, `src/polish.css`, `src/blackhole.css`, `src/Owner.jsx`, `tests/browser_smoke.py`.

### n24 · Ses turu: altı odak sesi yeniden, daha gerçekçi
Ses · 17 Eki 2026 · 5b7d4593 (PR #9, Worker 3de3c058) · göç yok

**Ne yapıldı (`src/Sound.jsx`, yalnız ses motoru; arayüz ve kayıtlı ayarlar aynı):**
- **Yağmur:** damlalar artık suya düşen damla gibi çınlıyor (damlanın hapsettiği hava kabarcığının yükselen tonu ve çarpma tıkırtısı), yakın ve uzak; oluktan ağır damlalar; sağanak rüzgârla kabarıp iniyor; camda ince tıslama; oda yankısı.
- **Kütüphane:** büyük okuma salonunun havası, uzak havalandırma uğultusu ve salon yankısı; sayfa çevirme (kâğıt hışırtısı ve konuşu), kalemle yazı, uzakta ayak sesleri, bir sandalye.
- **Şömine:** çıtırtılar kümeler halinde (bir patlama ve küçük yankıları), odundan gaz tıslaması, düzensiz titreyen alev uğultusu, ara ara yerine oturan kütük.
- **Orman:** rüzgâr dalga dalga esiyor, sert estikçe ton yükseliyor ve yapraklar hışırdıyor; dört ayrı kuş türü (cıvıltı dizisi, iki notalı çağrı, karatavuk gibi flüt, kısa çiplemeler), yakın ve uzak, açık hava yankısı.
- **Dalgalar:** her dalga başka boyda ve aralıkta; kabarır, kırılır, köpüğü kumdan geri çekilir; uğultu, kırılma ve köpük aynı dalgayı izler.
- **Kafe:** üç masada sözleri seçilmeyen sohbet (farklı ses renkleri ve yerler, hece ve cümle ritmi, susmalar), salonun yankısı, fincanlar ve çay karıştıran kaşık.
- Odak gürültüsü ve Kara delik değişmedi.
- Tarayıcı testine kontrol eklendi: sekiz sesin her biri uygulamanın kendi ses panelinden tek başına açılıp gerçekten çalıyor.

**Kararlar ve nedenleri:**
- **Kayıt yerine yine cihazda üretim.** İnternet harcamaz, uygulama boyutu neredeyse aynı (ana JS gzip +2,2 KB), lisans derdi yok, arka sekmede çalmaya devam eder. Gerçek kayıtlar her ses için yüzlerce KB indirme ve lisans kontrolü isterdi.
- **Ses düzeyleri eskisiyle eşlendi.** Her yeni ses, değiştirdiği sesin yüksekliğine getirildi (2 dakikalık çıktıda 3 ölçümün ortalaması, fark ≤ 0,5 dB; `TRIM` tablosu). Kayıtlı karışımların dengesi bozulmaz. Hiçbir seste kırpılma yok (tepe ≤ 0,25).
- **Yankı her sese ayrı:** oda (yağmur, şömine), salon (kütüphane, kafe), açık hava (orman, dalgalar). Yankı, çözümleme maliyetini yaklaşık iki katına çıkarıyor; yine de 30 sn ses masaüstünde 1 sn'nin altında üretiliyor. İlk dokunuşta hazırlık en ağır seste (kafe) 4 kat yavaşlatılmış işlemcide yaklaşık 0,5 sn.
- **Yavaş şekiller:** rüzgâr, dalga, alev ve sohbet ritmi düşük örnek hızlı (8 kHz) tamponlardan sürülüyor. Bunu desteklemeyen eski tarayıcıda eski usul yavaş dalgalanmaya düşer.

**Batur'un sözleri:** "sesler daha gerçekçi olsun" (16 Ekim akşamı); "inisiyatif alarak ... kararları sen ver ... geri dönülebilir olsun" (17 Ekim).
**Dinleme:** eski/yeni karşılaştırma sayfası ve MP3'ler proje klasöründe (`kutup/onizleme/n24/`).
**Geri alma:** tek bir sesi eskiye döndürmek için o sesin `RECIPES` girdisini önceki commit'ten alıp `TRIM`'deki satırını silmek yeter; hepsi için `src/Sound.jsx`'i önceki hâline almak.
**Açık:** Batur'un kulağı ve gerçek iPhone'da dinleme.
**Dosyalar:** src/Sound.jsx, tests/browser_smoke.py

### d23 · Hesap güvenliği: şu anki şifre, deneme ve bildirim sınırları
Güvenlik · 17 Eki 2026 · 5b7d4593 (PR #8, Worker 3de3c058) · göç yok

**Ne yapıldı:** 17 Ekim dış denetiminin güvenlik bulguları (rapor proje klasöründe, `kutup/denetim/DENETIM-RAPORU.md`).
- **G1 (orta):** Şifresi olan hesapta kullanıcı adı ya da şifre yalnız şu anki şifreyle değişiyor ("Hesap ve cihazlar → Değiştir" formunda "Şu anki şifren" alanı). Yanlış deneme dakikada 6. Güncelleme eski şifre özetine bağlı; iki cihazdan aynı anda değiştirmede yalnız biri kazanır.
- **G2:** Girişte kullanıcı adı başına saatte en fazla 30 yanlış şifre (yalnız yanlışlar sayılır; `auth_limits`, anahtar `wrong:<ad>`). Var olmayan adda da aynı PBKDF2 işi yapılıyor.
- **G3:** Kişi başı dakikada 20 pano mesajı ve 6 plan (veritabanında, Worker kopyaları arasında ortak).
- **G4:** Zamanlayıcının gönderdiği masa ritmi bildirimleri, sitenin gerçek `https` adresiyle imzalanıyor (`settings.origin`, adres değişince bir kez yazılır).
- **Testler:** 102 birim (3 yeni), 67 tarayıcı (1 yeni), canlı duman testinin 4. adımına bir kontrol.

**Kararlar ve nedenleri:**
- Şifre değişince diğer cihazlar açık kalıyor (eskisi gibi). Kaybolan telefon için Batur'un "tüm cihazlardan çıkış" düğmesi ve kurtarma kodu zaten var; "diğer cihazlardan da çık" seçeneği Batur'a soruldu.
- Saatlik sınır, birinin bir arkadaşının hesabını bir saat kilitlemesine izin veriyor (30 yanlış deneme). Kabul edildi: hesap sahibi Batur'un koduyla ya da başka cihazdan "Giriş kodu al" ile yine girebilir; sınırsız tahminden daha az zararlı.
- Mesaj ve plan sınırları normal kullanımın çok üstünde seçildi; amaç yalnız yağmuru durdurmak.

**Batur'un sözleri:** "Sistemdeki açıkları falan varsa bulacaksın ... ondan sonra bu açıklardan düzeltmeye başlayacaksın. Verdiğin kararları yine not ederek."
**Vazgeçilenler:** `PUBLIC_ORIGIN`'i `wrangler.jsonc`'ye yazmak (yazma isteklerindeki köken kontrolünü de değiştirirdi; ileride özel alan adında yazmaları kırabilirdi).
**Açık:** E1 (arkadaşın seansına son dakikada katılınca günün ilk seans bonusu) Batur'un kararı; raporda.
**Geri alma:** `server/app.js`'te `/account` içindeki d23 bloğu, `tooManyWrong`/`countWrong` çağrıları ve `message:`/`plan:` sınırları silinir; `src/Account.jsx`'te "Şu anki şifren" alanı kaldırılır.
**Dosyalar:** `server/app.js`, `src/Account.jsx`, `tests/core.test.js`, `tests/suite.js`, `tests/browser_smoke.py`, `tests/live-smoke.mjs`.

### n29 · Anında ve hızlı: canlı oda, ihtiyaç anında yüklenen ekranlar, anında açılış
Altyapı · 17 Eki 2026 · 5b7d4593 (PR #7, Worker 3de3c058) · göç yok (D1 değişmedi; Cloudflare'de yeni Durable Object sınıfı)

**Ne yapıldı:**
- **Canlı oda:** her ekibe bir Durable Object (`LiveRoom`, `worker/index.js`). Telefonlar `/api/live` üzerinden WebSocket ile bağlanır; bir yazma olunca oda "changed" der, telefon hemen `/state?rev=` çeker. Uyuyan (hibernation) soket boşta para ve CPU harcamaz; `ping` → `pong` odayı uyandırmadan cevaplanır. Ekipten çıkan ya da çıkarılanın soketine "removed" gider ve kapanır. Yerel workerd'de bir gelişin öbür telefona yansıması 438 ms (yazma dahil); worker testinde zil < 1 sn.
- **Yedek yoklama:** soket açıkken 30 sn'de bir, kapalıyken eskisi gibi 5 sn'de bir. Uygulama öne gelince soket yeniden kurulur. Node sunucusu (SSE) değişmedi.
- **İhtiyaç anında yükleme (`src/later.jsx`):** Batur paneli, odak ekranı, köy haritası ve istatistikler ayrı parçalar. İlk boyamadan sonra telefon boştayken sessizce indirilir (Batur paneli hariç), sekme geçişi eskisi kadar hızlı. Ana JS paketi gzip 203,5 KB → 169,8 KB (n31'den önceki hâline göre −%17).
- **Anında açılış (`src/lastState.js`):** cihazın gördüğü son ekip durumu saklanır, sonraki açılışta beklemeden gösterilir, taze durum arkadan gelir. Sunucuya ulaşılamazsa son resim kalır, bağlantı yok işareti yanar. Bir günden eski resim kullanılmaz; çıkış ya da ekipten ayrılma temizler; `/batur`, davet linki ve `?as=` bildirimlerinde kullanılmaz.
- **App.jsx bölündü:** 2.539 satırdan 1.419'a. `Focus.jsx` (odak kartı, kahve kartı), `Board.jsx` (Pano), `Modals.jsx` (konum, davet, plan, kahve, arkadaş kartı), `villageData.js` (köy veri kancası), `fullscreen.js`.

**Kararlar ve nedenleri:**
- Yoklama yedek olarak kaldı: Durable Object ya da soket bir sebeple çalışmazsa uygulama eskisi gibi çalışır.
- Durable Object, SQLite tabanlı sınıf olarak tanımlandı (`new_sqlite_classes`); Cloudflare'in ücretsiz planı yalnız bunu destekliyor. İlk yayında `wrangler deploy` sınıfı kendisi oluşturur. Yayın bu adımda hata verirse `npm run yayin` durur ve canlıya bir şey gitmez.
- CSP `connect-src`'ye canlı adresin `wss://` hâli eklendi: iOS Safari `'self'`in WebSocket'i kapsadığını her sürümde kabul etmiyor. Alan adı değişirse soket kurulmaz, yoklama devam eder.
- Anında açılış yerel depoda yalnız açık hesabın son durumunu tutar; o cihaz zaten aynı veriyi oturumla görebiliyor.

**Batur'un sözleri:** Claude'un 5 önerisinden 2. madde, onaylandı ("senin planını beğendim").
**Vazgeçilenler:** Durable Object'in kendi durum kopyasını tutup göndermesi (veri D1'de tek yerde kalsın diye yalnız "changed" zili gönderiliyor).
**Açık:** Gerçek iPhone'da arka plandan dönüşte soketin yeniden kurulması canlıda denenecek. Canlı duman testine "live room rings" adımı eklendi.
**Dosyalar:** worker/index.js, wrangler.jsonc, public/_headers, src/App.jsx, src/Focus.jsx, src/Board.jsx, src/Modals.jsx, src/later.jsx, src/lastState.js, src/villageData.js, src/fullscreen.js, src/FocusScreen.jsx, src/VillageMap.jsx, src/MePage.jsx, tests/suite.js, tests/browser_smoke.py, tests/live-smoke.mjs

### n31 · Kara v2: ChatGPT'nin yeni Kara hareketlerini yerleştir
Maskot · 17 Eki 2026 · 5b7d4593 (PR #6, Worker 3de3c058) · göç yok

**Ne yapıldı:** ChatGPT'nin Kara v2 paketindeki `Kara.jsx` ve `kara.css` yerleşti (34 küçük hareket, 77 eklem klibi, 2,5B baş dönüşü, 6 nadir sürpriz, baret/gözlük/kitap/bere/çay bardağı). Gökyüzündeki "ders arası hayat" pulu artık Kara'nın cümlesi: pula dokununca Kara üç cümleden sıradakini söyler (kütüpteysen "kalk, bir bardak çay", moladaysan "çayın soğumasın"). Tarayıcı testine üç kontrol eklendi: sonsuz animasyon yok, 7 dokunuşta yıldız yutma, pul Kara'yı konuşturur.
**Kararlar ve nedenleri:**
- Kenar ışığı ve kürk tonları şimdiki Kara'nınki kaldı (`kara.css` başı: `--kara-sheen/shade/pad`, `.k-rim` opaklığı ve çizgi kalınlıkları). v2'de gece halkası çok incelmiş, gündüz hale kaybolmuş, kürk maviye kaymıştı; kart "renkleri aynı kalsın" diyor. Geri almak için bu 8 satırı paketteki değerlere çevirmek yeter.
- Paketin geri kalanı olduğu gibi alındı; arayüz (`KaraRig`, `KaraHome`, `KaraBuddy`, `ACTS`, `LASTS`) uyumlu, paket tabanı (e10c30a) sonrasında Kara dosyaları değişmemişti.
- Ölçüm (yavaş telefon, CPU 4×, 375 px, 20 sn, 3 koşunun ortancası, ana sayfa): meşguliyet şimdiki %17,6–21,8, v2 %15,9–20,1; iki sürüm de 60 fps, p95 18–19 ms. Bedel: `kara.css` gzip 4 KB → 40 KB, sitenin CSS'i 46 → 81 KB.
**Batur'un sözleri:** "Önce /compact yapacağım, sonra Kara v2'ye başla." İkinci üste (17 Eki): "inisiyatif alarak ... kararları sen vererek de bana yapabilirsin. Sadece ... verdiğin kararları ben geldiğim zaman bana göstereceksin ve geri dönülebilir kararlar olacak."
**Kaynak:** ChatGPT, Kara-v2 paketi (Batur yaptırdı), taban e10c30a; alınanlar `Kara.jsx` ve `kara.css`. Önizleme HTML'i ve ChatGPT ekran görüntüleri alınmadı; görüntüler yerel test verisiyle çekildi.
**Vazgeçilenler:** v2'nin ince kenar ışığı ve mavimsi kürk tonları.
**Açık:** Batur görüntüleri ve hareketleri görüp onaylayacak. 120 sn sessizlikte ateş böceği ve çok yönlü okşama gerçek telefonda denenmedi.
**Dosyalar:** src/Kara.jsx, src/kara.css, src/Home.jsx, tests/browser_smoke.py

### n25 · Hesaplar arası geçiş: bir cihazda birden fazla hesap
Hesap · 17 Eki 2026 · 76381788 (bulut oturumu, PR #4) · birleştirme eb4e2ba9 · Worker 812f7ef9 · göç 21

**Ne yapıldı:**
- **Instagram tarzı geçiş:** Bir cihaz en fazla 5 hesabı hatırlıyor. Ben sayfasında "Hesaplarım" listesi var: açık hesap üstte, diğerine tek dokunuşla geçiliyor. "Hesap ekle" açık hesabı kapatmadan giriş ekranını açıyor ("Hesabıma dön" ile geri). Masaüstünde soldaki profil satırı aynı listeyi açıyor. Geçişte uygulama o hesap için baştan kuruluyor; önceki hesabın canlı akışı, köyü, panosu ve sayaçları taşınmıyor.
- **Güvenlik:** Oturum anahtarları sayfa betiklerine hiç açılmıyor. Açık hesap `kutup_session`'da, cihazdaki diğerleri ikinci bir HttpOnly çerezde (`kutup_accounts`, yalnız `/api`). Sunucu her istekte her anahtarı yeniden denetliyor. Bir cihaz yalnız gerçekten o cihazda açılmış ve oturumu hâlâ geçerli hesaba geçebiliyor. Kapanan, iptal edilen ya da kurtarılan hesap listeden kendiliğinden düşüyor ve sıradaki hesap açılıyor.
- **"Bu cihazda çıkış yap":** Yalnız açık hesaptan çıkarıyor, diğer hesaplar kalıyor. Şifre kurtarma, tüm cihazlardan çıkış ve ekipten ayrılma hesap bazında eskisi gibi.
- **Bildirimler (göç 21):** Abonelik tablosunun anahtarı `(endpoint, üye)` oldu; aynı telefon her hesap için ayrı bildirim alıyor ve bir hesabın bildirimi diğerine gitmiyor. Telefonda birden fazla hesap varsa başlığın başında ekip adı yazıyor; dokununca o hesap açılıyor (`?as=`). Zil hesap başına.
- **Testler:**
  - 99 birim (Node ve Worker+D1, göç testi dahil);
  - 66 tarayıcı kontrolü (8 yeni);
  - canlı duman testinde 7b adımı: ikinci hesap cihazda kalıyor, tek dokunuşla geçiliyor, cihaz çerezi olmadan geçiş reddediliyor.
- **Yayın:** Göçten önce canlı yedek alındı (`data/backup-before-n25-…json`, şema 20). Göç sonrası 6 üye aboneliğinin 6'sı da yerinde.

**Kararlar ve nedenleri:**
- Bir hesap = bir ekip; binalar, tuğlalar ve istatistikler karışmasın diye (Batur'un kararı).
- Anahtarlar sayfanın okuyabileceği yerde değil, çerezde: bir betik açığı diğer hesapları da ele geçiremesin.
- Cihaz başına 5 hesap sınırı; ortak telefonda listenin şişmemesi için.
- PR, d22 araya girdiği için hızlı ileri sarılamadı; birleştirme commit'iyle alındı.

**Batur'un sözleri:** "iki ayrı hesap daha mantıklı. O zaman hesaplarım arası geçiş yapmamı kolaylaştırman lazım." · "dar ve tek aşamalı tut."

**Açık:**
- Gerçek telefonda (iPhone ana ekran uygulaması, Android) iki hesaplı bildirim denenmedi.
- Tarayıcının aboneliği kendi kendine yenilemesi (`pushsubscriptionchange`) gerçekte denenmedi.
- iPhone'da hesap ekleme ana ekran uygulamasının içinde yapılmalı (Safari ayrı çerez tutar).

**Dosyalar:** `server/app.js`, `server/schema.js` (göç 21), `server/outbox.js`, `public/sw.js`, `src/Accounts.jsx` (yeni), `src/App.jsx`, `src/MePage.jsx`, `src/home.css`, `tests/suite.js`, `tests/core.test.js`, `tests/browser_smoke.py`, `tests/live-smoke.mjs`, `audit/2026-10-17-n25/`.

### d22 · Ana sayfa hata avı (Batur'un ekran görüntüsü)
Düzeltme · 17 Eki 2026 · 4d5a5cfb · Worker d2761763

**Ne yapıldı:** Batur canlı ana sayfanın (masaüstü, koyu Lavanta) ekran görüntüsünü attı: "nasıl hatalar görüyorsun". Görüntü yerelde aynı genişlikte yeniden kuruldu; altı hata bulundu, sebepleriyle düzeltildi:
- **Sol menüdeki ekip kartı gri, köşeli bir kutuydu.** Kart bir düğme, ama kendi zemini, iç boşluğu ve köşesi yoktu; tarayıcı varsayılan düğmesini çiziyordu (koyuda gri, açıkta açık gri). n18'den beri böyleydi. Artık şeffaf, yuvarlak köşeli; üstüne gelince kart görünümü.
- **Üst çubukta güneş simgesinin yanında boş, geniş bir kutu vardı.** n26'daki "İnşaat / Serbest" anahtarı, üst çubuktaki görünüm düğmesiyle aynı sınıf adını (`.mode-switch`) taşıyordu; stüdyonun iki sütunlu kutusu üst çubuğa da uygulanıyordu (açılan menünün satırları da etkileniyordu). Stüdyonunki `.studio-mode` oldu.
- **"Herkes" çipinin sol üst köşesinde küçük yeşil bir nokta vardı.** Filtrelerin kayan vurgusu (`.filter-pill`) da bir `<i>`; renk noktası kuralı (`.filter-chip i`) ona da uyup onu 4 px'lik noktaya çeviriyordu. Vurgu artık çipin tamamını kaplıyor ve filtreler arasında kayıyor.
- **"Kim nerede?" kartları yan yana kayıktı.** Kart bir düğme ve düğme, içeriği kendinden kısa kalınca dikeyde ortalıyor; yanındaki kart uzun olunca (Batur'un "Kurucu" satırı, odaktakinin süre çubuğu) diğerinin içeriği aşağı kayıyordu. İçerik artık üstten başlıyor, alt satır her kartta en altta. Telefonda da aynı.
- **Gece mesaisinde ay görünmüyordu.** Geniş ekranda sahne 236 px'lik gökyüzünden uzun, üstü kesiliyor; ay (öğlen de güneş) kesilen kısımda kalıyordu. Artık en az kendi yarıçapı kadar görünür alanın içinde. Dar ekranda değişiklik yok.
- **"Plan yap"ın çevresinde köşeli bir çerçeve kalıyordu.** Pencere kapanınca odak açan düğmeye dönüyor (n27); not yazılıp fareyle kaydedilince tarayıcı odak halkasını gösteriyordu ve yazı düğmesinin köşesi olmadığı için kare çiziliyordu. Fareyle ya da dokunarak kapanınca halka artık çıkmıyor (klavyeyle kapanınca çıkıyor); yazı düğmelerinin halkası yuvarlak.
- **Test:** tarayıcı testine "ana sayfa kendi görünümünü koruyor" kontrolü eklendi (ekip kartı zemini, üst çubuk düğmesi, filtre vurgusu, kart hizası).

**Kararlar ve nedenleri:**
- Sol taraftaki yel değirmeni geniş ekranda selamlamanın arkasında kalıyor; hata sayılmadı, sahnenin parçası. Batur isterse kaydırılır.
- Ay için kahraman alanı büyütülmedi (düzeni değiştirirdi); yalnız ay ve güneş görünür alana çekildi.

**Batur'un sözleri:** "nasıl hatalar görüyorsun bulamazsan ipucu verecem ama bul."

**Açık:** Gerçek iPhone'da bakılmadı.

**Dosyalar:** `home.css`, `koy.css`, `styles.css`, `polish.css`, `Home.jsx`, `App.jsx`, `Modal.jsx`, `tests/browser_smoke.py`.

### n23 · Tema revizyonu: altı kapsamlı tema paketi
Tema · 17 Eki 2026 · 82f2136e · a0f366e1 (bulut oturumu, PR #3) · Worker da4c894e

**Ne yapıldı:**
- **Temanın kapsamı:** Tema artık sayfa zeminini, kartları, çizgileri, yazıyı ve soluk yazıyı, vurguyu, kahraman alanlarını, Köy'deki odak kartını ve pop rengini, gündüz ve gece gökyüzünü, alt ve sol menüyü ve iPhone üst çubuğunu birlikte değiştiriyor; açık ve koyu modda.
- **Altı paket:** 9 tema 6 pakete indi: Lavanta, Lacivert, Petrol, Kiremit, Gül, Grafit. Dördü nötr ya da erkeksi.
  - Eski seçimler en yakın pakete geçiyor (`THEME_MOVED`: mint→teal, blue→navy, peach/amber→clay).
  - Görünüm penceresinde her paket kendi renkleriyle çizilmiş küçük bir kart.
- **Tek kaynak:** Tema jetonları `src/themes.css`'te.
  - `scripts/theme-css.js` derleme sırasında sabit nötr renkleri temaya bağlıyor (`color-mix`, eski renk yedekli, iOS 16.2+).
  - `scripts/theme-check.mjs` kontrastı denetliyor.
- **Okunabilirlik:** Soluk yazılar her temada en az 4.5:1. Ana ekranlarda Lavanta açıkta eşik altı yazı 130'dan 0'a indi; diğer 14 ekranda 3060 yazının hiçbiri eşik altında değil. Koyu Lavanta'da düğmeler açık lila üstünde koyu yazı.
- **Lila kalıntıları:** Batur'a ilet, ses kutucukları, harita düğmeleri, giriş ekranı ve gece köyü artık temayı izliyor.
- **Yavaş telefon:** Tema geçişi ~80–93 ms, eskisinden ~15 ms fazla; sonra 60 fps.
- **Testler:** 96 birim, 56 tarayıcı kontrolü (tema değişince zemin ve kartların da değiştiği dahil).

**Kararlar ve nedenleri:**
- Az ama kapsamlı ve belirgin paket (Batur: "tema dediğin daha kapsamlı olur").
- Koyu Lavanta'da okunaklı koyu yazılı düğme.
- Soluk griler bir tık koyulaştı; sakin görünüm korunarak okunabilirlik eşiğine çekildi.

**Batur'un sözleri:** "Altı tema da kalsın, adlar uygun. Koyu Lavanta'da koyu yazılı düğmeler kalsın. Soluk gri yazılar 4.5:1'e çekilsin."

**Açık:** Gerçek iPhone'da bakılmadı. Degrade zeminler üstündeki yazılar otomatik ölçülmedi, gözle kontrol edildi.

**Ek (acd9e75e, Worker 819da5ff):** Pano'daki mesaj listesinde yan kaydırma çubuğu çıkıp duruyordu (liste iki yöne kayıyordu; kayan balon ve kalp patlaması taşırıyordu). Artık yalnız dikey kayıyor, uzun kelimeler satıra sığıyor. Batur: "sohbet kutusunda alt slide bar çıkıp duruyor".

**Dosyalar:** `themes.css`, `scripts/theme-css.js`, `scripts/theme-check.mjs`, `scripts/dark-css.js`, `api.js` (THEMES, THEME_INFO, THEME_MOVED), `public/mode.js`, `colorMode.js`, `Account.jsx` (tema kartları), çok sayıda CSS, `tests/client.test.js`, `tests/browser_smoke.py`, `audit/2026-10-17-n23/`.

### n27 · Vitrin ve cila: Gökyüzü girişi, gizli davet, sahte basılabilir avı
Tasarım · 16 Eki 2026 · 1743855a (bulut oturumu, PR #2) · Worker f76db6c3

**Ne yapıldı:**
- **Giriş (Seçenek 1, Gökyüzü):** Karşılama, davet (`/join/<kod>`) ve ekip kurma artık tek bir canlı gökyüzü ekranından.
  - Davette ekiptekiler patikada bekliyor; boş "sen?" yerine dokununca katılma başlıyor.
  - Katılma 2 adım, ekip kurma 3 adım; sonunda yeni üyenin figürü kütüphane kapısından içeri yürüyor.
  - Yeni dosyalar: `Entry.jsx`, `entry.css`. Seçenek 2 (okuyucu kartı) koda girmedi; PR notunda n28 paylaşım kartı için anlatılıyor.
- **Gizlilik:** `/api/invites/<kod>` artık ekip adını, kişi sayısını ve ilk 8 kişinin adını, avatarını ve rengini döndürüyor. Kim kütüpte, yolda ya da odakta bilgisi ne sunucu yanıtında ne ekranda var. Sunucu testi ve canlı duman testi bunu koruyor.
- **Sahte basılabilir avı (19 madde + sınırdakiler):**
  - **Üst çubuk:** "✳ + sayfa adı" oldu; dokununca başa ya da ana sayfaya gidiyor. Masaüstündeki "Bizim alan ›" kalktı.
  - **Köy:** Tuğla hapı tuğla kasasını açıyor (bakiye ve son hareketler). Katalogda kilitli ve parası yetmeyen kartlar gerekçesini söylüyor; koleksiyondaki bina haritada gösteriliyor.
  - **Pano:** Kalem simgesi yazı kutusuna götürüyor, sistem satırları ilgili yere gidiyor.
  - **Kişiler:** Ekip kartındaki satırlar ve küçük avatarlar kişinin kartını açıyor.
  - **Ana sayfa:** Gökyüzündeki canlı hap ilgili bölüme gidiyor; dakika halkası "Yerimi değiştir"i açıyor; "ders arası hayat" pulu dokununca sallanıyor.
  - **Davet penceresi:** "＋" bağlantıyı kopyalıyor.
  - **Süsler:** Batur'a ilet'teki süs öğeleri sadeleşti. Sayı hapları düz sayı oldu, "⋯" "›" oldu.
- **Kusurlar:**
  - telefonda Köy ve Pano kutucukları yan yana;
  - formlar 16 px, iPhone artık yakınlaştırmıyor;
  - renk düğmeleri 44 px;
  - anıt penceresi kat çizimini ve kimin kaç dakika kattığını gösteriyor;
  - pencereler kapanınca odak açan düğmeye dönüyor.
- **iPhone "Ana Ekrana Ekle" rehberi** (iOS 26 akışı, `•••` → Paylaş) ve **çizimli boş ve yükleniyor ekranları** (`Illustrations.jsx`).
- **Testler:** 93 birim, 55 tarayıcı kontrolü (11 yeni). Yavaş telefonda giriş ekranı 60 fps, p95 16,7 ms.

**Kararlar ve nedenleri:**
- Gökyüzü seçildi: davet linkine tıklayan arkadaş ilk saniyede içeride göreceği dünyayı ve onu bekleyenleri görüyor.
- Canlı konum yalnız katılınca görünür; link başkasına iletilebilir.
- Sayı hapları düğme yapılmadı; az gürültü.
- Boş durumlarda üstteki düğmeyi tekrar eden ikinci düğme yok (tekrar yok kuralı).

**Batur'un sözleri:** "Seçenek 1 (Gökyüzü). Sınırdaki maddelerde ve gizlilikte senin önerilerin olsun."

**Denenip vazgeçilenler:** Seçenek 2 (okuyucu kartı, damgalı defter sayfası): n28 paylaşım kartı için saklandı.

**Açık:**
- Pul dokununca Kara'nın bir cümle söylemesi (sınırdaki 20. madde): Kara dosyalarına dokunmadan bağlanamadı; yeni Kara yerleşince eklenecek.
- Gerçek iPhone ve Android'de bakılmadı; iOS 26 menü adlarını telefonda doğrulamak gerek.
- GitHub'daki kırmızı Vercel işareti Kütüp'ten değil: depo kökündeki eski site, commit'lenmiş `node_modules` yüzünden derlenemiyor.

**Dosyalar:** `Entry.jsx`, `entry.css`, `Illustrations.jsx`, `illustrations.css`, `polish.css`, `Account.jsx`, `App.jsx`, `Home.jsx`, `Economy.jsx`, `VillageMap.jsx`, `MePage.jsx`, `Requests.jsx`, `Modal.jsx`, `server/app.js`, `tests/suite.js`, `tests/browser_smoke.py`, `tests/live-smoke.mjs`, `audit/2026-10-17-n27/`.

### n26 · Köy 2.0: odak stüdyosu ve yaşayan harita
Köy · 16 Eki 2026 · 00990aa5 · d5651113 · f541476a

**Ne yapıldı:**
- **1. kısım (Claude, 00990aa5):** Odak kartı stüdyo oldu:
  - uzun inşaat modu kutusu yerine İnşaat/Serbest seçici ve tek satırlık kural;
  - ses mikseri ses düğmesinin yanındaki ayar simgesinden açılıyor;
  - masadakiler tek satırda, Katıl düğmesiyle;
  - alt satırda bugünün dakikası.

  Ayrı ses kartı, haftalık tablo kartı, "Beraber odaktayız" paneli ve günlük not kalktı. Harita büyüdü; kişiler haritanın içinde küçük yüzler oldu (odaktakinde kulaklık). Anıt ve haftalık tablo haritanın altında iki kutucuk; dokununca ayrıntısı açılıyor. Sayfa telefonda 3,2 ekrandan 2,4 ekrana indi.
- **2. kısım (bulut oturumu, PR #1, d5651113):** Yaşayan harita:
  - binası olan en fazla 6 mahallede birer köylü meydana yürüyüp dönüyor;
  - odaktakilerin evinde nefes alan sıcak pencere ışığı, balonda 🎧 (çay molasında ☕);
  - gündüz kuş sürüleri;
  - bina bitince harita binaya uçuyor, ışık halkası ve konfeti çıkıyor (yeni bina, inşaattan önce olmayan bina olarak bulunuyor; saate güvenilmiyor).
  - Hareket ayarı her karede okunuyor: Sakin ve Kıpırtısız'da harita durağan, Kıpırtısız'da konfeti yerine sabit halka.
- **Performans (bulut ölçümü, 375 px, 4x yavaş işlemci):** Harita iki katmana ayrıldı. Asıl harita yalnız kamera oynayınca çiziliyor, hareket eden her şey üstteki şeffaf katmanda; balonlar bir kez çizilip saklanıyor. Dolu bir köyde yük %75–80'den (p95 33 ms, ~49 fps) %35–38'e indi (p95 16,7 ms, 60 fps). Kimse yokken köylüler yürüdüğü için yük %10'dan %32–35'e çıkıyor, 60 fps korunuyor. Sakin ve Kıpırtısız'da ~%10.
- Yan düzeltme (f541476a): Arduvaz, Kum ve Zeytin renkleri haritada lila görünüyordu.

**Kararlar ve nedenleri:**
- Sadelik = tekrar yok: aynı bilgi tek yerde. "Kim odakta" masadakiler satırı ve haritadaki yüzler; ses odak kartında.
- Basılabilir görünen her şey iş yapar: kutucuklar ve haritadaki yüzler bir şey açıyor ya da bir yere götürüyor.
- Uygulama işi bulut oturumuna verildi; Claude PR'ı inceleyip birleştirdi, testleri yerelde de koşup yayınladı. Bulutta Cloudflare girişi yok, bu yüzden yayın burada.

**Batur'un sözleri:** "Köy düzeni tamam. Yaşayan haritaya geç: yürüyen köylüler, duman, kuşlar, odaktakiler, bina bitince kutlama." · "aga cloud sessiona yaptıralım işleri deneyelim sen sadece yayınla".

**Denenip vazgeçilenler:** Bina bitince kutlama, bulutta test kancasıyla (`/__test/expire`) tetiklenemedi; kanca istemciye haber vermediği için bitiş "vazgeçme" sanılıyor. Gerçek akışta istemci süre dolunca bitişi kendisi çağırıyor.

**Açık:** Gerçek iPhone'da bakılmadı (ölçümler ekran kartı olmayan bulut tarayıcısında). Gündüz kutlaması görsel olarak denenmedi.

**Dosyalar:** `App.jsx` (FocusCard), `Together.jsx` (DeskMates Katıl), `VillageMap.jsx` (yüzler, KoyTiles, WeekList, kutlama), `koy.css`, `villageWorld.js` (villagers, glows, focusing), `villageView.js` (iki katman, köylü, kuş, ışık, kutlama, balon önbelleği), `tests/browser_smoke.py` (+2 kontrol), `audit/2026-10-16-n26/`.

### n06 · Kara baştan: sevimli bir kara delik, çatıda yaşayan işlevli kedi
Maskot · 16 Eki 2026 · 901347b4

**Ne yapıldı:**
- Kara sıfırdan çizildi: simsiyah, yumuşak, yuvarlak bir kedi. Göz bebekleri hep yuvarlak ve kocaman; irisin yalnız ince altın halkası ve altta açık bir hilal kalıyor (kara delik fotoğrafındaki parlak yarı gibi). Gece silueti sıcak bir ışık halkasıyla parlıyor (foton halkası); gündüz bu ışık hafif. Tasma tema renginde, boyna oturuyor, çene ve kürk kenarına düşüyor; künyesi minik bir kara delik.
- Evi ana sayfa gökyüzünde kütüphanenin çatısı (sağ köşe, kuyruğu cepheye sarkar); odak kartında sayacın sağ altında oturur. Eski kart, poz düğmeleri ve tanışma penceresi kalktı.
- Pozu ekibin durumunu söyler: kütüpte kimse yoksa somun gibi kıvrılıp uyur; biri yoldaysa patikayı izler; biri içerideyse uyanık; sen odaktayken gözlük + kitap, inşaatta baret (✳). Biri gelince kuyruğu dik karşılar; Pano notunu ağzında getirir; bina bitince iki kez zıplar (^^ gözler, kıvılcım); çökünce kulakları düşer; basılı tutunca mırlar.
- Haberci: ana sekmede geliş, yola çıkış ve yeni Pano notu Kara'nın balonu olur. Dokununca o anın en işe yarar cümlesini söyler ve tek eylem verir (Oku, Planlar); uyurken önce tek gözünü açar.
- 18 küçük hareket poza göre rastgele gelir: bakınma, gökyüzüne bakma, baş eğme, yavaş göz kırpma, kulak, kuyruk, pati yalama, esneme, göz bebeklerinin kara delik gibi açılması, nefes, sayfa çevirme, gözlük üstünden bakma, uyuklama, onaylama, rüya, iç çekme, av kıpırtısı. Arada göz kırpar. Fareyle gözler imleci izler.
- Yan düzeltme: mesaj bannerındaki avatar uzuyordu, düzeldi.

**Kararlar ve nedenleri:**
- Kimlik Batur'un referansından: yuvarlak göz bebekli kara kedi fotoğrafları. Kara delik çağrışımı fantastik desenle değil, gerçek kedi davranışıyla (karanlıkta açılan göz bebeği) ve ışıkla (kenar halkası) kuruldu; eski "doğal kedi, kehribar göz" kuralı korunuyor.
- Kara'nın çizimi avatarlardan ayrıldı (kontursuz kadife siyah, kendi stili). Avatarlar n13'teki çizgide kalıyor.
- Ana sekmede aynı haberi iki kez söylememek için "kütübe geldi" bildirimi ve yeni mesaj bannerı orada gösterilmiyor; Kara söylüyor.
- Basılabilir görünen her şey iş yapar: Kara'ya dokunmak bilgi + eylem verir. Balon altındakine dokunmayı engellemez; yalnız eylem düğmesi basılır. Dokunma alanı yalnız gövde; sarkan kuyruk alttaki düğmeyi örtmez.
- Sürekli döngü yok: hareketler 1–3 sn'lik küçük anlar. 4x yavaşlatılmış telefonda sayfa 60 fps (p95 16.8 ms), Kara'nın ek yükü ~6 puan. Sakin ayarında yalnız poz geçişleri, Kıpırtısız'da her şey anında; telefonda azaltılmış hareket açıksa Kara kendiliğinden kıpırdamaz.

**Batur'un sözleri:** "karanın tipi hala eski ya bana daha çok yakışan ve daha detaylı kaliteli çizilmiş bir kara yapalım mı" · "sıfırdan tasarlayalım maskotu. maskot bi kedi olsun ve kara deliği anımsatsın" · "round beautiful eyes, like a cute black hole" (referans: yuvarlak göz bebekli kara kedi fotoğrafları) · "tmm daha detaylandır ve hareketleri çeşitlendir ve uygula" · "tasma falan doğal dursun, vücudunun bir parçası gibi" · "direkt deploy, videoya gerek yok ben bakarım canlıdan".

**Denenip vazgeçilenler:**
- İlk deneme: eski Kara'nın küçültülmüş çizimi (konturlu, atkılı) çatıda. Davranışlar (haberci, odak arkadaşı, dokununca cümle) tuttu, çizim "tipi hâlâ eski" bulundu.
- Gösterilmeden bırakılan taslaklar: üç stil (gerçekçi gece kedisi, afiş, tüylü) ve üç kara delik konsepti (ışık halkası, kıvrılınca kara delik, tutulma). Batur'un referansı gelince sevimli + yuvarlak göz yönü seçildi; ışık halkası ve somun duruşu bu taslaklardan kaldı.
- Sürekli döngüler (kuyruk, nefes, künye): yavaş telefonda ana iş parçacığı yükünü %62'den %81'e çıkardı; küçük anlara çevrildi.
- Göz kapağını clipPath ile kırpmak: Chrome'da kapak hareket edince maske yanlış konumlandı; kapak, gözün üstünden açılan yuvarlak perde oldu.

**Dosyalar:** `src/Kara.jsx` (KaraRig, KaraSpot, KaraHome, KaraBuddy), `src/kara.css`; `Home.jsx` (`.sky-over` katmanı), `App.jsx` (FocusCard'da KaraBuddy; ana sekmede geliş bildirimi yok), `Together.jsx` (ana sekmede banner yok), `together.css`, `dark.css`; silinen `Mascot.jsx`, `LiveMascot.jsx`, `mascot.css`; `tests/browser_smoke.py`, `tests/live-smoke.mjs`. Worker 7c65ff28.

### n18-2 · Görsel şölen turu: katmanlı gökyüzü, zengin ana sayfa, hareket ayarı, temalar, cevaplar
Tasarım · 16 Ekim 2026 · ea86b4c4 (Worker e3c0ea53)

**Ne yapıldı:**
- **Performans:** Gökyüzü sabit bir çizim + üstünde ayrı hareketli katmanlar (bulut, kuş, güneş/hale, yıldız, değirmen kanadı, vinç, duman); hepsi yalnız transform/opacity. 4 kat yavaşlatılmış telefonda ana sayfa 54 fps, 33 ms kareler ve %91 dolu ana iş parçacığından sabit 60 fps'e (16,8 ms) çıktı. Uygulama saati her saniye yalnız saniye gösterilebilecekken (çalışan sayaç, Köy sekmesi, odak ekranı, ritim) atıyor, yoksa 15 sn; uygulamaya dönünce hemen yenileniyor.
- **Ana sayfa:** gökyüzünde sırayla dönen canlı bilgi şeridi (kaç kişi kütüpte, kim yolda, kim odakta, sıradaki plan, haftalık odak), "ders arası hayat ✷" çıkartması geri geldi, selam kelime kelime yükseliyor. Durum kartı: küçük çizim (ışığı yanan kapı / yoldaki scooter / saat halkalı iğne), "Zeynep ve Batur kütüpte, masan hazır" avatarları, Milli Kütüphane yol tarifi, Geldim'de parıltı. Üye kartları kendi renginde, odaktayken ilerleme çubuğu, 👑. Planlar renkli tarih karoları ve zaman çizgisiyle. Köy ve Pano satırları yerine iki kutucuk: Köy'de ekibin son binalarının portreleri ve anıt/inşaat çubuğu, Pano'da son iki mesaj baloncukları. Başlıklar kelime kelime, bloklar kaydırınca yükseliyor; sekmeler geldikleri yönden kayıyor. Tablette üye kartları 3 sütunlu ızgara.
- **Ben:** bugünkü ve haftalık odak, bina sayısı; ekip kartı satırı.
- **Sol menü:** ekip adı ekip kartını açıyor (tam ad, kim nerede, haftanın odağı ve anıt, davet). Milli Kütüphane kartı "Şu an N kişi burada" ve yol tarifi (Google Haritalar).
- **Görünüm:** dört yeni tema (Lacivert, Petrol, Kehribar, Grafit), üç sakin profil rengi (Arduvaz, Kum, Zeytin), hareket ayarı: Şölen / Sakin / Kıpırtısız. Seçilmezse telefonun "hareketi azalt" ayarı geçerli.
- **Pano:** kişi renginde baloncuklar, kendi mesajın sağda; her mesaja "Yanıtla" (alıntılanır, yazarına mevcut "Mesajına cevap" bildirimi gider); çift dokunuşla kalp ve büyük kalp patlaması; yeni mesajlar süzülerek giriyor.
**Kararlar ve nedenleri:** Batur sadeliği "akışta tekrar ve kafa karışıklığı olmasın" diye istemişti, görsel şölenden vazgeçmek değil. Kaybedilenler geri getirildi ama tekrar eden eylem olarak değil: çıkartma ve çizimler, köyün gerçek binaları (Köy kutucuğu), canlı odak bilgisi, Pano'nun son mesajları. Ölçüm, maliyetin animasyon sayısından değil büyük SVG'nin içinde bir şey hareket ettikçe her karede yeniden boyanmasından geldiğini gösterdi; kural: büyük çizimin içinde animasyon yok, hareket ayrı katmanda. Mesajlarda eksik olan cevap vermeydi (sunucu zaten destekliyordu, arayüz yoktu).
**Batur'un sözleri:** "bazı elemanlar birazcık sönük mü kalmış" · "sadelik demek hani görsel şölenden vazgeçmek demek değil" · "bu kadarcık sade de sevmiyorum" · "Instagram'da paylaşıp vay be dedirteceğin bir şeyler" · "motion grafik ... akıcı ve hani her şeye böyle hani dimdirek değil animasyonlarla hareket" · "ayarlardan kapatabilirim ... sitemizin temasına uyan şekilde yazarak" · "bana uygun seçenek de ekleyelim ... sadece kız temalı olmasın" · "sol altta Milli Kütüphane ... tıklanabilir bir şeye benziyor ama tıklayınca bir şey olmuyor" · "ekip ... yazıya basınca niye bir şey olmuyor ... tam isim gözükmüyor".
**Denenip vazgeçilenler:** Gökyüzünü tek SVG'de CSS ile oynatmak (yavaş telefonda takılıyordu). Ağaç sallanması (maliyetine değmedi).
**Açık:** Kara'nın ana sayfaya işlevli dönüşü n06'da (öneri n06 tanımında). Köy animasyonuna daha fazla ayrıntı n22.
**Batur'un onayı (16 Ekim akşamı):** "Abi çok beğendim. Aga bence gayet güzel olmuş ... Temiz iş çıkarmışsın." Ardından: temalar zayıf (n23), sesler daha gerçekçi olsun (n24), iki ekip için iki hesap doğru ama hesaplar arası geçiş kolay olmalı (n25), Pano'ya dosya yükleme gerekmez.
**Dosyalar:** `src/Home.jsx` (HomeSky katmanları, Ticker, Kinetic, Reveal, StatusArt, VillageTile, BoardTile), `src/home.css`, `src/motionPref.js`, `src/MePage.jsx` (TeamModal), `src/Account.jsx` (LookModal), `src/App.jsx` (saat, sekme kayması, Board), `public/mode.js`, `src/ui.jsx` (reducedMotion), `server/app.js` + `shared/avatars.js` + `src/api.js` (renkler, temalar). Testler: 93 birim, 45 tarayıcı, canlı duman testinde yeni adım.

### n17 · Menü akışı: 4 sekme, Ben sayfası, yeni ana sayfa
Gezinme · 16 Ekim 2026 · c6162645 (Worker cfa3318b)

**Ne yapıldı:** Telefonda alt menü 4 sekme oldu: Kütüp, Köy, Pano, Ben. ☰ menü, üst çubuktaki "Arkadaşını çağır" ve ayrı Planlar sekmesi kalktı. Ana sayfa sırası: yaşayan gökyüzü kartı (selam ve "N kişi kütüpte · M yolda") → "Bugün geliyor musun?" (ana eylem Geldim, yanında Yoldayım; yoldayken Geldim / Vazgeçtim; kütüpteyken yer, süre, Yerimi değiştir / Çıktım) → bildirim ve hesap kartları (gerekirse) → "Kim nerede?" (kütüpte olanlar önde, en son gelen başta) → "Kim ne zaman geliyor?" (planlar, en yakın 3, Ben de / Varım, Plan yap) → Köy ve Pano'ya tek satırlık kapılar. Ben sekmesi: Profilim, Görünüm, İstatistiklerim, Arkadaşını ekibe ekle, Batur'a ilet (rozet burada), Hesap ve cihazlar, Ekipten ayrıl, dev için Komuta merkezi. Kara kartı n06'ya kadar Köy'de. Pano'da telefonda kahve çağrısı en üstte; başlıkla mesajlar arasındaki boşluk (eski ana sayfanın grid-row kuralları) giderildi. Masaüstünde sol menü aynı 4 sekme; sahte basılabilir görünen "Kütüp tayfa ›" oku ve "Milli Kütüphane ↗" kaldırıldı.
**Kararlar ve nedenleri:** Envanterde ana sayfa 375 px'te ~4 ekran boyundaydı ve "kim nerede?" 1,6 ekran aşağıdaydı; ☰ alt menüyü tekrar ediyordu; Benim köşem'in görünür yolu yoktu; Batur'a ilet 3 yerdeydi; aynı işin iki yolu ve üç farklı "çağır" vardı. Batur iki taslaktan B'yi seçti (4 sekme, planlar ana sayfada), çünkü planlar da "kim ne zaman gelecek" sorusunun parçası. Yeni ana sayfa ~2 ekran (bildirim kartı açıkken). Eski `?tab=plans` bağlantıları (plan bildirimi) ana sayfadaki planlara kayar.
**Batur'un sözleri:** "menülerin akışı biraz karışık, ana sayfa mantığı vs. neye basacağımı şaşırıyorum bazen." · "Aga B yapalım beğendim akışı ve düzeni."
**Denenip vazgeçilenler:** A seçeneği (5 sekme, Planlar ayrı). Kara'yı ana sayfada tutmak (n06 onu ekran kenarına taşıyacak).
**Dosyalar:** `src/Home.jsx` (yeni ana sayfa, Badge ve MemberCard buraya taşındı), `src/MePage.jsx`, `src/home.css`, `src/App.jsx` (nav, PAGE başlıkları, Plans/PlanMini/HeroArt silindi), `src/Account.jsx` (ProfileModal üçe bölündü: ProfileModal, LookModal, AccountModal; `leaveTeam`), testler: tarayıcı 41, canlı duman testinde "four tabs and the living home ship".

### n18 · Canlı site, aşama 1: yaşayan gökyüzü ve hareket anları
Tasarım · 16 Ekim 2026 · c6162645

**Ne yapıldı:** "Düzen sakin, dünya canlı" ilkesiyle ana sayfaya hareket dili. Gökyüzü kartı saati anlatır: güneş ve ay sağ üstte saate göre yer alır, gün batımında sıcak tonlar, gece (ya da koyu modda) yıldızlar ve yanan pencereler. Kayan bulutlar, kuşlar, baca dumanı, sallanan ağaçlar, vinç, iki yanda dönen değirmenler (geniş ekranda bütün köy görünür; sahne 960 birim, telefon ortadaki 360'ı görür). Biri gelince: kartı döner, "GELDİ" damgası, kart öne kayar, sayılar yuvarlanır, gökyüzünde minik biri patikadan kütüphaneye yürür ve kapı yanar, üstte "📍 Sıla kütübe geldi" haberi. Geldim'de konfeti ve düşen iğne, kendi kartın döner. Alt menüde seçili sekmenin işareti yaylanarak kayar. Açılış ziyaret başına bir kez: gökyüzü doğar, güneş yükselir, kartlar deste gibi dağılır, sayılar sıfırdan sayar. Ekran dışında ve uygulama arka plandayken döngüler durur; azaltılmış harekette hepsi kapanır.
**Kararlar ve nedenleri:** Önce gerçek uygulamada koda dokunmadan 25 sn'lik video önizleme gösterildi, Batur onayladı. Araç taraması (Batur'un yeni kuralı): Motion (motion.dev) denendi ve kaldı: yerleşim animasyonları (kartların yer değiştirmesi, kayan sekme işareti) ve içerik geçişleri hazır geliyor. Maliyeti ana pakette +21 KB gzip, motor ayrı 28 KB'lık tembel parça (ilk boyamadan sonra yüklenir). Kart dönüşü Motion yerine tarayıcının kendi animasyonuyla (ana pakete bir motor parçası daha girmesin diye). Sürüm 13.5.0 sabit (14.x iki haftadan yeni). LottieFiles motion-design-skill rehberinden zamanlama alındı: kartlar yay 300/24, kutlamalar yay 220/14, toplam kademe 500 ms'yi geçmez. howseen-ai/claude-motion-design ileride tanıtım videosu için aday; oil-motion uygun değil (ücretli API).
**Batur'un sözleri:** "motion grafik üzerine kurulu vay be her şey nasıl da canlı ve dinamik dedirten ve görsel şölen olan bir site istiyorum ama bu ikisini nasıl bir araya getirebiliriz." · "olur" (Motion denemesiyle başlamaya).
**Denenip vazgeçilenler:** Güneşin bütün kartta gezmesi (selamın arkasına giriyordu). Gece = yalnız koyu mod (artık saat de belirliyor).
**Açık (aşama 2):** Köy, Pano ve Ben sekmelerine hareketin yayılması; Kara'nın olaylara tepkisi n06 ile.
**Dosyalar:** `src/Home.jsx` (HomeSky, Walker, Count, Confetti, StatusCard), `src/home.css`, `src/motionFeatures.js`, `src/App.jsx` (LazyMotion, MotionConfig reducedMotion="user", tab-pill).

### d21 · Yeni çalışma sistemi: tasarım rehberi, karar kaydı, kodlu pano
Sistem · 16 Eki 10:05 · ef11b80d

**Ne yapıldı:** DESIGN.md (sitenin görünümü ve çizim dili), KARARLAR.md (bu dosya), HANDOFF.md 67 binden 28 bin karaktere indi ve bölüm 0'a oturum başlangıç sırası eklendi. Panoda kartların kodu görünüyor; tam tanım (`spec`), verilen kararlar (`decisions`), görsel/teknik ve onay bekliyor (`review`) durumu eklendi.

**Kararlar ve nedenleri:** Yeni sohbetler siteye bakmadan çalışıyordu (n13'ün ilk çizimleri reddedildi) ve bir sohbet bilmediği bir işe (n16) kısa brif yazdı. Batur'un seçtiği düzen: paket bitince her şey diske yazılır, sonra Claude hazır bir `/compact` satırı verir ve aynı sohbette devam edilir. Yeni sohbet yalnızca alakasız ya da paralel işler için açılır; brifi işi bilen yazar. Her oturum pano yan panelde açık başlar.

**Batur'un sözleri:** "handofflarda detay daha iyi olsun", "her yapılan iş ve her işin verilen kararları detaylı anlatımı tek dosyada olursa agent onları okuyup yabancılık çekmez", "ama bunları kredi efficient da yapmalıyız".

**Dosyalar:** `kutup/DESIGN.md`, `kutup/KARARLAR.md`, `kutup/HANDOFF.md`; iş panosu artifact'i.

### n16 · Tema düğmesi ana ekranın sağ üstünde
Tema · 16 Eki 10:05 · 16e35609

**Ne yapıldı:** Sağ üstte çanın yanında tek düğme: o anki görünümü çizgi simgeyle gösterir (güneş / ay / yarım güneş; Batur A'yı seçti). Dokununca 3 seçenekli açıklamalı menü: Otomatik (bugünün gün batımı / doğumu saatiyle), Açık, Koyu. Benim köşemdeki ayarla aynı. 44 px dokunma alanı, 360 px'te taşma yok; telefonda üstteki 'Bizim alan ›' ön eki gizlendi.

**Kararlar ve nedenleri:**

Batur'un isteği (15 Eki): temayı ana ekranın sağ üstünden değiştirmek, üç mod, açıklamalı.

Önizleme 375 px'te açık ve koyu modda gösterildi. Batur A'yı seçti: çandaki gibi ince çizgi simge (emoji seçeneği B seçilmedi).

Telefonda yer açmak için üstteki "Bizim alan ›" ön eki gizlendi. Düğme, Benim köşem'deki ayarla aynı ayarı kullanıyor.

### n13 · Özgün çizilmiş avatarlar
Profil · 16 Eki 01:30 · da136d96

**Ne yapıldı:** Kara'nın çizim diliyle 23 karakter + kurucuya ✳ baretli şantiye şefi: 8 kedi (Ankara, Van, tekir, sarman, smokin, üç renkli, füme, siyam), kütüphane ve köy tipleri, astronom, kara delik. Gözlük, kulaklık, bere, kep, atkı denenebilir. Profil, kartlar, pano ve köy haritasında aynı çizim; emojiler duruyor.

**Kararlar ve nedenleri:**

İlk çizimler siteye bakılmadan yapıldı: kalın çizgili, çıkartma gibi, fazla canlı renkli, rastgele hayvanlar. Batur reddetti ("siteyle alakası yok"), yayına çıkmadı.

Batur'un seçtiği yön: kadro sitenin kendi dünyasından (Kara gibi kediler, kütüphaneci, çaycı, baretli usta, kara delik, köylüler). Kara'nın çizim dili: sakin renkler, ton ton gölgeler; yanak kızarıklığı ve çıkartma kenarı yok.

4 örnek gösterildi, Batur onayladı. Sonra 8 kedi, 15 tip ve kurucuya ✳ baretli şantiye şefi çizildi. Emojiler seçilebilir kaldı, mevcut üyelerin avatarı değişmedi.

Ders: Görsel işe siteye bakmadan başlanmaz; önce örnek gösterilir.

### n15 · Karanlık tema (hava kararınca otomatik)
Tema · 15 Eki 21:00 · 628de73a

**Ne yapıldı:** Benim köşemde 'Gündüz mü, gece mi?': Otomatik / Açık / Koyu. Otomatik, Ankara'da güneş batınca koyulaşır, doğunca açılır (bugün 18:10). Gece açılışta beyaz parlama yok, iPhone durum çubuğu da koyulaşır. Bütün kartlar, pano, katalog ve Kara koyuya uyumlu; Kara ay ışığı dairesinin önünde. Yayında.

### n12 · Arkadaşlarla birlikte çalışma
Birlikte · 15 Eki 19:45 · b5f906fd · 949dc037 · e7d54230

**Ne yapıldı:** Ortak ritim (50+10 / 25+5) ve ortak mola bildirimi, çay molası; ekibi çağır + tek dokunuşla katıl, masadakiler, birlikte bitirme satırı; kişiye özel kahve çağrısı (cevap bekleyen pencere), pano bildirimleri, mesaj bandı, okunmamış sayısı, görüldü; pano en yeni mesajda açılıyor; iPhone ana ekran rehberi. Odak ekranına yakınlaştırma ve kenarsız gökyüzü. Göç 19–20.

### d20 · Gün ışığı ve mevsimler
Köy · 15 Eki 19:20 · 436f8dfb

**Ne yapıldı:** Şantiye sahnesi günün saatine göre: gün batımı, gece gök ve yıldızlar, yanan pencereler. Köyde kış karı ve ilkbahar çiçekleri.

### n03 · Kalan şantiye cilası
Şantiye · 15 Eki 19:20 · 436f8dfb

**Ne yapıldı:** Gün ışığına göre sahne, vincin dönmesi, kule ve kulübe varyantlarının gözden geçirilmesi, işçilerin ölçeği.

### n05 · Köy görselleri 2. parça
Köy · 15 Eki 19:20 · 436f8dfb

**Ne yapıldı:** Yapı çeşitleri katalogla, Milli Kütüphane anıtı ortak anıtla, mevsimler (kış, ilkbahar, sonbahar) eklendi.

### d19 · Ses mikseri, ekran açık tutma, Odak ekranı
Odak · 15 Eki 18:30 · e091904a · 3d180a1d

**Ne yapıldı:** 8 sesli mikser (kara delik dahil), katmanlar ve ses ayarları. Telefonda ekran kilidi reddedilirse yedek yöntem ve durum göstergesi. Tam ekran odak ekranı: geri/ileri sayım, saat, yan çevirince flip saat, inşaat gizli/yanında/tam ekran, gizlenen kontroller.

### n11 · Ekonomi 3. faz
Katalog · 15 Eki 17:05 · ccd6df1b · 10ea953a

**Ne yapıldı:** Haftanın yapısı, seri dondurma, sarmaşıklı köy; Haftanın Ustası (taç, +50, nadir plan, panoda duyuru); ortak anıt (kişi başı 250 dk hedef, herkese +50, meydandaki Milli Kütüphane anıtı kat kat yükselir). Göç 18.

### d18 · İnşaat kuralı cihaza göre
Şantiye · 15 Eki 14:15 · 701d6fbf

**Ne yapıldı:** Bilgisayarda sekme ve uygulama değiştirmek serbest; sekme kapanırsa ya da bilgisayar uyursa yıkılır. Telefonda 1 dakika tolerans, çıkınca ve 30 sn kala bildirim.

### d17 · Haftanın yapısı, seri dondurma, sarmaşık
Katalog · 15 Eki 14:00 · ccd6df1b

**Ne yapıldı:** Her pazartesi yeni yapı (şimdi Köy Postanesi, 19 Ekim'de Çay Ocağı), 2 hafta satılır sonra planla. Haftada bir kaçırılan gün seriyi bozmaz. 5 gün çalışmayanın evini sarmaşık sarar.

### n10 · Ekonomi 2. faz
Katalog · 15 Eki 13:45 · 7d52ac51

**Ne yapıldı:** Seri ve +25 devam, imece, yapı etkileri, koleksiyon, nadir planlar ve yapıyı kendi mahallende taşıma (haritada parlayan arsalar). Hepsi yayında.

### d16 · Nadir planlar ve nadir yapılar
Katalog · 15 Eki 13:20 · a7b62152

**Ne yapıldı:** Her bitirilen seansta %10 şansla nadir plan, 7/14/30 günlük seride garanti. Deniz Feneri, Cam Sera; kurucuya özel Olay Ufku Gözlemevi (kubbe ve küçük kara delik). Göç 17.

### n04 · Olay Ufku Gözlemevi
Paket 3 · 15 Eki 13:20 · a7b62152

**Ne yapıldı:** Kurucuya özel katalog yapısı olarak geldi: kubbeli, üstünde dönen mini kara delik. Rozet açıkken katalogda çıkar.

### d15 · İmece, yapı etkileri, koleksiyon
Katalog · 15 Eki 13:10 · 33fa1525

**Ne yapıldı:** Aynı anda odaklanan her arkadaş +%5 (en çok %20). Fırın +%5 maaş, Sahaf +3, Kahve imece +%8, Kütüphane seriye +%5, Değirmen günün ilk seansı +20. Katalogda koleksiyon görünümü, yapılmayanlar siluet.

### d14 · Herkesin istatistikleri
İstatistik · 15 Eki 12:58 · 1cb7c5a3

**Ne yapıldı:** Gelişler, paydoslar ve çöküşler kaydediliyor (geçmiştekiler panodan geri kazanıldı). Her kişi kartında ve 'İstatistiklerim'de: toplam odak, seri, 14 günlük grafik, en iyi gün ve en verimli saat, inşaat başarısı, kütüpte geçen gün ve süre, favori salon, olağan geliş saati, tuğla. Göç 16.

### d13 · Komuta merkezi kapısı ve yeni avatarlar
Hesap · 15 Eki 12:45 · ec97f5e4 · 80fe6983

**Ne yapıldı:** ✳ bir kez basılı tutunca açılıyor (7 dokunuş yerine), rozetli hesapta menüde 'Komuta merkezi'. 12 yeni avatar, kurucuya özel 5 avatar.

### d12 · Seri bonusu ve '+25 dk devam'
Katalog · 15 Eki 10:12 · 0ecfcfd5

**Ne yapıldı:** Araya en çok 10 dk mola: 2. seans +%10, 3. ve sonrası +%20 maaş; çöküş seriyi sıfırlar. Kartta geri sayım, fişte devam düğmesi. Yayında, göç 15.

### n02 · Tuğla ekonomisi ve yapı kataloğu (1. faz)
Katalog · 15 Eki 10:05 · 6af2c9a3

**Ne yapıldı:** 12 yapılık katalog, başlarken malzeme ödenir, bitince maaş (25→25, 50→55, 75→90), serbest çalışma yarım maaş, günün ilk seansı +10, 2 dk bedava vazgeçme, %50 + enkaz kaldırınca %30 iade. Maaş fişi, Batur panelinde tuğla. Yayında, göç 14.

### n07 · Makinelerin birlikte çalışması
Şantiye · 15 Eki 09:00 · 964200e1

**Ne yapıldı:** Vinç gerçek kaldırma döngüsüyle dönüyor; ekskavatör kamyonu kova kova dolduruyor; mikser geri geri pompanın haznesine yanaşıyor. Yayında.

### n08 · Mikser → vinç kovası, malzeme teslim kamyonu
Şantiye · 15 Eki 09:00 · 964200e1

**Ne yapıldı:** Kolon betonunda kova mikserin oluğunda doluyor, boş dönüyor; vinçli düz kasa kamyon temelden önce demir/kalıp, çatıdan önce kiremit getiriyor. Yayında.

### n09 · Grobeton oluğu ve geri dolgu
Şantiye · 15 Eki 09:00 · 964200e1

**Ne yapıldı:** Grobetonda mikserin oluğu çukura iniyor; hafriyat sağ kenarda sırt yığın, 1. kat kolon donatısında ekskavatör geri dolgu yapıyor. Yayında.

### n01 · Ekskavatör ve damperli kamyon ayrıntısı
Şantiye · 15 Eki 08:10 · 11e77097

**Ne yapıldı:** Baklalı palet, karşı ağırlık, hidrolik silindirler, dişli kepçe; nervürlü damper. Yayında.

### d11 · Kule vinç, pompa, mikser, lentolar
Şantiye · 15 Eki 07:55 · f333d709

**Ne yapıldı:** Kafes vinç ve sapanlı yükler, ayaklı mafsallı pompa, spiral tamburlu mikser, duvar boşlukları ve lentolar, korkuluklu iskele.

### d09 · Makineler ve işçiler
Şantiye · 15 Eki 07:30 · bc5f02d3

**Ne yapıldı:** Ekskavatör, damperli kamyon, transmikser, beton pompası; aletli işçiler, el arabası.

### d10 · Malzeme yığınları, çatı makası, teslim töreni
Şantiye · 15 Eki 07:30 · bc5f02d3

**Ne yapıldı:** Azalıp çoğalan yığınlar, makas ve aşık, kurdele ve İSKÂN ALINDI mührü.

### d08 · Betonarme iş akışı (24 iş kalemi)
Şantiye · 14 Eki 20:45 · 792aeb1f

**Ne yapıldı:** Mobilizasyon → aplikasyon → hafriyat → temel → kat kat kolon/döşeme → duvar → çatı → cephe → teslim; hakediş yüzdesi.

### d07 · Köy görselleri 1. parça
Köy · 14 Eki 20:25 · e0c50e97

**Ne yapıldı:** Çam, kavak, sonbahar ağaçları; ot, çiçek, çalı, kaya; yeni tabelalar.

### d06 · Salonlar: Adnan ve Müjgan
Durum · 14 Eki 20:05 · 11332a9b

**Ne yapıldı:** Tek dokunuşluk salon düğmeleri, Adnan varsayılan.

### d03 · Planların görünmemesi
Senkron · 14 Eki 19:55 · 62d0fcb7

**Ne yapıldı:** Takılan yoklama isteği 15 sn'de kesiliyor; plan formu her saat biçimini okuyor, hatayı pencerede gösteriyor.

### d05 · Kara delik kapısı ve geliştirici rozeti
Paket 3 · 14 Eki 19:40 · 013f4da2

**Ne yapıldı:** ✳ kapısı, sayfanın deliğe çekilmesi, gizli rozet, panelde kara delik, yörüngeli avatar.

### d04 · Kayan oturum, JSON geri yükleme, tarayıcı testi
Hesap · 14 Eki 19:25 · 83674000

**Ne yapıldı:** Kullanılan cihaz düşmez; yedek boş kopyaya doğrulanarak kurulur; test:browser Windows'ta çalışıyor.

### d02 · Bildirimleri sağlamlaştırma
Bildirim · 14 Eki 19:05 · 4ea95d31

**Ne yapıldı:** Eski abonelikler bağlandı (9/9), yüksek öncelik, gerçek gelişte her zaman bildirim, ekranda kalan bildirim.

### d01 · Astra denetimini inceleme ve yayın
Denetim · 14 Eki 17:00 · 84f7f0fd

**Ne yapıldı:** Göç 8–10 canlıda; yedek alındı; 33 adımlı canlı duman testi.

## Arşiv (HANDOFF.md'den taşındı, 16 Ekim 2026)

Aşağıdaki bölümler eski HANDOFF.md'den olduğu gibi taşındı. Tarihsel bilgi; güncel durum HANDOFF.md'de.

### Öncelikli devir: Kara yön değişikliği ve duraklama — 15 Ekim 2026

**Batur'un son talimatı: Şimdilik uygulama; isteği HANDOFF'a yaz ve işi duraklat. Krediler yenilenene kadar Claude ile deneme yapacak.** Bu kayıt bir uygulama/yayın onayı değildir. Bu devirde yalnız belge güncellendi; canlı site değiştirilmedi.

- Batur mevcut maskottan henüz tatmin değil. Sorun yalnız atkı çizimi veya animasyon kalitesi değil: kart içinde duran, poz düğmeleriyle yönetilen karakter istediği deneyim olmayabilir. Batur'un en güçlü tercihi: **“canlı yaşaması en çok etkiliyor bence, diğerleri de olmalı.”** Sevimli, gruba ait bir karakter ve şaşırtıcı etkileşimler de istiyor; öncelik sitede kendi hayatı olan bir canlı hissi.
- **Korunacak kimlik:** Adı Kara. Kara deliği anımsatan ama gerçek hayatta olabilecek doğal kedi fenotipi; siyah/füme tüyler ve kehribar gözler. Fantastik galaksi desenleri veya doğa dışı gözler istenmiyor. Statik resim/GIF yerine kodla yaşayan karakter beklentisi sürüyor.
- **Önerilen, henüz onaylanmamış ilk deney:** Kartı ve “Selam / Kitap / Şekerleme” düğmelerini kaldırmak; Kara'ya içerikleri ve mobil gezinmeyi kapatmayan bir ekran kenarı/köşe vermek. Etrafı izleme → yerleşme → uyuklama → dokununca uyanma davranışını doğal geçişlerle kurmak. Rahatsız ederse kolayca kenara çekilebilmeli. Bu fikir henüz uygulanmadı.
- Deneyimin amacı sürekli gösteri veya sürekli kullanıcıya bakan bir animasyon değil; kendi hâlinde bekleme, dinlenme ve anlamlı, ölçülü tepkiler. Örnek fikir: ilk dokunuşta tek gözünü açmak, tekrarında kullanıcıya dönmek; kullanıcı odaklanırken sakinleşmek. Bunlar tasarım örnekleri, kesinleşmiş gereksinim listesi değil.
- Sitede dolaşma ve nesnelerle oynama daha sonraki olası adımlar olarak konuşuldu; henüz onay yok. Önce küçük bir deneyle “orada bir canlı var” hissi değerlendirilmeli. Mevcut çizim/iskelet kullanılabilir ama sırf önceki emek nedeniyle aynı tasarıma bağlı kalınmamalı.
- **Claude için mevcut durum:** Kaynak `astra/gorevler`; son uygulama commit'i `4c35d95e`, son canlı Worker sürümü `fce5c608-7e05-40fb-bba6-0b71b267fd92`. `LiveMascot.jsx` SVG/tepki mantığı, `Mascot.jsx` kart/poz yönetimi, `mascot.css` çizim hareketleri, `App.jsx` yerleşim. Son doğrulama 78 test + 30 tarayıcı kontrolü. Önce güncel dalları ve canlı sürümü kontrol et; başka çalışmaları veya 1A bildirim kuyruğunu geri alma.
- Batur düşük kredi tüketimi, küçük somut adımlar ve her yeni adım için kısa plan/onay döngüsü istiyor. Bu noktada Astra işi duraklattı; yeni uygulama başlatmıyor. Claude devam ederken Batur ile deneyin kapsamını netleştirmeli.

- **Kara kalite revizyonu canlı:** `4c35d95e`, Worker `fce5c608-7e05-40fb-bba6-0b71b267fd92`. Atkı düğüm/iki kumaş ucu/kat/püskül ile yeniden çizildi; doğal duraklama, gecikmeli kumaş hareketi, sakin mırlama, hızlı göz kırpma ve pozuna dönen selam eklendi. 78 test + 30 tarayıcı kontrolü, canlı sağlık ve derleme hash kontrolü geçti. Ayrıntı ASTRA_RAPOR_2.md sonunda.

- **Kara canlı — 15 Ekim 2026:** Batur statik görseli istemedi; adını Kara olarak değiştirdi, doğal kara kedi/kehribar göz fenotipini onayladı. `ca7c9ff9` ile bitmap kaldırıldı, parçalı SVG rig + bakış/kafa takibi, göz kırpma, kuyruk/kulak/atkı, dokunma/pati, uzun basma/mırlama, tekrar dokunma/ters bakış, kitap/uyku/uyanma eklendi. Gerçek odak durumunda kitap okur; 45 sn kendi hâlinde kalınca uyur. Tema ve azaltılmış hareket destekli; ekran dışında animasyonlar durur. `bc5f02d3` Claude inşaat güncellemesi aynen alındı. 78 test + 30 tarayıcı kontrolü geçti. Worker `383c3a7c-3946-4d42-9bf8-a084a54d3a0e`; canlı JS/CSS yerel testli derlemeyle aynı. Sonraki yayın için `astra/gorevler` dalını dahil et. Önceki Mürekkep/WebP notu tarihsel, artık geçerli tasarım değil.


- **Astra 2. tur — 15 Ekim 2026, canlı:** Batur'un doğrudan yayın onayıyla 1A kalıcı bildirim kuyruğu (`35ba3adb`, göç 13) ve küçük Mürekkep tanışma kartı (`82b44941`) yayınlandı. Son Worker sürümü `2bcaa74b-fe63-4e14-beef-25541ef97f8f`. 78 test, 18 mevcut tarayıcı kontrolü ve 6 maskot kontrolü geçti; canlı sağlık/görsel/JS, şema 13, cron ve test hook kapalılığı doğrulandı. **Kod `astra/gorevler` dalında; sonraki platform yayını öncesi bu dalı birleştir, eski kodla geri alma.** Korunan köy/şantiye dosyaları değişmedi. Mürekkep şimdilik sabit mor atkılı WebP + etkileşimli kart; tam SVG/poz/rozet sistemi değil. 1B ve diğer görevler bekliyor. Ayrıntılar: [ASTRA_RAPOR_2.md](ASTRA_RAPOR_2.md).

### Astra denetimi (14 Ekim 2026)

**Yayında (14 Ekim 2026; Claude inceledi ve yayınladı, aşağıdaki son maddeye bak).** Ayrıntılar ve commit listesi [ASTRA_RAPOR.md](ASTRA_RAPOR.md), kurtarma prosedürü [RECOVERY.md](RECOVERY.md). `npm run test:all`: **63/63**, gerçek Chromium: **18/18**, `npm audit`: **0** bildirilen açık. `audit/2026-10-14/` sentetik verili ekran görüntülerini ve ölçümü içerir. Canlı arkadaş grubuna ve `data/` dosyalarına dokunulmadı.

- **Göç 8:** ortak `auth_limits`; normal/owner push abonelikleri oturumla bağlı; owner aboneliğinde `key_hash`; oturum süre indeksleri. Eski abonelikler ilk doğrulanmış ziyarette tekrar bağlanır; sunucu anonim eski kayıtlara bildirim göndermez. Parola kurtarma eski cihazları kapatır; normal cihaz aktarımı ilk cihazı açık tutar. Yönetici tüm cihazlardan çıkış, push ve verilmiş kodları da iptal eder. Node SSE her gönderimde oturumu doğrular.
- **Göç 9:** `write_guard` ve `snapshot_changed` CHECK koşulu; okuma/planlama sırasında değişen ekip veya istek olduğunda batch tamamen geri alınır ve güncel veriyle denenir. Bunu kaldırma; aynı boş arsayı kapma, aynı adlı katılma/profil, paralel odak başlatma ve gecikmiş “görüldü” yarışları için gereklidir. Göç 1–7 değişmedi.
- **Göç 10:** geliş ve mola için ayrı kalıcı bildirim zamanları; `here → break → here` döngüsü 45 dakika sınırını aşamaz. Eşzamanlı durum değişikliği revision korumasına alındı; çift bildirim/pano hareketi üretmez. Eski son bildirim zamanı korunur.
- **Senkron:** geç tamamlanan binanın `created` değeri bitiş zamanı, `touched` değeri eklenme zamanı. İstemci düşük revision’lı yanıtı kabul etmez; köy ağ hatasını yeniden dener. Süresi dolan durum grup revision’ını değiştirir. Enkaz istemcide zamanı gelince kaldırılır.
- **Arayüz:** hesap/profil akışları `src/Account.jsx`, ortak pencereler `src/Modal.jsx` içinde. Modal arka planı `inert`, odağı hapseder/geri verir; giriş sekmeleri ok tuşlarıyla çalışır. Batur kodu prompt yerine kopyalanabilir pencere. Haritada sayfalı bina seçimi ve Enter desteği var. Küçük yazıların ana muted rengi koyulaştırıldı.
- **Çizim:** görünen karolar 40’lık önbelleğe sığacak ölçek seçer; son çizilen karo ekrana aktarılır. Hareket azaltmada çökme anında enkaz görünür. 1.000 bina/122 mahalle Chromium’da doğrulandı; uzakta tek kişi adı, yakında mahalle tabelaları korunur. Saklı koordinatlar değişmedi.
- **Araçlar:** `npm run test:browser` Python Playwright + Chromium ister; tüm verisi geçicidir. Vite HMR artık Node HTTP portunu paylaşır. Bulut `start_skill` taslağı güncellendi; bu site yayını değildir.
- **Claude incelemesi ve yayın (14 Ekim 2026):**
  - **İnceleme:** göç 1–7 aynen duruyor, 8–10 sona eklenmiş, her eleman tek SQL ifadesi. `main` dalına dokunulmamış, sır commit'lenmemiş (yalnızca test şifreleri var). `write_guard`, `INSERT OR REPLACE` ile de CHECK ihlalinde ABORT eder (SQLite kuralı); D1 batch'i tek işlem olduğu için hepsi geri alınır. `auth_limits` yalnızca giriş/sıfırlama/kod/yönetici girişinde birincil anahtar upsert'i yapar, bu da D1 okuma bütçesine dokunmaz. Köy, inşaat modu, hesaplar, gizli kapı ve easter egg'ler korunmuş (bileşenler `Account.jsx`'e taşınmış, davranış aynı).
  - **Değiştirdiklerim:** `init()` içinde `layoutVillages()` hatası yine loglanıp geçiliyor. Astra'nın fail-fast hâli, yerleşim hatasında bütün uygulamayı durdururdu. `.coffee-card .eyebrow` 9.5px'ten 10px'e çekildi (eski bir kural). `/batur` paneline sağ üstte "Uygulamaya dön" düğmesi eklendi (Batur istedi). `audit/` PNG'leri çalışma ağacından kaldırıldı ve `.gitignore`'a eklendi; rapor bağlantıları `c7988d81`'e sabitlendi.
  - **Yayın:** önce `/api/owner/backup` JSON'u ve `wrangler d1 export` SQL yedeği alındı (`data/backup-before-astra-*.json`, `data/kutup-before-astra-*.sql`; canlı şema 7, 1 ekip, 4 üye). Ardından deploy yapıldı; canlı D1 şeması 10. 33 adımlı duman testi (`tests/live-smoke.mjs`) geçti: hesapsız ekip reddi, kurma/katılma, push'un oturuma bağlanması, durum senkronu ve `rev` yoklaması, ayrı geliş/mola soğumaları, pano, köy, büyük harfle giriş, tek kullanımlık aktarım kodu (ilk cihaz açık kalır), Batur koduyla kurtarma (3 eski cihaz 401, eski şifre geçersiz), yönetici "tüm cihazlarda çıkış" (oturum ve push silinir), temizlik (geçici ekip silindi, gerçek ekip 4 kişi aynen).
  - **Push geçişi:** yayından sonra üye aboneliklerinin 1/5'i, yönetici aboneliklerinin 1/3'ü bağlıydı. Diğerleri sahibi uygulamayı (ya da `/batur`'u) bir kez açınca kendiliğinden bağlanır, o zamana kadar bildirim almazlar. Arkadaşlara "uygulamayı bir kez aç" demek yeterli.
  - **Açık notlar (14 Ekim akşamı kapatıldı):**
    - Oturum artık kayan: `GET /session`, 30 günden eski oturumun `created` değerini ve çerezini yeniler; yalnızca bir yıl hiç açılmayan cihaz düşer.
    - JSON yedekten geri yükleme aracı eklendi (`server/restore.js`, `scripts/restore-backup.mjs`); gerçek canlı yedekle prova edildi.
    - `npm run test:browser` Windows'ta çalışıyor: Python Playwright kuruldu, betik Chrome/Edge'i kendisi buluyor; 18/18 geçti.

### Bildirim ve senkron sağlamlaştırma (14 Ekim 2026, yayında)

Batur istedi; Telegram gibi yedek kanal istemedi ("elimizden gelenin en iyisi web push ile").
- **Plan/senkron hatası (arkadaşlar "planlarım başkalarında görünmüyor" dedi):**
  - **Kök neden:** Astra'nın yoklama döngüsüne eklediği `inFlight` kilidinde zaman aşımı yoktu. Ağ değişimi ya da arka plana atılan telefon yüzünden takılan tek bir `/api/state` isteği, sayfa yenilenene kadar bütün senkronu durduruyordu.
  - **Düzeltme:** her yoklamanın kendi `AbortController`'ı var ve 15 saniyede kesiliyor (`App.jsx` `refresh`).
  - **Doğrulama:** canlıda gerçek tarayıcı + ikinci kullanıcıyla denendi. İstek bilerek takılı bırakıldı; 15 saniyede kesildi ve öbür kullanıcının planı ekrana düştü. Sunucu tarafı (plan kaydı, `bump`, 2 saatlik görünürlük) zaten doğruydu.
- **Bildirim teslimi:**
  - Göç 11: eski oturumsuz abonelikleri üyenin en son oturumuna bağladı. `init()` boş `key_hash`'li owner aboneliklerini mevcut anahtara bağlar. Yayın sonrası canlıda üye abonelikleri 9/9, owner abonelikleri 3/3 bağlı.
  - Geliş/mola bildirimleri `Urgency: high` ile gidiyor (Android uykudayken gecikmesin); geliş TTL'i 2 saat.
  - Gerçek geliş (`away`/`coming` → `here`) her seferinde bildirim üretir; yalnızca 5 dakikalık tekrar koruması var (`ARRIVAL_REPEAT`). `break` → `here` ve mola bildirimleri 45 dakikalık soğumayı korur.
  - `sw.js`: geliş bildirimi (`payload.sticky`) `requireInteraction` ile ekranda kalır; ayrıca `renotify` ve titreşim deseni var. `pushsubscriptionchange` gelince yeni abonelik kendiliğinden `/api/push`'a kaydedilir.
- **Zil düğmesi (`enableNotifications` → `notificationsOn`/`notificationsOff`):**
  - Çift dokunmaya kilit (`notificationBusy`), çalışırken sallanan zil (`.working`, hareket azaltmada soluk), `aria-pressed`/`aria-busy`.
  - Her adımın kendi süre sınırı ve kendi Türkçe mesajı var: izin reddi/engel (iOS ve Android ayrı tarif), servis çalışanı başlamadı, push servisine ulaşılamadı (Brave notu), sunucu hatası, oturum kapalı. Eski yanıltıcı "HTTPS…" mesajı kaldırıldı.
  - Açınca `POST /api/push {test:true}` yalnızca o cihaza "Bildirimler açık 🔔" deneme bildirimi yollar (üye başına dakikada en fazla 4).
  - Kapatma anında olur: `kutup-push-off` işareti konur, sunucudan silinir; owner bildirimleri açık değilse tarayıcı aboneliği de kaldırılır. Yeniden açılışta kendiliğinden geri açılmaz; işaret varsa ve abonelik duruyorsa silme isteği tekrarlanır.
  - Uygulama görünür olunca zil gerçek durumu yeniden okur (izin ayarlardan alındıysa kapalı gösterir).
  - Canlı Chromium'da uçtan uca doğrulandı: açma → FCM üzerinden deneme bildirimi gösterildi; ikinci kullanıcı "kütüpte" dedi → `requireInteraction`'lı, titreşimli geliş bildirimi anında geldi; kapatma 0,4 sn, yeniden açma 1,5 sn.
- **Testler:** 65/65 (bildirim zili deneme push'u, `urgency`/TTL, 5 dk / 45 dk kuralı, göç 11). `tests/live-smoke.mjs` şema sürümünü koddan okur.
- **Sıradaki bildirim işi (2. katman, isteğe bağlı):** `push_outbox` + Cron Trigger ile 429/5xx/ağ hatalarında yeniden deneme, servis çalışanından `/api/push/ack` teslim makbuzu, `/batur`'da üye başına bildirim sağlığı, geliş bildiriminde "Yoldayım" eylem düğmesi. iPhone'da web push yalnızca ana ekran uygulamasında çalışır; ekranda kalma ve titreşim deseni iOS'ta yok.

### Önceki paketlerin durumu

- **Paket 1 ✅ yayında.** Ortak köy: `shared/village.js` (hex kafes mahalleler, kıvrımlı yollar, Poisson yerleşim, `createPlanner`), göç 6 (`districts`, `buildings.pos_x/pos_y/facing/district_id/likes/touched`, `building_likes`, `members.ruin_*`, `groups.village_rev`), açılışta `layoutVillages()` eski binalara kalıcı konum verir. `/api/village?rev=&after=` artımlı (sadece değişen satırlar), `POST /api/buildings/:id/like`. Çizim: `src/iso.js` (SVG/Canvas ortak primitifler), `src/villageWorld.js` (dünya + gün/gece tonu), `src/villageView.js` (256px karo önbelleği, LOD, pinch/pan, canlı katman), `src/VillageMap.jsx` (`useVillage`, `VillagePanel`, ana sayfa `VillageNow`). Mahalle kapasitesi en fazla 9, pratikte 7–9.
- **Ölçek:** 5 kişi sıkı bir dönemde ~300–1.900 bina. Sıcak yollar sayaçlarla (`districts.buildings`, `buildings.likes`) çalışır, tüm binaları taramaz (D1 ücretsiz 5M satır/gün sınırı).
- **Paket 1.5 sunucu tarafı ✅ yayında (göç 7):** `members.username/pass_hash/reset_hash/reset_until`; `POST /api/account` (oturum açık cihazdan kullanıcı adı + şifre belirle/değiştir), `POST /api/login`, `POST /api/reset` (Batur kodu + yeni şifre, kullanıcı adı yoksa onu da belirler), `/join` ve `/groups` gövdede `username/password` kabul eder, oturum yanıtlarında `username`. `POST /api/owner/members/:id/reset` 24 saatlik kod üretir; bu kod `/transfer/claim`'de ("Zaten ekipteyim" ekranı) de tek seferlik giriş olarak çalışır. `/batur` panelinde üye satırında 🔑 düğmesi ve `@kullanıcıadı` görünür. Kullanıcı adı ı/i farkına duyarsız.
- **Paket 1.5 arayüzün ilk parçası ✅ yayında:** "Zaten hesabım var, giriş yap" penceresinde "Kullanıcı adıyla / Kodla" sekmeleri (`/login`, `/transfer/claim`); Benim köşem → `AccountBox` (kullanıcı adı + şifre belirle/değiştir). Batru (Batur) hesabı için 14 Ekim'de panelden kod üretildi.
- **Paket 1.5 ✅ tamamlandı (14 Ekim):** giriş penceresinde "Giriş / Şifremi unuttum / Kodla" sekmeleri (`/login`, `/reset`, `/transfer/claim`); katılma/kurma formunda kullanıcı adı + şifre zorunlu; hesabı olmayana ana sayfada "Hesabını koru" kartı; "Ekipten ayrıl" adı yazarak onay ister; `/batur` panelinde üye başına cihaz sayısı, odak saati, bina sayısı, 🔑 giriş kodu, ⎋ tüm cihazlarda çıkış (`POST /api/owner/members/:id/signout`) ve "Tüm veriyi yedekle" (`GET /api/owner/backup`, oturum açan sırlar hariç JSON). Aşağıdaki liste geçmiş plan notudur.
- **Paket 3 ✅ yayında (14 Ekim akşamı; köydeki gözlemevi hariç):**
  - **Kapı:** ✳ kombinasyonu (7 dokunuş + basılı tutma ya da "batur" yazmak) `openBlackHole()`'u açar (`src/BlackHole.jsx`, `src/blackhole.css`). Kendi React kökünde çalışır. Kara deliğin ufku, foton halkası, eğik ve dönen toplanma diski (önden geçen yarısı `clip-path` ile), bükülen ışık halkası ve canvas'ta Kepler sarmalıyla düşen kıvılcımları var.
  - **Spagettileşme:** sayfa (`#root`) gerdirilip döndürülerek ve bulanıklaşarak deliğe çekilir.
  - **Kapı mantığı:** `/api/owner/status` `signedIn` ise `/batur`'a geçer. Değilse "Burası Batur'un kara deliği 🕳️" kartı, anahtar alanı (`/owner/login`) ve "Geri dön" (sayfa geri açılır) çıkar. Hareket azaltmada yalnızca solma var.
  - **Gizli rozet:** göç 12 `achievements(member_id, key, created)` tablosunu ekler; `POST /api/achievements` izin listesiyle çalışır (şimdilik yalnızca `black-hole`) ve kapıyı ilk bulana "Kara delik kâşifi" yazar. Ayrılınca silinir, yedeğe ve geri yüklemeye dahildir. Paket 4 bu altyapıya rozet ekleyecek.
  - **Geliştirici eşyası:** göç 12 `members.badge` ekler. `/batur` → Ekipler → üye satırındaki ✦ düğmesi = "bu ekipteki profilim" (`POST /api/owner/members/:id/badge {dev}`, ekip başına bir tane). `badge` durumla herkese gider. `Avatar` bunu her yerde yörüngede dönen mini kara delik ve turuncu çerçeveyle gösterir. Üye kartında "✦ Kurucu · Olay ufku bekçisi" etiketi var, panoda Batur'un mesajlarının yanında ✦.
  - **Panel kara deliği:** sağ altta kara delik durur. İstek içinde "🕳️ Kara deliğe at" (onay ister) ya da bilgisayarda isteği sürükleyip bırakmak: istek deliğe uçar, yutulur, silinir.
  - **Yan düzeltmeler:** `/batur` Ekipler 375px'te taşıyordu (437px); dar ekranda düğmeler alt satıra iner. Üye satırındaki iki bilgi satırı ayrıldı.
  - **Kalan:** köyde Batur'un mahallesinde "Olay Ufku Gözlemevi" (kubbe, üstünde dönen mini kara delik, gece kubbeden ışık). `badge = 'dev'` olan üyenin mahallesine, binalarla çakışmayan sabit bir noktaya çizilecek (`villageWorld.js` / `iso.js`). Bunun dışında Paket 3 bitti.
  - **Batur'un yapması gereken:** `/batur` → Ekipler → kendi satırında ✦'e bas.
- **Paket 4 ön sürümü ✅ (yalnız istemci, rozet yok):** Gizli not (alt bilgideki imzaya uzun bas), Şşşt (tamamı büyük harf pano mesajı), Çay (panoda tam "çay" → 60 sn tüm avatarlarda 🍵, .tea-time), Gece kuşu (03–05 arası açılış, gecede bir uyarı). Kalan: achievements tablosu, n/12 profil, 🦉 avatar kilidi, Mürekkep kutlaması.
- **Plan formu ve salonlar (14 Ekim akşamı, yayında):**
  - Zeynep'in planı sunucuya hiç ulaşmamıştı (kaydı da pano mesajı da yok).
  - Form artık saat değerini her biçimde okuyor ("10:00:00" dahil), "okunamadı" ile "geçti" mesajlarını ayırıyor ve sunucu hatasını formun içinde gösteriyor.
  - Yeni akış: 7 günlük gün çipleri, geçmişi kapalı saat çipleri, "Başka saat", hazır plan adları, canlı özet.
  - Durum penceresinde salon seçimi artık düğmelerle yapılıyor ve yalnızca tayfanın kullandığı salonlar var: 📚 Adnan (Adnan Ötüken Okuma Salonu, varsayılan; “genelde Adnan’dayız aga”), 📖 Müjgan (Dr. Müjgan Cunbur Okuma Salonu), ☕ Kafeterya, 🌳 Bahçe ve Başka…. Batur diğer salonları istemedi.
- **Köy görselleri 1. parça ✅ yayında (14 Ekim akşamı, `villageWorld.js`):**
  - Ağaçlar türlere ayrıldı (`treeKind`, tohumdan): katmanlı taçlı ve sol üstten ışık alan geniş yapraklı, iki tonlu üç katlı karaçam, kavak. Eylül–kasımda geniş yaprakların ~%40'ı, kavakların ~%70'i sonbahar renginde.
  - Mahalle kenarı sert çizgi yerine geniş, yumuşak bant oldu. Her mahallede ot öbekleri ve kır çiçekleri (zemin geçişi 1, tek öğe), kenarda çalılar (bir kısmı çiçekli) ve kayalar var. Hepsi tohumdan üretiliyor; yollara, gölete, tabelaya ve evlere değmiyor.
  - Tabela yeniden yapıldı: iki direk, çerçeveli tahta, açık renk pano, sahibinin renginde şerit, çatı ve çiçek kasası. Yazı eğimi düzeltildi (eskiden tahtanın tersine eğiliyordu).
  - 1.000 binada köyü kurma ~80 → ~110–135 ms (yalnızca veri değişince; gerçek köy küçük).
- **Batur'un istekleri (14 Ekim akşamı) — sıradaki büyük işler, bu sırayla:**
  1. **2. dalga: inşaat animasyonu, mühendislik doğruluğunda (Paket 5'in yerine geçer).** Batur'un ölçütü: "ODTÜ inşaat mühendisliği standardında accurate". Silikleşip hayalet gibi beliren parça olmayacak; her parça gerçekten yerine konur, örülür ya da dökülerek yükselir. Makineler ve işçiler doğru evrede gelip gider.
     - **Doğru iş akışı (betonarme):**
       1. Mobilizasyon: şantiye çiti, konteyner, iş güvenliği tabelası, malzeme sahası.
       2. Aplikasyon: total station, kazık, ip iskelesi.
       3. Hafriyat: ekskavatör kazar; damperli kamyon gelir, dolar, gider.
       4. Grobeton (transmikser).
       5. Temel su yalıtımı.
       6. Temel donatısı (alt/üst hasır, kolon filizleri) → yan kalıp → beton: transmikser ile beton pompası gelir, bom açılır, hortumcu ve vibratörcü işçi çalışır → kür (koyu ıslak griden açık griye).
       7. **Her kat için döngü:** kolon donatısı (filizlere bindirme) → kolon kalıbı → kolon betonu → kalıp söküm → kiriş ve döşeme kalıbı ile dikmeler → döşeme donatısı → döşeme betonu (pompa + mikser) → kür → üst kat.
       8. Duvar örme (tuğla ya da gazbeton, sıra sıra, lentolar).
       9. Çatı: makas, aşık, yalıtım, kiremit (saçaktan mahyaya). Kulede kule vinç, evde mobil vinç.
       10. Cephe: dış iskele kurulur → doğrama → mantolama → sıva → boya.
       11. İnce işler: kapı, oluk, baca, ışıklar.
       12. İskele söküm, temizlik, peyzaj (çim, ağaç, yol taşı, posta kutusu), kurdele, "İskân alındı ✅".
     - Ekranda o anki iş kalemi ve "hakediş %" görünür. Kulübe 1 kat, ev 2 kat, kule 4–5 kat. Evre ağırlıkları seansın 25/50/75 dakikasına yayılır.
     - **Uygulama:** `ConstructionScene` (SVG, tek rAF, 30 fps) içinde zaman çizelgesi (`phase`, `progress`) ile çizim yapılacak. Makine ve işçi sprite'ları önceden üretilir, görünmezken döngü durur. Hareket azaltmada yalnızca evre geçişleri kalır.
     - **Çöküş:** çatlak → sallanma → parça parça yıkılma → toz → işçiler kaçar.
     - Küçük parçalarla gidilecek: (a) evre zaman çizelgesi, kaba yapı döngüsü, donatı/kalıp/beton çizimi; (b) makineler (ekskavatör, kamyon, transmikser, pompa, vinç) ve işçiler; (c) duvar, çatı, cephe ve ince işler; (d) peyzaj, teslim, çöküş.
     - **(a) ✅ yayında (14 Ekim gece):**
       - `src/construction.js`: `sitePlan(sp)` evreleri ağırlıklarıyla seansa yayar (kaba yapı %0–55, sonra `LATER`: duvar, çatı, doğrama, ince işler, teslim). `siteSVG(P, sp, plan, shown)` her şeyi ilerlemeden doğrudan çizer:
         - Hazırlık: çit ve konteyner, kazık ve ip iskelesi, total station.
         - Temel: kliple kırpılan hafriyat çukuru ve toprak yığını, grobeton, alt ve üst hasır, kolon filizleri, yan kalıp, yükselip kürlenen beton, geri dolgu.
         - Her kat: etriyeli kolon kafesi → kontrplak kolon kalıbı → beton kolon, dikmeler, 3×3 döşeme kalıbı, döşeme donatısı, arkadan öne dökülen döşeme.
       - `Village.jsx`'te yeni parça türleri:
         - `site`: ilerlemeyle yeniden çizilir.
         - `erect`: iskele ve vinç parça parça kurulur ve sökülür; artık silikleşmiyor.
         - `reveal`: çatı saçaktan mahyaya kırpılarak açılır.
       - Vinç kancası çalışılan katta, yükü evreye göre değişir. Sol üstte iş kalemi ve "Hakediş %" yazar (viewBox içinde 24/20 px, telefonda yaklaşık 12/10 px).
     - **(b) ✅ (14 Ekim gece):** `src/crew.js` → `crewSVG(P, sp, plan, shown, time)` dönüşü `{ behind, front }`.
       - Makineler evrenin ilk %15'inde arsanın kenarından girer, son %15'inde çıkar. Katmanlar arsaya kırpılır (`clipPath plot<uid>`).
       - Hafriyat: kepçesi sallanan ekskavatör ve damperli kamyon (gelir, kova kova dolar, gider; 9 sn döngü).
       - Grobeton ve her beton: tamburu dönen transmikser. Temel ve döşeme betonunda üç bomlu pompa döküm cephesine uzanır; hortumcu ve vibratörcü işçi orada çalışır.
       - Her evrede işine uygun minik işçiler (baret, yelek, sallanma).
       - Çizim sırası: `yard` (çit, konteyner, toprak; `siteSVG().yard`) → `crew-back` → bina → `crew-front`. 15 fps.
     - **(c) ilk yarı ✅ (14 Ekim gece):** `Village.jsx`'teki `masonrySVG` ile dolgu duvarlar gazbeton bloklarla sıra sıra örülür; o an örülen sıra iki görünen yüzde ilerler. `facadeSVG` ile "Cephe: mantolama, sıva ve boya" evresinde (0.86–0.93) son duvar rengi iki yüzde alttan yukarı çıkar, sonunda bitmiş duvar (`wallsSVG`) devralır.
     - **Ayrıntı turu 1 ✅ (14 Ekim gece; kodun bir kısmı yanlışlıkla `90558727`'ye girdi, yayını sonraki commit'te):**
       - Kapı ve bahçe artık `pop` değil, `reveal` + `fit` ile çiziliyor: kendi yüksekliklerinde alttan yukarı açılıyor (kapı eşikten takılıyor, bahçe topraktan yeşeriyor). Sahnede `pop` kalmadı.
       - Çöküş baştan yazıldı. 0,75 sn boyunca duvarlarda zikzak çatlaklar büyüyor, yapı giderek sertleşen bir sarsıntıyla titriyor. Ardından parçalar tam renkli düşüyor ve ancak yere indikten sonra tozda kayboluyor. İşçiler `fleeSVG` ile binadan uzağa koşuyor; enkaz kalıyor. Hareket azaltmada enkaz yine anında görünür.
       - **Kalan:**
         - (c) Çatı makası, çatı makası ve kiremit, cephe iskelesiyle mantolama/sıva/boya, kapı (hâlâ `pop` ile büyüyerek geliyor).
         - (d) Peyzaj (bahçe hâlâ `pop`) ve fiziksel çöküş. Çöküş şimdilik eski usul: parçalar düşüp soluyor.
  2. **Yapı kataloğu (koleksiyon, "pokemon gibi").**
     - Sınıflar seans süresine bağlı kalır: Küçük 25, Orta 50, Büyük 75 dk.
     - Her sınıfta geniş bir katalog olacak:
       - Konutlar: kulübe, taş köy evi, ahşap dağ evi, kerpiç ev, apartman, köşk…
       - İşlevsel yapılar: fırın, çay ocağı, mahalle kütüphanesi, değirmen, su kulesi, sera, atölye, okul…
       - Süs yapıları: çeşme, gazebo, heykel, köprü, saat kulesi…
     - **Para birimi:** odak dakikasıyla tuğla (Paket 9'daki fikir buraya taşınır; 1 dk = 1 tuğla gibi). Seans başında sınıftan yapı seçilir; bazıları tuğlayla açılır.
     - **Nadirlik:** nadir ve özel yapılar var. "Haftanın yapısı" her hafta kataloğa yeni yapı getirir. "Haftanın en çok çalışanı" ödül yapısı alır. İleride bazı yapılar bonus verebilir.
     - **Koleksiyon sayfası:** "n/N", yapılmayanlar silüet olarak görünür.
     - **Veri:** `shared/catalog.js` (id, sınıf, ad, tür, nadirlik, bedel, eklenme haftası, planlayıcı ayak izi). Göçle `buildings.model` ve tuğla bakiyesi eklenir. `iso.js`'te model başına `spec`/çizim yazılır. Var olan binalar model olmadan aynı görünmeye devam eder.
     - Paket 6'nın bina çeşitliliği ve Paket 9'un tuğlası bununla birleşir.
  3. Sonra Paket 3'ün gözlemevi ve **Paket 2 — Mürekkep** (aşağıdaki plan geçerli).
- **Paket 2 planı (Mürekkep):** uygulamanın yüzü; Paket 4'ün kutlaması ve şantiye şefi ona bağlı.
  - Plan: `src/Mascot.jsx` (parçalı SVG; kafa, gözler, kulaklar, kuyruk, pati, gözlük, atkı `var(--accent)`; 9 poz; bekleme hareketleri; `say` balonu) ve `src/mascotLines.js` (olay başına 8–15 cümle, tekrar etmeyen seçici).
  - Ardından tanıtım: 3 kart, cihaz başına bir kez. Sonra "İlk gün görevleri" kartı (sunucudan türet: profil süslendi mi, ilk `here`, abonelik var mı, ilk bina; ödül Kurucu tabelası). Sonra sekme ipuçları. En sonda boş durumlara ve şantiyeye yerleştirme.
- **Paket 1.5 plan notu (tamamlandı):**
  1. ✅ Demo kaldırıldı; oturumsuz → `Welcome` ekranı (Giriş yap / Yeni ekip kur; davet linkinde "Ekibe katıl"). Kalan: girişte "Şifremi unuttum" için `/reset` formu (kod + kullanıcı adı + yeni şifre). Şimdilik Batur kodu "Kodla" sekmesinde giriş yaptırıyor, sonra Benim köşem → Hesap'tan yeni şifre belirleniyor.
  2. Katılma/kurma formunda kullanıcı adı + şifre zorunlu (Astra denetiminde sunucu da zorunlu hale getirildi; eski hesaplar korunur).
  3. "Benim köşem"e "Hesap" bölümü (`/api/account`); hesabı olmayanlara ana sayfada nazik hatırlatma kartı.
  4. Veri güvenliği: `/batur`'a "Tüm veriyi yedekle (JSON indir)" uç noktası + düğmesi; "Ekipten ayrıl" yanlışlıkla basılmasın diye ad yazarak onay (ya da 30 gün geri alınabilir yumuşak silme); panelde üye ayrıntısı (cihaz/oturum sayısı, odak toplamı, bina sayısı, tüm oturumları kapat). D1 Time Travel ücretsiz planda 7 gün geri dönüş sağlar (`npx wrangler d1 time-travel restore kutup --timestamp=…`).
  5. Çoklu cihaz: tüm veri sunucuda, istemcide kalıcı veri yok; her yazma `state` döndürür, yoklama `rev` ile. 10 cihaz aynı anda sorun çıkarmaz; bunu bozmamaya dikkat.
- **Önceki plan notları (Paket 1.5):**
  - Girişsiz açılışta demo kişiler (Elif, Zeynep…) yok. Karşılama ekranı: "Giriş yap", "Davet linkiyle katıl", "Kendi ekibini kur" (tek başına da). `/join/<davet>` doğrudan katılma formunu açar.
  - Kullanıcı adı + şifre (PBKDF2, Workers CPU sınırı yüzünden makul iterasyon, hız sınırı). Mevcut üyeler "Benim köşem"den bir kez belirler; uygulama hatırlatır. Her tarayıcıdan "Giriş yap".
  - Şifre sıfırlama: e-posta yok (alan adı yok). Batur `/batur` panelinde üye için 24 saatlik sıfırlama kodu üretir; kişi kullanıcı adı + kod + yeni şifre ile girer. Açık bir cihazdan şifre değiştirilebilir; "Başka cihazda aç" kodu yedek olarak kalır.
- **Paket 7'ye eklendi — Büyük proje modu:** Çok seanslık büyük yapılar (ör. ~10 saatlik okul/apartman), tek başına ya da beraber. Bozulan seans projeyi değil yalnızca o seansın katını yıkar; seans bitince bırakmak serbest. 7 gün dokunulmazsa branda ("beklemede"), asla silinmez. Bitince mahallede büyük simge yapı (planlayıcıya daha geniş FOOTPRINT türü eklenir). Seans başı ev ana döngü olarak kalır.

## 7. İş paketleri (sırayla; her paketin sonunda test + yayın + commit)

Her paket kendi içinde teslim edilebilir. Her paket sunucu tarafında test (`tests/suite.js`, iki çalışma ortamı), göç (`schema.js`'e yeni eleman, gerekirse `core.test.js`) ve 375px'te görsel kontrol ile biter. Paket bitince Batur'a 3–5 satırlık Türkçe özet yaz: ne geldi, nasıl denenir.

### Paket 1 — Ortak köy altyapısı ve köyü öne çıkarmak

**Uzun vadeli tasarım (burayı doğru kur, sonra her şey bunun üstüne gelecek):**
- **Sabit ama doğal konumlar.** Köy asla düzgün simetrik sıralar gibi görünmemeli; gerçek bir köy gibi organik dağılmalı. Batur bunu özellikle istedi.
  - Her binanın konumu veritabanında kalıcı olsun: `buildings`'e `pos_x`, `pos_y` (dünya koordinatı, ondalıklı) ve `facing` (0 = sola bakar, 1 = sağa bakar; aynalı çizim) ekle. Çizim kuralı değişse bile hiçbir bina yer değiştirmez.
  - **Konumu sunucu, bina oluşurken seçer.** Mahallenin içinde, mahalleye özel tohumla Poisson-disk benzeri örnekleme yapılır. En az mesafe bina türüne göre değişir (kule daha geniş yer ister); mevcut binalara, yollara ve mahalle sınırına çarpmayan ilk aday seçilir.
  - Mahalle içinde hafif eğim ya da tepe, gölet, ağaç kümeleri gibi doğal öğeler tohumdan üretilsin. Boşluklar bahçe, çit, patika ve ağaçla dolsun.
  - **Yollar düz ızgara değil, kıvrımlı olsun:** mahalle girişlerini meydana bağlayan yumuşak eğriler. Binaların kapısına giden patikalar yola bağlansın.
  - Göç, mevcut binalara `created` sırasıyla aynı algoritmayla konum atar.
- **Mahalleler (district).**
  - Her üyeye katılınca bir mahalle verilir (`districts` tablosu: id, group_id, member_id, dx, dy).
  - Mahalleler köy merkezinin (Paket 6'daki Milli Kütüphane anıtı) etrafında spiral düzende sıralanır. Merkez meydana yakın olanlar önce dolar.
  - Mahallenin bir kapasitesi var (ör. 9 bina); dolunca aynı kişiye bitişik yeni bir mahalle açılır. Köy dışa doğru organik büyür, hiçbir şey kaymaz. Mahalle sınırları görünmez kare değil, yumuşak ve düzensiz olsun.
  - Mahalle girişinde isim tabelası olur.
- **Ayrılan üye:** bugünkü gibi binaları silinir (gizlilik). Mahallesi "boş arsa" olarak kalır, bir sonraki yeni üyeye verilebilir.
- **Ölçek hesabı:** 10 kişi × günde 2 bina × 365 ≈ 7.300 bina/yıl. Bu yüzden köy haritası SVG DOM ile değil, **Canvas 2D** ile çizilmeli:
  - Statik katman (zemin, yollar, binalar) önbelleğe alınan karolara (tile, ör. 512px) bir kez çizilsin.
  - Sadece canlı katman (ışıklar, yürüyen figürler, duman, kedi) her karede güncellensin.
  - Görünür alan dışındakiler çizilmesin (viewport culling).
  - **Yakınlaştırma seviyesine göre ayrıntı (LOD):** uzakta binalar sade kutular, yakında tam ayrıntı.
  - Parmakla kaydırma ve iki parmakla yakınlaştırma (pinch zoom).
  - İnşaat sahnesi (tek bina) SVG olarak kalabilir.
- **API:**
  - `/api/village` yanıtı kompakt dizilerle dönsün: `[id, memberId, kind, seed, plot_x, plot_y, created]`.
  - `ETag` / `rev` ile değişmediyse boş dönsün.
  - Çok büyüyünce mahalle bazlı (bbox) sorgu yapılabilsin.

**Görünürlük:**
- Alt menüde ve kenar çubuğunda "Odak" sekmesinin adı **"Köy"** olsun (id `focus` kalsın, `?tab=focus` bozulmasın). Sayfa: odak kartı, şantiye, ortak köy haritası.
- **Ana ekrana kompakt "Kütüp köyü — şu an" kartı** (kahraman bölümünün hemen altına):
  - Şu an "Kütüpte" olanın mahallesindeki evin pencereleri yanar, bacası tüter, üstünde avatar balonu durur.
  - "Yolda" olan, köy yolunda yürüyen küçük bir figür olur.
  - Dokununca Köy sekmesine gider.
- **Binaya dokununca kart:** kim, ne zaman, kaç dakika, tür. Altında kalp: yeni `building_likes` tablosu ve uç noktası.
- **Gün/gece:** Türkiye saatine göre köyün tonu, sokak lambaları ve pencere ışıkları.
- **Enkaz:** Çöken inşaat o kişinin mahallesinde 24 saat enkaz olarak görünür (ör. `members.ruin_until`); sonraki tamamlanan bina temizler.
- **İnşaat modu varsayılanı:** yeni cihazlarda açık (`kutup-fidan-on` anahtarı yoksa açık say).

### Paket 2 — Maskot "Mürekkep" ve tanıtım

**Mürekkep, uygulamanın yüzü. Özen göster.**
- **Karakter:** Kütüphanede yaşayan, siyah-beyaz smokin desenli küçük bir kedi. Bir patisi mürekkep lekeli, burnunun ucunda yuvarlak okuma gözlüğü. Boynundaki minik atkı kullanıcının tema renginde (CSS `var(--accent)`).
- **Kişiliği:** Biraz uykucu, biraz iğneleyici ama çok tatlı bir kütüphaneci. Sessizliği sever ("Şşşt"), kitapların üstünde uyur, telefona bakanları süzer, biten binaları alkışlar.
- **Çizim:**
  - Uygulamanın düz, sıcak illüstrasyon diliyle, gradyansız SVG.
  - Parçalı kurulsun (kafa, gözler, kulaklar, kuyruk, pati, gözlük, atkı) ki parçalar ayrı ayrı oynayabilsin.
  - **Bekleme hareketleri:** 4–6 sn'de bir rastgele göz kırpma, kuyruk sallama, ara sıra kulak oynatma.
  - **Pozlar:**
    - oturma
    - uyuma (Zzz)
    - el sallama
    - kitap okuma
    - alkışlama / kutlama
    - şok (çöküş anı)
    - "şşşt" (pati ağızda)
    - baretli şantiye şefi (inşaat sırasında)
    - gece kuşu (mum ışığında)
  - Bir `Mascot` bileşeni `pose`, `size` ve `say` (konuşma balonu) alsın.
- **Göründüğü yerler:**
  - Tanıtım kartlarının anlatıcısı.
  - Boş durumlar.
  - Önemli bildirimlerde küçük kafa ikonu.
  - Köyde dolaşan, çatılarda uyuyan kedi.
  - Şantiyede baretli şef.
  - Easter egg'ler.
- **Mesaj bankası:**
  - Olaylara göre kategorili şablon cümleler, her biri 8–15 varyasyonlu ve Türkçe doğal.
  - Olaylar: biri geldi, uzun süredir kütüpte, bina bitti, bina çöktü, gece yarısı, pazartesi bülteni, ilk giriş, uzun aradan dönüş.
  - Değişkenler: isim, dakika, bina türü.
  - Sıklık sınırı: ekran başına en fazla 1 balon, aynı cümle arka arkaya gelmesin.
- **Etkileşim:**
  - Dokununca rastgele bir cümle ve küçük bir hareket.
  - Uzun basınca mırlama animasyonu, ilk seferde "Kedi dostu" rozeti.

**Tanıtım:**
- **Katıldıktan hemen sonra, cihaz başına bir kez,** Mürekkep'in anlattığı 3 kartlık hoş geldin hikâyesi (kaydırılabilir, atlanabilir, hafif hareketli). Kartlar:
  - "Kim nerede, artık sormak yok"
  - "Odaklan, köyüne ev dik"
  - "Batur'a ne istersen yaz"

  Son kartta iki eylem: bildirimleri aç ve iPhone'daysa ana ekrana ekle tarifi (giriş kodu notuyla).
- **Ana ekranda "İlk gün görevleri" kartı**, hepsi bitene kadar:
  - Profilini süsle
  - İlk "Ben geldim!"
  - Bildirimleri aç
  - İlk kulübeni dik

  Durumlar mümkün olduğunca sunucudan türetilsin. Ödül: mahallede kalıcı "Kurucu tabelası".
- **Her sekmenin ilk ziyaretinde** Mürekkep'ten tek cümlelik, kapatılabilir ipucu.

### Paket 3 — Kara delik, gizli kapı ve Batur'un geliştirici eşyası

**Gizli kombinasyon:**
- **Telefon:** logodaki ✳ simgesine 7 kez hızlı dokunuş, sonuncusunda basılı tutma. **Bilgisayar:** klavyede "batur" yazmak.
- **Kara delik görseli:** Ekranın ortasında bir kara delik açılır.
  - Siyah olay ufku, ışık halkası, dönen sıcak renkli toplanma diski, içine sarmal çizerek düşen parçacıklar.
  - SVG + CSS ya da Canvas; radyal gradyan burada serbest.
  - Sayfa "spagettileşerek" içine çekilir: ana kabuğa merkeze doğru ölçek, dönme, eğme ve bulanıklık.
- **Kapı mantığı:**
  - `/api/owner/status` `signedIn: true` ise doğrudan `/batur` açılır.
  - Değilse delik içinde "Burası Batur'un kara deliği 🕳️" yazar; küçük bir "anahtarın varsa" alanı (`/owner/login`) ve "Geri dön" düğmesi çıkar.
  - Kapıyı bulan kişi gizli rozet kazanır.
- **`/batur` panelinde kara delik bölgesi:** isteği sürükleyip bırakınca ya da "Kara deliğe at" düğmesine basınca yutulma animasyonuyla silinir.
- **Güvenlik aynen kalır:** kombinasyon sadece kapıyı gösterir, anahtar şart.

**Batur'un geliştirici eşyası (herkes görür, Batur uygulamada normal bir üye olarak havalı hissetsin):**
- **Bağlantı:** Yönetici paneline "Bu ekipteki profilim" seçimi ekle; seçilen üyeye `members.badge = 'dev'` yazılsın. Bu alan `state` içinde herkese gitsin; üye listesinde avatar yanında gösterilir.
- **Avatar:** Batur'un avatarının etrafında, her yerde (üye kartı, pano, odak listesi, profil penceresi), yörüngede dönen minik bir kara delik. Küçük, zarif, düşük maliyetli CSS animasyonu.
- **Üye kartı ve profil:** "Kurucu · Olay ufku bekçisi" etiketi, kara delik ikonlu özel çerçeve.
- **Köy:** Batur'un mahallesinde ona özel bir yapı: **"Olay Ufku Gözlemevi"**. Kubbeli küçük gözlemevi, üstünde dönen mini kara delik, geceleri kubbeden ışık.
- **Pano:** Batur'un mesajlarında minik ✦ geliştirici işareti.
- **Ölçü:** abartma; fark edilsin ama göz yormasın.

### Paket 4 — Easter egg'ler ve gizli rozetler

- **Altyapı:** `achievements(member_id, key, created)` tablosu ve izin listesi olan bir uç nokta. Mümkün olanlar sunucuda doğrulansın.
- **Profilde** "Gizli rozetler: n/12"; bulunmayanlar "???" görünür. Rozetin kazanıldığı an Mürekkep küçük bir kutlama yapar.
- **Egg'ler:**
  - **Şşşt:** panoya tamamı büyük harfli mesaj → Mürekkep "şşşt" pozuyla "Şşşt! Burası kütüphane 🤫", rozet.
  - **Gece kuşu:** 03.00–05.00 arası açılış → baykuş teması, Mürekkep mum ışığında "Uyu artık 🦉"; 🦉 avatarının kilidi açılır (sunucu avatar listesi rozete göre izin verir).
  - **Kedi dostu:** Mürekkep'e uzun basmak ya da köyde dolaşan kediye 3 kez dokunmak.
  - **Çay:** panoya tam olarak "çay" yazılırsa 60 saniye boyunca herkesin avatarında 🍵.
  - **Gizli not:** alt bilgideki "Batur’dan, bizim tayfaya." yazısına uzun basınca Batur'dan gizli bir not.
  - **Kara delik kâşifi:** Paket 3'teki kapıyı bulmak.
  - Kalan 6 rozet sonraki paketlerde gelir (özel günler, oyunlar, köy kilometre taşları).

### Paket 5 — İnşaat sahnesinin mühendislik seviyesinde görsel yükseltmesi

Batur inşaat mühendisi; iş akışı gerçekçi ve detaylı olsun, ama sahne yine sevimli ve akıcı kalsın. Mevcut `ConstructionScene` (SVG, tek rAF, 30 fps) üzerine kur.

**Gerçek iş kalemleri** (ilerleme yüzdesine yayılır; ekranda o anki kalemin adı ve "hakediş %" gösterilsin):
1. **Aplikasyon:** total station sehpası, kazıklar ve ip iskelesi (batter board), ipler gerilir.
2. **Hafriyat:** mini ekskavatör kepçeyle kazar, yan tarafta toprak yığını büyür.
3. **Temel:**
   - Kalıp tahtaları çakılır, donatı (hasır çelik) ızgarası serilir.
   - Transmikser gelir, tamburu döner, oluktan beton dökülür.
   - Beton yüzeyi koyu ıslak griden açık griye döner (kür).
4. **Kaba inşaat:**
   - Kulübe ve evde tuğla duvar sıra sıra harçla örülür.
   - Kulede kat kat betonarme kolon ve döşeme: kalıp, dikmeler (iskele direkleri), beton, sonra dolgu duvar.
5. **Çatı:** vinç makasları tek tek yerleştirir, aşıklar konur, kiremitler saçaktan mahyaya sıra sıra dizilir.
6. **İnce işler:**
   - Pencere doğramaları takılır, camda parlama.
   - Kapı takılır.
   - Sıva ve boya kat kat yüzeyi süpürür.
   - Oluk ve baca eklenir.
7. **Peyzaj ve teslim:**
   - İskele parça parça sökülür, moloz kaldırılır, çimen yeşerir.
   - Çiçekler, yol taşları, sahibinin baş harfli posta kutusu eklenir, ışıklar yanar.
   - **Açılış kurdelesi kesilir**, "İskân alındı ✅" damgası iner.

**Sahne canlılığı:**
- 2–3 baretli işçi (sarı ve beyaz baret): yürür, çekiçler, el arabası iter.
- Vinç kancası o anki kalemin malzemesini taşır.
- Toz ve kıvılcım parçacıkları.
- Sahnenin ışığı günün saatine uyar.
- Mürekkep baretle şantiye şefi olarak köşede durur.

**Çöküş daha fiziksel olsun:**
- Önce çatlak çizgileri belirir, yapı sallanır.
- Sonra parça parça yıkılır, toz bulutu kalkar.
- İşçiler kaçışır; "İş güvenliği önce!" tabelası düşer.
- Mürekkep şok pozunda.

**Performans:**
- Parçalar mümkün olduğunca önceden üretilsin.
- Sadece değişenler yeniden çizilsin.
- Görünmezken döngü dursun.
- `prefers-reduced-motion`'da yalnızca kalemler arası geçişler kalsın.

### Paket 6 — Köyün görsel yükseltmesi ve Milli Kütüphane anıtı

- **Bina çeşitliliği:** Her tür için tohuma (`seed`) bağlı 3–4 varyant: balkon, tente, saksı, cumba, farklı pencere düzenleri, malzemeler.
- **Yaşayan köy:**
  - Mahalleleri bağlayan yollar.
  - Geceleri yanan sokak lambaları.
  - "Kütüpte" olanların avatarlı figürleri meydana yürür.
  - Bacalardan duman, kuşlar, gölet.
  - Mevsimler: sonbaharda turuncu ağaçlar, kışın kar.
- **Milli Kütüphane anıtı:**
  - Köy merkezinde, grubun toplam odak dakikasıyla parça parça yükselen bir anıt (kendi aşamalarıyla).
  - Ortak eşiklerde (ör. 10 binada çeşme, 25'te saat kulesi, 50'de park) meydana yapılar eklenir.
  - Eşik aşılınca panoya Mürekkep duyurusu düşer.

### Paket 7 — Beraber inşaat

- "Katıl" ile aynı seansa giren 2+ kişi tek ve büyük bir ortak yapı diker (kafe, okuma salonu).
- Biri çıkarsa yapı çöker.
- Yapı meydanda durur, kimlerin yaptığı yazar.
- **Veri:** `buildings`'e ortaklık için bir katılımcı tablosu.

### Paket 8 — Mola oyunları

- **Kahve çarkı ☕:** kütüpteki arkadaşlar arasında kahveyi kimin ısmarlayacağını seçer.
- **Kütüple:** günde bir Türkçe 5 harfli kelime (Wordle benzeri). Renkli kare sonuçları panoya düşer; Türkçe kelime listesini sen hazırlarsın.

### Paket 9 — Sonrası

- Odak dakikalarıyla tuğla kazanılır, tuğlayla köye süs (bank, ağaç, kedi evi) alınır.
- **Tuğla kulesi:** tek dokunuşla blok düşürme oyunu, haftalık skor tablosu.
- **Mürekkep'in pazartesi bülteni.**
- Özel gün egg'leri: final haftası, yılbaşında kar, Batur'un doğum gününde havai fişek.
