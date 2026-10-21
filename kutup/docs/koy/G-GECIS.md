# n46 G: geçiş, geri dönüş ve ücretsiz planın CPU sınırı

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §8, §10 G, §11.4.

**Canlıda kendiliğinden görünen bir değişiklik yok.** Yeni köy hiçbir ekipte açık değil. Açmak yalnız Komuta merkezinden ve tek tek ekip için yapılıyor; bu karar Batur'da. V1 ekiplerin köyü, istekleri ve maliyeti aynı kaldı.

## Komuta merkezi → Ekipler → Köy düzeni

Her ekip kartında **Köy düzeni** düğmesi var (boş ekipte pasif). Panelde şunlar görünüyor:
- **Şu an:** eski köy mü yeni köy mü, kaç bina, şantiye ve Anıtkabir olduğu.
- **Taslak:**
  - **Yeni köy taslağı hazırla.** Bütün köy Batur'un tarayıcısında planlanıyor. Sunucu taslağı kaydedip kontrol ediyor. Üyeler hiçbir şey görmüyor.
  - Gündüz ışığında **önizleme**.
  - **Eşitle.** Taslak beklerken kurulan yeni binalar eklenir. Önceden yerleşmiş hiçbir yapı yerinden oynamaz; sunucu bunu da kontrol ediyor.
  - **Yeni köyü aç.** Onay sorar. Taslak geride kaldıysa ya da kontrolü bitmediyse düğme pasif.
- **Eski köy / önceki köy:** dönüş için kalan gün sayısı ve **Eski köye dön**.
  - Dönüş süresi 14 gün.
  - Yeni köyde kurulan her bina eski köyde de yerini buluyor, çünkü her yazım V1 konumunu da tutmaya devam ediyor.
  - Bırakılan yeni köy taslak olarak kalıyor.
  - Bir yeni köyden başka bir yeni köye geçildiyse önceki köy önce eşitlenmeli. Sunucu eşitlenmemiş bir köye dönüşü reddediyor.

Her adım tek bir korumalı batch:
- Etkin düzen, içerik sürümü ve taslağın güncelliği aynı batch içinde kontrol ediliyor.
- Arada biri bina kurarsa istek 409 ile dönüyor ve panel yeni durumu gösteriyor.
- Tuğla, ödül, dakika, teslimat ve Anıtkabir katkısına dokunulmuyor.

## Ücretsiz plan: ağır işi işlemi yapanın tarayıcısı yapıyor

Cloudflare Workers ücretsiz planı istek başına yaklaşık **10 ms CPU** veriyor. Batur'un isteğiyle ücretli plana geçilmedi. Ölçülen maliyetler şöyleydi:
- Yeni bir binanın yerini aramak 15–30 ms.
- Bir binanın taşınma önerileri bunun birkaç katı.
- 300 binalık bir köyün tamamını doğrulamak 20–40 ms.

Çözüm: **yeri, işlemi yapanın tarayıcısı seçiyor; sunucu yalnız kontrol ediyor.** Arama kodu tarayıcıda ve sunucuda aynı (`shared/koy2/planner.js`).

| İşlem | Kim planlıyor | Sunucu ne yapıyor |
|---|---|---|
| İnşaatlı seans başlatmak | Üyenin uygulaması, ayrı bir iş parçacığında (Web Worker). Önce köyün son halini küçük bir güncellemeyle alıyor. | `checkPlan` |
| Taşıma önerileri | Üyenin uygulaması | Seçilen öneri için `checkPlan` |
| Hediye, ortak Anıtkabir | Komuta merkezi | `checkPlan` |
| Yeni köy taslağı | Komuta merkezi | Kaydederken hızlı ön kontrol, sonra kurallar 40'ar parsellik parçalar halinde |

**`checkPlan` neye bakıyor** (`shared/koy2/planner.js`):
- Parselin şeklini, ölçüsünü, yüksekliğini ve sürümünü sunucu kendi kataloğundan yeniden hesaplıyor; tarayıcının gönderdiği ölçüye güvenmiyor. Sahibi ve konusu sunucudan geliyor.
- Bütün yeni kimlikler gerçekten yeni olmalı ve sayaçlar yalnız ileri gitmeli.
- Yalnız ayrılmış koridor ve meydanlar açılabilir ya da bırakılabilir.
- Yeni sokaklar:
  - Türünün genişliğinde ve bilinen kavşaklara bağlı olmalı.
  - Köprü ve iskele dışında dere, gölet ve raydan planlayıcının kendi paylarıyla uzak kalmalı.
  - Hepsi köyün yol ağına bağlı olmalı.
- Planın dokunduğu alanın 8 birim çevresindeki her parsel, planlayıcının kendi son denetiminden (`finalCheck`) geçmeli. Bu denetim taban, yol, kapı yolu, kamusal alan, kıyı şeridi, ray ve su bağlamı kurallarını kapsıyor.
- Plan, düzenin istek anındaki revizyonunda yapılmış olmalı.

Kontrol geçmezse ne oluyor:
- **Plan bayatsa ya da kontrolü geçmiyorsa:** sunucu tarayıcının planını hiç yazmıyor. Seans başlatma ve hediyede eskisi gibi yeri kendisi arıyor. Bu yedek yol yalnız yarışta ya da bozuk bir istekte çalışıyor, CPU'su yüksek (aşağıda).
- **Taşımada:** taşıma önerilerini hesaplamak sunucu için çok pahalı. Bu yüzden 409 dönüyor ("Bu arsa artık boş değil") ve üye yeniden seçiyor.

Planlayıcının ürettiği gerçek planların hepsi kabul ediliyor:
- 898 plan: dört tohum, 300'er yapı, kıyı, dere, köprü, ray ve göl bağlamları ile büyük eserler dahil.
- 583 plan: bütün modeller.
- İki taramada da 0 yanlış ret.

Kurcalanmış planlar sunucuda reddediliyor ve hiçbiri yazılmıyor. Test edilenler: komşunun parselinin üstü, küçültülmüş taban, başka modelin yeri, var olan bir kimlik, göletin üstünden sokak (`tests/koy-g-plan.test.js`).

**Bilerek bırakılan risk:** kontrol kuralları denetliyor, "en iyi" yeri değil. Planlayıcıyı bilerek değiştiren bir üye kurallara uyan ama sıradan bir yer seçebilir. Yeni sokağın başka bir sokağı kesme açısı da yalnız komşu parseller üzerinden denetleniyor. 5–10 arkadaşın kullandığı bir uygulama için bu kabul edildi.

### Sunucuda saklanan çözülmüş köy

Bir düzenin satırları her değiştiğinde revizyonu artıyor. Sunucu çözülmüş düzeni ve dizinlerini istekler arasında bu revizyonla saklıyor (`layoutAt`, `server/villageStore.js`):
- Revizyon aynıysa hiç okumuyor.
- Değiştiyse yalnız değişen satırları okuyup ekliyor. Bu, üyenin uygulamasının aldığı güncellemenin aynısı.

`finalCheck`, düzenin kendi dizinlerinin üstüne yalnız planın parçalarını koyuyor; bütün köyü yeniden dizinlemiyor. Planın yazımı da yalnız planın dokunduğu satırları karşılaştırıyor. Bütün satırları karşılaştırmakla aynı sonucu verdiği bir testle doğrulandı.

## Ölçümler

Kaynak: `node tests/koy_g_cpu.mjs 100|300`. Bu makinede Node; JavaScript süresi ölçüldü, veritabanında geçen süre çıkarıldı. Değerler ortanca, parantez içi en kötü.

**Gerçek Cloudflare ölçümü değil.** Cloudflare panelinde CPU zamanı izlenmeli. Batur'un ekipleri bugün 100 binanın altında.

| İstek | V1 (bugün), 300 bina | v2, 100 bina | v2, 300 bina |
|---|---|---|---|
| Köyün tamamı | 1,1 ms | 2,2 (3,2) | 4,6–5,4 |
| İnşaatlı seans başlat | 1,0 | 3,4 (6,3) | 4,0–4,7 |
| Seans bitti, bina köye | 5,4–6,4 | 3,1 (6,7) | 6,6–7,7 |
| Köy güncellemesi | — | 0,6 | 0,5–0,7 |
| Hediye (Batur) | 3,1 (100) · 4–7 (300) | 4,7 (13) | 10,6–12 |
| Taşıma | — | 2,5 | 3,8–5,2 |
| Taslak yükle (bir kez) | — | 5,1 (11) | 9,7 (12) |
| Kural kontrolü, parça başına | — | 4,1 | 4,4 (ilk parça 8–11) |
| Yeni köyü aç / eski köye dön | — | 1,2 / 4,3 | 2,7 / 2,8 |
| *Yedek yol: sunucu planlıyor* | — | *16,6* | *21–31* |

Tarayıcıda, bu makinede ölçülen süreler:
- Yer arama: 19–31 ms.
- 100 binalık taslak: 1,4 sn.
- 300 binalık taslak: 4,6 sn.

Bunlar ayrı bir iş parçacığında çalışıyor, sayfa donmuyor. Telefonda birkaç kat yavaş olabilir. **Fiziksel cihaz doğrulaması bekliyor.**

D1 sorgu sayıları V1'in aynı isteklerine yakın; seans bitişi 53 → 58 (`g-cpu-*.json`).

**Öneri:** yeni köyü önce Batur'un kendi ekibinde açmak ve Cloudflare panelinde hata 1102 ile CPU zamanını izlemek. Sorun olursa **Eski köye dön** tek dokunuş, ve kesilen bir istek hiçbir şey yazmıyor.

## Kanıt

- `tests/koy-g.test.js` (4):
  - Taslak, geride kalma, eşitleme ve aynı parselde şantiye→bina dönüşümü.
  - Geçiş; yeni köyde 100 hediye; 108 binanın hepsiyle eski köye dönüş.
  - Bir yeni köyden diğerine geçiş ve eşitlemeden dönüş reddi.
  - Yanlış tohum, eksik yapı, çakışma (parça kontrolünde 422), eski sürüm, yetkisiz istek.
  - 14 günlük sürenin dolması.
- `tests/koy-g-plan.test.js` (5):
  - Tarayıcı planının olduğu gibi yazılması.
  - Kurcalanmış ve bayat planlar.
  - Tarayıcı önerileriyle taşıma ve bayat seçimin reddi.
  - Batur'un tarayıcısında planlanan hediye.
  - Plan biliniyorsa yazımın bütün satırları karşılaştırmakla aynı sonucu vermesi.
- `tests/koy_g_browser.py`: telefon görünümü, 15 kontrol, gerçek modül Worker'ı.
  - Uygulamadan başlatılan seans tarayıcı planını gönderiyor ve sunucu tam o parseli yazıyor.
  - Batur'un tarayıcısından hediye.
  - Panelin bütün adımları.
  - Görseller: `/mnt/project-files/kutup/n46/G/`.
- Tüm testler: 256/256.

## Bilerek sonraya

- Gerçek Cloudflare CPU ölçümü ve telefonda planlama süresi (fiziksel cihaz).
- Taşıma teklifinin revizyon ya da istek anahtarıyla kilitlenmesi (§5.6). Bugün bayat seçim 409 ile reddediliyor.
- Kendi yazımından sonra saklanan kopyayı doğrudan ilerletmek. Bugün bir sonraki istek küçük bir güncelleme okuyor.
