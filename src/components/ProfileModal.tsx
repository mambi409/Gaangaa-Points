import React, { useState, useEffect } from 'react';
import { User, KeyRound, Mail, ShieldCheck, Check, X, Lock, Eye, EyeOff, Save, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: {
    username: string;
    name: string;
    email?: string;
    passId: string;
    pinCode?: string;
    role?: 'user' | 'merchant';
  } | null;
  onProfileUpdated: (updatedUser: {
    username: string;
    name: string;
    email: string;
    passId: string;
    pinCode: string;
    role?: 'user' | 'merchant';
  }) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onProfileUpdated
}) => {
  const { t, language } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && authUser) {
      setFullName(authUser.name || '');
      setEmail(authUser.email || `${authUser.username}@example.com`);
      setPinCode(authUser.pinCode || '12345');
      setShowPin(false);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, authUser]);

  if (!isOpen || !authUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPin = pinCode.trim();
    if (!/^\d{5}$/.test(cleanPin)) {
      setErrorMsg(language === 'es' ? 'El PIN de seguridad debe tener exactamente 5 dígitos (0-9).' : 'Security PIN must be exactly 5 digits (0-9).');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg(language === 'es' ? 'El nombre completo no puede estar vacío.' : 'Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser.username,
          fullName: fullName.trim(),
          email: email.trim(),
          pinCode: cleanPin
        })
      });

      const data = await res.json();
      setIsSaving(false);

      if (data.success) {
        setSuccessMsg(t('profile.success'));
        onProfileUpdated({
          username: authUser.username,
          name: fullName.trim(),
          email: email.trim(),
          passId: authUser.passId,
          pinCode: cleanPin,
          role: authUser.role
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || (language === 'es' ? 'Error al actualizar el perfil.' : 'Failed to update profile.'));
      }
    } catch (err) {
      setIsSaving(false);
      setErrorMsg(language === 'es' ? 'Error al guardar la configuración del perfil.' : 'Error saving profile settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('profile.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('profile.desc')}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <X className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Read-Only Info Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {t('profile.field_username')}
              </span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">@{authUser.username}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {t('profile.field_pass_id')}
              </span>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{authUser.passId}</p>
            </div>
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" /> {t('profile.field_name')}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Email Address Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" /> {t('profile.field_email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* 5-Digit Security PIN Input */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {t('profile.field_current_pin')}
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? (language === 'es' ? 'Ocultar' : 'Hide') : (language === 'es' ? 'Mostrar' : 'Show')}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={5}
                required
                value={pinCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setPinCode(val);
                }}
                placeholder="12345"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-100 font-mono tracking-widest text-base font-extrabold focus:ring-2 focus:ring-amber-500 outline-none transition"
              />
              <Lock className="w-4 h-4 text-amber-500 absolute right-3.5 top-3" />
            </div>

            <p className="text-[11px] text-amber-800 dark:text-amber-400/90 leading-snug">
              {language === 'es'
                ? 'Este código de 5 dígitos es necesario cada vez que autorices transacciones (canje de recompensas, escaneo POS o emisión de promociones).'
                : 'This 5-digit code is required whenever you commit transactions (redeeming rewards, POS scans, or broadcasting store deals).'}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (language === 'es' ? 'Guardando...' : 'Saving Changes...') : t('profile.btn_save')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
