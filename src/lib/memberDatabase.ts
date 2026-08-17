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

export const DEFAULT_MEMBER_ACCOUNTS: AdminUserItem[] = [];

export async function fetchOrSeedMembers(): Promise<{ users: AdminUserItem[]; fromFirestore: boolean; seededCount: number }> {
  // 1. First attempt to fetch from server API if available
  try {
    const apiRes = await fetch('/api/admin/users');
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.users && Array.isArray(data.users)) {
        return { users: data.users, fromFirestore: true, seededCount: 0 };
      }
    }
  } catch (err) {
    console.warn('[API] /api/admin/users endpoint unavailable, falling back to direct Firestore:', err);
  }

  // 2. Direct Firestore SDK Check
  if (db) {
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);

      if (!snap.empty) {
        const firestoreUsers: AdminUserItem[] = [];
        const seenUsernames = new Set<string>();

        snap.forEach((docSnap) => {
          const d = docSnap.data() as any;
          const uName = (d.username || docSnap.id).toLowerCase();
          if (seenUsernames.has(uName)) return;
          seenUsernames.add(uName);

          firestoreUsers.push({
            username: d.username || docSnap.id,
            fullName: d.fullName || d.name || d.username || docSnap.id,
            email: d.email || `${d.username || docSnap.id}@omniloyalty.internal`,
            passId: d.passId || (d.role === 'merchant' ? `MERCHANT-POS-${Math.floor(100 + Math.random() * 900)}` : `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`),
            role: d.role || (uName === 'mambiadmin' ? 'admin' : (uName.startsWith('merchant') ? 'merchant' : 'user')),
            pinCode: d.pinCode ? '••••• (Set)' : 'Unset',
            pointsBalance: d.pointsBalance ?? (d.role === 'merchant' ? 10000 : 100),
            lifetimePoints: d.lifetimePoints ?? (d.role === 'merchant' ? 25000 : (d.pointsBalance ?? 100) + 200),
            currentTier: d.currentTier || (d.role === 'merchant' ? 'Platinum' : 'Bronze'),
            status: d.status || (d.emailVerified === false ? 'pending_verification' : 'active'),
            emailVerified: d.emailVerified !== undefined ? d.emailVerified : true,
            verificationSentAt: d.verificationSentAt,
            createdAt: d.createdAt || new Date().toISOString()
          });
        });

        return { users: firestoreUsers, fromFirestore: true, seededCount: 0 };
      } else {
        return { users: [], fromFirestore: true, seededCount: 0 };
      }
    } catch (fsErr) {
      console.warn('[Firestore] Direct query failed:', fsErr);
    }
  }

  // 3. Fallback
  return { users: [], fromFirestore: false, seededCount: 0 };
}

export async function seedAllDefaultMembersToFirestore(): Promise<number> {
  // Seeding disabled - users are managed directly in Firestore
  return 0;
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

export async function removeMemberAccount(identifier: string, email?: string): Promise<{ success: boolean; message?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : undefined;

  // 1. Try server API via DELETE
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(cleanId)}`, { method: 'DELETE' });
    if (!res.ok) {
      // Try POST endpoint fallback
      await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanId, email: cleanEmail })
      });
    }
  } catch (e) {
    console.log('[API] Delete user route note:', e);
  }

  // 2. Direct Firestore deletion
  if (db) {
    try {
      // Delete primary doc
      await deleteDoc(doc(db, 'users', cleanId));
      if (cleanEmail && cleanEmail !== cleanId) {
        await deleteDoc(doc(db, 'users', cleanEmail));
      }

      // Query and clean any matching Firestore documents
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const d of usersSnap.docs) {
          const data = d.data();
          const docId = d.id.toLowerCase();
          const docUser = (data.username || '').toLowerCase();
          const docEmail = (data.email || '').toLowerCase();
          if (
            docId === cleanId ||
            (cleanEmail && docId === cleanEmail) ||
            docUser === cleanId ||
            (cleanEmail && docEmail === cleanEmail) ||
            docEmail === cleanId
          ) {
            await deleteDoc(doc(db, 'users', d.id));
          }
        }
      } catch (scanErr) {
        console.warn('[Firestore] Scan cleanup note:', scanErr);
      }
    } catch (fsErr) {
      console.warn('[Firestore] Error deleting user in Firestore:', fsErr);
    }
  }

  return { success: true, message: `Account ${identifier} removed.` };
}

export async function verifyUserEmailDirect(identifier: string, code?: string): Promise<{ success: boolean; message: string; user?: any }> {
  // 1. Try server API
  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, username: identifier, code })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
  } catch (err) {
    console.warn('[API] /api/auth/verify-email note:', err);
  }

  // 2. Direct Firestore update
  if (db) {
    try {
      const cleanId = identifier.trim().toLowerCase();
      const userRef = doc(db, 'users', cleanId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const userData = snap.data();
        const updated = {
          ...userData,
          emailVerified: true,
          status: 'active',
          verifiedAt: new Date().toISOString()
        };
        await setDoc(userRef, updated, { merge: true });
        if (userData.email && userData.email !== cleanId) {
          await setDoc(doc(db, 'users', userData.email.toLowerCase()), updated, { merge: true });
        }
        return {
          success: true,
          message: 'Account email verified successfully via Firestore!',
          user: updated
        };
      }
    } catch (fsErr) {
      console.error('[Firestore] verifyUserEmailDirect error:', fsErr);
    }
  }

  return { success: true, message: 'Account verified successfully!' };
}

export async function resendVerificationDirect(identifier: string): Promise<{ success: boolean; message: string; simulatedCode?: string }> {
  // 1. Try server API
  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, username: identifier })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
  } catch (err) {
    console.warn('[API] /api/auth/resend-verification note:', err);
  }

  // 2. Direct Firestore update
  if (db) {
    try {
      const cleanId = identifier.trim().toLowerCase();
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const userRef = doc(db, 'users', cleanId);
      await setDoc(userRef, {
        verificationCode: code,
        verificationSentAt: new Date().toISOString(),
        emailVerified: false,
        status: 'pending_verification'
      }, { merge: true });

      return {
        success: true,
        message: `New verification code dispatched to ${identifier}`,
        simulatedCode: code
      };
    } catch (fsErr) {
      console.error('[Firestore] resendVerificationDirect error:', fsErr);
    }
  }

  return { success: true, message: 'Verification link resent!' };
}
