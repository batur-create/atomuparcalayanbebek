import React from 'react';

// Yeni oluşturduğumuz bileşenleri import ediyoruz
import Header from './Header';
import HeroSection from './HeroSection';
import ProductSection from './ProductSection';
import AboutSection from './AboutSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

// HomePage artık bir "konteyner" bileşeni, yani diğer bileşenleri bir arada tutuyor.
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
  clearFilters,
  handleProductClick,
  toggleLike,
  likedProducts,
  faqData,
  activeFaq,
  setActiveFaq,
  contactForm,
  setContactForm,
  handleContactSubmit
}) {
  return (
    // React.Fragment (<>) kullanarak birden fazla ana bileşeni döndürüyoruz.
    <>
      <Header 
        isScrolled={isScrolled}
        currentTheme={currentTheme}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
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

      <Footer handleFilterChange={handleFilterChange} />
    </>
  );
}