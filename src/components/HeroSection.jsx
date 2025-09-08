import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TestTube, Dna, Rocket } from 'lucide-react';

export default function HeroSection({ currentTheme }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, delay: 0.2 }}
      className="container mx-auto px-4 pt-32 pb-16 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl md:text-5xl font-bold mb-6" style={{ color: currentTheme.primary }}
        >
          Bilimi Keşfet, Eğlenerek Öğren
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg mb-8 text-gray-600"
        >
          Çocuklar ve yetişkinler için özenle seçilmiş bilim ürünleri. Oyunla öğrenmenin, merakla büyümenin adresi.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <button onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 rounded-full text-white font-semibold transition-all transform hover:scale-105" style={{ backgroundColor: currentTheme.primary }}>Ürünleri Keşfet</button>
          <button onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 rounded-full border-2 font-semibold transition-all hover:bg-gray-50" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>Hikayemiz</button>
        </motion.div>
      </div>
      <div className="mt-12 flex justify-center gap-8 flex-wrap">
          {currentTheme.animation === 'wave' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><Sparkles className="w-12 h-12" style={{ color: currentTheme.secondary }} /></motion.div>}
          {currentTheme.animation === 'bubble' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><TestTube className="w-12 h-12" style={{ color: currentTheme.accent }} /></motion.div>}
          {currentTheme.animation === 'grow' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><Dna className="w-12 h-12" style={{ color: currentTheme.accent }} /></motion.div>}
          {currentTheme.animation === 'twinkle' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><Rocket className="w-12 h-12" style={{ color: currentTheme.secondary }} /></motion.div>}
      </div>
    </motion.section>
  );
}