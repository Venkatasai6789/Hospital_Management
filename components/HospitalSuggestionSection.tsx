import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    Activity,
    Clock,
    Navigation,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    BedDouble,
    Wind,
    HeartPulse,
    BrainCircuit,
    Smile,
    Eye,
    Bone,
    Thermometer,
    Snowflake,
    Zap,
} from 'lucide-react';
import HospitalCard from './HospitalCard';
import {
    getRankedHospitals,
    type HospitalLive,
    type SeasonalTrend,
    type WeatherData,
} from '../src/utils/emergencyEngine';

const DEFAULT_CENTER: [number, number] = [9.512, 77.634];

const SYMPTOM_PROFILES = [
    { id: 'fever', label: 'Fever / Flu', icon: Thermometer, specialties: ['General Medicine', 'Emergency', 'Pediatrics'] },
    { id: 'cold', label: 'Cold / Cough', icon: Snowflake, specialties: ['General Medicine', 'Emergency', 'Pediatrics'] },
    { id: 'stomach', label: 'Stomach Pain', icon: Zap, specialties: ['General Medicine', 'Emergency', 'Surgery'] },
    { id: 'headache', label: 'Headache / Migraine', icon: BrainCircuit, specialties: ['Neurology', 'General Medicine'] },
    { id: 'dental', label: 'Dental Pain', icon: Smile, specialties: ['ENT', 'General Medicine', 'Surgery'] },
    { id: 'eye', label: 'Eye Trouble', icon: Eye, specialties: ['Ophthalmology', 'General Medicine'] },
    { id: 'joint', label: 'Joint Pain', icon: Bone, specialties: ['Orthopedics', 'Surgery'] },
    { id: 'heart', label: 'Chest / Heart', icon: HeartPulse, specialties: ['Cardiology', 'Emergency'] },
] as const;

function MapBounds({ hospitals, userLocation }: { hospitals: HospitalLive[]; userLocation: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        const points = [userLocation, ...hospitals.slice(0, 5).map((hospital) => [hospital.lat, hospital.lng] as [number, number])];
        if (points.length < 2) {
            map.setView(userLocation, 11);
            return;
        }

        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1 });
    }, [hospitals, userLocation, map]);

    return null;
}

function openDirections(lat: number, lng: number) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
}

const HospitalSuggestionSection: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
    const [hospitals, setHospitals] = useState<HospitalLive[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [trend, setTrend] = useState<SeasonalTrend | null>(null);
    const [selectedSymptomId, setSelectedSymptomId] = useState<string>('fever');
    const [refreshCount, setRefreshCount] = useState(0);

    const selectedSymptom = useMemo(
        () => SYMPTOM_PROFILES.find((item) => item.id === selectedSymptomId) ?? SYMPTOM_PROFILES[0],
        [selectedSymptomId]
    );

    const rankedHospitals = useMemo(() => {
        const targetSpecialties = selectedSymptom.specialties.map((item) => item.toLowerCase());

        return hospitals
            .map((hospital) => {
                const specialtyMatchScore = hospital.specialties.reduce((score, specialty) => {
                    const normalized = specialty.toLowerCase();
                    const exactMatch = targetSpecialties.some((target) => normalized.includes(target) || target.includes(normalized));
                    return score + (exactMatch ? 22 : 0);
                }, 0);

                const capacityScore = Math.min(24, hospital.bedsAvailable / 2 + hospital.ventilatorsAvailable * 2);
                const accessScore = (hospital.emergency24x7 ? 12 : 0) + (hospital.ambulanceAvailable ? 6 : 0);
                const trendScore = hospital.matchesDiseaseTrend ? 14 : 0;
                const proximityScore = Math.max(0, 28 - hospital.distanceKm * 3.5);
                const penalty = hospital.surgeScore;

                return {
                    hospital,
                    score: specialtyMatchScore + capacityScore + accessScore + trendScore + proximityScore - penalty,
                    reason: specialtyMatchScore > 0
                        ? `Matches ${selectedSymptom.label.toLowerCase()} care`
                        : hospital.matchesDiseaseTrend
                            ? 'Matches the current disease trend'
                            : hospital.emergency24x7
                                ? '24/7 care with live capacity'
                                : 'Nearby with usable capacity',
                };
            })
            .sort((left, right) => {
                if (right.score !== left.score) return right.score - left.score;
                if (left.hospital.surgeScore !== right.hospital.surgeScore) return left.hospital.surgeScore - right.hospital.surgeScore;
                return left.hospital.distanceKm - right.hospital.distanceKm;
            });
    }, [hospitals, selectedSymptom]);

    const topHospital = rankedHospitals[0]?.hospital;

    useEffect(() => {
        let cancelled = false;

        const loadHospitals = async (lat: number, lng: number) => {
            setLoading(true);
            try {
                const result = await getRankedHospitals(lat, lng, 'all');
                if (cancelled) return;
                setHospitals(result.hospitals);
                setWeather(result.weather);
                setTrend(result.trend);
            } catch (error) {
                console.error('Failed to load hospital recommendations:', error);
                if (!cancelled) {
                    setHospitals([]);
                    setWeather(null);
                    setTrend(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location: [number, number] = [position.coords.latitude, position.coords.longitude];
                    setUserLocation(location);
                    loadHospitals(location[0], location[1]);
                },
                () => loadHospitals(DEFAULT_CENTER[0], DEFAULT_CENTER[1]),
                { timeout: 5000 }
            );
        } else {
            loadHospitals(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
        }

        return () => {
            cancelled = true;
        };
    }, [refreshCount]);

    const handleRefresh = () => {
        setRefreshCount((count) => count + 1);
    };

    const recommendedHospitals = rankedHospitals.slice(0, 3);
    const mapHospitals = rankedHospitals.slice(0, 5).map((entry) => entry.hospital);

    return (
        <section className="animate-fade-in-up space-y-5">
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 text-white p-6 md:p-7 shadow-2xl shadow-slate-900/20 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.35),transparent_28%)]" />
                <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                            <Sparkles size={14} />
                            Hospital suggestion engine
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-2xl bg-white/10 p-3">
                                <Activity size={22} />
                            </div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight">Nearby hospitals ranked for your current need</h3>
                                <p className="mt-2 text-sm md:text-base text-white/75 max-w-xl">
                                    Suggestions are mapped from live bed vacancy, emergency availability, travel distance, and the symptom profile you choose below.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider font-semibold">
                                <ShieldCheck size={14} />
                                Trend signal
                            </div>
                            <p className="mt-2 font-bold text-white">{trend?.season || 'Live regional trend'}</p>
                            <p className="text-white/65 text-xs mt-1">{trend?.advisory || 'Realtime ranking is loading.'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider font-semibold">
                                <Clock size={14} />
                                Weather impact
                            </div>
                            <p className="mt-2 font-bold text-white">{weather?.condition || 'Fetching weather'}</p>
                            <p className="text-white/65 text-xs mt-1">Travel is adjusted using live weather severity.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Symptom filter</p>
                        <h4 className="mt-1 text-lg font-bold text-slate-900">Choose what you feel right now</h4>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh live suggestions
                    </button>
                </div>

                <div className="mt-4 flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                    {SYMPTOM_PROFILES.map((item) => {
                        const Icon = item.icon;
                        const selected = item.id === selectedSymptomId;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setSelectedSymptomId(item.id)}
                                className={`flex min-w-[170px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${selected
                                    ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 hover:bg-white'
                                    }`}
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{item.label}</p>
                                    <p className="text-xs text-slate-500">Find the best nearby match</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                    {loading ? (
                        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                            Loading nearby hospitals...
                        </div>
                    ) : recommendedHospitals.length > 0 ? (
                        recommendedHospitals.map((entry, index) => {
                            const hospital = entry.hospital;
                            return (
                                <HospitalCard
                                    key={hospital.id}
                                    name={hospital.name}
                                    address={hospital.address}
                                    phone={hospital.phone}
                                    distance={`${hospital.distanceKm.toFixed(1)} km`}
                                    travelTime={`${hospital.travelTimeMin} mins`}
                                    type={hospital.type}
                                    totalBeds={hospital.totalBeds}
                                    bedsAvailable={hospital.bedsAvailable}
                                    totalVentilators={hospital.totalVentilators}
                                    ventilatorsAvailable={hospital.ventilatorsAvailable}
                                    bedOccupancyPct={hospital.bedOccupancyPct}
                                    emergency24x7={hospital.emergency24x7}
                                    ambulanceAvailable={hospital.ambulanceAvailable}
                                    specialties={hospital.specialties}
                                    weatherCondition={weather?.condition || hospital.weatherAtHospital.condition}
                                    weatherSeverity={weather?.severity || hospital.weatherAtHospital.severity}
                                    surgeLevel={hospital.surgeLevel}
                                    matchesDiseaseTrend={hospital.matchesDiseaseTrend}
                                    isRecommended={index === 0}
                                    rank={index + 1}
                                    lat={hospital.lat}
                                    lng={hospital.lng}
                                    onGetDirections={() => openDirections(hospital.lat, hospital.lng)}
                                />
                            );
                        })
                    ) : (
                        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                            No hospital recommendations are available right now.
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm overflow-hidden">
                        <div className="flex items-start justify-between gap-4 pb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Map preview</p>
                                <h4 className="mt-1 text-lg font-bold text-slate-900">Suggested hospital navigation</h4>
                                <p className="mt-1 text-sm text-slate-500">Embedded map based on your location and symptom match.</p>
                            </div>
                            {topHospital && (
                                <button
                                    onClick={() => openDirections(topHospital.lat, topHospital.lng)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                                >
                                    <Navigation size={16} />
                                    Navigate
                                </button>
                            )}
                        </div>

                        <div className="h-[360px] overflow-hidden rounded-[1.5rem] border border-slate-200">
                            <MapContainer center={userLocation} zoom={11} className="h-full w-full">
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={userLocation}>
                                    <Popup>
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-900">Your location</p>
                                            <p className="text-xs text-slate-500">Starting point for hospital navigation</p>
                                        </div>
                                    </Popup>
                                </Marker>
                                {mapHospitals.map((hospital) => (
                                    <Marker key={hospital.id} position={[hospital.lat, hospital.lng]}>
                                        <Popup>
                                            <div className="space-y-2 min-w-[180px]">
                                                <p className="font-bold text-slate-900">{hospital.name}</p>
                                                <p className="text-xs text-slate-500">{hospital.address}</p>
                                                <button
                                                    onClick={() => openDirections(hospital.lat, hospital.lng)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    <Navigation size={12} />
                                                    Get directions
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                <MapBounds hospitals={mapHospitals} userLocation={userLocation} />
                            </MapContainer>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                            <BedDouble size={18} className="text-brand-600" />
                            Live match cues
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white p-4 border border-slate-200">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top reason</p>
                                <p className="mt-2 text-sm font-semibold text-slate-800">
                                    {rankedHospitals[0]?.reason || 'Loading match reason'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-4 border border-slate-200">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current symptom</p>
                                <p className="mt-2 text-sm font-semibold text-slate-800">{selectedSymptom.label}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4 border border-slate-200">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nearby focus</p>
                                <p className="mt-2 text-sm font-semibold text-slate-800">Hospitals with real-time bed and ventilator vacancy</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4 border border-slate-200">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation mode</p>
                                <p className="mt-2 text-sm font-semibold text-slate-800">Google Maps direction handoff is enabled</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HospitalSuggestionSection;
