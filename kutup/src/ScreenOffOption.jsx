import React, {useId} from "react";
import {BUILD_LEAVE} from "../shared/catalog.js";
import "./screenOffOption.css";

// The same choice in personal construction, a friend's session and İmece.
// Keep each flow's saved defaults and server flags; only the presentation is shared.
export function ScreenOffOption({relaxed,onChange,mission=false,studio=false,disabled=false}){
  const hint=useId();
  return <div className={`screen-off-option${studio?" studio":""}`}>
    <label><b>Ekranı kapatarak çalış</b><input type="checkbox" role="switch" checked={relaxed} disabled={disabled} aria-describedby={hint} onChange={e=>onChange(e.target.checked)}/></label>
    <p id={hint}>{relaxed
      ? "Ekranı kilitleyebilir veya başka uygulamaya geçebilirsin. Yarım maaş."
      : mission?"Seansın tamamını Kütüp açıkken tamamla. Yarım maaş."
      : `Kütüp açık kalsın. Çıkarsan ${BUILD_LEAVE/1000} sn içinde dön; yoksa bina çatlar. Tam maaş.`}</p>
  </div>;
}
