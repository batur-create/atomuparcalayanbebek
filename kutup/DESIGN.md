# Kütüp tasarım rehberi

Görsel bir işe başlamadan önce bunu oku. Öncelik sırası: Batur'un sözü → bu rehber → senin zevkin. Burada yazmayan bir karar çıkarsa Batur'a görsel önizlemeyle sor, cevabını bölüm 9'a ekle.

## 1. Genel his

- Sakin, sıcak bir kâğıt zemin üstünde yumuşak pastel renkler. Kütüphane defteri ile küçük bir köyün karışımı gibi bir dünya.
- Oyunsu ayrıntılar küçük ve yerinde: eğik "damga" etiketleri, kesik çizgili daireler, küçük yıldızlar. Gösteriş değil, sıcaklık.
- Şantiye ve köy çizimleri inşaat mühendisi gözüyle doğru olur; ayrıntı bu sitenin kimliği.
- **Sade ama şölen:** Sadelik akışta tekrar ve kafa karışıklığı olmaması demek; görsel şölenden vazgeçmek değil (Batur, 16 Ekim: "bu kadarcık sade de sevmiyorum"). Her kartın bir kişiliği olsun: küçük çizim, kişinin rengi, canlı bir bilgi. Ama birbirinin kopyası, işlevsiz süs yok.
- **Basılabilir görünen her şey bir iş yapar.** Ok, kart görünümü, hover ya da çerçeve taşıyan her yazı ve kutu dokununca adını taşıdığı şeyi açar (ekip adı → ekip kartı, kütüphane → yol tarifi). İşi yoksa basılabilir görünmez. (Batur, 16 Ekim: "basınca bir şey olacakmış gibi duran ama hiçbir şey olmayan tuşlar, yazılar görünce rahatsız oluyorum.")
- **Tema demek kapsamlı:** bir tema yalnız vurgu rengini değil zemini, kartları, kahraman alanını ve gökyüzü tonunu birlikte değiştirir; temalar birbirinden belirgin ayrılır (n23).
- Telefon önce: iPhone Safari ve ana ekran uygulaması. 375 px'te (360'ta da) taşma yok, dokunulan her şey en az 44 px, hover'a bağlı kontrol yok, safe-area'ya uyulur.

## 2. Renk

Bütün renkler `src/themes.css`'teki jetonlardan gelir. Koda yeni sabit renk yazma. Gerekiyorsa yeni bir jeton ekle, her temaya açık ve koyu değerini ver; ardından `node scripts/theme-check.mjs` geçsin.

**Tema bir pakettir (n23).** Altı paketin her biri açık ve koyu modda şunların hepsini değiştirir: zemin, kartlar, çizgiler, yazı, vurgu, Köy'deki koyu stüdyo kartı ve gökyüzü.

| Paket | id | Ruh hâli |
|---|---|---|
| Lavanta | `lilac` (varsayılan) | Sıcak kâğıt, lila mürekkep, zeytin yeşili stüdyo ve limon yeşili |
| Lacivert | `navy` | Gece kütüphanesi: serin kâğıt, pirinç lamba |
| Petrol | `teal` | Buz mavisi kâğıt, petrol yeşili, mercan ışığı |
| Kiremit | `clay` | Kum kâğıt, kiremit, kayısı gökyüzü, bal rengi |
| Gül | `pink` | Gül kurusu ve mürdüm |
| Grafit | `graphite` | Kurşun kalem, aydınger, tek turuncu iz |

Eski seçimler en yakın pakete taşınır (`THEME_MOVED`, `src/api.js` ve `public/mode.js`): `mint` → Petrol, `blue` → Lacivert, `peach` ve `amber` → Kiremit.

| Jeton | Lavanta açık | Lavanta koyu | Ne için |
|---|---|---|---|
| `--canvas` | `#f6f5f0` | `#181916` | sayfa zemini |
| `--paper` | `#fffefb` | `#22231f` | kartlar |
| `--ink` | `#30312f` | `#ebeae4` | ana yazı |
| `--muted` | `#64665e` | `#a5a69c` | ikincil yazı; en soluk yazı tonu |
| `--border` | `#e8e7df` | `#383933` | kenarlar |
| `--accent` | `#7361ce` | `#9483e8` | tek vurgu |
| `--accent-deep` | `#5c49b6` | `#c4b9f5` | vurgu zemini üstünde yazı |
| `--accent-soft` | `#efebfc` | `#2d2940` | vurgu zemini |
| `--on-accent` | `#ffffff` | `#151327` | vurgu dolgusu üstünde yazı ve simge |
| `--hero` | `#e8e3f6` | `#2b2840` | büyük alanlar |
| `--studio`, `--studio-deep` | `#343a32`, `#262823` | aynı | koyu stüdyo kartı (odak kartı, odak ekranı, koyu düğme, bildirim) |
| `--studio-ink` / `-text` / `-soft` / `-faint` | | | stüdyo üstünde yazı, güçlüden soluğa |
| `--pop`, `--pop-ink` | `#d6ef9e`, `#24301a` | aynı | stüdyodaki parlak seçim ve üstündeki yazı |
| `--sky-1..3`, `--night-1..3` | | | ana sayfa gökyüzü, gündüz ve gece |
| `--danger` | `#ad4239` | `#f08b7f` | silme ve ayrılma (her temada aynı) |

- **Sabit nötrler temayı izler:** CSS'teki eski elle seçilmiş kâğıt grileri ve mürekkepler derlemede `--paper`/`--canvas`/`--border`/`--muted`/`--ink` karışımına bağlanır (`scripts/theme-css.js`, dark-css'ten sonra). Renkli sabitler (üye renkleri, altın, canlı noktalar) olduğu gibi kalır.
- **Kontrast:**
  - Yazı en az 4.5:1, büyük yazı (24 px ya da 18.66 px kalın) ve arayüz parçası en az 3:1.
  - Nötr bir yazı `--muted`'dan soluk olamaz; derleme onu `--muted`'a çeker.
  - Renkli yazı (durum çipleri, uyarılar) elle 4.5:1'e ayarlanır.
  - Üye renginde zemin üstündeki yazı yarı saydam `--ink`'tir.
- **Koyu tasarımlı alanlar:** dolgusu jeton olan koyu bir bileşene `/* dark: scope */` yaz, altı da koyu tasarım sayılır.
- **Üye renkleri** (pastel): `--mint`, `--peach`, `--pink`, `--blue`, `--lilac`, `--lemon`, `--slate`, `--sand`, `--olive`. Avatar diskleri ve kişiye ait alanlar bunlardan gelir; temayla değişmez.
- **Koyu mod:**
  - `html[data-mode="dark"]` ile açılır. Jetonlar `src/themes.css`'te, üye renkleri `src/dark.css`'te.
  - Otomatik mod Ankara'da gün batımında koyulaşır.
  - Her yeni ekran ve çizim koyu modda da kontrol edilir.
- Bir ekranda vurgu rengi tek bir şeyi öne çıkarır. Parlak, doygun, neon renk yok.

## 3. Yazı

- **Gövde:** DM Sans. **Başlık ve büyük sayılar:** Bricolage Grotesque Variable. Başka yazı tipi ekleme.
- Arayüz yoğun ve küçük puntolu: etiket ve ek bilgi 10–12 px, kart içi metin 13 px, normal metin 14–16 px, başlıklar 21–27 px, en büyük 35 px.
- **Etiket stili:** 10 px, kalınlık 800, harf aralığı 1.2 px, yanında küçük vurgu noktası (örnek: odak kartındaki "ODAK MODU").
- Kalınlıklar: 400, 500, 600, 650, 700, 800.

## 4. Şekil ve yüzey

- **Köşeler:** büyük kartlar 18–24 px, düğme ve küçük kartlar 9–13 px, çipler tam yuvarlak.
- **Kenar:** 1 px `var(--border)`. Derinlik kenar ve zemin tonuyla verilir.
- **Gölge:** neredeyse yok; varsa çok hafif (saydamlık %3–9). Kalın, koyu gölge kullanma.
- **Küçük süsler:** eğik damga etiketi (yaklaşık −8°), kesik çizgili yörünge dairesi, vurgu renginde küçük yıldız. Ölçülü kullan.

## 5. Çizim dili (avatarlar, rozetler, Kara)

Avatar ve rozet çizimleri n13'te onaylanan çizgide (`shared/avatars.js` başı). Kara'nın kendi stili var (aşağıda).

- Koyu kontur `#25242d`, kalınlık 2.2–2.4 (100'lük kutuda), uçlar ve köşeler yuvarlak.
- Sakin, düz renkler. Aydınlık yüz için tek bir açık ton; degrade yok.
- **Yok:** yanak kızarıklığı, beyaz "çıkartma" kenarı, parlak ya da neon renk, kalın çizgili çizgi film tarzı.
- **Kadro sitenin kendi dünyasından gelir:** Kara gibi kediler, kütüphaneci, çaycı, baretli usta, kara delik, köylüler. Rastgele hayvanlar ya da hazır ikon setleri kullanılmaz.
- Arka plan üyenin kendi pastel rengi. Aynı SVG her yerde kullanılır: sayfada ve köy haritasında (canvas).
- Küçük boyda okunur olmalı: 42, 32 ve 25 px'te, açık ve koyu modda kontrol et.
- Yeni çizimler `shared/avatars.js`'teki kalemleri (`p`, `line`, `circ`, `ell`) kullanır.

**Kara (maskot, n06): sevimli bir kara delik.**
- Simsiyah (`#0b0a0f`), yumuşak, yuvarlak bir kedi; kontur yok, biçimi kadife parlaklıklar verir. Gerçek hayatta görülebilecek bir kedi; fantastik desen yok.
- **Gözler kimliktir:** göz bebekleri hep yuvarlak ve kocaman, irisin yalnız ince altın halkası ve altta açık bir hilal kalır (Batur: "round beautiful eyes, like a cute black hole"). Heyecanda bebekler daha da açılır.
- Gece siluetin kenarına sıcak bir ışık halkası vurur (foton halkası); gündüz bu ışık hafif.
- Tasma tema renginde ve vücudun parçası gibi durur: boyna oturur, çene ve kürk kenarına düşer; künyesi minik bir kara delik. Aksesuarlar (gözlük, baret, kitap, not) da vücuda oturur.
- Kodla yaşayan SVG (`src/Kara.jsx`), 200 × 240 kutuda; oturduğu çizgi y = 171. Evi ana sayfa gökyüzünde kütüphanenin çatısı; odak kartında sayacın yanında.
- Hareketleri küçük anlardır (bakınma, yavaş göz kırpma, pati yalama, esneme...); sürekli döngü yok. Batur'un en güçlü isteği: "canlı yaşaması en çok etkiliyor bence."

## 6. Köy ve şantiye

- İzometrik çizim. `src/iso.js` ilkelleri (`STONE`, `WOOD`, `box`, `outline`, `poly`) aynı kodla hem SVG hem canvas çizer.
- Şantiye gerçek betonarme sırasıyla ilerler. Parçalar yerleştirilir, serilir ya da dökülür; solarak belirmez.
- Gün ışığı ve mevsim: `villageWorld.js` `skyAt()`. Gün batımı, gece gökyüzü ve yanan pencereler, kışın kar, ilkbaharda çiçek.

## 7. Hareket

Batur'un isteği (16 Ekim, n18): "vay be her şey nasıl da canlı ve dinamik" dedirten bir site. İlke: **düzen sakin, dünya canlı.**

- **Düğmeler yerinde durur.** Neye basılacağı hiç yer değiştirmez; hareket düzeni bozmaz.
- **Hareket bir şey anlatır.** Gökyüzü saati, kartlar kimin geldiğini, sayılar değişimi, köy odağı gösterir. Salt süs olan sürekli hareket yok.
- **Her dokunuşa küçük bir cevap:** basınca hafif küçülme (`whileTap` 0.94–0.98), seçimde yaylanan işaret, sonuçta kutlama (konfeti, damga) yalnız gerçek bir olayda.
- **His: oyunsu kâğıt.** Kartlar yay `stiffness 300, damping 24`; kutlamalar `220 / 14`; içerik geçişi 0.32 sn giriş, 0.16 sn çıkış. Kademe öğe başına 60–120 ms, toplamı 500 ms'yi geçmez. CSS'te `--ease-out` ve `--ease-spring` (`src/motion.css`).
- **Araç:** Motion (`motion/react`, sürüm 13.5.0) yalnız `m.*` bileşenleriyle, `LazyMotion` içinde; motor `src/motionFeatures.js` ile tembel yüklenir. Basit tek seferlik hareketlerde tarayıcının kendi `element.animate` yeterli. Sürekli süs döngüleri CSS keyframes ile.
- **Açılış** ziyaret başına bir kez oynar, sekme değişiminde tekrar etmez.
- **Büyük çizimin içinde animasyon yok.** Gökyüzü gibi büyük bir SVG'nin içinde tek bir şey bile oynarsa telefon her karede bütün çizimi yeniden boyar (ölçüldü: yavaş telefonda %91 işlemci, takılma). Hareket eden parça kendi küçük katmanında olur (`src/Home.jsx` HomeSky: `sky-scene` üstünde yüzde konumlu katmanlar).
- **Hareket ayarı (Ben → Görünüm):** Şölen (hepsi), Sakin (süs döngüleri durur, geçişler kalır), Kıpırtısız (hiçbir şey kendiliğinden oynamaz). `html[data-motion]`; seçilmezse telefonun ayarı. Yeni bir süs döngüsü eklerken `home.css` sonundaki Sakin listesine ekle.
- **Pil ve erişilebilirlik:** yalnız `transform` ve `opacity`. Ekran dışındaki ve arka plandaki döngüler durur (`.paused`). `prefers-reduced-motion` açıkken Motion hareketleri (`MotionConfig reducedMotion="user"`) ve CSS döngüleri kapanır. Odak ekranı açıkken arka plan sakin.

## 8. Metin tonu

- Türkçe, samimi ama sade. Kısa cümleler. İngilizce terim yok.
- Düğme ne yapacağını söyler ("Geldim", "Ekibi çağır").
- Emoji ölçülü. Arayüz simgelerinde ince çizgi simge tercih edilir (n16'da Batur çizgi simgeyi emojiye tercih etti).

## 9. Onaylananlar ve reddedilenler

- ✔ **Adresler ve yapısal kalite (26 Eki):** Batur breadcrumb, her ekran/detay için URL ve hikâyenin dahil olmasını istedi; ardından kaynak araştırmasıyla checklist hazırlanıp uygun maddelerin uygulanmasını onayladı. Dört ana bölüm korunur; küçük, tema jetonlu, 44 px bağlantılı sayfa yolu ve bağlantı kopyalama. Hikâye/odak ekranının kendi adresi ve klavye odağı; gerçek linkler, içerik atlama, hata/yeniden deneme ve bağlantı durumları. Yerel/sentetik 360/375/390 px açık-koyu kontroller; fiziksel telefon doğrulaması iddia edilmez. İlerleme ve kanıt `docs/yapisal-kalite/`; teslim PR, yayın yok.

- ✔ **Kuğulu Park (22 Eki):** Kullanıcı fotoğrafları/uydu görünümüyle 28 × 24 m oyun ölçeği ve v1 kapsamını onayladı: “olur, ışık da olsun gece, uygula kapsamı”. Kıvrımlı havuz, adacıklar, ahşap kuğu evleri/çit, olgun ağaçlar, yollar, kafe, oyun alanı ve sade heykeller aynı SVG/Canvas modelinde. Gece sıcak park lambaları, kafe pencereleri ve su yansımaları; kuğu/fıskiye hareketi ayrı küçük katmanda, Sakin/Kıpırtısız ve uzak görünümde durur. Üretim kaydı ve uygulama kanıtları `docs/yapi-atolyesi/isler/kugulu-park/`; yayın yok.

- ✔ **n45 Ekipler (21 Eki):** Ekipler’in başında iki sütunu kaplayan “Yeni ekip” kartı; ekip adının yanında ince kalem; kartta “Davet bağlantısı” kutusu (kanvas zemin, 44 px) ve Kopyala/Yenile; telefonda bağlantı tam satır, düğmeler altta yan yana. Boş ekipte soluk not ve pasif Duyuru yaz. Yalnız tema jetonları; 360/390 px, açık/koyu kontrol edildi. Batur “kendin karar ver” yetkisiyle; görsel ön izleme istenmedi.

- ✔ **Tek odak seansı (21 Eki):** Batur benzer adları ve kalabalığı kaldırma yetkisi verdi; binasız odağı inşaatın karşısında büyük bir mod gibi sunmayı sorguladı. İki büyük mod seçicisi kaldırıldı. Seçili bina + küçük binasız çalışma bağlantısı, üç akışta aynı Ekranı kapatarak çalış anahtarı. Maaş/telefon kuralı yalnız seçilen durum için kısa açıklanır. Tema jetonları, 360/390 px ve klavye kontrolü; sunucu ve mevcut tercihler korunur. Rapor `RAPOR_ODAK_SADELESTIRME.md`.

- ✔ **Doğal köy (20 Eki, sonraki paketler):** Batur yapay bölgeleri ve yayılmayı düzeltmeyi istedi, uygulamayı onayladı. Kayıtlı evler aynı yerde; boş rezervler kamerayı büyütmez. Sahiplik sınırları yerine ortak çayır, ağaç kümeleri, ince toprak yollar ve ev/gölet kesmeyen komşu patikaları. Yeni evler yalnız güvenli adaylar arasından komşulara yakın yerleşir. Aynı 30 bina ile önce/sonra, telefon ve gece kontrol edildi. Rapor `RAPOR_DOGAL_KOY.md`.

Her görsel kararda buraya bir satır ekle. Ayrıntı KARARLAR.md'de, işin kodu altında.

- ✔ **Anıtkabir katkı açıklığı (20 Eki):** Batur 150 dk emeğin 50/250 gibi görünmesini anlaşılır hale getirmeyi onayladı. Büyük toplam dakika, tüm emeğin ortak hedefe yazıldığı açıklaması; altta üç bölümün ayrı payı ve tamamlandı/bölüm açılınca durumu. 150/50/100 örneği açılır açıklamada, Kara ve seans metniyle tutarlı. Tema jetonları, 360/375/390/844 px kontrolleri; hesaplama ve mimari çizim aynı.

- ✔ **Plan keşfi / altı nadir (20 Eki):** Batur onaylı 25 dk %5 / 500 dk garantiyi ve havuzun büyümesini istedi. Katalogda tema jetonlu, yerinden oynamayan ilerleme kartı ve açılır kısa açıklama. Ağaç Evi, Japon Çay Evi, Su Değirmeni, Tren İstasyonu, Planetaryum, Kristal Kütüphane; farklı siluetler, sakin renkler, kendi yapım sıraları. Aynı koddan SVG portre ve Canvas köy; statik resim yok. Anıtkabir etkilenmedi. Sonuç görselleri `/workspace/artifacts/plan-kesfi/`.

- ✔ **Bütünsel buluşma (20 Eki):** Batur “14.00 planına ben 16.00’da gelebilirim” örneğini verip tek sistem istedi. Ortak buluşma içinde kişisel saat, ana sayfada saat grupları, tek katılım kartında Varım/Gelemem/Kararsızım ve geri alma; mevcut buluşmaya yönlendirme. Düzenle/iptal, yeniden onay, kişisel takvim ve tercihli hatırlatma aynı karttadır. Kâğıt/tema jetonları, en az 44 px seçimler, telefonda 16 px girişler; 360/375/390/844 px taşma kontrolü. Ayrı hızlı toggle veya ikinci plan arayüzü yok. Fiziksel iPhone/üretim kontrolü Batur'da.

- ✔ **İmece şantiye hareketi ve açılış (20 Eki):** Ayrı plan Batur'un “onay” yanıtıyla uygulandı. İşe bağlı çalışanlar/makineler, doğru yük döngülü vinç, iş başına yakın kamera, duraklatılabilir/atlanabilir teslim, ortak tamamlanma sonrası beş duraklı 15 sn açılış ve dört kişilik emek defteri. Detaylı anıt sabit Canvas'ta, hareket ayrı katmanda; telefon için kare sınırı ve ekran dışı duraklama. Sakin'de ortam döngüsü yok; Kıpırtısız'da doğrudan son görüntü. Tasarım görselleri yerelde kontrol edildi; fiziksel iPhone/üretim doğrulaması yapılmadı.

- ✔ **Bir Taş da Senden (20 Eki):** Batur doğrudan kodlamayı onayladı; bütün köylerin tek büyük Anıtkabir'i, Kara'nın kişisel görev mektubu, 2.000 dakikalık dayanışma projesi ve herkesin zorunlu payı. Kâğıt/tema jetonlu görev defteri, büyük yakın anıt, ayrı bütün yerleşim/bayrak kameraları. Görsel önizleme onayı istenmedi; gerçek cihaz/üretim görünümü Batur incelemesinde.

- ✔ **Rahat inşaat (19 Eki):** mevcut koyu odak kartında Sıkı/Rahat seçimi; dönüşte aynı şantiye çiziminin 18 saniyelik yapımı, atla/teslim al/köyde gör. Hareket azaltmada doğrudan bitmiş bina. Ayrı bir mod; mevcut şantiye çizimi ve animasyonları korunur. iPhone odak ekranında yalnız sığma ve yön düzeltmesi onaylandı.

- ✔ **n36 inşaat tam şov:** Batur "Tam şov" kademesini seçti: gerçek iş sırası, kirişler, yalıtım katmanları, kulübe/evde mobil vinç (kırmızı taşıyıcı, sarı teleskopik bom), mantolama levhaları ve dübeller. Kule vinç yalnız kulede.
- ✔ **Kara’nın plan postası ve altı yeni nadir (21 Eki):** Mardin Evi, Atakule, Kapadokya Kaya Evi, Yüzen Ev, Asma Köprü ve Kervansaray; aynı koddan SVG/Canvas, gerçek malzemelerine uygun aşamalar. Tema jetonlu bir kez gösterilen plan açılışı, asıl bina çizimi ve kataloğa doğrudan geçiş. Sakin/Kıpırtısız ve hareket azaltma korunur; başka pencereleri ve odak seansını bölmez. Sonuç görselleri `/workspace/artifacts/yeni-planlar/`.

- ✔ **n36b yapım sistemleri:** duvar sistemi belirler: krem/adaçayı betonarme + mantolama, tuğla/taş yığma kagir (düşey ve yatay hatıllar, lentolar), ahşap karkas (dikmeler, OSB, rüzgâr bariyeri), cam çelik karkas (I-kolonlar, çaprazlar, cam çatı).
- ✔ **n36c şantiye denetimi ve metraj:** yapı denetim onayı, slump ve küp numunesi, ruhsat tabelası, canlı metraj ve maliyet ağırlıklı hakediş, TBDY sarılma bölgeleri ve perdeler, Köy panelinde şantiye yakınlaştırma.
- ✔ **n43 Kütüp'ten haberler:** ana sayfada yeni sürüm kartı (vurgu-yumuşak degrade, vurgu kenar), duyuru kartı (pop renkli kenar), "Kütüp'te neler var?" hap kısayolları; Pano'da duyuru balonu vurgu kenarlı ve "📣 Duyuru" etiketli. Komuta merkezinde hediye penceresi: sınıf sınıf küçük bina portreleri, seçilen vurgu-yumuşak; not ve gönder düğmesi altta yapışık. Batur'a ilet türleri telefonda 2×2. Yalnız tema belirteçleri. (Batur önceden görmedi; "kendin karar ver" yetkisiyle, yayından sonra düzeltilebilir.)
- ✔ **n42 Kara’ya sor:** üst çubukta Kara’nın yüzü (kadife baş, kara delik gözler, gecede sıcak kenar); yardım penceresinde Kara solda, vurgu-yumuşak konuşma balonu, hap sekmeler, “+/−” açılan sorular. Tur: koyu perde, aydınlatılan düğmenin çevresinde vurgu renkli halka, Kara’lı kart. Yalnız tema belirteçleri.

- ✔ **n13 avatarlar:** Kara'nın çizim dili, sitenin dünyasından kadro. 4 örnek gösterildi, Batur onayladı.
- ✘ **n13 ilk deneme:** kalın çizgi, çıkartma kenarı, canlı renkler, rastgele hayvanlar. Batur: "siteyle alakası yok". Siteye bakılmadan çizilmişti.
- ✔ **n16 tema düğmesi:** çandaki gibi ince çizgi simge (güneş, ay, yarım güneş). Emoji seçeneği seçilmedi.
- ✔ **n15 karanlık tema:** gün batımında otomatik koyulaşır; Kara ay ışığı dairesinin önünde durur.
- ✔ **n27 Gökyüzü girişi:** karşılama, davet ve ekip kurma tek canlı gökyüzü ekranında; davette ekip patikada bekler, "sen?" yeri. Davet linkinde yalnız ad ve yüz, canlı konum yok.
- ✘ **n27 Seçenek 2 (okuyucu kartı):** giriş için seçilmedi; n28 paylaşım kartı için aday.
- ✔ **n26 Köy 2.0:** odak stüdyosu (İnşaat/Serbest seçici, masadakiler tek satır + Katıl), büyük harita, haritada yüzler, anıt ve tablo kutucukları. Batur: "Köy düzeni tamam." Yaşayan harita (köylüler, kuşlar, odak ışığı, kutlama) yayında, Batur canlıdan bakacak.
- ✔ **n06 yeni Kara:** sevimli bir kara delik (yuvarlak, kadife siyah, altın halkalı kocaman göz bebekleri, gece ışık halkası), çatıda yaşar, haberci ve odak arkadaşı. Batur çizimi onayladı, "direkt deploy" dedi.
- ✘ **n06 ilk deneme:** eski Kara'nın küçültülmüş çizimi; davranışlar tuttu, çizim "tipi hâlâ eski".
- ✔ **Kara:** doğal kara kedi, kodla yaşayan SVG. Statik görsel istenmedi.
- ✔ **n17 menü (B):** 4 sekme (Kütüp, Köy, Pano, Ben), ☰ yok, planlar ana sayfada "Kim ne zaman geliyor?", ana eylem Geldim. A (5 sekme) seçilmedi.
- ✔ **n18-2 görsel şölen turu:** Batur: "Abi çok beğendim ... Temiz iş çıkarmışsın." Hareket animasyonları beğenildi.
- ✔ **n31 Kara v2:** 34 küçük hareket ve 6 nadir sürpriz; tip, oranlar, kenar ışığı ve kürk tonları önceki Kara'nınki. "Ders arası hayat" pulu Kara'nın cümlesi. Batur'un onayı bekleniyor (ikinci üs).
- ✔ **n28 Haftanın hikâyesi:** tam ekran hikâye kartları, her kart bir temalı zemin (gece göğü, stüdyo, kahraman, kâğıt, gündüz göğü, kişinin rengi); sayılar vurarak iner, satırlar tek tek gelir, damgalar basılır. Paylaşım kartı n27'de saklanan "okuyucu kartı" fikri: damgalı kütüphane kartı. Batur'un onayı bekleniyor (ikinci üs).
- ✔ **n30 Masa haritası:** salonun kuşbakışı krokisi; raflar (üye renklerinden kitap sırtları), pencereler (gök rengi), ahşap masalar, kesik çizgili boş sandalyeler, dolu sandalyede avatar ve ad. Seçilen sandalye vurgu renginde nabız atar, onay şeridi stüdyo kartı ve pop rengi düğmeyle. Yalnız tema belirteçleri. Batur'un onayı bekleniyor (ikinci üs).
- ✔ **n32 Çalışma eşi:** istatistikte vurgu-yumuşak kutu (yüz, ad, kısa cümle, sağda vurgu renginde "+%Z beraberken"); hikâyede stüdyo kartı, iki yüz hafifçe birbirine eğik, aralarında pop renginde büyük "&". Basılabilir görünmez. Batur'un onayı bekleniyor (ikinci üs).
- ✔ **n14 Başarımlar:** rozetler §5 çizgisinde, pastel madalyon içinde tek bir Kütüp nesnesi; kesik çizgili iç halka. Açılmayan rozet gri ve soluk, gizli olan "?". Kazanma anı stüdyo kartında, pop renkli küçük başlık, rozet dönerek zıplar. Batur'un onayı bekleniyor (ikinci üs).
- ✔ **n25 Hesaplarım:** Ben sayfasının başında hesap listesi (açık olan işaretli, diğerine ⇄ ile geçiş, "Hesap ekle"); masaüstünde soldaki profil satırı aynı listeyi açar. Birden fazla hesaplı telefonda bildirim başlığı ekip adıyla başlar.
- ✔ **d22 düzeltmeleri:** düğme olan her kart kendi zeminini, köşesini ve iç boşluğunu tanımlar (yoksa tarayıcı gri kutu çizer); sınıf adı yeni bileşende tekrar kullanılmaz (`.mode-switch` çakışması); gökyüzündeki ay ve güneş geniş ekranda da görünür alanda kalır.
- ✔ **n23 temaları:** altı kapsamlı paket (Lavanta, Lacivert, Petrol, Kiremit, Gül, Grafit), her biri zemin, kart, yazı, gökyüzü ve odak kartıyla; soluk yazılar 4.5:1. Batur onayladı.
- ✘ **n18 temaları:** yalnız vurgu rengi değişiyor, tonlar soft ve birbirine yakın ("tema dediğin daha kapsamlı olur"). Revizyon n23.
- ✘ **Pano'ya dosya/fotoğraf yükleme:** istenmedi ("biraz abartı olur").
- ✘ **n17'nin ilk hâli fazla sade:** Batur: "bazı elemanlar birazcık sönük", Köy/Pano satırları "çok basit tasarlanmış gibi". Düzeltmesi n18-2 (kutucuklar, çizimler, renkler).
- ✔ **n18 canlı ana sayfa:** saatle değişen gökyüzü kartı (köy, Milli Kütüphane silueti, vinç, değirmen), gelişte kart dönüşü + "GELDİ" damgası + kütüphaneye yürüyen figür, Geldim'de konfeti, kayan sekme işareti. 25 sn'lik video önizlemesiyle onaylandı.

## 10. Görsel bir iş nasıl yapılır

1. Bu dosyayı oku, KARARLAR.md'de işin alanıyla ilgili kayıtlara bak.
2. İşin dokunduğu ekranların görüntüsünü al: 375 px, açık ve koyu. Yan paneldeki tarayıcıda `resize_window` ile mobil boyuta geç. Batur'a gösterilecek net görüntü için Playwright betiğini kullan (HANDOFF.md, "Net ekran görüntüsü").
3. Gerçek uygulamanın içinde 2–3 seçenek ya da örnek hazırla. Batur'a görüntüyle sor.
4. Seçilen yönle yap. Küçük boyları ve koyu modu kontrol et.
5. Bitince bölüm 9'a bir satır ekle, KARARLAR.md'ye kayıt yaz.
