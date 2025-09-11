// src/utils/analytics.js
export const trackEvent = (eventName, properties = {}) => {
  // Analytics implementation
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }
  
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, properties);
  }
};

export const trackPageView = (pageName) => {
  trackEvent('page_view', { page_name: pageName });
};

export const trackProductView = (productId, productName) => {
  trackEvent('view_item', {
    item_id: productId,
    item_name: productName,
    content_type: 'product'
  });
};

export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  trackEvent('add_to_cart', {
    currency: 'TRY',
    value: price * quantity,
    items: [{
      item_id: productId,
      item_name: productName,
      price: price,
      quantity: quantity
    }]
  });
};