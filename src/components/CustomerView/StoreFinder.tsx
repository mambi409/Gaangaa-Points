import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Phone,
  Navigation,
  Tag,
  Award,
  SlidersHorizontal,
  ChevronRight,
  Coffee,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  UtensilsCrossed,
  Sparkles,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Store, RewardItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoreOpenStatus } from '../../utils/storeHours';

interface StoreFinderProps {
  stores: Store[];
  rewards: RewardItem[];
  userPoints: number;
  onNavigateToStore: (store: Store) => void;
  onRedeemReward: (reward: RewardItem) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const StoreFinder: React.FC<StoreFinderProps> = ({
  stores,
  rewards,
  userPoints,
  onNavigateToStore,
  onRedeemReward,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  const { t, language } = useLanguage();
  const [sortBy, setSortBy] = useState<'distance' | 'pointsRate' | 'rating' | 'openStatus'>('distance');
  const [activeStoreModal, setActiveStoreModal] = useState<Store | null>(null);

  const categories = [
    { label: 'All', display: t('stores.cat_all'), icon: Sparkles },
    { label: 'Coffee', display: t('stores.cat_coffee'), icon: Coffee },
    { label: 'Fashion', display: t('stores.cat_fashion'), icon: ShoppingBag },
    { label: 'Grocery', display: t('stores.cat_grocery'), icon: ShoppingBasket },
    { label: 'Electronics', display: t('stores.cat_electronics'), icon: Smartphone },
    { label: 'Dining', display: t('stores.cat_dining'), icon: UtensilsCrossed }
  ];

  const sortedStores = [...stores].sort((a, b) => {
    if (sortBy === 'distance') return (a.distanceKm || 0) - (b.distanceKm || 0);
    if (sortBy === 'pointsRate') return b.pointsRate - a.pointsRate;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'openStatus') {
      const aOpen = getStoreOpenStatus(a, new Date(), language as any).isOpen;
      const bOpen = getStoreOpenStatus(b, new Date(), language as any).isOpen;
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      return 0;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar & Filters Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-lg">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('stores.search_placeholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-500">
              {language === 'es' ? 'Ordenar:' : 'Sort:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="distance">{language === 'es' ? 'Más cercano' : 'Nearest First'}</option>
              <option value="openStatus">{language === 'es' ? 'Abiertos primero' : 'Open Now First'}</option>
              <option value="pointsRate">{language === 'es' ? 'Mayor tasa de puntos' : 'Highest Points Rate'}</option>
              <option value="rating">{language === 'es' ? 'Mejor calificado' : 'Top Rated'}</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => onSelectCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-200'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.display}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedStores.map((store) => {
          const status = getStoreOpenStatus(store, new Date(), language as any);

          return (
            <div
              key={store.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />

                  {/* Open / Closed Status Pill on Banner */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div
                      className={`font-extrabold text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-md backdrop-blur-md transition ${
                        status.isOpen
                          ? 'bg-emerald-600/90 text-white border-emerald-400/40'
                          : 'bg-slate-900/90 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status.isOpen ? 'bg-emerald-300 animate-pulse' : 'bg-rose-400'
                        }`}
                      />
                      <span>{status.statusLabel}</span>
                    </div>

                    {/* Points Rate Badge */}
                    <div className="bg-slate-900/85 text-emerald-400 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1 shadow-md backdrop-blur-md">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{store.pointsRate} {t('stores.points_rate')}</span>
                    </div>
                  </div>

                  {/* Distance Pill */}
                  <div className="absolute top-3 right-3 bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{store.distanceKm ? `${store.distanceKm} km` : language === 'es' ? 'Cercano' : 'Nearby'}</span>
                  </div>

                  {/* Store Title and Logo */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2.5">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={`${store.name} Logo`}
                        className="w-11 h-11 rounded-xl object-cover bg-white p-0.5 border-2 border-white/80 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-900/90 border border-white/30 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                        <Building className="w-5 h-5 text-blue-300" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-slate-900/80 px-2 py-0.5 rounded-md border border-blue-400/30">
                        {store.category}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-1 leading-tight drop-shadow-sm truncate">
                        {store.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3">
                  {/* Hours & Rating Row */}
                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2 pb-1 border-b border-slate-100">
                    {/* Time that store is open & Open/Closed indicator */}
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate" title={status.hoursDisplay}>
                        {status.hoursDisplay}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{store.rating}</span>
                      <span className="text-slate-400 font-normal">({store.reviewCount})</span>
                    </div>
                  </div>

                  {/* Open Status Detail Message */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        status.isOpen
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          status.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {status.detailMessage}
                    </span>

                    <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                      {store.city}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {store.description}
                  </p>

                  {/* Featured Perk / Reward */}
                  {store.featuredReward && (
                    <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-blue-900 font-medium truncate">
                        <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{store.featuredReward}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveStoreModal(store)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  {t('stores.view_rewards')}
                </button>
                <button
                  onClick={() => onNavigateToStore(store)}
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs shadow-blue-200 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {t('stores.get_directions')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Store Modal with Full Rewards Catalog */}
      {activeStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setActiveStoreModal(null)}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-6">
            {/* Modal Header */}
            <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-3xl bg-slate-100">
              <img
                src={activeStoreModal.image}
                alt={activeStoreModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {(() => {
                  const mStatus = getStoreOpenStatus(activeStoreModal, new Date(), language as any);
                  return (
                    <div
                      className={`font-extrabold text-xs px-3 py-1 rounded-lg border flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                        mStatus.isOpen
                          ? 'bg-emerald-600/90 text-white border-emerald-400/40'
                          : 'bg-slate-900/90 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          mStatus.isOpen ? 'bg-emerald-300 animate-pulse' : 'bg-rose-400'
                        }`}
                      />
                      <span>{mStatus.statusLabel} • {mStatus.hoursDisplay}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                {activeStoreModal.logo ? (
                  <img
                    src={activeStoreModal.logo}
                    alt={activeStoreModal.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-white p-0.5 border-2 border-white shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                    <Building className="w-7 h-7" />
                  </div>
                )}
                <div className="text-white min-w-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                    {activeStoreModal.category} Partner
                  </span>
                  <h3 className="text-2xl font-black text-white leading-tight truncate">
                    {activeStoreModal.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {activeStoreModal.address}, {activeStoreModal.city}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {activeStoreModal.openHours}
                </p>
                {activeStoreModal.phone && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {activeStoreModal.phone}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  onNavigateToStore(activeStoreModal);
                  setActiveStoreModal(null);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" /> {t('map.start_nav')}
              </button>
            </div>

            {/* Store Rewards Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {language === 'es'
                  ? `Catálogo de Recompensas Canjeables (${userPoints} pts disponibles)`
                  : `Redeemable Rewards Catalog (${userPoints} pts available)`}
              </h4>

              <div className="space-y-3">
                {rewards
                  .filter((r) => r.storeId === activeStoreModal.id)
                  .map((reward) => {
                    const canAfford = userPoints >= reward.pointsCost;

                    return (
                      <div
                        key={reward.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                              {reward.discountValue}
                            </span>
                            {reward.minTier && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                                {reward.minTier} Only
                              </span>
                            )}
                          </div>
                          <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {reward.title}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {reward.description}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (canAfford) {
                              onRedeemReward(reward);
                              setActiveStoreModal(null);
                            }
                          }}
                          disabled={!canAfford}
                          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shrink-0 transition cursor-pointer ${
                            canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {canAfford
                            ? language === 'es'
                              ? `Canjear por ${reward.pointsCost} pts`
                              : `Redeem for ${reward.pointsCost} pts`
                            : language === 'es'
                            ? `Faltan ${reward.pointsCost - userPoints} pts`
                            : `Need ${reward.pointsCost - userPoints} more pts`}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setActiveStoreModal(null)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                {language === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
