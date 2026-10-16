// Picks the page's look before the first paint, so an evening visit never
// flashes a white page. Same rule as darkAt() in src/villageWorld.js: "auto"
// turns dark at sunset in Ankara and light again at sunrise.
(function () {
  var mode = null,
    theme = null,
    motion = null;
  try {
    mode = localStorage.getItem("kutup-mode");
    theme = localStorage.getItem("kutup-theme");
    motion = localStorage.getItem("kutup-motion");
  } catch (e) {}
  // How much the page moves, when picked (src/motionPref.js); unset follows the phone.
  if (motion === "full" || motion === "calm" || motion === "still") document.documentElement.setAttribute("data-motion", motion);
  var dark = mode === "dark";
  if (mode !== "dark" && mode !== "light") {
    var local = new Date(Date.now() + 3 * 3600000);
    var hour = local.getUTCHours() + local.getUTCMinutes() / 60;
    var day = (local.getTime() - Date.UTC(local.getUTCFullYear(), 0, 0)) / 86400000;
    var length = 12 + 2.9 * Math.sin((2 * Math.PI * (day - 80)) / 365);
    dark = hour < 12.8 - length / 2 || hour >= 12.8 + length / 2;
  }
  // The page color of each theme, light and dark (--canvas in src/themes.css);
  // themes that were merged into a package move to it (THEME_MOVED in src/api.js).
  var canvas = {
    lilac: ["#f6f5f0", "#181916"],
    navy: ["#edf2f8", "#12171e"],
    teal: ["#ebf4f4", "#10191a"],
    clay: ["#f8f0e7", "#1c150f"],
    pink: ["#f9f1f4", "#1c1416"],
    graphite: ["#f1f2f4", "#151618"],
  };
  var moved = { mint: "teal", blue: "navy", peach: "clay", amber: "clay" };
  if (moved[theme]) theme = moved[theme];
  if (!canvas[theme]) theme = null;
  var root = document.documentElement;
  root.setAttribute("data-mode", dark ? "dark" : "light");
  if (theme) root.setAttribute("data-theme", theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", canvas[theme || "lilac"][dark ? 1 : 0]);
})();
