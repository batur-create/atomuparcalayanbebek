import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer({ 
  handleShortcutFilter,
  handleNewsletterSubmit, 
  newsletterEmail, 
  setNewsletterEmail 
}) {

  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };
  
  // Ürünler bölümündeki tüm etiketleri
  const categories = ['Fizik', 'Kimya', 'Biyoloji', 'Astronomi', 'Mühendislik', 'Jeoloji', 'Elektronik', 'Mekanik'];

  return (
    <motion.footer className="bg-slate-900 text-white py-12" {...sectionAnimation}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marka + sosyal */}
          <div>
            <h3 className="text-xl font-bold mb-4">Prizma Science</h3>
            <p className="text-gray-400 mb-4">Bilim temalı oyuncak ve kitler.</p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors"><Instagram /></a>
              <a href="https://twitter.com"   target="_blank" rel="noopener noreferrer" aria-label="Twitter"   className="text-gray-400 hover:text-white transition-colors"><Twitter /></a>
              <a href="https://facebook.com"  target="_blank" rel="noopener noreferrer" aria-label="Facebook"  className="text-gray-400 hover:text-white transition-colors"><Facebook /></a>
              <a href="https://youtube.com"   target="_blank" rel="noopener noreferrer" aria-label="YouTube"   className="text-gray-400 hover:text-white transition-colors"><Youtube /></a>
            </div>
          </div>

          {/* Bilim dalları → filtre + hash */}
          <div>
            <h4 className="font-bold text-lg mb-4">Bilim Dalları</h4>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat}>
                  <a 
                    href="#products"
                    onClick={() => handleShortcutFilter(cat.toLowerCase())}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hızlı erişim */}
          <div>
            <h4 className="font-bold text-lg mb-4">Hızlı Erişim</h4>
            <ul className="space-y-2">
              <li><a href="#about"   className="text-gray-400 hover:text-white transition-colors">Hakkımızda</a></li>
              <li><a href="#faq"     className="text-gray-400 hover:text-white transition-colors">Sık Sorulanlar</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li>
              <li><Link to="/privacy-policy"   className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</Link></li>
              <li><Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Kullanım Şartları</Link></li>
            </ul>
          </div>

          {/* Bülten */}
          <div>
            <h4 className="font-bold text-lg mb-4">Bülten</h4>
            <p className="text-gray-400 mb-3">Yeni ürün ve kampanyalardan haberdar olun.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="px-3 py-2 rounded-md text-black flex-1"
                required
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                Kaydol
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-gray-400 text-sm text-center">
          © {new Date().getFullYear()} Prizma Science. Tüm hakları saklıdır.
        </div>
      </div>
    </motion.footer>
  );
}
