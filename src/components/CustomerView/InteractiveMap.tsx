import React, { useState } from 'react';
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
  Clock
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapStyle, setMapStyle] = useState<'standard' | 'dark' | 'satellite'>('standard');

  // Map SVG canvas coordinate mapping setup
  // Lat range ~ 37.7800 to 37.7950
  // Lng range ~ -122.4200 to -122.3950
  const latMin = 37.780;
  const latMax = 37.796;
  const lngMin = -122.422;
  const lngMax = -122.395;

  const getCanvasCoords = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 800;
    const y = 500 - ((lat - latMin) / (latMax - latMin)) * 500;
    return { x: Math.max(40, Math.min(760, x)), y: Math.max(40, Math.min(460, y)) };
  };

  const userCoords = getCanvasCoords(userLat, userLng);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-extrabold text-slate-800 dark:text-slate-200">
            {language === 'es' ? 'Mapa de la Red Comercial' : 'Downtown Retail Network Map'}
          </span>
          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
            {stores.length} {language === 'es' ? 'Tiendas' : 'Outlets'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setMapStyle('standard')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                mapStyle === 'standard'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'es' ? 'Calle' : 'Street'}
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                mapStyle === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'es' ? 'Oscuro' : 'Dark'}
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'es' ? 'Satélite' : 'Satellite'}
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full h-[520px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
        <div
          className="w-full h-full transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg className="w-full h-full" viewBox="0 0 800 500">
            {/* Map Canvas Background depending on mapStyle */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke={mapStyle === 'satellite' ? '#1e293b' : '#334155'}
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            {/* Base Fill */}
            <rect
              width="800"
              height="500"
              fill={
                mapStyle === 'standard'
                  ? '#0f172a'
                  : mapStyle === 'dark'
                  ? '#020617'
                  : '#0b1329'
              }
            />
            <rect width="800" height="500" fill="url(#grid)" opacity="0.4" />

            {/* Simulated Urban Roads Grid */}
            <g stroke="#1e293b" strokeWidth="8" strokeLinecap="round" opacity="0.8">
              {/* Main Horizontal Avenues */}
              <line x1="0" y1="120" x2="800" y2="120" stroke="#334155" strokeWidth="12" />
              <line x1="0" y1="240" x2="800" y2="240" stroke="#334155" strokeWidth="10" />
              <line x1="0" y1="380" x2="800" y2="380" stroke="#334155" strokeWidth="12" />

              {/* Cross Streets */}
              <line x1="160" y1="0" x2="160" y2="500" stroke="#334155" strokeWidth="10" />
              <line x1="380" y1="0" x2="380" y2="500" stroke="#334155" strokeWidth="12" />
              <line x1="600" y1="0" x2="600" y2="500" stroke="#334155" strokeWidth="10" />
            </g>

            {/* Active Navigation Route Path Line */}
            {activeRoute && activeRoute.pathPoints.length >= 2 && (
              <g>
                <path
                  d={`M ${getCanvasCoords(activeRoute.pathPoints[0][0], activeRoute.pathPoints[0][1]).x} ${
                    getCanvasCoords(activeRoute.pathPoints[0][0], activeRoute.pathPoints[0][1]).y
                  } ${activeRoute.pathPoints
                    .slice(1)
                    .map((pt) => {
                      const c = getCanvasCoords(pt[0], pt[1]);
                      return `L ${c.x} ${c.y}`;
                    })
                    .join(' ')}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="6"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                <path
                  d={`M ${getCanvasCoords(activeRoute.pathPoints[0][0], activeRoute.pathPoints[0][1]).x} ${
                    getCanvasCoords(activeRoute.pathPoints[0][0], activeRoute.pathPoints[0][1]).y
                  } ${activeRoute.pathPoints
                    .slice(1)
                    .map((pt) => {
                      const c = getCanvasCoords(pt[0], pt[1]);
                      return `L ${c.x} ${c.y}`;
                    })
                    .join(' ')}`}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* User GPS Location Marker */}
            <g transform={`translate(${userCoords.x}, ${userCoords.y})`}>
              <circle r="18" fill="#38bdf8" opacity="0.25" className="animate-ping" />
              <circle r="10" fill="#0284c7" border="2px solid white" />
              <circle r="5" fill="#ffffff" />
            </g>

            {/* Store Pins */}
            {stores.map((s) => {
              const coords = getCanvasCoords(s.lat, s.lng);
              const isSelected = selectedStore?.id === s.id;

              return (
                <g
                  key={s.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  onClick={() => onSelectStore(s)}
                  className="cursor-pointer group/pin"
                >
                  {/* Pin Pulse */}
                  {isSelected && (
                    <circle r="22" fill="#6366f1" opacity="0.3" className="animate-pulse" />
                  )}

                  {/* Pin Body */}
                  <path
                    d="M 0 -22 C -10 -22 -16 -14 -16 -4 C -16 8 0 22 0 22 C 0 22 16 8 16 -4 C 16 -14 10 -22 0 -22 Z"
                    fill={isSelected ? '#6366f1' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle r="6" fill="#ffffff" cy="-8" />

                  {/* Store Name Tag on Map */}
                  <text
                    x="0"
                    y="32"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="drop-shadow-md select-none"
                  >
                    {s.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating User Location Badge */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold">{t('map.current_location')}</span>
        </div>

        {/* Selected Store Floating Tooltip Card */}
        {selectedStore && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-sm bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-3xl border border-indigo-500/40 shadow-2xl z-20 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-md">
                  {selectedStore.category}
                </span>
                <h4 className="text-base font-extrabold mt-1">{selectedStore.name}</h4>
                <p className="text-xs text-slate-300">{selectedStore.address}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 whitespace-nowrap">
                {selectedStore.pointsRate} {t('stores.points_rate')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">
                {t('map.distance')}: {selectedStore.distanceKm || 0.4} km {language === 'es' ? 'de distancia' : 'away'}
              </span>
              <button
                onClick={() => onStartNavigation(selectedStore)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                {t('map.start_nav')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
