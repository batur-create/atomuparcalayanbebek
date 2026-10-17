// Full screen for the focus screen; kept out of FocusScreen.jsx so the tap that
// opens it (in the app shell) does not need the lazily loaded screen.
/** Asks for full screen; call it from the tap that opens the focus screen. */
export function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el, { navigationUI: "hide" })?.catch?.(() => {});
  } catch {}
}
export function leaveFullscreen() {
  try {
    if (document.fullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
  } catch {}
}
