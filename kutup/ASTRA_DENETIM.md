# Kütüp — ChatGPT Astra için denetim ve iyileştirme görevi

> **Yapıştırılacak prompt (yeni sohbete aynen):**
>
> Sen Kütüp projesinin denetçi, danışman ve geliştiricisisin. Depo: `batur-create/atomuparcalayanbebek`, dal `kutup-platform`, klasör `kutup/`. Önce bu dosyayı (`kutup/ASTRA_DENETIM.md`), sonra `kutup/HANDOFF.md`'yi baştan sona oku; HANDOFF projenin asıl devir belgesi ve ilk sohbetten bu yana alınan bütün kararları içeriyor. Görevin: projeyi her açıdan (güvenlik, veri bütünlüğü, senkron, performans, mobil, erişilebilirlik, tasarım, kod kalitesi, testler) derinlemesine denetlemek ve **mevcut halinden kesinlikle daha iyi olduğundan emin olduğun her şeyi değiştirmek**. Kurulu hiçbir sistemi bozma; geri adım yok, sadece daha sağlam, daha güzel, daha gelişmiş. Her değişiklikten sonra `npm run test:all` yeşil kalmalı. Bitince `kutup/ASTRA_RAPOR.md` raporunu yaz ve `HANDOFF.md`'yi güncelle; Claude oradan devam edecek. Kullanıcı Batur; Türkçe ve samimi yazışır, soru yağmuru sevmez: kararları sen ver, yalnızca gerçekten ona ait bir şey varsa tek kısa soru sor.

---

## 1. Rolün ve yetkin

- **Rol:** denetçi + kıdemli geliştirici + tasarım gözü. Analiz et, gerekçelendir, uygula.
- **Yetki:** Daha iyi olduğundan **emin olduğun** her şeyi değiştirebilirsin (kod, tasarım, metin, yapı, testler). Emin olmadığın ya da zevke/ürün kararına dayanan şeyleri değiştirme; raporda öner.
- **Kırmızı çizgiler:**
  - Çalışan özellikleri kaldırma veya davranışını kötüleştirme. Yayınlanmış veriyi kaybettirecek hiçbir şey yapma.
  - `server/schema.js`'te yayınlanmış göçü **asla değiştirme**; yeni göç gerekiyorsa sona ekle (D1 yüzünden her eleman TEK SQL ifadesi).
  - `main` dalına dokunma (Batur'un başka bir uygulaması). Sadece `kutup-platform`.
  - `ADMIN_KEY` ve `kutup/data/` içeriği asla sohbete, loga, commit'e girmez (`kutup/data/` zaten Git dışında).
  - Yeni iş paketlerine (Paket 2–9, aşağıda) **başlama**; görevin mevcut olanı iyileştirmek. Küçük ve açıkça faydalı bir hazırlık yapabilirsin, ama raporda belirt.

## 2. Proje özeti

**Kütüp:** Ankara Milli Kütüphane'ye giden, farklı okullardan 5–10 arkadaş için telefona uygun, gerçek zamanlı buluşma PWA'sı. Ana soru her zaman "kim nerede?": kim kütüpte, kim yolda, kim ne zaman gelecek. Ton sıcak, eğlenceli, "Batur tarzı"; arayüzün tamamı Türkçe.

- **Canlı:** https://kutup.ahmetbaturkaplanoglu.workers.dev (Cloudflare Workers ücretsiz plan + D1)
- **Yerel (Batur'un Windows makinesi):** çalışma kopyası `C:\Users\İzzettin\bilim-dunyasi\kutup-platform` (git worktree), proje kökü `...\kutup-platform\kutup`.
- **Gerçek kullanım:** canlıda "Ediz'in Voleybol Buluşması" ekibi var (batru = Batur, bnesu, Sıla). Gerçek veri; dikkat.

## 3. Geçmiş: kim ne yaptı

1. **İlk sürüm** seninle (ChatGPT) yapıldı: ekip/davet, durumlar, planlar, pano, odak, Web Push, ChatGPT Sites uyumu (`.openai/hosting.json`).
2. **Bir Claude Opus sohbeti** devraldı ve şunları ekledi: Node + Worker'da aynı kodla çalışan Fetch API mimarisi, sürümlü göçler, çok cihaz oturumu ve "Başka cihazda aç" kodu, kendi yazdığı Web Push (RFC 8291 + VAPID), "Batur'a ilet" istek takibi (kargo takibi gibi aşamalar), `/batur` yönetici paneli, hareket katmanı, Forest tarzı **inşaat modu** (25/50/75 dk → kulübe/ev/kule, uygulamadan 10 sn'den uzun çıkılırsa çöker) ve kişi başı köy. Sonunda bir devir promptu yazdı: `HANDOFF.md` §1–§8 o belgenin **aynısıdır** (onaylanmış kararlar, 9 iş paketi, tuzaklar).
3. **İkinci Claude Opus sohbeti (bu belgeyi hazırlayan)** o devirle başladı ve 14 Ekim 2026'da şunları yayına aldı:
   - **Paket 1 — Ortak köy:** `shared/village.js` (titreşimli hex kafeste mahalleler, meydan etrafında spiral, kıvrımlı yollar, Poisson benzeri yerleşim, `createPlanner`), göç 6, binalara sunucunun bir kez seçip sakladığı kalıcı konum (`pos_x/pos_y/facing`), açılışta `layoutVillages()` ile eski binalara konum, 24 saatlik enkaz, bina beğenisi, artımlı `/api/village?rev=&after=`, Canvas köy haritası (256px karo önbelleği, LOD, kaydırma/pinch, gün/gece, yanan evler, baca dumanı, yoldaki yürüyen figür, avatar balonları), ana sayfada "Kütüp köyü · şu an" kartı, "Odak" sekmesi → "Köy", inşaat modu varsayılan açık.
   - **Ölçek kararı:** 5 kişi sıkı bir dönemde ~300–1.900 bina. D1 ücretsiz planda 5M satır okuma/gün sınırı var; bu yüzden sıcak yollar sayaçlarla çalışır (`districts.buildings`, `buildings.likes`), `touched` damgasıyla artımlı senkron yapılır, tam tarama yoktur.
   - **Paket 1.5 — Hesaplar (Batur'un acil isteği):** demo kişiler kaldırıldı, oturumsuz açılış → karşılama ekranı. Kullanıcı adı + şifre (PBKDF2, göç 7). Giriş penceresinde "Giriş / Şifremi unuttum / Kodla" sekmeleri. Katılırken hesap zorunlu (istemcide). Hesabı olmayana "Hesabını koru" kartı. Ayrılmak için ad yazarak onay. `/batur` panelinde üye başına cihaz/odak/bina, 🔑 24 saatlik giriş/sıfırlama kodu, tüm cihazlarda çıkış, "Tüm veriyi yedekle" (JSON).
   - **Paket 3 ön sürümü:** gizli kapı (✳'a 7 hızlı dokunuş + sonuncusunda basılı tutma, ya da "batur" yazmak → `/batur`).
   - **Paket 4 ön sürümü (sadece istemci):** Gizli not, Şşşt, Çay, Gece kuşu.
   - **Ertelenen fikir (Paket 7'ye eklendi):** çok seanslık "büyük proje" modu. Ayrıntı HANDOFF §6b'de.

## 4. Mimari (güncel)

```
kutup/
  server/app.js       Tüm API (Fetch Request/Response + async DB adaptörü: all/get/run/read/batch). Node ve Worker'da aynı kod.
  server/schema.js    Göçler 1–7 (append-only).
  server/push.js      Web Push (Web Crypto).  server/sqlite.js node:sqlite adaptörü.  server/index.js Node + SSE + Vite(--dev).
  worker/index.js     Cloudflare Worker: D1 adaptörü, ASSETS; canlılık 5 sn'lik /api/state?rev= yoklaması.
  shared/village.js   Köy yerleşimi (sunucu + istemci ortak, deterministik).   shared/requests.js istek aşamaları.
  src/App.jsx         Ana uygulama (~2.800 satır; Welcome, Onboard, FocusCard, Board, ProfileModal, AccountBox...).
  src/Village.jsx     KINDS + ConstructionScene (SVG, tek rAF, 30 fps).
  src/iso.js          İzometrik çizim primitifleri; SVG string ya da useCanvas() ile Canvas'a çizer (aynı kod).
  src/villageWorld.js Köy verisinden dünya (zemin, yollar, ağaçlar, binalar, lambalar), gün/gece tonu, uzamsal ızgara.
  src/villageView.js  Canvas motoru: karo LRU, LOD, jestler, canlı katman, görünmezken uyur.
  src/VillageMap.jsx  useVillage (artımlı senkron + beğeni), VillagePanel, VillageNow, BuildingCard.
  src/Owner.jsx       /batur paneli.  src/Requests.jsx Batur'a ilet.  src/ui.jsx yardımcılar.  src/api.js fetch + sabitler.
  src/styles.css      Eski büyük temel stil (~4.600 satır).  src/motion.css hareket + yeni bileşen stilleri.
  tests/              suite.js (uçtan uca, Node ve Worker'da ayrı koşar), core.test.js, push.test.js — toplam 45 test.
```

**Kritik mekanizmalar:** her yazma `bump(groupId)` yapar ve yanıtta `state` döner; köy değişince ayrıca `bumpVillage`. Biten odak seanslarını kim okursa o kredilendirir (`settleFocus`, koşullu SQL; aynı ızgara hücresi için yarışan yazımlar `UNIQUE(group_id,dx,dy)`'ye takılır, `retrying()` taze okumayla yeniden planlar). İnşaat modunda istemci 20 sn'de bir `beat` atar, 3 sn'de bir localStorage işareti bırakır (sayfa yenileme "uygulamadan çıkma" sayılmasın diye). Yazma koruması: `X-Kutup: 1` başlığı + Origin kontrolü.

## 5. Komutlar ve iş akışı

```
cd kutup && npm ci
npm run dev          # http://localhost:3001 (Node + SSE + Vite)
npm run test:all     # 45 test (Node + yerel workerd/D1) — her değişiklikten sonra yeşil olmalı
npm run deploy       # vite build + wrangler deploy (Cloudflare erişimin varsa)
```

- **Yayın ve duman testi:** Cloudflare erişimin yoksa yayınlama; raporda "yayın bekliyor" yaz, Claude yayınlar. Erişimin varsa: yayın → canlıda API ile geçici ekip kur, dene, `POST /api/leave` ile sil.
- **Commit:** küçük, odaklı, İngilizce mesaj; `kutup-platform` dalına push.
- **Görsel kontrol:** 375px genişlikte yatay taşma olmamalı. Canvas/rAF, görünmeyen sekmede çalışmaz (bilerek böyle); başsız Playwright gibi gerçekten çizen bir tarayıcıyla kontrol et.

## 6. Bilinen tuzaklar (önceki oturumlardan)

- Windows Git Bash heredoc'ları ters tırnak ve `’` içeren metni bozuyor; düzenlemeyi dosya araçlarıyla ya da betik dosyasıyla yap.
- **`String.prototype.replace` ile yama yaparken yerine koyma metnindeki `$$` tek `$` olur** (PBKDF2 hash biçimi bu yüzden bir kez bozuldu). `split(a).join(b)` kullan.
- Türkçe küçültme: `"I".toLocaleLowerCase("tr") === "ı"`. Kullanıcı adları ı/i farkına duyarsız (`usernameOf`).
- Üst klasördeki Tailwind/PostCSS sızmasın diye `vite.config.js`'te `css.postcss` boş tanımlı; kaldırma.
- Yazı boyutu telefonda 10px'in altına inmesin. Dinamik isimlerden sonra Türkçe ek kullanma ("Batur’e" hatası) → "Kütüpte: Elif", "Yapan: Deniz" gibi kalıplar kullan.
- Animasyon kuralı: ziyaret başına tek açılış koreografisi, gerisi yalnızca eyleme cevap. Kendi `transform`'u olan öğede sadece `from` keyframe + `animation-fill-mode: backwards`. `prefers-reduced-motion` destekleniyor.
- Workers ücretsiz plan: istek başına ~10 ms CPU. PBKDF2 bu yüzden 20.000 tur.
- Rate limit bellek içinde ve **isolate başına** (Workers'ta zayıf). Düzeltirken D1 satır okuma bütçesini unutma.

## 7. Denetim listesi (benim bildiğim zayıf noktalar, öncelik sırasıyla)

Bunları doğrula, gerekirse düzelt; listede olmayanları da bul.

1. **Çıkış yapılan cihazlara push gitmeye devam ediyor:** "tüm cihazlarda çıkış" ve ayrılma `sessions`'ı siliyor ama `subscriptions` üyeye bağlı kalıyor. Oturuma bağlamak ya da çıkışta temizlemek gerekebilir.
2. **Giriş kaba kuvvete karşı zayıf:** `/login` ve `/reset` rate limit'i isolate başına bellekte. D1 tabanlı, ucuz bir deneme sayacı düşün.
3. **Sunucu katılırken hesabı zorunlu tutmuyor** (eski testler yüzünden isteğe bağlı). Yeni katılımlar için sunucuda da zorunlu yapılabilir (testleri güncelle).
4. **Ayrılmak kalıcı silme.** 30 gün geri alınabilir yumuşak silme ve panelden geri getirme, Batur'un "hiçbir hesap kaybolmamalı" isteğine daha uygun olur.
5. **Yedek:** `/owner/backup` JSON'u (`pass_hash` hash'li olarak içinde) var ama **geri yükleme yok**. Güvenli bir içe aktarma ya da en azından belgelenmiş geri yükleme yolu, ayrıca D1 Time Travel notu.
6. **Şantiye sahnesi `iso.js` refaktöründen sonra görsel olarak tekrar doğrulanmadı;** sadece SVG çıktısı kontrol edildi. 25/50/75 dk sahnelerini ve çöküşü gerçekten çizip bak.
7. **Köy haritası:** büyük köyde (1.000+ bina) performans testi yok; `villageWorld.js`'te `network.links.includes` O(n). Karo bellek sınırı (40 karo, DPR ≤ 2) mobilde uygun mu? Ana sayfa kartı küçük ölçekte okunaklı mı?
8. **İstemci testleri yok** (Canvas motoru, `mergeVillage`, giriş akışları). En azından saf fonksiyonlar (`mergeVillage`, `skyAt`, `chooseCell`) için birim testi.
9. **`App.jsx` tek dosyada ~2.800 satır**, `styles.css` ~4.600 satır eski stil. Davranışı değiştirmeden bölmek bakımı kolaylaştırır (ör. `Onboard`/`Welcome`/`AccountBox` → `src/Account.jsx`).
10. **Owner panelinde giriş kodu `prompt()` ile gösteriliyor.** Kopyala düğmeli küçük bir modal daha iyi olur.
11. **Çevrimdışı/bağlantı hataları,** iOS ana ekran PWA davranışı, bildirim izin akışı, erişilebilirlik (odak sırası, aria, kontrast).
12. Türkçe metinlerin tutarlılığı ve tonu, boş durumlar, hata mesajları.

## 8. Değişmemesi gerekenler (sözleşmeler)

- API yolları ve yanıt biçimleri (istemci ve testler bunlara bağlı); değiştirirsen geriye uyumlu kal.
- Bina konumları DB'de kalıcı; çizim kuralı değişse bile hiçbir bina yer değiştirmemeli.
- `?tab=focus` gibi derin bağlantılar ve bildirim URL'leri.
- Oturum çerezleri: `kutup_session` (1 yıl, HttpOnly, Lax), `kutup_owner` (30 gün, Path=/api/owner, Strict).
- Gizli kapı sadece kapıyı gösterir; panel her zaman anahtar ya da hatırlanan sahip çerezi ister.

## 9. Sıradaki iş paketleri (senin işin değil; bağlam için)

Paket 2 Mürekkep (maskot kedi + tanıtım) → Paket 3 kara delik ve Batur'un geliştirici eşyası → Paket 4 gizli rozetler (sunucu tarafı, n/12) → Paket 5 mühendislik seviyesinde şantiye → Paket 6 köy görsel yükseltmesi + Milli Kütüphane anıtı → Paket 7 beraber inşaat + büyük proje modu → Paket 8 mola oyunları → Paket 9 sonrası. Ayrıntılar HANDOFF §7'de.

## 10. Teslim: rapor ve devir

İş bitince `kutup/ASTRA_RAPOR.md` dosyasını şu başlıklarla yaz ve commit'le:

1. **Özet:** 5–10 satır; en önemli kazanımlar.
2. **Yapılan değişiklikler:** her biri için dosya(lar), neden, risk, nasıl doğrulandı. Commit hash'leri.
3. **Bulup değiştirmediklerin:** neden (emin değilim / ürün kararı / büyük iş). Öneri olarak sırala.
4. **Test ve yayın durumu:** `npm run test:all` sonucu, yayınlandı mı, canlı duman testi.
5. **Claude için devir:** Paket 2'ye geçmeden bilmesi gerekenler, yeni tuzaklar, yeni göç varsa numarası.

Ayrıca `HANDOFF.md` §6b'ye kısa bir "Astra denetimi (tarih)" maddesi ekle. Batur'a da 3–5 satırlık Türkçe özet yaz.
