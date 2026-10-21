# n46 F — manzara, hava ve köyün ortak hayatı

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §3.1, §6.1, §6.3, §6.4, §10 F.

**Canlıda görünen değişiklik yok.** Hepsi yalnız v2 düzeni etkin ekiplerin haritasında çalışıyor ve v2 hiçbir ekipte açık değil. V1 köyün çizimi, yürüyenleri ve kuşları aynı kaldı. Sunucuya, ödüle, tuğlaya ya da süreye dokunulmadı: `server/` ve `shared/` bu pakette hiç değişmedi.

## Ortak hayat: `src/koy2/life.js`

Hayat kare kare benzetilmiyor. Bir komşunun, kuşun ya da yağmur damlasının nerede olduğu yalnız **ortak saatten** (`Date.now`), ekibin hayat tohumundan ve düzenden hesaplanıyor. Bunun iki sonucu var:
- İki telefon aynı anda aynı köyü görüyor.
- Ekran dışına çıkıp geri gelinen yer zaten doğru durumda oluyor. Ekran dışı için simülasyon yok.

Hayat tohumu `layout.seed + ":life"`, yerleşim tohumundan ayrı. Hava ve hayat yerleşimi hiç etkilemiyor.

**Yürüme ağı:** kullanılır sokaklar (köprüler dahil), kapı yolları ve meydanlar. Bir sokağın ortasından ayrılan sokağın düğümü, kapı yolunun sokağa değdiği nokta ve meydan merkezleri ağa ekleniyor. Yollar en kısa yürüyüşle (Dijkstra) bulunuyor. Bir mekân ilk kez görüş alanına girdiğinde hesaplanıyor ve önbellekte tutuluyor. Figür yalnız bu ağın çizgileri üstünde durabilir, bu yüzden duvar içinde figür olamıyor. Bunu her sahnede iki test denetliyor: ağın her kenarı ve iki saatlik hayatın her konumu "yürünebilir zemin" kontrolünden geçiyor.

| Olay | Nerede (yalnız gerçek mekân) | Süre / ara / en çok | Yağmurda ve gece |
|---|---|---|---|
| Çaycı ziyareti | Gerçek **kahve** binasının kapısı | 30–60 sn kalış, 4–8 dk ara, kapıda 2 kişi | Sürer |
| Sahaf ziyareti | Gerçek **sahaf / kütüphane** kapısı | 45–90 sn, 5–10 dk ara, 2 kişi | Sürer |
| Bankta okuma | Banklı açık meydan (çay, sahaf, pazar meydanları) | 40–90 sn, 3–6 dk ara, bankta 1 | Olmaz |
| Selamlaşma | Açık meydanın köşegeni, bankların ve çeşmenin dışında | 4–8 sn, 2–4 dk ara, 1 çift. Yakındaki komşu geç çıkar, ikisi aynı anda varır | Olmaz |
| Küçük pazar | Gerçek **pazar** binasının yanındaki açık meydan, üstünde şantiye yoksa | 2–3 dk, 4 kişi, meydan başına en az 30 dk ara, aynı anda tek grup | Olmaz |
| Kıyıda kuş | Köyün yanındaki dere kıyısı ve gölet kenarı | 15–30 sn, 3 kuş, 2–5 dk ara | Yağmurda ve gece yok |
| Kelebek | Bostan ve çiçekçi bahçeleri, bahçe meydanları | 10–20 sn, 2, 2–4 dk ara | Yalnız ilkbahar–yaz gündüz |
| Rüzgâr | Görüş alanındaki en çok 6 ağaçtan yaprak düşer | 2–4 sn, 20–40 sn ara | Yağmurda yok |

Ziyaretçi, mekâna en çok 45 birim (≈50 sn) yürüyen bir komşu. Her ev aynı görünüşlü komşuyu çıkarır. Bir komşu aynı anda iki yerde olamaz. Hiçbir figürde ad, üye rengi ya da "çevrimiçi" işareti yok: dekoratif komşular gerçek üye durumuna benzemiyor.

**Bütçe:**
- Görüş alanında en çok 12 dekoratif insan.
- Mahalle görünümünde en çok 8, yapı yakınında 6. Pazar grubu bunların üstüne en çok 4 ekleyebilir.
- Ben odaklanırken en çok 4 kişi var ve pazar kurulmuyor.
- Aynı anda tek doğa ya da hava olayı (yağmur > kuş > kelebek > rüzgâr) ve tek grup olayı.
- Köyün bütünü görünümünde hiç dekoratif insan ve doğa olayı yok.

## Hava

`weatherAt(seed, saat, mevsim)`: her 24 dakikalık pencerede en fazla bir sağanak oluyor. Sağanak pencerenin ilk 5 dakikasında başlıyor ve 1–3 dakika sürüyor, böylece iki sağanak arasında hep en az 16 dakika var. Olasılık mevsime göre değişiyor: kış %35, ilkbahar %30, yaz %15, sonbahar %35.
- Kışın yağmur yerine kar yağıyor.
- Yağmurdan sonra taş meydanlarda 3–6 dakika birikinti kalıyor. Birikinti bank ve çeşmelerin dışında oluyor; yollar kapanmıyor, sel fiziği yok.
- Yağış, sahneye hafif bir perde olarak çiziliyor; karolar yeniden boyanmıyor.
- Hava yalnız görüntü. Ödül, katkı, hasar ya da süre hesabına hiçbir bağı yok.

Gün ışığı, akşam pencereleri, sokak lambaları ve mevsim tonları zaten var olan `skyAt` ile geliyor; v2 bunları aynen kullanıyor.

## Ayrıntı düzeyi (LOD)

Seviye, sıradan bir evin ekrandaki genişliğinden çıkıyor (`HOUSE_SCREEN`):
- 45 px altı köy bütünü,
- 45–120 px mahalle,
- 120 px üstü yapı yakını.

Seviye değişimi için sınırın %15 ötesine geçmek gerekiyor; sınırda parmakla ileri geri yakınlaştırmak çizimi titretmiyor. LOD yalnız hayatın yoğunluğunu değiştiriyor. Bina ölçeği, giriş, yerleşim ve seçim aynı kalıyor.

## Derinlik maskesi (B'nin kararı)

Her figür çizildikten sonra, figürün kutusunu kesen ve onun önünde duran öğeler (`occludersAt`) yalnız o küçük kutuya kırpılarak yeniden çiziliyor. Bina ya da ağaç arkasındaki komşu doğru biçimde arkada kalıyor. Figür bir örtücüyle kesişmiyorsa ek çizim yapılmıyor.

## Hareket ayarları ve pil

- **Kıpırtısız** ve **Sakin**: komşu, kuş, kelebek ve yaprak yok. Yağmur varsa durağan perde ve birikinti olarak görünüyor; çizim döngüsü uyuyor (tarayıcıda 2,5 sn'de 0 kare).
- **Sekme gizli**: hiç kare çizilmiyor (tarayıcıda 0 kare). Gerçek odak süresi sunucuda kendi kuralıyla yürüyor.
- **Hareket açık**: canlı katman yaklaşık 24 kare/sn (3 sn'de 72 kare). Görünürde yürüyen yokken döngü 2 sn'de bir uyanıyor.

## Manzara

- **Koruluklar:** ağaçlar düzgün serpilmiyor. Pürüzsüz bir gürültü alanı, köyün dışında koruluklar ve aralarında açık tarlalar oluşturuyor. Köy içinde ağaçlar meydanların çevresinde kümeleniyor, sokak boyunca seyreliyor (§3.1).
- **Çayırlar:** açık zeminde yumuşak çayır lekeleri var. İlkbahar ve yaz beyaz, sarı, pembe, mor çiçekli; sonbahar hardal tonlu; kış çiçeksiz. Lekeler sokak, kapı yolu ve parsellerin dışında kalıyor.
- **Tepeler:** köyün çevresindeki tarlaların ötesinde alçak, gölgeli tümsekler var. Bunlar yalnız görüntü: üstlerinde bina ya da yol yok, `heightAt()` hâlâ 0. Gerçek eğimli arazi ve teras isteyen model olmadığı için E'deki karar korunuyor.

## Kanıt

- `tests/koy-f.test.js` (10 test):
  - Ağın her kenarı yürünebilir zeminde.
  - İki saatlik hayatta her figür yürünebilir zeminde; mekânlar gerçek binalar; kişi, mekân ve tekil komşu sınırları tutuyor.
  - Kahve yoksa çay ziyareti yok; yeni kahve gelince yeni sokaklardan ziyaret başlıyor.
  - Aynı saat her sırada aynı köyü veriyor.
  - Bir mekânın dinlenme arası korunuyor; aynı anda tek pazar var.
  - Sakin, Kıpırtısız, köy bütünü ve odak sessiz kalıyor.
  - Hava: kısa ve seyrek sağanak, kar yalnız kışın, yağmurda dışarıda hayat yok.
  - Kelebek yalnız ilkbahar ve yaz gündüzü.
  - LOD histerezisi çalışıyor.
  - `life.js` yalnız düzlem geometrisi içe aktarıyor, ödüle dokunmuyor.
- `tests/koy_f_browser.py`: yerel geliştirme sunucusu, sabit saat ve tohum, `baskin100` sahnesi. Telefon görünümü 390×844 DPR 2 ve masaüstü 1440×900. 8 kontrol. Görseller `/mnt/project-files/kutup/n46/F/`:
  - `f-gunduz-telefon.png`, `f-aksam-telefon.png`, `f-gece-telefon.png`
  - `f-yagmur-telefon.png`, `f-kar-telefon.png`, `f-kipirtisiz-telefon.png`
  - `f-koy-butunu-masaustu.png`, `f-yakin-masaustu.png`
  - `f-results.json`
- Kare maliyeti (Chromium telefon öykünmesi, bu makine): canlı katman ortanca 0,85 ms, %95 1,2 ms. **Fiziksel telefon ölçümü değil**; G'de gerçek cihazla bekliyor.

## Bilerek sonraya

- Fiziksel telefon ölçümü ve 12 kişi sınırının gerçek cihazda doğrulanması: **G**.
- Köprü altından geçen rota yok (B'nin açık sorusu). Yürüme ağı köprüden yalnız üstten geçiyor, köprü altında yürünecek bir yol bulunmuyor.
- Oturan figür ayrı çizilmiyor, bankta ayakta bekleyen komşu olarak görünüyor.
- İkinci gölet ve kıyı yolu yok. Kuşlar mevcut dere ve gölet kıyısında.
