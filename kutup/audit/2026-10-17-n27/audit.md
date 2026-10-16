# n27 · Sahte basılabilir taraması (17 Ekim 2026, 1. aşama)

Yöntem: uydurma bir ekip (Ada, Ece, Mert, Deniz; biri odakta, biri yolda, mesajlar, bir plan) ve tek kişilik bir ekip kurulup her sekme, sayfa ve pencere 375 px ve 1280 px'te gezildi. Bir betik her ekranda "basılabilir görünen ama işi olmayan" öğeleri aradı: imleç, hover kuralı, ok (› → ↗), hap ya da kart görünümü taşıyan, ama ne kendisi ne de üstündeki bir öğe düğme/bağlantı olmayan her şey (React'in tıklama dinleyicileri de okunarak). Sonra ekran görüntüleriyle tek tek bakıldı ve betiğin kaçırdıkları eklendi. Bu aşamada hiçbiri düzeltilmedi; yalnız liste.

## A. Basılabilir görünüyor, hiçbir şey yapmıyor (düzeltilecek)

| # | Nerede | Neden basılabilir görünüyor | Önerilen iş |
|---|---|---|---|
| 1 | **Üst çubuk, telefon: sol üstteki sayfa adı** ("Kütüp", "Köy", "Pano", "Ben") | Üst çubukta, düğmelerle aynı satırda tek başına duran yazı | Logo (✳) + sayfa adı olsun. Dokununca: sayfa aşağı kaymışsa yumuşakça başa döner, zaten baştaysa Kütüp ana sayfasına gider. |
| 2 | **Üst çubuk, masaüstü: "Bizim alan › Kütüp"** | `›` ok işareti bir yol (breadcrumb) gibi; iki parçası da bir şey yapmıyor | Telefonla aynı: logo + sayfa adı, aynı davranış. "Bizim alan ›" kalkar (ekip adı zaten sol menüde ve ekip kartını açıyor). |
| 3 | **Ana sayfa gökyüzü: "2 kişi kütüpte" hapı** (dönen canlı bilgi) | Yuvarlak, çerçeveli, noktalı hap; filtre çipine benziyor | Dokununca o anki bilgiye götürsün: "N kişi kütüpte" → Kim nerede? bölümüne kayar ve Kütüpte filtresini seçer; "X yolda" → Yolda filtresi; "X odakta" → Köy; plan → planlar. |
| 4 | **Köy, odak kartı: "🧱 0" hapı** | Çerçeveli hap, başlık satırında düğme gibi | Dokununca tuğla kasası açılsın: bakiye, son kazanç/harcamalar (makbuzlar), "Katalog" düğmesi. |
| 5 | **Köy, katalog: "Kasanda 0 🧱" hapı** | Yanındaki "Koleksiyon · göster" hapı düğme, bu değil; ikisi tıpatıp aynı | Ya aynı tuğla kasasını açsın ya da düz yazı olsun (hap çerçevesi kalksın). Öneri: kasayı açsın. |
| 6 | **Köy, katalog: gelecek haftanın yapısı** ("Pazartesi" etiketli, "❔ Çay Ocağı") | Satın alınabilen kartlarla aynı kart; masaüstünde hover'da da öyle tepki veriyor | Kilitli görünsün (soluk, kilit simgesi, hover yok); dokununca küçük not: "Pazartesi açılıyor, o hafta 35 🧱". |
| 7 | **Köy, katalog: parası yetmeyen yapılar** (devre dışı düğmeler) | Kart gibi duruyor, dokununca hiçbir şey olmuyor | Dokununca hafif "hayır" sallanması + not: "35 🧱 eksik, iki seans daha". |
| 8 | **Köy, Koleksiyon görünümündeki kartlar** | Katalog kartlarıyla aynı görünüm, basılmıyor | Yapılmış olanlar dokununca köy haritasında o binaya uçsun; yapılmamışlar kilitli görünsün. |
| 9 | **Pano başlığı: "Bizim pano ✎" kalem simgesi** | Kalem = "düzenle/yaz" simgesi | Dokununca alttaki "Ekibe küçük bir not bırak…" kutusuna odaklansın (klavye açılsın). |
| 10 | **Pano başlığı: "👥 Sadece bizim ekip"** | Simgeli küçük gri yazı, "Plan yap" ile aynı köşede, bağlantı gibi | Dokununca ekip kartı açılsın (kim var, kim nerede). |
| 11 | **Pano: sistem satırı "…plan yaptı. Takvime göz at! 🗓️"** | Bir eyleme çağırıyor ama satır basılmıyor | Dokununca ana sayfadaki planlara (o plana) kaysın. Aynı şekilde "X kütübe geldi" → X'in kartı, "X ekibe katıldı" → X'in kartı. |
| 12 | **Ekip kartı (Ben → ekip adı ya da masaüstü sol menü): kişi satırları** | Çerçeveli kartlar, avatar + durum hapı | Dokununca o kişinin kartı açılsın (kendine dokununca Ben). |
| 13 | **Ben: profil kartındaki üç kutu** ("bugün odak", "bu hafta", "bina") | Ayrı ayrı kutular, ayrı düğme gibi; hepsi Profilim'i açıyor | Kutular İstatistiklerim'i açsın (aşağıda açılır), kartın geri kalanı Profilim'i. |
| 14 | **Davet penceresi: 🪐 🍒 🌱 ＋ çizimindeki "＋" kutusu** | "＋" = ekle düğmesi | Ya dokununca bağlantıyı kopyalasın (ana düğmeyle aynı iş), ya da "＋" yerine boş bir sandalye/"sen?" çizilsin. Öneri: kopyalasın ve "Kopyalandı" desin. |
| 15 | **Batur'a ilet: kesik çizgili "Batur'a özel posta ↗" pulu** | `↗` "aç" demek | Ok kalksın (bu bir pul); ya da dokununca yazı kutusuna kaysın. Öneri: ok kalkar, pul süs olarak kalır. |
| 16 | **Batur'a ilet, masaüstü: "👨‍💻 burayı yapan eleman" kartı** | Çerçeveli, dolgulu kart | Düz yazıya dönsün ya da dokununca Batur'dan kısa bir not göstersin. Öneri: düz yazı. |
| 17 | **Batur'a ilet, masaüstü: aşama yolu hapları** (📮 👀 🎉 🛠️ 🚀) | Her aşama dolgulu bir hap; seçilebilir çip gibi | Hap çerçevesi kalksın, ince bir zaman çizgisi olsun (süs değil, bilgi). |
| 18 | **Pano, masaüstü: "🫶 İyi ki aynı ekipteyiz" paneli** | Kartlarla aynı çerçeveli panel, içinde hiçbir şey yok | Çerçevesiz, sakin bir not olsun (ya da kalksın; aynı bilgi başlıkta var). |
| 19 | **Eski giriş penceresi: kesik çizgili profil önizlemesi** (avatar + "Senin güzel ismin") | Kesik çizgi = "buraya bırak/dokun" | Seçilen girişe göre zaten değişecek; eski pencere kalırsa dokununca karakter seçiciye kaysın. |

## B. Sınırda (karar Batur'un; öneri yanında)

| # | Nerede | Not ve öneri |
|---|---|---|
| 20 | Ana sayfa gökyüzü: "ders arası hayat ✷" eğik pulu | Süs; basılabilir görünmüyor ama göze takılıyor. Öneri: dokununca küçük bir damga sesi/sallanma ve Kara'nın bir cümlesi (sürpriz). |
| 21 | Ana sayfa durum kartı: içinde iğne olan "0 dk" halkası | Yuvarlak düğmeye benzeyebilir. Öneri: dokununca "Yerimi değiştir" açılsın. |
| 22 | Küçük avatarlar (durum kartında "Mert da burada", planlarda "1 kişi geliyor", Pano mesajlarının yanında) | Sitede avatarlar genelde basılıyor (üye kartları). Öneri: hepsi kişinin kartını açsın. |
| 23 | Başlık yanındaki sayı hapları ("Kim nerede? 4", "Kütüp köyü · 0 bina") | Sayı etiketi; dolgulu. Öneri: "4" Herkes filtresini seçsin; "0 bina" bina listesini açsın. Ya da dolgusuz sayı olsun. |
| 24 | Masaüstü sol menü altı: profil satırındaki "⋯" | "⋯" menü açar gibi; Ben'e gidiyor. Öneri: "›" olsun. |
| 25 | Üye penceresi ve ekip kartındaki durum hapları ("Yolda", "Kütüpte") | Etiket; 12. madde düzelince satırın parçası olur. |

## C. Basılabilir görünmeyen ama gözden kaçmış küçük kusurlar

- **Ana sayfa, telefon: Köy ve Pano kutucukları alt alta ve yarım genişlikte.** Yan yana olmaları gerekiyor. Sebep: eski ana sayfadan kalan `.board { grid-row: 5 }` kuralı (`src/styles.css`, telefon medya sorgusu) Pano kutucuğunu 5. satıra itiyor. Tek satırlık düzeltme.
- **iPhone'da giriş formuna dokununca sayfa yakınlaşıyor.** Form kutularının yazısı 12 px; iOS Safari 16 px'in altındaki her kutuya odaklanınca yakınlaştırır. Yeni giriş seçeneklerinde 16 px yapıldı; uygulamanın geri kalanındaki formlar (plan, pano, profil) 2. aşamada.
- **Davet linki doğrudan uzun bir forma açılıyordu.** Arkadaşın ilk gördüğü şey boş bir arka plan üstünde avatar ızgarası. İki giriş seçeneği önce bir karşılama gösteriyor.
- **Köy: "Ortak anıt" kutucuğu açılan pencerede aynı bilgiyi tekrar ediyor** (0 / 1000 dk ve çubuk). Pencere ya yeni bir şey göstersin (kimin kaç dakika kattığı, anıtın katları) ya da kutucuk doğrudan haritadaki anıta uçsun.
- **Renk seçme düğmeleri 30–33 px** (`.color-options`); parmak için 44 px değil. Yeni girişte 44 px dokunma alanı verildi; Profil penceresinde de aynısı yapılmalı.

## Ekran görüntüleri

Bu klasörde: `o1-*` (Seçenek 1, Gökyüzü), `o2-*` (Seçenek 2, Okuyucu kartı), `sample-*` (iPhone rehberi ve boş durum örnekleri), `o1-invite-join.mp4` ve `o2-invite-join.mp4` (davetten katılmaya kısa kayıt).
