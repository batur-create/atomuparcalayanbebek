// Gelişmiş Scroll Yöneticisi: hash (#anchor) + geri (POP) desteği
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Route anahtarına göre scroll konumlarını saklarız
const positions = new Map();

export default function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  // Her scroll'da mevcut sayfanın konumunu kaydet
  useEffect(() => {
    const onScroll = () => {
      positions.set(location.key, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.key]);

  // Route değişimini yönet
  useEffect(() => {
    // Geri/ileri (POP) ise, kaydedilmiş konuma dön
    if (navType === 'POP') {
      const y = positions.get(location.key) ?? 0;
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
      return;
    }

    // Hash (#products gibi) varsa o elemana kaydır, yoksa en üste
    const scrollToHashOrTop = () => {
      if (location.hash) {
        const id = location.hash.slice(1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    // DOM render’ının bitmesini beklemek için bir frame erteliyoruz
    requestAnimationFrame(scrollToHashOrTop);
  }, [location.pathname, location.hash, location.key, navType]);

  return null;
}
