import React from 'react';
import { Store, Wallet, ShieldCheck, Bell, MapPin, Sparkles, Navigation, UserCheck, LogOut, LogIn } from 'lucide-react';
import { UserWallet } from '../types';

interface HeaderProps {
  currentRole: 'user' | 'merchant';
  onRoleToggle: (role: 'user' | 'merchant') => void;
  wallet: UserWallet;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  activeView: 'wallet' | 'explore' | 'map';
  onViewChange: (view: 'wallet' | 'explore' | 'map') => void;
  authUser: { username: string; name: string } | null;
  onLogout: () => void;
  onOpenLogin: () => void;
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
  onOpenLogin
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              OmniLoyalty
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-wider text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Multi-Store Network
            </span>
          </div>
        </div>

        {/* Customer View Nav Pills */}
        {currentRole === 'user' && (
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onViewChange('wallet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'wallet'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Digital Wallet
            </button>
            <button
              onClick={() => onViewChange('explore')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'explore'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Store Directory
            </button>
            <button
              onClick={() => onViewChange('map')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'map'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Map & Route
            </button>
          </nav>
        )}

        {/* Right Section: Role Selector, Points Chip & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Authenticated User Status & Logout */}
          {authUser ? (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-slate-800 font-extrabold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">{authUser.username}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log out of session"
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition flex items-center gap-1 text-[11px] font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}

          {/* User Points Badge */}
          {currentRole === 'user' && (
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/80 text-blue-900 cursor-pointer transition">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <div className="text-right">
                <div className="text-xs font-extrabold text-blue-700 leading-none">
                  {wallet.pointsBalance.toLocaleString()} pts
                </div>
                <div className="text-[9px] text-blue-600/80 font-semibold">
                  {wallet.currentTier} Member
                </div>
              </div>
            </div>
          )}

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 transition"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Customer / Merchant Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onRoleToggle('user')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentRole === 'user'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3 h-3" />
              Customer
            </button>
            <button
              onClick={() => onRoleToggle('merchant')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentRole === 'merchant'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              Merchant POS
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {currentRole === 'user' && (
        <div className="md:hidden flex items-center justify-around bg-slate-50 border-t border-slate-200 px-2 py-1.5">
          <button
            onClick={() => onViewChange('wallet')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg ${
              activeView === 'wallet' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Wallet
          </button>
          <button
            onClick={() => onViewChange('explore')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg ${
              activeView === 'explore' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Store className="w-4 h-4" />
            Stores
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-lg ${
              activeView === 'map' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Map
          </button>
        </div>
      )}
    </header>
  );
};
