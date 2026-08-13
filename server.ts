import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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
  MerchantStats
} from './src/types';

// Initialize Express App
const app = express();
app.use(express.json());

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
  persistUser,
  persistWallet,
  persistTransaction,
  persistNotification,
  persistReward,
  storesData,
  rewardsData,
  walletData,
  transactionsData,
  notificationsData,
  usersDB,
  RegisteredUser
} from './server/dbSync.js';

// In-Memory Fallback State (delegated to dbSync)
let merchantStatsData = { ...INITIAL_MERCHANT_STATS };

// API ROUTE: User Authentication (Login)
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const foundUser = usersDB.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (foundUser && foundUser.password === password) {
      const pinCode = foundUser.pinCode || walletData.pinCode || '12345';
      return res.json({
        success: true,
        user: {
          username: foundUser.username,
          name: foundUser.fullName,
          email: foundUser.email,
          passId: foundUser.passId,
          pinCode: pinCode,
          pointsBalance: walletData.pointsBalance,
          currentTier: walletData.currentTier
        },
        token: `token-${Date.now()}-${foundUser.username}`
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid username or password. Please check your credentials.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// API ROUTE: User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, username, email, password, pinCode } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields (Full Name, Username, Email, Password, PIN) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanPin = (pinCode || '12345').trim();
    if (!/^\d{5}$/.test(cleanPin)) {
      return res.status(400).json({ error: 'Security PIN must be exactly 5 digits (0-9).' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = usersDB.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
      }
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    const newPassId = `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`;
    const newUser: RegisteredUser = {
      username: cleanUsername,
      password,
      fullName: fullName.trim(),
      email: cleanEmail,
      passId: newPassId,
      pinCode: cleanPin
    };

    await persistUser(newUser);

    // Update wallet user details for new registration session
    walletData.userName = newUser.fullName;
    walletData.userEmail = newUser.email;
    walletData.passId = newUser.passId;
    walletData.pinCode = newUser.pinCode;
    await persistWallet();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: {
        username: newUser.username,
        name: newUser.fullName,
        email: newUser.email,
        passId: newUser.passId,
        pinCode: newUser.pinCode,
        pointsBalance: walletData.pointsBalance,
        currentTier: walletData.currentTier
      },
      token: `token-${Date.now()}-${newUser.username}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
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
      instruction: `Head ${latDiff > 0 ? 'North' : 'South'} toward Main Ave`,
      distanceMeters: Math.round(distKm * 400),
      durationSeconds: Math.round(durationMin * 24),
      lat: origLat,
      lng: origLng,
      action: 'head'
    });

    steps.push({
      instruction: `Turn ${lngDiff > 0 ? 'Right' : 'Left'} onto Center St`,
      distanceMeters: Math.round(distKm * 300),
      durationSeconds: Math.round(durationMin * 18),
      lat: way1Lat,
      lng: way1Lng,
      action: lngDiff > 0 ? 'turn_right' : 'turn_left'
    });

    steps.push({
      instruction: `Continue past 4th Street intersection for 2 blocks`,
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

// API ROUTE: Get Merchant Dashboard Data
app.get('/api/merchant/stats', (req, res) => {
  const { storeId } = req.query;
  const activeStoreId = (storeId as string) || 'store-1';
  const store = storesData.find((s) => s.id === activeStoreId) || storesData[0];

  const storeTxs = transactionsData.filter((t) => t.storeId === store.id);
  const issuedToday = storeTxs
    .filter((t) => t.type === 'earn')
    .reduce((sum, t) => sum + t.points, 0);
  const redeemedToday = Math.abs(
    storeTxs
      .filter((t) => t.type === 'redeem')
      .reduce((sum, t) => sum + t.points, 0)
  );

  const stats: MerchantStats = {
    storeId: store.id,
    storeName: store.name,
    todayPointsIssued: issuedToday + 1250,
    todayPointsRedeemed: redeemedToday + 450,
    todayTransactions: storeTxs.length + 18,
    todayRevenueEstimate: 420.50 + storeTxs.reduce((sum, t) => sum + (t.amountSpent || 0), 0),
    activeMembersCount: 285 + storeTxs.length,
    recentActivity: storeTxs.length > 0 ? storeTxs : INITIAL_TRANSACTIONS,
    monthlyDistribution: INITIAL_MERCHANT_STATS.monthlyDistribution
  };

  res.json({ stats, storeRewards: rewardsData.filter((r) => r.storeId === store.id) });
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

// Vite Middleware & Static Server Production Setup
async function startServer() {
  await initFirestoreSync();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
