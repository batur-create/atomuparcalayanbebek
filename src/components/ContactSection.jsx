// ContactSection.jsx - Enhanced form with better UX

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Clock, MapPin, Send, User, MessageSquare } from 'lucide-react';

export default function ContactSection({ currentTheme, contactForm, setContactForm, handleContactSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    setIsSubmitting(true);
    try {
      await handleContactSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'E-posta',
      content: 'destek@prizmascience.com',
      action: 'mailto:destek@prizmascience.com'
    },
    {
      icon: Phone,
      title: 'Telefon',
      content: '+90 555 123 45 67',
      action: 'tel:+905551234567'
    },
    {
      icon: Clock,
      title: 'Çalışma Saatleri',
      content: 'Pazartesi - Cuma: 09:00 - 18:00'
    },
    {
      icon: MapPin,
      title: 'Adres',
      content: 'ODTÜ Teknokent, Ankara / Türkiye'
    }
  ];

  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  return (
    <motion.section 
      id="contact" 
      className="relative py-20 bg-gradient-to-br from-blue-50 to-purple-50"
      {...sectionAnimation}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4" style={{ color: currentTheme.primary }}>
              Bizimle İletişime Geçin
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sorularınız, önerileriniz veya destek talepleriniz için buradayız
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  whileHover={{ x: 5 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                       style={{ backgroundColor: currentTheme.primary + '20' }}>
                    <info.icon className="w-6 h-6" style={{ color: currentTheme.primary }} />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-800 mb-1">{info.title}</h4>
                    {info.action ? (
                      <a 
                        href={info.action}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-gray-600">{info.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Adınız *
                  </label>
                  <motion.input
                    type="text"
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:outline-none transition-all duration-200"
                    style={{ focusRingColor: currentTheme.primary + '40' }}
                    required
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta *
                  </label>
                  <motion.input
                    type="email"
                    id="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:outline-none transition-all duration-200"
                    style={{ focusRingColor: currentTheme.primary + '40' }}
                    required
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mesajınız *
                  </label>
                  <motion.textarea
                    id="message"
                    rows="5"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:outline-none transition-all duration-200 resize-none"
                    style={{ focusRingColor: currentTheme.primary + '40' }}
                    placeholder="Mesajınızı buraya yazın..."
                    required
                    whileFocus={{ scale: 1.01 }}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: currentTheme.primary }}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}