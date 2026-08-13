import React from 'react';
import {
  Sparkles,
  Wallet,
  Store,
  QrCode,
  MapPin,
  Gift,
  ShieldCheck,
  TrendingUp,
  Bell,
  Navigation,
  CheckCircle2,
  ArrowRight,
  User,
  Building2,
  Star
} from 'lucide-react';
import { Store as StoreType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HomeProps {
  stores: StoreType[];
  onOpenMemberAuth: (mode?: 'login' | 'register') => void;
  onOpenMerchantAuth: () => void;
  onExploreStores: () => void;
}

export const Home: React.FC<HomeProps> = ({
  stores,
  onOpenMemberAuth,
  onOpenMerchantAuth,
  onExploreStores
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 md:p-16 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{t('home.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            {t('home.hero_title_1')} <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              {t('home.hero_title_2')}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
            {t('home.hero_desc')}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenMemberAuth('register')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>{t('home.btn_register')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenMemberAuth('login')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm rounded-xl transition backdrop-blur-md flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-blue-300" />
              <span>{t('home.btn_signin')}</span>
            </button>

            <button
              onClick={onOpenMerchantAuth}
              className="px-6 py-3.5 bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-400/30 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-300" />
              <span>{t('home.btn_merchant')}</span>
            </button>
          </div>

          {/* Key Stat Badges */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">12+ Stores</div>
              <div className="text-xs text-slate-400 font-medium">{t('home.stat_stores')}</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-blue-400">10 pts / $1</div>
              <div className="text-xs text-slate-400 font-medium">{t('home.stat_rate')}</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-indigo-400">4 Tiers</div>
              <div className="text-xs text-slate-400 font-medium">{t('home.stat_tiers')}</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{t('home.stat_instant')}</div>
              <div className="text-xs text-slate-400 font-medium">{t('home.stat_instant_sub')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Persona Pathways: Member vs Merchant */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Member Pathway Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                {t('auth.tab_member')}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {t('wallet.omnipass_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {t('home.hero_desc')}
              </p>
            </div>

            <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>{t('home.feat_1_title')}:</strong> {t('home.feat_1_desc')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>{t('home.feat_3_title')}:</strong> {t('home.feat_3_desc')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>{t('home.feat_2_title')}:</strong> {t('home.feat_2_desc')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={() => onOpenMemberAuth('login')}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition text-center shadow-sm cursor-pointer"
            >
              {t('home.btn_signin')}
            </button>
            <button
              onClick={() => onOpenMemberAuth('register')}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition text-center border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {t('home.btn_register')}
            </button>
          </div>
        </div>

        {/* Merchant Pathway Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-900">
                {t('auth.tab_merchant')}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {t('merchant.dashboard_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {t('home.merchant_cta_desc')}
              </p>
            </div>

            <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>{t('pos.title')}:</strong> {t('pos.desc')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>{t('reward_mgr.title')}:</strong> {t('reward_mgr.desc')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>{t('broadcast.title')}:</strong> {t('broadcast.desc')}</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onOpenMerchantAuth}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>{t('home.merchant_cta_btn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Partner Stores Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {t('home.stat_stores')}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('home.featured_stores')}
            </h2>
          </div>
          <button
            onClick={onExploreStores}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>{t('home.view_all_stores')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.slice(0, 3).map((store) => (
            <div
              key={store.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">
                  {store.category}
                </div>
                <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[11px] font-black shadow-xs">
                  {store.pointsRate} {t('stores.points_rate')}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{store.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {store.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{store.address}, {store.city}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {store.featuredReward || 'Member Discount Perks'}
                </span>
                <button
                  onClick={() => onOpenMemberAuth('login')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg transition cursor-pointer"
                >
                  {t('scan.tab_earn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
