import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc
} from './firebase';
import { AdminUserItem } from '../types';

export const DEFAULT_MEMBER_ACCOUNTS: AdminUserItem[] = [
  {
    username: 'mambiadmin',
    fullName: 'Mambi Administrator',
    email: 'mambiadmin@omniloyalty.internal',
    passId: 'ADMIN-409-SF',
    pinCode: '••••• (Set)',
    role: 'admin',
    pointsBalance: 50000,
    lifetimePoints: 120000,
    currentTier: 'Platinum',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    username: 'mambi409',
    fullName: 'Alex Rivera',
    email: 'mambi409@example.com',
    passId: 'PASS-9842-SF',
    pinCode: '••••• (Set)',
    role: 'user',
    pointsBalance: 1250,
    lifetimePoints: 2450,
    currentTier: 'Gold',
    status: 'active',
    createdAt: '2026-02-14T14:30:00.000Z'
  },
  {
    username: 'mayalin',
    fullName: 'Maya Lin',
    email: 'maya.lin@sfdesign.co',
    passId: 'PASS-5512-SF',
    pinCode: '••••• (Set)',
    role: 'user',
    pointsBalance: 2480,
    lifetimePoints: 5800,
    currentTier: 'Platinum',
    status: 'active',
    createdAt: '2026-03-01T10:15:00.000Z'
  },
  {
    username: 'marcuschen',
    fullName: 'Marcus Chen',
    email: 'marcus.chen@techbay.io',
    passId: 'PASS-7729-SF',
    pinCode: '••••• (Set)',
    role: 'user',
    pointsBalance: 890,
    lifetimePoints: 1600,
    currentTier: 'Silver',
    status: 'active',
    createdAt: '2026-04-18T16:45:00.000Z'
  },
  {
    username: 'sofiarodriguez',
    fullName: 'Sofia Rodriguez',
    email: 'sofia.r@valenciagoods.com',
    passId: 'PASS-3318-SF',
    pinCode: '••••• (Set)',
    role: 'user',
    pointsBalance: 320,
    lifetimePoints: 480,
    currentTier: 'Bronze',
    status: 'active',
    createdAt: '2026-06-22T09:20:00.000Z'
  },
  {
    username: 'merchant_sf',
    fullName: 'Artisanal Roastery POS',
    email: 'merchant@roastery.com',
    passId: 'MERCHANT-POS-101',
    pinCode: '••••• (Set)',
    role: 'merchant',
    pointsBalance: 14500,
    lifetimePoints: 34000,
    currentTier: 'Platinum',
    status: 'active',
    createdAt: '2026-01-15T11:00:00.000Z'
  }
];

export async function fetchOrSeedMembers(): Promise<{ users: AdminUserItem[]; fromFirestore: boolean; seededCount: number }> {
  // 1. First attempt to fetch from server API if available
  try {
    const apiRes = await fetch('/api/admin/users');
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.users && Array.isArray(data.users) && data.users.length > 0) {
        return { users: data.users, fromFirestore: true, seededCount: 0 };
      }
    }
  } catch (err) {
    console.warn('[API] /api/admin/users endpoint unavailable, falling back to direct Firestore:', err);
  }

  // 2. Direct Firestore SDK Check & Auto-Seed
  if (db) {
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);

      if (!snap.empty) {
        const firestoreUsers: AdminUserItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as any;
          firestoreUsers.push({
            username: d.username || docSnap.id,
            fullName: d.fullName || d.name || d.username || docSnap.id,
            email: d.email || `${d.username || docSnap.id}@omniloyalty.internal`,
            passId: d.passId || `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`,
            role: d.role || 'user',
            pinCode: d.pinCode ? '••••• (Set)' : 'Unset',
            pointsBalance: d.pointsBalance ?? 100,
            lifetimePoints: d.lifetimePoints ?? (d.pointsBalance ?? 100) + 200,
            currentTier: d.currentTier || 'Bronze',
            status: d.status || 'active',
            createdAt: d.createdAt || new Date().toISOString()
          });
        });

        // Ensure mambiadmin is included
        if (!firestoreUsers.some(u => u.username.toLowerCase() === 'mambiadmin')) {
          firestoreUsers.unshift(DEFAULT_MEMBER_ACCOUNTS[0]);
          await setDoc(doc(db, 'users', 'mambiadmin'), DEFAULT_MEMBER_ACCOUNTS[0]);
        }

        return { users: firestoreUsers, fromFirestore: true, seededCount: 0 };
      } else {
        // Firestore is completely empty - Auto seed initial default members
        console.log('[Firestore] Database is empty. Seeding initial network members...');
        let seeded = 0;
        for (const user of DEFAULT_MEMBER_ACCOUNTS) {
          await setDoc(doc(db, 'users', user.username.toLowerCase()), {
            ...user,
            password: user.username === 'mambiadmin' || user.username === 'mambi409' ? '409H!llarY409' : (user.role === 'merchant' ? 'posSecret2026' : 'userPass2026'),
            pinCode: user.username === 'mambiadmin' ? '40900' : '12345'
          });
          seeded++;
        }
        return { users: [...DEFAULT_MEMBER_ACCOUNTS], fromFirestore: true, seededCount: seeded };
      }
    } catch (fsErr) {
      console.warn('[Firestore] Direct query failed, falling back to local dataset:', fsErr);
    }
  }

  // 3. Fallback to default in-memory member list
  return { users: [...DEFAULT_MEMBER_ACCOUNTS], fromFirestore: false, seededCount: 0 };
}

export async function seedAllDefaultMembersToFirestore(): Promise<number> {
  if (!db) {
    throw new Error('Firestore database connection is not initialized');
  }

  let count = 0;
  for (const user of DEFAULT_MEMBER_ACCOUNTS) {
    await setDoc(doc(db, 'users', user.username.toLowerCase()), {
      ...user,
      password: user.username === 'mambiadmin' || user.username === 'mambi409' ? '409H!llarY409' : (user.role === 'merchant' ? 'posSecret2026' : 'userPass2026'),
      pinCode: user.username === 'mambiadmin' ? '40900' : '12345'
    });
    count++;
  }
  return count;
}

export async function saveMemberAccount(user: AdminUserItem, password?: string, pinCode?: string): Promise<void> {
  // Update via API if accessible
  try {
    await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tier: user.currentTier,
        pointsBalance: user.pointsBalance,
        password: password || 'userPass2026',
        pinCode: pinCode || '12345'
      })
    });
  } catch (err) {
    console.log('[API] Save user route note:', err);
  }

  // Save directly to Firestore
  if (db) {
    try {
      const userRef = doc(db, 'users', user.username.toLowerCase());
      await setDoc(userRef, {
        ...user,
        password: password || 'userPass2026',
        pinCode: pinCode || '12345'
      }, { merge: true });
    } catch (fsErr) {
      console.warn('[Firestore] Error saving user to Firestore:', fsErr);
    }
  }
}

export async function updateMemberPoints(username: string, newPoints: number, newTier?: string): Promise<void> {
  try {
    await fetch('/api/admin/users/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, points: newPoints, tier: newTier })
    });
  } catch (e) {
    console.log('[API] Update points route note:', e);
  }

  if (db) {
    try {
      const userRef = doc(db, 'users', username.toLowerCase());
      await updateDoc(userRef, {
        pointsBalance: newPoints,
        ...(newTier ? { currentTier: newTier } : {})
      });
    } catch (fsErr) {
      console.warn('[Firestore] Error updating points in Firestore:', fsErr);
    }
  }
}

export async function removeMemberAccount(username: string): Promise<void> {
  try {
    await fetch(`/api/admin/users/${username}`, { method: 'DELETE' });
  } catch (e) {
    console.log('[API] Delete user route note:', e);
  }

  if (db) {
    try {
      await deleteDoc(doc(db, 'users', username.toLowerCase()));
    } catch (fsErr) {
      console.warn('[Firestore] Error deleting user in Firestore:', fsErr);
    }
  }
}
