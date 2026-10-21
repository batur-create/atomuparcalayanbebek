# n46 B — v2 köy prototipi ve örtüşme deneyi

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §10 B. Bu paket **canlı köyü değiştirmez**: yeni kod yalnız `shared/koy2/`, `src/koy2/` ve test betiklerinde; `/api/village`, sunucu, şema ve mevcut harita dokunulmadı. Üretim yerleşim göstergesi yok (C'de gelecek), V1 tek düzen.

## Ne var

| Modül | Görev |
|---|---|
| `shared/koy2/geom.js` | 1/1024 kuantize koordinat, FNV karması, mulberry32, dikdörtgen/çizgi/çokgen geometrisi, ızgara dizini. Her makinede aynı sayı. |
| `shared/koy2/modelData.js` | 48 çizimin ölçülen sözleşmesi (`scripts/koy/measure-models.mjs` üretir; elle düzenlenmez). |
| `shared/koy2/models.js` | Model sözleşmesi: sabit ölçek, zemin izi, üst taşma, yükseklik, giriş(ler), bağlam (kuru / dere kıyısı / göl / göl kıyısı / köprü / ray), ön bahçe ve yan pay, iki yön (0 ve aynalı 1). Su/ray yapılarının çizimden okunmuş oturma noktaları (FIT). |
| `shared/koy2/terrain.js` | Tohumdan dere, gölet ve tek hatlı demiryolu. |
| `shared/koy2/planner.js` | Sokak cephesinden yerleşim: önceden ayrılmış koridorlar, açılınca sokak; bağlamlı yapılar için bağlı genişleme; büyük eserlere ön meydan ve yaklaşım yolu; doğrulayıcı. |
| `shared/koy2/draft.js` | Bir envanterden sabit sırayla bütün düzen (plan §8.2 taslağı). |
| `src/koy2/world2.js` | v2 düzenini mevcut `createView` ile çizen dünya (aynı öğe arayüzü + `occludersAt`). |
| `tests/koy-b.test.js` | Bu paketin 7 testi (aşağıda). |
| `tests/koy_shots.py --mode v2 [--scale 5]`, `tests/koy_b.py` | Görseller, atlas, Anıtkabir ölçek ve derinlik deneyleri (geçici veri dizini). |

## Sonuçlar (dört sabit sahne, aynı envanter)

| Sahne | Yerleşen | Eksik | Kural ihlali | Planlama (tarayıcı) | Dünya kurma |
|---|---:|---:|---:|---:|---:|
| baslangic | 7 | 0 | 0 | 0,14 s | 14 ms |
| yapi32 | 34 | 0 | 0 | 0,61 s | 55 ms |
| baskin100 | 102 | 0 | 0 | 1,40 s | 26 ms |
| anitkabir | 7 | 0 | 0 | 0,08 s | 22 ms |

Planlama süresi bütün köyü sıfırdan kurmanın süresidir (taslak). Canlıda bir yapı eklemek tek `planPlacement` çağrısıdır; baskın sahnede ortalama ~14 ms.

A'daki ölçülen sorunların v2 karşılığı:

| Sorun (A) | v2 |
|---|---|
| Kapı yolu yok / komşudan geçiyor (yapi32 1+1, baskin100 3+7, anitkabir 1) | 0. Her kapının kendi yolu var; yol kendi parselinden ve komşudan geçmez (doğrulayıcı `pathReason`). |
| Kendi boyundan küçük çizilen eser (yapi32 6, anitkabir 1) | 0. Ölçek modelde sabit; yer yoksa yeni sokak açılır, model küçülmez. |
| Kuru zeminde değirmen, yüzen ev, köprüler; raysız istasyon | 0. Değirmen çarkı derede, yüzen ev gölette iskelesiyle kıyıya bağlı, iki köprü dereyi dik açıyla geçiyor, istasyon peronu rayın üstünde (`contextFits`). |
| Örtüşme / yolda yapı | 0 (aynı kaldı); ayrılmış koridorlar da parsellerden geçmiyor. |

Görseller: `/mnt/project-files/kutup/n46/B/`.
- `cmp-yapi32.png`, `cmp-baskin100.png`, `cmp-anitkabir.png`: solda bugünkü köy, sağda v2, **aynı ölçek** (5 px/birim).
- `v2-*-masaustu.png` / `v2-*-telefon.png`: sığdırılmış kamera, 1440×900 ve 390×844.
- `atlas-48.png`: 48 modelin sözleşmesi çizimin üstünde (yeşil zemin, turuncu üst taşma, gri parsel, kırmızı giriş, mavi yükseklik).

## Mühendislik kararları

**Ölçü birimi.** 1 birim = 1,6 m (ev ≈ 10 m boy). Dere 3,2 birim (≈5 m), tek hat + balast 1,7 birim. Ray aralığı istasyon çiziminin ±0,31 birimine bağlandı (≈1 m, metre hat): çizimle arazinin rayı aynı yerde.

**Dere ve ray neden önde, gölet neden arkada.** İzometrik kamera yalnız +x ve +y yüzleri gösteriyor; 180° dönüş yok, yalnız aynalama (x↔y) var. Değirmen çarkı, istasyon peronu ve yüzen evin iskelesi çizimde hep bu ön yüzde. Dere köyün önünde (+x ya da +y, meydandan 44–52 birim ≈ 70–85 m) akınca köy tarafındaki değirmen çarkını dereye çevirebiliyor; ray öbür ön eksende (58–70 birim). Gölet arkada (30–38 birim): yüzen evin iskelesi ve fenerin kapısı köye bakıyor. Ray dereyi meydandan en az 70 birim (≈110 m) uzakta, kendi kafes kirişli köprüsüyle geçiyor.

**Değirmen.** Çark merkezi dere eksenine yarım genişlik − 0,35 birim, gövdenin kuru dikdörtgeni kıyıdan en az 0,2 birim içeride. Kapı yolu dereden 2,5 birim uzaklaşarak sokağa bağlanıyor, böylece yol şev üstünden geçmiyor.

**Köprü.** Tabliye dereye dik (yön toleransı cos ≥ 0,9); her iki uç dereden yarım genişlik + 0,6 birim uzakta; iki köprü arası en az 18 birim. Rampa tabliye ucundan 2,5 birim ötede başlar, karşı yakada 8 birimlik bir sokak devam eder.

**Ayrılmış koridorlar (plan §5.4).** Meydan 6 ayrılmış ana yolla doğuyor (22 birim). Bir koridor açılınca bir sonraki parça ayrılır: tek derinlikte 3 sokaklı küçük bir meydan (yarıçap 3,2), çiftte düz devam + yan kol. Ayrılmış parça “yumuşaktır”: büyük eser ya da bağlamlı yapı yolunu keserse düşer (anitkabir sahnesinde Anıtkabir iki radyali düşürdü), açık sokak hiç düşmez ve hiç kaymaz (büyüme testi).

**Puan ağırlıkları:** sahip yakınlığı .30, altyapı .25, manzara .20, zemin .15, odak .10. Sınırlar: 96 aday/genişleme, toplam 320, en fazla 8 genişleme, 3 yeni odak.

## Anıtkabir ölçek denemesi (plan §4.6)

Aynı sokak, aynı ev ve üç insanla üç sabit ölçek (`anitkabir-{A,B,C}-{genel,yaklasim,telefon}.png`, yan yana `anitkabir-ABC-*.png`):

| | Ölçek | Zemin | Bayrak tepesi | Şeref Holü (kaideyle) | Ev (10 m) yanında |
|---|---:|---|---:|---:|---|
| A | 1 (bugünkü sözleşme) | 22,7 × 23,0 m | 15,1 m | ≈ 11 m | Holün yüksekliği evle aynı; eser küçük kalıyor |
| **B** | **1,25** | **28,3 × 28,7 m** | **18,8 m** | **≈ 13,7 m** | **Hol evin ~1,4 katı; meydan ve Aslanlı Yol okunuyor** |
| C | 1,5 | 34,0 × 34,4 m | 22,6 m | ≈ 16,5 m | Gerçeğe en yakın oran (gerçek hol ≈ 17 m kaideyle ~24 m), ama telefonda tek başına ekranı dolduruyor |

Gerçek değerler (`shared/olcek.js`): bayrak direği 33,5 m, Şeref Holü 17 m (kaideyle ~24 m), sütunlar 14,4 m, Tören Meydanı 129 × 84 m. Plan yönü (n44) yükseklikleri insana göre ama sıkıştırılmış tutmaktı.

**Öneri: B (1,25×).** Holün evle oranı (1,4) gerçek orana (≈2) A'dan belirgin yakın, ortak alan baskın sahnede bile tek mahalleye sığıyor ve 390 px telefonda Aslanlı Yol ile meydan birlikte görünüyor. C daha doğru ama bir ekip projesinin köyün geri kalanını ezmemesi için fazla. Ölçek sözleşmeye E'de yeni geometri sürümüyle yazılacak; o ana kadar sözleşme A'da kalır. Karar Batur'a seçmeli olarak soruldu.

**Giriş düzeltmesi.** Çizimde ziyaretçi Aslanlı Yol'un başından, İstiklal ve Hürriyet kulelerinin arasından girer; yol +y yönünde ama eksenin 0,96 çizim birimi doğusunda (B'de ≈ 8 m). Sözleşmedeki giriş buraya taşındı (FIT `anitkabir`), yaklaşım yolu artık Aslanlı Yol'un başına bağlanıyor.

## Derinlik / örtüşme deneyi (plan §6.1)

Sahne: yüksek model (Burgu kule), geniş model (Kolezyum), iki elle konmuş ağaç, taş kemer köprü, dere; 12 yaya üç hatta yürüyor (eserlerin arkası y = −16, sokak y = 6, dere kıyısı y = 10,5). Yöntem: statik dünya bir kez çizilir; her figürden sonra, figürün kutusunu kesen ve figürün önünde kalan duran öğeler (`occludersAt`) yalnız o küçük kutuya kırpılarak yeniden çizilir.

| | ms/kare (12 figür) | kare başına yeniden çizilen öğe |
|---|---:|---:|
| Maskesiz (bugünkü gibi figür hep üstte) | 0,47 | 0 |
| Maskeli | 6,58 | 5,5 |

`derinlik-maskesiz.png`, `derinlik-maskeli.png`, yakın kırpımlar `derinlik-yakin.png`. Maskesizde Kolezyum'un arkasındaki yaya tribünlerin üstünde görünüyor; maskelide doğru biçimde duvarın arkasında kayboluyor, kulenin ve ağaçların önündekiler görünür kalıyor.

**Karar:** maske yöntemi doğru sonuç veriyor, bant yöntemine gerek yok. Maliyet masaüstünde 16,7 ms kare bütçesinin ~%40'ı. Telefonda F'de şu sınırlarla uygulanacak: en fazla 12 figür (plan), maske yalnız figür bir örtücüyle kesişince, hareket yokken kare yok, örtücü kırpımları figür kutusu başına önbellekli. **Açık kalan:** köprü altından geçen rota (z'ye göre hangi yüzün örteceği) bu deneyde yok; figür rotaları F'de kurulunca köprü üstü/altı ayrıca denenecek.

## Palet ve doku kararı

Mevcut palet aynen korundu (çayır, yol, yol kenarı, meydan taşı, ağaç/çalı/kaya çizimleri `src/villageWorld.js`'ten). Yalnız eklenenler: dere (kıyı şevi + su), gölet, balast, travers ve ray, kafes kirişli ray köprüsü, kapı patikası (kesik çizgi). Yeni doku yok; v2 eski köyle aynı dünya gibi görünüyor.

## Testler

`tests/koy-b.test.js` (7): sözleşme = çizim ölçümü (48 model); aynı envanter → bayt bayt aynı düzen; dört sahnede eksiksiz yerleşim ve sıfır ihlal (örtüşme yok, hiçbir yol parselden geçmiyor); büyüme sırasında yerleşmiş parsel ve açık sokak hiç değişmiyor (102 adım); koridor açma/düşürme anlamı; değirmen, yüzen ev, köprüler, istasyon ve fener kendi zemininde; şantiye yalnız model kuran seansa, aynı parselde binaya dönüşüyor, iptal sokakları bırakıyor, ortak Anıtkabir kimsenin kişisel parseli değil.

`npm run test:all`: 217/217 (A'daki 210 + bu paketin 7'si; ilk koşuda `core.test.js` n40 kurtarma testi aynı anda çalışan görüntü betiğinin yükü altında bir kez zaman aşımına düştü, tek başına ve yeniden koşuda geçti).

## Sınırlar (bilerek sonraya)

- Su/ray dışındaki özel modellerin kapısı +y duvarının ortasında varsayıldı (çizimden okunan istisnalar FIT'te). 48 modelin tek tek doğrulanması E'de atlasla.
- Arazi düz (`heightAt = 0`); teraslar E'de.
- Şantiye çizimi (yükselen gri iskelet ve özel modellerde mevcut aşama çizimi) prototip; sunucu aşamasına bağlanması D'de.
- Ortak Anıtkabir şimdilik tek parsel; tam ortak alan (meydan, Barış Parkı, kalabalık) E'de.
- Gerçek telefon ölçümü yok; görseller emülasyon (390×844, DPR 2). Fiziksel cihaz G'de.
