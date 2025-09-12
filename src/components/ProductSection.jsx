import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Atom, Microscope, Dna, Rocket, TestTube, Cog, Landmark, Cpu, Eye, Magnet, Leaf, Bug, Wrench, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useDebounceValue } from '../hooks/useDebounce';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

// Icon mapping for better performance
const CATEGORY_ICONS = {
  fizik: Atom,
  kimya: TestTube,
  biyoloji: Microscope,
  astronomi: Rocket,
  mühendislik: Wrench,
  jeoloji: Landmark,
  elektronik: Cpu,
  mekanik: Cog,
  optik: Eye,
  genetik: Dna,
  manyetizma: Magnet,
  zooloji: Bug,
  doğa: Leaf
};

// Filter configuration
const FILTER_CONFIG = {
  category: {
    label: 'Kategori',
    options: ['oyuncak', 'deney', 'eğitici', 'dekoratif']
  },
  ageGroup: {
    label: 'Yaş',
    options: ['3-6', '7-12', '13+']
  },
  tags: {
    label: 'Bilim Dalları',
    options: ['fizik', 'kimya', 'biyoloji', 'astronomi', 'mühendislik', 'jeoloji', 'elektronik', 'mekanik', 'optik', 'genetik', 'manyetizma', 'zooloji', 'doğa']
  }
};

// Clean search input component
const SearchInput = React.memo(({ searchTerm, setSearchTerm, clearSearch, currentTheme }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Debounce local input to reduce API calls
  const debouncedSearchTerm = useDebounceValue(localSearchTerm, 300);
  
  // Update parent when debounced value changes
  React.useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  // Sync local state with parent
  React.useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleClear = useCallback(() => {
    setLocalSearchTerm('');
    clearSearch();
  }, [clearSearch]);

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
        <motion.input
          id="product-search"
          type="text"
          placeholder="Ürün adı, açıklama veya etiket ara..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg"
          whileFocus={{ scale: 1.02 }}
        />
        {localSearchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
      </div>
      
      {/* Search info */}
      {localSearchTerm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-2"
        >
          <span className="text-sm text-gray-500">
            🔍 "{localSearchTerm}" araması yapılıyor...
          </span>
        </motion.div>
      )}
    </div>
  );
});

// Filter button component
const FilterButton = React.memo(({ 
  type, 
  value, 
  isActive, 
  onClick, 
  theme, 
  icon: Icon, 
  label 
}) => (
  <motion.button
    onClick={() => onClick(type, value)}
    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm border ${
      isActive
        ? 'text-white shadow-lg transform scale-105'
        : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border-gray-200'
    }`}
    style={{
      backgroundColor: isActive ? (theme?.primary || '#3b82f6') : undefined,
      borderColor: isActive ? (theme?.primary || '#3b82f6') : undefined
    }}
    whileHover={{ scale: isActive ? 1.05 : 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {label}
  </motion.button>
));

// Mobile filter modal
const FilterModal = React.memo(({ 
  isOpen, 
  onClose, 
  activeFilters, 
  handleFilterChange, 
  clearOnlyFilters, 
  themes, 
  currentTheme 
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Filtreler</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {Object.entries(FILTER_CONFIG).map(([filterType, config]) => (
            <div key={filterType} className="mb-6">
              <h4 className="font-semibold mb-3">{config.label}</h4>
              <div className="flex flex-wrap gap-2">
                {config.options.map(option => {
                  const isActive = activeFilters[filterType].includes(
                    filterType === 'ageGroup' ? option : option.toLowerCase()
                  );
                  const Icon = CATEGORY_ICONS[option];
                  const theme = filterType === 'tags' ? themes[option] : null;

                  return (
                    <FilterButton
                      key={option}
                      type={filterType}
                      value={option}
                      isActive={isActive}
                      onClick={handleFilterChange}
                      theme={theme || currentTheme}
                      icon={Icon}
                      label={option.charAt(0).toUpperCase() + option.slice(1)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={clearOnlyFilters}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Filtreleri Temizle
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Uygula
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default function ProductSection(props) {
  const {
    products,           // Already filtered products from App.jsx (search + filter applied)
    allProducts,        // All products for stats
    themes,
    currentTheme,
    searchTerm,
    setSearchTerm,
    clearSearch,
    activeFilters,
    handleFilterChange,
    clearOnlyFilters,
    clearFilters,
    handleProductClick,
    toggleLike,
    likedProducts,
    isLoading,
    searchStats
  } = props;

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  // FOOTER SHORTCUT FILTER INTEGRATION - MINIMAL ADDITION
  useEffect(() => {
    const handleShortcutFilter = (event) => {
      const { category } = event.detail;
      
      // Clear existing filters first
      clearOnlyFilters();
      
      // Apply category filter with delay
      setTimeout(() => {
        handleFilterChange('tags', category);
      }, 100);
    };

    window.addEventListener('shortcutFilter', handleShortcutFilter);
    
    return () => {
      window.removeEventListener('shortcutFilter', handleShortcutFilter);
    };
  }, [clearOnlyFilters, handleFilterChange]);

  // Only sorting - no filtering (filtering done in App.jsx)
  const sortedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    let sorted = [...products];
    
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      default:
        // Keep original order
        break;
    }
    
    return sorted;
  }, [products, sortBy]);

  // Filter count for UI
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);
  }, [activeFilters]);

  const hasActiveItems = (searchTerm && searchTerm.trim()) || activeFilterCount > 0;

  return (
    <section id="products" className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: currentTheme.primary }}>
            Ürünlerimiz
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bilimin büyüleyici dünyasını keşfetmek için özenle seçilmiş ürünler
          </p>
        </div>

        {/* Search Input */}
        <SearchInput 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          clearSearch={clearSearch}
          currentTheme={currentTheme}
        />

        {/* Filter Controls */}
        <div className="mb-8">
          {/* Desktop Filters */}
          <div className="hidden lg:block space-y-6">
            {Object.entries(FILTER_CONFIG).map(([filterType, config]) => (
              <div key={filterType} className="flex flex-wrap gap-3 justify-center items-center">
                <span className="text-sm font-semibold text-gray-600 mr-2">
                  {config.label}:
                </span>
                {config.options.map(option => {
                  const isActive = activeFilters[filterType].includes(
                    filterType === 'ageGroup' ? option : option.toLowerCase()
                  );
                  const Icon = CATEGORY_ICONS[option];
                  const theme = filterType === 'tags' ? themes[option] : null;

                  return (
                    <FilterButton
                      key={option}
                      type={filterType}
                      value={option}
                      isActive={isActive}
                      onClick={handleFilterChange}
                      theme={theme || currentTheme}
                      icon={Icon}
                      label={
                        filterType === 'ageGroup' 
                          ? `${option} Yaş`
                          : option.charAt(0).toUpperCase() + option.slice(1)
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden flex items-center justify-between">
            <motion.button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-md border border-gray-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Filtreler</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-medium"
            >
              <option value="default">Sıralama</option>
              <option value="price-low">Fiyat (Düşük-Yüksek)</option>
              <option value="price-high">Fiyat (Yüksek-Düşük)</option>
              <option value="rating">En Çok Beğenilen</option>
              <option value="name">A-Z</option>
            </select>
          </div>

          {/* Clear Actions */}
          {hasActiveItems && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-4 space-x-4"
            >
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="text-sm text-gray-600 hover:text-gray-900 underline inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Aramayı Temizle
                </button>
              )}
              
              {activeFilterCount > 0 && (
                <button
                  onClick={clearOnlyFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 underline inline-flex items-center gap-1"
                >
                  <Filter className="w-4 h-4" />
                  Filtreleri Temizle ({activeFilterCount})
                </button>
              )}
              
              {searchTerm && activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-900 underline inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Tümünü Temizle
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
          <div>
            {isLoading ? (
              'Yükleniyor...'
            ) : (
              <span>
                {sortedProducts.length} ürün listelendi
                {searchStats && (
                  <> 
                    {searchStats.hasSearch && ` (arama: ${searchStats.searchResults})`}
                    {searchStats.hasFilters && ` (filtre: ${activeFilterCount})`}
                    {searchStats.totalProducts > 0 && ` / ${searchStats.totalProducts} toplam`}
                  </>
                )}
              </span>
            )}
            {searchTerm && <span className="block text-blue-600 font-medium">"{searchTerm}" araması</span>}
          </div>
          
          {!isLoading && (
            <div className="hidden md:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
              >
                <option value="default">Varsayılan Sıralama</option>
                <option value="price-low">Fiyat (Düşük-Yüksek)</option>
                <option value="price-high">Fiyat (Yüksek-Düşük)</option>
                <option value="rating">En Çok Beğenilen</option>
                <option value="name">A-Z</option>
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
      >
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: Math.min(index * 0.1, 0.5) 
                  }}
                >
                  <ProductCard
                    product={product}
                    themes={themes}
                    currentTheme={currentTheme}
                    handleProductClick={handleProductClick}
                    toggleLike={toggleLike}
                    likedProducts={likedProducts}
                  />
                </motion.div>
              ))
            ) : null}
          </AnimatePresence>
        )}
      </motion.div>

      {/* No Results State */}
      {!isLoading && sortedProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Sonuç Bulunamadı
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? (
                <>
                  "<strong>{searchTerm}</strong>" araması için sonuç bulunamadı.
                  {activeFilterCount > 0 && <> Aktif filtreler de sonucu etkileyebilir.</>}
                </>
              ) : activeFilterCount > 0 ? (
                'Seçili filtrelere uygun ürün bulunamadı.'
              ) : (
                'Gösterilecek ürün bulunamadı.'
              )}
            </p>
            
            <div className="space-y-3">
              {searchTerm && (
                <motion.button
                  onClick={clearSearch}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 mx-2 rounded-full bg-gray-100 text-gray-700 font-medium shadow-lg hover:bg-gray-200 transition-colors"
                >
                  Aramayı Temizle
                </motion.button>
              )}
              
              {activeFilterCount > 0 && (
                <motion.button
                  onClick={clearOnlyFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 mx-2 rounded-full text-white font-medium shadow-lg transition-colors"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Filtreleri Temizle
                </motion.button>
              )}
              
              {hasActiveItems && (
                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="block mx-auto px-6 py-3 rounded-full bg-red-600 text-white font-medium shadow-lg hover:bg-red-700 transition-colors"
                >
                  Tümünü Temizle
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <FilterModal
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            activeFilters={activeFilters}
            handleFilterChange={handleFilterChange}
            clearOnlyFilters={clearOnlyFilters}
            themes={themes}
            currentTheme={currentTheme}
          />
        )}
      </AnimatePresence>
    </section>
  );
}