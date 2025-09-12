import { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, collection, setDoc, deleteDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Safe auth hook usage - only when available
  useEffect(() => {
    // Dynamically import and use auth context when available
    const checkAuth = async () => {
      try {
        // Try to access auth context if available
        const { useAuth } = await import('../context/AuthContext');
        
        // This will only work if we're inside AuthProvider
        if (typeof useAuth === 'function') {
          const authContext = useAuth();
          setCurrentUser(authContext?.currentUser || null);
        }
      } catch (error) {
        // AuthProvider not available yet, use guest mode
        setCurrentUser(null);
      }
    };

    checkAuth();
  }, []);

  // Load user favorites from Firebase when user changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser) {
        // Load guest favorites from localStorage
        const guestFavorites = localStorage.getItem('favorites_guest');
        if (guestFavorites) {
          setLikedProducts(new Set(JSON.parse(guestFavorites)));
        }
        return;
      }

      setFavoritesLoading(true);
      try {
        const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
        const favoritesSnapshot = await getDocs(query(favoritesRef));
        const favoriteIds = new Set(favoritesSnapshot.docs.map(doc => doc.id));
        setLikedProducts(favoriteIds);
      } catch (error) {
        console.error('Error loading favorites:', error);
        // Fallback to local storage for offline support
        const savedFavorites = localStorage.getItem(`favorites_${currentUser.uid}`);
        if (savedFavorites) {
          setLikedProducts(new Set(JSON.parse(savedFavorites)));
        }
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadFavorites();
  }, [currentUser]);

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

  // Enhanced like management with Firebase integration
  const toggleLike = useCallback(async (productId) => {
    if (!productId) return;

    // Update local state immediately for responsive UI
    setLikedProducts(prev => {
      const newLikes = new Set(prev);
      const wasLiked = newLikes.has(productId);
      
      if (wasLiked) {
        newLikes.delete(productId);
      } else {
        newLikes.add(productId);
      }
      
      // If user is logged in, sync with Firebase
      if (currentUser) {
        syncFavoriteToFirebase(productId, !wasLiked).catch(error => {
          console.error('Error syncing favorite:', error);
          // Revert local state on error would go here, but we'll keep it simple
        });
        
        // Also save to localStorage as backup
        const favoritesArray = Array.from(newLikes);
        localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify(favoritesArray));
      } else {
        // For non-logged users, use localStorage only
        const favoritesArray = Array.from(newLikes);
        localStorage.setItem('favorites_guest', JSON.stringify(favoritesArray));
      }
      
      return newLikes;
    });
  }, [currentUser]);

  // Firebase sync helper function
  const syncFavoriteToFirebase = async (productId, isLiked) => {
    if (!currentUser) return;

    try {
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', productId);
      
      if (isLiked) {
        // Add to favorites
        await setDoc(favoriteRef, {
          productId,
          createdAt: new Date(),
          userId: currentUser.uid
        });
      } else {
        // Remove from favorites
        await deleteDoc(favoriteRef);
      }
    } catch (error) {
      console.error('Firebase sync error:', error);
      // Don't throw - just log and continue
    }
  };

  // Listen for auth changes from window events (alternative approach)
  useEffect(() => {
    const handleAuthChange = (event) => {
      if (event.detail && event.detail.user !== undefined) {
        setCurrentUser(event.detail.user);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  // Stats for debugging/info
  const stats = useMemo(() => ({
    totalProducts: products.length,
    searchResults: searchResults.length,
    finalResults: filteredProducts.length,
    hasSearch: Boolean(searchTerm?.trim()),
    hasFilters: Object.values(activeFilters).some(arr => arr.length > 0),
    favoritesCount: likedProducts.size,
    userLoggedIn: Boolean(currentUser)
  }), [products.length, searchResults.length, filteredProducts.length, searchTerm, activeFilters, likedProducts.size, currentUser]);

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
    
    // Likes (Enhanced with Firebase)
    likedProducts,
    toggleLike,
    favoritesLoading,
    
    // Debug info
    stats
  };
};