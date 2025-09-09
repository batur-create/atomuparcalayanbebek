import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Info } from 'lucide-react';

export default function Notification({ notificationData, currentTheme, onEnd }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onEnd();
    }, 3000); // 3 saniye sonra kaybol

    return () => clearTimeout(timer);
  }, [onEnd]);

  if (!notificationData) return null;

  // Gelen verinin bir ürün mü yoksa genel bir mesaj mı olduğunu kontrol et
  const isProduct = notificationData.hasOwnProperty('image');

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
        <span className="font-bold">{isProduct ? 'Sepete Eklendi!' : notificationData.title}</span>
        <span className="text-gray-600">{isProduct ? notificationData.name : notificationData.message}</span>
      </div>
      {isProduct && (
        <img src={notificationData.image} alt={notificationData.name} className="w-10 h-10 rounded-full object-cover ml-2" />
      )}
    </motion.div>
  );
}