import React from 'react';
import { motion } from 'framer-motion';
import { Award, Package, Shield } from 'lucide-react';

export default function AboutSection({ currentTheme }) {
  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  return (
    <motion.section id="about" className="container mx-auto px-4 py-16" {...sectionAnimation}>
      <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: currentTheme.primary }}>Hakkımızda</h2>
          <p className="text-lg text-gray-600 mb-12">
            Prizma Science, karmaşık görünen evrenin aslında ne kadar anlaşılır ve estetik bir düzene sahip olduğu fikrinden doğdu. Misyonumuz, bilimin büyüleyici dünyasını bir prizma gibi ele alıp, en temel ve en saf halini her yaştan meraklı zihin için bir keşif serüvenine dönüştürmektir. Bir mühendis adayı ve bilim tutkunu olarak, raflarımızdaki her bir ürünü bu felsefeyle seçiyoruz: Her kit bir merak kıvılcımı, her oyuncak ise bir "eureka!" anı vaat etmeli.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300"><Award className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} /><h3 className="font-bold text-xl mb-2">Kalite Garantisi</h3><p className="text-gray-600 text-sm">Ürünlerimizin tamamı uluslararası standartlara uygun, dayanıklı ve güvenlidir.</p></div>
            <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300"><Package className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} /><h3 className="font-bold text-xl mb-2">Hızlı Kargo</h3><p className="text-gray-600 text-sm">Siparişleriniz, en kısa sürede ve özenle paketlenerek kapınıza ulaştırılır.</p></div>
            <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300"><Shield className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} /><h3 className="font-bold text-xl mb-2">Güvenli Alışveriş</h3><p className="text-gray-600 text-sm">Tüm ödeme ve kişisel bilgileriniz en üst düzey güvenlik önlemleriyle korunur.</p></div>
          </div>
      </div>
    </motion.section>
  );
}