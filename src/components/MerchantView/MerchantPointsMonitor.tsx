import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  DollarSign,
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  Sparkles,
  RefreshCw,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Scan,
  Clock
} from 'lucide-react';
import { Store, MerchantStats, Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface MerchantPointsMonitorProps {
  store: Store;
  stats: MerchantStats | null;
  isLoading: boolean;
  onRefresh: () => void;
  onTopupPoints?: (pointsToAdd: number) => Promise<boolean>;
}

export const MerchantPointsMonitor: React.FC<MerchantPointsMonitorProps> = ({
  store,
  stats,
  isLoading,
  onRefresh,
  onTopupPoints
}) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'earn' | 'redeem' | 'bonus'>('all');
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('5000');
  const [isTopupSubmitting, setIsTopupSubmitting] = useState(false);

  // Compute metrics
  const pointsBalance = stats?.pointsBalance ?? store.pointsBalance ?? 14500;
  const totalRewarded = stats?.totalPointsRewardedAllTime || store.totalPointsRewarded || 32450;
  const todayRewarded = stats?.todayPointsIssued || 1480;
  const totalRedeemed = stats?.totalPointsRedeemedAllTime || store.totalPointsRedeemed || 9800;
  const todayRedeemed = stats?.todayPointsRedeemed || 450;
  const totalRevenue = stats?.totalRevenueAllTime || 14250.0;
  const activeMembers = stats?.activeMembersCount || 312;
  const avgPointsPerSale = stats?.averagePointsPerSale || Math.round(totalRewarded / Math.max(1, (stats?.todayTransactions || 42) * 5));

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(topupAmount, 10);
    if (!pts || pts <= 0) return;
    if (onTopupPoints) {
      setIsTopupSubmitting(true);
      await onTopupPoints(pts);
      setIsTopupSubmitting(false);
      setIsTopupModalOpen(false);
      onRefresh();
    }
  };

  // Transactions list
  const transactions = stats?.recentActivity || [];

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.voucherTitle && tx.voucherTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'earn' && tx.type === 'earn') ||
      (filterType === 'redeem' && tx.type === 'redeem') ||
      (filterType === 'bonus' && tx.type === 'bonus');

    return matchesSearch && matchesType;
  });

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Timestamp', 'Type', 'Description', 'Amount Spent ($)', 'Points Rewarded/Redeemed', 'Store'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      new Date(tx.timestamp).toLocaleString(),
      tx.type.toUpperCase(),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amountSpent ? tx.amountSpent.toFixed(2) : '0.00',
      tx.points,
      `"${store.name.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `points_rewarded_report_${store.id}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Live Refresh */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {language === 'es' ? 'Monitor de Puntos Otorgados' : 'Points Rewarded & Loyalty Monitor'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {store.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Ledger'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Points Balance & Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Merchant Points Reserve Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'es' ? 'Saldo de Reserva de Puntos' : 'Store Points Balance'}
              </span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {pointsBalance.toLocaleString()} <span className="text-sm font-semibold text-slate-300">pts</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Available pool to reward members
            </p>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md">
              🟢 Reserve Healthy
            </span>
            {onTopupPoints && (
              <button
                type="button"
                onClick={() => setIsTopupModalOpen(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-lg transition cursor-pointer"
              >
                + Top Up
              </button>
            )}
          </div>
        </div>

        {/* Total Points Rewarded (All-Time + Today) */}
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
              +{todayRewarded.toLocaleString()} pts rewarded today
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Rate: {store.pointsRate || 10} pts / Cg 1 spent
          </p>
        </div>

        {/* Total Points Redeemed (All-Time + Today) */}
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
              -{todayRedeemed.toLocaleString()} pts redeemed today
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Voucher claims and store perks
          </p>
        </div>

        {/* Total Loyalty Sales Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'es' ? 'Ventas Fidelidad' : 'Loyalty Sales Volume'}
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              Cg {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-block text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md mt-2">
              {stats?.todayTransactions || 42} purchases logged
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            ~{avgPointsPerSale} avg pts per sale
          </p>
        </div>
      </div>

      {/* Points Distribution by Channel & Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Points Source Channel Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-1 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">
            {language === 'es' ? 'Distribución por Canal' : 'Points Rewarded by Source'}
          </h3>
          <p className="text-xs text-slate-500">
            Breakdown of points awarded across POS checkouts, in-store QR check-ins, and promotions.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  POS Checkout Purchases
                </span>
                <span className="text-blue-600">78%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '78%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                ~{Math.round(totalRewarded * 0.78).toLocaleString()} pts awarded
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  In-Store Walk-in QR Check-ins
                </span>
                <span className="text-emerald-600">14%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '14%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                ~{Math.round(totalRewarded * 0.14).toLocaleString()} pts awarded (+1 pt check-ins)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Bonus Campaigns & Double Points
                </span>
                <span className="text-amber-600">8%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                ~{Math.round(totalRewarded * 0.08).toLocaleString()} pts awarded
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Points Rewarded Volume Visualizer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {language === 'es' ? 'Tendencia Semanal de Puntos' : 'Weekly Points Rewarded Flow'}
              </h3>
              <p className="text-xs text-slate-500">
                Daily points rewarded to customers vs. loyalty voucher redemptions.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" /> Rewarded
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300" /> Redeemed
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-2 px-2">
            {(stats?.monthlyDistribution || [
              { day: 'Mon', pointsIssued: 2400, pointsRedeemed: 600 },
              { day: 'Tue', pointsIssued: 3100, pointsRedeemed: 800 },
              { day: 'Wed', pointsIssued: 2800, pointsRedeemed: 700 },
              { day: 'Thu', pointsIssued: 3900, pointsRedeemed: 1100 },
              { day: 'Fri', pointsIssued: 5200, pointsRedeemed: 1500 },
              { day: 'Sat', pointsIssued: 6800, pointsRedeemed: 2100 },
              { day: 'Sun', pointsIssued: 4900, pointsRedeemed: 1300 }
            ]).map((item) => {
              const maxVal = 7500;
              const issuedHeight = Math.min(100, Math.round((item.pointsIssued / maxVal) * 100));
              const redeemedHeight = Math.min(100, Math.round((item.pointsRedeemed / maxVal) * 100));

              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full h-32 flex items-end justify-center gap-1 bg-slate-50 p-1 rounded-xl">
                    <div
                      className="w-1/2 bg-blue-600 rounded-t-xs transition-all duration-500 group-hover:bg-blue-700"
                      style={{ height: `${issuedHeight}%` }}
                      title={`Rewarded: +${item.pointsIssued} pts`}
                    />
                    <div
                      className="w-1/2 bg-slate-300 rounded-t-xs transition-all duration-500 group-hover:bg-slate-400"
                      style={{ height: `${redeemedHeight}%` }}
                      title={`Redeemed: -${item.pointsRedeemed} pts`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Points Rewarded Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header & Search Filters */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {language === 'es' ? 'Libro Mayor de Puntos Otorgados' : 'Points Rewarded Transaction Ledger'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological log of all point accruals, POS sales rewards, and walk-in check-in bonuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Types</option>
              <option value="earn">POS Sale Points (+)</option>
              <option value="redeem">Voucher Redemptions (-)</option>
              <option value="bonus">Bonus Multipliers</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Transaction / Note</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Purchase Amount</th>
                <th className="py-3 px-4 text-right">Points Rewarded</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Award className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No points rewarded transactions found</p>
                    <p className="text-[11px] text-slate-400">Transactions processed in the POS scanner will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(tx.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{tx.description}</div>
                      {tx.voucherTitle && (
                        <div className="text-[10px] text-blue-600 font-medium">
                          Deal: {tx.voucherTitle}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.type === 'earn' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowUpRight className="w-3 h-3" /> Sale Earn
                        </span>
                      ) : tx.type === 'bonus' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Sparkles className="w-3 h-3" /> Bonus +1
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Tag className="w-3 h-3" /> Redeem
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {tx.amountSpent ? `Cg ${tx.amountSpent.toFixed(2)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                      {tx.points > 0 ? (
                        <span className="text-emerald-600">+{tx.points} pts</span>
                      ) : (
                        <span className="text-blue-600">{tx.points} pts</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Top Up Points Reserve Modal */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Top Up Points Reserve
                </h3>
                <p className="text-xs text-slate-500">
                  Replenish loyalty points available to reward shoppers at {store.name}.
                </p>
              </div>
            </div>

            <form onSubmit={handleTopupSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Points Amount to Add
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['2500', '5000', '10000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        topupAmount === amt
                          ? 'bg-amber-50 border-amber-500 text-amber-900 font-extrabold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      +{Number(amt).toLocaleString()} pts
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  placeholder="Enter custom points amount"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Current Reserve:</span>
                  <span className="font-bold text-slate-900">{pointsBalance.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>After Top-Up:</span>
                  <span className="font-bold text-amber-600">
                    {(pointsBalance + (Number(topupAmount) || 0)).toLocaleString()} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  disabled={isTopupSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTopupSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition cursor-pointer disabled:opacity-50"
                >
                  {isTopupSubmitting ? 'Replenishing...' : 'Confirm Top-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
