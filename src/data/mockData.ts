import { Store, RewardItem, UserWallet, Transaction, NotificationMessage, MerchantStats } from '../types';

export const INITIAL_USER_LOCATION = {
  lat: 12.1054,
  lng: -68.9332,
  cityName: 'Willemstad, Curaçao (Punda)'
};

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'Dushi Roast Artisan Coffee',
    category: 'Coffee',
    address: 'Handelskade 14, Punda, Willemstad, Curaçao',
    city: 'Willemstad',
    lat: 12.1054,
    lng: -68.9332,
    rating: 4.9,
    reviewCount: 342,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    pointsRate: 10, // 10 pts per Cg 1
    description: 'Specialty single-origin espresso, cold brew, and fresh pastries overlooking the iconic Handelskade.',
    openHours: '7:00 AM - 7:00 PM',
    phone: '+599 9 461-2345',
    perks: ['Free Wi-Fi with Harbor View', 'Oat Milk Upgrade', 'Double Points Tuesdays'],
    featuredReward: 'Free Artisanal Espresso or Cold Brew'
  },
  {
    id: 'store-2',
    name: 'Kura Hulanda Threads & Boutique',
    category: 'Fashion',
    address: 'Klipstraat 9, Otrobanda, Willemstad, Curaçao',
    city: 'Willemstad',
    lat: 12.1082,
    lng: -68.9370,
    rating: 4.8,
    reviewCount: 218,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    pointsRate: 15, // 15 pts per Cg 1
    description: 'Curated Caribbean resort fashion, linen shirts, artisanal accessories, and local handcrafted jewelry.',
    openHours: '10:00 AM - 7:00 PM',
    phone: '+599 9 462-8841',
    perks: ['Personal Stylist Advice', 'Free Alterations for Gold Members', 'Birthday Gift'],
    featuredReward: 'Cg 15 Off Island Apparel'
  },
  {
    id: 'store-3',
    name: 'Mangusa Fresh Market & Organics',
    category: 'Grocery',
    address: 'Cas Coraweg 47, Willemstad, Curaçao',
    city: 'Willemstad',
    lat: 12.1285,
    lng: -68.9035,
    rating: 4.9,
    reviewCount: 512,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    pointsRate: 5, // 5 pts per Cg 1
    description: 'Fresh local tropical fruits, gourmet European imports, Dutch cheese counter, and organic pantry staples.',
    openHours: '8:00 AM - 9:00 PM',
    phone: '+599 9 737-0374',
    perks: ['Free Eco Shopping Bag', 'Senior Discount Wednesdays', '100 Bonus Points on Fresh Tropical Produce'],
    featuredReward: 'Cg 10 Storewide Grocery Coupon'
  },
  {
    id: 'store-4',
    name: 'TechHub Curaçao & Gadgets',
    category: 'Electronics',
    address: 'Saliña Galleries Unit 12, Saliña, Curaçao',
    city: 'Saliña',
    lat: 12.1095,
    lng: -68.9130,
    rating: 4.7,
    reviewCount: 189,
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
    pointsRate: 8,
    description: 'Smartphones, waterproof action cameras, wireless sound systems, and certified device repair service.',
    openHours: '9:30 AM - 7:00 PM',
    phone: '+599 9 465-0912',
    perks: ['Free Screen Protector Installation', 'Extended Warranty Points Multiplier'],
    featuredReward: '25% Off Any Audio Accessory'
  },
  {
    id: 'store-5',
    name: 'Mambo Beach Grill & Lounge',
    category: 'Dining',
    address: 'Bapor Kìbrá z/n, Mambo Beach Boulevard, Curaçao',
    city: 'Mambo Beach',
    lat: 12.0885,
    lng: -68.8982,
    rating: 4.8,
    reviewCount: 290,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    pointsRate: 12,
    description: 'Beachfront grilled catch-of-the-day, tropical smoothie bar, tapas, and sunset cocktails right on the sand.',
    openHours: '9:00 AM - 11:00 PM',
    phone: '+599 9 461-8453',
    perks: ['Oceanfront Sunbed Discount', 'Reusable Cup Refill Bonus', 'Live DJ Sunset Points Boost'],
    featuredReward: 'Free Tropical Smoothie or Sunset Mocktail'
  },
  {
    id: 'store-6',
    name: 'Papagayo Wellness & Spa Jan Thiel',
    category: 'Wellness',
    address: 'Jan Thiel Baai z/n, Papagayo Plaza, Curaçao',
    city: 'Jan Thiel',
    lat: 12.0782,
    lng: -68.8788,
    rating: 4.9,
    reviewCount: 145,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    pointsRate: 20,
    description: 'Holistic Caribbean aromatherapy, deep tissue massages, organic aloe vera facials, and oceanview sauna.',
    openHours: '9:00 AM - 7:00 PM',
    phone: '+599 9 747-0728',
    perks: ['Complimentary Island Aloe Scrub', 'Relaxation Lounge Access'],
    featuredReward: 'Cg 25 Off Aromatherapy Session'
  },
  {
    id: 'store-7',
    name: 'Pietermaai Ocean Bistro & Tapas',
    category: 'Dining',
    address: 'Nieuwestraat 34, Pietermaai, Willemstad, Curaçao',
    city: 'Willemstad',
    lat: 12.1028,
    lng: -68.9285,
    rating: 4.9,
    reviewCount: 204,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    pointsRate: 12,
    description: 'Vibrant courtyard dining featuring Caribbean-fusion tapas, fresh seafood ceviche, and international wines.',
    openHours: '5:00 PM - 11:30 PM',
    phone: '+599 9 465-3412',
    perks: ['Historic Patio Seating', 'Live Jazz Nights Points Bonus', 'Welcome Tapas Sample'],
    featuredReward: 'Free Tapas Sampler with Dinner'
  },
  {
    id: 'store-8',
    name: 'Zuikertuintje Lifestyle Bakery',
    category: 'Bakery',
    address: 'Zuikertuintjeweg 1, Willemstad, Curaçao',
    city: 'Willemstad',
    lat: 12.1228,
    lng: -68.8985,
    rating: 4.8,
    reviewCount: 176,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    pointsRate: 10,
    description: 'Authentic Dutch stroopwafels, warm sourdough loaves, artisan pastries, and premium espresso in a lush garden setting.',
    openHours: '7:30 AM - 6:00 PM',
    phone: '+599 9 737-1299',
    perks: ['Outdoor Garden Terrace', 'Fresh Baked Morning Bonus', 'Complimentary Bakery Bag'],
    featuredReward: 'Free Fresh Stroopwafel & Cafe Latte'
  }
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew-101',
    storeId: 'store-1',
    storeName: 'Dushi Roast Artisan Coffee',
    title: 'Free Specialty Beverage',
    description: 'Redeem for any size latte, pour-over, cold brew, or espresso beverage overlooking the harbor.',
    pointsCost: 250,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80',
    expiryDays: 30,
    code: 'DUSHI-BEV-250',
    discountValue: 'Cg 6.50 Value'
  },
  {
    id: 'rew-102',
    storeId: 'store-1',
    storeName: 'Dushi Roast Artisan Coffee',
    title: 'Fresh Bag of Whole Bean Coffee (12oz)',
    description: 'Choose from Ethiopia Yirgacheffe, Colombia Supremo, or Caribbean House Blend beans.',
    pointsCost: 600,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80',
    expiryDays: 45,
    code: 'DUSHI-BEANS-600',
    discountValue: 'Cg 18.00 Value'
  },
  {
    id: 'rew-201',
    storeId: 'store-2',
    storeName: 'Kura Hulanda Threads & Boutique',
    title: 'Cg 15 Off Apparel Purchase',
    description: 'Valid on any order of Cg 40 or more across all resort fashion collections.',
    pointsCost: 500,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=500&q=80',
    expiryDays: 60,
    code: 'KURA-15OFF',
    discountValue: 'Cg 15.00 Voucher'
  },
  {
    id: 'rew-202',
    storeId: 'store-2',
    storeName: 'Kura Hulanda Threads & Boutique',
    title: 'Free Island Leather Key Ring or Card Holder',
    description: 'Handcrafted genuine leather accessory with Curaçao embossed seal.',
    pointsCost: 850,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=500&q=80',
    expiryDays: 90,
    minTier: 'Silver',
    code: 'KURA-LEATHER',
    discountValue: 'Cg 28.00 Gift'
  },
  {
    id: 'rew-301',
    storeId: 'store-3',
    storeName: 'Mangusa Fresh Market & Organics',
    title: 'Cg 10 Grocery Savings Coupon',
    description: 'Instant discount applied at checkout for fresh produce & organic groceries.',
    pointsCost: 400,
    category: 'Grocery',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
    expiryDays: 30,
    code: 'MANGUSA-10SAVE',
    discountValue: 'Cg 10.00 Off'
  },
  {
    id: 'rew-401',
    storeId: 'store-4',
    storeName: 'TechHub Curaçao & Gadgets',
    title: 'Wireless Fast Charger Pad',
    description: '15W Qi-certified rapid charging pad compatible with iOS and Android devices.',
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
    storeName: 'Mambo Beach Grill & Lounge',
    title: 'Free Tropical Smoothie or Sunset Drink',
    description: 'Choice of Mango-Passionfruit Colada, Caribbean Green Freeze, or Sunset Mocktail.',
    pointsCost: 450,
    category: 'Dining',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
    expiryDays: 30,
    code: 'MAMBO-DRINK-450',
    discountValue: 'Cg 14.50 Drink'
  }
];

export const INITIAL_WALLET: UserWallet = {
  userId: 'usr-88219',
  userName: 'Alex Rivera',
  userEmail: 'alex.rivera@example.com',
  passId: 'PASS-9842-CW',
  qrCodeData: 'OMNI-LOYALTY-USER-88219-CW-PASS',
  pointsBalance: 1280,
  lifetimePoints: 3450,
  currentTier: 'Gold',
  pinCode: '12345',
  vouchers: [
    {
      id: 'vouch-001',
      rewardId: 'rew-101',
      storeId: 'store-1',
      storeName: 'Dushi Roast Artisan Coffee',
      title: 'Free Specialty Beverage',
      pointsSpent: 250,
      claimedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
      qrCode: 'VOUCH-DUSHI-BEV-88219',
      status: 'active'
    }
  ]
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1001',
    storeId: 'store-1',
    storeName: 'Dushi Roast Artisan Coffee',
    type: 'earn',
    points: 120,
    amountSpent: 12.00,
    description: 'Purchased Oat Milk Latte & Fresh Croissant in Punda',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'tx-1002',
    storeId: 'store-1',
    storeName: 'Dushi Roast Artisan Coffee',
    type: 'redeem',
    points: -250,
    voucherTitle: 'Free Specialty Beverage',
    description: 'Claimed reward voucher for Handelskade Espresso',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'tx-1003',
    storeId: 'store-2',
    storeName: 'Kura Hulanda Threads & Boutique',
    type: 'earn',
    points: 450,
    amountSpent: 30.00,
    description: 'Purchased Linen Beach Shirt in Otrobanda',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'tx-1004',
    storeId: 'store-3',
    storeName: 'Mangusa Fresh Market & Organics',
    type: 'earn',
    points: 260,
    amountSpent: 52.00,
    description: 'Fresh mangoes, Dutch cheese & island bakery goods',
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'tx-1005',
    storeId: 'system',
    storeName: 'OmniLoyalty Curaçao Network',
    type: 'bonus',
    points: 500,
    description: 'Gold Tier Upgrade Welcome Bonus!',
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: NotificationMessage[] = [
  {
    id: 'notif-1',
    title: '⚡ Double Points Activated in Willemstad!',
    body: 'Dushi Roast Coffee is offering 20 points per Cg 1 spent until 6:00 PM today.',
    type: 'promo',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    storeId: 'store-1',
    targetRole: 'user'
  },
  {
    id: 'notif-2',
    title: '🎉 Points Earned (+120 pts)',
    body: 'You earned 120 points for your Cg 12.00 purchase at Dushi Roast Artisan Coffee.',
    type: 'earn',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: true,
    storeId: 'store-1',
    targetRole: 'user'
  },
  {
    id: 'notif-3',
    title: '🏆 Gold Member Tier Reward Unlocked',
    body: 'Congratulations! You now get free alterations at Kura Hulanda Boutique and 1.5x points speed across Curaçao!',
    type: 'tier',
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
    read: true,
    targetRole: 'user'
  }
];

export const INITIAL_MERCHANT_STATS: MerchantStats = {
  storeId: 'store-1',
  storeName: 'Dushi Roast Artisan Coffee',
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
