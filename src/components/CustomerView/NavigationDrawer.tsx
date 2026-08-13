import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Navigation,
  X,
  Footprints,
  Car,
  Bike,
  Compass,
  MapPin,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { NavigationRoute, Store } from '../../types';

interface NavigationDrawerProps {
  route: NavigationRoute | null;
  store: Store | null;
  onClose: () => void;
  onChangeMode: (mode: 'walking' | 'driving' | 'biking') => void;
  onArrivedPush: (storeName: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  route,
  store,
  onClose,
  onChangeMode,
  onArrivedPush
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsSimulating(false);
    setSimProgress(0);
  }, [route?.storeId]);

  // Simulate movement along steps
  useEffect(() => {
    if (!isSimulating || !route) return;

    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 100) {
          setIsSimulating(false);
          if (store) onArrivedPush(store.name);
          return 100;
        }
        const next = prev + 10;
        if (next > 25 && currentStepIndex === 0) setCurrentStepIndex(1);
        if (next > 50 && currentStepIndex === 1) setCurrentStepIndex(2);
        if (next > 80 && currentStepIndex === 2) setCurrentStepIndex(3);
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating, route, currentStepIndex, store, onArrivedPush]);

  if (!route || !store) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-indigo-500/30 text-white p-6 shadow-2xl rounded-t-3xl max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                  Real-Time GPS Guidance
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Live Route
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">{store.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Travel Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => onChangeMode('walking')}
                className={`p-2 rounded-lg transition ${
                  route.mode === 'walking' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
                title="Walking"
              >
                <Footprints className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeMode('driving')}
                className={`p-2 rounded-lg transition ${
                  route.mode === 'driving' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
                title="Driving"
              >
                <Car className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeMode('biking')}
                className={`p-2 rounded-lg transition ${
                  route.mode === 'biking' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
                title="Biking"
              >
                <Bike className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Route Overview Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Distance</div>
            <div className="text-lg font-extrabold text-indigo-300">
              {Math.max(0, route.distanceKm * (1 - simProgress / 100)).toFixed(2)} km
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Travel Time</div>
            <div className="text-lg font-extrabold text-emerald-400">
              {Math.max(1, Math.round(route.durationMinutes * (1 - simProgress / 100)))} min
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Store Points Rate</div>
            <div className="text-lg font-extrabold text-amber-300">{store.pointsRate} pts/Cg</div>
          </div>
        </div>

        {/* Live Simulation Control Button */}
        <div className="mb-4 flex items-center justify-between gap-2 bg-indigo-950/40 p-3 rounded-2xl border border-indigo-900/60">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <Compass className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>
              {simProgress === 100
                ? 'Arrived at Store! Check in at counter to earn points.'
                : isSimulating
                ? `Moving towards ${store.name}... (${simProgress}%)`
                : 'Ready to start live simulation along route?'}
            </span>
          </div>

          <button
            onClick={() => {
              if (simProgress === 100) {
                setSimProgress(0);
                setCurrentStepIndex(0);
              }
              setIsSimulating(!isSimulating);
            }}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shrink-0 transition"
          >
            {simProgress === 100 ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" /> Restart
              </>
            ) : isSimulating ? (
              'Pause Simulation'
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Simulate Walk
              </>
            )}
          </button>
        </div>

        {/* Turn-by-Turn Steps List */}
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {route.steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isDone = idx < currentStepIndex;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition ${
                  isCurrent
                    ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                    : isDone
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 line-through'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${
                      isCurrent
                        ? 'bg-indigo-500 text-white'
                        : isDone
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span>{step.instruction}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {step.distanceMeters}m
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
