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
  
  // Liked products state (localStorage only)
  const [likedProducts, setLikedProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('likedProducts');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // Search/filter logic
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.filter(product => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(searchLower);
        const matchesDescription = product.description?.toLowerCase().includes(searchLower);
        const matchesTags = product.tags?.some(tag => 
          tag.toLowerCase().includes(searchLower)
        );
        
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (activeFilters.category.length > 0) {
        if (!activeFilters.category.includes(product.category)) {
          return false;
        }
      }

      // Age group filter
      if (activeFilters.ageGroup.length > 0) {
        if (!activeFilters.ageGroup.includes(product.ageGroup)) {
          return false;
        }
      }

      // Tags filter
      if (activeFilters.tags.length > 0) {
        const hasMatchingTag = activeFilters.tags.some(filterTag => 
          product.tags?.some(productTag => 
            productTag.toLowerCase() === filterTag.toLowerCase()
          )
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchTerm, activeFilters]);

  // Filter management
  const handleFilterChange = useCallback((filterType, value) => {
    setActiveFilters(prev => {
      const currentValues = prev[filterType];
      const normalizedValue = filterType === 'ageGroup' ? value : value.toLowerCase();
      
      const newValues = currentValues.includes(normalizedValue)
        ? currentValues.filter(v => v !== normalizedValue)
        : [...currentValues, normalizedValue];

      return {
        ...prev,
        [filterType]: newValues
      };
    });
  }, []);

  const clearOnlyFilters = useCallback(() => {
    setActiveFilters({
      category: [],
      ageGroup: [],
      tags: []
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    clearOnlyFilters();
  }, [clearOnlyFilters]);

  // Likes management (localStorage only)
  const toggleLike = useCallback((productId) => {
    setLikedProducts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(productId)) {
        newLiked.delete(productId);
      } else {
        newLiked.add(productId);
      }
      
      try {
        localStorage.setItem('likedProducts', JSON.stringify([...newLiked]));
      } catch (error) {
        console.warn('Could not save likes to localStorage:', error);
      }
      
      return newLiked;
    });
  }, []);

  // Search results for separate display
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = product.name?.toLowerCase().includes(searchLower);
      const matchesDescription = product.description?.toLowerCase().includes(searchLower);
      const matchesTags = product.tags?.some(tag => 
        tag.toLowerCase().includes(searchLower)
      );
      
      return matchesName || matchesDescription || matchesTags;
    });
  }, [products, searchTerm]);

  // Statistics
  const stats = useMemo(() => ({
    totalProducts: products.length,
    searchResults: searchResults.length,
    finalResults: filteredProducts.length,
    hasSearch: searchTerm.trim().length > 0,
    hasFilters: Object.values(activeFilters).some(arr => arr.length > 0),
    activeFiltersCount: Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0)
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
    
    // Combined
    clearFilters,
    
    // Results
    searchResults,
    filteredProducts,
    
    // Likes
    likedProducts,
    toggleLike,
    
    // Stats
    stats
  };
};