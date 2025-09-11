import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Heart, Zap, Eye, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, themes, currentTheme, handleProductClick, toggleLike, likedProducts }) {
  const { addToCart, buyNow } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleQuickView = (e) => {
    e.stopPropagation();
    // Quick view modal açılabilir - şimdilik product detail'e yönlendiriyoruz
    handleProductClick(product);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/50 flex flex-col cursor-pointer"
      onClick={() => handleProductClick(product)}
    >
      {/* Modern glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Image container with advanced effects */}
      <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}
        
        <motion.img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
          }}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Badge with enhanced styling */}
        {product.badge && (
          <motion.span 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full shadow-lg backdrop-blur-sm"
            style={{ 
              background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.secondary}dd)`,
              boxShadow: `0 4px 12px ${currentTheme.secondary}40`
            }}
          >
            {product.badge}
          </motion.span>
        )}
        
        {/* Enhanced action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button 
            onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
            aria-label="Favorilere ekle"
          >
            <Heart className={`w-5 h-5 transition-all duration-300 ${
              likedProducts.has(product.id) 
                ? 'fill-red-500 text-red-500 scale-110' 
                : 'text-gray-600 hover:text-red-400'
            }`}/>
          </motion.button>
          
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleQuickView}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                aria-label="Hızlı görüntüle"
              >
                <Eye className="w-5 h-5 text-gray-600 hover:text-blue-600" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Hover overlay with gradient */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      </div>

      {/* Content with enhanced spacing and typography */}
      <div className="p-5 flex flex-col flex-grow relative z-10">
        <motion.h3 
          className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300" 
          style={{ color: currentTheme.primary }}
        >
          {product.name}
        </motion.h3>
        
        {/* Enhanced tags with better styling */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
            {product.category}
          </span>
          <span className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
            {product.ageGroup} yaş
          </span>
          {product.tags?.slice(0, 2).map(tag => (
            <motion.span 
              key={tag} 
              whileHover={{ scale: 1.05 }}
              className="text-xs px-3 py-1 text-white rounded-full font-medium shadow-sm"
              style={{ 
                backgroundColor: themes[tag]?.primary || currentTheme.primary,
                boxShadow: `0 2px 8px ${(themes[tag]?.primary || currentTheme.primary)}40`
              }}
            >
              {tag}
            </motion.span>
          ))}
          {product.tags?.length > 2 && (
            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-500 rounded-full">
              +{product.tags.length - 2}
            </span>
          )}
        </div>
        
        {/* Enhanced rating with better visual */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 transition-colors ${
                  i < Math.floor(product.rating) 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-800">{product.rating}</span>
          <span className="text-sm text-gray-500">({product.reviews})</span>
        </div>
        
        {/* Spacer for consistent card heights */}
        <div className="flex-grow" />
        
        {/* Enhanced pricing section */}
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-3 mb-4">
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
            >
              ₺{product.price.toFixed(2)}
            </motion.span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₺{product.originalPrice.toFixed(2)}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                %{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} İndirim
              </span>
            )}
          </div>
          
          {/* Enhanced action buttons */}
          <div className="flex gap-2">
            <motion.button 
              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 px-3 rounded-xl text-white font-semibold transition-all duration-300 text-sm flex items-center justify-center shadow-md hover:shadow-lg group"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}dd)`,
                boxShadow: `0 4px 12px ${currentTheme.primary}30`
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Sepete Ekle
            </motion.button>
            
            <motion.button 
              onClick={(e) => { e.stopPropagation(); buyNow(product); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold border-2 transition-all duration-300 text-sm flex items-center justify-center group hover:bg-gray-50"
              style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
            >
              <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Hemen Al
            </motion.button>
          </div>
        </div>
      </div>

      {/* Subtle shine effect on hover */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.6s ease-in-out'
        }}
      />
    </motion.div>
  );
}