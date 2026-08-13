export type UserTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type UserRole = 'user' | 'merchant' | 'admin';

export interface Store {
  id: string;
  name: string;
  category: 'Coffee' | 'Fashion' | 'Grocery' | 'Electronics' | 'Dining' | 'Wellness';
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  image: string;
  pointsRate: number; // e.g. 10 points per $1 spent
  description: string;
  distanceKm?: number;
  openHours: string;
  phone: string;
  perks?: string[];
  featuredReward?: string;
}

export interface RewardItem {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  image: string;
  expiryDays: number;
  minTier?: UserTier;
  code: string;
  discountValue: string;
}

export interface UserVoucher {
  id: string;
  rewardId: string;
  storeId: string;
  storeName: string;
  title: string;
  pointsSpent: number;
  claimedAt: string;
  expiresAt: string;
  qrCode: string;
  status: 'active' | 'used' | 'expired';
}

export interface Transaction {
  id: string;
  storeId: string;
  storeName: string;
  type: 'earn' | 'redeem' | 'bonus' | 'tier_reward';
  points: number; // positive for earn, negative for redeem
  amountSpent?: number;
  description: string;
  timestamp: string;
  voucherTitle?: string;
}

export interface UserWallet {
  userId: string;
  userName: string;
  userEmail: string;
  passId: string;
  qrCodeData: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentTier: UserTier;
  vouchers: UserVoucher[];
  pinCode?: string;
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  lat: number;
  lng: number;
  action: 'head' | 'turn_left' | 'turn_right' | 'continue' | 'arrive';
}

export interface NavigationRoute {
  storeId: string;
  storeName: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  distanceKm: number;
  durationMinutes: number;
  mode: 'walking' | 'driving' | 'biking';
  steps: NavigationStep[];
  pathPoints: [number, number][]; // [lat, lng] array
}

export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  type: 'earn' | 'redeem' | 'promo' | 'tier' | 'navigation';
  timestamp: string;
  read: boolean;
  storeId?: string;
  actionUrl?: string;
  targetRole: 'user' | 'merchant' | 'all';
}

export interface MerchantStats {
  storeId: string;
  storeName: string;
  todayPointsIssued: number;
  todayPointsRedeemed: number;
  todayTransactions: number;
  todayRevenueEstimate: number;
  activeMembersCount: number;
  recentActivity: Transaction[];
  monthlyDistribution: { day: string; pointsIssued: number; pointsRedeemed: number }[];
}

export interface AIPerksRequest {
  userPoints: number;
  userTier: UserTier;
  userLat?: number;
  userLng?: number;
  queryType: 'user_recommendations' | 'merchant_promo_copy';
  storeContext?: Partial<Store>;
}

export interface AIPerksResponse {
  summary: string;
  recommendations: {
    title: string;
    description: string;
    actionType: 'redeem' | 'visit' | 'upgrade';
    storeName?: string;
    pointsNeeded?: number;
  }[];
  generatedPromo?: string;
}

export interface AdminTask {
  id: string;
  name: string;
  description: string;
  category: 'accounting' | 'security' | 'database' | 'maintenance';
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  durationMs?: number;
  successMessage?: string;
  frequency?: string;
  metrics?: Record<string, any>;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  taskId?: string;
  title: string;
  type: 'task_exec' | 'security' | 'adjustment' | 'system';
  severity: 'info' | 'success' | 'warning' | 'error';
  details: string;
  user?: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalStores: number;
  totalRewards: number;
  totalTransactions: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalEstRevenue: number;
  firestoreStatus: {
    connected: boolean;
    mode: string;
    lastSync: string;
    collectionsCount: number;
  };
}

