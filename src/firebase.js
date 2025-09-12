import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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
let storage;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);

  // Fallback: Try with minimal config
  try {
    const fallbackConfig = {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    };
    app = initializeApp(fallbackConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log("Firebase initialized with fallback config");
  } catch (fallbackError) {
    console.error("Firebase fallback initialization failed:", fallbackError);
    // App will work with local data only
  }
}

// Storage utilities for file uploads
export const uploadFile = async (file, path) => {
  if (!storage) {
    throw new Error("Firebase Storage not initialized");
  }
  const fileRef = ref(storage, path);
  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export const uploadMultipleFiles = async (files, basePath) => {
  if (!storage) {
    throw new Error("Firebase Storage not initialized");
  }
  const uploadPromises = Array.from(files).map((file) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${basePath}/${fileName}`;
    return uploadFile(file, filePath);
  });
  return Promise.all(uploadPromises);
};

export const deleteFile = async (filePath) => {
  if (!storage) {
    throw new Error("Firebase Storage not initialized");
  }
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
};

export { db, app, storage, auth };
