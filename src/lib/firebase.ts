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
import fs from 'fs';

let firebaseConfig: any = null;
try {
  if (fs.existsSync('./firebase-applet-config.json')) {
    const raw = fs.readFileSync('./firebase-applet-config.json', 'utf8');
    firebaseConfig = JSON.parse(raw);
  }
} catch (e) {
  console.error('Failed to load firebase-applet-config.json:', e);
}

const app = firebaseConfig
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const db = app
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)')
  : null;

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
  where
};
