# n46 C — veri, sözleşme, atomiklik ve geçiş

Plan: [KOY_TAM_UYGULAMA_PLANI.md](../KOY_TAM_UYGULAMA_PLANI.md) §4.1, §4.2, §4.5, §7.1, §7.4, §8.1, §8.5, §10 C.

**Canlıda görünen değişiklik yok.** Bir ekipte `groups.active_layout_id` NULL olduğu sürece (bu paketten sonra her ekip için NULL) köy bugünkü V1 düzeniyle, bugünkü `/api/village` yanıtıyla çalışır. Yeni kayıtlar arka planda tutulmaya başlar: seansların sabit kimliği, tekrar istek makbuzları ve köy değişiklik sırası. Kullanıcı bunları görmez.

## Göç 34

| Kayıt | Ne tutar | Koruma |
|---|---|---|
| `focus_runs` | Seansın sabit kimliği: kişi, ekip, mod (free/strict/relaxed/imece), model, tohum, süre, başlangıç, bitiş, durum (running/completed/failed/cancelled), sonuç, binası, sonuçlanma zamanı, istek anahtarı ve özeti | Kişi başına tek `running` (kısmi tekil indeks); (kişi, istek anahtarı) tekil |
| `members.focus_run_id` | Süren seansın run'ı | Mola, kurtarma ve yenilemede değişmez |
| `buildings.source_focus_run_id` | Kişisel binayı üreten run | Tekil: bir run en çok bir bina üretir. Eski ve hediye binalarda NULL |
| `request_receipts` | (kapsam, kişi, anahtar) → istek özeti, sonuç | Birincil anahtar; sır veya davet kodu saklanmaz |
| `groups.village_content_rev`, `village_changes` | Ekip başına artan sırayla köy içeriği değişiklikleri: şantiye başladı / binaya dönüştü / bırakıldı, bina kuruldu / taşındı / geri alındı, kişi ayrıldı | (ekip, rev) birincil anahtar; satır ve sayaç aynı batch'te |
| `village_layouts` | Düzen: legacy/v2, durum (baseline/draft/active/previous/retired), tohum, üretici/arazi/uyumluluk sürümü, rev, kaynak ve uygulanmış içerik rev'i, geri dönüş süresi, eski düzenin donmuş görüntüsü | `groups.active_layout_id` tek etkin seçim |
| `village_regions`, `village_nodes`, `village_roads`, `village_neighborhoods`, `village_plots` | Arazi, düğümler, sokaklar (usable/reserved), meydanlar, parseller. Kolon + JSON, sıra (`ord`), satır rev'i ve silme işareti (tombstone) | (düzen, kimlik) birincil anahtar |
| `village_placements` | Özne (building/site/imece/weekly_monument) → parsel, x/y/z, yön, ölçek, geometri sürümü, model | (düzen, özne) tekil ve (düzen, parsel) tekil |

Eski göçlere dokunulmadı. Göç aynı zamanda:
- her ekip için **legacy baseline** düzeni yazar: o anki bütün binaların kimliği, sahibi, modeli, konumu, yönü ve mahallesi `snapshot` içinde donar (plan §8.1). Binalar kendi `pos_x/pos_y` kolonlarında kalır ve V1 için tek gerçek onlardır;
- süren her seansa bir kez sabit run kimliği verir (`run-legacy-…`).

## Yazma yolları

| Yol | Yeni olarak aynı batch'te yazılan |
|---|---|
| Seans başlatma | run satırı, `members.focus_run_id`, (inşaatsa) `site/start` değişikliği, (anahtar varsa) makbuz. Önceki bitmiş seans aynı batch'te önce sonuçlanır; o kişide başıboş kalmış `running` satır varsa kapatılır. |
| Sonuçlanma (`settleFocus`) | run → completed/failed + bitiş + sonuç + bina; bina `source_focus_run_id`; `site/convert` + `building/create` ya da `site/release` |
| Vazgeçme / ortak görev durdurma | run → cancelled; inşaatsa `site/release` |
| Hediye, geri alma, taşıma | `building/create`, `building/delete` (+ bütün düzenlerdeki yerleşimi silinir, parseli tombstone olur), `building/move` |
| Kişi silme / ayrılma | `member/delete`, kişinin yerleşimleri, run'ları ve makbuzları |

Hepsi mevcut `write_guard` / `retrying` deseninin içinde. Yeni yollar eski muhasebeye dokunmuyor: tuğla, ödül, plan, teslim ve imece hesapları aynı.

## Tekrar istek (plan §7.1)

Uygulama başlatma isteğine `requestKey` (16–64 karakter) ekleyebilir; eski uygulamalar eklemez ve bugünkü gibi çalışır.
- Aynı anahtar + aynı seçimler → aynı seans döner (`replayed: true`, aynı `run`); ikinci kesinti yok. Aynı anda gelen ikizlerde biri kazanır, diğeri makbuzu okuyup aynı sonucu döner.
- Aynı anahtar + başka seçim → 409.
- Batch yarıda düşerse ne run, ne makbuz, ne kesinti, ne seans kalır (test: hata enjeksiyonu). Aynı anahtar sonra bir kez geçer.

## /api/village sözleşmesi (plan §4.5, §8.5)

- `active_layout_id` NULL → bugünkü yanıt, hiçbir alan değişmedi (A'daki `village-v1.json` testi geçiyor).
- v2 etkin + uygulama `X-Kutup-Village-Version: 2` (ya da `?v=2`) demiyor → **426** `{ updateRequired: true }`. Eski uygulama yeni düzeni mahalle tahminiyle çizmez.
- v2 etkin + sürüm 2 → `contractVersion: 2` yanıtı: düzen ve içerik rev'i, `cursor`, sürümler, bölgeler, düğümler, sokaklar, meydanlar, parseller, her binanın sahibi/modeli/yerleşimi, şantiyeler (`focusRunId`, kişi, model, durum, `timingRevision`, süre, doğrulanmış geçen süre, sunucu zamanı, yerleşim; başkasına cihaz veya kalp atışı ayrıntısı yok), ortak proje ve haftalık anıt.
- `?cursor=` aynıysa yalnız `{ unchanged: true }`. Aynı düzende geriden geliyorsa yalnız değişen satırlar ve `deletes` (tombstone). Başka düzen ya da bozuk cursor → tam yanıt.

Örnek yanıt: [c-ornek-v2.json](c-ornek-v2.json).

Bir v2 düzeni bütün köyüyle **tablo başına tek ifadeyle** yazılır (`json_each`): baskın 102 yapılı köy 7 ifade. D1'in istek başına sorgu sınırı düşük olduğu için bu bilerek seçildi.

## Yedek ve geri yükleme

`BACKUP_TABLES` yeni on tabloyu ebeveynden çocuğa sırayla içerir. Geri yükleme yeni ilişkileri olduğu gibi taşır; testte geri yüklenen v2 düzeni yazılanla birebir aynı. 34'ten eski bir yedek geri yüklenince legacy baseline ve süren seans run'ları göçteki gibi bir kez üretilir ve satır sayımı buna göre doğrulanır.

## Testler

- `tests/koy-c.test.js` (8): sabit run ve tekrar anahtarı (ikiz istek, geç tekrar, farklı seçim 409, bozuk anahtar); tamamlanan inşaatın tek binası ve sıralı değişiklikler; vazgeçme; serbest seans (run var, şantiye yok); batch hata enjeksiyonu; düzenin yazılıp aynen okunması ve tekil kısıtlar; V1 varsayılan, 426, v2 yanıtı, cursor ve tombstone, v2 ekipte eski taşımanın kapalı olması; kişi silmede artık kalmaması (yabancı anahtar kontrolü temiz); yedek round-trip; 33'ten göç (baseline, run, binalar aynen).
- `tests/suite.js` yeni senaryo, **Node (node:sqlite) ve Worker (workerd + yerel D1) üzerinde gerçek paralel HTTP** ile: üç ikiz başlatma → bir run, bir makbuz; sonuçlanma sırası; 426 ve v2 yanıtı.
- Eski şema taklidi yapan üç test yeni kolonları/tabloları tanıyacak şekilde güncellendi (`imece`, `blueprints`, `relaxed`); beklenen davranışları aynı.
- `npm run test:all`: sonuç PR açıklamasında.

## Bilerek sonraya

- Başlatmada şantiye için parsel ayırma, sunucu aşaması, aynı parselde dönüşüm ve v2 taşıma: **D**. Şimdilik v2 düzende yeni başlayan şantiyenin ve hediye binanın yerleşimi `null` döner (taslak geride), eski kafeste taşıma v2 ekipte kapalıdır (409).
- `timing_revision` sütunu var; mola/kurtarmada artırılması D'de şantiye aşamasıyla birlikte.
- Taslak üretme, değişiklik kaydını taslağa uygulama, etkinleştirme ve 14 günlük geri dönüş: **G**. Bu pakette düzeni yalnız test kancası (`/__test/village-v2`, yalnız `KUTUP_TEST_HOOKS`) etkinleştirir.
- Canlı veritabanına göç Batur'un yayınıyla gelir. Yayın öncesi `npm run yayin` canlı yedeği alır; göç yalnız ekleme yapar.
