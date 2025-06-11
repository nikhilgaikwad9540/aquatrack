// src/lib/firebase.js

// Import the functions you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Optional: Import analytics if needed (for tracking usage)
import { getAnalytics, isSupported } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmdeeEgYJohZf5UePYh5_2P6z5enrN2FA",
  authDomain: "aquatrack-34f01.firebaseapp.com",
  projectId: "aquatrack-34f01",
  storageBucket: "aquatrack-34f01.firebasestorage.app",
  messagingSenderId: "1052278002165",
  appId: "1:1052278002165:web:83c064a4fa6abcb5a010bc",
  measurementId: "G-96JPWGEET4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore instance (this is what you'll use for database)
const db = getFirestore(app);

// Optional: Analytics (only if used)
let analytics;
isSupported().then((yes) => {
  if (yes) {
    analytics = getAnalytics(app);
  }
});

// Export db (and analytics if needed)
export { db, analytics };
