// AboutSection.jsx - Enhanced with modern design
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Package, Shield, Users, Lightbulb, Target, Heart, Star } from 'lucide-react';

export default function AboutSection({ currentTheme }) {
  const stats = [
    { number: '1000+', label: 'Mutlu Müşteri', icon: Users },
    { number: '500+', label: 'Farklı Ürün', icon: Package },
    { number: '50+', label: 'Bilim Dalı', icon: Lightbulb },
    { number: '5★', label: 'Müşteri Puanı', icon: Star }
  ];

  const features = [
    {
      icon: Award,
      title: 'Kalite Garantisi',
      description: 'Ürünlerimizin tamamı uluslararası standartlara uygun, dayanıklı ve güvenlidir.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Package,
      title: 'Hızlı Kargo',
      description: 'Siparişleriniz, en kısa sürede ve özenle paketlenerek kapınıza ulaştırılır.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Güvenli Alışveriş',
      description: 'Tüm ödeme ve kişisel bilgileriniz en üst düzey güvenlik önlemleriyle korunur.',
      color: 'from-green-400 to-emerald-500'
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
      id="about" 
      className="relative py-20 overflow-hidden"
      {...sectionAnimation}
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
      
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-lg mb-6">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">Hikayemiz</span>
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: currentTheme.primary }}>
              Bilimin Büyüsünü Keşfedin
            </h2>
            <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>
                <strong className="text-gray-800">Prizma Science</strong>, karmaşık görünen evrenin aslında ne kadar anlaşılır ve estetik bir düzene sahip olduğu fikrinden doğdu. Misyonumuz, bilimin büyüleyici dünyasını bir prizma gibi ele alıp, en temel ve en saf halini her yaştan meraklı zihin için bir keşif serüvenine dönüştürmektir.
              </p>
              <p>
                Bir mühendis adayı ve bilim tutkunu olarak, raflarımızdaki her bir ürünü bu felsefeyle seçiyoruz: <em>Her kit bir merak kıvılcımı, her oyuncak ise bir "eureka!" anı vaat etmeli.</em>
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: currentTheme.primary }} />
                <motion.div
                  className="text-3xl font-bold mb-1"
                  style={{ color: currentTheme.primary }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 100 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500"
                whileHover={{ y: -8 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}