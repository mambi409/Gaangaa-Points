import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DigitalWallet } from './components/CustomerView/DigitalWallet';
import { StoreFinder } from './components/CustomerView/StoreFinder';
import { InteractiveMap } from './components/CustomerView/InteractiveMap';
import { NavigationDrawer } from './components/CustomerView/NavigationDrawer';
import { ScanEarnModal } from './components/CustomerView/ScanEarnModal';
import { MerchantDashboard } from './components/MerchantView/MerchantDashboard';
import { POSScannerTerminal } from './components/MerchantView/POSScannerTerminal';
import { RewardCatalogManager } from './components/MerchantView/RewardCatalogManager';
import { PushNotificationBroadcaster } from './components/MerchantView/PushNotificationBroadcaster';
import { LoginModal } from './components/LoginModal';
import { PinVerificationModal } from './components/PinVerificationModal';
import { ProfileModal } from './components/ProfileModal';

import {
  Store,
  RewardItem,
  UserWallet,
  Transaction,
  NotificationMessage,
  NavigationRoute
} from './types';
import { INITIAL_WALLET, INITIAL_USER_LOCATION } from './data/mockData';

export default function App() {
  // Authentication State
  const [authUser, setAuthUser] = useState<{ username: string; name: string; email?: string; passId: string; pinCode?: string; token: string; role?: 'user' | 'merchant' } | null>(() => {
    try {
      const saved = localStorage.getItem('omni_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<'user' | 'merchant'>(
    authUser?.role === 'merchant' ? 'merchant' : 'user'
  );
  const [activeView, setActiveView] = useState<'home' | 'wallet' | 'explore' | 'map'>(
    authUser ? (authUser.role === 'merchant' ? 'wallet' : 'wallet') : 'home'
  );

  // Login Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [loginModalRole, setLoginModalRole] = useState<'user' | 'merchant'>('user');

  // Application State
  const [wallet, setWallet] = useState<UserWallet>(INITIAL_WALLET);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  // Selection & Navigation
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchantStoreId, setSelectedMerchantStoreId] = useState('store-1');

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isScanEarnOpen, setIsScanEarnOpen] = useState(false);
  const [isPOSTerminalOpen, setIsPOSTerminalOpen] = useState(false);
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [isPushBroadcasterOpen, setIsPushBroadcasterOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Security PIN Prompt State
  const [pinPrompt, setPinPrompt] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionButtonText: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionButtonText: '',
    onSuccess: () => {}
  });

  const promptPinVerification = (
    title: string,
    description: string,
    actionButtonText: string,
    onSuccess: () => void
  ) => {
    setPinPrompt({
      isOpen: true,
      title,
      description,
      actionButtonText,
      onSuccess
    });
  };

  // Auth Open Modal Handler
  const handleOpenAuth = (role: 'user' | 'merchant' = 'user', mode: 'login' | 'register' = 'login') => {
    setLoginModalRole(role);
    setLoginModalMode(mode);
    setIsLoginModalOpen(true);
  };

  // Auth Callbacks
  const handleLoginSuccess = (
    user: { username: string; name: string; email?: string; passId: string; pinCode?: string; token: string; role?: 'user' | 'merchant' },
    role: 'user' | 'merchant'
  ) => {
    const userWithRole = { ...user, role };
    setAuthUser(userWithRole);
    localStorage.setItem('omni_auth_user', JSON.stringify(userWithRole));
    setCurrentRole(role);
    setIsLoginModalOpen(false);

    if (role === 'user') {
      setActiveView('wallet'); // Customer goes to Digital Wallet page
    } else {
      setCurrentRole('merchant'); // Merchant goes to Merchant Dashboard
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('omni_auth_user');
    setActiveView('home'); // Logged out users return to public Home page
    setIsLoginModalOpen(false);
  };

  // Initial Data Fetching
  const fetchWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  };

  const fetchStoresData = async () => {
    try {
      const res = await fetch(
        `/api/stores?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(
          selectedCategory
        )}&userLat=${INITIAL_USER_LOCATION.lat}&userLng=${INITIAL_USER_LOCATION.lng}`
      );
      const data = await res.json();
      setStores(data.stores || []);
      if (!selectedStore && data.stores.length > 0) {
        setSelectedStore(data.stores[0]);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?role=${currentRole}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchStoresData();
    fetchNotifications();
  }, [selectedCategory, searchQuery, currentRole]);

  // Handle Turn-by-Turn Route Navigation
  const handleStartNavigation = async (store: Store, mode: 'walking' | 'driving' | 'biking' = 'walking') => {
    setSelectedStore(store);
    try {
      const res = await fetch(
        `/api/navigation/route?storeId=${store.id}&userLat=${INITIAL_USER_LOCATION.lat}&userLng=${INITIAL_USER_LOCATION.lng}&mode=${mode}`
      );
      const data = await res.json();
      setActiveRoute(data.route);
      setIsNavigationOpen(true);
      setActiveView('map');
    } catch (err) {
      console.error('Error fetching route:', err);
    }
  };

  // Handle Earning Points (Customer Scan Receipt)
  const handleEarnPoints = async (storeId: string, amount: number, description: string) => {
    try {
      const res = await fetch('/api/wallet/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, amountSpent: amount, description })
      });
      const data = await res.json();
      if (data.success) {
        await fetchWalletData();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error earning points:', err);
    }
  };

  // Handle Instant In-Store QR Scan Check-In (Earn 1 Point)
  const handleScanStoreQRCheckIn = async (storeId: string) => {
    return new Promise<any>((resolve) => {
      promptPinVerification(
        'Verify PIN for Walk-In Reward',
        'Claiming in-store walk-in points requires your 5-digit Security PIN verification.',
        'Confirm Check-In (+1 Pt)',
        async () => {
          try {
            const res = await fetch('/api/wallet/scan-qr-checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storeId })
            });
            const data = await res.json();
            if (data.success) {
              await fetchWalletData();
              await fetchNotifications();
            }
            resolve(data);
          } catch (err) {
            console.error('Error in QR scan check-in:', err);
            resolve({ success: false });
          }
        }
      );
    });
  };

  // Handle Redeeming Reward
  const handleRedeemReward = async (reward: RewardItem) => {
    promptPinVerification(
      'Verify 5-Digit PIN to Claim Reward',
      `Redeeming "${reward.title}" for ${reward.pointsCost} pts requires your 5-digit Security PIN.`,
      'Confirm & Redeem Reward',
      async () => {
        try {
          const res = await fetch('/api/wallet/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardId: reward.id })
          });
          const data = await res.json();
          if (data.success) {
            await fetchWalletData();
            await fetchNotifications();
          }
        } catch (err) {
          console.error('Error redeeming reward:', err);
        }
      }
    );
  };

  // Handle Merchant POS Scan
  const handleMerchantPOSScan = async (
    passId: string,
    action: 'earn' | 'redeem_voucher',
    amount?: number,
    voucherCode?: string
  ) => {
    return new Promise<any>((resolve) => {
      const label = action === 'earn' ? `Credit Points ($${amount})` : `Redeem Voucher (${voucherCode})`;
      promptPinVerification(
        'Merchant POS Security Authorization',
        `Authorizing POS action [${label}] for Member Pass ${passId} requires your 5-digit Merchant PIN.`,
        'Authorize POS Transaction',
        async () => {
          try {
            const res = await fetch('/api/merchant/scan-pass', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                passId,
                action,
                storeId: selectedMerchantStoreId,
                amount,
                voucherCode
              })
            });
            const data = await res.json();
            if (data.success) {
              await fetchWalletData();
              await fetchNotifications();
            }
            resolve(data);
          } catch (err) {
            console.error('POS scan error:', err);
            resolve({ success: false, message: 'POS transaction failed.' });
          }
        }
      );
    });
  };

  // Handle Merchant Adding Reward Offer
  const handleMerchantAddReward = async (rewardData: Partial<RewardItem>) => {
    promptPinVerification(
      'Merchant Catalog Authorization',
      `Publishing offer "${rewardData.title}" (${rewardData.pointsCost} pts) requires your 5-digit Merchant Security PIN.`,
      'Publish Reward Offer',
      async () => {
        try {
          const res = await fetch('/api/merchant/rewards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rewardData)
          });
          const data = await res.json();
          if (data.success) {
            await fetchStoresData();
            await fetchNotifications();
          }
        } catch (err) {
          console.error('Error adding reward:', err);
        }
      }
    );
  };

  // Handle Merchant Push Broadcast
  const handleMerchantSendBroadcast = async (title: string, body: string, targetAudience: string) => {
    promptPinVerification(
      'Merchant Push Broadcast Authorization',
      `Broadcasting deal notification "${title}" to members requires your 5-digit Merchant PIN.`,
      'Authorize Push Broadcast',
      async () => {
        try {
          const res = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              body,
              type: 'promo',
              storeId: selectedMerchantStoreId,
              targetRole: 'user'
            })
          });
          const data = await res.json();
          if (data.success) {
            await fetchNotifications();
          }
        } catch (err) {
          console.error('Broadcast error:', err);
        }
      }
    );
  };

  // Handle Profile Updates
  const handleProfileUpdated = (updatedUser: {
    username: string;
    name: string;
    email: string;
    passId: string;
    pinCode: string;
    role?: 'user' | 'merchant';
  }) => {
    setAuthUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
    const current = localStorage.getItem('omni_auth_user');
    if (current) {
      try {
        const parsed = JSON.parse(current);
        localStorage.setItem('omni_auth_user', JSON.stringify({ ...parsed, ...updatedUser }));
      } catch (e) {}
    }
    fetchWalletData();
  };

  // Handle Mock Test Push Notification
  const handleSendMockPush = async (title: string, body: string, type: NotificationMessage['type']) => {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        type,
        targetRole: currentRole
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchNotifications();
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/mark-read', { method: 'POST' });
    fetchNotifications();
  };

  // Dismiss Toast
  const handleDismissToast = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Handle Navigation Arrival Notification
  const handleArrivedAtStore = (storeName: string) => {
    handleSendMockPush(
      `📍 Arrived at ${storeName}!`,
      `Show your OmniPass QR code at the checkout counter to collect points.`,
      'navigation'
    );
  };

  const activeMerchantStore = stores.find((s) => s.id === selectedMerchantStoreId) || stores[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Real-Time Push Notification Toasts */}
      <NotificationToastContainer notifications={notifications} onDismiss={handleDismissToast} />

      {/* Main Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleToggle={(role) => {
          setCurrentRole(role);
          if (role === 'user' && activeView === 'home' && authUser) {
            setActiveView('wallet');
          }
        }}
        wallet={wallet}
        unreadNotifsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        authUser={authUser}
        onLogout={handleLogout}
        onOpenLogin={(mode?: 'login' | 'register') => handleOpenAuth('user', mode || 'login')}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onSendMockPush={handleSendMockPush}
        currentRole={currentRole}
      />

      {/* Main Body Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {activeView === 'home' ? (
          /* Public Home Landing Page */
          <Home
            stores={stores}
            onOpenMemberAuth={(mode) => handleOpenAuth('user', mode)}
            onOpenMerchantAuth={() => handleOpenAuth('merchant', 'login')}
            onExploreStores={() => setActiveView('explore')}
          />
        ) : currentRole === 'user' ? (
          <>
            {/* View Switching Logic for Customer App */}
            {activeView === 'wallet' && (
              <DigitalWallet
                wallet={wallet}
                transactions={transactions}
                onOpenScanEarn={() => setIsScanEarnOpen(true)}
                onSelectStore={(storeId) => {
                  const s = stores.find((item) => item.id === storeId);
                  if (s) {
                    setSelectedStore(s);
                    setActiveView('explore');
                  }
                }}
              />
            )}

            {activeView === 'explore' && (
              <StoreFinder
                stores={stores}
                rewards={rewards.length > 0 ? rewards : wallet.vouchers.map(v => ({
                  id: v.rewardId,
                  storeId: v.storeId,
                  storeName: v.storeName,
                  title: v.title,
                  description: 'Store reward deal',
                  pointsCost: v.pointsSpent,
                  category: 'General',
                  image: '',
                  expiryDays: 30,
                  code: v.qrCode,
                  discountValue: 'Special Reward'
                }))}
                userPoints={wallet.pointsBalance}
                onNavigateToStore={handleStartNavigation}
                onRedeemReward={handleRedeemReward}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeView === 'map' && (
              <InteractiveMap
                stores={stores}
                selectedStore={selectedStore}
                onSelectStore={setSelectedStore}
                userLat={INITIAL_USER_LOCATION.lat}
                userLng={INITIAL_USER_LOCATION.lng}
                activeRoute={activeRoute}
                onStartNavigation={handleStartNavigation}
              />
            )}
          </>
        ) : (
          /* Merchant Dashboard View */
          <MerchantDashboard
            stores={stores}
            selectedStoreId={selectedMerchantStoreId}
            onSelectStore={setSelectedMerchantStoreId}
            onOpenPOSTerminal={() => setIsPOSTerminalOpen(true)}
            onOpenAddReward={() => setIsAddRewardOpen(true)}
            onOpenPushBroadcaster={() => setIsPushBroadcasterOpen(true)}
          />
        )}
      </main>

      {/* Customer In-Store Point Collector Modal */}
      <ScanEarnModal
        isOpen={isScanEarnOpen}
        onClose={() => setIsScanEarnOpen(false)}
        stores={stores}
        onEarnPoints={handleEarnPoints}
        onScanQRCheckIn={handleScanStoreQRCheckIn}
      />

      {/* Real-time Navigation Overlay */}
      {isNavigationOpen && (
        <NavigationDrawer
          route={activeRoute}
          store={selectedStore}
          onClose={() => setIsNavigationOpen(false)}
          onChangeMode={(mode) => selectedStore && handleStartNavigation(selectedStore, mode)}
          onArrivedPush={handleArrivedAtStore}
        />
      )}

      {/* Merchant POS Terminal Modal */}
      {activeMerchantStore && (
        <POSScannerTerminal
          isOpen={isPOSTerminalOpen}
          onClose={() => setIsPOSTerminalOpen(false)}
          activeStore={activeMerchantStore}
          onProcessScan={handleMerchantPOSScan}
        />
      )}

      {/* Merchant Add Reward Offer Modal */}
      {activeMerchantStore && (
        <RewardCatalogManager
          isOpen={isAddRewardOpen}
          onClose={() => setIsAddRewardOpen(false)}
          activeStore={activeMerchantStore}
          onAddReward={handleMerchantAddReward}
        />
      )}

      {/* Merchant Push Broadcaster Modal */}
      {activeMerchantStore && (
        <PushNotificationBroadcaster
          isOpen={isPushBroadcasterOpen}
          onClose={() => setIsPushBroadcasterOpen(false)}
          activeStore={activeMerchantStore}
          onSendBroadcast={handleMerchantSendBroadcast}
        />
      )}

      {/* Customer & Merchant Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialMode={loginModalMode}
        initialRole={loginModalRole}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Member & Merchant Account Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        authUser={authUser}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Important Transaction 5-Digit PIN Verification Modal */}
      <PinVerificationModal
        isOpen={pinPrompt.isOpen}
        onClose={() => setPinPrompt((prev) => ({ ...prev, isOpen: false }))}
        onVerifySuccess={() => {
          setPinPrompt((prev) => ({ ...prev, isOpen: false }));
          pinPrompt.onSuccess();
        }}
        title={pinPrompt.title}
        description={pinPrompt.description}
        actionButtonText={pinPrompt.actionButtonText}
        userPinCode={authUser?.pinCode || wallet?.pinCode || '12345'}
        username={authUser?.username}
      />
    </div>
  );
}
