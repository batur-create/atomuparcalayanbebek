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
| n46 | Köy yenilemesi A–H: görünür şantiye, sokak cephesinden yerleşim, paralel taslak ve geri dönüş (paketler halinde) | Köy | 21 Eki | claude/n46-* PR zinciri |
| n45 | Komuta merkezi → Ekipler: boş ekip kurma (mükerrer yok), ad düzenleme, davet göster/kopyala/yenile; son üye ayrılınca ekip kalır | Batur | 21 Eki | claude/n45-ekip-yonetimi PR |
| imece-katki | Toplam emeğin ve zorunlu bölüm paylarının açık sunumu | Anıtkabir | 20 Eki | codex/imece-contribution-clarity PR |
| plan-kesfi | Dakikaya göre şans, görünür garanti, haftalık kalıcı hak ve altı özgün nadir yapı | Katalog/Köy | 20 Eki | codex/blueprint-discovery PR |
| bulusma | Tek buluşma, kişisel geliş saati, kopya önleme, düzenleme/iptal ve tek hatırlatma | Kütüp | 20 Eki | codex/holistic-meetups PR |
| imece-hareket | İşçi/vinç koreografisi, teslim filmi ve ortak açılış yürüyüşü | Ortak Anıtkabir | 20 Eki | PR #43 |
| imece | Bir Taş da Senden: dört kişinin 2.000 dk ortak Anıtkabir projesi, Kara ve ayrıntılı şantiye | Bütün köyler | 20 Eki | codex/anitkabir-imece PR |
| n43 | Komuta merkezi: yapı ve plan hediye, yapı geri alma, ekibe duyuru, yapı istekleri; Yenilikler ve Ben'deki şeyler ana sayfada | Herkes + Batur | 19 Eki 23:50 | PR #41 |
| rahat-insaat | Ekran kilitliyken süren ayrı mod, aşama bildirimleri, hızlandırılmış teslim ve dar iPhone PWA sığma düzeltmesi | Odak | 19 Eki | codex/relaxed-construction PR |
| n42 | Kara’ya sor: istenince açılan yardım, ilk gelene kısa tur, Köy’de “?” noktaları, sabit alt yazılar kalktı | Herkes | 19 Eki 07:40 | PR #37 |
| n41 | Yenilikler: her sürümde neler değişti, herkes için, Ben'de; 1–16. sürüm geriye dönük | Herkes | 19 Eki 07:30 | PR #36 |
| n36 | İnşaat tam şov, 1. tur: pil, mobil vinç, kirişler, temel su yalıtımı, çatı OSB + örtü, mantolama | Şantiye | 17 Eki 20:15 | 825c5561 (PR #22 via #24, Worker b690b171) |
| n36b | İnşaat tam şov, 2. tur: duvara göre yapım sistemi (yığma kagir, ahşap karkas, çelik + cam) | Şantiye | 17 Eki | 825c5561 (PR #23 via #24, Worker b690b171) |
| n36c | İnşaat tam şov, 3. tur: yapı denetim, slump ve küp, ruhsat tabelası, canlı metraj, maliyet ağırlıklı hakediş, TBDY ayrıntıları, şantiyede yakınlaştırma | Şantiye | 17 Eki | 825c5561 (PR #24, Worker b690b171) |
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

### n46 · Köy yenilemesi (A–H)
Köy · 21 Ekim 2026 · claude/n46-a-taban → … (PR zinciri)

**Plan:** `docs/KOY_TAM_UYGULAMA_PLANI.md` (dal `codex/koy-plan-devir-20261021`, d5f2fd74; 18 revizyon + 19. madde: başlangıçta görünür şantiye, başarıda aynı yerde tek bina, sonra isteğe bağlı taşıma).
**Ediz'in sözleri:** "Plandaki A–H aşamalarının tamamını paketler halinde uygula. Her pakette kontrolleri tamamla, PR hazırla ve yeniden onay beklemeden sonraki pakete devam et." "Birleştirme, yayın ve canlı yerleşimi etkinleştirme bende."
**A · Taban:** dört sabit sentetik sahne (baslangic, yapi32, baskin100 76/8/8/8, anitkabir), korunan satır sağlamaları, gerçek `/api/village` v1 yanıtı, eski köyün ölçülen sorunları (`docs/koy/A-TABAN.md`). Ekip yönetimi (§9) PR #54 ile zaten birleşmişti; yeniden yapılmadı. Önceki analizdeki 37 ölçek kayması bu tabanda yeniden üretilemedi (0), raporda açık yazıldı.
**B · Prototip:** `shared/koy2/` (geometri, 48 model sözleşmesi, arazi, ayrılmış koridorlu sokak-cephesi planlayıcısı, doğrulayıcı) ve `src/koy2/world2.js`; canlı köy ve API değişmedi. Dört sahnede 150 yapı eksiksiz, sıfır ihlal; A'daki kapı/ölçek/bağlam sorunları 0. Dere ve ray önde, gölet arkada: izometrik kamera yalnız +x/+y yüzü gösterdiği için değirmen çarkı, peron ve iskele ancak böyle suya/raya bakar. Derinlik: küçük kutuda örtücü maskesi doğru, 12 figürde 6,6 ms/kare; bant yöntemine gerek yok. Anıtkabir için B ölçeği (1,25×) önerildi, giriş Aslanlı Yol başına taşındı. Palet korundu; yalnız su/ray renkleri eklendi (`docs/koy/B-PROTOTIP.md`).
**C · Veri ve sözleşme:** göç 34 (`focus_runs`, `request_receipts`, `village_changes`, `village_layouts` ve düzen tabloları, `groups.active_layout_id`/`village_content_rev`, `members.focus_run_id`, `buildings.source_focus_run_id`). Her seansın mola/kurtarmada değişmeyen tek run'ı ve tek sonucu var; aynı istek anahtarı aynı başlatmadır. Köy değişiklikleri ekip başına sırayla kaydedilir. v2 düzeni tablo başına tek ifadeyle yazılır (D1 sorgu sınırı). `active_layout_id` NULL = bugünkü köy; v2 etkin ekipte eski uygulama 426 alır. Göç her ekibin bugünkü köyünü legacy baseline olarak dondurur, binalara dokunmaz. Yedek yeni tabloları taşır (`docs/koy/C-VERI.md`).
