import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function Notification({ product, currentTheme, onEnd }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onEnd();
    }, 3000); // 3 saniye sonra kaybol

    return () => clearTimeout(timer);
  }, [onEnd]);

  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 50, x: "-50%" }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-800 p-4 pl-6 pr-8 rounded-full shadow-lg flex items-center gap-4 z-[9999]"
      style={{ border: `2px solid ${currentTheme.primary}` }}
    >
      <CheckCircle className="w-6 h-6 text-green-500" />
      <div className="flex flex-col text-sm">
        <span className="font-bold">Sepete Eklendi!</span>
        <span className="text-gray-600">{product.name}</span>
      </div>
      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-full object-cover ml-2" />
    </motion.div>
  );
}