// src/components/LoadingSpinner.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ message = "Yükleniyor..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className="relative w-16 h-16 mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"></div>
      </motion.div>
      
      <motion.p 
        className="text-gray-600 font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
}