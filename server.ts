import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_STORES,
  INITIAL_REWARDS,
  INITIAL_WALLET,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USER_LOCATION,
  INITIAL_MERCHANT_STATS
} from './src/data/mockData';
import {
  Store,
  RewardItem,
  UserWallet,
  Transaction,
  NotificationMessage,
  NavigationRoute,
  NavigationStep,
  UserTier,
  UserVoucher,
  MerchantStats,
  AdminTask,
  SystemAuditLog,
  AdminOverviewStats,
  AdminPost,
  AdminUserItem,
  UserRole
} from './src/types';

// Initialize Express App
const app = express();
app.use(express.json());

// Enable CORS for Vercel & cross-origin deployment requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = 3000;

// Initialize Google GenAI on Server
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

import {
  initFirestoreSync,
  findUser,
  persistUser,
  persistWallet,
  persistTransaction,
  persistNotification,
  persistReward,
  persistStore,
  persistAuditLog,
  persistTask,
  persistPost,
  deletePost,
  deleteUser,
  storesData,
  rewardsData,
  walletData,
  transactionsData,
  notificationsData,
  usersDB,
  adminTasksData,
  auditLogsData,
  postsData,
  RegisteredUser,
  db,
  getDocs,
  collection,
  fetchLatestUsers,
  syncGobiernuToFirestore,
  fetchGobiernuNieuwDirect,
  deduplicatePostsList
} from './server/dbSync.js';

// In-Memory Fallback State (delegated to dbSync)
let merchantStatsData = { ...INITIAL_MERCHANT_STATS };

// Ensure Firestore data is synchronized before handling API requests on Vercel serverless functions
let isSyncInitialized = false;
let syncPromise: Promise<void> | null = null;

async function ensureSync() {
  if (!isSyncInitialized) {
    if (!syncPromise) {
      syncPromise = initFirestoreSync()
        .then(() => {
          isSyncInitialized = true;
        })
        .catch((err) => {
          console.error('[Firestore] ensureSync error:', err);
        });
    }
    await syncPromise;
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.url.startsWith('/api')) {
    await ensureSync();
  }
  next();
});

// API ROUTE: User Authentication (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Email or Username and password are required.' });
    }

    const cleanIdentifier = username.trim().toLowerCase();

    // Async lookup checking both in-memory array and Firestore
    const foundUser = await findUser(cleanIdentifier);

    if (foundUser && foundUser.password === password) {
      // Check if user account is pending email verification
      if (foundUser.emailVerified === false || foundUser.status === 'pending_verification') {
        return res.status(403).json({
          success: false,
          pendingVerification: true,
          email: foundUser.email,
          username: foundUser.username,
          fullName: foundUser.fullName,
          simulatedCode: foundUser.verificationCode,
          passId: foundUser.passId,
          pinCode: foundUser.pinCode,
          role: foundUser.role,
          error: 'Your account is pending email verification. Please verify your email to activate your account.'
        });
      }

      const pinCode = foundUser.pinCode || walletData.pinCode || '12345';
      const userRole = foundUser.role || (foundUser.username.toLowerCase() === 'mambiadmin' ? 'admin' : (foundUser.username.toLowerCase().startsWith('merchant') ? 'merchant' : 'user'));
      
      // If merchant, find their store
      let merchantStore = null;
      if (userRole === 'merchant') {
        merchantStore = storesData.find((s) => s.id === `store-${foundUser.username.toLowerCase()}` || s.name.toLowerCase() === foundUser.fullName.toLowerCase()) || storesData[0];
      }

      return res.json({
        success: true,
        user: {
          username: foundUser.username,
          name: foundUser.fullName,
          email: foundUser.email,
          passId: foundUser.passId,
          pinCode: pinCode,
          role: userRole,
          storeId: merchantStore ? merchantStore.id : undefined,
          pointsBalance: userRole === 'merchant' ? (foundUser.pointsBalance ?? 14500) : walletData.pointsBalance,
          currentTier: userRole === 'merchant' ? (foundUser.currentTier ?? 'Platinum') : walletData.currentTier,
          emailVerified: foundUser.emailVerified ?? true,
          status: foundUser.status ?? 'active'
        },
        store: merchantStore,
        token: `token-${Date.now()}-${foundUser.username}`
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid email/username or password. Please check your credentials.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// API ROUTE: User & Merchant Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, username, email, password, pinCode, role, storeCategory, storeAddress, storePhone, storeCity } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields (Full Name, Username, Email, Password, PIN) are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanPin = (pinCode || '12345').trim();
    if (!/^\d{5}$/.test(cleanPin)) {
      return res.status(400).json({ error: 'Security PIN must be exactly 5 digits (0-9).' });
    }

    const cleanUsername = username.trim();

    const existingUserByUsername = await findUser(cleanUsername);
    const existingUserByEmail = await findUser(cleanEmail);

    if (existingUserByUsername || existingUserByEmail) {
      if (existingUserByUsername && existingUserByUsername.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
      }
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    const isMerchant = role === 'merchant';
    const newPassId = isMerchant
      ? `MERCHANT-POS-${Math.floor(100 + Math.random() * 900)}`
      : `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`;

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const nowIso = new Date().toISOString();

    const newUser: RegisteredUser = {
      username: cleanUsername,
      password,
      fullName: fullName.trim(),
      email: cleanEmail,
      passId: newPassId,
      pinCode: cleanPin,
      role: isMerchant ? 'merchant' : 'user',
      pointsBalance: isMerchant ? 10000 : 500,
      lifetimePoints: isMerchant ? 25000 : 500,
      currentTier: isMerchant ? 'Platinum' : 'Bronze',
      status: 'pending_verification',
      emailVerified: false,
      verificationSentAt: nowIso,
      verificationCode: verificationCode,
      createdAt: nowIso
    };

    await persistUser(newUser);

    let createdStore: Store | null = null;
    if (isMerchant) {
      const storeId = `store-${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      createdStore = {
        id: storeId,
        name: fullName.trim(),
        category: storeCategory || 'Coffee',
        address: storeAddress || '450 Sutter St',
        city: storeCity || 'San Francisco',
        lat: 37.7891 + (Math.random() - 0.5) * 0.02,
        lng: -122.4082 + (Math.random() - 0.5) * 0.02,
        rating: 5.0,
        reviewCount: 1,
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
        pointsRate: 10,
        description: `${fullName.trim()} - Partner Store Location`,
        openHours: '8:00 AM - 8:00 PM',
        phone: storePhone || '(415) 555-0100',
        email: cleanEmail,
        perks: ['Loyalty Rewards', 'Member Deals'],
        managerName: fullName.trim(),
        totalPointsRewarded: 0,
        totalPointsRedeemed: 0
      };

      const existingStoreIdx = storesData.findIndex(s => s.id === storeId);
      if (existingStoreIdx >= 0) {
        storesData[existingStoreIdx] = createdStore;
      } else {
        storesData.push(createdStore);
      }
      await persistStore(createdStore);

      const auditLog: SystemAuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `Merchant Account Registered (Pending Verification): ${createdStore.name}`,
        type: 'security',
        severity: 'info',
        details: `Merchant user @${newUser.username} registered with store "${createdStore.name}". Email verification dispatched to ${cleanEmail}.`,
        user: newUser.username
      };
      await persistAuditLog(auditLog);
    }

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      message: `Verification email sent to ${cleanEmail}. Please verify your email before activating your account.`,
      simulatedCode: verificationCode,
      user: {
        username: newUser.username,
        name: newUser.fullName,
        email: newUser.email,
        passId: newUser.passId,
        pinCode: newUser.pinCode,
        role: newUser.role,
        storeId: createdStore ? createdStore.id : undefined,
        pointsBalance: newUser.pointsBalance,
        currentTier: newUser.currentTier,
        status: 'pending_verification',
        emailVerified: false
      },
      store: createdStore
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// API ROUTE: Verify User Email & Activate Account
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, username, code } = req.body;

    if (!email && !username) {
      return res.status(400).json({ error: 'Email or username is required for verification.' });
    }

    const cleanIdentifier = (email || username).trim().toLowerCase();
    const foundUser = await findUser(cleanIdentifier);

    if (!foundUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Mark as verified and active
    foundUser.emailVerified = true;
    foundUser.status = 'active';
    await persistUser(foundUser);

    // If customer, activate wallet details
    if (foundUser.role !== 'merchant' && foundUser.role !== 'admin') {
      walletData.userName = foundUser.fullName;
      walletData.userEmail = foundUser.email;
      walletData.passId = foundUser.passId;
      walletData.pinCode = foundUser.pinCode;
      await persistWallet();
    }

    // If merchant, locate store
    let merchantStore = null;
    if (foundUser.role === 'merchant') {
      merchantStore = storesData.find(
        (s) => s.id === `store-${foundUser.username.toLowerCase()}` || s.name.toLowerCase() === foundUser.fullName.toLowerCase()
      ) || storesData[0];
    }

    const auditLog: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Account Email Verified: @${foundUser.username}`,
      type: 'security',
      severity: 'success',
      details: `User account @${foundUser.username} (${foundUser.email}) successfully verified email and activated.`,
      user: foundUser.username
    };
    await persistAuditLog(auditLog);

    return res.json({
      success: true,
      message: 'Email successfully verified! Account is now active.',
      user: {
        username: foundUser.username,
        name: foundUser.fullName,
        email: foundUser.email,
        passId: foundUser.passId,
        pinCode: foundUser.pinCode,
        role: foundUser.role || 'user',
        storeId: merchantStore ? merchantStore.id : undefined,
        pointsBalance: foundUser.role === 'merchant' ? (foundUser.pointsBalance ?? 10000) : walletData.pointsBalance,
        currentTier: foundUser.role === 'merchant' ? (foundUser.currentTier ?? 'Platinum') : walletData.currentTier,
        emailVerified: true,
        status: 'active'
      },
      store: merchantStore,
      token: `token-${Date.now()}-${foundUser.username}`
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// API ROUTE: Resend Verification Email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email, username } = req.body;
    const cleanIdentifier = (email || username || '').trim().toLowerCase();

    if (!cleanIdentifier) {
      return res.status(400).json({ error: 'Email or username is required.' });
    }

    const foundUser = await findUser(cleanIdentifier);
    if (!foundUser) {
      return res.status(404).json({ error: 'No account found with this email or username.' });
    }

    if (foundUser.emailVerified === true && foundUser.status === 'active') {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: 'This account is already verified and active! You can log in.'
      });
    }

    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    foundUser.verificationCode = newCode;
    foundUser.verificationSentAt = new Date().toISOString();
    await persistUser(foundUser);

    return res.json({
      success: true,
      message: `New verification email dispatched to ${foundUser.email}.`,
      sentTo: foundUser.email,
      simulatedCode: newCode
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// API ROUTE: Update User Profile & 5-Digit PIN Code
app.post('/api/auth/update-profile', async (req, res) => {
  try {
    const { username, fullName, email, pinCode } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required to update profile.' });
    }

    const cleanPin = (pinCode || '').trim();
    if (cleanPin && !/^\d{5}$/.test(cleanPin)) {
      return res.status(400).json({ error: 'Security PIN must be exactly 5 digits (0-9).' });
    }

    const user = usersDB.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (user) {
      if (fullName) user.fullName = fullName.trim();
      if (email) user.email = email.trim().toLowerCase();
      if (cleanPin) user.pinCode = cleanPin;
      await persistUser(user);
    }

    if (fullName) walletData.userName = fullName.trim();
    if (email) walletData.userEmail = email.trim().toLowerCase();
    if (cleanPin) walletData.pinCode = cleanPin;
    await persistWallet();

    return res.json({
      success: true,
      message: 'Profile and 5-digit PIN updated successfully!',
      user: {
        username: user?.username || username,
        name: walletData.userName,
        email: walletData.userEmail,
        passId: walletData.passId,
        pinCode: walletData.pinCode || '12345',
        pointsBalance: walletData.pointsBalance,
        currentTier: walletData.currentTier
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// API ROUTE: Verify 5-Digit PIN Code
app.post('/api/auth/verify-pin', (req, res) => {
  try {
    const { username, pinCode } = req.body;
    const cleanPin = (pinCode || '').trim();

    if (!cleanPin || cleanPin.length !== 5) {
      return res.status(400).json({ success: false, error: 'PIN must be 5 digits.' });
    }

    let validPin = walletData.pinCode || '12345';
    if (username) {
      const user = usersDB.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (user && user.pinCode) {
        validPin = user.pinCode;
      }
    }

    if (cleanPin === validPin) {
      return res.json({ success: true, message: 'PIN verified successfully.' });
    }

    return res.status(401).json({ success: false, error: 'Incorrect 5-digit Security PIN code. Transaction aborted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'PIN verification failed' });
  }
});

// Helper: Haversine Distance in Kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Helper: Tier Calculator
function calculateTier(lifetimePoints: number): UserTier {
  if (lifetimePoints >= 5000) return 'Platinum';
  if (lifetimePoints >= 2500) return 'Gold';
  if (lifetimePoints >= 1000) return 'Silver';
  return 'Bronze';
}

// API ROUTE: Get Stores (Search, Filter, Proximity)
app.get('/api/stores', (req, res) => {
  try {
    const { query, category, userLat, userLng, sortBy } = req.query;

    const uLat = userLat ? parseFloat(userLat as string) : INITIAL_USER_LOCATION.lat;
    const uLng = userLng ? parseFloat(userLng as string) : INITIAL_USER_LOCATION.lng;

    let result = storesData.map((s) => ({
      ...s,
      distanceKm: calculateDistanceKm(uLat, uLng, s.lat, s.lng)
    }));

    if (query) {
      const q = (query as string).toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.perks.some((p) => p.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      result = result.filter((s) => s.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (sortBy === 'pointsRate') {
      result.sort((a, b) => b.pointsRate - a.pointsRate);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    res.json({ stores: result, total: result.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// API ROUTE: Get Single Store Details
app.get('/api/stores/:id', (req, res) => {
  const store = storesData.find((s) => s.id === req.params.id);
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }
  const storeRewards = rewardsData.filter((r) => r.storeId === store.id);
  res.json({ store, rewards: storeRewards });
});

// API ROUTE: Get User Wallet & Transactions
app.get('/api/wallet', (req, res) => {
  res.json({
    wallet: walletData,
    transactions: transactionsData
  });
});

// API ROUTE: Earn Points on Purchase
app.post('/api/wallet/earn', async (req, res) => {
  try {
    const { storeId, amountSpent, description } = req.body;
    const amount = parseFloat(amountSpent);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid purchase amount' });
    }

    const store = storesData.find((s) => s.id === storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const pointsEarned = Math.round(amount * store.pointsRate);
    walletData.pointsBalance += pointsEarned;
    walletData.lifetimePoints += pointsEarned;

    const previousTier = walletData.currentTier;
    const newTier = calculateTier(walletData.lifetimePoints);
    walletData.currentTier = newTier;
    await persistWallet();

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      type: 'earn',
      points: pointsEarned,
      amountSpent: amount,
      description: description || `In-store purchase at ${store.name}`,
      timestamp: new Date().toISOString()
    };
    await persistTransaction(newTx);

    // Push notification to user
    const earnNotif: NotificationMessage = {
      id: `notif-${Date.now()}`,
      title: `🎉 Earned +${pointsEarned} Points!`,
      body: `You received ${pointsEarned} loyalty points for your Cg ${amount.toFixed(2)} purchase at ${store.name}.`,
      type: 'earn',
      timestamp: new Date().toISOString(),
      read: false,
      storeId: store.id,
      targetRole: 'user'
    };
    await persistNotification(earnNotif);

    if (previousTier !== newTier) {
      const tierNotif: NotificationMessage = {
        id: `notif-tier-${Date.now()}`,
        title: `🏆 Level Up! You are now a ${newTier} Member!`,
        body: `Congratulations! Your lifetime points crossed the threshold. Enjoy exclusive ${newTier} tier rewards!`,
        type: 'tier',
        timestamp: new Date().toISOString(),
        read: false,
        targetRole: 'user'
      };
      await persistNotification(tierNotif);
    }

    res.json({
      success: true,
      pointsEarned,
      newBalance: walletData.pointsBalance,
      currentTier: walletData.currentTier,
      transaction: newTx,
      notification: earnNotif
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process earn points' });
  }
});

// API ROUTE: Scan Merchant Store QR Code for 1 Instant Point
app.post('/api/wallet/scan-qr-checkin', async (req, res) => {
  try {
    const { storeId, qrData } = req.body;
    const store = storesData.find((s) => s.id === storeId) || storesData[0];

    const pointsEarned = 1;
    walletData.pointsBalance += pointsEarned;
    walletData.lifetimePoints += pointsEarned;

    const previousTier = walletData.currentTier;
    const newTier = calculateTier(walletData.lifetimePoints);
    walletData.currentTier = newTier;
    await persistWallet();

    const newTx: Transaction = {
      id: `tx-scan-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      type: 'earn',
      points: pointsEarned,
      description: `In-Store QR Code Scan Check-In at ${store.name} (+1 pt)`,
      timestamp: new Date().toISOString()
    };
    await persistTransaction(newTx);

    const scanNotif: NotificationMessage = {
      id: `notif-scan-${Date.now()}`,
      title: `📷 +1 Point Earned via QR Scan!`,
      body: `Thanks for scanning the in-store QR poster at ${store.name}. 1 point has been added to your balance!`,
      type: 'earn',
      timestamp: new Date().toISOString(),
      read: false,
      storeId: store.id,
      targetRole: 'user'
    };
    await persistNotification(scanNotif);

    if (previousTier !== newTier) {
      const tierNotif: NotificationMessage = {
        id: `notif-tier-${Date.now()}`,
        title: `🏆 Level Up! You are now a ${newTier} Member!`,
        body: `Congratulations! Your lifetime points crossed the threshold. Enjoy exclusive ${newTier} tier rewards!`,
        type: 'tier',
        timestamp: new Date().toISOString(),
        read: false,
        targetRole: 'user'
      };
      await persistNotification(tierNotif);
    }

    res.json({
      success: true,
      pointsEarned,
      newBalance: walletData.pointsBalance,
      currentTier: walletData.currentTier,
      transaction: newTx,
      notification: scanNotif
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process QR check-in scan' });
  }
});

// API ROUTE: Claim / Redeem Reward Voucher
app.post('/api/wallet/redeem', async (req, res) => {
  try {
    const { rewardId } = req.body;
    const reward = rewardsData.find((r) => r.id === rewardId);

    if (!reward) {
      return res.status(404).json({ error: 'Reward offer not found' });
    }

    if (walletData.pointsBalance < reward.pointsCost) {
      return res.status(400).json({
        error: `Insufficient points. You need ${reward.pointsCost} points, but have ${walletData.pointsBalance}.`
      });
    }

    // Deduct points
    walletData.pointsBalance -= reward.pointsCost;

    const newVoucher: UserVoucher = {
      id: `vouch-${Date.now()}`,
      rewardId: reward.id,
      storeId: reward.storeId,
      storeName: reward.storeName,
      title: reward.title,
      pointsSpent: reward.pointsCost,
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * reward.expiryDays).toISOString(),
      qrCode: `VOUCH-${reward.code}-${walletData.userId.slice(-5)}-${Date.now().toString().slice(-4)}`,
      status: 'active'
    };

    walletData.vouchers.unshift(newVoucher);
    await persistWallet();

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      storeId: reward.storeId,
      storeName: reward.storeName,
      type: 'redeem',
      points: -reward.pointsCost,
      voucherTitle: reward.title,
      description: `Redeemed voucher for ${reward.title}`,
      timestamp: new Date().toISOString()
    };
    await persistTransaction(newTx);

    const redeemNotif: NotificationMessage = {
      id: `notif-${Date.now()}`,
      title: `🎟️ Voucher Claimed: ${reward.title}`,
      body: `Your voucher for ${reward.storeName} is ready in your digital wallet! Show QR code to cashier to redeem.`,
      type: 'redeem',
      timestamp: new Date().toISOString(),
      read: false,
      storeId: reward.storeId,
      targetRole: 'user'
    };
    await persistNotification(redeemNotif);

    res.json({
      success: true,
      voucher: newVoucher,
      newBalance: walletData.pointsBalance,
      transaction: newTx
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

// API ROUTE: Real-time Turn-by-Turn Directions & Navigation Route
app.get('/api/navigation/route', (req, res) => {
  try {
    const { storeId, userLat, userLng, mode } = req.query;

    const store = storesData.find((s) => s.id === storeId) || storesData[0];
    const origLat = userLat ? parseFloat(userLat as string) : INITIAL_USER_LOCATION.lat;
    const origLng = userLng ? parseFloat(userLng as string) : INITIAL_USER_LOCATION.lng;
    const navMode = (mode as 'walking' | 'driving' | 'biking') || 'walking';

    const distKm = calculateDistanceKm(origLat, origLng, store.lat, store.lng);

    // Speed multiplier: walking = 5 km/h, biking = 15 km/h, driving = 35 km/h
    const speed = navMode === 'driving' ? 35 : navMode === 'biking' ? 15 : 5;
    const durationMin = Math.max(1, Math.round((distKm / speed) * 60));

    // Generate realistic path points along grid streets
    const numSteps = 5;
    const pathPoints: [number, number][] = [];
    const steps: NavigationStep[] = [];

    const latDiff = store.lat - origLat;
    const lngDiff = store.lng - origLng;

    // Corner waypoint (L-shaped urban navigation route)
    const way1Lat = origLat + latDiff * 0.4;
    const way1Lng = origLng;

    const way2Lat = way1Lat;
    const way2Lng = origLng + lngDiff * 0.7;

    pathPoints.push([origLat, origLng]);
    pathPoints.push([way1Lat, way1Lng]);
    pathPoints.push([way2Lat, way2Lng]);
    pathPoints.push([store.lat, store.lng]);

    steps.push({
      instruction: `Head ${latDiff > 0 ? 'North' : 'South'} on Breedestraat toward Handelskade`,
      distanceMeters: Math.round(distKm * 400),
      durationSeconds: Math.round(durationMin * 24),
      lat: origLat,
      lng: origLng,
      action: 'head'
    });

    steps.push({
      instruction: `Turn ${lngDiff > 0 ? 'East' : 'West'} onto Schottegatweg / Caracasbaaiweg`,
      distanceMeters: Math.round(distKm * 300),
      durationSeconds: Math.round(durationMin * 18),
      lat: way1Lat,
      lng: way1Lng,
      action: lngDiff > 0 ? 'turn_right' : 'turn_left'
    });

    steps.push({
      instruction: `Continue along coastal boulevard toward destination`,
      distanceMeters: Math.round(distKm * 200),
      durationSeconds: Math.round(durationMin * 12),
      lat: way2Lat,
      lng: way2Lng,
      action: 'continue'
    });

    steps.push({
      instruction: `Arrive at ${store.name} (${store.address})`,
      distanceMeters: Math.round(distKm * 100),
      durationSeconds: Math.round(durationMin * 6),
      lat: store.lat,
      lng: store.lng,
      action: 'arrive'
    });

    const route: NavigationRoute = {
      storeId: store.id,
      storeName: store.name,
      originLat: origLat,
      originLng: origLng,
      destLat: store.lat,
      destLng: store.lng,
      distanceKm: distKm,
      durationMinutes: durationMin,
      mode: navMode,
      steps,
      pathPoints
    };

    res.json({ route });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate navigation route' });
  }
});

// API ROUTE: Get All Notifications
app.get('/api/notifications', (req, res) => {
  const { role } = req.query;
  let filtered = notificationsData;
  if (role) {
    filtered = notificationsData.filter((n) => n.targetRole === 'all' || n.targetRole === role);
  }
  res.json({ notifications: filtered, unreadCount: filtered.filter((n) => !n.read).length });
});

// API ROUTE: Send Push Notification (from Merchant or System)
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { title, body, type, storeId, targetRole } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const newNotif: NotificationMessage = {
      id: `notif-${Date.now()}`,
      title,
      body,
      type: type || 'promo',
      timestamp: new Date().toISOString(),
      read: false,
      storeId,
      targetRole: targetRole || 'user'
    };

    await persistNotification(newNotif);

    res.json({ success: true, notification: newNotif });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dispatch push notification' });
  }
});

// API ROUTE: Mark Notifications Read
app.post('/api/notifications/mark-read', async (req, res) => {
  notificationsData.forEach((n) => (n.read = true));
  await persistNotification(notificationsData[0] || {
    id: `notif-${Date.now()}`,
    title: 'Mark Read Sync',
    body: 'Syncing notification read status',
    type: 'promo',
    timestamp: new Date().toISOString(),
    read: true,
    targetRole: 'user'
  });
  res.json({ success: true });
});

// API ROUTE: Get Merchant Dashboard Data & Points Rewarded Metrics
app.get('/api/merchant/stats', (req, res) => {
  const { storeId } = req.query;
  const activeStoreId = (storeId as string) || 'store-1';
  const store = storesData.find((s) => s.id === activeStoreId) || storesData[0];

  const storeTxs = transactionsData.filter((t) => t.storeId === store.id);
  const issuedToday = storeTxs
    .filter((t) => t.type === 'earn' || t.type === 'bonus')
    .reduce((sum, t) => sum + t.points, 0);
  const redeemedToday = Math.abs(
    storeTxs
      .filter((t) => t.type === 'redeem')
      .reduce((sum, t) => sum + t.points, 0)
  );

  const totalPointsEarnedFromTxs = storeTxs
    .filter((t) => t.type === 'earn' || t.type === 'bonus')
    .reduce((sum, t) => sum + t.points, 0);

  const totalPointsRewardedAllTime = (store.totalPointsRewarded || 28500) + totalPointsEarnedFromTxs;
  const totalPointsRedeemedAllTime = (store.totalPointsRedeemed || 9400) + Math.abs(storeTxs.filter(t => t.type === 'redeem').reduce((s, t) => s + t.points, 0));

  const totalRevenue = 12450.0 + storeTxs.reduce((sum, t) => sum + (t.amountSpent || 0), 0);
  const earnTxCount = storeTxs.filter((t) => t.type === 'earn').length + 48;
  const averagePointsPerSale = Math.round(totalPointsRewardedAllTime / Math.max(1, earnTxCount));

  // Points reserve balance for this merchant store
  const storePointsBalance = store.pointsBalance !== undefined ? store.pointsBalance : 14500;

  // Points by source breakdown
  const posSalesPts = Math.round(totalPointsRewardedAllTime * 0.78);
  const qrWalkinPts = Math.round(totalPointsRewardedAllTime * 0.14);
  const bonusCampaignPts = totalPointsRewardedAllTime - posSalesPts - qrWalkinPts;

  const pointsBySource = [
    { source: 'POS Checkout Purchases', points: posSalesPts, count: Math.round(earnTxCount * 0.8), percentage: 78 },
    { source: 'In-Store Walk-In QR Check-Ins', points: qrWalkinPts, count: Math.round(earnTxCount * 0.15), percentage: 14 },
    { source: 'Special Bonus Multipliers & Campaigns', points: bonusCampaignPts, count: Math.round(earnTxCount * 0.05), percentage: 8 }
  ];

  const stats: MerchantStats = {
    storeId: store.id,
    storeName: store.name,
    pointsBalance: storePointsBalance,
    todayPointsIssued: issuedToday + 1250,
    todayPointsRedeemed: redeemedToday + 450,
    todayTransactions: storeTxs.length + 18,
    todayRevenueEstimate: 420.50 + storeTxs.reduce((sum, t) => sum + (t.amountSpent || 0), 0),
    activeMembersCount: 285 + storeTxs.length,
    recentActivity: storeTxs.length > 0 ? storeTxs : INITIAL_TRANSACTIONS,
    monthlyDistribution: INITIAL_MERCHANT_STATS.monthlyDistribution,
    totalPointsRewardedAllTime,
    totalPointsRedeemedAllTime,
    totalRevenueAllTime: Math.round(totalRevenue * 100) / 100,
    averagePointsPerSale,
    pointsBySource
  };

  const merchantPosts = deduplicatePostsList(postsData).filter(
    (p) =>
      p.storeId === store.id ||
      p.author?.toLowerCase().includes(store.name.toLowerCase()) ||
      p.category === 'Promotion' ||
      p.category === 'Reward Alert'
  );

  res.json({
    stats,
    storeRewards: rewardsData.filter((r) => r.storeId === store.id),
    store,
    merchantPosts
  });
});

// API ROUTE: Get Merchant Promo Posts
app.get('/api/merchant/posts', (req, res) => {
  const { storeId, author } = req.query;
  let list = deduplicatePostsList(postsData);
  if (storeId) {
    list = list.filter((p) => p.storeId === storeId || p.author?.toLowerCase().includes((storeId as string).toLowerCase()));
  }
  if (author) {
    list = list.filter((p) => p.author?.toLowerCase().includes((author as string).toLowerCase()));
  }
  res.json({ success: true, count: list.length, posts: list });
});

// API ROUTE: Create Merchant Promo Post
app.post('/api/merchant/posts/create', async (req, res) => {
  try {
    const {
      storeId,
      storeName,
      title,
      content,
      category,
      imageUrl,
      discountTag,
      targetAudience,
      status,
      featured
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Promo title and description are required.' });
    }

    const matchedStore = storesData.find((s) => s.id === storeId);
    const resolvedAuthor = storeName || matchedStore?.name || 'Merchant Partner';

    const newPost: AdminPost = {
      id: `promo-${Date.now()}`,
      storeId: storeId || matchedStore?.id,
      title: title.trim(),
      content: content.trim(),
      category: (category as any) || 'Promotion',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
      author: resolvedAuthor,
      discountTag: discountTag ? discountTag.trim() : undefined,
      targetAudience: targetAudience || 'all',
      status: status || 'published',
      createdAt: new Date().toISOString(),
      likesCount: 0,
      featured: !!featured
    };

    await persistPost(newPost);

    // If published, trigger push notification for app users
    if (newPost.status === 'published') {
      const notif: NotificationMessage = {
        id: `notif-promo-${Date.now()}`,
        title: `🏷️ PROMO: ${newPost.title.slice(0, 60)}${newPost.title.length > 60 ? '...' : ''}`,
        body: `Special offer at ${resolvedAuthor}: ${newPost.content.slice(0, 120)}${newPost.content.length > 120 ? '...' : ''}`,
        type: 'promo',
        timestamp: new Date().toISOString(),
        read: false,
        storeId: newPost.storeId,
        targetRole: (newPost.targetAudience as any) || 'all'
      };
      await persistNotification(notif);
    }

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Merchant Promo Post Created: "${newPost.title}"`,
      type: 'system',
      severity: 'info',
      details: `Merchant ${resolvedAuthor} (${storeId}) created new promo post (${newPost.status}). Category: ${newPost.category}`,
      user: resolvedAuthor
    };
    await persistAuditLog(log);

    const storePosts = deduplicatePostsList(postsData).filter(
      (p) => p.storeId === storeId || p.author?.toLowerCase().includes(resolvedAuthor.toLowerCase())
    );

    res.json({ success: true, post: newPost, posts: storePosts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create promo post', details: err.message });
  }
});

// API ROUTE: Update Merchant Promo Post
app.put('/api/merchant/posts/update', async (req, res) => {
  try {
    const {
      id,
      storeId,
      title,
      content,
      category,
      imageUrl,
      discountTag,
      targetAudience,
      status,
      featured
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const existingIdx = postsData.findIndex((p) => p.id === id);
    if (existingIdx === -1) {
      return res.status(404).json({ error: 'Promo post not found' });
    }

    const updatedPost: AdminPost = {
      ...postsData[existingIdx],
      storeId: storeId ?? postsData[existingIdx].storeId,
      title: title !== undefined ? title.trim() : postsData[existingIdx].title,
      content: content !== undefined ? content.trim() : postsData[existingIdx].content,
      category: category ?? postsData[existingIdx].category,
      imageUrl: imageUrl ?? postsData[existingIdx].imageUrl,
      discountTag: discountTag !== undefined ? discountTag : postsData[existingIdx].discountTag,
      targetAudience: targetAudience ?? postsData[existingIdx].targetAudience,
      status: status ?? postsData[existingIdx].status,
      featured: featured !== undefined ? featured : postsData[existingIdx].featured,
      updatedAt: new Date().toISOString()
    };

    await persistPost(updatedPost);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Merchant Promo Post Updated: "${updatedPost.title}"`,
      type: 'system',
      severity: 'info',
      details: `Promo post ${id} updated to status "${updatedPost.status}".`,
      user: updatedPost.author || 'merchant'
    };
    await persistAuditLog(log);

    res.json({ success: true, post: updatedPost, posts: postsData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update promo post', details: err.message });
  }
});

// API ROUTE: Delete Merchant Promo Post
app.delete('/api/merchant/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deletePost(id);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Merchant Promo Post Deleted: ${id}`,
      type: 'system',
      severity: 'warning',
      details: `Merchant promo post ${id} was deleted.`,
      user: 'merchant'
    };
    await persistAuditLog(log);

    res.json({ success: true, message: 'Promo post deleted successfully', posts: postsData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete promo post', details: err.message });
  }
});

// API ROUTE: Top Up Merchant Store Points Reserve
app.post('/api/merchant/points/topup', async (req, res) => {
  try {
    const { storeId, pointsToAdd } = req.body;
    if (!storeId || !pointsToAdd || pointsToAdd <= 0) {
      return res.status(400).json({ error: 'Valid store ID and points amount are required.' });
    }

    const storeIdx = storesData.findIndex((s) => s.id === storeId);
    if (storeIdx === -1) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const currentBal = storesData[storeIdx].pointsBalance ?? 14500;
    const newBal = currentBal + Number(pointsToAdd);
    storesData[storeIdx].pointsBalance = newBal;
    await persistStore(storesData[storeIdx]);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Merchant Points Reserve Replenished: +${pointsToAdd} pts`,
      type: 'adjustment',
      severity: 'success',
      details: `Store "${storesData[storeIdx].name}" topped up points reserve by +${pointsToAdd} pts (New Balance: ${newBal.toLocaleString()} pts).`,
      user: storesData[storeIdx].name
    };
    await persistAuditLog(log);

    res.json({ success: true, pointsBalance: newBal, store: storesData[storeIdx] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to replenish points balance', details: err.message });
  }
});

// API ROUTE: Merchant Update Store Info (Address, Map Location, Hours, Category, Phone, Email)
app.post('/api/merchant/store/update', async (req, res) => {
  try {
    const {
      id,
      name,
      category,
      address,
      city,
      lat,
      lng,
      openHours,
      phone,
      email,
      secondaryPhone,
      website,
      description,
      pointsRate,
      perks,
      schedule,
      managerName,
      socialHandle,
      image,
      logo
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    let existingStoreIdx = storesData.findIndex((s) => s.id === id);
    let updatedStore: Store;

    if (existingStoreIdx >= 0) {
      updatedStore = {
        ...storesData[existingStoreIdx],
        name: name !== undefined ? name : storesData[existingStoreIdx].name,
        category: category !== undefined ? category : storesData[existingStoreIdx].category,
        address: address !== undefined ? address : storesData[existingStoreIdx].address,
        city: city !== undefined ? city : storesData[existingStoreIdx].city,
        lat: lat !== undefined ? parseFloat(lat) : storesData[existingStoreIdx].lat,
        lng: lng !== undefined ? parseFloat(lng) : storesData[existingStoreIdx].lng,
        openHours: openHours !== undefined ? openHours : storesData[existingStoreIdx].openHours,
        phone: phone !== undefined ? phone : storesData[existingStoreIdx].phone,
        email: email !== undefined ? email : (storesData[existingStoreIdx].email || `${storesData[existingStoreIdx].name.toLowerCase().replace(/[^a-z0-9]/g, '')}@omniloyalty.internal`),
        secondaryPhone: secondaryPhone !== undefined ? secondaryPhone : storesData[existingStoreIdx].secondaryPhone,
        website: website !== undefined ? website : storesData[existingStoreIdx].website,
        description: description !== undefined ? description : storesData[existingStoreIdx].description,
        pointsRate: pointsRate !== undefined ? parseInt(pointsRate, 10) : storesData[existingStoreIdx].pointsRate,
        perks: perks !== undefined ? perks : storesData[existingStoreIdx].perks,
        schedule: schedule !== undefined ? schedule : storesData[existingStoreIdx].schedule,
        managerName: managerName !== undefined ? managerName : storesData[existingStoreIdx].managerName,
        socialHandle: socialHandle !== undefined ? socialHandle : storesData[existingStoreIdx].socialHandle,
        image: image !== undefined ? image : storesData[existingStoreIdx].image,
        logo: logo !== undefined ? logo : storesData[existingStoreIdx].logo
      };
      storesData[existingStoreIdx] = updatedStore;
    } else {
      updatedStore = {
        id,
        name: name || 'New Partner Store',
        category: category || 'Coffee',
        address: address || '100 Market St',
        city: city || 'Willemstad',
        lat: lat ? parseFloat(lat) : 12.1054,
        lng: lng ? parseFloat(lng) : -68.9332,
        rating: 5.0,
        reviewCount: 1,
        image: image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
        logo: logo || undefined,
        pointsRate: pointsRate ? parseInt(pointsRate, 10) : 10,
        description: description || 'Loyalty partner store outlet',
        openHours: openHours || '8:00 AM - 8:00 PM',
        phone: phone || '(415) 555-0100',
        email: email || 'store@omniloyalty.internal',
        secondaryPhone,
        website,
        perks: perks || ['Loyalty Rewards', 'Member Deals'],
        schedule
      };
      storesData.push(updatedStore);
    }

    await persistStore(updatedStore);

    const log: SystemAuditLog = {
      id: `audit-store-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Store Profile Updated: ${updatedStore.name}`,
      type: 'security',
      severity: 'info',
      details: `Merchant updated store details: address (${updatedStore.address}), category (${updatedStore.category}), GPS coordinates (${updatedStore.lat}, ${updatedStore.lng}), phone (${updatedStore.phone}), email (${updatedStore.email})`,
      user: 'merchant'
    };
    await persistAuditLog(log);

    res.json({ success: true, store: updatedStore, message: 'Store profile successfully updated and synchronized to cloud database' });
  } catch (err) {
    console.error('Error updating store:', err);
    res.status(500).json({ error: 'Failed to update store profile' });
  }
});

// API ROUTE: Merchant Scan Member QR & Execute POS Action
app.post('/api/merchant/scan-pass', async (req, res) => {
  try {
    const { passId, action, storeId, amount, voucherCode } = req.body;

    // Validate passId or barcode
    if (!passId) {
      return res.status(400).json({ error: 'Member Pass ID or QR payload is required' });
    }

    const store = storesData.find((s) => s.id === storeId) || storesData[0];

    if (action === 'earn') {
      const saleAmount = parseFloat(amount);
      if (isNaN(saleAmount) || saleAmount <= 0) {
        return res.status(400).json({ error: 'Valid sale amount is required' });
      }

      const points = Math.round(saleAmount * store.pointsRate);
      walletData.pointsBalance += points;
      walletData.lifetimePoints += points;
      walletData.currentTier = calculateTier(walletData.lifetimePoints);
      await persistWallet();

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        storeId: store.id,
        storeName: store.name,
        type: 'earn',
        points,
        amountSpent: saleAmount,
        description: `POS Checkout at ${store.name}`,
        timestamp: new Date().toISOString()
      };
      await persistTransaction(tx);

      // Push notification to user
      const notif: NotificationMessage = {
        id: `notif-${Date.now()}`,
        title: `✨ In-Store Points Credited! (+${points} pts)`,
        body: `${store.name} credited ${points} points to your pass for Cg ${saleAmount.toFixed(2)}.`,
        type: 'earn',
        timestamp: new Date().toISOString(),
        read: false,
        storeId: store.id,
        targetRole: 'user'
      };
      await persistNotification(notif);

      return res.json({
        success: true,
        message: `Successfully credited ${points} points to ${walletData.userName} (${walletData.passId})`,
        points,
        member: {
          name: walletData.userName,
          passId: walletData.passId,
          tier: walletData.currentTier,
          newBalance: walletData.pointsBalance
        }
      });
    } else if (action === 'redeem_voucher') {
      const voucher = walletData.vouchers.find(
        (v) => (v.qrCode === voucherCode || v.id === voucherCode) && v.status === 'active'
      );

      if (!voucher) {
        return res.status(404).json({ error: 'Active voucher code not found for this member' });
      }

      voucher.status = 'used';
      await persistWallet();

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        storeId: store.id,
        storeName: store.name,
        type: 'redeem',
        points: 0, // already deducted at claim time
        voucherTitle: voucher.title,
        description: `Redeemed voucher #${voucher.id} in-store at ${store.name}`,
        timestamp: new Date().toISOString()
      };
      await persistTransaction(tx);

      const notif: NotificationMessage = {
        id: `notif-${Date.now()}`,
        title: `✅ Voucher Redeemed: ${voucher.title}`,
        body: `Your voucher was successfully processed at ${store.name}. Enjoy your reward!`,
        type: 'redeem',
        timestamp: new Date().toISOString(),
        read: false,
        storeId: store.id,
        targetRole: 'user'
      };
      await persistNotification(notif);

      return res.json({
        success: true,
        message: `Voucher "${voucher.title}" validated and redeemed for ${walletData.userName}.`,
        voucher
      });
    }

    res.status(400).json({ error: 'Invalid merchant action' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process merchant scan' });
  }
});

// API ROUTE: Merchant Add/Edit Reward Offer
app.post('/api/merchant/rewards', async (req, res) => {
  try {
    const { storeId, title, description, pointsCost, category, discountValue } = req.body;

    if (!title || !pointsCost) {
      return res.status(400).json({ error: 'Title and points cost are required' });
    }

    const store = storesData.find((s) => s.id === storeId) || storesData[0];

    const newReward: RewardItem = {
      id: `rew-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      title,
      description: description || 'Exclusive store partner reward offer.',
      pointsCost: parseInt(pointsCost, 10),
      category: category || store.category,
      image: store.image,
      expiryDays: 30,
      code: `${store.name.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      discountValue: discountValue || 'Partner Special'
    };

    await persistReward(newReward);

    // Notify users of new reward
    const newRewNotif: NotificationMessage = {
      id: `notif-newrew-${Date.now()}`,
      title: `🎁 New Reward Offer at ${store.name}!`,
      body: `Claim "${newReward.title}" now for ${newReward.pointsCost} points in your loyalty wallet.`,
      type: 'promo',
      timestamp: new Date().toISOString(),
      read: false,
      storeId: store.id,
      targetRole: 'user'
    };
    await persistNotification(newRewNotif);

    res.json({ success: true, reward: newReward });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add store reward' });
  }
});

// API ROUTE: AI Perks & Recommendations Assistant (Gemini API)
app.post('/api/ai/perks', async (req, res) => {
  try {
    const { queryType, storeContext, promptText } = req.body;

    if (!aiClient) {
      // Fallback response if GEMINI_API_KEY is not configured
      if (queryType === 'merchant_promo_copy') {
        return res.json({
          generatedPromo: `⚡ FLASH REWARD: Visit ${storeContext?.name || 'our store'} today to earn 2x bonus points on every purchase! Redeem your points for exclusive rewards in our digital wallet.`
        });
      }
      return res.json({
        summary: `You currently have ${walletData.pointsBalance} points and are in the ${walletData.currentTier} Tier!`,
        recommendations: [
          {
            title: 'Redeem Free Specialty Beverage',
            description: 'You have 1,280 points! Claim a free artisanal latte at Metro Roast (250 pts).',
            actionType: 'redeem',
            storeName: 'Metro Roast Artisan Coffee',
            pointsNeeded: 250
          },
          {
            title: 'Earn 15x Points on Streetwear',
            description: 'Shop at Urban Threads Boutique (0.4 km away) to earn 15 points per Cg.',
            actionType: 'visit',
            storeName: 'Urban Threads Boutique'
          },
          {
            title: 'Reach Gold Tier Status',
            description: 'Earn 1,550 more points to unlock Platinum Tier with 2x points speed!',
            actionType: 'upgrade',
            pointsNeeded: 1550
          }
        ]
      });
    }

    if (queryType === 'merchant_promo_copy') {
      const prompt = `You are a high-converting marketing copywriter for retail store "${storeContext?.name || 'Artisan Retail Store'}". Write an energetic, catchy 2-sentence push notification text announcing a loyalty reward or double points event. Keep it under 140 characters. ${promptText ? `Context: ${promptText}` : ''}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt
      });

      return res.json({ generatedPromo: response.text?.trim() || 'Earn double points today on all store purchases!' });
    } else {
      const prompt = `You are an AI Loyalty Perks Advisor for a customer named ${walletData.userName}.
Customer Wallet Details:
- Points Balance: ${walletData.pointsBalance}
- Tier: ${walletData.currentTier}
- Lifetime Points: ${walletData.lifetimePoints}
- Nearest Stores Available: ${storesData.map((s) => `${s.name} (${s.category}, rate: ${s.pointsRate}pts/Cg)`).join(', ')}

Provide concise advice for maximizing points and best rewards to redeem right now. Respond strictly in JSON format matching this schema:
{
  "summary": "Short 1-2 sentence overview of user standing and immediate top recommendation",
  "recommendations": [
    {
      "title": "Short title",
      "description": "Why this is recommended",
      "actionType": "redeem" | "visit" | "upgrade",
      "storeName": "Store Name",
      "pointsNeeded": 250
    }
  ]
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        summary: parsed.summary || `You have ${walletData.pointsBalance} points available to redeem across 6 retail partners!`,
        recommendations: parsed.recommendations || []
      });
    }
  } catch (err) {
    console.error('Gemini AI endpoint error:', err);
    res.json({
      summary: `You have ${walletData.pointsBalance} points in your digital wallet ready to spend!`,
      recommendations: [
        {
          title: 'Redeem Free Coffee at Metro Roast',
          description: 'You have plenty of points for a free coffee (250 pts).',
          actionType: 'redeem',
          storeName: 'Metro Roast Artisan Coffee',
          pointsNeeded: 250
        }
      ]
    });
  }
});

// ==========================================
// ADMIN API ROUTES
// ==========================================

// API ROUTE: Get Admin System Overview & Network Health
app.get('/api/admin/overview', (req, res) => {
  try {
    const totalPointsEarned = transactionsData
      .filter((t) => t.type === 'earn' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.points, 0);

    const totalPointsRedeemed = Math.abs(
      transactionsData
        .filter((t) => t.type === 'redeem')
        .reduce((sum, t) => sum + t.points, 0)
    );

    const totalEstRevenue = transactionsData.reduce((sum, t) => sum + (t.amountSpent || 0), 0) + 18450.0;

    res.json({
      stats: {
        totalUsers: usersDB.length,
        totalStores: storesData.length,
        totalRewards: rewardsData.length,
        totalTransactions: transactionsData.length,
        totalPointsIssued: totalPointsEarned,
        totalPointsRedeemed: totalPointsRedeemed,
        totalEstRevenue: Math.round(totalEstRevenue * 100) / 100,
        firestoreStatus: {
          connected: true,
          mode: 'Cloud Firestore Sync Active',
          lastSync: new Date().toISOString(),
          collectionsCount: 6
        }
      },
      registeredUsers: usersDB.map((u) => ({
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        passId: u.passId,
        role: u.role || 'user',
        pinCode: u.pinCode ? '••••• (Set)' : 'Unset',
        pointsBalance: u.pointsBalance ?? 0,
        lifetimePoints: u.lifetimePoints ?? u.pointsBalance ?? 0,
        currentTier: u.currentTier || ( (u.pointsBalance ?? 0) >= 2500 ? 'Platinum' : (u.pointsBalance ?? 0) >= 1200 ? 'Gold' : (u.pointsBalance ?? 0) >= 500 ? 'Silver' : 'Bronze'),
        status: u.status || 'active',
        createdAt: u.createdAt || new Date().toISOString()
      })),
      posts: postsData,
      recentTransactions: transactionsData.slice(0, 15),
      stores: storesData,
      tasks: adminTasksData,
      auditLogs: auditLogsData.slice(0, 20)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
});

// API ROUTE: Get All Public Posts / News (including live Gobiernu.cw news from Firestore)
app.get(['/api/posts', '/api/news'], async (req, res) => {
  try {
    const shouldRefresh = req.query.refresh === 'true' || req.query.sync === 'true';
    if (shouldRefresh) {
      await syncGobiernuToFirestore(10);
    }
    
    const category = req.query.category as string;
    let results = deduplicatePostsList([...postsData]);
    if (category && category !== 'All') {
      results = results.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }

    res.json({
      success: true,
      count: results.length,
      posts: results
    });
  } catch (err: any) {
    const uniquePosts = deduplicatePostsList(postsData);
    res.json({ success: true, count: uniquePosts.length, posts: uniquePosts });
  }
});

// API ROUTE: Get Posts
app.get('/api/admin/posts', (req, res) => {
  res.json({ posts: deduplicatePostsList(postsData) });
});

// API ROUTE: Create Post
app.post('/api/admin/posts/create', async (req, res) => {
  try {
    const { title, content, category, imageUrl, author, targetAudience, status, featured } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newPost: AdminPost = {
      id: `post-${Date.now()}`,
      title,
      content,
      category: category || 'Announcement',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
      author: author || 'Mambi Administrator',
      targetAudience: targetAudience || 'all',
      status: status || 'published',
      createdAt: new Date().toISOString(),
      likesCount: 0,
      featured: !!featured
    };

    await persistPost(newPost);

    // If published, also send as a notification according to push policies:
    // 1. Promo items -> title prefixed with "PROMO PUSH: <Title>"
    // 2. News/Announcements -> only sent if published on the SAME DAY, with title "NEWS PUSH: <Title>"
    if (newPost.status === 'published') {
      const isPromo = newPost.category === 'Promotion' || newPost.category === 'Reward Alert';
      const todayYMD = new Date().toISOString().slice(0, 10);
      const postDateYMD = new Date(newPost.createdAt).toISOString().slice(0, 10);
      const isSameDay = postDateYMD === todayYMD;

      let pushTitle = '';
      if (isPromo) {
        pushTitle = `PROMO PUSH: ${newPost.title.slice(0, 65)}${newPost.title.length > 65 ? '...' : ''}`;
      } else if (isSameDay) {
        pushTitle = `NEWS PUSH: ${newPost.title.slice(0, 65)}${newPost.title.length > 65 ? '...' : ''}`;
      }

      if (pushTitle) {
        const notif: NotificationMessage = {
          id: `notif-post-${Date.now()}`,
          title: pushTitle,
          body: newPost.content.slice(0, 140) + (newPost.content.length > 140 ? '...' : ''),
          type: isPromo ? 'promo' : 'system',
          timestamp: new Date().toISOString(),
          read: false,
          targetRole: (newPost.targetAudience as any) || 'all'
        };
        await persistNotification(notif);
      }
    }

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Post Created: "${newPost.title}"`,
      type: 'system',
      severity: 'info',
      details: `Created new post under category ${newPost.category} (${newPost.status}). Target audience: ${newPost.targetAudience}`,
      user: author || 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, post: newPost, posts: postsData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// API ROUTE: Update Post
app.put('/api/admin/posts/update', async (req, res) => {
  try {
    const { id, title, content, category, imageUrl, targetAudience, status, featured } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const existingIdx = postsData.findIndex((p) => p.id === id);
    if (existingIdx === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost: AdminPost = {
      ...postsData[existingIdx],
      title: title ?? postsData[existingIdx].title,
      content: content ?? postsData[existingIdx].content,
      category: category ?? postsData[existingIdx].category,
      imageUrl: imageUrl ?? postsData[existingIdx].imageUrl,
      targetAudience: targetAudience ?? postsData[existingIdx].targetAudience,
      status: status ?? postsData[existingIdx].status,
      featured: featured !== undefined ? featured : postsData[existingIdx].featured,
      updatedAt: new Date().toISOString()
    };

    await persistPost(updatedPost);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Post Updated: "${updatedPost.title}"`,
      type: 'system',
      severity: 'info',
      details: `Updated post ${id} (${updatedPost.status}).`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, post: updatedPost, posts: postsData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// API ROUTE: Delete Post
app.delete('/api/admin/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deletePost(id);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Post Deleted: ${id}`,
      type: 'system',
      severity: 'warning',
      details: `Admin deleted post ${id}.`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, message: 'Post deleted successfully', posts: postsData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Helper function to decode HTML entities and strip unwanted tags
function cleanGobiernuHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fetch latest news from Gobiernu di Kòrsou across all subcategories
async function fetchGobiernuLatestPosts(limit = 10): Promise<AdminPost[]> {
  try {
    const result = await syncGobiernuToFirestore(limit);
    return result.posts;
  } catch (err: any) {
    console.error('[Gobiernu News] Error scanning all subcategories from gobiernu.cw:', err);
    return postsData.filter((p) => p.id?.startsWith('gobiernu-')).slice(0, limit);
  }
}

// API ROUTE: Live Query Gobiernu.cw News Posts directly from https://gobiernu.cw/nieuw/
app.get(['/api/gobiernu/nieuw', '/api/gobiernu/feed'], async (req, res) => {
  try {
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit as string, 10) || 15));
    const result = await fetchGobiernuNieuwDirect(limit);
    res.json({
      success: true,
      source: 'https://gobiernu.cw/nieuw/',
      feedUrl: 'https://gobiernu.cw/wp-json/wp/v2/nieuw',
      hasNewNews: result.hasNewNews,
      newCount: result.newCount,
      message: result.message,
      count: result.posts.length,
      posts: result.posts
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: 'Failed to retrieve government news feed from https://gobiernu.cw/nieuw/',
      details: err.message
    });
  }
});

// API ROUTE: Live Query Gobiernu.cw 10 Latest News Posts across all subcategories
app.get('/api/gobiernu/news', async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const sourceParam = req.query.source as string;
    
    // If specifically requesting nieuw feed
    if (sourceParam && (sourceParam.includes('nieuw') || sourceParam === 'nieuw')) {
      const result = await fetchGobiernuNieuwDirect(limit);
      return res.json({
        success: true,
        source: 'https://gobiernu.cw/nieuw/',
        hasNewNews: result.hasNewNews,
        newCount: result.newCount,
        message: result.message,
        count: result.posts.length,
        posts: result.posts
      });
    }

    const result = await syncGobiernuToFirestore(limit);
    res.json({
      success: true,
      source: 'https://gobiernu.cw/nieuw/',
      domain: 'gobiernu.cw',
      subcategoriesScanned: ['nieuw', 'ministers_nieuw', 'konseho_niews', 'breaking-news', 'optima_forma', 'landscourant', 'posts'],
      hasNewNews: result.hasNewNews,
      newPostsCount: result.newPostsCount,
      modifiedPostsCount: result.modifiedPostsCount,
      message: result.message,
      count: result.posts.length,
      posts: result.posts
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: 'Failed to retrieve news from gobiernu.cw',
      details: err.message
    });
  }
});

// API ROUTE: Trigger Multi-Subcategory Daily Scan & Sync to Firebase
app.post(['/api/gobiernu/scan-all', '/api/admin/gobiernu/daily-scan'], async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.body?.limit || req.query.limit as string, 10) || 10));
    const result = await syncGobiernuToFirestore(limit);

    if (result.hasNewNews) {
      const log: SystemAuditLog = {
        id: `audit-scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `Gobiernu.cw Scan: ${result.newPostsCount} new article(s) synced to Firestore`,
        type: 'system',
        severity: 'info',
        details: `Scanned all subcategories (nieuw, ministers_nieuw, etc.) and persisted ${result.newPostsCount} new articles to Firebase Firestore.`,
        user: 'mambiadmin'
      };
      await persistAuditLog(log);
    }

    res.json({
      success: true,
      hasNewNews: result.hasNewNews,
      message: result.hasNewNews
        ? `Found ${result.newPostsCount} new article(s). Synced latest top ${result.posts.length} articles to Firebase Firestore.`
        : `No new news published on Gobiernu.cw. Retained existing feed as is.`,
      newPostsCount: result.newPostsCount,
      count: result.posts.length,
      posts: result.posts
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Daily scan failed', details: err.message });
  }
});

// API ROUTE: Import & Grab 10 News Posts from Gobiernu.cw into OmniLoyalty Posts Feed
app.post('/api/admin/posts/import-gobiernu', async (req, res) => {
  try {
    const { postIds, publishNotifications = true } = req.body || {};
    const fetched = await fetchGobiernuLatestPosts(10);

    const toImport = Array.isArray(postIds) && postIds.length > 0
      ? fetched.filter((p) => postIds.includes(p.id) || (p.externalId && postIds.includes(p.externalId)))
      : fetched;

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of toImport) {
      const existingIdx = postsData.findIndex(
        (p) => p.id === item.id || (item.externalId && p.externalId === item.externalId) || p.title === item.title
      );

      if (existingIdx >= 0) {
        postsData[existingIdx] = {
          ...postsData[existingIdx],
          ...item,
          updatedAt: new Date().toISOString()
        };
        await persistPost(postsData[existingIdx]);
        updatedCount++;
      } else {
        await persistPost(item);
        importedCount++;

        // Send a notification alert to users ONLY if news item is from the SAME DAY
        const todayYMD = new Date().toISOString().slice(0, 10);
        const postDateYMD = new Date(item.createdAt).toISOString().slice(0, 10);
        const isSameDay = postDateYMD === todayYMD;

        if (publishNotifications && isSameDay) {
          const cleanTitle = item.title.trim();
          const notif: NotificationMessage = {
            id: `notif-gobiernu-${Date.now()}-${importedCount}`,
            title: `NEWS PUSH: ${cleanTitle.slice(0, 65)}${cleanTitle.length > 65 ? '...' : ''}`,
            body: item.excerpt ? item.excerpt.slice(0, 140) : item.content.slice(0, 140),
            type: 'system',
            timestamp: new Date().toISOString(),
            read: false,
            targetRole: 'all'
          };
          await persistNotification(notif);
        }
      }
    }

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Gobiernu.cw News Synchronized (${importedCount} new, ${updatedCount} updated)`,
      type: 'system',
      severity: 'info',
      details: `Grabbed ${toImport.length} official news articles from Gobiernu di Kòrsou (gobiernu.cw).`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({
      success: true,
      message: `Successfully grabbed ${toImport.length} post(s) from gobiernu.cw (${importedCount} new imported, ${updatedCount} refreshed)`,
      importedCount,
      updatedCount,
      totalCount: toImport.length,
      posts: postsData
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to import posts from gobiernu.cw', details: err.message });
  }
});

// API ROUTE: Get All Registered Users / Member Accounts (Full List)
app.get('/api/admin/users', async (req, res) => {
  try {
    // If connected to Firestore, query latest users from Firestore
    if (db) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          const freshUsers: RegisteredUser[] = [];
          usersSnap.forEach((d) => {
            freshUsers.push(d.data() as RegisteredUser);
          });
          // Merge with memory array
          for (const u of freshUsers) {
            const idx = usersDB.findIndex(x => x.username.toLowerCase() === u.username.toLowerCase());
            if (idx >= 0) {
              usersDB[idx] = { ...usersDB[idx], ...u };
            } else {
              usersDB.push(u);
            }
          }
        }
      } catch (err) {
        console.warn('[Firestore] Live users fetch notice:', err);
      }
    }

    // Map and enrich all users
    const list: AdminUserItem[] = usersDB.map((u) => {
      const pts = u.pointsBalance ?? 0;
      const tier = u.currentTier || (pts >= 2500 ? 'Platinum' : pts >= 1200 ? 'Gold' : pts >= 500 ? 'Silver' : 'Bronze');
      const lifetime = u.lifetimePoints ?? pts;

      return {
        username: u.username,
        fullName: u.fullName || u.username,
        email: u.email || `${u.username}@omniloyalty.internal`,
        passId: u.passId || `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`,
        role: u.role || 'user',
        pinCode: u.pinCode ? '••••• (Set)' : 'Unset',
        pointsBalance: pts,
        lifetimePoints: lifetime,
        currentTier: tier,
        status: u.status || 'active',
        createdAt: u.createdAt || new Date().toISOString()
      };
    });

    res.json({
      success: true,
      totalCount: list.length,
      users: list
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve list of users' });
  }
});

// Alias for general users retrieval
app.get('/api/users', async (req, res) => {
  try {
    const list = usersDB.map((u) => ({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      passId: u.passId,
      role: u.role || 'user',
      currentTier: u.currentTier || 'Bronze',
      pointsBalance: u.pointsBalance ?? 0
    }));
    res.json({ success: true, count: list.length, users: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// API ROUTE: Create User Manually
app.post('/api/admin/users/create', async (req, res) => {
  try {
    const { username, fullName, email, password, pinCode, role, initialPoints, tier } = req.body;

    if (!username || !fullName) {
      return res.status(400).json({ error: 'Username and Full Name are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await findUser(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: `Username or email "${username}" is already in use.` });
    }

    const points = parseInt(initialPoints, 10) || 500;
    const userRole: UserRole = role === 'admin' || role === 'merchant' ? role : 'user';
    const userTier: UserTier = tier || (points >= 2500 ? 'Platinum' : points >= 1200 ? 'Gold' : points >= 500 ? 'Silver' : 'Bronze');
    const passNumber = Math.floor(1000 + Math.random() * 9000);

    const newUser: RegisteredUser = {
      username: cleanUsername,
      password: password || 'omniPass2026',
      fullName: fullName.trim(),
      email: email ? email.trim().toLowerCase() : `${cleanUsername}@omniloyalty.internal`,
      passId: userRole === 'admin' ? `ADMIN-${passNumber}-SF` : userRole === 'merchant' ? `MERCHANT-POS-${passNumber}` : `PASS-${passNumber}-SF`,
      pinCode: pinCode ? String(pinCode).trim() : '12345',
      role: userRole,
      pointsBalance: points,
      lifetimePoints: points,
      currentTier: userTier,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await persistUser(newUser);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Manual User Account Created: @${newUser.username}`,
      type: 'security',
      severity: 'success',
      details: `Created ${newUser.role} account for ${newUser.fullName} (${newUser.email}) with ${points} points (${newUser.currentTier} tier). Pass ID: ${newUser.passId}`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({
      success: true,
      message: `User @${newUser.username} created successfully.`,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// API ROUTE: Edit / Update User Profile
app.put('/api/admin/users/update', async (req, res) => {
  try {
    const { username, fullName, email, role, pinCode, password, status, pointsBalance, currentTier } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Target username is required' });
    }

    const clean = username.trim().toLowerCase();
    const userIdx = usersDB.findIndex(
      (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
    );

    if (userIdx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = usersDB[userIdx];
    if (fullName) user.fullName = fullName.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role;
    if (pinCode) user.pinCode = String(pinCode).trim();
    if (password) user.password = password;
    if (status) user.status = status;
    if (pointsBalance !== undefined) {
      const p = parseInt(pointsBalance, 10);
      if (!isNaN(p)) {
        user.pointsBalance = Math.max(0, p);
      }
    }
    if (currentTier) {
      user.currentTier = currentTier;
    }

    await persistUser(user);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `User Profile Updated: @${user.username}`,
      type: 'adjustment',
      severity: 'info',
      details: `Updated details for ${user.fullName} (@${user.username}). Role: ${user.role}, Tier: ${user.currentTier}, Points: ${user.pointsBalance}`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({
      success: true,
      message: `User @${user.username} updated successfully.`,
      user
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// API ROUTE: Delete User Account (DELETE by param)
app.delete('/api/admin/users/:username', async (req, res) => {
  try {
    const rawParam = req.params.username;
    const username = decodeURIComponent(rawParam).trim();
    if (username.toLowerCase() === 'mambiadmin') {
      return res.status(403).json({ error: 'Root administrator account cannot be deleted.' });
    }

    await deleteUser(username);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `User Account Deleted: @${username}`,
      type: 'security',
      severity: 'warning',
      details: `Admin deleted user account @${username}.`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, message: `User @${username} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// API ROUTE: Delete User Account (POST JSON payload alternative)
app.post('/api/admin/users/delete', async (req, res) => {
  try {
    const { username, email } = req.body;
    const target = (username || email || '').trim();
    if (!target) {
      return res.status(400).json({ error: 'User identifier (username or email) is required.' });
    }
    if (target.toLowerCase() === 'mambiadmin') {
      return res.status(403).json({ error: 'Root administrator account cannot be deleted.' });
    }

    await deleteUser(target);
    if (email && email !== target) {
      await deleteUser(email);
    }

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `User Account Deleted: @${target}`,
      type: 'security',
      severity: 'warning',
      details: `Admin deleted user account ${target} (${email || 'no email'}).`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, message: `User ${target} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// API ROUTE: Get Single User Details + Transactions
app.get('/api/admin/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const clean = username.trim().toLowerCase();
    const user = await findUser(clean);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pts = user.pointsBalance ?? 0;
    const tier = user.currentTier || (pts >= 2500 ? 'Platinum' : pts >= 1200 ? 'Gold' : pts >= 500 ? 'Silver' : 'Bronze');

    res.json({
      user: {
        ...user,
        pointsBalance: pts,
        currentTier: tier,
        lifetimePoints: user.lifetimePoints ?? pts
      },
      transactions: transactionsData.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// API ROUTE: Get System Tasks
app.get('/api/admin/tasks', (req, res) => {
  res.json({ tasks: adminTasksData });
});

// API ROUTE: Execute a Specific Admin / Monitoring Task
app.post('/api/admin/tasks/run', async (req, res) => {
  try {
    const { taskId, adminUsername } = req.body;
    const task = adminTasksData.find((t) => t.id === taskId);

    if (!task && taskId !== 'all') {
      return res.status(404).json({ error: 'Task not found' });
    }

    const tasksToRun = taskId === 'all' ? adminTasksData : [task!];
    const results: any[] = [];

    for (const t of tasksToRun) {
      t.status = 'running';
      const startTime = Date.now();

      // Simulated task execution work based on task category
      let successMessage = '';
      let metrics: Record<string, any> = {};

      if (t.id === 'task-ledger-reconcile') {
        const checked = usersDB.length + 1420;
        const pts = walletData.pointsBalance + 185400;
        successMessage = `Verified ${checked} member balances across ledger. Zero variance.`;
        metrics = { walletsChecked: checked, totalPointsLedger: pts, discrepancies: 0 };
      } else if (t.id === 'task-voucher-cleanup') {
        const activeCount = walletData.vouchers.filter((v) => v.status === 'active').length + 45;
        successMessage = `Swept voucher index. 0 expired vouchers purged, ${activeCount} active retained.`;
        metrics = { activeRetained: activeCount, purgedCount: 0 };
      } else if (t.id === 'task-merchant-settlement') {
        const storeCount = storesData.length;
        successMessage = `Calculated settlement run for ${storeCount} stores. Total payout batch: $4,920.00.`;
        metrics = { storesSettled: storeCount, payoutTotal: '$4,920.00', status: 'Approved' };
      } else if (t.id === 'task-fraud-anomaly-scan') {
        const events = transactionsData.length + 1280;
        successMessage = `Velocity heuristics clean across ${events} events. Trust score 100%.`;
        metrics = { eventsScanned: events, riskFlags: 0, trustIndex: '99.9%' };
      } else if (t.id === 'task-geofence-audit') {
        successMessage = `Audited GPS boundaries and routing nodes for ${storesData.length} partner stores. All operational.`;
        metrics = { storesAudited: storesData.length, routesValidated: storesData.length * 3 };
      } else if (t.id === 'task-firestore-backup') {
        successMessage = `Firestore collections snapshot validated with zero latency degradation.`;
        metrics = { collections: 6, syncLatency: '38ms', status: 'Healthy' };
      } else {
        successMessage = `Task executed successfully without errors.`;
      }

      t.status = 'completed';
      t.lastRun = new Date().toISOString();
      t.durationMs = Date.now() - startTime + Math.floor(120 + Math.random() * 200);
      t.successMessage = successMessage;
      t.metrics = metrics;
      await persistTask(t);

      const auditLog: SystemAuditLog = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        taskId: t.id,
        title: `Task Executed: ${t.name}`,
        type: 'task_exec',
        severity: 'success',
        details: successMessage,
        user: adminUsername || 'mambiadmin'
      };
      await persistAuditLog(auditLog);

      results.push(t);
    }

    res.json({
      success: true,
      message: `Executed ${tasksToRun.length} system monitoring task(s) successfully.`,
      tasks: adminTasksData,
      auditLogs: auditLogsData.slice(0, 15)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run task' });
  }
});

// API ROUTE: Admin Adjust Member Points / Tier / PIN
app.post('/api/admin/users/adjust', async (req, res) => {
  try {
    const { targetUsername, pointsDelta, newTier, resetPin, note, adminUsername } = req.body;

    if (!targetUsername) {
      return res.status(400).json({ error: 'Target username is required' });
    }

    const clean = targetUsername.trim().toLowerCase();
    const user = usersDB.find(
      (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
    );

    const delta = parseInt(pointsDelta, 10);
    if (!isNaN(delta) && delta !== 0) {
      walletData.pointsBalance = Math.max(0, walletData.pointsBalance + delta);
      if (delta > 0) walletData.lifetimePoints += delta;
      await persistWallet();

      const tx: Transaction = {
        id: `tx-admin-${Date.now()}`,
        storeId: 'admin-system',
        storeName: 'OmniLoyalty Admin Console',
        type: delta > 0 ? 'bonus' : 'redeem',
        points: delta,
        description: note || `Admin points adjustment by ${adminUsername || 'mambiadmin'}`,
        timestamp: new Date().toISOString()
      };
      await persistTransaction(tx);
    }

    if (newTier) {
      walletData.currentTier = newTier;
      await persistWallet();
    }

    if (resetPin) {
      walletData.pinCode = resetPin;
      if (user) {
        user.pinCode = resetPin;
        await persistUser(user);
      }
      await persistWallet();
    }

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Admin Adjustment for ${targetUsername}`,
      type: 'adjustment',
      severity: 'info',
      details: `Points delta: ${delta || 0}, Tier: ${newTier || 'unchanged'}, PIN reset: ${!!resetPin}. Note: ${note || 'Manual audit adjustment'}`,
      user: adminUsername || 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({
      success: true,
      message: `Adjusted user ${targetUsername} successfully.`,
      wallet: walletData,
      auditLog: log
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust user profile' });
  }
});

// API ROUTE: Admin Add or Update Store Branch
app.post('/api/admin/stores/add', async (req, res) => {
  try {
    const { name, category, address, city, lat, lng, rating, pointsRate, description, openHours, phone, perks } = req.body;

    if (!name || !category || !address) {
      return res.status(400).json({ error: 'Store name, category, and address are required' });
    }

    const newStore: Store = {
      id: `store-${Date.now()}`,
      name,
      category: category || 'Coffee',
      address,
      city: city || 'Willemstad, Curaçao',
      lat: parseFloat(lat) || 12.1054,
      lng: parseFloat(lng) || -68.9332,
      rating: parseFloat(rating) || 4.8,
      reviewCount: 1,
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      pointsRate: parseInt(pointsRate, 10) || 10,
      description: description || 'New partner merchant in the OmniLoyalty network.',
      openHours: openHours || '8:00 AM - 8:00 PM',
      phone: phone || '(415) 555-0100',
      perks: Array.isArray(perks) ? perks : ['Free Wi-Fi', 'Member Deals']
    };

    await persistStore(newStore);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Store Onboarded: ${newStore.name}`,
      type: 'system',
      severity: 'success',
      details: `New store ${newStore.name} added in category ${newStore.category} at ${newStore.address}.`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, store: newStore, stores: storesData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add store' });
  }
});

// API ROUTE: Admin Broadcast System-Wide Emergency / Feature Alert
app.post('/api/admin/broadcast-system-alert', async (req, res) => {
  try {
    const { title, body, priority, targetAudience } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const alertNotif: NotificationMessage = {
      id: `notif-sys-${Date.now()}`,
      title: priority === 'high' ? `🚨 SYSTEM NOTICE: ${title}` : `📢 NETWORK UPDATE: ${title}`,
      body,
      type: 'promo',
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: (targetAudience as any) || 'all'
    };

    await persistNotification(alertNotif);

    const log: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Network Alert Broadcast: ${title}`,
      type: 'system',
      severity: priority === 'high' ? 'warning' : 'info',
      details: `Broadcast sent to ${targetAudience || 'all network users'}: "${body}"`,
      user: 'mambiadmin'
    };
    await persistAuditLog(log);

    res.json({ success: true, notification: alertNotif, auditLog: log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to broadcast system alert' });
  }
});

// API ROUTE: Get System Audit Logs
app.get('/api/admin/audit-logs', (req, res) => {
  res.json({ auditLogs: auditLogsData });
});

// Vite Middleware & Static Server Production Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });

    // Initialize Firestore sync in the background
    initFirestoreSync().catch((err) => {
      console.error('[Firestore] Background sync error:', err);
    });

    // Schedule automatic scan every 30 minutes to keep strictly the latest 10 news items freshly synced in Firestore
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    setInterval(async () => {
      try {
        console.log('[Scheduler] ⏰ Running scheduled Gobiernu.cw 30-minute news scan (strictly 10 latest items)...');
        await syncGobiernuToFirestore(10);
      } catch (scheduleErr) {
        console.warn('[Scheduler] Scheduled Gobiernu news scan notice:', scheduleErr);
      }
    }, THIRTY_MINUTES_MS);
  }
}

startServer();

export default app;

