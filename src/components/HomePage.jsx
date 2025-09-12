import React, { memo } from 'react';
import { motion } from 'framer-motion';

import HeroSection from './HeroSection';
import ProductSection from './ProductSection';
import AboutSection from './AboutSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

const HomePage = ({
  products,
  allProducts,
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
  faqData,
  activeFaq,
  setActiveFaq,
  contactForm,
  setContactForm,
  handleContactSubmit,
  isLoading,
  toggleLike,
  likedProducts,
  searchStats,
  // Footer props
  handleShortcutFilter,
  handleNewsletterSubmit,
  newsletterEmail,
  setNewsletterEmail
}) => {
  
  // Section animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="overflow-hidden"
      style={{ paddingTop: '80px' }} // Account for fixed header
    >
      {/* Hero Section */}
      <motion.div variants={sectionVariants}>
        <HeroSection currentTheme={currentTheme} />
      </motion.div>

      {/* Products Section */}
      <motion.div 
        id="products"
        variants={sectionVariants}
        className="relative"
      >
        {/* Section background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white pointer-events-none" />
        
        <div className="relative">
          <ProductSection
            products={products}
            allProducts={allProducts}
            themes={themes}
            currentTheme={currentTheme}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            clearSearch={clearSearch}
            activeFilters={activeFilters}
            handleFilterChange={handleFilterChange}
            clearOnlyFilters={clearOnlyFilters}
            clearFilters={clearFilters}
            handleProductClick={handleProductClick}
            toggleLike={toggleLike}
            likedProducts={likedProducts}
            isLoading={isLoading}
            searchStats={searchStats}
          />
        </div>
      </motion.div>

      {/* About Section */}
      <motion.section 
        id="about"
        variants={sectionVariants}
        className="relative"
      >
        {/* Enhanced background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 pointer-events-none" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative">
          <AboutSection currentTheme={currentTheme} />
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        id="faq"
        variants={sectionVariants}
        className="relative"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-white pointer-events-none" />
        
        <div className="relative">
          <FaqSection
            currentTheme={currentTheme}
            faqData={faqData}
            activeFaq={activeFaq}
            setActiveFaq={setActiveFaq}
          />
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section 
        id="contact"
        variants={sectionVariants}
        className="relative"
      >
        {/* Enhanced background for contact */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 pointer-events-none" />
        
        {/* Geometric decorations */}
        <div className="absolute top-10 left-1/4 w-24 h-24 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative">
          <ContactSection
            currentTheme={currentTheme}
            contactForm={contactForm}
            setContactForm={setContactForm}
            handleContactSubmit={handleContactSubmit}
          />
        </div>
      </motion.section>

      {/* Footer - Now Included in HomePage */}
      <motion.div variants={sectionVariants}>
        <Footer 
          handleShortcutFilter={handleShortcutFilter}
          handleNewsletterSubmit={handleNewsletterSubmit}
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
        />
      </motion.div>

      {/* Clean scroll-to-top button - single global implementation */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg z-30 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: typeof window !== 'undefined' && window.scrollY > 300 ? 1 : 0,
          scale: typeof window !== 'undefined' && window.scrollY > 300 ? 1 : 0
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ display: typeof window !== 'undefined' && window.scrollY > 300 ? 'block' : 'none' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.button>
    </motion.div>
  );
};

export default memo(HomePage);