/**
 * Emergency Route Recommendation Engine
 * 
 * Scoring factors:
 *   1. Distance from user (Haversine)
 *   2. Real-time weather via Open-Meteo (free, no key)
 *   3. Seasonal disease trends (IST-based)
 *   4. Simulated bed & ventilator vacancy (IST time-aware)
 *   5. Hospital capabilities (emergency, ambulance, specialties)
 */

import hospitalsData from '../data/hospitals.json';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HospitalRaw {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  type: 'government' | 'private';
  totalBeds: number;
  totalVentilators: number;
  specialties: string[];
  emergency24x7: boolean;
  region: string;
  ambulanceAvailable: boolean;
}

export interface WeatherData {
  temperature: number;       // °C
  weatherCode: number;       // WMO code
  windSpeed: number;         // km/h
  humidity: number;          // %
  condition: string;         // human-readable
  severity: number;          // 0-100 score
  isRaining: boolean;
  isStorm: boolean;
}

export interface SeasonalTrend {
  season: string;
  diseases: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  demandMultiplier: number;  // 1.0 = normal, 1.5 = high demand
  advisory: string;
}

export interface HospitalLive extends HospitalRaw {
  distanceKm: number;
  travelTimeMin: number;
  bedsAvailable: number;
  ventilatorsAvailable: number;
  bedOccupancyPct: number;
  ventilatorOccupancyPct: number;
  surgeScore: number;         // lower = better recommendation
  surgeLevel: 'low' | 'medium' | 'high' | 'critical';
  weatherAtHospital: WeatherData;
  matchesDiseaseTrend: boolean;
}

// ─── IST Time Helper ─────────────────────────────────────────────────────────

export function getISTDate(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 in ms
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + istOffset);
}

export function getISTHour(): number {
  return getISTDate().getHours();
}

export function getISTMonth(): number {
  return getISTDate().getMonth(); // 0-11
}

// ─── Haversine Distance ──────────────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravelMin(distanceKm: number, weatherSeverity: number): number {
  // Average speed ~40 km/h in Tamil Nadu semi-urban, reduced by weather
  const baseSpeed = 40;
  const weatherPenalty = 1 + (weatherSeverity / 200); // up to 50% slower in storm
  const time = (distanceKm / baseSpeed) * 60 * weatherPenalty;
  return Math.round(Math.max(time, 2)); // minimum 2 minutes
}

// ─── Weather (Open-Meteo — free, no API key) ─────────────────────────────────

const WMO_CONDITIONS: Record<number, { condition: string; severity: number; rain: boolean; storm: boolean }> = {
  0: { condition: 'Clear Sky', severity: 0, rain: false, storm: false },
  1: { condition: 'Mainly Clear', severity: 5, rain: false, storm: false },
  2: { condition: 'Partly Cloudy', severity: 10, rain: false, storm: false },
  3: { condition: 'Overcast', severity: 15, rain: false, storm: false },
  45: { condition: 'Foggy', severity: 30, rain: false, storm: false },
  48: { condition: 'Rime Fog', severity: 35, rain: false, storm: false },
  51: { condition: 'Light Drizzle', severity: 20, rain: true, storm: false },
  53: { condition: 'Moderate Drizzle', severity: 30, rain: true, storm: false },
  55: { condition: 'Dense Drizzle', severity: 40, rain: true, storm: false },
  61: { condition: 'Light Rain', severity: 35, rain: true, storm: false },
  63: { condition: 'Moderate Rain', severity: 50, rain: true, storm: false },
  65: { condition: 'Heavy Rain', severity: 70, rain: true, storm: false },
  71: { condition: 'Light Snow', severity: 40, rain: false, storm: false },
  73: { condition: 'Moderate Snow', severity: 55, rain: false, storm: false },
  75: { condition: 'Heavy Snow', severity: 75, rain: false, storm: false },
  80: { condition: 'Rain Showers', severity: 45, rain: true, storm: false },
  81: { condition: 'Moderate Showers', severity: 55, rain: true, storm: false },
  82: { condition: 'Violent Showers', severity: 80, rain: true, storm: true },
  95: { condition: 'Thunderstorm', severity: 85, rain: true, storm: true },
  96: { condition: 'Thunderstorm + Hail', severity: 95, rain: true, storm: true },
  99: { condition: 'Severe Thunderstorm', severity: 100, rain: true, storm: true },
};

function parseWMOCode(code: number): { condition: string; severity: number; rain: boolean; storm: boolean } {
  return WMO_CONDITIONS[code] || { condition: 'Unknown', severity: 20, rain: false, storm: false };
}

let weatherCache: { data: WeatherData; timestamp: number } | null = null;
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  // Return cached if fresh
  if (weatherCache && Date.now() - weatherCache.timestamp < WEATHER_CACHE_TTL) {
    return weatherCache.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Kolkata`;
    const res = await fetch(url);
    const json = await res.json();
    const current = json.current;
    const wmo = parseWMOCode(current.weather_code);

    const data: WeatherData = {
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
      condition: wmo.condition,
      severity: wmo.severity,
      isRaining: wmo.rain,
      isStorm: wmo.storm,
    };

    weatherCache = { data, timestamp: Date.now() };
    return data;
  } catch {
    // Fallback: simulate based on IST season
    const month = getISTMonth();
    const isMonsoon = month >= 5 && month <= 10;
    return {
      temperature: isMonsoon ? 28 : 34,
      weatherCode: isMonsoon ? 63 : 1,
      windSpeed: isMonsoon ? 20 : 8,
      humidity: isMonsoon ? 85 : 55,
      condition: isMonsoon ? 'Moderate Rain' : 'Mainly Clear',
      severity: isMonsoon ? 50 : 5,
      isRaining: isMonsoon,
      isStorm: false,
    };
  }
}

// ─── Seasonal Disease Trends (IST-based) ─────────────────────────────────────

export function getSeasonalTrend(): SeasonalTrend {
  const month = getISTMonth(); // 0-11
  const hour = getISTHour();

  // Tamil Nadu seasonal disease patterns
  if (month >= 9 && month <= 11) {
    // Oct-Dec: Northeast monsoon → Dengue, Malaria, Leptospirosis
    return {
      season: 'Northeast Monsoon',
      diseases: ['Dengue', 'Malaria', 'Leptospirosis', 'Waterborne diseases'],
      riskLevel: 'high',
      demandMultiplier: 1.6,
      advisory: 'Monsoon season: High risk of vector-borne diseases. Hospitals may have increased OPD loads.',
    };
  }
  if (month >= 5 && month <= 8) {
    // Jun-Sep: Southwest monsoon influence
    return {
      season: 'Southwest Monsoon',
      diseases: ['Respiratory infections', 'Fungal infections', 'Dengue'],
      riskLevel: 'moderate',
      demandMultiplier: 1.3,
      advisory: 'Monsoon period: Moderate risk of respiratory and waterborne diseases.',
    };
  }
  if (month >= 2 && month <= 4) {
    // Mar-May: Peak summer
    return {
      season: 'Summer',
      diseases: ['Heatstroke', 'Dehydration', 'Gastroenteritis', 'Chickenpox'],
      riskLevel: 'moderate',
      demandMultiplier: 1.2,
      advisory: 'Summer heat: Stay hydrated. Increased cases of heatstroke and stomach infections.',
    };
  }
  // Dec-Feb: Winter (mild in TN)
  return {
    season: 'Winter',
    diseases: ['Cold', 'Flu', 'Respiratory issues', 'Joint pain flare-ups'],
    riskLevel: 'low',
    demandMultiplier: 1.0,
    advisory: 'Mild season in Tamil Nadu. Regular hospital capacity expected.',
  };
}

// ─── IST-Based Bed & Ventilator Simulation ───────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function simulateVacancy(
  hospitalId: string,
  totalBeds: number,
  totalVentilators: number,
  type: string,
  emergency24x7: boolean
): { bedsAvailable: number; ventilatorsAvailable: number } {
  const ist = getISTDate();
  const hour = ist.getHours();
  const dayOfWeek = ist.getDay(); // 0=Sun
  const month = ist.getMonth();
  const minuteBlock = Math.floor(ist.getMinutes() / 15); // changes every 15 min

  // Deterministic seed based on hospital + time block
  const seed = parseInt(hospitalId.replace('h', ''), 10) * 1000 + hour * 100 + minuteBlock;

  // Base occupancy: Government hospitals are busier
  let baseOccupancy = type === 'government' ? 0.78 : 0.60;

  // Time-of-day factor (IST)
  if (hour >= 8 && hour <= 12) baseOccupancy += 0.10;  // Morning OPD rush
  if (hour >= 17 && hour <= 20) baseOccupancy += 0.08; // Evening rush
  if (hour >= 0 && hour <= 5) baseOccupancy -= 0.12;   // Night: lower intake

  // Day-of-week: Weekdays busier
  if (dayOfWeek >= 1 && dayOfWeek <= 5) baseOccupancy += 0.05;
  if (dayOfWeek === 0) baseOccupancy -= 0.08; // Sunday: lower

  // Seasonal demand
  const seasonal = getSeasonalTrend();
  baseOccupancy *= seasonal.demandMultiplier;

  // Emergency hospitals tend to have higher occupancy outside hours
  if (!emergency24x7 && (hour < 8 || hour > 20)) {
    baseOccupancy -= 0.15;
  }

  // Add randomness (±10%)
  const noise = (seededRandom(seed) - 0.5) * 0.20;
  const finalOccupancy = Math.max(0.15, Math.min(0.98, baseOccupancy + noise));

  const bedsAvailable = Math.max(0, Math.round(totalBeds * (1 - finalOccupancy)));

  // Ventilators: higher occupancy generally
  const ventNoise = (seededRandom(seed + 999) - 0.5) * 0.15;
  const ventOccupancy = Math.max(0.20, Math.min(0.95, finalOccupancy + 0.10 + ventNoise));
  const ventilatorsAvailable = Math.max(0, Math.round(totalVentilators * (1 - ventOccupancy)));

  return { bedsAvailable, ventilatorsAvailable };
}

// ─── Surge Score Calculator ──────────────────────────────────────────────────

function calculateSurgeScore(
  distanceKm: number,
  weatherSeverity: number,
  bedOccupancyPct: number,
  ventilatorOccupancyPct: number,
  emergency24x7: boolean,
  matchesDiseaseTrend: boolean,
  ambulanceAvailable: boolean
): number {
  // Lower score = better recommendation
  const distanceScore = distanceKm * 3.0;                        // proximity matters most
  const weatherScore = weatherSeverity * 0.3;                    // weather impact on travel
  const bedScore = bedOccupancyPct * 0.8;                        // bed availability
  const ventScore = ventilatorOccupancyPct * 0.5;                // ventilator availability
  const emergencyBonus = emergency24x7 ? -15 : 10;              // 24x7 hospitals preferred
  const trendBonus = matchesDiseaseTrend ? -10 : 0;             // specialty match bonus
  const ambulanceBonus = ambulanceAvailable ? -5 : 5;           // ambulance availability

  return Math.max(0,
    distanceScore + weatherScore + bedScore + ventScore +
    emergencyBonus + trendBonus + ambulanceBonus
  );
}

function getSurgeLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 85) return 'high';
  return 'critical';
}

// ─── Main Engine: Get Ranked Hospitals ───────────────────────────────────────

export async function getRankedHospitals(
  userLat: number,
  userLng: number,
  regionFilter?: string
): Promise<{ hospitals: HospitalLive[]; weather: WeatherData; trend: SeasonalTrend }> {
  // 1. Fetch real-time weather
  const weather = await fetchWeather(userLat, userLng);

  // 2. Get seasonal disease trend
  const trend = getSeasonalTrend();

  // 3. Process each hospital
  let hospitals: HospitalLive[] = (hospitalsData as HospitalRaw[])
    .filter((h) => !regionFilter || regionFilter === 'all' || h.region === regionFilter)
    .map((h) => {
      const distanceKm = haversineKm(userLat, userLng, h.lat, h.lng);
      const { bedsAvailable, ventilatorsAvailable } = simulateVacancy(
        h.id, h.totalBeds, h.totalVentilators, h.type, h.emergency24x7
      );

      const bedOccupancyPct = ((h.totalBeds - bedsAvailable) / h.totalBeds) * 100;
      const ventilatorOccupancyPct = h.totalVentilators > 0
        ? ((h.totalVentilators - ventilatorsAvailable) / h.totalVentilators) * 100
        : 0;

      // Check if hospital specialties match current disease trend
      const matchesDiseaseTrend = trend.diseases.some((disease) =>
        h.specialties.some((spec) =>
          spec.toLowerCase().includes(disease.toLowerCase().split(' ')[0]) ||
          disease.toLowerCase().includes(spec.toLowerCase().split(' ')[0])
        )
      ) || h.specialties.includes('General Medicine') || h.specialties.includes('Emergency');

      const travelTimeMin = estimateTravelMin(distanceKm, weather.severity);

      const surgeScore = calculateSurgeScore(
        distanceKm,
        weather.severity,
        bedOccupancyPct,
        ventilatorOccupancyPct,
        h.emergency24x7,
        matchesDiseaseTrend,
        h.ambulanceAvailable
      );

      return {
        ...h,
        distanceKm: Math.round(distanceKm * 10) / 10,
        travelTimeMin,
        bedsAvailable,
        ventilatorsAvailable,
        bedOccupancyPct: Math.round(bedOccupancyPct),
        ventilatorOccupancyPct: Math.round(ventilatorOccupancyPct),
        surgeScore: Math.round(surgeScore * 10) / 10,
        surgeLevel: getSurgeLevel(surgeScore),
        weatherAtHospital: weather,
        matchesDiseaseTrend,
      };
    });

  // 4. Sort by surge score (lower = better)
  hospitals.sort((a, b) => a.surgeScore - b.surgeScore);

  return { hospitals, weather, trend };
}
