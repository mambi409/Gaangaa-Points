import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc
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
  NotificationMessage
} from '../src/types.js';

export interface RegisteredUser {
  username: string;
  password: string;
  fullName: string;
  email: string;
  passId: string;
  pinCode: string;
}

export let storesData: Store[] = [...INITIAL_STORES];
export let rewardsData: RewardItem[] = [...INITIAL_REWARDS];
export let walletData: UserWallet = JSON.parse(JSON.stringify(INITIAL_WALLET));
export let transactionsData: Transaction[] = [...INITIAL_TRANSACTIONS];
export let notificationsData: NotificationMessage[] = [...INITIAL_NOTIFICATIONS];
export let usersDB: RegisteredUser[] = [
  {
    username: 'mambi409',
    password: '409H!llarY409',
    fullName: 'Alex Rivera',
    email: 'mambi409@example.com',
    passId: 'PASS-9842-SF',
    pinCode: '12345'
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

    console.log('[Firestore] ✅ All Firestore collections synchronized successfully!');
  } catch (err) {
    console.error('[Firestore] Error during Firestore initialization:', err);
  }
}

// Write helper functions
export async function persistUser(user: RegisteredUser) {
  usersDB.push(user);
  if (db) {
    try {
      await setDoc(doc(db, 'users', user.username.toLowerCase()), user);
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
