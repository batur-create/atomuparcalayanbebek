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

  const handleShortcutFilter = (tag) => {
    // This will be handled by the parent component
    // Just a placeholder for theme switching logic
  };

  return { currentTheme, handleShortcutFilter };
};