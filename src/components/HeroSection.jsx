import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, TestTube, Dna, Rocket, ArrowDown, Play, Star } from 'lucide-react';

export default function HeroSection({ currentTheme }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();
  
  // Mouse tracking for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const backgroundX = useTransform(mouseX, [-300, 300], [-10, 10]);
  const backgroundY = useTransform(mouseY, [-300, 300], [-10, 10]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (clientY - innerHeight / 2) / (innerHeight / 2);
      
      setMousePosition({ x: clientX, y: clientY });
      mouseX.set(x * 100);
      mouseY.set(y * 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Auto-playing animation sequence
  useEffect(() => {
    const animateSequence = async () => {
      await controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 1, ease: "easeOut" }
      });
    };
    animateSequence();
  }, [controls]);

  const handleScrollToProducts = () => {
    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Floating science icons data
  const scienceIcons = [
    { Icon: Sparkles, delay: 0, color: '#3498db' },
    { Icon: TestTube, delay: 0.2, color: '#27ae60' },
    { Icon: Dna, delay: 0.4, color: '#8e44ad' },
    { Icon: Rocket, delay: 0.6, color: '#1abc9c' },
  ];

  return (
    <motion.section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background elements */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{ x: backgroundX, y: backgroundY }}
      >
        {/* Geometric background patterns */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </motion.div>

      {/* Floating science icons */}
      <div className="absolute inset-0 pointer-events-none">
        {scienceIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: 8,
              delay: item.delay,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
            style={{
              left: `${20 + index * 20}%`,
              top: `${20 + index * 15}%`,
            }}
          >
            <item.Icon className="w-8 h-8" style={{ color: item.color }} />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 pt-32 pb-16 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          
          {/* Badge with animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-lg mb-6"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-700">Türkiye'nin En Sevilen Bilim Mağazası</span>
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          </motion.div>

          {/* Main headline with enhanced typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Bilimi Keşfet,
            </span>
            <br />
            <motion.span 
              className="text-gray-800"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Eğlenerek Öğren
            </motion.span>
          </motion.h1>

          {/* Enhanced subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Çocuklar ve yetişkinler için özenle seçilmiş bilim ürünleri. 
            <span className="text-blue-600 font-semibold"> Oyunla öğrenmenin</span>, 
            <span className="text-purple-600 font-semibold"> merakla büyümenin</span> adresi.
          </motion.p>

          {/* Enhanced action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-4 justify-center flex-wrap mb-12"
          >
            <motion.button
              onClick={handleScrollToProducts}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Ürünleri Keşfet
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </motion.button>
            
            <motion.button
              onClick={handleScrollToAbout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-blue-600 text-blue-600 font-semibold rounded-full shadow-lg transition-all duration-300 hover:bg-blue-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Hikayemizi İzle
            </motion.button>
          </motion.div>

          {/* Statistics section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16"
          >
            {[
              { number: '1000+', label: 'Mutlu Çocuk' },
              { number: '500+', label: 'Bilim Ürünü' },
              { number: '50+', label: 'Farklı Kategori' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 100 }}
                  className="text-2xl md:text-3xl font-bold text-blue-600 mb-1"
                >
                  {stat.number}
                </motion.div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Interactive science icons with enhanced animations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex justify-center gap-12 flex-wrap"
          >
            {scienceIcons.map((item, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 10, 
                  delay: 1.4 + index * 0.1 
                }}
                whileHover={{ 
                  scale: 1.2, 
                  rotate: 10,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 cursor-pointer group"
              >
                <item.Icon 
                  className="w-12 h-12 group-hover:drop-shadow-lg transition-all duration-300" 
                  style={{ color: item.color }} 
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-gray-400"
            >
              <span className="text-sm font-medium">Keşfetmeye Başla</span>
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Interactive cursor follower */}
      {isHovered && (
        <motion.div
          className="fixed pointer-events-none z-50 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-sm"
          style={{
            left: mousePosition.x - 16,
            top: mousePosition.y - 16,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        />
      )}
    </motion.section>
  );
}