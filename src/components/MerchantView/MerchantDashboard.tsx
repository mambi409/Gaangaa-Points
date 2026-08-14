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
  FileText
} from 'lucide-react';
import { Store, MerchantStats, RewardItem, Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MerchantStoreProfileEditor } from './MerchantStoreProfileEditor';
import { MerchantPointsMonitor } from './MerchantPointsMonitor';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'points' | 'rewards'>('overview');
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [storeRewards, setStoreRewards] = useState<RewardItem[]>([]);
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
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <StoreIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                {language === 'es' ? 'Portal de Gestión para Comercios' : 'Merchant Partner Portal'}
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
          id="merchant-tab-points-monitor"
          onClick={() => setActiveTab('points')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'points'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>{language === 'es' ? 'Monitor de Puntos Otorgados' : 'Points Rewarded Monitor'}</span>
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
          {/* Merchant Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Points Issued Today */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'es' ? 'Puntos Otorgados Hoy' : 'Points Rewarded Today'}
                </span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                +{stats?.todayPointsIssued.toLocaleString() || '1,480'} pts
              </div>
              <div className="inline-block text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md mt-2">
                {language === 'es' ? '↑ 14% más que ayer' : '↑ 14% higher than yesterday'}
              </div>
            </div>

            {/* Total Points Rewarded (All-Time) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'es' ? 'Total Puntos Otorgados' : 'Total Points Rewarded'}
                </span>
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                +{(stats?.totalPointsRewardedAllTime || activeStore.totalPointsRewarded || 32500).toLocaleString()} pts
              </div>
              <div className="inline-block text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md mt-2">
                Cumulative member rewards
              </div>
            </div>

            {/* Total Checkout Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'es' ? 'Volumen de Ventas' : 'Loyalty Sales Volume'}
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                Cg {stats?.todayRevenueEstimate ? stats.todayRevenueEstimate.toFixed(2) : '485.00'}
              </div>
              <div className="inline-block text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md mt-2">
                {stats?.todayTransactions || 42} {language === 'es' ? 'compras hoy' : 'sales today'}
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'es' ? 'Miembros Activos' : 'Active Store Members'}
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {stats?.activeMembersCount || 312} {language === 'es' ? 'miembros' : 'members'}
              </div>
              <div className="inline-block text-[11px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md mt-2">
                {language === 'es' ? 'Visitas recurrentes' : 'Repeat shoppers'}
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Edit Store Info */}
            <button
              onClick={() => setActiveTab('profile')}
              className="p-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit mb-4">
                <MapPin className="w-6 h-6 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                {language === 'es' ? 'Editar Info y Ubicación' : 'Edit Store Info & Map'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'es'
                  ? 'Modifica dirección, coordenadas en el mapa, horarios de atención, teléfonos y email de contacto.'
                  : 'Update store address, map coordinates, weekly opening hours, category, phone numbers and email.'}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                {language === 'es' ? 'Configurar Tienda' : 'Configure Store'} <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Quick Points Rewarded Monitor */}
            <button
              onClick={() => setActiveTab('points')}
              className="p-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 w-fit mb-4">
                <Award className="w-6 h-6 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                {language === 'es' ? 'Monitor de Puntos' : 'Monitor Points Rewarded'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'es'
                  ? 'Revisa el historial de puntos acreditados, transacciones de compra y canjes de clientes.'
                  : 'Track points awarded velocity, detailed customer transactions, and points distribution ledger.'}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
                {language === 'es' ? 'Ver Estadísticas' : 'View Points Ledger'} <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Quick POS Scan */}
            <button
              onClick={onOpenPOSTerminal}
              className="p-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 w-fit mb-4">
                <Scan className="w-6 h-6 group-hover:scale-105 transition" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                {language === 'es' ? 'Terminal POS' : 'POS Scanner Terminal'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'es'
                  ? 'Escanea códigos de miembros, otorga puntos en caja y valida cupones al instante.'
                  : 'Scan customer QR codes, reward points on purchases, and validate voucher redemptions.'}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                {language === 'es' ? 'Abrir Terminal' : 'Launch Scanner'} <ChevronRight className="w-4 h-4" />
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

      {/* TAB 2: STORE PROFILE & MAP LOCATION EDITOR */}
      {activeTab === 'profile' && (
        <MerchantStoreProfileEditor
          store={activeStore}
          onStoreUpdated={handleLocalStoreUpdated}
          showToast={showToast}
        />
      )}

      {/* TAB 3: POINTS REWARDED MONITOR */}
      {activeTab === 'points' && (
        <MerchantPointsMonitor
          store={activeStore}
          stats={stats}
          isLoading={isLoading}
          onRefresh={fetchMerchantStats}
        />
      )}

      {/* TAB 4: REWARDS CATALOG */}
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
