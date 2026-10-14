# Kütüp verisini koruma ve kurtarma

Bu belge 14 Ekim 2026 denetiminin operasyon notudur. Aşağıdaki **uzak veritabanı komutları bu denetimde çalıştırılmadı**; Cloudflare erişimi yoktu. Gerçek ekip verisine dokunulmadı.

## Hangi yedek ne işe yarar?

| Kaynak | İçerik | Kullanım |
| --- | --- | --- |
| `/batur` → Tüm veriyi yedekle | Ekipler, üyeler, hesap parola özetleri, sabit bina konumları, odak, mesajlar, planlar ve istek geçmişi | İnceleme ve veri taşımaya kaynak. Doğrudan içeri alma aracı henüz yok. Oturumları/push anahtarlarını geri açmaz. |
| Cloudflare D1 SQL export | Tabloların tamamı; oturum, yönetici ve push sırları da bulunabilir | Yetkili, kapalı ortamda tam geri yükleme provası |
| D1 Time Travel | Cloudflare’in tuttuğu geçmiş; ücretsiz planda son 7 gün | Yakın tarihli yanlış silme veya veri bozulmasında kontrollü geri dönüş |

JSON dosyası da hassastır: kullanıcı adları, özel geri bildirimler ve parola özetleri içerir. Hiçbir yedeği Git’e, sohbete veya herkese açık dosya paylaşımına koyma. Yalnızca sahibinin okuyabildiği, tercihen şifreli bir yerde sakla. Koddaki `.gitignore` `data/` klasörünü dışlar.

## Yayından önce

1. Yetkili bilgisayarda doğru Cloudflare hesabı, Worker ve **kutup** D1 veritabanı olduğunu doğrula. Gizli anahtar değerlerini ekrana basma.
2. Panelden JSON yedeği al. Mümkünse ayrıca D1 SQL export al; örnek:

   ```sh
   umask 077
   npx wrangler d1 export kutup --remote --output=./data/kutup-before-deploy.sql
   ```

3. Yedek zamanını UTC olarak, mevcut Git commit’ini ve `settings.schema` değerini kaydet. Dosyanın oluştuğunu ve boş olmadığını doğrula; içeriğini sohbet çıktısına dökme.
4. `npm ci` ve `npm run test:all` çalıştır. Şema 8/9/10, ilk API isteğinde otomatik uygulanır. Şema 1–7 değiştirilmemelidir.

## Silinen veri için Time Travel

1. Yeni yazmaları geçici olarak durdur; olaydan **önceki** UTC zamanı belirle. Önce mevcut durumun da yedeğini al.
2. Güncel Wrangler yardımından komut seçeneklerini doğrula. Geri dönüş noktasını önce salt okunur sorguyla incele:

   ```sh
   npx wrangler d1 time-travel info kutup --timestamp="OLAYDAN_ONCEKI_UTC_ZAMAN"
   ```

3. Geri alma bütün veritabanını etkiler; yalnızca tek üyeyi geri getirmez. Seçilen andan sonraki mesajların, binaların ve hesap değişikliklerinin kaybolacağını somutlaştır. Bu yüzden gerçek kurtarma işleminden önce Batur’un bu geri dönüş noktasını onaylaması gerekir.
4. Onaylanan noktaya geri dönüş komutu:

   ```sh
   npx wrangler d1 time-travel restore kutup --timestamp="ONAYLANAN_UTC_ZAMAN"
   ```

5. Geri gelen `settings.schema` ile çalışan uygulamanın sürümünü eşleştir. Yeni kod eski şemayı yeniden yükseltebilir; eski migration’ları düzenleyerek düzeltmeye çalışma.
6. Geri alma eski oturumları ve kurtarma kodlarını da geri getirebilir. Etkilenen hesapların cihazlarını panelden kapat, yeni kod ver; gerekirse yönetici anahtarını döndür. Eski yedeklerden push aboneliklerini körlemesine etkinleştirme.
7. İsimler, üye/mesaj/plan sayıları, odak toplamları, istek geçmişi, bina sayıları ve `pos_x/pos_y/facing/district_id` değerlerini karşılaştır. Yalnızca sayıları kontrol etmek yeterli değildir. İki ayrı tarayıcıyla giriş ve senkronu doğrula.

## SQL veya JSON’dan kurtarma provası

- SQL yedeğini önce **ayrı, boş** bir yerel veritabanında ya da ayrı bir test D1 veritabanında geri yükle. Canlı `kutup` üzerine deneme yapma. Node SQLite kopyasında `PRAGMA integrity_check` ve `PRAGMA foreign_key_check` çalıştır.
- **JSON yedeği geri yükleme aracı** (`server/restore.js`, testli). Kullanımı:

  ```sh
  node scripts/restore-backup.mjs data/kutup-yedek.json data/kopya.sqlite --sql data/d1-icin.sql
  ```

  - Hedef dosya yeni ve boş olmalı; var olan bir dosyanın üstüne yazmaz.
  - Yedeği güncel şemaya kurar (eski şemalı yedekler de olur), tek işlemde ekler. Ardından yabancı anahtar ve bütünlük kontrolü yapar, tablo satır sayılarını ve her binanın `pos_x/pos_y/facing/district_id` değerini yedekle birebir karşılaştırır. Bir şey uymazsa durur ve hiçbir şey bırakmaz.
  - `--sql` ile **boş** bir D1 veritabanına yüklenecek dosya da yazar: şema ve bütün satırlar.
  - 14 Ekim'de gerçek canlı yedekle (şema 7) yerelde prova edildi.
- **D1'e taşıma:** canlı `kutup` üzerine asla yükleme. Yeni boş bir D1 aç (`npx wrangler d1 create kutup-geri`), `npx wrangler d1 execute kutup-geri --remote --file=data/d1-icin.sql` ile yükle ve kontrol et. Ancak Batur onaylarsa `wrangler.jsonc`'deki `DB` bağını yeni veritabanına çevirip yayınla.
- JSON doğrudan oturum açan sırları dışlar: oturumlar, push abonelikleri, transfer ve sıfırlama kodları geri gelmez. Eski `members.token` yerine araç rastgele, kullanılmayan bir değer koyar. Hesabı olanlar parolalarıyla yeniden giriş yapar. Hesabı olmayan eski üyeler için panelden yeni giriş kodu üret. Herkes bildirimi bir kez yeniden açmalı (yeni sunucuda VAPID anahtarı da yenidir).
- Başarılı provanın fark raporu ve veri kaybı kapsamı görülmeden üretim verisini değiştirme.

## Bilinçli korunan silme davranışı

`/leave` ve yönetici üye silme işlemi kalıcıdır. HANDOFF’taki onaylı gizlilik kararı gereği bina ve kişisel izler de silinir; boş mahalle yeniden kullanılabilir. Ayrılma öncesi ad yazarak onay korunur. Gizlice 30 günlük kişisel arşiv eklenmedi. Böyle bir ürün kararı alınırsa geri alma ve saklama süresi kullanıcıya açıkça gösterilmelidir.
