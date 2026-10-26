import React from "react";
import { RouteLink } from "./Navigation.jsx";

// An unavailable split screen should not take down the active session, live
// connection, village state or the rest of the application.
export class ScreenBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="screen-recovery" role="alert">
      <h2>Bu ekran açılamadı.</h2>
      <p>Bağlantını kontrol edip tekrar deneyebilirsin. Çalışman uygulamada devam ediyor.</p>
      <div className="screen-recovery-actions">
        <button type="button" className="btn primary" onClick={() => { this.props.retry(); this.setState({ failed: false }); }}>Tekrar dene</button>
        <RouteLink className="btn outline" href="/">Kütüp’e dön</RouteLink>
      </div>
    </section>;
  }
}
