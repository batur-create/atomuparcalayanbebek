// src/hooks/useNotifications.js
import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const useNotifications = () => {
  const [notification, setNotification] = useState(null);
  const [contactForm, setContactForm] = useState({ 
    name: '', 
    email: '', 
    message: '' 
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const showNotification = useCallback((notificationData) => {
    setNotification(notificationData);
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const handleContactSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      showNotification({ 
        title: 'Uyarı!', 
        message: 'Lütfen tüm alanları doldurun.' 
      });
      return;
    }
    
    try {
      await addDoc(collection(db, "contact_messages"), {
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message,
        submittedAt: serverTimestamp()
      });
      
      showNotification({ 
        title: 'Gönderildi!', 
        message: 'Mesajınız başarıyla iletildi.' 
      });
      
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error("İletişim formu gönderme hatası:", error);
      showNotification({ 
        title: 'Hata!', 
        message: 'Mesaj gönderilemedi.' 
      });
    }
  }, [contactForm, showNotification]);

  const handleNewsletterSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newsletterEmail) return;
    
    try {
      await addDoc(collection(db, "newsletter_subscriptions"), {
        email: newsletterEmail,
        subscribedAt: serverTimestamp()
      });
      
      showNotification({ 
        title: 'Başarılı!', 
        message: 'Bültenimize kaydoldunuz.' 
      });
      
      setNewsletterEmail('');
    } catch (error) {
      console.error("Bülten aboneliği hatası:", error);
      showNotification({ 
        title: 'Hata!', 
        message: 'Bir sorun oluştu.' 
      });
    }
  }, [newsletterEmail, showNotification]);

  return {
    notification,
    showNotification,
    clearNotification,
    handleContactSubmit,
    handleNewsletterSubmit,
    contactForm,
    setContactForm,
    newsletterEmail,
    setNewsletterEmail
  };
};