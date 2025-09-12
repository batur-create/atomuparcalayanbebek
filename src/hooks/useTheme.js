// src/hooks/useTheme.js
import { useState, useEffect } from 'react';

export const useTheme = (themes, activeFilters) => {
  const [currentTheme, setCurrentTheme] = useState(themes.default);

  useEffect(() => {
    const themedTags = activeFilters.tags.filter(tag => themes[tag]);
    if (themedTags.length === 1) {
      setCurrentTheme(themes[themedTags[0]]);
    } else {
      setCurrentTheme(themes.default);
    }
  }, [activeFilters.tags, themes]);

  const handleShortcutFilter = (category) => {
    // Scroll to products section
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Trigger category filter with delay to ensure scroll completes
    setTimeout(() => {
      // Find and trigger the category filter
      const categoryMap = {
        'fizik': 'fizik',
        'kimya': 'kimya', 
        'biyoloji': 'biyoloji',
        'astronomi': 'astronomi',
        'mühendislik': 'mühendislik',
        'jeoloji': 'jeoloji', 
        'elektronik': 'elektronik',
        'mekanik': 'mekanik'
      };

      const targetCategory = categoryMap[category.toLowerCase()];
      if (targetCategory) {
        // Dispatch custom event that ProductSection can listen to
        window.dispatchEvent(new CustomEvent('shortcutFilter', {
          detail: { category: targetCategory }
        }));
      }
    }, 800);
  };

  return { currentTheme, handleShortcutFilter };
};