// Fullscreen ("kiosk") state lives in the URL because the kiosk-mode plugin
// reads it once at load. Two ways the HA header gets hidden:
//   • ?kiosk=true            — explicit; the wall panel's URL. Hides header + sidebar.
//   • kiosk_mode.mobile_settings in the dashboard config — automatic on screens
//     ≤ PHONE_MAX_WIDTH, no query param. The plugin's ?disable_km opts out.
// So "toggle fullscreen" is not just flipping ?kiosk: on a phone, leaving
// fullscreen means adding disable_km, and entering it means removing that.

/** Must match kiosk_mode.mobile_settings.custom_width in scripts/hub-config.mjs. */
export const PHONE_MAX_WIDTH = 600;

/** Query string (without the leading "?") to load in order to flip fullscreen.
 *  `headerHidden` is the measured current state, `narrow` whether the viewport
 *  is within the plugin's mobile width. Unrelated params are preserved. */
export function nextKioskSearch(search: string, headerHidden: boolean, narrow: boolean): string {
  const params = new URLSearchParams(search);
  if (headerHidden) {
    params.delete('kiosk');
    if (narrow) params.set('disable_km', '');
  } else {
    params.delete('disable_km');
    if (!narrow) params.set('kiosk', 'true');
  }
  // URLSearchParams renders a valueless key as "disable_km=" — the plugin only
  // looks for the key, but keep the URL tidy.
  return params.toString().replace(/=(&|$)/g, '$1');
}
