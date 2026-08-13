import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Tag,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Scan
} from 'lucide-react';
import { UserWallet, Transaction, UserVoucher, UserTier } from '../../types';

interface DigitalWalletProps {
  wallet: UserWallet;
  transactions: Transaction[];
  onOpenScanEarn: () => void;
  onSelectStore: (storeId: string) => void;
}

export const DigitalWallet: React.FC<DigitalWalletProps> = ({
  wallet,
  transactions,
  onOpenScanEarn,
  onSelectStore
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'earn' | 'redeem'>('all');

  const tierProgressMap: Record<UserTier, { current: number; next: number; nextTier: UserTier | 'MAX' }> = {
    Bronze: { current: wallet.lifetimePoints, next: 1000, nextTier: 'Silver' },
    Silver: { current: wallet.lifetimePoints, next: 2500, nextTier: 'Gold' },
    Gold: { current: wallet.lifetimePoints, next: 5000, nextTier: 'Platinum' },
    Platinum: { current: wallet.lifetimePoints, next: 10000, nextTier: 'MAX' }
  };

  const progressInfo = tierProgressMap[wallet.currentTier];
  const progressPercent = Math.min(
    100,
    Math.round((wallet.lifetimePoints / progressInfo.next) * 100)
  );

  const handleCopyPass = () => {
    navigator.clipboard?.writeText(wallet.passId);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'earn') return t.type === 'earn' || t.type === 'bonus';
    if (filterType === 'redeem') return t.type === 'redeem';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner: Member Card & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass Card (2 columns) */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-md border border-blue-500/30 group"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition duration-700" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-900/30 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                      OmniPass Digital Membership
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-slate-900 shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {wallet.currentTier} Tier
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight text-white">
                    {wallet.userName}
                  </h2>
                </div>

                <button
                  onClick={() => setShowQRModal(true)}
                  className="p-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl border border-white/30 text-white transition flex flex-col items-center gap-1 shrink-0 group/qr"
                >
                  <QrCode className="w-6 h-6 group-hover/qr:scale-105 transition" />
                  <span className="text-[9px] font-bold tracking-wider uppercase">Show Pass</span>
                </button>
              </div>

              {/* Card Middle Balance */}
              <div className="my-6">
                <div className="text-xs text-blue-100 font-semibold uppercase tracking-wider mb-1">
                  Available Rewards Points
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    {wallet.pointsBalance.toLocaleString()}
                  </span>
                  <span className="text-sm text-blue-100 font-medium">
                    pts ≈ Cg {(wallet.pointsBalance / 100).toFixed(2)} value
                  </span>
                </div>
              </div>

              {/* Card Footer Barcode & ID */}
              <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-slate-900/40 px-2.5 py-1 rounded-md border border-white/20 tracking-widest text-white font-bold">
                    {wallet.passId}
                  </span>
                  <button
                    onClick={handleCopyPass}
                    className="p-1.5 hover:bg-white/15 rounded-md transition"
                    title="Copy Pass ID"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-100" />
                  </button>
                  {copiedPass && (
                    <span className="text-[10px] text-emerald-300 font-bold">Copied!</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-blue-100 text-[11px] font-medium">6 Partner Outlets</span>
                  <button
                    onClick={onOpenScanEarn}
                    className="px-3.5 py-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    Scan & Earn
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tier Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Membership Tier
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {wallet.lifetimePoints.toLocaleString()} lifetime pts
              </span>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{wallet.currentTier}</span>
                <span>
                  {progressInfo.nextTier !== 'MAX'
                    ? `${progressInfo.next - wallet.lifetimePoints} pts to ${progressInfo.nextTier}`
                    : 'Highest Tier Unlocked!'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            {/* Tier Benefits List */}
            <div className="space-y-2 text-xs">
              <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                Active {wallet.currentTier} Tier Perks
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1.5x Multiplier on all store purchases</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Free alterations & priority seating</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Push Alerts for Double Points Flash Events</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onOpenScanEarn}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Collect Points In-Store
            </button>
          </div>
        </div>
      </div>

      {/* Instant In-Store QR Walk-In Reward Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-5 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                Instant Walk-In Reward
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> +1 Point per Scan
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mt-1">
              Scan Merchant QR Poster On Entry
            </h4>
            <p className="text-xs text-slate-600">
              Walk into any partner store, scan their entrance or counter QR code, and receive 1 instant loyalty point!
            </p>
          </div>
        </div>
        <button
          onClick={onOpenScanEarn}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Scan className="w-4 h-4" />
          Scan Store QR (+1 Pt)
        </button>
      </div>

      {/* Claimed Reward Vouchers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Active Saved Vouchers ({wallet.vouchers.filter((v) => v.status === 'active').length})
            </h3>
          </div>
        </div>

        {wallet.vouchers.filter((v) => v.status === 'active').length === 0 ? (
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
            No active vouchers in your wallet yet. Browse the Store Directory to redeem points for deals!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallet.vouchers
              .filter((v) => v.status === 'active')
              .map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoucher(v)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                        {v.storeName}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {v.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {v.pointsSpent} points redeemed
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      Expires {new Date(v.expiresAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Show QR <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Points History Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Transaction & Points History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Activity log across all partner retail locations
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('earn')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === 'earn'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Earned
            </button>
            <button
              onClick={() => setFilterType('redeem')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === 'redeem'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Redeemed
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                    tx.points > 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  }`}
                >
                  {tx.points > 0 ? '+' : ''}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => tx.storeId !== 'system' && onSelectStore(tx.storeId)}
                      className="text-xs font-extrabold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      {tx.storeName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx.description}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-sm font-extrabold ${
                    tx.points > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                </div>
                {tx.amountSpent && (
                  <div className="text-[11px] text-slate-400">Cg {tx.amountSpent.toFixed(2)} sale</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Pass QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Member QR Code
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {wallet.userName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scan at any merchant counter to earn or redeem points
                </p>
              </div>

              {/* Simulated Rendered High-Contrast QR Pattern */}
              <div className="mx-auto w-56 h-56 bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-900 flex flex-col items-center justify-center relative group">
                <div className="w-full h-full bg-slate-900 p-3 rounded-xl flex flex-col justify-between items-center">
                  <div className="w-full flex justify-between">
                    <div className="w-10 h-10 border-4 border-white bg-slate-900 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                    <div className="w-10 h-10 border-4 border-white bg-slate-900 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                  </div>
                  <div className="text-white text-[10px] font-mono tracking-widest text-center my-auto font-bold bg-indigo-600/80 px-2 py-1 rounded-md">
                    {wallet.passId}
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="w-10 h-10 border-4 border-white bg-slate-900 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white" />
                    </div>
                    <div className="w-4 h-4 bg-white self-end rounded-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  PASS: {wallet.passId}
                </div>
                <p className="text-[11px] text-slate-400">
                  Auto-syncs with merchant POS terminal upon scanning.
                </p>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition"
              >
                Close Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Voucher Modal */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVoucher(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {selectedVoucher.storeName}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedVoucher.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Show code to merchant cashier during checkout
                </p>
              </div>

              {/* QR Voucher Code Box */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-3">
                <div className="text-xs font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                  {selectedVoucher.qrCode}
                </div>
                <p className="text-[10px] text-slate-400">
                  Voucher ID: #{selectedVoucher.id} | Valid until{' '}
                  {new Date(selectedVoucher.expiresAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedVoucher(null)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
