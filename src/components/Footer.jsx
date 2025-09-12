// Footer.jsx - Enhanced with modern design and working filters
import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Youtube, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer({ 
  handleShortcutFilter,
  handleNewsletterSubmit, 
  newsletterEmail, 
  setNewsletterEmail 
}) {
  const categories = [
    'Fizik', 'Kimya', 'Biyoloji', 'Astronomi', 
    'Mühendislik', 'Jeoloji', 'Elektronik', 'Mekanik'
  ];

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' }
  ];

  const quickLinks = [
    { text: 'Hakkımızda', href: '#about' },
    { text: 'Sık Sorulanlar', href: '#faq' },
    { text: 'İletişim', href: '#contact' },
    { text: 'Gizlilik Politikası', href: '/privacy-policy', isRoute: true },
    { text: 'Kullanım Şartları', href: '/terms-of-service', isRoute: true }
  ];

  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  const handleCategoryClick = (category) => {
    if (handleShortcutFilter) {
      handleShortcutFilter(category.toLowerCase());
    }
  };

  return (
    <motion.footer 
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden"
      {...sectionAnimation}
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Section - Enhanced Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-3 mb-6">
              {/* Enhanced Logo */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Prizma Science
                </h3>
                <p className="text-xs text-gray-400 font-medium">Bilimle Büyüyen Nesiller</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Bilimin büyüleyici dünyasını keşfetmek için özenle seçilmiş ürünler. 
              Her yaştan meraklı zihin için tasarlandı.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 group"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="w-5 h-5 group-hover:text-white transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Science Categories - Enhanced with Working Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="font-bold text-lg mb-6 text-white">Bilim Dalları</h4>
            <ul className="space-y-3">
              {categories.map((cat, index) => (
                <motion.li key={cat} whileHover={{ x: 5 }}>
                  <button 
                    onClick={() => handleCategoryClick(cat)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group text-left w-full"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">{cat}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="font-bold text-lg mb-6 text-white">Hızlı Erişim</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.li key={index} whileHover={{ x: 5 }}>
                  {link.isRoute ? (
                    <Link 
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">{link.text}</span>
                    </Link>
                  ) : (
                    <a 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">{link.text}</span>
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Newsletter - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-bold text-lg mb-6 text-white">Bülten</h4>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Yeni ürünler, kampanyalar ve bilim dünyasından haberler için abone olun.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <motion.input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  whileFocus={{ scale: 1.02 }}
                />
              </div>
              <motion.button 
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowRight className="w-4 h-4" />
                Abone Ol
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Footer Bottom - Enhanced */}
        <motion.div 
          className="mt-12 pt-8 border-t border-gray-700/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Prizma Science. Tüm hakları saklıdır.
              </p>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Sistem Aktif</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <p className="text-gray-500 text-xs">
                Bilimle büyüyen, keşfederek öğrenen nesiller için tasarlandı
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}