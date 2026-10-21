# n46 E — 48 model, uzun büyüme ve ortak Anıtkabir alanı

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §4.3, §4.6, §5, §10 E, §11.2.

**Canlıda görünen değişiklik yok.** Bütün değişiklik v2 düzen kodunda; v2 hiçbir ekipte etkin değil.

## Ortak Anıtkabir: geometri sürümü 2, 1,25×

- `GEOMETRY_VERSION = 2`. Sürüm 2'de yalnız Anıtkabir değişti: çizim ölçeği, zemin ve üst izdüşüm, yükseklik ve giriş noktası 1,25 katına çıktı. Bu, Batur'un 21 Ekim'de kartla yaptığı seçim ("B · 1,25×"). Öteki 47 model sürüm 1 ile birebir aynı; test bunu tek tek doğruluyor.
- Oran: Şeref Holü ≈ 28 m, iki katlı eve göre ≈ 1,4 kat. Gerçekte bu oran ≈ 2; 1,5× ise telefonda tek başına ekranı dolduruyordu (B raporu).
- Sürüm 1 hâlâ okunuyor. Bir yerleşim hangi sürümle yapıldıysa onunla kalır; yeni sürüm eski bir yerleşime sessizce uygulanmaz.
- Aynı model aynı ölçekte durur: köydeki bütün Anıtkabirler 1,25×. Buna eskiden kazanılmış ya da hediye edilmiş kişisel Anıtkabirler de dahil, bunlar da yeni düzende yer alırken 1,25× olur. Kişisel kazanımlara dokunulmadı; yalnız köydeki boyları aynı.
- **Ortak proje alanı:** proje açıldığında (`/owner/imece`) v2 ekipte aynı batch içinde kendi büyük parselini alır. Parselin sahibi yoktur, ön avlusu ayrı bir kamusal alandır ve yaklaşım yoluyla köye bağlanır. Proje başka ekibe aktarılırsa (`/owner/imece/assign`) eski köydeki yeri bırakılır, yeni köyde yer alır. Yer bulunamazsa proje açılmaz ve 409 döner; yarım kayıt kalmaz.
- **İlerleme:** haritadaki şantiye aşaması yalnız mevcut 2.000 dakikalık katkı defterinden gelir (`minutes / 2000`). Görsel ilerleme ayrı bir sayaç değildir; dört kişilik pay ve fazla emek hesabı aynı kalır. Proje açıldığı an çitli şantiye görünür.

## Büyüme (§5.4): köy kenara doğru büyüyor

B'deki planlayıcı ~250 yapıda tıkanıyordu. Sahibe en yakın 8 koridor çoktan dolmuştu; yeni sokak açmaya çalıştığı 3 meydanın çevresi de dolmuştu. Değişenler:

| Değişiklik | Neden |
|---|---|
| Önleri dolu ayrılmış koridorlar sayılmadan geçiliyor | Genişleme hakkı köy kenarındaki boş koridorlara kalıyor |
| Kısa sokak açma bütün açık meydanlarda yakından uzağa deneniyor (aday bütçesi içinde) | Yalnız en yakın 3 meydan dolu olsa da sokak açılabiliyor |
| Büyük eserler yakın meydanlardan başlayıp dörderli gruplarla dışa doğru aranıyor (40 meydana kadar). Aralık 8–22'den 8–44 birime çıktı | 1,25× Anıtkabir ve öteki büyük eserler küçük köyde de sığıyor |
| Büyük eserin düz yaklaşımı evlere çarparsa ön avlu en yakın erişilebilir sokağa bağlanıyor | Büyümüş köyde her meydanın çevresi dolu |
| Dere ve göl kıyısında ≈ 5 m'lik (3 birim) kamusal şerit | Değirmen, köprü, iskele ve fener yalnız kıyıda durabilir; sıradan evler kıyıyı kapatmasın |
| Dere ve köprü aramasında dereyi baştan sona tarama (60 → 160 nokta) | Köyün yakınındaki kıyı dolunca köprü ve değirmen uzakta yer bulsun |

Gelecekteki yolları bulmak için koridorların ayrılması, tercih puanı ve eşitlik kuralı aynı kaldı (§5.3).

### Kural ihlali yok: son kontrol

Bir planın son sözü artık `finalCheck`'te. Plan uygulanmış hâliyle, dokunduğu alanın çevresinde `validateLayout`'un kurallarıyla yeniden denetleniyor. Bir kural bozuluyorsa plan hiç yazılmıyor; o kişi açık hata alıyor, ücret alınmıyor. Bu kontrol 1.000 yapıda üç gerçek hatayı ortaya çıkardı, üçü de düzeltildi:
- Köprü rampası komşu parselin içinden geçebiliyordu.
- Açılan ayrılmış sokak değirmenin parseline değebiliyordu; yeni sokak da kontrolden 0,05 birim gevşek geçiyordu.
- Kapı yolu kendi binasının köşesini sıyırabiliyordu. Kayıtlı koordinat yuvarlanınca sıyırma kesişmeye dönüşüyordu; artık 0,1 birim açıklık isteniyor.

Bu kurallar değiştiği için `GENERATOR_VERSION = 2`.

### Ölçümler (`node scripts/koy/grow.mjs`, sonuç `e-buyume.json`)

Karışım: her 10 yapıdan 9'u gündelik yapı (kulübe, ev, bostan, kahve, sahaf, konak, kule, çiçekçi, fırın, pazar), 10'uncusu sırayla bütün katalog. Kişi başına bina hep bir öncekilerin üstüne planlanıyor. Yerleşmiş hiçbir parsel bir daha değişmiyor; 300 adımlık testte her adımda doğrulanıyor.

| Yapı | Yerleşen | Yer bulamayan | Açık meydan | Kural ihlali | Sahibine yakınlık (ortanca) | Yerleştirme süresi, ortanca / %95 |
|---:|---:|---|---:|---:|---:|---|
| 32 | 32 | — | 4 | 0 | 21 birim | 6 / 41 ms |
| 100 | 100 | — | 11 | 0 | 13 birim | 9 / 24 ms |
| 100 (76/8/8/8) | 100 | — | 12 | 0 | 11 birim | 6 / 21 ms |
| 500 | 499 | fener (göl kıyısı dolu) | 82 | 0 | 11 birim | 22 / 48 ms |
| 1.000 | 991 | 2 fener, değirmen, 3 büyük eser, 3 gündelik yapı (arama bütçesi) | 174 | 0 | 12 birim | 34 / 76 ms |

Yer bulamayan her yapı açık hata alır (`no_plot` / `no_context_plot`): başlatma 409 döner, tuğla kesilmez (D). Hiçbir yapı küçültülerek sığdırılmaz. Kütüp'ü 5–10 kişi kullanıyor; 500 yapı bu ekip için yıllar demek. 1.000'deki kayıplar bilerek bırakıldı: gölet tek ve küçük, aday bütçesi de §5.1'deki kalibrasyon değerinde.

### ⚠️ Cloudflare CPU sınırı (G'de karar)

Ölçümler Node'da (yerel makine). Workers ücretsiz planda istek başına CPU sınırı yaklaşık **10 ms**. Küçük köyde bir yerleştirmenin ortancası 6–9 ms, ama %95'lik dilim 20–40 ms. Yani v2 açık bir ekipte inşaat başlatma, hediye ve taşıma bu sınırı aşabilir. Etkinleştirmeden önce G'de canlıya benzer ortamda ölçülmeli. Seçenekler:
1. Workers Paid (aylık 5 $, istek başına 30 sn CPU).
2. Planı uygulama hesaplasın, sunucu yalnız `finalCheck` ile doğrulasın.
3. Aday bütçesini (§5.1 kalibrasyonu) düşürmek.

Karar Batur'un.

## 48 model atlası

- `tests/koy-e.test.js` bütün 48 modeli 32 yapılı köye ayrı ayrı yerleştiriyor. Her model sözleşmedeki kendi ölçeğinde ve şeklinde yer buluyor; hiçbiri küçültülmüyor, desteklenen yönlerden birinde duruyor, kapısı sokağa bağlı ve köyde kural ihlali çıkmıyor. İki yönün aynı binanın aynası olduğu ve boyutun değişmediği de doğrulanıyor.
- Atlas görseli (sözleşme sınırları çizimin üstünde, sürüm 2): `/mnt/project-files/kutup/n46/E/atlas-48.png`. Sahne görselleri aynı klasörde: `v2-anitkabir-*`, `v2-baskin100-*`.

## Testler

- `tests/koy-e.test.js` (6):
  - Sürüm 2 = yalnız Anıtkabir 1,25×.
  - 48 model kendi ölçeğinde yer buluyor.
  - 300 yapılık büyüme: hiçbir parsel kıpırdamıyor, gündelik yapıların hepsi yer buluyor, köy çok merkezli büyüyor.
  - Dört sabit sahne eksiksiz; ortak Anıtkabir sahipsiz büyük parselde, ön avlusuyla.
  - Sunucu: proje açılınca yer alıyor, aşama dakikalardan geliyor, ikinci açılış reddediliyor.
  - 32 ve 76/8/8/8 dağılımlı 100 yapı eksiksiz yerleşiyor.
- B, C ve D testleri değişmeden geçiyor.
- `npm run test:all`: sonuç PR açıklamasında.

## Bilerek sonraya

- **Teraslar / eğimli arazi:** katalogda teras isteyen model yok ve düz zeminde 1:12 kuralı zaten sağlanıyor. Alçak kabartı manzara işi; F'de, parsellerin dışında ve yürünebilirliği bozmadan ele alınacak. `heightAt()` hâlâ 0.
- **İkinci gölet / kıyı yolu:** göl kıyısı dolunca fener için açık hata dönüyor. Gerekirse F'de kıyı yolu ya da uzakta ikinci gölet.
- **Kalabalık, Barış Parkı'nda yürüyenler:** F (yaşam).
- **Taşıma için kısa süreli teklif ve rev kimliği (§5.6):** G, etkinleştirme ve uyum işleriyle birlikte.
