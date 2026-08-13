import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, X, Sparkles, Plus, Award } from 'lucide-react';
import { Store, RewardItem } from '../../types';

interface RewardCatalogManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore: Store;
  onAddReward: (rewardData: Partial<RewardItem>) => Promise<void>;
}

export const RewardCatalogManager: React.FC<RewardCatalogManagerProps> = ({
  isOpen,
  onClose,
  activeStore,
  onAddReward
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('300');
  const [discountValue, setDiscountValue] = useState('Cg 8.00 Value');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateAICopy = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/perks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'merchant_promo_copy',
          storeContext: activeStore,
          promptText: title || 'Free specialty item'
        })
      });
      const data = await res.json();
      if (data.generatedPromo) {
        setDescription(data.generatedPromo);
      }
    } catch (err) {
      console.error('Failed to generate AI promo copy:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pointsCost) return;

    setIsSubmitting(true);
    try {
      await onAddReward({
        storeId: activeStore.id,
        title,
        description: description || 'Special merchant loyalty reward offer.',
        pointsCost: parseInt(pointsCost, 10),
        discountValue,
        category: activeStore.category
      });
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      onClose();
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
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                  New Reward Offer Builder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeStore.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reward Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Artisanal Muffin or Cold Brew"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Points Cost
                </label>
                <input
                  type="number"
                  required
                  value={pointsCost}
                  onChange={(e) => setPointsCost(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Discount Value Badge
                </label>
                <input
                  type="text"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="e.g. Cg 8.00 Value"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reward Offer Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAICopy}
                  disabled={isGeneratingAI}
                  className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {isGeneratingAI ? 'Gemini Writing...' : 'Write Copy with Gemini AI'}
                </button>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details on redemption conditions and customer perks..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Publishing Reward...' : 'Publish Reward to Customer App'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
