import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bell, Sparkles, Smartphone, Users } from 'lucide-react';
import { Store } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface PushNotificationBroadcasterProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore: Store;
  onSendBroadcast: (title: string, body: string, targetAudience: string) => Promise<void>;
}

export const PushNotificationBroadcaster: React.FC<PushNotificationBroadcasterProps> = ({
  isOpen,
  onClose,
  activeStore,
  onSendBroadcast
}) => {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState(
    language === 'es'
      ? `⚡ ¡Recompensas Relámpago en ${activeStore.name}!`
      : `⚡ Flash Rewards at ${activeStore.name}!`
  );
  const [body, setBody] = useState(
    language === 'es'
      ? `¡Gana el doble de puntos en todas las compras hasta las 6:00 PM hoy! Canjea puntos por recompensas gratis.`
      : `Earn 2x bonus points on all store purchases until 6:00 PM today. Redeem points for free rewards!`
  );
  const [targetAudience, setTargetAudience] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAICopy = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/perks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'merchant_promo_copy',
          storeContext: activeStore
        })
      });
      const data = await res.json();
      if (data.generatedPromo) {
        setBody(data.generatedPromo);
      }
    } catch (err) {
      console.error('Failed to generate AI push copy:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    try {
      await onSendBroadcast(title, body, targetAudience);
      setIsSending(false);
      onClose();
    } catch (err) {
      setIsSending(false);
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
          className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                  {language === 'es' ? 'Emisión de Notificación Push' : 'Push Notification Broadcast'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeStore.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Audience */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'es' ? 'Audiencia Objetivo' : 'Target Audience'}
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                <option value="all">
                  {language === 'es' ? 'Todos los Miembros de la Red (312 visitantes)' : 'All Network Members (312 visitors)'}
                </option>
                <option value="nearby">
                  {language === 'es' ? 'Visitantes Cercanos en este momento (< 1km)' : 'Visitors Currently Nearby (< 1km)'}
                </option>
                <option value="gold">
                  {language === 'es' ? 'Solo Miembros Oro y Platino' : 'Gold & Platinum Tier Members Only'}
                </option>
              </select>
            </div>

            {/* Notification Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'es' ? 'Titular de la Notificación' : 'Notification Headline'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Notification Body with AI Writer */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'es' ? 'Texto del Mensaje' : 'Push Message Text'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAICopy}
                  disabled={isGeneratingAI}
                  className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  {isGeneratingAI
                    ? (language === 'es' ? 'Generando con Gemini...' : 'Gemini Generating...')
                    : (language === 'es' ? 'Generar con Gemini AI' : 'Generate with Gemini AI')}
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Live Lockscreen Mockup Preview */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-white space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-amber-400" /> {language === 'es' ? 'Vista Previa en Pantalla de Bloqueo' : 'Member Mobile Lockscreen Preview'}
                </span>
                <span>{language === 'es' ? 'AHORA' : 'NOW'}</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-100">{title || (language === 'es' ? 'Titular' : 'Headline')}</h5>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    {body || (language === 'es' ? 'Texto de vista previa...' : 'Push text body preview...')}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-xs transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSending
                ? (language === 'es' ? 'Enviando Notificación...' : 'Dispatching Push...')
                : (language === 'es' ? 'Emitir Notificación Instantánea' : 'Broadcast Instant Push Notification')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
