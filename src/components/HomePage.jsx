import React from 'react';

import Header from './Header';
import HeroSection from './HeroSection';
import ProductSection from './ProductSection';
import AboutSection from './AboutSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

export default function HomePage({
  products,
  themes,
  currentTheme,
  isScrolled,
  isMenuOpen,
  setIsMenuOpen,
  handleGoToCart,
  searchTerm,
  setSearchTerm,
  activeFilters,
  handleFilterChange,
  handleShortcutFilter, // App.jsx'ten gelen yeni prop
  clearFilters,
  handleProductClick,
  toggleLike,
  likedProducts,
  faqData,
  activeFaq,
  setActiveFaq,
  contactForm,
  setContactForm,
  handleContactSubmit,
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  isLoading
}) {
  return (
    <>
      <Header 
        isScrolled={isScrolled}
        currentTheme={currentTheme}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen} // === YAZIM HATASI DÜZELTİLDİ ===
        handleGoToCart={handleGoToCart}
      />

      <main>
        <HeroSection currentTheme={currentTheme} />

        <ProductSection 
          products={products}
          themes={themes}
          currentTheme={currentTheme}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilters={activeFilters}
          handleFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          handleProductClick={handleProductClick}
          toggleLike={toggleLike}
          likedProducts={likedProducts}
          isLoading={isLoading}
        />

        <AboutSection currentTheme={currentTheme} />

        <FaqSection 
          currentTheme={currentTheme}
          faqData={faqData}
          activeFaq={activeFaq}
          setActiveFaq={setActiveFaq}
        />

        <ContactSection 
          currentTheme={currentTheme}
          contactForm={contactForm}
          setContactForm={setContactForm}
          handleContactSubmit={handleContactSubmit}
        />
      </main>

      <Footer 
        handleShortcutFilter={handleShortcutFilter} // Yeni fonksiyonu Footer'a iletiyoruz
        handleNewsletterSubmit={handleNewsletterSubmit}
        newsletterEmail={newsletterEmail}
        setNewsletterEmail={setNewsletterEmail}
      />
    </>
  );
}