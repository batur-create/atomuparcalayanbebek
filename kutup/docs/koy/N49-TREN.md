# n49 — Köyde tren ve canlılık

**Neden ray var?** İki yerden: (1) *Tren İstasyonu* nadir yapısının çiziminde peronun önünde kendi kısa ray parçası var; eski köyde istasyon tek başına durduğu için bu parça iki ucu boşta görünür. (2) Yeni köyde (n46 B) istasyonun gerçek bir hatta oturması için köyün önünden tek hatlı bir demiryolu geçirildi (`shared/koy2/terrain.js`). Hat terrain 2'de neredeyse düzdü ve üstünden tren geçmiyordu.

## Kıvrımlı hat: terrain 3

- Gerçek bir yan hat gibi: ~50 birimlik düz kesimler (planlayıcı modeli yalnız dik açılarla döndürdüğü için istasyon peronu her düz kesime sığar) ve aralarında ~45 birimlik yumuşak S virajlar, her kesim farklı uzaklıkta.
- Köyün önündeki kesim 48–52 birime sokulur; dereyi kestiği kesim dışarı açılır, köprü evlerden ≥ 70 birim uzakta kalır. En keskin viraj yarıçapı ≈ 22 birim; kareye hiçbir yerde 38 birimden yakın değil.
- Dere, gölet, akarsu ve doğa alanları terrain 2 ile **aynı sayılar** (aynı tohum dizisi). Değişen tek şey ray.
- Sunucu: `TERRAINS = { 2: [1], 3: [2, 3] }`. Generator 3 düzeni terrain 2 ya da 3 üstünde durabilir; eşitleme (taban düzen varken) araziyi değiştiremez. Yeni taslaklar terrain 3 alır; terrain 2'de açılmış bir köy kendi rayını korur.
- 600 tohumda: her tohumda kıvrımlı hat bulundu, istasyon testinde (40 tohum, 2 istasyon) her istasyon yerini buldu.

## Tren: `src/koy2/train.js`, çizim `src/koy2/trainArt.js`

| | |
|---|---|
| Sıklık | 8 dakikalık her dilimde %85 olasılıkla bir tren (dilim içinde rastgele saat): saatte ~6, aralar 4–16 dk |
| Çeşit | Yolcu (lokomotif + 2 vagon, %60), kısa (lokomotif + 1 vagon, %15), yük (tomruk, tanker, kapalı vagon, %25) |
| Hız | Seyir 6,5 birim/sn (≈ 37 km/sa), fren 0,5, kalkış 0,35 birim/sn²; yük treni köy önünde 56 birim boyunca 3,2 |
| Durak | Bitmiş bir Tren İstasyonu varsa onun peronu; yoksa raya en yakın, geçitlerden/sokaklardan/kapı yollarından/sudan uzak küçük durak (peron, tabela, bank, lamba). Durak, planlayıcının ray boyunca boş tuttuğu şeritte (orta çizgiden 0,95–1,55; plan şeridi 1,65) |
| Bekleme | 24–40 sn. Duran tren geçidi kapatmaz: gerekirse 7 birime kadar ileride/geride durur |
| Yolcular | 1–2 kişi trenden bir dakika önce perona gelir ve biner; 0–2 kişi iner, istasyona girip 5 sn sonra ön kapıdan çıkar ve kapı yolundan en yakın meydana yürür (durakta peron ucuna yürür) |
| Geçit | Tren 26 birim uzaktayken bariyer iner, kuyruk 9 birim geçince kalkar; kırmızı lambalar sırayla yanıp söner. Geçidin dışında duran trende bariyer 2–5 sn sonra açılır, kalkıştan 6 sn önce yeniden iner |
| Ayrıntı | Buhar (lokomotif çekerken sık, dururken seyrek), kalkışta düdük buharı, gece farı ve ışıklı pencereler, ray önündeki ağaçlar trenin önünde kalır |

Her şey ortak saatten (`Date.now`), ekip tohumu ve düzenden hesaplanır: iki telefon aynı treni görür, ekran dışı için simülasyon yok.

## Yeni hayat (`src/koy2/life.js`)

- **Ördekler:** anne + 3 yavru gölette 2,5–5,5 dk arayla bir tur atar (≈ 0,35 birim/sn), aralarda köy tarafındaki kıyıda kıpırdamadan durur.
- **Sandal:** 7–13 dk arayla gündüz biri köyün önündeki 110 birimlik dere kesiminden kürek çekerek geçer (yağmurda ve gece yok).
- **Ateşböcekleri:** ilkbahar–yaz gecesi gölet kıyısı, koruluklar ve bahçe meydanlarında 40–70 sn (aynı anda tek doğa olayı kuralı korunur).

## Hareket ve pil

- Hareket açık: tren görünürken canlı katman ~24 kare/sn; görünmüyorsa hatta tren varken 1 sn'de bir, yoksa bir sonraki tren saatinde uyanır. Ördekler dinlenirken ve sandal görünmüyorken döngü uyur.
- Sakin / Kıpırtısız: hiçbir şey kendiliğinden kıpırdamaz; yalnız istasyonda bekleyen tren ve kıyıda duran ördekler durağan resim. Gizli sekmede hiç kare çizilmez.
- Köy bütünü görünümünde (LOD 0) tren görünür (uzaktan köyün tek büyük hareketi), ördekler ve yolcular görünmez.

## Kanıt

- `tests/koy-n49.test.js` (9 test): terrain 3 kuralları (200 tohum), 12 tohumda istasyon, trenin rayda kalması/sıçramaması/perona ortalanması/iki telefonda aynı olması, hareket kapalıyken yalnız duran tren, geçitlerin tren üstündeyken kapalı olması, durağın parsel/sokak/kapı yolu dışında olması, inen yolcuların yürünebilir zeminde kalması, ördek/sandal/ateşböceği sınırları, sunucuda terrain 2/3 kabulü ve eşitlemede arazi değişiminin reddi.
- `tests/koy_n49_browser.py` (13 kontrol): gerçek harita görünümünde istasyon, gece, durak, yük treni, geçit, ördek, sandal, ateşböceği görüntüleri; tren hareketliyken 3 sn'de 72 kare (ortanca 0,5 ms), gizli sekme 0 kare, Kıpırtısız ve Sakin'de 0 kare.
- Görüntüler: proje dosyalarında `kutup/n49/`.

Açık: fiziksel telefon doğrulaması yapılmadı (Chromium telefon öykünmesi).
