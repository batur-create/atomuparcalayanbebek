import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistem Ayarları</h1>
            <p className="text-gray-600 mt-2">Uygulama ayarlarını düzenleyin</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Ayarları Kaydet
          </motion.button>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sistem Ayarları</h2>
          <p className="text-gray-600">Bu sayfa yakında tamamlanacak</p>
        </motion.div>
      </div>
    </div>
  );
}