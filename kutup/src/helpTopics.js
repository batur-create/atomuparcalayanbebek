// n42, Kara'ya sor: what each screen is for, in Kara's own words, for someone
// who has never seen the app. Nothing here shows until someone asks: the help
// sheet (the cat button at the top) opens on the screen they are on, and the
// small "?" beside a tricky word opens the sheet at that question.
// Numbers come from shared/catalog.js so the answers never drift from the rules.
import { BUILD_LEAVE, DAILY_BONUS, GRACE, MASTER_PRIZE, MONUMENT_PRIZE, RESCUE_WINDOW, RUIN_DAYS, rescueMinutes, teaBreakFor, wageFor } from "../shared/catalog.js";

const sec = (ms) => Math.round(ms / 1000),
  min = (ms) => Math.round(ms / 60000);

export const HELP = {
  home: {
    label: "Kütüp",
    intro: "Burası ana sayfa. Kim kütüpte, kim yolda, kim ne zaman geliyor; hepsi tek bakışta.",
    items: [
      {
        id: "arrive",
        q: "“Geldim” ve “Yoldayım” ne işe yarar?",
        a: "Kütüphaneye varınca Geldim’e bas, salonunu seç; ekip seni içeride görür. Yola çıktıysan Yoldayım de, ne zaman varacağını seç. Giderken aynı karttaki Çıktım’a basarsın. Böylece kimse “neredesin” diye sormak zorunda kalmaz.",
      },
      {
        id: "map",
        q: "Masa haritası ne?",
        a: "Salonu kuşbakışı gösterir. Boş bir sandalyeye dokunup oturduğun yeri işaretlersin, arkadaşın seni aramadan bulur. İstemezsen boş bırakabilirsin.",
      },
      {
        id: "plan",
        q: "Buluşma planı nasıl yapılır?",
        a: "“Kim ne zaman geliyor?” kartında Buluşma planla’ya bas. O gün bir buluşma varsa kendi geliş saatinle ona katılabilirsin. Buluşma kartında Varım, Gelemem veya Kararsızım seç; geliş saatini ve istersen kısa notunu kaydet. Planı gruba gönderebilir, kendi saatinle takvime ekleyebilir ve 30 dakika önce tek hatırlatma isteyebilirsin. Ortak saat değişirse katılanlar yeniden onaylar.",
      },
      {
        id: "kara",
        q: "Çatıdaki kedi kim?",
        a: "Benim, Kara! Kütüphanenin kedisiyim. Duruşum ekibin hâlini söyler: uyuyorsam kimse yok, patikaya bakıyorsam biri yolda, kitap okuyorsam sen odaktasın. Bana dokununca o an bilmen gereken şeyi söylerim.",
      },
      {
        id: "notify",
        q: "Bildirimleri açmalı mıyım?",
        a: "Açarsan arkadaşın gelince, kahve çağrısında ya da yeni planda telefonuna haber gelir. Sağ üstteki zile bas. iPhone’da önce Safari’de Paylaş → Ana Ekrana Ekle yap, Kütüp’ü ana ekrandan aç, sonra zile bas.",
      },
      {
        id: "story",
        q: "Haftanın hikâyesi ne?",
        a: "Her Pazar akşamı ekibin haftası kart kart çıkar: kim öne çıktı, köyde neler yükseldi. İstersen kendi kartını paylaşırsın.",
      },
    ],
  },
  focus: {
    label: "Köy",
    intro: "Burası odak yeri. Süreni başlat, telefonu bırak; bitince köyümüze bir bina eklenir.",
    items: [
      {
        id: "start",
        q: "Nasıl başlarım?",
        a: "Seansında bina varsa bitince köyüne eklenir (ilk binalar bedava). Bina istemiyorsan Bu seansı binasız yap seçeneğine dokun; sonra Bina ekle ile geri alabilirsin. İnşaatta telefonu kilitlemek istiyorsan Ekranı kapatarak çalış anahtarını aç. Alttaki büyük düğmeyle başla. Anıtkabir ve arkadaşa katılımda da aynı ekran anahtarı kullanılır.",
      },
      {
        id: "modes",
        q: "İnşaat ile Yalnız odak farkı ne?",
        a: `İnşaat: malzemesini öder, süreyi tamamlayınca seçtiğin binayı köyüne eklersin. Ekranı kapatarak çalış anahtarı kapalıysa Kütüp açık kalır ve maaş tamdır; açıksa ekranı kilitleyebilir veya uygulamadan çıkabilirsin, maaş yarımdır. Yalnız odak: bina ve malzeme ücreti yok, süreyi sen seçersin, maaş yarımdır; uzakta geçen dakika sayılmaz. Anıtkabir ortak görevdir: iki ekran ayarında da yarım maaş, tamamlanan seansın süresi projeye katkı.`,
      },
      {
        id: "bricks",
        q: "Tuğla 🧱 ve maaş ne?",
        a: `Tuğla köyün parası. Bitirdiğin her inşaat maaş getirir: 25 dk → ${wageFor(25)}, 50 dk → ${wageFor(50)}, 75 dk → ${wageFor(75)} tuğla. Günün ilk seansı +${DAILY_BONUS}, art arda seanslar (seri) fazladan getirir. Tuğlayla daha büyük ve süslü binalar alırsın.`,
      },
      {
        id: "leave",
        q: "Telefondan çıkarsam ne olur?",
        a: `Ekranı kapatarak çalış kapalıyken inşaatta uygulamadan çıkarsan ${sec(BUILD_LEAVE)} saniye içinde dön. Dönmezsen bina çatlar; ${min(RESCUE_WINDOW)} dakika içinde dönersen birkaç dakika ekleyip kurtarırsın (25 dk’lık seansa +${rescueMinutes(25)} dk). Daha uzun kalırsan bina yıkılır. Bilgisayarda sekme değiştirmek serbest, yeter ki Kütüp sekmesi açık kalsın. Anahtar açıksa ekranı kilitlemek, başka uygulamaya geçmek veya sekmeyi kapatmak inşaatı bozmaz. Dönünce hızlandırılmış yapımı izlersin.`,
      },
      {
        id: "quit",
        q: "Vazgeç ile Pes et farkı ne?",
        a: `İlk ${min(GRACE)} dakikada Vazgeç bedavadır, hiçbir şey kaybetmezsin. Sonra Pes et dersen bina yıkılır: malzemenin yarısı hemen geri gelir. Kalan enkazı ${RUIN_DAYS} gün içinde bir seansla kaldırırsan biraz daha geri gelir.`,
      },
      {
        id: "tea",
        q: "Çay molası ne?",
        a: `Ekranı kapatarak çalış kapalıyken, 50 dakika ve üstü inşaatta bir kez mola verebilirsin (50 dk’ya ${min(teaBreakFor(50))}, 75 dk’ya ${min(teaBreakFor(75))} dakika). Molada bina bekler, uygulamadan çıkabilirsin. Anahtar açıksa zaten uygulamadan çıkabilirsin; ayrı çay molası yoktur.`,
      },
      {
        id: "rhythm",
        q: "Masa ritmi ne?",
        a: "Ekipçe aynı anda çalışıp aynı anda mola vermek için. 50+10: her saat başı 50 dakika çalış, 10 dakika mola. 25+5: her yarım saatte bir tur. Biri açınca bütün ekipte açılır. Kapalı’da herkes kendi saatinde.",
      },
      {
        id: "together",
        q: "Ekibi çağır ve Katıl ne?",
        a: "Ekibi çağır açıkken başlarsan arkadaşlarına bildirim gider. Katılımı seç penceresi kalan süreyi, sana ait binayı, ücretini ve ortak bitiş saatini önce gösterir. Bina için katalogdaki sürenin tamamı kalmalı; yalnız odak için en az 20 dakika gerekir. Arkadaşının binası kopyalanmaz. Çay molasındayken katılamazsın. Anıtkabir görevi kendi şantiye ekranından ayrı başlatılır. Köye bakmak seansı durdurmaz; beraber çalışınca mevcut imece primi geçerlidir.",
      },
      {
        id: "imece-contribution",
        q: "Anıtkabir’de 150 dk çalıştım; bölüm payım neden 50 dk?",
        a: "150 dakikanın tamamı ortak Anıtkabir hedefine eklenir. İlk bölümde herkesin zorunlu katılımı 50 dakika olduğu için o payın 50/50 tamamlanır. Fazladan 100 dakika da ortak inşaatı ilerletir. İkinci bölümdeki 150 dakika payın, o bölüm açılınca başlar; son bölümde de herkes 50 dakika çalışır. Kartında toplam katkın ve üç bölümdeki katılımın ayrı görünür.",
      },
      {
        id: "week",
        q: "Ortak anıt ve Haftanın Ustası ne?",
        a: `Ortak anıt ekibin haftalık hedefi: herkesin dakikası toplanır, hedef dolunca herkese +${MONUMENT_PRIZE} 🧱. Haftanın Ustası geçen hafta en çok çalışan; o da +${MASTER_PRIZE} 🧱 alır.`,
      },
      {
        id: "rare",
        q: "Kilitli binalar nasıl açılır?",
        a: "Tamamladığın her 25 dakika için %5 plan şansı var; 75 dakika tek seans ile 3 × 25 dakika eşittir. Plan çıkmadan 500 dakika emekte, sahip olmadığın rastgele bir plan garanti. Katalogdaki Plan keşfi kalan süreyi gösterir; gün kaçırmak ilerlemeyi silmez. 7, 14 ve 30 günlük seride ayrıca rastgele eksik plan kazanırsın. Plan bulunca Kara’nın özel postası açılır; Planlarıma bak düğmesiyle yapını seçebilirsin. Mardin Evi ve Atakule dahil 14 nadir yapı planla kalıcı açılır, plan her inşaatta yeniden kullanılır. Havuz bittiyse yeni plan beklenir. Haftalık yapıyı iki haftalık açık dönemde tamamlarsan planı kalıcı senin olur.",
      },
      {
        id: "village",
        q: "Köy haritasında neye bakarım?",
        a: "Herkesin kendi mahallesi var, binalar oraya dizilir. İki parmakla yakınlaştır, bir binaya dokununca bilgisini görürsün. İnşaat sürerken evrelerin yanındaki (i) o adımı anlatır.",
      },
    ],
  },
  board: {
    label: "Pano",
    intro: "Burası ekibin küçük sohbet panosu. Yalnız ekibin görür.",
    items: [
      {
        id: "write",
        q: "Pano’ya ne yazılır?",
        a: "Yer tutma (“iki kişilik yer tuttum”), kısa notlar, motivasyon. Bir mesaja kalp bırakabilir ya da Yanıtla ile cevap verebilirsin; cevabın sahibine haber gider.",
      },
      {
        id: "coffee",
        q: "Kahve çağrısı ne?",
        a: "“Bi’ kahve?” kartında Ekibe seslen’e bas, “10 dakika sonra kahve?” gibi bir not yaz. Not Pano’ya düşer, bildirimi açık olanlara haber gider; gelen kalp atar.",
      },
      {
        id: "who",
        q: "Bunu kim görüyor?",
        a: "Yalnız ekibin. Kütüp dışından kimse Pano’yu okuyamaz.",
      },
    ],
  },
  me: {
    label: "Ben",
    intro: "Burası senin köşen: profilin, görünümün, istatistiklerin ve hesabın.",
    items: [
      {
        id: "device",
        q: "Başka telefonda ya da bilgisayarda nasıl açarım?",
        a: "Ben → Hesap ve cihazlar’da kullanıcı adını gör ya da şifre koy. Öbür cihazda Giriş yap deyip bunlarla gir. Açık cihazlarını da oradan tek tek kapatabilirsin.",
      },
      {
        id: "invite",
        q: "Arkadaşımı nasıl eklerim?",
        a: "Arkadaşını ekibe ekle’ye bas, davet linkini WhatsApp’tan at. Linke dokunan doğrudan ekibine katılır.",
      },
      {
        id: "badges",
        q: "Rozetler nasıl kazanılır?",
        a: "Başarımlar’da bütün rozetler ve her birine ne kadar kaldığı yazar. Birkaçı gizli; onlar sürpriz.",
      },
      {
        id: "look",
        q: "Rengi ya da gece modunu nasıl değiştiririm?",
        a: "Görünüm’den tema rengini seç. Sağ üstteki güneş/ay düğmesinden Açık, Koyu ya da Otomatik’i seçersin.",
      },
      {
        id: "leaveTeam",
        q: "Çıkış yap ile Ekipten ayrıl farkı ne?",
        a: "Çıkış yap yalnız bu cihazdan çıkar; profilin durur, şifrenle geri girersin. Ekipten ayrıl profilini, binalarını ve mesajlarını siler; geri dönüşü yok.",
      },
      {
        id: "feedback",
        q: "Bir şey bozuksa ya da fikrim varsa?",
        a: "Batur’a ilet’e yaz. Batur görür, cevabı da buraya gelir.",
      },
    ],
  },
};
HELP.feedback = HELP.me;
export const HELP_TABS = ["home", "focus", "board", "me"];

// The short tour for someone new: five stops, each pointing at the real thing.
// `at` lists selectors in order; the first one visible on this screen is used.
export const TOUR = [
  { at: [".home-status"], text: "Kütüphaneye varınca Geldim’e bas, ekip seni anında görür. Yoldaysan Yoldayım de." },
  { at: ["#plans"], text: "Ortak buluşmaya kendi geliş saatinle katıl. Kim, kaçta geliyor; aynı kartta görün." },
  { at: ['.mobile-bottom [data-tab="focus"]', '.sidebar [data-tab="focus"]'], text: "Köy’de süre başlatırsın. Telefonu bırak; bitince köye bir bina eklenir." },
  { at: ['.mobile-bottom [data-tab="board"]', '.sidebar [data-tab="board"]'], text: "Pano ekibin sohbet köşesi: not bırak, kahveye çağır." },
  { at: [".help-button"], text: "Takıldığın her yerde bana dokun, o ekranı kısaca anlatırım. Hepsi bu, iyi çalışmalar!" },
];
// Someone who already knows the app only meets the new button, once.
export const HELP_NEWS = { at: [".help-button"], text: "Yeni: bir şey anlamazsan bana dokun. Hangi ekrandaysan onu kısaca anlatırım." };
