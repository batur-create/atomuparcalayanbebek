import test from "node:test";
import assert from "node:assert/strict";
import { ROUTES, TAB_PATHS, legacyUrl, modalUrl, readRoute, stateUrl } from "../src/routes.js";

test("every screen has a unique, reloadable URL and a breadcrumb parent", () => {
  const seen = new Set();
  for (const entry of ROUTES) {
    assert.ok(!seen.has(entry.path), entry.path); seen.add(entry.path);
    const href = entry.path.replace(/:([a-z]+)/g, (_, name) => encodeURIComponent(name === "room" ? "Adnan Ötüken Okuma Salonu" : `${name}-test`));
    const r = readRoute(href);
    assert.ok(r.found, href);
    assert.equal(r.crumbs.at(-1).href, r.path);
    assert.equal(new Set(r.crumbs.map(c => c.href)).size, r.crumbs.length, href);
    for (const crumb of r.crumbs) assert.ok(readRoute(crumb.href).found, `${href}: ${crumb.href}`);
    assert.equal(readRoute(r.path).path, r.path);
    if (r.ownerPage) assert.ok(r.path.startsWith("/batur"));
  }
  for (const [tab, href] of Object.entries(TAB_PATHS)) assert.equal(readRoute(href).tab, tab);
});

test("legacy notification, plan, invitation and account links keep their targets", () => {
  assert.equal(legacyUrl("/?tab=focus&as=member-2"), "/koy?as=member-2");
  assert.equal(legacyUrl("/?tab=plans"), "/bulusmalar");
  assert.equal(legacyUrl("/?story=1"), "/haftanin-hikayesi");
  assert.equal(legacyUrl("/?action=here"), "/durum");
  assert.equal(legacyUrl("/?imece=1"), "/koy/imece");
  assert.equal(legacyUrl("/?plan=a%2Fb&as=other"), "/bulusmalar/a%2Fb?as=other");
  assert.equal(legacyUrl("/?tab=focus&join=friend"), "/koy?join=friend");
  assert.equal(legacyUrl("/join/secret-invite?as=other"), "/join/secret-invite?as=other");
  assert.equal(readRoute("/batur/ekipler").ownerPage, true);
  assert.equal(readRoute("/batur-elsewhere").ownerPage, undefined);
});

test("detail IDs are encoded as one path component, never commands or state changes", () => {
  const id = "<şöyle>/other?secret=x#hash";
  assert.equal(readRoute(modalUrl({ plan: id })).modal.plan, id);
  assert.equal(readRoute(modalUrl({ member: { id } })).memberId, id);
  assert.equal(readRoute(modalUrl({ map: "Dr. Müjgan Cunbur Okuma Salonu" })).room, "Dr. Müjgan Cunbur Okuma Salonu");
  assert.equal(readRoute("/%E0%A4%A").found, false);
  assert.equal(readRoute("/nothing/there").found, false);
  assert.equal(readRoute("/koy/katalog/cuzdan").catalogView, "wallet");
  assert.equal(readRoute("/koy/katalog/koleksiyon").catalogView, "collection");
  assert.equal(readRoute("/bulusmalar/yeni").modal, "plan");
  assert.equal(readRoute("/koy/katalog/ev").catalogModel, "ev");
});

test("closing and switching screens drops other screen state but preserves a fullscreen selection", () => {
  const profile = readRoute("/ben/profil");
  assert.equal(stateUrl("modal", null, profile), "/ben");
  const map = readRoute("/koy/harita?yapi=home-1");
  assert.equal(map.villagePicked, "home-1");
  assert.equal(stateUrl("villagePicked", "home-2", map), "/koy/harita?yapi=home-2");
  assert.equal(stateUrl("villageFull", false, map), "/koy/yapilar/home-1");
  assert.equal(stateUrl("tab", "board", map), "/pano");
  assert.equal(readRoute(stateUrl("tab", "board", map)).villagePicked, null);
  assert.equal(stateUrl("ownerOpenId", "request-1", readRoute("/batur/yapi-istekleri")), "/batur/yapi-istekleri/request-1");
  assert.equal(stateUrl("helpTopic", null, readRoute("/yardim/focus/bina")), "/yardim/focus?kaynak=focus");
  const help = readRoute("/yardim/focus/bina?kaynak=me");
  assert.equal(stateUrl("help", null, help), "/ben");
  assert.equal(stateUrl("helpAt", "home", help), "/yardim/home?kaynak=me");
  const teamFromMe = readRoute(stateUrl("modal", "team", readRoute("/ben")));
  assert.equal(teamFromMe.modal, "team");
  assert.equal(teamFromMe.tab, "me");
  assert.equal(stateUrl("modal", null, teamFromMe), "/ben");
  assert.equal(stateUrl("story", false, readRoute("/haftanin-hikayesi/123?kaynak=me")), "/ben");
});
