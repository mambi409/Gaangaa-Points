import { Store, StoreWeeklySchedule, DaySchedule } from '../types';

export interface StoreOpenStatus {
  isOpen: boolean;
  statusLabel: string; // "Open Now" | "Closed" | "Closing Soon" | "Abierto Ahora" | "Cerrado" | "Cierra Pronto"
  hoursDisplay: string; // e.g. "7:00 AM - 7:00 PM"
  closingSoon: boolean;
  openingSoon: boolean;
  todaySchedule?: DaySchedule;
  detailMessage: string; // e.g. "Closes at 7:00 PM" or "Opens tomorrow at 8:00 AM"
}

// Convert "7:00 AM", "19:00", "7:30 PM", "08:00" to minutes from midnight (0 - 1439)
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();

  // Check 12-hour format: "7:00 AM", "7:30PM", "11:00 PM", "12:00 PM"
  const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Check 24-hour format: "08:00", "19:30", "7:00"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

// Format minutes from midnight into 12-hour string (e.g. 1140 -> "7:00 PM")
export function formatMinutesTo12h(mins: number): string {
  mins = ((mins % 1440) + 1440) % 1440;
  const hours24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours12}:${minStr} ${period}`;
}

const DAY_KEYS: (keyof StoreWeeklySchedule)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

/**
 * Calculates whether a store is currently Open or Closed based on real-time clock
 * and provides friendly formatted labels in English or Spanish.
 */
export function getStoreOpenStatus(
  store: Store,
  currentDate: Date = new Date(),
  lang: 'en' | 'es' = 'en'
): StoreOpenStatus {
  const dayIndex = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentDayKey = DAY_KEYS[dayIndex];
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  let todaySchedule: DaySchedule | undefined = undefined;

  if (store.schedule && store.schedule[currentDayKey]) {
    todaySchedule = store.schedule[currentDayKey];
  }

  // 1. If today's schedule explicitly marks closed:
  if (todaySchedule && !todaySchedule.isOpen) {
    return {
      isOpen: false,
      statusLabel: lang === 'es' ? 'Cerrado' : 'Closed',
      hoursDisplay: lang === 'es' ? 'Cerrado hoy' : 'Closed Today',
      closingSoon: false,
      openingSoon: false,
      todaySchedule,
      detailMessage: lang === 'es' ? 'Cerrado hoy' : 'Closed today'
    };
  }

  // 2. Determine openMinutes and closeMinutes
  let openMins: number | null = null;
  let closeMins: number | null = null;
  let hoursDisplay = store.openHours || '8:00 AM - 8:00 PM';

  if (todaySchedule && todaySchedule.isOpen && todaySchedule.openTime && todaySchedule.closeTime) {
    openMins = parseTimeToMinutes(todaySchedule.openTime);
    closeMins = parseTimeToMinutes(todaySchedule.closeTime);
    hoursDisplay = `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
  } else if (store.openHours) {
    // Parse "7:00 AM - 7:00 PM"
    const parts = store.openHours.split(/[-–—to]/i);
    if (parts.length >= 2) {
      openMins = parseTimeToMinutes(parts[0].trim());
      closeMins = parseTimeToMinutes(parts[1].trim());
    }
  }

  // Fallback defaults if parsing didn't match (8:00 AM - 8:00 PM)
  if (openMins === null || closeMins === null) {
    openMins = 8 * 60; // 8:00 AM
    closeMins = 20 * 60; // 8:00 PM
  }

  // Handle overnight hours (e.g. 10:00 PM to 4:00 AM)
  let isCurrentlyOpen = false;
  if (closeMins > openMins) {
    isCurrentlyOpen = currentMinutes >= openMins && currentMinutes < closeMins;
  } else {
    // Crosses midnight
    isCurrentlyOpen = currentMinutes >= openMins || currentMinutes < closeMins;
  }

  const closingSoon = isCurrentlyOpen && closeMins - currentMinutes > 0 && closeMins - currentMinutes <= 45;
  const openingSoon = !isCurrentlyOpen && openMins - currentMinutes > 0 && openMins - currentMinutes <= 60;

  let statusLabel = '';
  let detailMessage = '';

  if (isCurrentlyOpen) {
    if (closingSoon) {
      statusLabel = lang === 'es' ? 'Cierra Pronto' : 'Closing Soon';
      detailMessage = lang === 'es'
        ? `Cierra a las ${formatMinutesTo12h(closeMins)}`
        : `Closes at ${formatMinutesTo12h(closeMins)}`;
    } else {
      statusLabel = lang === 'es' ? 'Abierto Ahora' : 'Open Now';
      detailMessage = lang === 'es'
        ? `Abierto hasta las ${formatMinutesTo12h(closeMins)}`
        : `Open until ${formatMinutesTo12h(closeMins)}`;
    }
  } else {
    statusLabel = lang === 'es' ? 'Cerrado' : 'Closed';
    if (openingSoon) {
      detailMessage = lang === 'es'
        ? `Abre pronto a las ${formatMinutesTo12h(openMins)}`
        : `Opens soon at ${formatMinutesTo12h(openMins)}`;
    } else if (currentMinutes < openMins) {
      detailMessage = lang === 'es'
        ? `Abre hoy a las ${formatMinutesTo12h(openMins)}`
        : `Opens today at ${formatMinutesTo12h(openMins)}`;
    } else {
      detailMessage = lang === 'es'
        ? `Abre mañana a las ${formatMinutesTo12h(openMins)}`
        : `Opens tomorrow at ${formatMinutesTo12h(openMins)}`;
    }
  }

  return {
    isOpen: isCurrentlyOpen,
    statusLabel,
    hoursDisplay,
    closingSoon,
    openingSoon,
    todaySchedule,
    detailMessage
  };
}
