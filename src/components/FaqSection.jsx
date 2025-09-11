// FaqSection.jsx - Enhanced with smooth animations

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FaqSection({ currentTheme, faqData, activeFaq, setActiveFaq }) {
  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  return (
    <motion.section 
      id="faq" 
      className="relative py-20 bg-gradient-to-b from-white to-gray-50"
      {...sectionAnimation}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-lg mb-6">
              <HelpCircle className="w-4 h-4" style={{ color: currentTheme.primary }} />
              <span className="text-sm font-medium text-gray-700">Sıkça Sorulanlar</span>
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: currentTheme.primary }}>
              Merak Ettikleriniz
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Size daha iyi hizmet verebilmek için sıkça sorulan soruları derledik
            </p>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.button
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50/50 transition-colors duration-200"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h3 className="font-semibold text-lg pr-4 text-gray-800">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: activeFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-6 h-6 text-gray-500" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="p-6 pt-4">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
