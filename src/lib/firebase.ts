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
  where
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

const rawConfig: any = firebaseConfigData || {};

const projectId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_PROJECT_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) ||
  rawConfig.projectId;

const apiKey =
  (typeof process !== 'undefined' && process.env?.FIREBASE_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) ||
  rawConfig.apiKey;

const appId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_APP_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID) ||
  rawConfig.appId;

const authDomain =
  (typeof process !== 'undefined' && process.env?.FIREBASE_AUTH_DOMAIN) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) ||
  rawConfig.authDomain;

const firestoreDatabaseId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_DATABASE_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID) ||
  rawConfig.firestoreDatabaseId ||
  'ai-studio-omniloyaltystore-dceb8600-f449-4b44-af0e-6fa3957e73a7';

const storageBucket =
  (typeof process !== 'undefined' && process.env?.FIREBASE_STORAGE_BUCKET) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) ||
  rawConfig.storageBucket;

const messagingSenderId =
  (typeof process !== 'undefined' && process.env?.FIREBASE_MESSAGING_SENDER_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
  rawConfig.messagingSenderId;

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

export const db = app
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)')
  : null;

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



