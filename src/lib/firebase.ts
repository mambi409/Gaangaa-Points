import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  reload,
  onAuthStateChanged,
  sendPasswordResetEmail,
  applyActionCode
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

const FALLBACK_CONFIG = {
  projectId: 'seraphic-stone-gds98',
  appId: '1:871647436654:web:4ecd283df136a094ca2b7f',
  apiKey: 'AIzaSyAaHiiExNwz04PDlo2-H18-tXAELK20bgU',
  authDomain: 'seraphic-stone-gds98.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-omniloyaltystore-dceb8600-f449-4b44-af0e-6fa3957e73a7',
  storageBucket: 'seraphic-stone-gds98.firebasestorage.app',
  messagingSenderId: '871647436654'
};

const rawConfig: any = firebaseConfigData || FALLBACK_CONFIG;

const projectId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_PROJECT_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) ||
  rawConfig.projectId ||
  FALLBACK_CONFIG.projectId;

const apiKey =
  (typeof process !== 'undefined' && process.env?.FIREBASE_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) ||
  rawConfig.apiKey ||
  FALLBACK_CONFIG.apiKey;

const appId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_APP_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID) ||
  rawConfig.appId ||
  FALLBACK_CONFIG.appId;

const authDomain =
  (typeof process !== 'undefined' && process.env?.FIREBASE_AUTH_DOMAIN) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) ||
  rawConfig.authDomain ||
  FALLBACK_CONFIG.authDomain;

const firestoreDatabaseId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_DATABASE_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID) ||
  rawConfig.firestoreDatabaseId ||
  FALLBACK_CONFIG.firestoreDatabaseId;

const storageBucket =
  (typeof process !== 'undefined' && process.env?.FIREBASE_STORAGE_BUCKET) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) ||
  rawConfig.storageBucket ||
  FALLBACK_CONFIG.storageBucket;

const messagingSenderId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_MESSAGING_SENDER_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
  rawConfig.messagingSenderId ||
  FALLBACK_CONFIG.messagingSenderId;

const firebaseConfig = {
  projectId,
  apiKey,
  appId,
  authDomain,
  firestoreDatabaseId,
  storageBucket,
  messagingSenderId
};

const app = firebaseConfig.projectId
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

let firestoreInstance: any = null;
if (app) {
  try {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  } catch (err) {
    try {
      firestoreInstance = getFirestore(app);
    } catch (e2) {
      console.error('[Firebase] Failed to initialize Firestore:', e2);
    }
  }
}

export const db = firestoreInstance;

export const auth = app ? getAuth(app) : null;

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  reload,
  onAuthStateChanged,
  sendPasswordResetEmail,
  applyActionCode
};



