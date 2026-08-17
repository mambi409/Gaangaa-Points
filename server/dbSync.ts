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
  status?: 'active' | 'pending_verification' | 'suspended';
  emailVerified?: boolean;
  verificationSentAt?: string;
  verificationCode?: string;
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

export let usersDB: RegisteredUser[] = [];

export async function initFirestoreSync() {
  if (!db) {
    console.log('[Firestore] Firebase Firestore not initialized, running in memory.');
    return;
  }

  try {
    console.log('[Firestore] Initializing data synchronization with Firestore...');

    // 1. Sync Users from Firestore
    const usersColRef = collection(db, 'users');
    const usersSnap = await getDocs(usersColRef);
    usersDB.length = 0;
    if (!usersSnap.empty) {
      const seen = new Set<string>();
      usersSnap.forEach((d) => {
        const u = d.data() as RegisteredUser;
        const key = (u.username || d.id).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          usersDB.push(u);
        }
      });
      console.log(`[Firestore] Loaded ${usersDB.length} registered users from Firestore.`);
    } else {
      console.log('[Firestore] 0 registered users found in Firestore users collection.');
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

    // 7. Sync Posts with strict deduplication
    const postsColRef = collection(db, 'posts');
    const postsSnap = await getDocs(postsColRef);
    if (postsSnap.empty) {
      console.log('[Firestore] Populating initial posts to Firestore...');
      for (const p of postsData) {
        await setDoc(doc(db, 'posts', p.id), p);
      }
    } else {
      const loaded: AdminPost[] = [];
      postsSnap.forEach((d) => {
        loaded.push(d.data() as AdminPost);
      });
      postsData.length = 0;
      postsData.push(...deduplicatePostsList(loaded));
      postsData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      console.log(`[Firestore] Loaded ${postsData.length} unique posts from Firestore.`);
    }

    // 8. Auto-Sync & Save 10 latest Gobiernu.cw news posts directly into Firestore (strictly unique)
    try {
      await syncGobiernuToFirestore(10);
    } catch (e) {
      console.warn('[Firestore] Initial Gobiernu.cw sync notice:', e);
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
  const existingIdx = usersDB.findIndex((u) => u.username.toLowerCase() === user.username.toLowerCase());
  if (existingIdx >= 0) {
    usersDB[existingIdx] = user;
  } else {
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

export async function deleteUser(identifier: string) {
  const clean = identifier.trim().toLowerCase();
  
  // Find all matching in-memory entries
  const matchedUsers = usersDB.filter(
    (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
  );

  // Remove from usersDB array
  usersDB = usersDB.filter(
    (u) => u.username.toLowerCase() !== clean && (!u.email || u.email.toLowerCase() !== clean)
  );

  if (db) {
    try {
      // 1. Direct doc deletion for identifier
      await deleteDoc(doc(db, 'users', clean));

      // 2. Direct doc deletion for known usernames/emails
      for (const u of matchedUsers) {
        if (u.username) {
          await deleteDoc(doc(db, 'users', u.username.toLowerCase()));
        }
        if (u.email) {
          await deleteDoc(doc(db, 'users', u.email.toLowerCase()));
        }
      }

      // 3. Deep scan to ensure no orphan documents remain in Firestore
      const usersColRef = collection(db, 'users');
      const allDocs = await getDocs(usersColRef);
      for (const d of allDocs.docs) {
        const data = d.data() as Partial<RegisteredUser>;
        const docIdMatches = d.id.toLowerCase() === clean;
        const usernameMatches = data.username && data.username.toLowerCase() === clean;
        const emailMatches = data.email && data.email.toLowerCase() === clean;
        const matchesAnyMatched = matchedUsers.some(
          (m) =>
            (data.username && data.username.toLowerCase() === m.username.toLowerCase()) ||
            (data.email && m.email && data.email.toLowerCase() === m.email.toLowerCase())
        );

        if (docIdMatches || usernameMatches || emailMatches || matchesAnyMatched) {
          await deleteDoc(doc(db, 'users', d.id));
        }
      }
    } catch (e) {
      console.error('Failed to delete user from Firestore:', e);
    }
  }
}

export { db, collection, getDocs, doc, setDoc, getDoc, deleteDoc };

export async function fetchLatestUsers(): Promise<RegisteredUser[]> {
  if (db) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersDB.length = 0;
      if (!usersSnap.empty) {
        const seen = new Set<string>();
        usersSnap.forEach((d) => {
          const u = d.data() as RegisteredUser;
          const key = (u.username || d.id).toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            usersDB.push(u);
          }
        });
      }
    } catch (err) {
      console.warn('[Firestore] Live users fetch notice:', err);
    }
  }
  return usersDB;
}

export function cleanGobiernuHtml(htmlStr: string): string {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to normalize titles for strict deduplication
export function normalizeTitleForDedupe(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, '') // keep only alphanumeric
    .trim();
}

// Helper function to normalize URLs for deduplication
export function normalizeUrlForDedupe(url?: string): string {
  if (!url) return '';
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/+$/, '')
    .split('?')[0]
    .split('#')[0]
    .trim();
}

// Master deduplicator for posts array
export function deduplicatePostsList(posts: AdminPost[]): AdminPost[] {
  const seenIds = new Set<string>();
  const seenExtIds = new Set<string | number>();
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: AdminPost[] = [];

  for (const post of posts) {
    if (!post || !post.title) continue;
    const normTitle = normalizeTitleForDedupe(post.title);
    const normUrl = normalizeUrlForDedupe(post.sourceUrl);
    const extId = post.externalId;

    // Check all duplicate conditions
    if (post.id && seenIds.has(post.id)) continue;
    if (extId !== undefined && extId !== null && seenExtIds.has(extId)) continue;
    if (normUrl && normUrl.length > 8 && seenUrls.has(normUrl)) continue;
    if (normTitle && normTitle.length > 6 && seenTitles.has(normTitle)) continue;

    if (post.id) seenIds.add(post.id);
    if (extId !== undefined && extId !== null) seenExtIds.add(extId);
    if (normUrl && normUrl.length > 8) seenUrls.add(normUrl);
    if (normTitle && normTitle.length > 6) seenTitles.add(normTitle);

    result.push(post);
  }

  return result;
}

export interface GovernmentNewsDiffResult {
  hasNewNews: boolean;
  newPosts: AdminPost[];
  modifiedPosts: AdminPost[];
  existingPosts: AdminPost[];
}

/**
 * Compares incoming news from Gobiernu.cw against existing stored items.
 * If every fetched article already exists with identical timestamps/content, hasNewNews is false.
 */
export function detectGovernmentNewsDiff(
  existingPosts: AdminPost[],
  incomingPosts: AdminPost[]
): GovernmentNewsDiffResult {
  const existingMap = new Map<string, AdminPost>();
  for (const ep of existingPosts) {
    if (ep.id) existingMap.set(ep.id, ep);
    if (ep.externalId) existingMap.set(`gobiernu-${ep.externalId}`, ep);
  }

  const newPosts: AdminPost[] = [];
  const modifiedPosts: AdminPost[] = [];

  for (const ip of incomingPosts) {
    const existing = existingMap.get(ip.id) || (ip.externalId ? existingMap.get(`gobiernu-${ip.externalId}`) : undefined);
    if (!existing) {
      newPosts.push(ip);
    } else {
      const existingDate = new Date(existing.updatedAt || existing.createdAt).getTime();
      const incomingDate = new Date(ip.updatedAt || ip.createdAt).getTime();
      const titleChanged = existing.title.trim() !== ip.title.trim();
      const excerptChanged = (existing.excerpt || '').trim() !== (ip.excerpt || '').trim();

      if (incomingDate > existingDate || titleChanged || excerptChanged) {
        modifiedPosts.push(ip);
      }
    }
  }

  const hasNewNews = newPosts.length > 0 || modifiedPosts.length > 0;
  return {
    hasNewNews,
    newPosts,
    modifiedPosts,
    existingPosts
  };
}

export async function fetchGobiernuNieuwDirect(limit = 15): Promise<{
  posts: AdminPost[];
  hasNewNews: boolean;
  newCount: number;
  message: string;
}> {
  const existingGovPosts = postsData.filter(
    (p) =>
      p.id?.startsWith('gobiernu-') ||
      p.category === 'Government news' ||
      p.subCategory === 'Government news' ||
      p.sourceType === 'Government news' ||
      p.sourceUrl?.includes('gobiernu.cw/nieuw/')
  );

  try {
    console.log('[Gobiernu News] 🇨🇼 Fetching direct government feed from: https://gobiernu.cw/nieuw/ ...');
    let data: any[] = [];

    // Attempt 1: Fetch with _embed to get media and authors
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://gobiernu.cw/wp-json/wp/v2/nieuw?per_page=${Math.max(limit, 10)}&_embed`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          data = json;
        }
      }
    } catch (_e) {
      // fallback
    }

    // Attempt 2: Direct fast fetch
    if (!data || data.length === 0) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://gobiernu.cw/wp-json/wp/v2/nieuw?per_page=${Math.max(limit, 10)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          data = json;
        }
      }
    }

    // If fetch failed or no items returned, leave as is
    if (!data || data.length === 0) {
      console.log(`[Gobiernu News] ℹ️ No items returned from https://gobiernu.cw/nieuw/ — leaving existing ${existingGovPosts.length} government posts as is.`);
      return {
        posts: existingGovPosts.slice(0, limit),
        hasNewNews: false,
        newCount: 0,
        message: 'No response from server; left existing feed as is.'
      };
    }

    const fetchedPosts: AdminPost[] = data.slice(0, limit).map((p, idx) => {
      const title = cleanGobiernuHtml(p.title?.rendered || 'Notisia di Gobiernu di Kòrsou');
      const rawContent = cleanGobiernuHtml(p.content?.rendered || p.excerpt?.rendered || '');
      const excerpt = cleanGobiernuHtml(p.excerpt?.rendered || (rawContent.slice(0, 200) + '...'));

      let media = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      if (!media && p.content?.rendered) {
        const imgMatch = p.content.rendered.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) {
          media = imgMatch[1];
        }
      }
      if (!media || typeof media !== 'string' || !media.startsWith('http')) {
        media = 'https://gobiernu.cw/wp-content/uploads/2019/04/gobiernu_2x.png';
      }

      const canonicalId = `gobiernu-${p.id}`;
      const permalink = p.link || `https://gobiernu.cw/nieuw/${p.slug || p.id}/`;

      return {
        id: canonicalId,
        externalId: p.id,
        title,
        content: rawContent || excerpt,
        excerpt,
        category: 'Announcement',
        subCategory: 'Government news',
        sourceType: 'Government news',
        imageUrl: media,
        author: 'Gobiernu di Kòrsou',
        targetAudience: 'all',
        status: 'published',
        createdAt: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
        updatedAt: p.modified ? new Date(p.modified).toISOString() : undefined,
        likesCount: 0,
        featured: idx === 0,
        sourceUrl: permalink
      };
    });

    const diff = detectGovernmentNewsDiff(existingGovPosts, fetchedPosts);

    // If no new news, LEAVE AS IS
    if (!diff.hasNewNews) {
      console.log(`[Gobiernu News] ℹ️ Checked https://gobiernu.cw/nieuw/ — no new news found. Retaining existing feed (${existingGovPosts.length} posts) as is.`);
      return {
        posts: existingGovPosts.slice(0, limit),
        hasNewNews: false,
        newCount: 0,
        message: 'No new news published on Gobiernu.cw; retained existing feed as is.'
      };
    }

    // New news found: update store
    console.log(`[Gobiernu News] 📰 New news detected on https://gobiernu.cw/nieuw/: ${diff.newPosts.length} new, ${diff.modifiedPosts.length} modified.`);
    if (db) {
      for (const post of [...diff.newPosts, ...diff.modifiedPosts]) {
        await setDoc(doc(db, 'posts', post.id), post).catch(() => {});
      }
    }

    const merged = deduplicatePostsList([...fetchedPosts, ...existingGovPosts]).slice(0, limit);
    return {
      posts: merged,
      hasNewNews: true,
      newCount: diff.newPosts.length,
      message: `Updated with ${diff.newPosts.length} new government post(s).`
    };
  } catch (err) {
    console.error('[Gobiernu News] Error fetching directly from https://gobiernu.cw/nieuw/:', err);
    return {
      posts: existingGovPosts.slice(0, limit),
      hasNewNews: false,
      newCount: 0,
      message: 'Fetch error; left existing feed as is.'
    };
  }
}

export async function syncGobiernuToFirestore(totalLimit = 10): Promise<{
  posts: AdminPost[];
  hasNewNews: boolean;
  newPostsCount: number;
  modifiedPostsCount: number;
  message: string;
}> {
  const governmentEndpoints = [
    { key: 'nieuw', name: 'Notisia General' },
    { key: 'ministers_nieuw', name: 'Notisia di Ministernan' },
    { key: 'konseho_niews', name: 'Notisia di Konseho' },
    { key: 'landing-page', name: 'Landing Pages & Proklamashon' },
    { key: 'breaking-news', name: 'Breaking News' },
    { key: 'optima_forma', name: 'Óptima Forma' },
    { key: 'landscourant', name: 'Landscourant' },
    { key: 'posts', name: 'Publikashonnan' }
  ];

  // Retrieve current government posts from memory & Firestore
  const existingGovPosts = postsData.filter(
    (p) =>
      p.id?.startsWith('gobiernu-') ||
      p.category === 'Government news' ||
      p.subCategory === 'Government news' ||
      p.sourceType === 'Government news' ||
      p.sourceUrl?.includes('gobiernu.cw')
  );

  try {
    console.log('[Firestore] 🇨🇼 Checking Gobiernu.cw for latest news items under "Government news"...');
    const rawItems: any[] = [];

    // Concurrently fetch from all government subcategory endpoints with dual-strategy
    await Promise.allSettled(
      governmentEndpoints.map(async (ep) => {
        // Attempt 1: Fetch with _embed
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(`https://gobiernu.cw/wp-json/wp/v2/${ep.key}?per_page=15&_embed`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              for (const item of data) {
                if (item && item.id && item.title?.rendered) {
                  rawItems.push({ ...item, _sourceEndpoint: ep.key });
                }
              }
              return;
            }
          }
        } catch (_err) {
          // Timeout or error on _embed, fallback to fast direct fetch
        }

        // Attempt 2: Fallback without _embed (very fast, <300ms)
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(`https://gobiernu.cw/wp-json/wp/v2/${ep.key}?per_page=15`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              for (const item of data) {
                if (item && item.id && item.title?.rendered) {
                  rawItems.push({ ...item, _sourceEndpoint: ep.key });
                }
              }
            }
          }
        } catch (fallbackErr) {
          console.warn(`[Firestore] Notice on endpoint ${ep.key}:`, (fallbackErr as any)?.message);
        }
      })
    );

    // If no items fetched, leave existing news as is
    if (rawItems.length === 0) {
      console.warn('[Firestore] No items retrieved from Gobiernu.cw endpoints. Leaving existing posts as is.');
      return {
        posts: existingGovPosts.slice(0, totalLimit),
        hasNewNews: false,
        newPostsCount: 0,
        modifiedPostsCount: 0,
        message: 'Could not reach server; left existing government news as is.'
      };
    }

    // Deduplicate all collected items across all subcategories by ID, normalized title, and normalized URL
    const seenExtIds = new Set<string | number>();
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueRawItems: any[] = [];

    for (const p of rawItems) {
      const titleCleaned = cleanGobiernuHtml(p.title?.rendered || '');
      const normTitle = normalizeTitleForDedupe(titleCleaned);
      const normUrl = normalizeUrlForDedupe(p.link);
      const extId = p.id;

      if (extId !== undefined && extId !== null && seenExtIds.has(extId)) continue;
      if (normTitle && normTitle.length > 6 && seenTitles.has(normTitle)) continue;
      if (normUrl && normUrl.length > 8 && seenUrls.has(normUrl)) continue;

      if (extId !== undefined && extId !== null) seenExtIds.add(extId);
      if (normTitle && normTitle.length > 6) seenTitles.add(normTitle);
      if (normUrl && normUrl.length > 8) seenUrls.add(normUrl);

      uniqueRawItems.push(p);
    }

    // Sort all aggregated items strictly descending by publication date
    uniqueRawItems.sort((a, b) => {
      const dateA = new Date(a.date || a.modified || 0).getTime();
      const dateB = new Date(b.date || b.modified || 0).getTime();
      return dateB - dateA;
    });

    // Take strictly the top 10 latest items from all subcategories combined
    const top10Raw = uniqueRawItems.slice(0, totalLimit);

    const fetchedPosts: AdminPost[] = top10Raw.map((p, idx) => {
      const title = cleanGobiernuHtml(p.title?.rendered || 'Notisia di Gobiernu di Kòrsou');
      const rawContent = cleanGobiernuHtml(p.content?.rendered || p.excerpt?.rendered || '');
      const excerpt = cleanGobiernuHtml(p.excerpt?.rendered || (rawContent.slice(0, 200) + '...'));

      // Check for embedded media, inline image in content, or fallback to official Government emblem
      let media = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      if (!media && p.content?.rendered) {
        const imgMatch = p.content.rendered.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) {
          media = imgMatch[1];
        }
      }
      if (!media || typeof media !== 'string' || !media.startsWith('http')) {
        media = 'https://gobiernu.cw/wp-content/uploads/2019/04/gobiernu_2x.png';
      }

      // Canonical deterministic ID: gobiernu-${p.id}
      const canonicalId = `gobiernu-${p.id}`;

      return {
        id: canonicalId,
        externalId: p.id,
        title,
        content: rawContent || excerpt,
        excerpt,
        category: 'Announcement',
        subCategory: 'Government news',
        sourceType: 'Government news',
        imageUrl: media,
        author: 'Gobiernu di Kòrsou',
        targetAudience: 'all',
        status: 'published',
        createdAt: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
        updatedAt: p.modified ? new Date(p.modified).toISOString() : undefined,
        likesCount: 0,
        featured: idx === 0,
        sourceUrl: p.link || 'https://gobiernu.cw'
      };
    });

    // Detect if there is ANY NEW or MODIFIED news
    const diff = detectGovernmentNewsDiff(existingGovPosts, fetchedPosts);

    // =========================================================================
    // IF NO NEW NEWS: LEAVE AS IS
    // =========================================================================
    if (!diff.hasNewNews) {
      console.log(`[Gobiernu News] ℹ️ Checked https://gobiernu.cw/nieuw/ — no new news found (${fetchedPosts.length} articles identical to stored posts). Leaving existing feed as is.`);

      // Update sync metadata indicating checked and verified without modifying post documents
      if (db) {
        try {
          await setDoc(
            doc(db, 'system', 'gobiernu_sync_status'),
            {
              lastCheckedAt: new Date().toISOString(),
              hasNewNews: false,
              status: 'up_to_date',
              message: 'No new news detected on Gobiernu.cw; existing feed left as is.',
              totalExisting: existingGovPosts.length,
              topArticle: existingGovPosts[0]?.title || ''
            },
            { merge: true }
          );
        } catch (_statusErr) {}
      }

      return {
        posts: existingGovPosts.slice(0, totalLimit),
        hasNewNews: false,
        newPostsCount: 0,
        modifiedPostsCount: 0,
        message: 'No new news found on Gobiernu.cw. Existing feed left as is.'
      };
    }

    // =========================================================================
    // IF NEW NEWS FOUND: PERSIST NEW/MODIFIED AND SAFELY PRUNE
    // =========================================================================
    console.log(`[Gobiernu News] 📰 New news detected! ${diff.newPosts.length} new article(s) and ${diff.modifiedPosts.length} updated article(s). Syncing to Firestore...`);

    const todayYMD = new Date().toISOString().slice(0, 10);
    const activeTop10Ids = new Set(fetchedPosts.map((p) => p.id));

    // Safely prune older government posts from Firestore that dropped off top 10
    if (db) {
      try {
        const existingPostsSnap = await getDocs(collection(db, 'posts'));
        for (const docSnap of existingPostsSnap.docs) {
          const docId = docSnap.id;
          if (docId.startsWith('gobiernu-') && !activeTop10Ids.has(docId)) {
            await deleteDoc(doc(db, 'posts', docId)).catch(() => {});
          }
        }
      } catch (pruneErr) {
        console.warn('[Firestore] Notice during pruning of older government news docs:', pruneErr);
      }
    }

    // Save only new and modified posts to Firestore
    for (const post of [...diff.newPosts, ...diff.modifiedPosts]) {
      if (db) {
        try {
          await setDoc(doc(db, 'posts', post.id), post);
        } catch (dbErr) {
          console.error(`[Firestore] Error persisting post ${post.id} to Firestore:`, dbErr);
        }
      }
    }

    // Send push notification ONLY for genuinely new posts published today
    for (const post of diff.newPosts) {
      const postDateYMD = new Date(post.createdAt).toISOString().slice(0, 10);
      if (postDateYMD === todayYMD) {
        const notifId = `notif-news-${post.id}`;
        const alreadyExists = notificationsData.some((n) => n.id === notifId);
        if (!alreadyExists) {
          const cleanTitle = post.title.trim();
          const notif: NotificationMessage = {
            id: notifId,
            title: `NEWS PUSH: ${cleanTitle.slice(0, 70)}${cleanTitle.length > 70 ? '...' : ''}`,
            body: post.excerpt ? post.excerpt.slice(0, 140) : post.content.slice(0, 140),
            type: 'system',
            timestamp: post.createdAt || new Date().toISOString(),
            read: false,
            targetRole: 'all'
          };
          await persistNotification(notif);
          console.log(`[Notification Engine] 📰 Sent same-day NEWS PUSH notification for: "${cleanTitle.slice(0, 45)}"`);
        }
      }
    }

    // Update in-memory postsData: retain non-government posts (promos/updates) + the 10 Government News posts
    const nonGovPosts = postsData.filter(
      (p) =>
        !p.id?.startsWith('gobiernu-') &&
        p.author !== 'Gobiernu di Kòrsou' &&
        !p.author?.toLowerCase().includes('gobiernu') &&
        !p.sourceUrl?.includes('gobiernu.cw')
    );
    const combinedPosts = [...fetchedPosts, ...nonGovPosts];
    postsData.length = 0;
    postsData.push(...deduplicatePostsList(combinedPosts));
    postsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Save Daily Scan Status metadata to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'system', 'gobiernu_sync_status'), {
          lastScannedAt: new Date().toISOString(),
          hasNewNews: true,
          status: 'updated',
          newArticlesAdded: diff.newPosts.length,
          modifiedArticles: diff.modifiedPosts.length,
          category: 'Government news',
          totalScannedAcrossSubcategories: uniqueRawItems.length,
          savedCount: fetchedPosts.length,
          topArticle: fetchedPosts[0]?.title || '',
          endpointsScanned: governmentEndpoints.map((e) => e.key)
        });
      } catch (statusErr) {
        console.warn('[Firestore] Notice saving sync status:', statusErr);
      }
    }

    console.log(`[Firestore] ✅ Consolidated ${fetchedPosts.length} latest articles from all subcategories under "Government news" in Firebase Firestore.`);
    return {
      posts: fetchedPosts,
      hasNewNews: true,
      newPostsCount: diff.newPosts.length,
      modifiedPostsCount: diff.modifiedPosts.length,
      message: `Updated with ${diff.newPosts.length} new government post(s).`
    };
  } catch (err) {
    console.warn('[Firestore] Notice: Government news aggregation error:', err);
    return {
      posts: existingGovPosts.slice(0, totalLimit),
      hasNewNews: false,
      newPostsCount: 0,
      modifiedPostsCount: 0,
      message: 'Aggregation error; retained existing feed as is.'
    };
  }
}

