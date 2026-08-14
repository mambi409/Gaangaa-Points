import {
  db,
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
} from '../src/lib/firebase.js';
import {
  INITIAL_STORES,
  INITIAL_REWARDS,
  INITIAL_WALLET,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MERCHANT_STATS
} from '../src/data/mockData.js';
import {
  Store,
  RewardItem,
  UserWallet,
  Transaction,
  NotificationMessage,
  AdminTask,
  SystemAuditLog,
  AdminPost,
  UserTier,
  UserRole
} from '../src/types.js';

export interface RegisteredUser {
  username: string;
  password: string;
  fullName: string;
  email: string;
  passId: string;
  pinCode: string;
  role?: UserRole;
  pointsBalance?: number;
  lifetimePoints?: number;
  currentTier?: UserTier;
  createdAt?: string;
  status?: 'active' | 'suspended';
}

export let storesData: Store[] = [...INITIAL_STORES];
export let rewardsData: RewardItem[] = [...INITIAL_REWARDS];
export let walletData: UserWallet = JSON.parse(JSON.stringify(INITIAL_WALLET));
export let transactionsData: Transaction[] = [...INITIAL_TRANSACTIONS];
export let notificationsData: NotificationMessage[] = [...INITIAL_NOTIFICATIONS];

export const INITIAL_POSTS: AdminPost[] = [
  {
    id: 'post-1',
    title: 'Double Points Weekend across All Artisan Coffee Locations ☕',
    content: 'Get ready for Double Points weekend starting this Friday! Earn 20 points per $1 spent at Blue Bottle, Artisanal Roastery, and Ritual Coffee. Automatic bonus credits at checkout.',
    category: 'Promotion',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    author: 'Mambi Administrator',
    targetAudience: 'all',
    status: 'published',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likesCount: 142,
    featured: true
  },
  {
    id: 'post-2',
    title: 'New Tier Perks Unlocked: Gold & Platinum Members Receive Free Delivery 🚀',
    content: 'We are thrilled to announce exclusive perks for our Gold and Platinum loyalty tier members! Enjoy zero delivery fees at partner boutiques, early access to limited reward drops, and 1.5x points multiplier.',
    category: 'Announcement',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
    author: 'Mambi Administrator',
    targetAudience: 'user',
    status: 'published',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    likesCount: 89,
    featured: false
  },
  {
    id: 'post-3',
    title: 'Merchant POS Terminal Update v4.2 Released',
    content: 'Partner merchants can now scan member QR codes offline with instant local validation and background sync when connection is restored. Check the POS update tab for firmware installation.',
    category: 'Update',
    imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80',
    author: 'Mambi Administrator',
    targetAudience: 'merchant',
    status: 'published',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    likesCount: 34,
    featured: false
  }
];

export let postsData: AdminPost[] = [...INITIAL_POSTS];

export const INITIAL_ADMIN_TASKS: AdminTask[] = [
  {
    id: 'task-ledger-reconcile',
    name: 'Ledger Reconciliation & Points Audit',
    description: 'Verifies customer balances against all network transaction history to guarantee zero discrepancy.',
    category: 'accounting',
    status: 'idle',
    frequency: 'Every 6 hours (Automated)',
    lastRun: new Date(Date.now() - 3600000 * 2).toISOString(),
    durationMs: 340,
    successMessage: '1,420 member wallets and 4,890 ledger events verified. 0 discrepancies.',
    metrics: { walletsChecked: 1420, verifiedCredits: 89450, discrepancyCount: 0 }
  },
  {
    id: 'task-voucher-cleanup',
    name: 'Expired Vouchers Auto-Sweep',
    description: 'Scans all issued member discount vouchers and archives expired tokens from active wallets.',
    category: 'maintenance',
    status: 'idle',
    frequency: 'Daily at 00:00 UTC',
    lastRun: new Date(Date.now() - 3600000 * 14).toISOString(),
    durationMs: 180,
    successMessage: 'Cleaned 12 expired partner vouchers. Active vouchers count: 48.',
    metrics: { vouchersScanned: 60, expiredCleaned: 12, activeRetained: 48 }
  },
  {
    id: 'task-merchant-settlement',
    name: 'Merchant Settlement & Payout Calculation',
    description: 'Aggregates redeemed points by store and calculates monthly credit reimbursement rates.',
    category: 'accounting',
    status: 'idle',
    frequency: 'Weekly on Mondays',
    lastRun: new Date(Date.now() - 3600000 * 24).toISOString(),
    durationMs: 520,
    successMessage: 'Generated settlement batch for 6 partner stores totaling $4,280.50.',
    metrics: { storesSettled: 6, totalCreditAmount: '$4,280.50', pendingInvoices: 0 }
  },
  {
    id: 'task-fraud-anomaly-scan',
    name: 'High-Velocity & Fraud Anomaly Detector',
    description: 'Runs heuristic checks on point-earning velocity, multi-scan collisions, and PIN failure rates.',
    category: 'security',
    status: 'idle',
    frequency: 'Real-time / Every 15 min',
    lastRun: new Date(Date.now() - 600000).toISOString(),
    durationMs: 290,
    successMessage: 'Scanned 1,280 recent events. All member velocity scores normal (100% Trust Index).',
    metrics: { scannedEvents: 1280, flaggedAccounts: 0, trustScore: '99.8%' }
  },
  {
    id: 'task-geofence-audit',
    name: 'Store Geofence Radius & Location Integrity',
    description: 'Validates GPS coordinates and verifies turn-by-turn navigation paths for all partner locations.',
    category: 'maintenance',
    status: 'idle',
    frequency: 'Daily',
    lastRun: new Date(Date.now() - 3600000 * 8).toISOString(),
    durationMs: 410,
    successMessage: 'All 6 store coordinates and walking/driving route caches validated.',
    metrics: { locationsAudited: 6, validRoutes: 18, warnings: 0 }
  },
  {
    id: 'task-firestore-backup',
    name: 'Firestore Database Health & Snapshot',
    description: 'Inspects Firestore indexes, performs live sync verification, and validates schema integrity.',
    category: 'database',
    status: 'idle',
    frequency: 'Every 12 hours',
    lastRun: new Date(Date.now() - 3600000 * 4).toISOString(),
    durationMs: 650,
    successMessage: 'Firestore connection healthy. 5 core collections synchronized.',
    metrics: { collections: 5, totalDocuments: 248, connectionLatency: '42ms' }
  }
];

export let adminTasksData: AdminTask[] = JSON.parse(JSON.stringify(INITIAL_ADMIN_TASKS));

export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    taskId: 'task-fraud-anomaly-scan',
    title: 'Velocity Scan Completed',
    type: 'task_exec',
    severity: 'success',
    details: 'Automated velocity detector ran across 1,280 transactions. 0 anomalies detected.',
    user: 'System Cron'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    taskId: 'task-ledger-reconcile',
    title: 'Ledger Audit Passed',
    type: 'task_exec',
    severity: 'success',
    details: 'Daily points ledger reconciliation completed. 1,420 member wallets verified with 0 discrepancies.',
    user: 'System Cron'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    title: 'Admin User Registered / Seeded',
    type: 'security',
    severity: 'info',
    details: 'Admin user "mambiadmin" initialized with administrative privileges and monitoring dashboard access.',
    user: 'mambiadmin'
  }
];

export let auditLogsData: SystemAuditLog[] = [...INITIAL_AUDIT_LOGS];

export let usersDB: RegisteredUser[] = [
  {
    username: 'mambiadmin',
    password: '409H!llarY409',
    fullName: 'Mambi Administrator',
    email: 'mambiadmin@omniloyalty.internal',
    passId: 'ADMIN-409-SF',
    pinCode: '40900',
    role: 'admin',
    pointsBalance: 50000,
    lifetimePoints: 120000,
    currentTier: 'Platinum',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    username: 'mambi409',
    password: '409H!llarY409',
    fullName: 'Alex Rivera',
    email: 'mambi409@example.com',
    passId: 'PASS-9842-SF',
    pinCode: '12345',
    role: 'user',
    pointsBalance: 1250,
    lifetimePoints: 2450,
    currentTier: 'Gold',
    status: 'active',
    createdAt: '2026-02-14T14:30:00.000Z'
  },
  {
    username: 'mayalin',
    password: 'userPass2026',
    fullName: 'Maya Lin',
    email: 'maya.lin@sfdesign.co',
    passId: 'PASS-5512-SF',
    pinCode: '33412',
    role: 'user',
    pointsBalance: 2480,
    lifetimePoints: 5800,
    currentTier: 'Platinum',
    status: 'active',
    createdAt: '2026-03-01T10:15:00.000Z'
  },
  {
    username: 'marcuschen',
    password: 'userPass2026',
    fullName: 'Marcus Chen',
    email: 'marcus.chen@techbay.io',
    passId: 'PASS-7729-SF',
    pinCode: '88219',
    role: 'user',
    pointsBalance: 890,
    lifetimePoints: 1600,
    currentTier: 'Silver',
    status: 'active',
    createdAt: '2026-04-18T16:45:00.000Z'
  },
  {
    username: 'sofiarodriguez',
    password: 'userPass2026',
    fullName: 'Sofia Rodriguez',
    email: 'sofia.r@valenciagoods.com',
    passId: 'PASS-3318-SF',
    pinCode: '45021',
    role: 'user',
    pointsBalance: 320,
    lifetimePoints: 480,
    currentTier: 'Bronze',
    status: 'active',
    createdAt: '2026-06-22T09:20:00.000Z'
  },
  {
    username: 'merchant_sf',
    password: 'posSecret2026',
    fullName: 'Artisanal Roastery POS',
    email: 'merchant@roastery.com',
    passId: 'MERCHANT-POS-101',
    pinCode: '12345',
    role: 'merchant',
    pointsBalance: 14500,
    lifetimePoints: 34000,
    currentTier: 'Platinum',
    status: 'active',
    createdAt: '2026-01-15T11:00:00.000Z'
  }
];

export async function initFirestoreSync() {
  if (!db) {
    console.log('[Firestore] Firebase Firestore not initialized, running in memory.');
    return;
  }

  try {
    console.log('[Firestore] Initializing data synchronization with Firestore...');

    // 1. Sync Users
    const usersColRef = collection(db, 'users');
    const usersSnap = await getDocs(usersColRef);
    if (usersSnap.empty) {
      console.log('[Firestore] Populating initial users to Firestore...');
      for (const u of usersDB) {
        await setDoc(doc(db, 'users', u.username.toLowerCase()), u);
      }
    } else {
      usersDB.length = 0;
      usersSnap.forEach((d) => {
        usersDB.push(d.data() as RegisteredUser);
      });

      // Ensure mambiadmin is always present in usersDB and Firestore
      const adminExists = usersDB.some((u) => u.username.toLowerCase() === 'mambiadmin');
      if (!adminExists) {
        const adminUser: RegisteredUser = {
          username: 'mambiadmin',
          password: '409H!llarY409',
          fullName: 'Mambi Administrator',
          email: 'mambiadmin@omniloyalty.internal',
          passId: 'ADMIN-409-SF',
          pinCode: '40900',
          role: 'admin'
        };
        usersDB.unshift(adminUser);
        await setDoc(doc(db, 'users', 'mambiadmin'), adminUser);
        console.log('[Firestore] Seeded mambiadmin to Firestore users collection.');
      }

      console.log(`[Firestore] Loaded ${usersDB.length} registered users from Firestore.`);
    }

    // 2. Sync Wallet
    const walletDocRef = doc(db, 'wallets', 'default');
    const walletSnap = await getDoc(walletDocRef);
    if (!walletSnap.exists()) {
      console.log('[Firestore] Populating default wallet to Firestore...');
      await setDoc(walletDocRef, walletData);
    } else {
      const data = walletSnap.data() as UserWallet;
      Object.assign(walletData, data);
      console.log(`[Firestore] Loaded wallet data from Firestore (Balance: ${walletData.pointsBalance} pts).`);
    }

    // 3. Sync Stores
    const storesColRef = collection(db, 'stores');
    const storesSnap = await getDocs(storesColRef);
    if (storesSnap.empty) {
      console.log('[Firestore] Populating initial stores to Firestore...');
      for (const s of storesData) {
        await setDoc(doc(db, 'stores', s.id), s);
      }
    } else {
      storesData.length = 0;
      storesSnap.forEach((d) => {
        storesData.push(d.data() as Store);
      });
      console.log(`[Firestore] Loaded ${storesData.length} stores from Firestore.`);
    }

    // 4. Sync Rewards
    const rewardsColRef = collection(db, 'rewards');
    const rewardsSnap = await getDocs(rewardsColRef);
    if (rewardsSnap.empty) {
      console.log('[Firestore] Populating initial rewards to Firestore...');
      for (const r of rewardsData) {
        await setDoc(doc(db, 'rewards', r.id), r);
      }
    } else {
      rewardsData.length = 0;
      rewardsSnap.forEach((d) => {
        rewardsData.push(d.data() as RewardItem);
      });
      console.log(`[Firestore] Loaded ${rewardsData.length} reward offers from Firestore.`);
    }

    // 5. Sync Transactions
    const txColRef = collection(db, 'transactions');
    const txSnap = await getDocs(txColRef);
    if (txSnap.empty) {
      console.log('[Firestore] Populating initial transactions to Firestore...');
      for (const tx of transactionsData) {
        await setDoc(doc(db, 'transactions', tx.id), tx);
      }
    } else {
      transactionsData.length = 0;
      txSnap.forEach((d) => {
        transactionsData.push(d.data() as Transaction);
      });
      transactionsData.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      console.log(`[Firestore] Loaded ${transactionsData.length} transactions from Firestore.`);
    }

    // 6. Sync Notifications
    const notifColRef = collection(db, 'notifications');
    const notifSnap = await getDocs(notifColRef);
    if (notifSnap.empty) {
      console.log('[Firestore] Populating initial notifications to Firestore...');
      for (const n of notificationsData) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }
    } else {
      notificationsData.length = 0;
      notifSnap.forEach((d) => {
        notificationsData.push(d.data() as NotificationMessage);
      });
      notificationsData.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      console.log(`[Firestore] Loaded ${notificationsData.length} notifications from Firestore.`);
    }

    // 7. Sync Posts
    const postsColRef = collection(db, 'posts');
    const postsSnap = await getDocs(postsColRef);
    if (postsSnap.empty) {
      console.log('[Firestore] Populating initial posts to Firestore...');
      for (const p of postsData) {
        await setDoc(doc(db, 'posts', p.id), p);
      }
    } else {
      postsData.length = 0;
      postsSnap.forEach((d) => {
        postsData.push(d.data() as AdminPost);
      });
      postsData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      console.log(`[Firestore] Loaded ${postsData.length} posts from Firestore.`);
    }

    console.log('[Firestore] ✅ All Firestore collections synchronized successfully!');
  } catch (err) {
    console.error('[Firestore] Error during Firestore initialization:', err);
  }
}

// User lookup helper function
export async function findUser(identifier: string): Promise<RegisteredUser | null> {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();

  // 1. Check in-memory usersDB first
  const localUser = usersDB.find(
    (u) =>
      u.username.toLowerCase() === clean ||
      (u.email && u.email.toLowerCase() === clean)
  );
  if (localUser) return localUser;

  // 2. Query Firestore directly if available
  if (db) {
    try {
      // Direct doc ID check (covers both username and email doc IDs)
      const userDocRef = doc(db, 'users', clean);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as RegisteredUser;
        if (!usersDB.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) {
          usersDB.push(u);
        }
        return u;
      }

      const usersColRef = collection(db, 'users');

      // Query by email
      const qEmail = query(usersColRef, where('email', '==', clean));
      const emailSnap = await getDocs(qEmail);
      if (!emailSnap.empty) {
        const u = emailSnap.docs[0].data() as RegisteredUser;
        if (!usersDB.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) {
          usersDB.push(u);
        }
        return u;
      }

      // Query by username
      const qUser = query(usersColRef, where('username', '==', clean));
      const userSnap2 = await getDocs(qUser);
      if (!userSnap2.empty) {
        const u = userSnap2.docs[0].data() as RegisteredUser;
        if (!usersDB.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) {
          usersDB.push(u);
        }
        return u;
      }

      // Final fallback: scan collection documents for case-insensitive match
      const allDocs = await getDocs(usersColRef);
      for (const d of allDocs.docs) {
        const u = d.data() as RegisteredUser;
        if (
          (u.username && u.username.toLowerCase() === clean) ||
          (u.email && u.email.toLowerCase() === clean)
        ) {
          if (!usersDB.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) {
            usersDB.push(u);
          }
          return u;
        }
      }
    } catch (err) {
      console.error('[Firestore] findUser error:', err);
    }
  }

  return null;
}

// Write helper functions
export async function persistUser(user: RegisteredUser) {
  if (!usersDB.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
    usersDB.push(user);
  }
  if (db) {
    try {
      // Save under username doc ID
      await setDoc(doc(db, 'users', user.username.toLowerCase()), user);
      // Save under email doc ID as well if email provided
      if (user.email && user.email.trim()) {
        await setDoc(doc(db, 'users', user.email.trim().toLowerCase()), user);
      }
    } catch (e) {
      console.error('Failed to persist user to Firestore:', e);
    }
  }
}

export async function persistWallet() {
  if (db) {
    try {
      await setDoc(doc(db, 'wallets', 'default'), walletData);
    } catch (e) {
      console.error('Failed to persist wallet to Firestore:', e);
    }
  }
}

export async function persistTransaction(tx: Transaction) {
  transactionsData.unshift(tx);
  if (db) {
    try {
      await setDoc(doc(db, 'transactions', tx.id), tx);
    } catch (e) {
      console.error('Failed to persist transaction to Firestore:', e);
    }
  }
}

export async function persistNotification(notif: NotificationMessage) {
  notificationsData.unshift(notif);
  if (db) {
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      console.error('Failed to persist notification to Firestore:', e);
    }
  }
}

export async function persistReward(reward: RewardItem) {
  rewardsData.unshift(reward);
  if (db) {
    try {
      await setDoc(doc(db, 'rewards', reward.id), reward);
    } catch (e) {
      console.error('Failed to persist reward to Firestore:', e);
    }
  }
}

export async function persistStore(store: Store) {
  const existingIdx = storesData.findIndex((s) => s.id === store.id);
  if (existingIdx >= 0) {
    storesData[existingIdx] = store;
  } else {
    storesData.push(store);
  }
  if (db) {
    try {
      await setDoc(doc(db, 'stores', store.id), store);
    } catch (e) {
      console.error('Failed to persist store to Firestore:', e);
    }
  }
}

export async function persistAuditLog(log: SystemAuditLog) {
  auditLogsData.unshift(log);
  if (db) {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      console.error('Failed to persist audit log to Firestore:', e);
    }
  }
}

export async function persistTask(task: AdminTask) {
  const idx = adminTasksData.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    adminTasksData[idx] = task;
  } else {
    adminTasksData.push(task);
  }
  if (db) {
    try {
      await setDoc(doc(db, 'admin_tasks', task.id), task);
    } catch (e) {
      console.error('Failed to persist task to Firestore:', e);
    }
  }
}

export async function persistPost(post: AdminPost) {
  const idx = postsData.findIndex((p) => p.id === post.id);
  if (idx >= 0) {
    postsData[idx] = post;
  } else {
    postsData.unshift(post);
  }
  if (db) {
    try {
      await setDoc(doc(db, 'posts', post.id), post);
    } catch (e) {
      console.error('Failed to persist post to Firestore:', e);
    }
  }
}

export async function deletePost(postId: string) {
  const idx = postsData.findIndex((p) => p.id === postId);
  if (idx >= 0) {
    postsData.splice(idx, 1);
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.error('Failed to delete post from Firestore:', e);
    }
  }
}

export async function deleteUser(username: string) {
  const idx = usersDB.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (idx >= 0) {
    const u = usersDB[idx];
    usersDB.splice(idx, 1);
    if (db) {
      try {
        await deleteDoc(doc(db, 'users', u.username.toLowerCase()));
        if (u.email) {
          await deleteDoc(doc(db, 'users', u.email.toLowerCase()));
        }
      } catch (e) {
        console.error('Failed to delete user from Firestore:', e);
      }
    }
  }
}

export { db, collection, getDocs, doc, setDoc, getDoc, deleteDoc };

export async function fetchLatestUsers(): Promise<RegisteredUser[]> {
  if (db) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const freshUsers: RegisteredUser[] = [];
        usersSnap.forEach((d) => {
          freshUsers.push(d.data() as RegisteredUser);
        });
        for (const u of freshUsers) {
          const idx = usersDB.findIndex((x) => x.username.toLowerCase() === u.username.toLowerCase());
          if (idx >= 0) {
            usersDB[idx] = { ...usersDB[idx], ...u };
          } else {
            usersDB.push(u);
          }
        }
      } else {
        // Seed default members if Firestore users collection is empty
        for (const u of usersDB) {
          await setDoc(doc(db, 'users', u.username.toLowerCase()), u);
        }
      }
    } catch (err) {
      console.warn('[Firestore] Live users fetch notice:', err);
    }
  }
  return usersDB;
}

