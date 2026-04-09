import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import {
    Navigation, Loader2, LocateFixed, ChevronDown, ChevronUp,
    AlertTriangle, Thermometer, Droplets, Wind as WindIcon,
    Activity, RefreshCw, Filter, BedDouble, Timer,
    Search, SlidersHorizontal, X, LayoutGrid, CheckCircle2,
    Maximize2, Minimize2, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HospitalCard from './HospitalCard';
import {
    getRankedHospitals,
    getISTDate,
    type HospitalLive,
    type WeatherData,
    type SeasonalTrend,
} from '../src/utils/emergencyEngine';

// ─── Routing Layer Component ────────────────────────────────────────────────
function RoutingLayer({ routeCoords }: { routeCoords: [number, number][] | null }) {
    const map = useMap();
    useEffect(() => {
        if (routeCoords && routeCoords.length > 0) {
            const bounds = L.latLngBounds(routeCoords);
            // Wait for map to settle before panning
            setTimeout(() => {
                map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 });
            }, 100);
        }
    }, [routeCoords, map]);

    if (!routeCoords || routeCoords.length === 0) return null;

    return (
        <Polyline 
            positions={routeCoords} 
            pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} 
        />
    );
}

// Fix Leaflet default icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom Icons ────────────────────────────────────────────────────────────

const userIcon = new L.DivIcon({
    className: 'custom-user-marker',
    html: `<div style="
        width: 24px; height: 24px; border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border: 3px solid white; box-shadow: 0 2px 8px rgba(59,130,246,0.5);
        animation: pulse-ring 2s infinite;
    "></div>
    <style>
        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
            70% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
            100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
    </style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

function createHospitalIcon(surgeLevel: 'low' | 'medium' | 'high' | 'critical', isRecommended: boolean) {
    const colors: Record<string, string> = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#f97316',
        critical: '#ef4444',
    };
    const color = colors[surgeLevel] || colors.low;
    const ring = isRecommended ? 'box-shadow: 0 0 0 3px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);' : `box-shadow: 0 2px 8px ${color}66;`;

    return new L.DivIcon({
        className: 'custom-hospital-marker',
        html: `<div style="
            width: ${isRecommended ? '38px' : '32px'}; height: ${isRecommended ? '38px' : '32px'}; border-radius: 10px;
            background: ${color}; display: flex; align-items: center; justify-content: center;
            border: 2px solid white; ${ring}
            font-size: ${isRecommended ? '18px' : '16px'}; color: white;
            transition: transform 0.2s;
        ">🏥</div>`,
        iconSize: isRecommended ? [38, 38] : [32, 32],
        iconAnchor: isRecommended ? [19, 38] : [16, 32],
    });
}

// ─── Map Controller ──────────────────────────────────────────────────────────

function FlyToCenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom || 11, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
}

// ─── Region Config ───────────────────────────────────────────────────────────

const REGIONS = [
    { id: 'all', label: 'All Regions' },
    { id: 'srivilliputhur', label: 'Srivilliputhur' },
    { id: 'virudhunagar', label: 'Virudhunagar' },
    { id: 'madurai', label: 'Madurai' },
    { id: 'krishnankoil', label: 'Krishnankoil' },
];

const DEFAULT_CENTER: [number, number] = [9.5120, 77.6340]; // Srivilliputhur

// ─── Component ───────────────────────────────────────────────────────────────

const HospitalMap: React.FC = () => {
    const { t } = useTranslation();
    const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [regionFilter, setRegionFilter] = useState('all');
    const [hospitals, setHospitals] = useState<HospitalLive[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [trend, setTrend] = useState<SeasonalTrend | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(getISTDate());
    const [refreshing, setRefreshing] = useState(false);

    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'government' | 'private'>('all');
    const [specialtyFilter, setSpecialtyFilter] = useState('all');
    const [emergencyOnly, setEmergencyOnly] = useState(false);
    const [ambulanceOnly, setAmbulanceOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    // UI Expand States
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'full-list'>('split');
    const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

    const handleGetRoute = async (hospitalLat: number, hospitalLng: number) => {
        try {
            const startLat = userLocation[0];
            const startLng = userLocation[1];
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${hospitalLng},${hospitalLat}?overview=full&geometries=geojson`);
            const data = await res.json();
            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
                setRouteCoords(coords);
                setIsMapExpanded(true); // Auto expand map on route
                setViewMode('split'); // Ensure we are not in full list mode
            }
        } catch(e) {
            console.error('Failed to fetch route:', e);
            // Fallback
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}&travelmode=driving`, '_blank');
        }
    };

    // Fetch data
    const loadData = useCallback(async (lat: number, lng: number, region: string) => {
        setRefreshing(true);
        try {
            const result = await getRankedHospitals(lat, lng, region);
            setHospitals(result.hospitals);
            setWeather(result.weather);
            setTrend(result.trend);
            setLastRefresh(getISTDate());
        } catch (err) {
            console.error('Failed to load hospital data:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, []);

    // Get user location + initial load
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(loc);
                    loadData(loc[0], loc[1], regionFilter);
                },
                () => {
                    loadData(DEFAULT_CENTER[0], DEFAULT_CENTER[1], regionFilter);
                },
                { timeout: 5000 }
            );
        } else {
            loadData(DEFAULT_CENTER[0], DEFAULT_CENTER[1], regionFilter);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-refresh every 5 minutes (simulated real-time)
    useEffect(() => {
        const interval = setInterval(() => {
            loadData(userLocation[0], userLocation[1], regionFilter);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userLocation, regionFilter, loadData]);

    // Reload on region change
    useEffect(() => {
        if (!loading) {
            loadData(userLocation[0], userLocation[1], regionFilter);
        }
    }, [regionFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRefresh = () => {
        loadData(userLocation[0], userLocation[1], regionFilter);
    };

    const uniqueSpecialties = useMemo(() => {
        const specs = new Set<string>();
        hospitals.forEach(h => h.specialties.forEach(s => specs.add(s)));
        return ['all', ...Array.from(specs).sort()];
    }, [hospitals]);

    const filteredHospitals = useMemo(() => {
        return hospitals.filter(hospital => {
            const matchesRegion = regionFilter === 'all' || hospital.city === regionFilter;
            const matchesSearch = searchTerm === '' || 
                                 hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 hospital.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                 hospital.city.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'all' || hospital.type.toLowerCase() === typeFilter;
            const matchesSpecialty = specialtyFilter === 'all' || hospital.specialties.includes(specialtyFilter);
            const matchesEmergency = !emergencyOnly || hospital.emergency24x7;
            const matchesAmbulance = !ambulanceOnly || hospital.ambulanceAvailable;
            
            return matchesRegion && matchesSearch && matchesType && matchesSpecialty && matchesEmergency && matchesAmbulance;
        });
    }, [hospitals, regionFilter, searchTerm, typeFilter, specialtyFilter, emergencyOnly, ambulanceOnly]);

    const displayedHospitals = useMemo(() => {
        return showAll ? filteredHospitals : filteredHospitals.slice(0, 5);
    }, [filteredHospitals, showAll]);

    const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

    // IST timestamp
    const timeStr = lastRefresh.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-brand-500" />
                    <span className="text-sm font-medium">{t('emergencyRoute.calculatingRoute')}</span>
                    <span className="text-xs text-slate-300">Fetching real-time weather & hospital data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-4">
            {/* ─── Real-time Status Bar ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Weather Card */}
                {weather && (
                    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('emergencyRoute.liveWeather')}</span>
                            <span className="text-[9px] text-slate-400 font-mono">IST {timeStr}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-black text-blue-700">{weather.temperature}°C</div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700">{weather.condition}</p>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                    <span className="flex items-center gap-0.5"><Droplets size={9} /> {weather.humidity}%</span>
                                    <span className="flex items-center gap-0.5"><WindIcon size={9} /> {weather.windSpeed} km/h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disease Trend Card */}
                {trend && (
                    <div className={`p-4 rounded-2xl border shadow-sm ${
                        trend.riskLevel === 'high' || trend.riskLevel === 'critical'
                            ? 'bg-gradient-to-br from-red-50 to-white border-red-100'
                            : trend.riskLevel === 'moderate'
                            ? 'bg-gradient-to-br from-amber-50 to-white border-amber-100'
                            : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">{t('emergencyRoute.seasonalTrend')}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                trend.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                                trend.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>{trend.riskLevel}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mb-1">{trend.season}</p>
                        <div className="flex flex-wrap gap-1">
                            {trend.diseases.slice(0, 3).map((d) => (
                                <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">{d}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Capacity Summary */}
                <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('emergencyRoute.capacitySummary')}</span>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <RefreshCw size={12} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <BedDouble size={14} className="text-brand-500" />
                            <div>
                                <span className="text-lg font-black text-slate-800">
                                    {hospitals.reduce((sum, h) => sum + h.bedsAvailable, 0)}
                                </span>
                                <p className="text-[9px] text-slate-400 leading-none">{t('emergencyRoute.bedsAvailable')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" />
                            <div>
                                <span className="text-lg font-black text-slate-800">
                                    {hospitals.reduce((sum, h) => sum + h.ventilatorsAvailable, 0)}
                                </span>
                                <p className="text-[9px] text-slate-400 leading-none">{t('emergencyRoute.ventAvailable')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Seasonal Advisory ────────────────────────────────────────── */}
            {trend && (trend.riskLevel === 'high' || trend.riskLevel === 'critical') && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium animate-fade-in">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>{trend.advisory}</p>
                </div>
            )}

            {/* ─── Region Filters ───────────────────────────────────────────── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <Filter size={14} className="text-slate-400 flex-shrink-0" />
                {REGIONS.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setRegionFilter(r.id)}
                        className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            regionFilter === r.id
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* ─── Bento: Map + Hospital List ───────────────────────────────── */}
            <div className={`grid gap-6 transition-all duration-500 ${viewMode === 'full-list' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'}`}>

                {/* LEFT: Map (3/5 width) */}
                <div 
                    className={`${viewMode === 'full-list' ? 'hidden' : isMapExpanded ? 'fixed inset-0 z-[9990] !m-0 rounded-none' : 'lg:col-span-3 rounded-2xl'} overflow-hidden border border-slate-200 shadow-lg bg-white relative transition-all duration-300`} 
                    style={isMapExpanded ? {} : { minHeight: '520px' }}
                >
                    {/* Expand/Collapse Button */}
                    <button
                        onClick={() => setIsMapExpanded(!isMapExpanded)}
                        className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl p-2 shadow-lg border border-slate-100 hover:bg-white cursor-pointer transition-colors"
                        title={isMapExpanded ? "Collapse Map" : "Expand Map"}
                    >
                        {isMapExpanded ? <Minimize2 size={16} className="text-slate-700" /> : <Maximize2 size={16} className="text-slate-700" />}
                    </button>

                    {/* Map Header Overlay */}
                    <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl px-4 py-2 shadow-lg border border-slate-100 flex items-center gap-2">
                        <LocateFixed size={16} className="text-brand-600" />
                        <span className="text-xs font-bold text-slate-700">{t('emergencyRoute.hospitalMap')}</span>
                        <span className="text-[9px] text-slate-400 ml-1">({hospitals.length} hospitals)</span>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-500 mb-1.5">{t('emergencyRoute.legend')}</p>
                        <div className="flex gap-3 text-[9px]">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Low</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Medium</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500" /> High</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Critical</span>
                        </div>
                    </div>

                    <MapContainer
                        center={userLocation}
                        zoom={11}
                        style={{ height: '100%', width: '100%', minHeight: '520px' }}
                        zoomControl={false}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyToCenter center={userLocation} zoom={regionFilter === 'all' ? 10 : 13} />
                        <RoutingLayer routeCoords={routeCoords} />

                        {/* User Marker */}
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>
                                <div className="text-sm font-bold text-blue-600">📍 Your Location</div>
                            </Popup>
                        </Marker>

                        {/* Hospital Markers */}
                        {hospitals.map((hospital, idx) => (
                            <Marker
                                key={hospital.id}
                                position={[hospital.lat, hospital.lng]}
                                icon={createHospitalIcon(hospital.surgeLevel, idx < 5)}
                                eventHandlers={{
                                    click: () => setSelectedHospitalId(hospital.id),
                                }}
                            >
                                <Popup>
                                    <div className="text-sm min-w-[200px]">
                                        <strong className="text-slate-800">{hospital.name}</strong>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {hospital.distanceKm} km · ~{hospital.travelTimeMin} min
                                        </div>
                                        <div className="flex gap-3 mt-1.5 text-xs">
                                            <span className="text-emerald-600 font-bold">🛏 {hospital.bedsAvailable} beds</span>
                                            <span className="text-blue-600 font-bold">💨 {hospital.ventilatorsAvailable} vents</span>
                                        </div>
                                        <button
                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`, '_blank')}
                                            className="mt-2 w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                                        >
                                            Get Directions →
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* RIGHT: Hospital List (2/5 width or full width) */}
                <div className={`${viewMode === 'full-list' ? 'lg:col-span-5' : 'lg:col-span-2'} flex flex-col gap-4`}>
                    {/* List Header & Search */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Navigation size={14} className="text-brand-600" />
                                {searchTerm || typeFilter !== 'all' || specialtyFilter !== 'all' || emergencyOnly || ambulanceOnly 
                                    ? 'Filter Results' 
                                    : (viewMode === 'full-list' ? t('emergencyRoute.allHospitals') : t('emergencyRoute.topRecommended'))}
                            </h3>
                            <div className="flex items-center gap-3">
                                {viewMode === 'full-list' && (
                                    <button 
                                        onClick={() => setViewMode('split')}
                                        className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Back to Map
                                    </button>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                    <Timer size={10} />
                                    IST {timeStr}
                                </span>
                            </div>
                        </div>

                        {/* Search Bar Container */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center shadow-inner pointer-events-none">
                                <Search size={16} className={`${searchTerm ? 'text-brand-500' : 'text-slate-400'} transition-colors`} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by hospital, specialty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm outline-none placeholder:text-slate-400"
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                                        showFilters || typeFilter !== 'all' || specialtyFilter !== 'all' || emergencyOnly || ambulanceOnly
                                            ? 'bg-brand-50 text-brand-600 border border-brand-100'
                                            : 'text-slate-400 hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <SlidersHorizontal size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Animated Filter Pane */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 space-y-4 shadow-inner">
                                        {/* Type Selector */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution Type</p>
                                            <div className="flex gap-2">
                                                {(['all', 'government', 'private'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setTypeFilter(type)}
                                                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                                                            typeFilter === type
                                                                ? 'bg-white border-brand-200 text-brand-700 shadow-sm'
                                                                : 'text-slate-500 border-transparent hover:bg-white/50'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Specialty Dropdown */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialty</p>
                                            <div className="relative">
                                                <select
                                                    value={specialtyFilter}
                                                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                                                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/10 focus:border-brand-300 transition-all outline-none appearance-none cursor-pointer"
                                                >
                                                    {uniqueSpecialties.map(s => (
                                                        <option key={s} value={s}>{s === 'all' ? 'All Specialties' : s}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Facility Toggles */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setEmergencyOnly(!emergencyOnly)}
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                                                    emergencyOnly 
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' 
                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold">24/7 ER</span>
                                                {emergencyOnly ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-200" />}
                                            </button>
                                            <button
                                                onClick={() => setAmbulanceOnly(!ambulanceOnly)}
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                                                    ambulanceOnly 
                                                        ? 'bg-blue-50 border-blue-100 text-blue-700 shadow-sm' 
                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold">Ambulance</span>
                                                {ambulanceOnly ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-200" />}
                                            </button>
                                        </div>

                                        {/* Reset Button */}
                                        {(searchTerm || typeFilter !== 'all' || specialtyFilter !== 'all' || emergencyOnly || ambulanceOnly) && (
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setTypeFilter('all');
                                                    setSpecialtyFilter('all');
                                                    setEmergencyOnly(false);
                                                    setAmbulanceOnly(false);
                                                }}
                                                className="w-full py-2 text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-widest cursor-pointer"
                                            >
                                                Clear All Filters
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Hospital Cards */}
                    <div className={`${
                        viewMode === 'full-list' 
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[800px]' 
                            : 'flex flex-col gap-3 max-h-[560px]'
                        } overflow-y-auto custom-scrollbar pr-1 pt-2`}
                    >
                        {displayedHospitals.length > 0 ? (
                            displayedHospitals.map((hospital, index) => (
                                <HospitalCard
                                    key={hospital.id}
                                    name={hospital.name}
                                    address={hospital.address}
                                    phone={hospital.phone}
                                    distance={`${hospital.distanceKm} km`}
                                    travelTime={`${hospital.travelTimeMin} min`}
                                    type={hospital.type}
                                    totalBeds={hospital.totalBeds}
                                    bedsAvailable={hospital.bedsAvailable}
                                    totalVentilators={hospital.totalVentilators}
                                    ventilatorsAvailable={hospital.ventilatorsAvailable}
                                    bedOccupancyPct={hospital.bedOccupancyPct}
                                    emergency24x7={hospital.emergency24x7}
                                    ambulanceAvailable={hospital.ambulanceAvailable}
                                    specialties={hospital.specialties}
                                    weatherCondition={hospital.weatherAtHospital.condition}
                                    weatherSeverity={hospital.weatherAtHospital.severity}
                                    surgeLevel={hospital.surgeLevel}
                                    matchesDiseaseTrend={hospital.matchesDiseaseTrend}
                                    isRecommended={index === 0 && !searchTerm && typeFilter === 'all'}
                                    rank={index + 1}
                                    lat={hospital.lat}
                                    lng={hospital.lng}
                                    onClick={() => setSelectedHospitalId(hospital.id)}
                                    onGetDirections={() => handleGetRoute(hospital.lat, hospital.lng)}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center animate-fade-in">
                                <AlertTriangle size={32} className="text-slate-300 mb-3" />
                                <h4 className="text-sm font-bold text-slate-600 mb-1">No Hospitals Found</h4>
                                <p className="text-xs text-slate-400 max-w-[200px]">
                                    We couldn't find any hospitals matching your current search or filter criteria.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setTypeFilter('all');
                                        setSpecialtyFilter('all');
                                        setEmergencyOnly(false);
                                        setAmbulanceOnly(false);
                                    }}
                                    className="mt-4 text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* View All / Show Less Button */}
                    {viewMode === 'split' && (
                        <button
                            onClick={() => { setViewMode('full-list'); setShowAll(true); }}
                            className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-all flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-brand-50"
                        >
                            <LayoutGrid size={16} />
                            {t('emergencyRoute.viewAll')} ({hospitals.length} {t('emergencyRoute.hospitals')})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HospitalMap;
