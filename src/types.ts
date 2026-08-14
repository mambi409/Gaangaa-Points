export type UserTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type UserRole = 'user' | 'merchant' | 'admin';

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface StoreWeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Store {
  id: string;
  name: string;
  category: 'Coffee' | 'Fashion' | 'Grocery' | 'Electronics' | 'Dining' | 'Wellness' | 'Bakery' | 'Beauty' | 'Services' | string;
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
  email?: string;
  secondaryPhone?: string;
  website?: string;
  perks?: string[];
  featuredReward?: string;
  schedule?: StoreWeeklySchedule;
  totalPointsRewarded?: number;
  totalPointsRedeemed?: number;
  managerName?: string;
  socialHandle?: string;
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
  totalPointsRewardedAllTime?: number;
  totalPointsRedeemedAllTime?: number;
  totalRevenueAllTime?: number;
  averagePointsPerSale?: number;
  pointsBySource?: { source: string; points: number; count: number; percentage: number }[];
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

export interface AdminPost {
  id: string;
  title: string;
  content: string;
  category: 'Announcement' | 'Promotion' | 'Update' | 'Reward Alert' | 'Community';
  imageUrl?: string;
  author: string;
  targetAudience: 'all' | 'user' | 'merchant';
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt?: string;
  likesCount?: number;
  featured?: boolean;
}

export interface AdminUserItem {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  passId: string;
  pinCode: string;
  role: UserRole;
  pointsBalance: number;
  lifetimePoints?: number;
  currentTier: UserTier;
  createdAt?: string;
  status?: 'active' | 'pending_verification' | 'suspended';
  emailVerified?: boolean;
  verificationSentAt?: string;
}

