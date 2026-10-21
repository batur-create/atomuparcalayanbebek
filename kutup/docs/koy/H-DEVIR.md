# n46 H: son teslim ve devir

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §10 H, §11.

**Canlıda kendiliğinden görünen bir değişiklik yok.** Yeni köy (v2) hiçbir ekipte açık değil. Bütün paketler birleştirilip yayınlansa da her ekip bugünkü köyde kalır. Yeni köyü yalnız Batur açar, Komuta merkezinden ve tek tek ekip için. Birleştirme, yayın ve açma kararı Batur'da.

## Paketler ve birleştirme sırası

Her PR bir öncekinin dalının üstünde. Sırayla birleştirilmeli:

| Sıra | PR | Paket | Ne getiriyor | Not |
|---|---|---|---|---|
| 1 | #55 | A | Sabit sahneler, bugünkü köyün ölçümü | Çalışan koda dokunmuyor |
| 2 | #56 | B | v2 prototipi (`shared/koy2`, `src/koy2`) | Çalışan koda dokunmuyor |
| 3 | #58 | C | Veri, API, **göç 34** | Göç yalnız tablo ve sütun ekliyor |
| 4 | #59 | D | Şantiye, aynı arsada bina, planlı taşıma | |
| 5 | #60 | E | 48 model, büyüme, ortak Anıtkabir alanı (1,25×) | |
| 6 | #63 | F | Manzara, hava, köy hayatı | |
| 7 | #64 | G | Komuta merkezi → Köy düzeni, geçiş, 14 gün geri dönüş, ücretsiz plan CPU'su | |
| 8 | H | H | Güncel `kutup-platform` ile birleştirme, devir notu, Yenilikler 27 | |

PR'lar taslak açıldı. Birleştirmeden önce her birinde **Ready for review** gerekiyor. Vercel kontrolünün kırmızı olması bilinen ve ilgisiz bir durum.

Birleştirme sırası şöyle işliyor:
- #55 `kutup-platform`'a birleşince GitHub #56'nın tabanını kendiliğinden `kutup-platform` yapar. Sonraki her PR için de aynısı olur.
- Bu yüzden her PR'da yalnız kendi paketinin farkı görünür.

H dalında güncel `kutup-platform` (#57, #61, #62) zaten birleştirildi:
- Tek çakışma `/focus` başlatmadaydı.
- İki taraf da korundu: n46 C'nin seans kaydı ve tekrar makbuzu, n47'nin izleyen cihaz ve seans türü ayarları.
- `memberColumns` içindeki n47 alt sorguları ve n47'nin `/focus` değişiklikleri çakışmadan geldi.
- Yenilikler: 25 (#57) ve 26 (#61) korunuyor, köy için 27 eklendi.
- Göç: n47 göç eklemedi. 34 bu iş için kullanıldı, **sıradaki göç 35**.

## Yayın

Sıra `npm run yayin` ile her zamanki gibi:
1. Önce canlı yedek alınır.
2. Sonra yayın yapılır.
3. Göç 34 kendiliğinden çalışır.

Göç 34'ün yaptıkları:
- Yeni on tablo ve birkaç sütun ekliyor. Var olan hiçbir satırı silmiyor ya da değiştirmiyor.
- Her ekip için bugünkü köyün donmuş bir kopyasını (`legacy-<ekip>`) ve süren seanslar için seans kaydı üretiyor.
- Ekiplerin etkin düzeni boş kalıyor, yani herkes eski köyde.

Yayından sonra beklenen:
- Uygulama ve köy bugünkü gibi görünür.
- Yenilikler'de 27 numaralı "Yeni köy hazır, Batur açınca gelecek" kartı çıkar.

### Yedek ve geri yükleme

- `/owner/backup` yeni tabloları içeriyor. Geri yükleme onları ebeveynden çocuğa sırayla yazıyor; testte geri yüklenen v2 düzeni birebir aynı çıkıyor (`tests/koy-c.test.js`).
- 34'ten eski bir yedek geri yüklenirse göçün ürettikleri (legacy kopya, seans kayıtları) bir kez yeniden üretiliyor.
- Üretim yedeği üzerinde deneme yapılmadı. Testler yalnız geçici veritabanı kullanıyor.

**Yedeğin CPU'su (izlenmeli):** yedek tek bir istekte bütün veritabanını JSON'a çeviriyor. Ölçümler (`tests/koy_g_cpu.mjs`, bu makinede):

| Durum | 100 bina | 300 bina |
|---|---|---|
| Bugünkü köy | 4,4 ms | 5,5 ms |
| Yeni köy açıkken | 3,3 ms | 8–9 ms |

Bugün Batur'un ekipleri 100 binanın altında. Köyler çok büyürse yedek ücretsiz planın 10 ms sınırına yaklaşabilir. O zaman `npm run yayin` "Yedek alınamadı" der ve durur; hiçbir şey yayınlanmaz. Yedek gerekirse D1'in kendi dışa aktarımıyla da alınabilir. Bu Worker CPU'su harcamaz ([RECOVERY.md](../../RECOVERY.md)):

```
npx wrangler d1 export kutup --remote --output=./data/kutup-yedek.sql
```

## Yeni köyü açmak ve kapatmak

Yol: **Komuta merkezi → Ekipler → ekip kartı → Köy düzeni.** Ayrıntı: [G-GECIS.md](G-GECIS.md).

1. **Yeni köy taslağı hazırla.**
   - Köy Batur'un tarayıcısında planlanır; 100 binada telefonda birkaç saniye sürebilir.
   - Sunucu taslağı kaydeder ve kuralları parça parça kontrol eder.
   - Üyeler hiçbir şey görmez.
2. **Önizleme:** taslağa gündüz ışığında bakılır.
3. **Eşitle:** taslak beklerken yeni bina kurulduysa "geride" yazar ve açma düğmesi pasif kalır. Eşitle yalnız yenileri ekler, eskiler yerinden oynamaz.
4. **Yeni köyü aç** (onay sorar).
   - O ekibin üyeleri bir sonraki yenilemede yeni köyü görür.
   - Eski sürümde kalmış bir uygulama "güncelle" ister (426) ve yenilenince açılır.
5. **Eski köye dön:**
   - 14 gün içinde tek dokunuş.
   - Yeni köyde kurulan binalar eski köyde de yerini bulur.
   - Bırakılan yeni köy taslak olarak bekler.

Öneri:
- İlk olarak yalnız Batur'un kendi ekiplerinden birinde açın.
- Birkaç gün boyunca Cloudflare panelinde **Workers → kutup → Metrics/Logs** altında CPU zamanına ve **1102** hatasına bakın.
- 1102 sık görünürse ya da köy garip davranırsa **Eski köye dön**. Kesilen bir istek hiçbir şey yazmıyor.

## Neler korunuyor

Testlerle doğrulanan:
- Bina kimliği ve sahibi.
- Tuğla, dakikalar, kalpler, teslimat geçmişi, plan keşfi.
- Anıtkabir katkıları, dört kişilik kadro, 2.000 dakikalık hedef ve haftalık anıt ayrımı.
- V1 ekiplerin köyü, istekleri ve maliyeti (`tests/koy-a.test.js` sabit sahneleri, V1 ölçümleri).

**Sahip düzeltmeleri bütün düzenlere ulaşıyor** (§11.4, `tests/koy-h.test.js`):
- Taslak beklerken bir hediye geri alınırsa arsası hem taslaktan hem eski köyden çıkar. Taslak eksiksiz kalır, eşitleme diğer binaları yerinden oynatmaz.
- Yeni köy açıkken bir kişi silinirse binaları ve süren seansının şantiyesi gider. Bir bina geri alındığında da arsası gider.
- Bunlardan sonra yeni köyün kuralları temiz kalıyor.
- Eski köye dönüşte bina sayısı aynı: eksik ya da fazla yok.

## Kanıt (son commit'e göre)

- `npm run test:all`: **261/261.** Node ve Worker aynı testleri koşuyor; buna tek tek paketlerin testleri de dahil.
- Tarayıcı kontrolleri telefon görünümünde (390 px) gerçek Chromium ile koştu. Sonuçlar PR açıklamasında, görseller `/mnt/project-files/kutup/n46/`.
- Paket raporları:
  - [A-TABAN](A-TABAN.md)
  - [B-PROTOTIP](B-PROTOTIP.md)
  - [C-VERI](C-VERI.md)
  - [D-UCTAN-UCA](D-UCTAN-UCA.md)
  - [E-MODELLER-BUYUME](E-MODELLER-BUYUME.md)
  - [F-YASAM](F-YASAM.md)
  - [G-GECIS](G-GECIS.md)

## Açık kalanlar (gizlenmiyor)

- **Fiziksel cihaz doğrulaması bekliyor.**
  - Bütün görüntü ve süre ölçümleri bu makinede, telefon öykünmesiyle yapıldı.
  - Gerçek Android ya da iPhone'da şunlara bakılmadı: ilk açılış, kaydırma ve yakınlaştırma akıcılığı, taslak hazırlama süresi ve 12 kişilik hayat sınırı.
  - Önerim: Batur kendi telefonunda bir ekipte açtıktan sonra köyü birkaç dakika gezip yavaşlık olursa söylesin.
- **Gerçek Cloudflare CPU ölçümü yok.** Ölçümler Node'da yapıldı; panelden izlenmeli (yukarıda).
- **Taşıma teklifi kilitlenmiyor** (§5.6).
  - Arsa arada dolarsa taşıma 409 ile reddediliyor ve üye yeniden seçiyor.
  - Eski konum hep korunuyor.
- **Kontrol "kurallara uygun"u denetliyor, "en iyi yer"i değil.** Uygulamayı bilerek değiştiren biri kurala uyan sıradan bir arsa seçebilir. 5–10 kişilik bir topluluk için kabul edildi ([G-GECIS.md](G-GECIS.md)).
- **Manzarada yapılmayanlar:**
  - Eğimli arazi ve teras yok.
  - İkinci gölet ya da kıyı yolu yok. Göl kıyısı dolarsa fener için açık bir hata dönüyor.
  - Köprü altından geçen yürüyüş yok.
  - Oturan figür ayrı çizilmiyor.
- **Kapsam dışı (plan §1.3):** üye taşıma, ekip birleştirme, arşivleme ve silme ya da yeni ödül sistemi yok.
