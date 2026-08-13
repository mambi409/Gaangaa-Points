import React from 'react';
import {
  Home as HomeIcon,
  Store,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Sparkles,
  Navigation,
  UserCheck,
  LogOut,
  LogIn,
  UserPlus,
  Globe
} from 'lucide-react';
import { UserWallet, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentRole: 'user' | 'merchant' | 'admin';
  onRoleToggle: (role: 'user' | 'merchant' | 'admin') => void;
  wallet: UserWallet;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  activeView: 'home' | 'wallet' | 'explore' | 'map';
  onViewChange: (view: 'home' | 'wallet' | 'explore' | 'map') => void;
  authUser: { username: string; name: string; email?: string; passId?: string; pinCode?: string; role?: 'user' | 'merchant' | 'admin' } | null;
  onLogout: () => void;
  onOpenLogin: (mode?: 'login' | 'register') => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleToggle,
  wallet,
  unreadNotifsCount,
  onOpenNotifications,
  activeView,
  onViewChange,
  authUser,
  onLogout,
  onOpenLogin,
  onOpenProfile
}) => {
  const { language, toggleLanguage, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand logo & title */}
        <button
          onClick={() => onViewChange('home')}
          className="flex items-center gap-2.5 hover:opacity-90 transition text-left cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200 dark:shadow-none">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              OmniLoyalty
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {t('nav.multi_store_network')}
            </span>
          </div>
        </button>

        {/* Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => onViewChange('home')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeView === 'home'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            {t('nav.home')}
          </button>

          {currentRole === 'user' && (
            <>
              <button
                onClick={() => onViewChange('wallet')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeView === 'wallet'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                {t('nav.wallet')}
              </button>
              <button
                onClick={() => onViewChange('explore')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeView === 'explore'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                {t('nav.stores')}
              </button>
              <button
                onClick={() => onViewChange('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeView === 'map'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                {t('nav.map')}
              </button>
            </>
          )}
        </nav>

        {/* Right Section: Language Button, Auth Status, Points, Notifications & Role Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Translate / Language Switcher Button */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLanguage('en')}
              title="Switch to English"
              className={`px-2 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇺🇸</span>
              <span className="text-[11px]">EN</span>
            </button>
            <button
              onClick={() => setLanguage('es')}
              title="Cambiar a Español"
              className={`px-2 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
                language === 'es'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇪🇸</span>
              <span className="text-[11px]">ES</span>
            </button>
          </div>

          {/* Menu Items: Login & Register when logged out, or User Badge when logged in */}
          {authUser ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={onOpenProfile}
                title="Edit Account Profile & 5-Digit PIN"
                className="flex items-center gap-1.5 px-2 py-1 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-extrabold transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden lg:inline">{authUser.username}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold">
                  {t('nav.pin_active')}
                </span>
              </button>
              <button
                onClick={onLogout}
                title="Log out of session"
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenLogin('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.login')}</span>
              </button>
              <button
                onClick={() => onOpenLogin('register')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('nav.register')}</span>
              </button>
            </div>
          )}

          {/* Customer Points Badge */}
          {currentRole === 'user' && authUser && (
            <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-blue-900/80 text-blue-900 dark:text-blue-200 transition">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <div className="text-right">
                <div className="text-xs font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                  {wallet.pointsBalance.toLocaleString()} pts
                </div>
                <div className="text-[9px] text-blue-600/80 dark:text-blue-400 font-semibold">
                  {wallet.currentTier}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Member / Merchant / Admin Role Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onRoleToggle('user')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                currentRole === 'user'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3 h-3" />
              <span className="hidden sm:inline">{t('nav.member')}</span>
            </button>
            <button
              onClick={() => onRoleToggle('merchant')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                currentRole === 'merchant'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span className="hidden sm:inline">{t('nav.merchant')}</span>
            </button>
            {(authUser?.role === 'admin' || authUser?.username?.toLowerCase() === 'mambiadmin' || currentRole === 'admin') && (
              <button
                onClick={() => onRoleToggle('admin')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  currentRole === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5">
        <button
          onClick={() => onViewChange('home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg cursor-pointer ${
            activeView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
          }`}
        >
          <HomeIcon className="w-4 h-4" />
          <span>{t('nav.home')}</span>
        </button>

        {currentRole === 'user' ? (
          <>
            <button
              onClick={() => onViewChange('wallet')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg cursor-pointer ${
                activeView === 'wallet' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{t('nav.wallet')}</span>
            </button>
            <button
              onClick={() => onViewChange('explore')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg cursor-pointer ${
                activeView === 'explore' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>{t('nav.stores')}</span>
            </button>
            <button
              onClick={() => onViewChange('map')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg cursor-pointer ${
                activeView === 'map' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{t('nav.map')}</span>
            </button>
          </>
        ) : (
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 py-1">
            {t('nav.terminal_mode')}
          </div>
        )}
      </div>
    </header>
  );
};
