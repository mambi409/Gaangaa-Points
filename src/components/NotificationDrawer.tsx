import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, Send, Sparkles, Award, Tag, Navigation } from 'lucide-react';
import { NotificationMessage } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationMessage[];
  onMarkAllRead: () => void;
  onSendMockPush: (title: string, body: string, type: NotificationMessage['type']) => void;
  currentRole: 'user' | 'merchant';
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSendMockPush,
  currentRole
}) => {
  const [testTitle, setTestTitle] = useState('');
  const [testBody, setTestBody] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);

  const filtered = notifications.filter(
    (n) => n.targetRole === 'all' || n.targetRole === currentRole
  );

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testBody.trim()) return;
    onSendMockPush(testTitle, testBody, 'promo');
    setTestTitle('');
    setTestBody('');
    setShowTestForm(false);
  };

  const getIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'earn':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'redeem':
        return <Tag className="w-4 h-4 text-indigo-500" />;
      case 'promo':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'navigation':
        return <Navigation className="w-4 h-4 text-cyan-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Push Notifications
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentRole === 'user' ? 'Customer Inbox' : 'Merchant Broadcast Center'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onMarkAllRead}
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Test Push Generator Trigger */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50">
              {!showTestForm ? (
                <button
                  onClick={() => setShowTestForm(true)}
                  className="w-full text-left py-2 px-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800/80 shadow-xs flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-indigo-500" />
                    Simulate Custom Push Notification
                  </span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                    Test Mode
                  </span>
                </button>
              ) : (
                <form onSubmit={handleTestSubmit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Send Immediate Push Alert
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTestForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Alert Title (e.g. Flash Sale!)"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="Notification message body..."
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    rows={2}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Push Alert
                  </button>
                </form>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No notifications yet.
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition flex items-start gap-3 ${
                      !item.read
                        ? 'bg-indigo-50/70 dark:bg-slate-800/90 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
