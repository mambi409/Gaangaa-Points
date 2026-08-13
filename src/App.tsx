import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
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
  const [currentRole, setCurrentRole] = useState<'user' | 'merchant'>('user');
  const [activeView, setActiveView] = useState<'wallet' | 'explore' | 'map'>('wallet');

  // Authentication State
  const [authUser, setAuthUser] = useState<{ username: string; name: string; passId: string; token: string } | null>(() => {
    try {
      const saved = localStorage.getItem('omni_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!authUser);

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

  // Auth Callbacks
  const handleLoginSuccess = (user: { username: string; name: string; passId: string; token: string }) => {
    setAuthUser(user);
    localStorage.setItem('omni_auth_user', JSON.stringify(user));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('omni_auth_user');
    setIsLoginModalOpen(true);
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
      return data;
    } catch (err) {
      console.error('Error in QR scan check-in:', err);
      return { success: false };
    }
  };

  // Handle Redeeming Reward
  const handleRedeemReward = async (reward: RewardItem) => {
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
  };

  // Handle Merchant POS Scan
  const handleMerchantPOSScan = async (
    passId: string,
    action: 'earn' | 'redeem_voucher',
    amount?: number,
    voucherCode?: string
  ) => {
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
    return data;
  };

  // Handle Merchant Adding Reward Offer
  const handleMerchantAddReward = async (rewardData: Partial<RewardItem>) => {
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
  };

  // Handle Merchant Push Broadcast
  const handleMerchantSendBroadcast = async (title: string, body: string, targetAudience: string) => {
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

      {/* Main Header */}
      <Header
        currentRole={currentRole}
        onRoleToggle={setCurrentRole}
        wallet={wallet}
        unreadNotifsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        authUser={authUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
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
        {currentRole === 'user' ? (
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

      {/* Customer Login Modal - Mandatory for anonymous users */}
      <LoginModal
        isOpen={isLoginModalOpen || !authUser}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
