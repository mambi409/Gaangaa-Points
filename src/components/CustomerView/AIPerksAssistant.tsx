import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Award, Tag, Navigation, RefreshCw } from 'lucide-react';
import { UserWallet, Store, AIPerksResponse } from '../../types';

interface AIPerksAssistantProps {
  wallet: UserWallet;
  stores: Store[];
  onNavigateToStore: (store: Store) => void;
  onSelectStore: (storeId: string) => void;
}

export const AIPerksAssistant: React.FC<AIPerksAssistantProps> = ({
  wallet,
  stores,
  onNavigateToStore,
  onSelectStore
}) => {
  const [advice, setAdvice] = useState<AIPerksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAIAdvice = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/perks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'user_recommendations'
        })
      });
      const data = await res.json();
      setAdvice(data);
    } catch (err) {
      console.error('Failed to fetch AI advice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIAdvice();
  }, [wallet.pointsBalance]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-4 h-4 animate-spin" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                Gemini AI Rewards Intelligence
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Personalized Perks & Points Optimizer
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Analyzes your {wallet.pointsBalance.toLocaleString()} points balance, active tier, and nearby store multiplier events to maximize your reward value.
            </p>
          </div>

          <button
            onClick={fetchAIAdvice}
            disabled={isLoading}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing Deals...' : 'Re-Analyze Perks'}
          </button>
        </div>
      </div>

      {/* AI Summary Card */}
      {advice && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-sm font-semibold leading-relaxed">
            "{advice.summary}"
          </div>

          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tailored Actions For You Today
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {advice.recommendations.map((rec, idx) => {
                const matchedStore = stores.find((s) => s.name === rec.storeName);

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                          {rec.actionType}
                        </span>
                        {rec.pointsNeeded && (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                            {rec.pointsNeeded} pts
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
                        {rec.storeName || 'Network Store'}
                      </span>
                      {matchedStore && (
                        <button
                          onClick={() => onNavigateToStore(matchedStore)}
                          className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline shrink-0"
                        >
                          Directions <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
