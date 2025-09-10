import React, { memo } from 'react';

import HeroSection from './HeroSection';
import ProductSection from './ProductSection';
import AboutSection from './AboutSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';

const HomePage = ({
  products,
  themes,
  currentTheme,
  searchTerm,
  setSearchTerm,
  activeFilters,
  handleFilterChange,
  clearFilters,
  handleProductClick,
  faqData,
  activeFaq,
  setActiveFaq,
  contactForm,
  setContactForm,
  handleContactSubmit,
  isLoading,
  toggleLike,
  likedProducts
}) => {
  return (
    <div>
      <HeroSection currentTheme={currentTheme} />

      {/* Ürünler bölümü mutlaka id=products olsun */}
      <div id="products">
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
      </div>

      <section id="about">
        <AboutSection currentTheme={currentTheme} />
      </section>

      <section id="faq">
        <FaqSection
          currentTheme={currentTheme}
          faqData={faqData}
          activeFaq={activeFaq}
          setActiveFaq={setActiveFaq}
        />
      </section>

      <section id="contact">
        <ContactSection
          currentTheme={currentTheme}
          contactForm={contactForm}
          setContactForm={setContactForm}
          handleContactSubmit={handleContactSubmit}
        />
      </section>
    </div>
  );
};

export default memo(HomePage);
