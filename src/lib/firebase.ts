import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJtZElgkEEduN1Aj40DErXqzKbp-P24S0",
  authDomain: "superscan-cb6aa.firebaseapp.com",
  projectId: "superscan-cb6aa",
  storageBucket: "superscan-cb6aa.firebasestorage.app",
  messagingSenderId: "574312124366",
  appId: "1:574312124366:web:f20b4b9380e71cf312e59f",
  measurementId: "G-63HVC8S6LE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
