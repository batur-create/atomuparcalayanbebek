// Screens that most visits never open load on demand (n29): the owner panel,
// the focus screen, the village map, the statistics, the week's story and the
// desk map. Each wrapper keeps the component's name and props, so call sites
// read as before. Once the app has painted and the phone is idle, they are
// fetched quietly in the background, so a tab switch later is as instant as
// before (not the owner panel).
import React, { Suspense, lazy } from "react";
import { Loading } from "./Illustrations.jsx";

const loaders = [];
function later(load, name, fallback = null, { prefetch = true } = {}) {
  if (prefetch) loaders.push(load);
  const Screen = lazy(() => load().then((m) => ({ default: m[name] })));
  const Later = (props) => (
    <Suspense fallback={fallback}>
      <Screen {...props} />
    </Suspense>
  );
  Later.displayName = name;
  return Later;
}

// Only the owner opens /batur, so friends' phones never fetch it.
export const OwnerPage = later(() => import("./Owner.jsx"), "OwnerPage", <Loading big />, { prefetch: false });
export const FocusScreen = later(() => import("./FocusScreen.jsx"), "FocusScreen");
export const VillagePanel = later(() => import("./VillageMap.jsx"), "VillagePanel", <Loading text="Köy kuruluyor…" />);
export const MemberStats = later(() => import("./Stats.jsx"), "MemberStats");
export const WeekStory = later(() => import("./Story.jsx"), "WeekStory");
export const DeskMap = later(() => import("./DeskMap.jsx"), "DeskMap");

/** Fetches every on-demand screen once the first paint is done and the phone is idle. */
export function prefetchScreens() {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => loaders.forEach((load) => load().catch(() => {})), { timeout: 4000 });
}
