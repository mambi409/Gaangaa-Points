import React, { useState, useEffect } from 'react';
import {
  Store as StoreIcon,
  Award,
  TrendingUp,
  Tag,
  Users,
  DollarSign,
  Scan,
  Plus,
  Send,
  Sparkles,
  Clock,
  ChevronRight,
  MapPin,
  Building,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FileText,
  Megaphone,
  Gift
} from 'lucide-react';
import { Store, MerchantStats, RewardItem, Transaction, AdminPost } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MerchantStoreProfileEditor } from './MerchantStoreProfileEditor';
import { MerchantPointsMonitor } from './MerchantPointsMonitor';
import { MerchantPromoManager } from './MerchantPromoManager';

interface MerchantDashboardProps {
  stores: Store[];
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
  onOpenPOSTerminal: () => void;
  onOpenAddReward: () => void;
  onOpenPushBroadcaster: () => void;
  onStoreUpdated?: (updatedStore: Store) => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  onOpenPOSTerminal,
  onOpenAddReward,
  onOpenPushBroadcaster,
  onStoreUpdated
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'promos' | 'points' | 'profile' | 'rewards'>('overview');
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [storeRewards, setStoreRewards] = useState<RewardItem[]>([]);
  const [merchantPosts, setMerchantPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active Store Object
  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0] || {
    id: 'store-1',
    name: 'Partner Store',
    category: 'Coffee',
    address: '450 Sutter St',
    city: 'San Francisco',
    lat: 37.7891,
    lng: -122.4082,
    rating: 4.8,
    reviewCount: 120,
    image: '',
    pointsRate: 10,
    pointsBalance: 14500,
    description: 'Partner store outlet',
    openHours: '7:00 AM - 7:00 PM',
    phone: '(415) 555-0192'
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchMerchantStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/merchant/stats?storeId=${activeStore.id}`);
      const data = await res.json();
      setStats(data.stats);
      setStoreRewards(data.storeRewards || []);
      if (data.merchantPosts) {
        setMerchantPosts(data.merchantPosts);
      }
    } catch (err) {
      console.error('Failed to fetch merchant stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantStats();
  }, [selectedStoreId]);

  const handleLocalStoreUpdated = (updatedStore: Store) => {
    if (onStoreUpdated) {
      onStoreUpdated(updatedStore);
    }
    fetchMerchantStats();
  };

  // Promo Posts CRUD Handlers
  const handleCreatePromoPost = async (postData: Partial<AdminPost>): Promise<boolean> => {
    try {
      const res = await fetch('/api/merchant/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postData,
          storeId: activeStore.id,
          storeName: activeStore.name
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Promo post published successfully! 🚀', 'success');
        fetchMerchantStats();
        return true;
      } else {
        showToast(data.error || 'Failed to create promo post', 'error');
        return false;
      }
    } catch (err) {
      showToast('Network error while creating promo post', 'error');
      return false;
    }
  };

  const handleUpdatePromoPost = async (postData: Partial<AdminPost>): Promise<boolean> => {
    try {
      const res = await fetch('/api/merchant/posts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Promo post updated successfully! ✨', 'success');
        fetchMerchantStats();
        return true;
      } else {
        showToast(data.error || 'Failed to update promo post', 'error');
        return false;
      }
    } catch (err) {
      showToast('Network error while updating promo post', 'error');
      return false;
    }
  };

  const handleDeletePromoPost = async (postId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/merchant/posts/${postId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Promo post deleted successfully.', 'info');
        setMerchantPosts((prev) => prev.filter((p) => p.id !== postId));
        fetchMerchantStats();
        return true;
      } else {
        showToast(data.error || 'Failed to delete promo post', 'error');
        return false;
      }
    } catch (err) {
      showToast('Network error while deleting promo post', 'error');
      return false;
    }
  };

  const handleTopupPoints = async (pointsToAdd: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/merchant/points/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: activeStore.id,
          pointsToAdd
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Points reserve replenished (+${pointsToAdd.toLocaleString()} pts)! ⭐`, 'success');
        fetchMerchantStats();
        return true;
      } else {
        showToast(data.error || 'Failed to top up points', 'error');
        return false;
      }
    } catch (err) {
      showToast('Network error while topping up points', 'error');
      return false;
    }
  };

  const pointsBalance = stats?.pointsBalance ?? activeStore.pointsBalance ?? 14500;
  const totalRewarded = stats?.totalPointsRewardedAllTime || activeStore.totalPointsRewarded || 32500;
  const totalRedeemed = stats?.totalPointsRedeemedAllTime || activeStore.totalPointsRedeemed || 9400;
  const activePromoCount = merchantPosts.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Merchant Navigation Header & Store Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          {activeStore.logo ? (
            <img
              src={activeStore.logo}
              alt={activeStore.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-200 bg-white p-0.5 shadow-xs shrink-0"
            />
          ) : (
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
              <StoreIcon className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                {language === 'es' ? 'Portal de Gestión para Comercios' : 'Merchant Partner Dashboard'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Store Outlet
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {activeStore.name}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {activeStore.address}
              </span>
              <span>•</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                {activeStore.category}
              </span>
            </div>
          </div>
        </div>

        {/* Store Location Switcher & Quick Launch POS */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {language === 'es' ? 'Sucursal Seleccionada' : 'Switch Store Location'}
            </label>
            <select
              value={activeStore.id}
              onChange={(e) => onSelectStore(e.target.value)}
              className="w-full sm:w-60 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <button
            id="launch-pos-terminal-btn"
            onClick={onOpenPOSTerminal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs self-end cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>{language === 'es' ? 'Abrir Terminal POS' : 'POS Scanner Terminal'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>{language === 'es' ? 'Resumen & Métricas' : 'Overview & Fast Actions'}</span>
        </button>

        <button
          type="button"
          id="merchant-tab-promo-posts"
          onClick={() => setActiveTab('promos')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'promos'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Megaphone className="w-4 h-4 text-blue-600" />
          <span>{language === 'es' ? 'Publicaciones & Promos' : 'Promo Posts & Deals'}</span>
          {activePromoCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">
              {activePromoCount}
            </span>
          )}
        </button>

        <button
          type="button"
          id="merchant-tab-points-monitor"
          onClick={() => setActiveTab('points')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'points'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>{language === 'es' ? 'Puntos Otorgados & Canjeados' : 'Points Balance & Ledger'}</span>
        </button>

        <button
          type="button"
          id="merchant-tab-store-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>{language === 'es' ? 'Editar Info, Mapa y Horarios' : 'Store Profile & Map Location'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Tag className="w-4 h-4 text-purple-600" />
          <span>{language === 'es' ? 'Catálogo de Ofertas' : 'Reward Offers'}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD SUMMARY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Merchant Key Metrics Grid: Points Balance, Points Rewarded, Points Redeemed, Promo Posts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Store Points Balance / Reserve */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'es' ? 'Saldo de Puntos' : 'Points Balance'}
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {pointsBalance.toLocaleString()} <span className="text-sm font-semibold text-slate-300">pts</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Store reserve available to reward members
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md">
                  🟢 Active Pool
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('points')}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Manage Reserve →
                </button>
              </div>
            </div>

            {/* Total Points Rewarded (Today & All-Time) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'es' ? 'Puntos Otorgados' : 'Points Rewarded'}
                  </span>
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-extrabold text-blue-700">
                  +{totalRewarded.toLocaleString()} <span className="text-sm font-semibold text-slate-500">pts</span>
                </div>
                <div className="inline-block text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md mt-2">
                  +{stats?.todayPointsIssued.toLocaleString() || '1,480'} pts rewarded today
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Rate: {activeStore.pointsRate || 10} pts / Cg 1 spent
              </p>
            </div>

            {/* Total Points Redeemed (Today & All-Time) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'es' ? 'Puntos Canjeados' : 'Points Redeemed'}
                  </span>
                  <Tag className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-extrabold text-purple-700">
                  -{totalRedeemed.toLocaleString()} <span className="text-sm font-semibold text-slate-500">pts</span>
                </div>
                <div className="inline-block text-[11px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md mt-2">
                  -{stats?.todayPointsRedeemed.toLocaleString() || '450'} pts redeemed today
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {storeRewards.length} active reward offers live
              </p>
            </div>

            {/* Promo Posts Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'es' ? 'Publicaciones Promo' : 'Promo Posts'}
                  </span>
                  <Megaphone className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {merchantPosts.length} <span className="text-sm font-semibold text-slate-500">posts</span>
                </div>
                <div className="inline-block text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md mt-2">
                  {activePromoCount} active live promotions
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('promos')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Manage Promo Posts →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Banners */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Promo Post Manager Quick Button */}
            <button
              onClick={() => setActiveTab('promos')}
              className="p-5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 w-fit mb-3">
                <Megaphone className="w-5 h-5 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Promo Posts
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Add, edit, and delete promo posts and flash deals for shoppers.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600">
                Manage Promos <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Quick Points Rewarded Monitor */}
            <button
              onClick={() => setActiveTab('points')}
              className="p-5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 w-fit mb-3">
                <Award className="w-5 h-5 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Points Ledger
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Track points balance, points rewarded, and points redeemed.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-600">
                View Ledger <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Quick Edit Store Info */}
            <button
              onClick={() => setActiveTab('profile')}
              className="p-5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit mb-3">
                <MapPin className="w-5 h-5 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Store Profile
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Update store map location, opening hours, category, and phone.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600">
                Edit Store <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Quick POS Scan */}
            <button
              onClick={onOpenPOSTerminal}
              className="p-5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 w-fit mb-3">
                <Scan className="w-5 h-5 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                POS Terminal
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Scan customer QR codes, reward points, and validate vouchers.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600">
                Launch Scanner <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Weekly Points Distribution Chart Visualization */}
          {stats && stats.monthlyDistribution && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {language === 'es' ? 'Volumen Semanal de Puntos' : 'Weekly Loyalty Points Activity'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'es'
                      ? `Puntos otorgados vs canjeados en ${activeStore.name}`
                      : `Points rewarded vs points redeemed at ${activeStore.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-3 h-3 rounded-xs bg-blue-600" /> {language === 'es' ? 'Puntos Otorgados' : 'Points Rewarded'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 rounded-xs bg-slate-300" /> {language === 'es' ? 'Canjeados' : 'Redeemed'}
                  </span>
                </div>
              </div>

              <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
                {stats.monthlyDistribution.map((item) => {
                  const maxVal = 7000;
                  const issuedHeight = Math.round((item.pointsIssued / maxVal) * 100);
                  const redeemedHeight = Math.round((item.pointsRedeemed / maxVal) * 100);

                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full h-36 flex items-end justify-center gap-1 bg-slate-50 p-1 rounded-xl">
                        <div
                          className="w-1/2 bg-blue-600 rounded-t-xs transition-all duration-500 group-hover:bg-blue-700"
                          style={{ height: `${issuedHeight}%` }}
                          title={`Rewarded: ${item.pointsIssued}`}
                        />
                        <div
                          className="w-1/2 bg-slate-300 rounded-t-xs transition-all duration-500 group-hover:bg-slate-400"
                          style={{ height: `${redeemedHeight}%` }}
                          title={`Redeemed: ${item.pointsRedeemed}`}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROMO POSTS MANAGER (ADD, EDIT, DELETE) */}
      {activeTab === 'promos' && (
        <MerchantPromoManager
          activeStore={activeStore}
          posts={merchantPosts}
          isLoading={isLoading}
          onRefresh={fetchMerchantStats}
          onCreatePost={handleCreatePromoPost}
          onUpdatePost={handleUpdatePromoPost}
          onDeletePost={handleDeletePromoPost}
        />
      )}

      {/* TAB 3: POINTS REWARDED & REDEEMED MONITOR & BALANCE */}
      {activeTab === 'points' && (
        <MerchantPointsMonitor
          store={activeStore}
          stats={stats}
          isLoading={isLoading}
          onRefresh={fetchMerchantStats}
          onTopupPoints={handleTopupPoints}
        />
      )}

      {/* TAB 4: STORE PROFILE & MAP LOCATION EDITOR */}
      {activeTab === 'profile' && (
        <MerchantStoreProfileEditor
          store={activeStore}
          onStoreUpdated={handleLocalStoreUpdated}
          showToast={showToast}
        />
      )}

      {/* TAB 5: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {language === 'es' ? 'Catálogo de Ofertas y Recompensas' : 'Active Store Reward Deals'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'es'
                  ? 'Gestiona los cupones y ofertas que los miembros pueden canjear con sus puntos.'
                  : 'Manage store vouchers and exclusive deals that members can redeem.'}
              </p>
            </div>

            <button
              onClick={onOpenAddReward}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'es' ? 'Crear Nueva Oferta' : 'Create New Offer'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeRewards.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-400">
                <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No active rewards yet</p>
                <p className="text-xs text-slate-400">Click &quot;Create New Offer&quot; to publish a reward voucher.</p>
              </div>
            ) : (
              storeRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {reward.category}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{reward.title}</h4>
                    <p className="text-xs text-slate-500">{reward.discountValue} • Code: {reward.code}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs block">
                      {reward.pointsCost} pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
