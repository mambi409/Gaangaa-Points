import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  StoreWeeklySchedule,
  DaySchedule
} from '../../types';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Tag,
  Building,
  Save,
  Navigation,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Compass,
  Crosshair,
  ExternalLink
} from 'lucide-react';
import { saveStoreToDatabase, DEFAULT_WEEKLY_SCHEDULE } from '../../lib/storeDatabase';
import { useLanguage } from '../../context/LanguageContext';

interface MerchantStoreProfileEditorProps {
  store: Store;
  onStoreUpdated: (updated: Store) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORY_OPTIONS = [
  'Coffee',
  'Fashion',
  'Grocery',
  'Electronics',
  'Dining',
  'Wellness',
  'Bakery',
  'Beauty',
  'Services'
];

const PRESET_COORDINATES = [
  { name: 'Union Square (Downtown)', lat: 37.7879, lng: -122.4075 },
  { name: 'Financial District (Montgomery)', lat: 37.7924, lng: -122.4038 },
  { name: 'SOMA / Market St', lat: 37.7845, lng: -122.4068 },
  { name: 'Embarcadero / Ferry Bldg', lat: 37.7955, lng: -122.3937 },
  { name: 'Mission District', lat: 37.7599, lng: -122.4148 },
  { name: 'Marina / Chestnut St', lat: 37.8005, lng: -122.4365 },
  { name: 'North Beach / Columbus', lat: 37.7995, lng: -122.4085 }
];

const DAYS_OF_WEEK: (keyof StoreWeeklySchedule)[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const DAY_LABELS: Record<keyof StoreWeeklySchedule, { en: string; es: string }> = {
  monday: { en: 'Monday', es: 'Lunes' },
  tuesday: { en: 'Tuesday', es: 'Martes' },
  wednesday: { en: 'Wednesday', es: 'Miércoles' },
  thursday: { en: 'Thursday', es: 'Jueves' },
  friday: { en: 'Friday', es: 'Viernes' },
  saturday: { en: 'Saturday', es: 'Sábado' },
  sunday: { en: 'Sunday', es: 'Domingo' }
};

export const MerchantStoreProfileEditor: React.FC<MerchantStoreProfileEditorProps> = ({
  store,
  onStoreUpdated,
  showToast
}) => {
  const { language } = useLanguage();

  // Form State
  const [name, setName] = useState(store.name || '');
  const [category, setCategory] = useState<string>(store.category || 'Coffee');
  const [description, setDescription] = useState(store.description || '');
  const [address, setAddress] = useState(store.address || '');
  const [city, setCity] = useState(store.city || 'San Francisco');
  const [lat, setLat] = useState<number>(store.lat || 37.7891);
  const [lng, setLng] = useState<number>(store.lng || -122.4082);
  const [openHours, setOpenHours] = useState(store.openHours || '7:00 AM - 7:00 PM');
  const [phone, setPhone] = useState(store.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(store.secondaryPhone || '');
  const [email, setEmail] = useState(
    store.email || `${store.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@omniloyalty.internal`
  );
  const [website, setWebsite] = useState(store.website || '');
  const [managerName, setManagerName] = useState(store.managerName || '');
  const [socialHandle, setSocialHandle] = useState(store.socialHandle || '');
  const [pointsRate, setPointsRate] = useState<number>(store.pointsRate || 10);
  const [perks, setPerks] = useState<string[]>(store.perks || []);
  const [newPerkInput, setNewPerkInput] = useState('');
  const [imageUrl, setImageUrl] = useState(store.image || '');

  // Weekly Schedule Matrix
  const [schedule, setSchedule] = useState<StoreWeeklySchedule>(() => {
    return store.schedule || DEFAULT_WEEKLY_SCHEDULE;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'location' | 'hours' | 'contact' | 'loyalty'>('details');

  // Synchronize when store prop changes
  useEffect(() => {
    setName(store.name || '');
    setCategory(store.category || 'Coffee');
    setDescription(store.description || '');
    setAddress(store.address || '');
    setCity(store.city || 'San Francisco');
    setLat(store.lat || 37.7891);
    setLng(store.lng || -122.4082);
    setOpenHours(store.openHours || '7:00 AM - 7:00 PM');
    setPhone(store.phone || '');
    setSecondaryPhone(store.secondaryPhone || '');
    setEmail(store.email || `${store.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@omniloyalty.internal`);
    setWebsite(store.website || '');
    setManagerName(store.managerName || '');
    setSocialHandle(store.socialHandle || '');
    setPointsRate(store.pointsRate || 10);
    setPerks(store.perks || []);
    setImageUrl(store.image || '');
    setSchedule(store.schedule || DEFAULT_WEEKLY_SCHEDULE);
  }, [store.id]);

  // Handle GPS Auto-detect
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = parseFloat(pos.coords.latitude.toFixed(6));
        const detectedLng = parseFloat(pos.coords.longitude.toFixed(6));
        setLat(detectedLat);
        setLng(detectedLng);
        setIsLocatingUser(false);
        showToast(`Updated GPS coordinates to (${detectedLat}, ${detectedLng})`, 'success');
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Geolocation error:', err);
        showToast('Could not retrieve GPS location. Using preset coordinates.', 'info');
      },
      { timeout: 8000 }
    );
  };

  // Handle Schedule change
  const handleScheduleDayChange = (day: keyof StoreWeeklySchedule, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  // Apply Monday hours to all weekdays
  const handleCopyMondayToWeekdays = () => {
    const mondaySched = schedule.monday;
    setSchedule((prev) => ({
      ...prev,
      tuesday: { ...mondaySched },
      wednesday: { ...mondaySched },
      thursday: { ...mondaySched },
      friday: { ...mondaySched }
    }));
    showToast('Applied Monday opening hours to all weekdays (Tue-Fri)', 'info');
  };

  // Add Perk
  const handleAddPerk = () => {
    if (!newPerkInput.trim()) return;
    if (perks.includes(newPerkInput.trim())) {
      showToast('This perk already exists', 'info');
      return;
    }
    setPerks([...perks, newPerkInput.trim()]);
    setNewPerkInput('');
  };

  const handleRemovePerk = (index: number) => {
    setPerks(perks.filter((_, i) => i !== index));
  };

  // Save Store Profile
  const handleSaveStoreProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      showToast('Store name cannot be empty', 'error');
      return;
    }
    if (!address.trim()) {
      showToast('Store address is required', 'error');
      return;
    }

    setIsSaving(true);
    const updatedStore: Store = {
      ...store,
      name: name.trim(),
      category: category as any,
      description: description.trim(),
      address: address.trim(),
      city: city.trim() || 'San Francisco',
      lat: Number(lat),
      lng: Number(lng),
      openHours: openHours.trim(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      email: email.trim(),
      website: website.trim(),
      managerName: managerName.trim(),
      socialHandle: socialHandle.trim(),
      pointsRate: Number(pointsRate) || 10,
      perks,
      image: imageUrl.trim() || store.image,
      schedule
    };

    try {
      const result = await saveStoreToDatabase(updatedStore);
      onStoreUpdated(result.store);
      showToast('Store profile & map settings successfully saved and synced to database!', 'success');
    } catch (err) {
      console.error('Error saving store profile:', err);
      showToast('Failed to save store profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Save Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xl shadow-xs">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                {language === 'es' ? 'Gestión de Perfil de Tienda' : 'Store Location & Profile Settings'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{name || store.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            id="merchant-save-store-btn"
            onClick={() => handleSaveStoreProfile()}
            disabled={isSaving}
            className="flex-1 md:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving to Database...' : 'Save & Sync Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('details')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'details'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>{language === 'es' ? '1. Datos Principales' : '1. Store Info & Category'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('location')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'location'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{language === 'es' ? '2. Dirección y Mapa GPS' : '2. Address & Map Location'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('hours')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'hours'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{language === 'es' ? '3. Horarios de Apertura' : '3. Opening Hours Matrix'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'contact'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{language === 'es' ? '4. Teléfonos y Email' : '4. Phones & Contact Email'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('loyalty')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'loyalty'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'es' ? '5. Tasa de Puntos y Beneficios' : '5. Loyalty Rates & Perks'}</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <form onSubmit={handleSaveStoreProfile} className="space-y-6">
        {/* TAB 1: STORE DETAILS & CATEGORY */}
        {activeSubTab === 'details' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {language === 'es' ? 'Información General del Comercio' : 'General Store Information'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'es'
                  ? 'Configura el nombre público de la tienda, categoría comercial e imagen de portada.'
                  : 'Configure public store branding, retail category, and catalog description shown to loyalty members.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Nombre Comercial' : 'Store Business Name'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Roast Artisan Coffee"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Store Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Categoría de Comercio' : 'Store Retail Category'} *
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'URL de Imagen de Portada' : 'Store Cover Image URL'}
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Store Cover"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Store Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Descripción del Establecimiento' : 'Store Overview & Tagline'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your specialty products, specialties, roast profiles, or featured offerings..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Store Manager Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Gerente / Encargado de Sucursal' : 'Store General Manager'}
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Store Social Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Usuario en Redes Sociales' : 'Social Media Handle'}
                </label>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  placeholder="@metro_roast_sf"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADDRESS & MAP LOCATION */}
        {activeSubTab === 'location' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{language === 'es' ? 'Dirección Física y Posición en Mapa' : 'Physical Address & Interactive Map Position'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'es'
                    ? 'Ajusta la dirección de la tienda y ubica las coordenadas GPS para la navegación de los miembros.'
                    : 'Set street address, adjust pin coordinates, or pick preset locations for precise GPS turn-by-turn routing.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocatingUser}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Crosshair className={`w-4 h-4 ${isLocatingUser ? 'animate-spin' : ''}`} />
                <span>{isLocatingUser ? 'Locating...' : 'Use My GPS Location'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Street Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Dirección Completa' : 'Full Street Address'} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 450 Sutter St, San Francisco, CA 94108"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* City / Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Ciudad / Distrito' : 'City / Neighborhood'} *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Preset Quick Coordinates */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Preajustes de Ubicación Urbana' : 'Quick City Presets'}
                </label>
                <select
                  onChange={(e) => {
                    const preset = PRESET_COORDINATES.find((p) => p.name === e.target.value);
                    if (preset) {
                      setLat(preset.lat);
                      setLng(preset.lng);
                      showToast(`Set coordinates to ${preset.name}`, 'info');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="">Select a Neighborhood Preset...</option>
                  {PRESET_COORDINATES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Latitude */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Latitud (GPS)' : 'Latitude Coordinate'} *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Longitude */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Longitud (GPS)' : 'Longitude Coordinate'} *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            {/* Interactive Visual Map Preview Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'es' ? 'Vista Previa del Mapa Interactivo (Haz clic para posicionar el pin)' : 'Interactive Map Location Preview (Click anywhere on map to reposition pin)'}</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  PIN: {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              </div>

              {/* Map Canvas Mock with interactive click positioning */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  
                  // Map bounds centered on San Francisco
                  // Approx center: 37.785, -122.41
                  const normX = (clickX / rect.width) - 0.5; // -0.5 to 0.5
                  const normY = (clickY / rect.height) - 0.5; // -0.5 to 0.5
                  
                  const newLng = parseFloat((-122.408 + normX * 0.05).toFixed(5));
                  const newLat = parseFloat((37.789 - normY * 0.04).toFixed(5));
                  
                  setLat(newLat);
                  setLng(newLng);
                  showToast(`Pin moved to (${newLat}, ${newLng})`, 'info');
                }}
                className="relative h-64 w-full rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 cursor-crosshair group shadow-inner"
              >
                {/* SVG City Street Grid Graphic */}
                <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.4" />
                      <circle cx="20" cy="20" r="1.5" fill="#38bdf8" fillOpacity="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#0f172a" />
                  <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                  {/* Diagonal avenues */}
                  <line x1="0" y1="200" x2="600" y2="40" stroke="#3b82f6" strokeWidth="2.5" strokeOpacity="0.6" />
                  <line x1="100" y1="260" x2="700" y2="100" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.5" />
                  <line x1="0" y1="60" x2="800" y2="60" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.3" />
                  <line x1="0" y1="160" x2="800" y2="160" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.3" />
                </svg>

                {/* Animated Pulsing Store Marker Pin in Center of Map */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-blue-400 opacity-60" />
                    <div className="relative p-3 rounded-full bg-blue-600 text-white shadow-xl border-2 border-white ring-4 ring-blue-500/30">
                      <MapPin className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-2 bg-slate-900/90 text-white font-bold text-xs px-3 py-1 rounded-full border border-slate-700 shadow-lg whitespace-nowrap backdrop-blur-xs flex items-center gap-1.5">
                    <span>{name || store.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                {/* Map Control Badges */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-700">
                  📍 {lat.toFixed(5)}° N, {lng.toFixed(5)}° W
                </div>
                <div className="absolute top-3 right-3 bg-blue-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
                  Click on map to calibrate GPS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPENING HOURS MATRIX */}
        {activeSubTab === 'hours' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>{language === 'es' ? 'Horario de Atención y Apertura' : 'Store Opening Schedule Matrix'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'es'
                    ? 'Define los horarios de apertura y cierre para cada día de la semana.'
                    : 'Set operational open and close hours for each day of the week to inform loyalty members.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMondayToWeekdays}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Mon to Weekdays</span>
                </button>
              </div>
            </div>

            {/* General Open Hours Summary String */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {language === 'es' ? 'Resumen de Horario Público (Texto en Tarjeta)' : 'Public Display Schedule Text'} *
              </label>
              <input
                type="text"
                value={openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                placeholder="e.g. 7:00 AM - 7:00 PM (Daily)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Day-by-Day Table Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Day</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Opening Time</th>
                    <th className="py-3 px-3">Closing Time</th>
                    <th className="py-3 px-3 text-right">Quick Apply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayData = schedule[day] || { isOpen: true, openTime: '08:00', closeTime: '20:00' };
                    return (
                      <tr key={day} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 capitalize">
                          {language === 'es' ? DAY_LABELS[day].es : DAY_LABELS[day].en}
                        </td>
                        <td className="py-3 px-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dayData.isOpen}
                              onChange={(e) => handleScheduleDayChange(day, 'isOpen', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                            <span className="ml-2 text-xs font-semibold text-slate-700">
                              {dayData.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </label>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="time"
                            disabled={!dayData.isOpen}
                            value={dayData.openTime}
                            onChange={(e) => handleScheduleDayChange(day, 'openTime', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="time"
                            disabled={!dayData.isOpen}
                            value={dayData.closeTime}
                            onChange={(e) => handleScheduleDayChange(day, 'closeTime', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newSched = { ...schedule };
                              DAYS_OF_WEEK.forEach((d) => {
                                newSched[d] = { ...dayData };
                              });
                              setSchedule(newSched);
                              showToast(`Applied ${DAY_LABELS[day].en} hours to all 7 days`, 'info');
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Apply to all
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PHONES & CONTACT EMAIL */}
        {activeSubTab === 'contact' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <span>{language === 'es' ? 'Información de Contacto y Comunicación' : 'Phone Numbers & Contact Email'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'es'
                  ? 'Gestiona los números de teléfono para atención al cliente y el correo institucional.'
                  : 'Manage public phone contact lines, POS cashier dispatch, and official merchant notification email.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Teléfono Principal de Atención' : 'Primary Store Phone Number'} *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(415) 555-0192"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Secondary Phone / POS Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Teléfono Secundario / Caja POS' : 'Secondary Line / POS Terminal Phone'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="(415) 555-0199"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Official Store Email */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Correo Electrónico Oficial' : 'Official Merchant Contact & Notification Email'} *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store.manager@omniloyalty.internal"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Used for monthly settlement invoices, audit reports, and member transaction alerts.
                </p>
              </div>

              {/* Official Website */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Sitio Web Oficial' : 'Store Website URL'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://metroroastcoffee.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LOYALTY RATES & PERKS */}
        {activeSubTab === 'loyalty' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>{language === 'es' ? 'Configuración de Programa de Fidelidad' : 'Store Loyalty Earning Rules & Perks'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'es'
                  ? 'Establece la velocidad de acumulación de puntos y los beneficios exclusivos para miembros.'
                  : 'Customize points awarded per dollar spent and in-store perks displayed on your store profile.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Points Earning Rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Tasa de Puntos por Cada Cg 1.00 de Compra' : 'Points Rewarded per Cg 1.00 Spent'} *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={pointsRate}
                    onChange={(e) => setPointsRate(parseInt(e.target.value, 10) || 10)}
                    className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-extrabold text-blue-600 focus:bg-white focus:outline-hidden"
                    required
                  />
                  <span className="text-xs font-bold text-slate-500">
                    points rewarded per dollar
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Example: A purchase of Cg 25.00 earns {25 * pointsRate} loyalty points.
                </p>
              </div>

              {/* In-Store Perks List */}
              <div className="space-y-3 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'es' ? 'Beneficios Exclusivos en Tienda' : 'In-Store Member Perks & Privileges'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPerkInput}
                    onChange={(e) => setNewPerkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPerk();
                      }
                    }}
                    placeholder="e.g. Free Oat Milk Upgrade, VIP Lounge Seating..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddPerk}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Perk</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {perks.map((perk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
                    >
                      <span>{perk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePerk(idx)}
                        className="text-blue-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {perks.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No perks added yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Changes persist immediately to your store record in Firestore cloud database.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving Changes...' : 'Save & Sync Store Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
