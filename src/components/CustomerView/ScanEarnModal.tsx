import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, X, QrCode, CheckCircle2, Sparkles, Camera, Award } from 'lucide-react';
import { Store } from '../../types';

interface ScanEarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  onEarnPoints: (storeId: string, amount: number, description: string) => Promise<void>;
  onScanQRCheckIn?: (storeId: string) => Promise<any>;
}

export const ScanEarnModal: React.FC<ScanEarnModalProps> = ({
  isOpen,
  onClose,
  stores,
  onEarnPoints,
  onScanQRCheckIn
}) => {
  const [activeTab, setActiveTab] = useState<'qr_checkin' | 'receipt'>('qr_checkin');
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [purchaseAmount, setPurchaseAmount] = useState('24.50');
  const [itemNote, setItemNote] = useState('Coffee & Morning Pastries');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0];
  const calculatedPoints = activeStore
    ? Math.round((parseFloat(purchaseAmount) || 0) * activeStore.pointsRate)
    : 0;

  const handleQRCheckIn = async () => {
    setIsSubmitting(true);
    try {
      if (onScanQRCheckIn) {
        await onScanQRCheckIn(selectedStoreId);
      }
      setSuccessMsg(`🎉 +1 Point Credited via QR Code Scan!`);
      setTimeout(() => {
        setSuccessMsg('');
        setIsSubmitting(false);
        onClose();
      }, 1800);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await onEarnPoints(selectedStoreId, amount, itemNote || `In-store purchase at ${activeStore.name}`);
      setSuccessMsg(`+${calculatedPoints} Points Credited!`);
      setTimeout(() => {
        setSuccessMsg('');
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-slate-200 z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  In-Store Point Collector
                </h3>
                <p className="text-xs text-slate-500">
                  Scan store QR posters or credit purchases
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('qr_checkin')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'qr_checkin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR (+1 Pt)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receipt')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'receipt'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Receipt Credit
            </button>
          </div>

          {successMsg ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="text-lg font-extrabold text-slate-900">
                {successMsg}
              </h4>
              <p className="text-xs text-slate-500">
                Points have been added to your digital wallet!
              </p>
            </div>
          ) : activeTab === 'qr_checkin' ? (
            /* TAB 1: INSTANT QR CODE SCAN (+1 POINT) */
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Merchant Outlet
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* QR Scanner Camera Simulator Frame */}
              <div className="relative rounded-2xl bg-slate-900 overflow-hidden p-6 text-center text-white border border-slate-800 shadow-inner group">
                {/* Simulated Camera Viewport Lines */}
                <div className="absolute inset-4 border-2 border-dashed border-blue-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                </div>

                <div className="relative z-10 my-4 space-y-2">
                  <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto flex items-center justify-center border border-white/20">
                    <Camera className="w-6 h-6 text-blue-300" />
                  </div>
                  <div className="font-extrabold text-sm text-white">
                    Scanning {activeStore.name} Poster
                  </div>
                  <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                    Point your camera at the in-store QR code poster at the counter or entrance.
                  </p>
                </div>
              </div>

              {/* Feature Benefit Callout */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">
                  Receive <strong>1 instant loyalty point</strong> just for scanning the merchant QR code on arrival!
                </span>
              </div>

              <button
                type="button"
                onClick={handleQRCheckIn}
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                {isSubmitting ? 'Scanning & Claiming Point...' : 'Scan In-Store QR Code (+1 Pt)'}
              </button>
            </div>
          ) : (
            /* TAB 2: RECEIPT / PURCHASE CREDIT */
            <form onSubmit={handleReceiptSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Retail Store
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.pointsRate} pts/Cg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Purchase Amount (Cg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 py-0.5 px-1 bg-slate-200 text-slate-600 rounded-xs top-1/2 -translate-y-1/2 font-bold text-xs">
                    Cg
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-extrabold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Items Purchased (Optional)
                </label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="e.g. Espresso, Apparel, Groceries"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Estimated Points
                  </div>
                  <div className="font-bold text-slate-800">
                    {activeStore.pointsRate} pts per Cg 1 spent
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-blue-600">
                    +{calculatedPoints}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">pts</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                {isSubmitting ? 'Processing Credit...' : 'Confirm Receipt & Earn Points'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
