// One URL contract for the app, its sheets and the owner panel. No session,
// form values, invitation credentials or action requests belong in these URLs.
import { BY_ID } from "./catalog.js";
export const TAB_PATHS = { home: "/", focus: "/koy", board: "/pano", me: "/ben", feedback: "/ben/batura-ilet" };
const root = ["Kütüp", "/"];
const koy = ["Köy", "/koy"], ben = ["Ben", "/ben"], ekip = ["Ekibimiz", "/ekip"];
const catalog = ["Yapı kataloğu", "/koy/katalog"], owner = ["Komuta merkezi", "/batur"];
const encode = value => encodeURIComponent(String(value));
const roomNames = { adnan: "Adnan Ötüken Okuma Salonu", mujgan: "Dr. Müjgan Cunbur Okuma Salonu" };
const roomPart = value => encode(Object.entries(roomNames).find(([, name]) => name === value)?.[0] || value);
const definitions = [];
function add(path, title, values = {}, parents = []) {
  definitions.push({ path, title, values, parents });
}
add("/", "Kütüp");
add("/koy", "Köy", { tab: "focus" });
add("/pano", "Pano", { tab: "board" });
add("/ben", "Ben", { tab: "me" });
add("/ben/batura-ilet", "Batur’a ilet", { tab: "feedback" }, [ben]);
add("/ben/batura-ilet/istekler/:request", "İsteğim", p => ({ tab: "feedback", feedbackRequest: p.request }), [ben, ["Batur’a ilet", "/ben/batura-ilet"]]);
const modals = {
  profile: ["/ben/profil", "Profilim", "me", [ben]],
  look: ["/ben/gorunum", "Görünüm", "me", [ben]],
  accounts: ["/ben/hesaplar", "Hesaplarım", "me", [ben]],
  account: ["/ben/hesap", "Hesap ve cihazlar", "me", [ben]],
  achievements: ["/ben/basarimlar", "Başarımlar", "me", [ben]],
  team: ["/ekip", "Ekibimiz", "home", []],
  invite: ["/ekip/davet", "Arkadaşını ekibe ekle", "home", [ekip]],
  presence: ["/durum", "Durumum", "home", []],
  coming: ["/gelis", "Geliş saatim", "home", []],
  plan: ["/bulusmalar/yeni", "Buluşma oluştur", "home", [["Buluşmalar", "/bulusmalar"]]],
  coffee: ["/pano/kahve", "Kahveye çağır", "board", [["Pano", "/pano"]]],
  yenilikler: ["/yenilikler", "Yenilikler", "home", []],
};
for (const [modal, [path, title, tab, parents]] of Object.entries(modals)) add(path, title, { tab, modal }, parents);
add("/bulusmalar", "Buluşmalar", { section: "plans" });
add("/bulusmalar/:plan", "Buluşma", p => ({ modal: { plan: p.plan } }), [["Buluşmalar", "/bulusmalar"]]);
add("/ekip/uyeler/:member", "Ekip arkadaşı", p => ({ modal: { member: { id: p.member } }, memberId: p.member }), [ekip]);
add("/salonlar", "Masa haritası", { modal: { map: "auto" } });
add("/salonlar/:room", "Salon", p => ({ modal: { map: roomNames[p.room] || p.room }, room: roomNames[p.room] || p.room }), [["Masa haritası", "/salonlar"]]);
add("/ben/istatistikler", "İstatistiklerim", { tab: "me", stats: true }, [ben]);
add("/haftanin-hikayesi", "Haftanın hikâyesi", { story: true });
add("/haftanin-hikayesi/:week", "Haftalık hikâye", p => ({ story: true, storyWeek: p.week }), [["Haftanın hikâyesi", "/haftanin-hikayesi"]]);
add("/koy/odak", "Odak ekranı", { tab: "focus", focusScreen: true }, [koy]);
add("/koy/sesler", "Ses karışımı", { tab: "focus", mixer: true }, [koy]);
add("/koy/imece", "Anıtkabir imecesi", { tab: "focus", imeceOpen: true }, [koy]);
add("/koy/aniti", "Haftanın ortak anıtı", { tab: "focus", koyTile: "monument" }, [koy]);
add("/koy/haftalik-tablo", "Haftanın odak tablosu", { tab: "focus", koyTile: "week" }, [koy]);
add("/koy/harita", "Köy haritası", { tab: "focus", villageFull: true }, [koy]);
add("/koy/yapilar", "Köydeki yapılar", { tab: "focus", buildingList: true }, [koy]);
add("/koy/yapilar/:building", "Yapı", p => ({ tab: "focus", villagePicked: p.building, buildingList: true }), [koy, ["Köydeki yapılar", "/koy/yapilar"]]);
add("/koy/katalog", "Yapı kataloğu", { tab: "focus", picking: true }, [koy]);
add("/koy/katalog/koleksiyon", "Koleksiyonum", { tab: "focus", picking: true, catalogView: "collection" }, [koy, catalog]);
add("/koy/katalog/cuzdan", "Tuğla kasası", { tab: "focus", picking: "wallet", catalogView: "wallet" }, [koy, catalog]);
add("/koy/katalog/:model", p => BY_ID[p.model]?.name || "Yapı bulunamadı", p => ({ tab: "focus", picking: true, catalogModel: p.model }), [koy, catalog]);
add("/yardim", "Kara’ya sor", { help: { tab: "home", topic: null }, helpAt: "home" });
add("/yardim/:section", "Kara’ya sor", p => ({ help: { tab: p.section, topic: null }, helpAt: p.section }), [["Kara’ya sor", "/yardim"]]);
add("/yardim/:section/:topic", "Yardım konusu", p => ({ help: { tab: p.section, topic: p.topic }, helpAt: p.section, helpTopic: p.topic }), [["Kara’ya sor", "/yardim"]]);
add("/giris", "Giriş yap", { entryModal: "login", modal: "login" });
add("/join/:invite", "Ekibe katıl", p => ({ invite: p.invite }));
add("/join/:invite/giris", "Giriş yap", p => ({ invite: p.invite, modal: "login" }));
add("/ben/hesaplar/ekle", "Hesap ekle", { tab: "me", adding: true }, [ben, ["Hesaplarım", "/ben/hesaplar"]]);
add("/ben/hesaplar/ekle/giris", "Hesaba giriş yap", { tab: "me", adding: true, modal: "login" }, [ben, ["Hesaplarım", "/ben/hesaplar"], ["Hesap ekle", "/ben/hesaplar/ekle"]]);
add("/batur", "Komuta merkezi", { ownerPage: true, ownerView: "requests" });
const ownerViews = { requests: ["istekler", "İstekler"], builds: ["yapi-istekleri", "Yapı istekleri"], groups: ["ekipler", "Ekipler"], imece: ["imece", "Ortak Anıtkabir"] };
for (const [ownerView, [slug, title]] of Object.entries(ownerViews)) add(`/batur/${slug}`, title, { ownerPage: true, ownerView }, [owner]);
add("/batur/istekler/:request", "İstek", p => ({ ownerPage: true, ownerView: "requests", ownerOpenId: p.request }), [owner, ["İstekler", "/batur/istekler"]]);
add("/batur/yapi-istekleri/:request", "Yapı isteği", p => ({ ownerPage: true, ownerView: "builds", ownerOpenId: p.request }), [owner, ["Yapı istekleri", "/batur/yapi-istekleri"]]);
add("/batur/ekipler/yeni", "Yeni ekip kur", { ownerPage: true, ownerView: "groups", ownerNewTeam: true }, [owner, ["Ekipler", "/batur/ekipler"]]);
for (const [slug, key, title] of [["ad", "ownerRenameId", "Ekip adı"], ["duyuru", "ownerAnnounceId", "Ekibe duyuru"], ["koy-duzeni", "ownerVillageId", "Köy düzeni"]])
  add(`/batur/ekipler/:group/${slug}`, title, p => ({ ownerPage: true, ownerView: "groups", [key]: p.group }), [owner, ["Ekipler", "/batur/ekipler"]]);
add("/batur/uyeler/:member/hediye", "Hediye gönder", p => ({ ownerPage: true, ownerView: "groups", ownerGiftId: p.member }), [owner, ["Ekipler", "/batur/ekipler"]]);

export const ROUTES = definitions;
const defaults = { tab: "home", modal: null, adding: false, story: false, focusScreen: false, help: null, stats: false, picking: false, mixer: false, imeceOpen: false, koyTile: null, villageFull: false, buildingList: false, villagePicked: null, catalogView: "shop", catalogModel: null, helpTopic: null, ownerView: "requests", ownerOpenId: null, ownerNewTeam: false };
export function readRoute(input) {
  const url = new URL(input, "https://kutup.invalid");
  let segments;
  try { segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent); }
  catch { segments = null; }
  for (const d of definitions) {
    const parts = d.path.split("/").filter(Boolean), params = {};
    if (!segments || segments.length !== parts.length || !parts.every((part, i) => part.startsWith(":") ? (params[part.slice(1)] = segments[i], true) : part === segments[i])) continue;
    const values = { ...defaults, ...(typeof d.values === "function" ? d.values(params) : d.values) };
    if (values.villageFull && url.searchParams.get("yapi")) values.villagePicked = url.searchParams.get("yapi");
    if (values.ownerPage && ["open", "seen", "accepted", "building", "done", "declined", "all"].includes(url.searchParams.get("durum"))) values.ownerFilter = url.searchParams.get("durum");
    if ((values.modal || values.story || values.focusScreen || values.imeceOpen || values.help) && Object.hasOwn(TAB_PATHS, url.searchParams.get("kaynak"))) values.tab = url.searchParams.get("kaynak");
    else if (values.help) values.tab = Object.hasOwn(TAB_PATHS, values.helpAt) ? values.helpAt : "home";
    const crumbs = (d.path === "/" ? [] : [root, ...d.parents]).map(([label, href]) => ({ label, href }));
    const path = "/" + segments.map(encode).join("/");
    const title = typeof d.title === "function" ? d.title(params) : d.title;
    crumbs.push({ label: title, href: path });
    return { ...values, path, search: url.search, params, crumbs, title, parent: crumbs.at(-2)?.href || "/", found: true };
  }
  return { ...defaults, path: url.pathname, search: url.search, title: "Sayfa bulunamadı", crumbs: [{ label: root[0], href: root[1] }, { label: "Sayfa bulunamadı", href: url.pathname }], parent: "/", found: false };
}

// Convert only navigation parameters. Account-switch/join parameters remain
// available until the authenticated opening has consumed them.
export function legacyUrl(input) {
  const url = new URL(input, "https://kutup.invalid"), q = url.searchParams;
  if (url.pathname !== "/") return url.pathname + url.search + url.hash;
  let path = TAB_PATHS[q.get("tab")] || "/";
  if (q.get("tab") === "plans") path = "/bulusmalar";
  if (q.has("imece")) path = "/koy/imece";
  if (q.has("story")) path = "/haftanin-hikayesi";
  if (q.get("action") === "here") path = "/durum";
  if (q.get("plan")) path = `/bulusmalar/${encode(q.get("plan"))}`;
  for (const key of ["tab", "imece", "story", "action", "plan"]) q.delete(key);
  const query = q.toString();
  return path + (query ? `?${query}` : "") + url.hash;
}

export function modalUrl(value) {
  if (typeof value === "string") return modals[value]?.[0] || (value === "login" || value === "onboard" ? "/giris" : null);
  if (value?.plan) return `/bulusmalar/${encode(value.plan)}`;
  if (value?.member?.id) return `/ekip/uyeler/${encode(value.member.id)}`;
  if (value?.map) return value.map === "auto" || value.map === true ? "/salonlar" : `/salonlar/${roomPart(value.map)}`;
  return null;
}

export function stateUrl(key, value, route) {
  const parent = route.parent;
  const withContext = path => readRoute(path).tab === route.tab ? path : `${path}?kaynak=${encode(route.tab)}`;
  switch (key) {
    case "tab": return TAB_PATHS[value] || "/";
    case "modal":
      if (value === "login" || value === "onboard") return route.adding ? "/ben/hesaplar/ekle/giris" : route.invite ? `/join/${encode(route.invite)}/giris` : "/giris";
      return value ? modalUrl(value) && withContext(modalUrl(value)) : route.adding ? "/ben/hesaplar/ekle" : route.invite ? `/join/${encode(route.invite)}` : TAB_PATHS[route.tab] || "/";
    case "adding": return value ? "/ben/hesaplar/ekle" : "/ben/hesaplar";
    case "story": return value ? withContext("/haftanin-hikayesi") : TAB_PATHS[route.tab] || "/";
    case "focusScreen": return value ? withContext("/koy/odak") : TAB_PATHS[route.tab] || "/";
    case "stats": return value ? "/ben/istatistikler" : "/ben";
    case "picking": return value ? value === "wallet" ? "/koy/katalog/cuzdan" : "/koy/katalog" : "/koy";
    case "catalogView": return value === "wallet" ? "/koy/katalog/cuzdan" : value === "collection" ? "/koy/katalog/koleksiyon" : "/koy/katalog";
    case "mixer": return value ? "/koy/sesler" : parent;
    case "imeceOpen": return value ? withContext("/koy/imece") : TAB_PATHS[route.tab] || "/";
    case "koyTile": return value ? value === "week" ? "/koy/haftalik-tablo" : "/koy/aniti" : parent;
    case "villageFull": return value ? `/koy/harita${route.villagePicked ? `?yapi=${encode(route.villagePicked)}` : ""}` : route.villagePicked ? `/koy/yapilar/${encode(route.villagePicked)}` : parent;
    case "buildingList": return value ? "/koy/yapilar" : "/koy";
    case "villagePicked": return route.villageFull ? `/koy/harita${value ? `?yapi=${encode(value)}` : ""}` : value ? `/koy/yapilar/${encode(value)}` : "/koy";
    case "room": return `/salonlar/${roomPart(value)}`;
    case "help": return value ? `/yardim/${encode(value.tab || "home")}${value.topic ? `/${encode(value.topic)}` : ""}?kaynak=${encode(route.tab)}` : TAB_PATHS[route.tab] || "/";
    case "helpAt": return `/yardim/${encode(value)}?kaynak=${encode(route.tab)}`;
    case "helpTopic": return `/yardim/${encode(route.helpAt || "home")}${value ? `/${encode(value)}` : ""}?kaynak=${encode(route.tab)}`;
    case "ownerView": return `/batur/${ownerViews[value]?.[0] || "istekler"}`;
    case "ownerFilter": return `${route.path}?durum=${encode(value)}`;
    case "ownerOpenId": return value ? `/batur/${ownerViews[route.ownerView]?.[0] || "istekler"}/${encode(value)}` : `/batur/${ownerViews[route.ownerView]?.[0] || "istekler"}`;
    case "ownerNewTeam": return value ? "/batur/ekipler/yeni" : "/batur/ekipler";
    case "ownerGiftId": return value ? `/batur/uyeler/${encode(value)}/hediye` : "/batur/ekipler";
    case "ownerRenameId": case "ownerAnnounceId": case "ownerVillageId": return value ? `/batur/ekipler/${encode(value)}/${({ ownerRenameId: "ad", ownerAnnounceId: "duyuru", ownerVillageId: "koy-duzeni" })[key]}` : "/batur/ekipler";
    default: return null;
  }
}
