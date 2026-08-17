import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
  Compass,
  Award,
  ChevronRight,
  Sparkles,
  Phone,
  Clock,
  Crosshair,
  Maximize2,
  Coffee,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  UtensilsCrossed,
  HeartPulse,
  Cake,
  Star,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { Store, NavigationRoute } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface InteractiveMapProps {
  stores: Store[];
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  userLat: number;
  userLng: number;
  activeRoute: NavigationRoute | null;
  onStartNavigation: (store: Store) => void;
}

// Category color mappings and badges for Curacao merchants
const CATEGORY_META: Record<string, { bg: string; text: string; icon: string; pinBg: string }> = {
  Coffee: { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', icon: '☕', pinBg: '#d97706' },
  Fashion: { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', icon: '👗', pinBg: '#9333ea' },
  Grocery: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', icon: '🛒', pinBg: '#059669' },
  Electronics: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: '📱', pinBg: '#2563eb' },
  Dining: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', icon: '🍽️', pinBg: '#ea580c' },
  Wellness: { bg: 'bg-teal-100 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300', icon: '💆', pinBg: '#0d9488' },
  Bakery: { bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300', icon: '🥐', pinBg: '#e11d48' }
};

// Curacao Landmark Districts with preset coordinates
const CURACAO_DISTRICTS = [
  { id: 'all', labelKey: 'map.district_all', lat: 12.1696, lng: -68.9900, zoom: 11 },
  { id: 'punda', labelKey: 'map.district_willemstad', lat: 12.1054, lng: -68.9332, zoom: 16 },
  { id: 'otrobanda', labelKey: 'map.district_otrobanda', lat: 12.1082, lng: -68.9370, zoom: 16 },
  { id: 'pietermaai', labelKey: 'map.district_pietermaai', lat: 12.1028, lng: -68.9285, zoom: 16 },
  { id: 'mambo', labelKey: 'map.district_mambo', lat: 12.0885, lng: -68.8982, zoom: 15 },
  { id: 'janthiel', labelKey: 'map.district_janthiel', lat: 12.0782, lng: -68.8788, zoom: 15 },
  { id: 'salina', labelKey: 'map.district_salina', lat: 12.1150, lng: -68.9050, zoom: 14 }
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stores,
  selectedStore,
  onSelectStore,
  userLat,
  userLng,
  activeRoute,
  onStartNavigation
}) => {
  const { t, language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapStyle, setMapStyle] = useState<'standard' | 'dark' | 'satellite'>('standard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDistrict, setActiveDistrict] = useState<string>('all');

  // Filter stores by category
  const filteredStores = stores.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Tile layer URL map
  const getTileUrl = (style: 'standard' | 'dark' | 'satellite') => {
    switch (style) {
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'standard':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = (style: 'standard' | 'dark' | 'satellite') => {
    switch (style) {
      case 'dark':
        return '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap';
      case 'satellite':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP';
      case 'standard':
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Map centered in Willemstad / Curacao
      const map = L.map(mapContainerRef.current, {
        center: [userLat || 12.1054, userLng || -68.9332],
        zoom: 13,
        zoomControl: false,
        attributionControl: true
      });

      // Add Base Tile Layer
      const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
        attribution: getTileAttribution(mapStyle),
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Add Markers Layer Group
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(getTileUrl(mapStyle), {
      attribution: getTileAttribution(mapStyle),
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Update Merchant Pins & User Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear old markers
    markersLayerRef.current.clearLayers();

    // 1. Create and Add User Location Pin
    const userIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <span class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping"></span>
        <span class="absolute w-6 h-6 rounded-full bg-blue-400/30"></span>
        <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'user-pin-wrapper',
      html: userIconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker([userLat || 12.1054, userLng || -68.9332], { icon: userIcon })
      .bindTooltip(t('map.current_location'), { direction: 'top', offset: [0, -10] })
      .addTo(markersLayerRef.current);

    userMarkerRef.current = userMarker;

    // 2. Create and Add Store Pins
    filteredStores.forEach((store) => {
      const isSelected = selectedStore?.id === store.id;
      const meta = CATEGORY_META[store.category] || { icon: '📍', pinBg: '#3b82f6' };

      const pinHtml = `
        <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-full transition-transform duration-200 ${
          isSelected ? 'scale-115 z-50' : 'hover:scale-110 z-20'
        }">
          ${
            isSelected
              ? `<div class="absolute -inset-2.5 rounded-full bg-indigo-500/40 animate-pulse"></div>`
              : ''
          }
          
          <div class="flex flex-col items-center">
            <!-- Pin Head with Category Icon & Points Multiplier -->
            <div class="px-2 py-1 rounded-xl shadow-xl flex items-center gap-1 border-2 ${
              isSelected
                ? 'bg-slate-900 border-indigo-400 text-white shadow-indigo-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-black/20'
            }">
              <span class="text-xs">${meta.icon}</span>
              <span class="text-[10px] font-black tracking-tight whitespace-nowrap">${store.name.split(' ')[0]}</span>
              <span class="text-[9px] font-extrabold px-1 rounded-md ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }">${store.pointsRate}x</span>
            </div>

            <!-- Pointer Arrow -->
            <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${
              isSelected ? 'border-t-indigo-500' : 'border-t-white dark:border-t-slate-900'
            } -mt-0.5 shadow-sm"></div>

            <!-- Dot Anchor -->
            <div class="w-2 h-2 rounded-full ${
              isSelected ? 'bg-indigo-500' : 'bg-slate-700 dark:bg-slate-300'
            } -mt-0.5 border border-white dark:border-slate-900"></div>
          </div>
        </div>
      `;

      const storeIcon = L.divIcon({
        className: 'store-pin-wrapper',
        html: pinHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 42]
      });

      const marker = L.marker([store.lat, store.lng], { icon: storeIcon })
        .addTo(markersLayerRef.current!)
        .on('click', () => {
          onSelectStore(store);
        });
    });
  }, [filteredStores, selectedStore, userLat, userLng, language, t]);

  // Center map on selected store if changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStore) return;
    mapInstanceRef.current.flyTo([selectedStore.lat, selectedStore.lng], 16, {
      duration: 1.2
    });
  }, [selectedStore]);

  // Handle active navigation polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing polyline if any
    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (activeRoute && activeRoute.pathPoints && activeRoute.pathPoints.length >= 2) {
      const latLngs: L.LatLngExpression[] = activeRoute.pathPoints.map((pt) => [pt[0], pt[1]]);

      const polyline = L.polyline(latLngs, {
        color: '#6366f1',
        weight: 6,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = polyline;

      // Fit route bounds nicely
      mapInstanceRef.current.fitBounds(polyline.getBounds(), {
        padding: [60, 60],
        maxZoom: 16
      });
    }
  }, [activeRoute]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenterUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLat || 12.1054, userLng || -68.9332], 15, {
        duration: 1
      });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || filteredStores.length === 0) return;
    const group = new L.FeatureGroup(
      filteredStores.map((s) => L.marker([s.lat, s.lng]))
    );
    mapInstanceRef.current.fitBounds(group.getBounds(), {
      padding: [50, 50],
      maxZoom: 15
    });
  };

  const handleSelectDistrict = (district: typeof CURACAO_DISTRICTS[0]) => {
    setActiveDistrict(district.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([district.lat, district.lng], district.zoom, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  {t('map.curacao_network')}
                </span>
                <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-blue-200 dark:border-blue-800">
                  🇨🇼 Curaçao ({filteredStores.length})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'es' ? 'Willemstad, Pietermaai, Mambo Beach, Jan Thiel & Saliña' : 'Willemstad, Pietermaai, Mambo Beach, Jan Thiel & Saliña'}
              </p>
            </div>
          </div>

          {/* Layer and Zoom controls */}
          <div className="flex items-center gap-2">
            {/* Tile Layer Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMapStyle('standard')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'standard'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('map.layer_street')}
              </button>
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('map.layer_dark')}
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'satellite'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('map.layer_satellite')}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handleRecenterUser}
                title={t('map.recenter_user')}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <Crosshair className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                onClick={handleFitAll}
                title={t('map.fit_all')}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* District Quick Zoom Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-500 font-bold text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500" />
            {t('map.filter_district')}
          </span>
          {CURACAO_DISTRICTS.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelectDistrict(d)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition cursor-pointer border ${
                activeDistrict === d.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t(d.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaflet Map Viewport Container */}
      <div className="relative w-full h-[540px] sm:h-[580px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* User GPS Pin Floating Badge */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-white flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span className="font-bold text-[11px]">🇨🇼 Willemstad, Curaçao</span>
        </div>

        {/* Active Route Status Badge */}
        {activeRoute && (
          <div className="absolute top-4 right-4 z-20 bg-indigo-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-2 shadow-lg">
            <Navigation className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-extrabold text-[11px]">
              {language === 'es' ? 'Ruta Activa a' : 'Active GPS Route to'} {activeRoute.storeName}
            </span>
          </div>
        )}

        {/* Selected Store Floating Action Card */}
        {selectedStore && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white p-5 rounded-3xl border border-blue-500/40 shadow-2xl z-30 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    {selectedStore.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{selectedStore.rating}</span>
                  </div>
                </div>
                <h4 className="text-base font-black leading-snug">{selectedStore.name}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{selectedStore.address}</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 whitespace-nowrap block">
                  {selectedStore.pointsRate} {t('stores.points_rate')}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {selectedStore.openHours}
                </span>
              </div>
            </div>

            {/* Featured reward or perk banner */}
            {selectedStore.featuredReward && (
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="line-clamp-1">{selectedStore.featuredReward}</span>
              </div>
            )}

            {/* Navigation / Directions Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                {t('map.distance')}: {selectedStore.distanceKm || 0.8} km {language === 'es' ? 'de distancia' : 'away'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStartNavigation(selectedStore)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{t('map.start_nav')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
