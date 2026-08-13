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
  ChevronRight
} from 'lucide-react';
import { Store, MerchantStats, RewardItem, Transaction } from '../../types';

interface MerchantDashboardProps {
  stores: Store[];
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
  onOpenPOSTerminal: () => void;
  onOpenAddReward: () => void;
  onOpenPushBroadcaster: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  onOpenPOSTerminal,
  onOpenAddReward,
  onOpenPushBroadcaster
}) => {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [storeRewards, setStoreRewards] = useState<RewardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

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

  return (
    <div className="space-y-8">
      {/* Merchant Header Bar & Store Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Merchant Partner Dashboard
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {activeStore.name}
            </h2>
          </div>
        </div>

        {/* Switch Store Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Store Outlet
            </label>
            <select
              value={activeStore.id}
              onChange={(e) => onSelectStore(e.target.value)}
              className="w-full sm:w-56 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenPOSTerminal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 shadow-xs shadow-blue-200 self-end"
          >
            <Scan className="w-4 h-4" />
            Scan Customer QR
          </button>
        </div>
      </div>

      {/* Merchant Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Points Issued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Points Issued Today</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            +{stats?.todayPointsIssued.toLocaleString() || '3,850'} pts
          </div>
          <div className="inline-block text-[11px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md mt-2">
            ↑ 14% higher than yesterday
          </div>
        </div>

        {/* Points Redeemed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Redemptions Today</span>
            <Tag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.todayPointsRedeemed.toLocaleString() || '1,500'} pts
          </div>
          <div className="inline-block text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md mt-2">
            {storeRewards.length} active store reward offers
          </div>
        </div>

        {/* Total Checkout Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Loyalty Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            Cg {stats?.todayRevenueEstimate.toFixed(2) || '485.00'}
          </div>
          <div className="inline-block text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md mt-2">
            {stats?.todayTransactions || 42} checkouts logged
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Store Members</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.activeMembersCount || 312} members
          </div>
          <div className="inline-block text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md mt-2">
            Repeated visits this month
          </div>
        </div>
      </div>

      {/* Quick Merchant Terminal Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onOpenPOSTerminal}
          className="p-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group"
        >
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 w-fit mb-4">
            <Scan className="w-6 h-6 group-hover:scale-105 transition" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">POS Member Checkout</h3>
          <p className="text-xs text-slate-600 mt-1">
            Scan member pass QR code, credit points on sale, or process voucher redemptions.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
            Launch POS Terminal <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={onOpenAddReward}
          className="p-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit mb-4">
            <Plus className="w-6 h-6 group-hover:scale-105 transition" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">Create Reward Offer</h3>
          <p className="text-xs text-slate-600 mt-1">
            Add new discount vouchers, free items, or tier perks with Gemini AI copywriter.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
            Add Store Reward <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={onOpenPushBroadcaster}
          className="p-6 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition text-left group"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 w-fit mb-4">
            <Send className="w-6 h-6 group-hover:scale-105 transition" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">Broadcast Push Alert</h3>
          <p className="text-xs text-slate-600 mt-1">
            Send real-time mobile push notifications to nearby visitors or gold members.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
            Send Push Campaign <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Weekly Points Distribution Chart Visualization */}
      {stats && stats.monthlyDistribution && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Weekly Loyalty Volume
              </h3>
              <p className="text-xs text-slate-500">
                Points issued vs points redeemed at {activeStore.name}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 rounded-xs bg-blue-600" /> Points Issued
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-slate-400" /> Redeemed
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
                      title={`Issued: ${item.pointsIssued}`}
                    />
                    <div
                      className="w-1/2 bg-slate-400 rounded-t-xs transition-all duration-500 group-hover:bg-slate-500"
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

      {/* Active Store Rewards & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Store Rewards List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Active Store Rewards Catalog
            </h3>
            <button
              onClick={onOpenAddReward}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Add Offer
            </button>
          </div>

          <div className="space-y-3">
            {storeRewards.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                No active rewards yet for this store location.
              </div>
            ) : (
              storeRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {reward.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {reward.discountValue} • Code: {reward.code}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    {reward.pointsCost} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent In-Store Customer Transactions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-base mb-4">
            Recent In-Store Checkouts
          </h3>

          <div className="space-y-3 divide-y divide-slate-100">
            {stats?.recentActivity.map((tx) => (
              <div key={tx.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    {tx.description}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(tx.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right font-extrabold">
                  <div className={tx.points > 0 ? 'text-emerald-600' : 'text-blue-600'}>
                    {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                  </div>
                  {tx.amountSpent && (
                    <div className="text-[10px] text-slate-400">Cg {tx.amountSpent.toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
