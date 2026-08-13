import { Store, RewardItem, UserWallet, Transaction, NotificationMessage, MerchantStats } from '../types';

export const INITIAL_USER_LOCATION = {
  lat: 37.7749,
  lng: -122.4194,
  cityName: 'Downtown San Francisco'
};

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'Metro Roast Artisan Coffee',
    category: 'Coffee',
    address: '450 Sutter St, San Francisco, CA 94108',
    city: 'San Francisco',
    lat: 37.7891,
    lng: -122.4082,
    rating: 4.8,
    reviewCount: 342,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    pointsRate: 10, // 10 pts per Cg 1
    description: 'Specialty single-origin espresso, pour-overs, and organic house pastries.',
    openHours: '7:00 AM - 7:00 PM',
    phone: '(415) 555-0192',
    perks: ['Free Wi-Fi', 'Oat Milk Upgrade', 'Double Points Tuesdays'],
    featuredReward: 'Free Artisanal Espresso or Cappuccino'
  },
  {
    id: 'store-2',
    name: 'Urban Threads Boutique',
    category: 'Fashion',
    address: '88 Maiden Ln, San Francisco, CA 94108',
    city: 'San Francisco',
    lat: 37.7882,
    lng: -122.4045,
    rating: 4.7,
    reviewCount: 218,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    pointsRate: 15, // 15 pts per Cg 1
    description: 'Curated modern streetwear, sustainable denim, and artisanal leather accessories.',
    openHours: '10:00 AM - 8:00 PM',
    phone: '(415) 555-0841',
    perks: ['Personal Stylist Session', 'Free Alterations for Gold Members', 'Birthday Gift'],
    featuredReward: 'Cg 15 Off Denim or Apparel'
  },
  {
    id: 'store-3',
    name: 'Fresh Market Organic Grocery',
    category: 'Grocery',
    address: '350 Market St, San Francisco, CA 94111',
    city: 'San Francisco',
    lat: 37.7915,
    lng: -122.3985,
    rating: 4.9,
    reviewCount: 512,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    pointsRate: 5, // 5 pts per Cg 1
    description: 'Farm-fresh local produce, artisan cheese counter, cold-pressed juices, and healthy pantry staples.',
    openHours: '8:00 AM - 9:00 PM',
    phone: '(415) 555-0374',
    perks: ['Free Organic Tote Bag', 'Senior & Student Discount Days', '100 Bonus Points on Fresh Produce'],
    featuredReward: 'Cg 10 Storewide Grocery Coupon'
  },
  {
    id: 'store-4',
    name: 'TechPulse Electronics & Gadgets',
    category: 'Electronics',
    address: '865 Market St, San Francisco, CA 94103',
    city: 'San Francisco',
    lat: 37.7845,
    lng: -122.4068,
    rating: 4.6,
    reviewCount: 189,
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
    pointsRate: 8,
    description: 'Latest wireless audio, smart home devices, premium cables, and tech repair service.',
    openHours: '9:30 AM - 9:00 PM',
    phone: '(415) 555-0912',
    perks: ['Free Screen Protector Installation', 'Extended Warranty Points Multiplier'],
    featuredReward: '25% Off Any Audio Accessory'
  },
  {
    id: 'store-5',
    name: 'Verde Kitchen & Juice Bar',
    category: 'Dining',
    address: '220 Montgomery St, San Francisco, CA 94104',
    city: 'San Francisco',
    lat: 37.7908,
    lng: -122.4021,
    rating: 4.8,
    reviewCount: 290,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    pointsRate: 12,
    description: 'Chef-crafted superfood grain bowls, cold-pressed green smoothies, and acai parfaits.',
    openHours: '8:00 AM - 6:00 PM',
    phone: '(415) 555-0453',
    perks: ['Vegan Options', 'Reusable Bottle Refill Bonus', 'Eco-Packaging Points Reward'],
    featuredReward: 'Free Cold-Pressed Superfood Juice'
  },
  {
    id: 'store-6',
    name: 'Zenith Wellness Spa & Skincare',
    category: 'Wellness',
    address: '555 California St, San Francisco, CA 94104',
    city: 'San Francisco',
    lat: 37.7924,
    lng: -122.4038,
    rating: 4.9,
    reviewCount: 145,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    pointsRate: 20,
    description: 'Holistic aromatherapy, massage therapy, organic facial care, and wellness tea lounge.',
    openHours: '10:00 AM - 7:00 PM',
    phone: '(415) 555-0728',
    perks: ['Complimentary Herbal Tea', 'Relaxation Lounge Access'],
    featuredReward: 'Cg 25 Off Aromatherapy Session'
  }
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew-101',
    storeId: 'store-1',
    storeName: 'Metro Roast Artisan Coffee',
    title: 'Free Specialty Beverage',
    description: 'Redeem for any size latte, pour-over, cold brew, or espresso beverage.',
    pointsCost: 250,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80',
    expiryDays: 30,
    code: 'METRO-BEV-250',
    discountValue: 'Cg 6.50 Value'
  },
  {
    id: 'rew-102',
    storeId: 'store-1',
    storeName: 'Metro Roast Artisan Coffee',
    title: 'Fresh Bag of Whole Bean Coffee (12oz)',
    description: 'Choose from Ethiopia Yirgacheffe, Colombia Supremo, or House Roast beans.',
    pointsCost: 600,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80',
    expiryDays: 45,
    code: 'METRO-BEANS-600',
    discountValue: 'Cg 18.00 Value'
  },
  {
    id: 'rew-201',
    storeId: 'store-2',
    storeName: 'Urban Threads Boutique',
    title: 'Cg 15 Off Apparel Purchase',
    description: 'Valid on any order of Cg 40 or more across all fashion categories.',
    pointsCost: 500,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=500&q=80',
    expiryDays: 60,
    code: 'URBAN-15OFF',
    discountValue: 'Cg 15.00 Voucher'
  },
  {
    id: 'rew-202',
    storeId: 'store-2',
    storeName: 'Urban Threads Boutique',
    title: 'Free Leather Key Ring or Card Holder',
    description: 'Handcrafted genuine leather accessory with gold-embossed logo.',
    pointsCost: 850,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=500&q=80',
    expiryDays: 90,
    minTier: 'Silver',
    code: 'URBAN-LEATHER',
    discountValue: 'Cg 28.00 Gift'
  },
  {
    id: 'rew-301',
    storeId: 'store-3',
    storeName: 'Fresh Market Organic Grocery',
    title: 'Cg 10 Grocery Savings Coupon',
    description: 'Instant discount applied at checkout for organic groceries.',
    pointsCost: 400,
    category: 'Grocery',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
    expiryDays: 30,
    code: 'FRESH-10SAVE',
    discountValue: 'Cg 10.00 Off'
  },
  {
    id: 'rew-401',
    storeId: 'store-4',
    storeName: 'TechPulse Electronics & Gadgets',
    title: 'Wireless Fast Charger Pad',
    description: '15W Qi-certified rapid charging pad compatible with iOS and Android.',
    pointsCost: 900,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=500&q=80',
    expiryDays: 60,
    code: 'TECH-CHARGER-900',
    discountValue: 'Cg 32.00 Value'
  },
  {
    id: 'rew-501',
    storeId: 'store-5',
    storeName: 'Verde Kitchen & Juice Bar',
    title: 'Free Superfood Grain Bowl',
    description: 'Choice of Warm Quinoa Harvest, Mediterranean Falafel, or Spicy Avocado bowl.',
    pointsCost: 450,
    category: 'Dining',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
    expiryDays: 30,
    code: 'VERDE-BOWL-450',
    discountValue: 'Cg 14.50 Meal'
  }
];

export const INITIAL_WALLET: UserWallet = {
  userId: 'usr-88219',
  userName: 'Alex Rivera',
  userEmail: 'alex.rivera@example.com',
  passId: 'PASS-9842-SF',
  qrCodeData: 'OMNI-LOYALTY-USER-88219-SF-PASS',
  pointsBalance: 1280,
  lifetimePoints: 3450,
  currentTier: 'Gold',
  vouchers: [
    {
      id: 'vouch-001',
      rewardId: 'rew-101',
      storeId: 'store-1',
      storeName: 'Metro Roast Artisan Coffee',
      title: 'Free Specialty Beverage',
      pointsSpent: 250,
      claimedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
      qrCode: 'VOUCH-METRO-BEV-88219',
      status: 'active'
    }
  ]
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1001',
    storeId: 'store-1',
    storeName: 'Metro Roast Artisan Coffee',
    type: 'earn',
    points: 120,
    amountSpent: 12.00,
    description: 'Purchased Oat Milk Latte & Almond Croissant',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'tx-1002',
    storeId: 'store-1',
    storeName: 'Metro Roast Artisan Coffee',
    type: 'redeem',
    points: -250,
    voucherTitle: 'Free Specialty Beverage',
    description: 'Claimed reward voucher for Specialty Beverage',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'tx-1003',
    storeId: 'store-2',
    storeName: 'Urban Threads Boutique',
    type: 'earn',
    points: 450,
    amountSpent: 30.00,
    description: 'Purchased Organic Cotton Tee',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'tx-1004',
    storeId: 'store-3',
    storeName: 'Fresh Market Organic Grocery',
    type: 'earn',
    points: 260,
    amountSpent: 52.00,
    description: 'Organic berries, avocado & artisanal bread',
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'tx-1005',
    storeId: 'system',
    storeName: 'OmniLoyalty Network',
    type: 'bonus',
    points: 500,
    description: 'Gold Tier Upgrade Welcome Bonus!',
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: NotificationMessage[] = [
  {
    id: 'notif-1',
    title: '⚡ Double Points Activated!',
    body: 'Metro Roast Coffee is offering 20 points per Cg 1 spent until 6:00 PM today.',
    type: 'promo',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    storeId: 'store-1',
    targetRole: 'user'
  },
  {
    id: 'notif-2',
    title: '🎉 Points Earned (+120 pts)',
    body: 'You earned 120 points for your Cg 12.00 purchase at Metro Roast Artisan Coffee.',
    type: 'earn',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: true,
    storeId: 'store-1',
    targetRole: 'user'
  },
  {
    id: 'notif-3',
    title: '🏆 Gold Member Tier Reward Unlocked',
    body: 'Congratulations! You now get free alterations at Urban Threads Boutique and 1.5x points speed!',
    type: 'tier',
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
    read: true,
    targetRole: 'user'
  }
];

export const INITIAL_MERCHANT_STATS: MerchantStats = {
  storeId: 'store-1',
  storeName: 'Metro Roast Artisan Coffee',
  todayPointsIssued: 3850,
  todayPointsRedeemed: 1500,
  todayTransactions: 42,
  todayRevenueEstimate: 485.00,
  activeMembersCount: 312,
  recentActivity: INITIAL_TRANSACTIONS.filter(t => t.storeId === 'store-1'),
  monthlyDistribution: [
    { day: 'Mon', pointsIssued: 2400, pointsRedeemed: 800 },
    { day: 'Tue', pointsIssued: 3900, pointsRedeemed: 1200 },
    { day: 'Wed', pointsIssued: 3100, pointsRedeemed: 1000 },
    { day: 'Thu', pointsIssued: 4500, pointsRedeemed: 1600 },
    { day: 'Fri', pointsIssued: 5800, pointsRedeemed: 2100 },
    { day: 'Sat', pointsIssued: 6400, pointsRedeemed: 2800 },
    { day: 'Sun', pointsIssued: 3850, pointsRedeemed: 1500 }
  ]
};
