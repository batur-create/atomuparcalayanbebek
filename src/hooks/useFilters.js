import { useState, useMemo, useCallback } from 'react';

export const useFilters = (products = []) => {
  // Search state (text-based)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state (category-based)
  const [activeFilters, setActiveFilters] = useState({ 
    category: [], 
    ageGroup: [], 
    tags: [] 
  });
  
  // Like state
  const [likedProducts, setLikedProducts] = useState(new Set());

  // STEP 1: Pure search results (text matching only)
  const searchResults = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    // If no search term, return all products
    if (!searchTerm || !searchTerm.trim()) {
      return products;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return products.filter(product => {
      if (!product) return false;
      
      // Search in product name
      const nameMatch = product.name?.toLowerCase().includes(searchLower);
      
      // Search in product description  
      const descriptionMatch = product.description?.toLowerCase().includes(searchLower);
      
      // Search in product tags
      const tagsMatch = Array.isArray(product.tags) && 
        product.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      // Search in category (bonus)
      const categoryMatch = product.category?.toLowerCase().includes(searchLower);
      
      return nameMatch || descriptionMatch || tagsMatch || categoryMatch;
    });
  }, [products, searchTerm]);

  // STEP 2: Apply filters to search results  
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(searchResults)) return [];
    
    return searchResults.filter(product => {
      if (!product) return false;
      
      // Category filter
      const categoryMatch = activeFilters.category.length === 0 || 
        activeFilters.category.includes(product.category?.toLowerCase());
      
      // Age group filter
      const ageMatch = activeFilters.ageGroup.length === 0 || 
        activeFilters.ageGroup.includes(product.ageGroup);
      
      // Science tags filter
      const tagsMatch = activeFilters.tags.length === 0 || 
        (Array.isArray(product.tags) && 
         product.tags.some(tag => activeFilters.tags.includes(tag.toLowerCase())));
      
      return categoryMatch && ageMatch && tagsMatch;
    });
  }, [searchResults, activeFilters]);

  // Filter management
  const handleFilterChange = useCallback((type, value) => {
    const normalizedValue = typeof value === 'string' ? value.toLowerCase() : value;
    
    setActiveFilters(prev => {
      const currentArray = prev[type] || [];
      const isActive = currentArray.includes(normalizedValue);
      
      const newArray = isActive
        ? currentArray.filter(item => item !== normalizedValue)
        : [...currentArray, normalizedValue];
      
      return { ...prev, [type]: newArray };
    });
  }, []);

  // Clear all filters and search
  const clearFilters = useCallback(() => {
    setActiveFilters({ category: [], ageGroup: [], tags: [] });
    setSearchTerm('');
  }, []);

  // Clear only filters (keep search)
  const clearOnlyFilters = useCallback(() => {
    setActiveFilters({ category: [], ageGroup: [], tags: [] });
  }, []);

  // Clear only search (keep filters)
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Like management
  const toggleLike = useCallback((productId) => {
    setLikedProducts(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(productId)) {
        newLikes.delete(productId);
      } else {
        newLikes.add(productId);
      }
      return newLikes;
    });
  }, []);

  // Stats for debugging/info
  const stats = useMemo(() => ({
    totalProducts: products.length,
    searchResults: searchResults.length,
    finalResults: filteredProducts.length,
    hasSearch: Boolean(searchTerm?.trim()),
    hasFilters: Object.values(activeFilters).some(arr => arr.length > 0)
  }), [products.length, searchResults.length, filteredProducts.length, searchTerm, activeFilters]);

  return {
    // Search
    searchTerm,
    setSearchTerm,
    clearSearch,
    
    // Filters
    activeFilters,
    handleFilterChange,
    clearOnlyFilters,
    
    // Combined actions
    clearFilters,
    
    // Results
    searchResults,      // Only search applied
    filteredProducts,   // Search + filters applied
    
    // Likes
    likedProducts,
    toggleLike,
    
    // Debug info
    stats
  };
};