// src/hooks/useScroll.js
import { useState, useEffect } from 'react';

export const useScroll = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when scrolling
  useEffect(() => {
    if (isScrolled && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isScrolled, isMenuOpen]);

  return { isScrolled, isMenuOpen, setIsMenuOpen };
};