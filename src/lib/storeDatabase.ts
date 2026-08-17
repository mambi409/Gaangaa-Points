import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from './firebase';
import { Store, StoreWeeklySchedule } from '../types';
import { INITIAL_STORES } from '../data/mockData';

export const DEFAULT_WEEKLY_SCHEDULE: StoreWeeklySchedule = {
  monday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  tuesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  wednesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  thursday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  friday: { isOpen: true, openTime: '08:00', closeTime: '21:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  sunday: { isOpen: true, openTime: '10:00', closeTime: '18:00' }
};

export const ENRICHED_DEFAULT_STORES: Store[] = INITIAL_STORES.map((s, index) => ({
  ...s,
  email: s.email || `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@omniloyalty.internal`,
  secondaryPhone: s.secondaryPhone || `(415) 555-${(1000 + index * 111).toString().slice(-4)}`,
  website: s.website || `https://${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
  schedule: s.schedule || DEFAULT_WEEKLY_SCHEDULE,
  totalPointsRewarded: s.totalPointsRewarded || (25000 + index * 12500),
  totalPointsRedeemed: s.totalPointsRedeemed || (8500 + index * 4200),
  managerName: s.managerName || ['Jordan Hayes', 'Elena Rostova', 'David Kim', 'Samira Patel', 'Marcus Vance', 'Chloe Dubois'][index % 6],
  socialHandle: s.socialHandle || `@${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_sf`
}));

export async function fetchStoreById(storeId: string): Promise<Store | null> {
  if (!storeId) return null;
  // 1. Direct Firestore check
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'stores', storeId));
      if (snap.exists()) {
        const d = snap.data() as Store;
        return {
          ...d,
          id: d.id || snap.id,
          schedule: d.schedule || DEFAULT_WEEKLY_SCHEDULE
        };
      }
    } catch (err) {
      console.warn('[Firestore] fetchStoreById error:', err);
    }
  }

  // 2. Fetch from stores list
  try {
    const { stores } = await fetchOrSeedStores();
    const found = stores.find((s) => s.id === storeId);
    if (found) return found;
  } catch (e) {}

  return null;
}

export async function findLiveStoreForMerchant(user: { username?: string; email?: string; fullName?: string }): Promise<Store | null> {
  if (!user) return null;
  const uName = (user.username || '').toLowerCase();
  const uEmail = (user.email || '').toLowerCase();
  const uFullName = (user.fullName || '').toLowerCase();

  // 1. Check direct doc ID: `store-${uName}`
  if (uName) {
    const directStore = await fetchStoreById(`store-${uName}`);
    if (directStore) return directStore;
  }

  // 2. Query all stores
  try {
    const { stores } = await fetchOrSeedStores();
    // Direct ID match
    const byId = stores.find((s) => s.id.toLowerCase() === `store-${uName}` || s.id.toLowerCase() === uName);
    if (byId) return byId;

    // Email match
    if (uEmail) {
      const byEmail = stores.find((s) => s.email && s.email.toLowerCase() === uEmail);
      if (byEmail) return byEmail;
    }

    // Social handle match
    if (uName) {
      const bySocial = stores.find((s) => s.socialHandle && s.socialHandle.toLowerCase().includes(uName));
      if (bySocial) return bySocial;
    }

    // Manager name match
    if (uFullName) {
      const byManager = stores.find((s) => s.managerName && s.managerName.toLowerCase() === uFullName);
      if (byManager) return byManager;
    }

    // Fallback: name contains username keywords
    const byKeyword = stores.find((s) => s.name.toLowerCase().includes(uName));
    if (byKeyword) return byKeyword;
  } catch (err) {
    console.warn('[Store] findLiveStoreForMerchant note:', err);
  }

  return null;
}

export async function fetchOrSeedStores(): Promise<{ stores: Store[]; fromFirestore: boolean }> {
  // 1. Try fetching from server API
  try {
    const res = await fetch('/api/stores');
    if (res.ok) {
      const data = await res.json();
      if (data.stores && Array.isArray(data.stores) && data.stores.length > 0) {
        return { stores: data.stores, fromFirestore: true };
      }
    }
  } catch (err) {
    console.warn('[API] /api/stores endpoint unavailable, checking Firestore:', err);
  }

  // 2. Direct Firestore SDK Check
  if (db) {
    try {
      const storesCol = collection(db, 'stores');
      const snap = await getDocs(storesCol);

      if (!snap.empty) {
        const firestoreStores: Store[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as Store;
          firestoreStores.push({
            ...d,
            id: d.id || docSnap.id,
            schedule: d.schedule || DEFAULT_WEEKLY_SCHEDULE
          });
        });
        return { stores: firestoreStores, fromFirestore: true };
      } else {
        // Seed default stores to Firestore
        console.log('[Firestore] Stores collection empty. Seeding initial partner stores...');
        for (const store of ENRICHED_DEFAULT_STORES) {
          await setDoc(doc(db, 'stores', store.id), store);
        }
        return { stores: ENRICHED_DEFAULT_STORES, fromFirestore: true };
      }
    } catch (fsErr) {
      console.warn('[Firestore] Stores direct query failed, using in-memory dataset:', fsErr);
    }
  }

  return { stores: ENRICHED_DEFAULT_STORES, fromFirestore: false };
}

export async function saveStoreToDatabase(store: Store): Promise<{ success: boolean; store: Store }> {
  // 1. Send to server API endpoint
  try {
    const res = await fetch('/api/merchant/store/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.store) {
        store = data.store;
      }
    }
  } catch (apiErr) {
    console.warn('[API] Store update endpoint note:', apiErr);
  }

  // 2. Persist directly to Firestore
  if (db) {
    try {
      const storeRef = doc(db, 'stores', store.id);
      await setDoc(storeRef, store, { merge: true });
      console.log(`[Firestore] Store ${store.id} successfully updated in cloud database.`);
    } catch (fsErr) {
      console.warn('[Firestore] Error saving store to Firestore:', fsErr);
    }
  }

  return { success: true, store };
}
