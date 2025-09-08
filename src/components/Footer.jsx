import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';

export default function Footer({ handleFilterChange }) {
  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };
  return (
    <motion.footer className="bg-slate-900 text-white py-12" {...sectionAnimation}>
      <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div><h3 className="text-xl font-bold mb-4">Prizma Science</h3><p className="text-gray-400 text-sm">Eğlenerek öğrenmenin, bilimle büyümenin adresi.</p><div className="flex gap-4 mt-4"><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube"><Youtube className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a></div></div>
              <div><h4 className="font-bold text-lg mb-4">Kategoriler</h4><ul className="space-y-2">{['Fizik', 'Kimya', 'Biyoloji', 'Astronomi', 'Deney Setleri', 'Eğitici Oyuncaklar'].map(cat => (<li key={cat}><a href="#products" onClick={() => handleFilterChange('science', cat.toLowerCase().split(' ')[0])} className="text-gray-400 hover:text-white transition-colors">{cat}</a></li>))}</ul></div>
              <div><h4 className="font-bold text-lg mb-4">Hızlı Bağlantılar</h4><ul className="space-y-2"><li><a href="#about" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</a></li><li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">Sıkça Sorulan Sorular</a></li><li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li><li><a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</a></li><li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kullanım Koşulları</a></li></ul></div>
              <div><h4 className="font-bold text-lg mb-4">Bülten</h4><p className="text-gray-400 text-sm mb-4">Yeni ürünlerimizden ve kampanyalardan haberdar olmak için e-posta bültenimize kaydolun.</p><form onSubmit={(e) => e.preventDefault()} className="flex"><input type="email" placeholder="E-posta adresiniz" className="px-4 py-2 rounded-l-lg text-slate-900 focus:outline-none w-full" /><button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-r-lg font-bold hover:bg-purple-700 transition-colors">Abone Ol</button></form></div>
          </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500"><p>&copy; 2025 Prizma Science. Tüm hakları saklıdır.</p></div>
    </motion.footer>
  );
}