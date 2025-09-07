// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// 1. Firestore'u kullanmak için bu import'u ekliyoruz
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration (Bu bölüm sendekiyle aynı, doğru)
const firebaseConfig = {
  apiKey: "AIzaSyDF84T8OeOOcDKD6ReKaReImMaldTJIUbo",
  authDomain: "atomuparcalayanbebek.firebaseapp.com",
  projectId: "atomuparcalayanbebek",
  storageBucket: "atomuparcalayanbebek.firebasestorage.app",
  messagingSenderId: "385857724333",
  appId: "1:385857724333:web:0797131eaf6011b61d0b24",
  measurementId: "G-SD5JYC3YDT"
};

// Initialize Firebase (Bu satır da doğru)
const app = initializeApp(firebaseConfig);

//
// --- EKSİK OLAN VE EKLEDİĞİMİZ KISIM BURASI ---
//
// 2. Firestore veritabanı servisini başlatıp 'db' değişkenine atıyoruz.
// 3. Başına "export" koyarak bu 'db' değişkenini diğer dosyaların kullanımına açıyoruz.
//
export const db = getFirestore(app);