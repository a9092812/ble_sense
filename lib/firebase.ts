// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBGwkk-Fc4HLxwKcQASBaHYZ3JbM4CcxhQ",
  authDomain: "ble-sense-65650.firebaseapp.com",
  databaseURL: "https://ble-sense-65650-default-rtdb.firebaseio.com",
  projectId: "ble-sense-65650",
  storageBucket: "ble-sense-65650.firebasestorage.app",
  messagingSenderId: "634409104545",
  appId: "1:634409104545:web:434eab0c51d53586856ce0",
  measurementId: "G-R92FB5MKM7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
