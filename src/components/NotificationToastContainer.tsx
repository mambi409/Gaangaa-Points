import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Award, Tag, Navigation, CheckCircle2, X } from 'lucide-react';
import { NotificationMessage } from '../types';

interface NotificationToastContainerProps {
  notifications: NotificationMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onDismiss
}) => {
  // Show up to 3 unread/recent toasts that arrived in the last minute
  const activeToasts = notifications
    .filter((n) => !n.read)
    .slice(0, 3);

  const getIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'earn':
        return <Award className="w-5 h-5 text-emerald-400" />;
      case 'redeem':
        return <Tag className="w-5 h-5 text-indigo-400" />;
      case 'promo':
        return <Bell className="w-5 h-5 text-amber-400" />;
      case 'navigation':
        return <Navigation className="w-5 h-5 text-cyan-400" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3 relative overflow-hidden group"
          >
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {toast.type} Push
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-snug">{toast.body}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
