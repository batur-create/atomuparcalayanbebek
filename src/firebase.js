import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Senin firebaseConfig bilgilerin, SADECE "storageBucket" satırı düzeltildi.
const firebaseConfig = {
  apiKey: "AIzaSyDF84T8OeOOcDKD6ReKaReImMaldTJIUbo",
  authDomain: "atomuparcalayanbebek.firebaseapp.com",
  projectId: "atomuparcalayanbebek",
  // ----- DOĞRU ADRES BURASI -----
  storageBucket: "atomuparcalayanbebek.appspot.com",
  // ---------------------------------
  messagingSenderId: "385857724333",
  appId: "1:385857724333:web:0797131eaf6011b61d0b24",
  measurementId: "G-SD5JYC3YDT"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// WebSocket bağlantısını devre dışı bırakır
initializeFirestore(app, { experimentalForceLongPolling: true });

// db export'u
export const db = getFirestore(app);