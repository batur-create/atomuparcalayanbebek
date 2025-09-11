import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Environment variables ile güvenli config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDF84T8OeOOcDKD6ReKaReImMaldTJIUbo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "atomuparcalayanbebek.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "atomuparcalayanbebek",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "atomuparcalayanbebek.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "385857724333",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:385857724333:web:0797131eaf6011b61d0b24",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SD5JYC3YDT"
};

// Firebase initialization with error handling
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  
  // Fallback: Try with minimal config
  try {
    const fallbackConfig = {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
    };
    app = initializeApp(fallbackConfig);
    db = getFirestore(app);
    console.log("Firebase initialized with fallback config");
  } catch (fallbackError) {
    console.error("Firebase fallback initialization failed:", fallbackError);
    // App will work with local data only
  }
}

export { db, app };