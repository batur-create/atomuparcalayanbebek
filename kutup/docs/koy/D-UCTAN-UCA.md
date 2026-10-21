# n46 D — küçük uçtan uca dikey dilim

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §7.1, §7.4, §8.5, §10 D, §11.3.

**Canlıda görünen değişiklik yok.** Bütün yeni davranış yalnız `groups.active_layout_id` dolu (v2 düzeni etkin) ekiplerde çalışır. Bu paketten sonra da hiçbir ekipte etkin değil; etkinleştirme G'deki sahip panelinden ve Batur'un kararıyla gelir. V1 ekipte yanıtlar, binalar, taşıma ve çizim aynı (A'daki `village-v1.json` testi geçiyor).

## Akış

| Adım | Ne olur | Nerede |
|---|---|---|
| İnşaatlı seans başlar | Önce varsa bitmiş seans ayrı batch'te sonuçlanır. Sonra planlayıcı güncel v2 düzeninde **bitmiş modele göre** parsel seçer; run, ücret, şantiye yerleşimi ve değişiklik kaydı tek batch'te yazılır. Yer yoksa 409, hiçbir şey kesilmez, seans açılmaz. | `server/app.js` başlatma, `server/villageSpatial.js` `placeStatements` |
| Şantiye görünür | İlk dakikadan çitli (mobilizasyon), aşaması sunucunun doğruladığı dakikalardan: `verifiedStage`. Molada donar, kurtarma bitişi uzatır ama işi değil. Uygulama iki yanıt arasında yalnız "running" iken saati ilerletir. | `server/villageStore.js` `v2Village`, `src/koy2/village2.js` `siteStage` |
| Şantiye seçilir | Haritada dokunulur; kart: model, %aşama, durum (yükseliyor / molada / çatladı / bitmek üzere), yapan, süre. | `src/VillageMap.jsx` `SiteCard` |
| Bina biter | Aynı parselde, aynı x/y/yön/ölçek/geometri sürümüyle şantiye yerleşimi bina yerleşimine döner. Tek bina (`source_focus_run_id` tekil), tek teslim, tek ücret. | `convertStatements` |
| Vazgeçme / çökme | Yalnız o seansın yerleşimi silinir, parseli tombstone olur; başkasının şantiyesi kıpırdamaz. | `releaseStatements` |
| Taşıma | `GET /buildings/:id/spots` planlı boş parselleri verir (en çok 6, kendi parseli hariç). `POST …/move` yeni bir okuma üstünde yeniden planlar; hedef artık yoksa **409** ve bina yerinde kalır. Kimlik, sahip, tohum, oluşturma zamanı, kalpler, dakikalar aynı; ölçek ve geometri sürümü aynı. | `moveStatements` |
| Hediye | v2 ekipte hediye bina da planlayıcıyla yer alır. | hediye yolu |

**Yarış:** her v2 yazımı düzenin `rev`'ine bağlı bir `write_guard` ile başlar. Aynı anda iki kişi aynı yere yazmaya kalkarsa bir batch kazanır; diğerinin koruması düşer, `retrying` yeni düzeni okuyup yeniden planlar. Değişen satırlar `json_each` ile tablo başına tek ifade; bir yerleştirme en çok 8 ifade (D1 sorgu sınırı).

**Sıralama:** artımlı eklenen satırların `ord`'u `(rev+1)×10000 + sıra`; böylece okuma sırası yazma sırasıyla aynı kalır ve aynı girdi aynı düzeni verir (B'deki tam yeniden üretimle birebir — 29 öğelik denemede artımlı yerleştirme `layoutFrom` ile aynı çıktı).

**Zamanlama sürümü:** mola, devam, mola süresinin dolması ve kurtarma `focus_runs.timing_revision`'ı bir artırır; şantiye yanıtında `timingRevision` olarak gider.

## Uygulama tarafı

- `src/villageData.js` her istekte `X-Kutup-Village-Version: 2` der. V1 ekipte yanıt bugünkünün aynısı. v2 ekipte `?cursor=` ile yalnız değişen satırlar gelir.
- `src/koy2/village2.js` `mergeVillage2`: tam ya da delta yanıtı satır satır birleştirir, tombstone'ları siler; parselin üstünde ne olduğunu yalnız yerleşimlerden kurar (tahmin yok). Uygulamanın geri kalanı için binaları bugünkü biçimde verir (x/y/yön yerleşimden).
- `src/villageWorld.js` `mergeVillage`: `contractVersion: 2` yanıtı v2 birleştiriciye gider; ekip V1'e dönerse eski yanıt v2 veriyi bütünüyle değiştirir.
- `src/VillageMap.jsx`: v2 ise `buildWorld2` çizer (taşıma arsaları dahil), şantiyeler dakikada bir yeniden çizilir; şantiye kartı; taşıma düğmesi "köyde başka bir arsaya".

## Testler

- `tests/koy-d.test.js` (4): §11.3 iki kişilik kabul senaryosu baştan sona (eşzamanlı iki başlangıç → iki ayrı parsel, kişi başı tek ücret; aşama; yenilemede aynı yerleşim; vazgeçen yalnız kendini bırakır; biten aynı parselde tek bina, tek ücret; tekrar başlatma/sonuçlanma çift üretmez; taşıma kimliği ve komşuları korur; dolu hedef 409 ve bina yerinde); binasız seansta şantiye yok, yer yoksa ücret ve seans yok; çöken şantiye parselini bırakır; uygulamanın delta/tombstone birleştirmesi ve V1'e dönüş.
- `tests/suite.js` C senaryosuna ek: **Node ve Worker (workerd + yerel D1) üzerinde gerçek paralel HTTP** ile iki kişi aynı anda başlar → iki ayrı parsel; biten aynı parselde bina.
- `tests/koy_d_browser.py`: gerçek uygulama, 390 px telefon görünümü, yerel geçici sunucu. 7 kontrol; görüntüler `/mnt/project-files/kutup/n46/D/`.
- Test sunucusunda (yalnız `KUTUP_TEST_HOOKS`) katılma sınırı 15 → 30/dk; gerçek trafikte 15 aynı.
- `npm run test:all`: sonuç PR açıklamasında.

## Bilerek sonraya

- Bütün 48 model, teraslar, çok merkezli büyüme, ortak Anıtkabir alanı (B 1,25× seçildi): **E**.
- Manzara, köy hayatı, gece/gündüz, LOD: **F**.
- Taslak üretme, eşitleme, etkinleştirme, 14 gün geri dönüş, sahip paneli: **G**.
- Ortak Anıtkabir projesinin v2 yerleşimi henüz yazılmıyor (yanıtta `placement: null`); E'de ortak alanla gelir.
- Fiziksel telefon testi yapılmadı; tarayıcı telefon öykünmesi kullanıldı.
