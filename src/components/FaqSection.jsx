import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqSection({ currentTheme, faqData, activeFaq, setActiveFaq }) {
  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  return (
    <motion.section id="faq" className="container mx-auto px-4 py-16" {...sectionAnimation}>
      <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="border border-gray-200 bg-white rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-sm" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{faq.question}</h3>
                  {activeFaq === index ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                </div>
                {activeFaq === index && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-gray-600">{faq.answer}</motion.p>}
              </div>
            ))}
          </div>
      </div>
    </motion.section>
  );
}