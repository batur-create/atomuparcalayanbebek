import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Clock, MapPin } from 'lucide-react';

export default function ContactSection({ currentTheme, contactForm, setContactForm, handleContactSubmit }) {
  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  return (
    <motion.section id="contact" className="container mx-auto px-4 py-16" {...sectionAnimation}>
      <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>İletişim</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="space-y-6"><div className="flex items-center gap-4"><Mail className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">E-posta</h4><p className="text-gray-600">destek@prizmascience.com</p></div></div><div className="flex items-center gap-4"><Phone className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Telefon</h4><p className="text-gray-600">+90 555 123 45 67</p></div></div><div className="flex items-center gap-4"><Clock className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Çalışma Saatleri</h4><p className="text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p></div></div><div className="flex items-center gap-4"><MapPin className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Adres</h4><p className="text-gray-600">ODTÜ Teknokent, Ankara / Türkiye</p></div></div></div>
            </div>
            <div>
              <form onSubmit={(e) => { e.preventDefault(); handleContactSubmit(); }} className="space-y-6"><div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Adınız</label><input type="text" id="name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required /></div><div><label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label><input type="email" id="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required /></div><div><label htmlFor="message" className="block text-sm font-medium text-gray-700">Mesajınız</label><textarea id="message" rows="4" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required ></textarea></div><button type="submit" className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90" style={{ backgroundColor: currentTheme.primary }}>Mesaj Gönder</button></form>
            </div>
          </div>
      </div>
    </motion.section>
  );
}