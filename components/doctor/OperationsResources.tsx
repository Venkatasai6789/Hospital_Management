import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AlertTriangle,
    BedDouble,
    CalendarClock,
    CheckCircle2,
    CloudRain,
    Droplets,
    Gauge,
    ExternalLink,
    HeartPulse,
    LayoutPanelTop,
    Minus,
    MoveRight,
    Plus,
    RefreshCw,
    Route,
    ShieldAlert,
    Sparkles,
    TimerReset,
    UserCircle2,
    Users,
    Wind,
} from 'lucide-react';
import {
    BedSlot,
    buildBedLayout,
    buildForecastSeries,
    getOperationsInsights,
    operationsRoster,
    resolveHospitalForDoctorProfile,
} from './operationsResourcesData';
import { operationsService } from '../../src/services/api';

interface OperationsResourcesProps {
    doctorName?: string;
    hospitalName?: string;
    hospitalLocation?: string;
    specialty?: string;
}

type SignalPayload = {
    fetchedAt: string;
    riskScore: number;
    recommendation: string;
    geo?: {
        source?: string;
        lat?: number;
        lng?: number;
        district?: string;
    };
    istTime?: {
        source?: string;
        timezone?: string;
        iso?: string;
        timeLabel?: string;
    };
    weather: {
        condition: string;
        temperatureC: number;
        humidity: number;
        rainMm: number;
        windKph: number;
    };
    airQuality?: {
        source?: string;
        usAqi?: number;
        pm2_5?: number;
        pm10?: number;
        label?: string;
    };
    events: {
        events: string[];
    };
    news: {
        headlines: string[];
    };
    disease: {
        summary: string;
        severity: string;
    };
};

type OpsSection = 'overview' | 'beds' | 'flow';

type FlowPatient = {
    id: string;
    name: string;
    reason: string;
    stage: 'triage' | 'in-care' | 'discharge';
    wait: string;
    priority: 'high' | 'medium' | 'low';
};

const INITIAL_SELECTED = operationsRoster[0];

const WARD_OPTIONS: Array<'All' | BedSlot['ward']> = ['All', 'ICU Ward', 'Emergency Ward', 'General Ward'];

function statusClasses(status: BedSlot['status']) {
    if (status === 'available') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'occupied') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'icu') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'ventilator') return 'bg-sky-100 text-sky-700 border-sky-200';
    if (status === 'reserved') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'discharge') return 'bg-violet-100 text-violet-700 border-violet-200';
    if (status === 'isolation') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-teal-100 text-teal-700 border-teal-200';
}

function statusLabel(status: BedSlot['status']) {
    if (status === 'icu') return 'ICU';
    if (status === 'ventilator') return 'Vent';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function priorityClasses(priority: FlowPatient['priority']) {
    if (priority === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (priority === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

function toneClasses(tone: 'emerald' | 'amber' | 'sky') {
    if (tone === 'emerald') return 'from-emerald-50 to-white border-emerald-100 text-emerald-700';
    if (tone === 'amber') return 'from-amber-50 to-white border-amber-100 text-amber-700';
    return 'from-sky-50 to-white border-sky-100 text-sky-700';
}

function clampNumber(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function seededOffset(seedText: string, index: number) {
    const base = `${seedText}-${index}`;
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
        hash = ((hash << 5) - hash) + base.charCodeAt(i);
        hash |= 0;
    }
    const normalized = Math.abs(Math.sin(hash) * 10000) % 1;
    return normalized;
}

function parseIstHour(istIso?: string) {
    const date = istIso ? new Date(istIso) : new Date();
    if (Number.isNaN(date.getTime())) {
        return new Date().getHours();
    }
    return Number(date.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }));
}

function getSlotHour(time: string) {
    const value = Number(time.split(':')[0]);
    return Number.isFinite(value) ? clampNumber(value, 0, 23) : 0;
}

const OperationsResources: React.FC<OperationsResourcesProps> = ({
    doctorName,
    hospitalName,
    hospitalLocation,
    specialty,
}) => {
    const selectedHospital = useMemo(
        () => resolveHospitalForDoctorProfile({ hospitalName, doctorName, specialty, hospitalLocation }),
        [hospitalName, doctorName, specialty, hospitalLocation]
    );
    const [activeSection, setActiveSection] = useState<OpsSection>('overview');
    const [manualBeds, setManualBeds] = useState(selectedHospital.occupiedBeds);
    const [syncTick, setSyncTick] = useState(0);
    const [adjustmentStep, setAdjustmentStep] = useState(2);
    const [selectedWard, setSelectedWard] = useState<'All' | BedSlot['ward']>('All');
    const [selectedBedId, setSelectedBedId] = useState<string>('');
    const [signals, setSignals] = useState<SignalPayload | null>(null);
    const [signalsError, setSignalsError] = useState<string | null>(null);
    const [signalsLoading, setSignalsLoading] = useState(false);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [geoStatus, setGeoStatus] = useState<'requesting' | 'enabled' | 'blocked'>('requesting');
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        setManualBeds(selectedHospital.occupiedBeds);
    }, [selectedHospital.id, selectedHospital.occupiedBeds]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoStatus('blocked');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setGeoStatus('enabled');
            },
            () => {
                setGeoStatus('blocked');
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 120000,
            }
        );
    }, []);

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setRefreshTick((value) => value + 1);
        }, 180000);

        return () => {
            window.clearInterval(timerId);
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadSignals = async () => {
            setSignalsLoading(true);
            setSignalsError(null);
            try {
                const response = await operationsService.getSignals(
                    selectedHospital.hospitalName,
                    selectedHospital.district,
                    userCoords?.lat,
                    userCoords?.lng
                );
                if (!active) return;
                setSignals(response as SignalPayload);
            } catch (error: any) {
                if (!active) return;
                setSignalsError(error?.response?.data?.message || 'Unable to fetch live signals. Using local forecast only.');
            } finally {
                if (active) setSignalsLoading(false);
            }
        };

        loadSignals();
        return () => {
            active = false;
        };
    }, [selectedHospital.district, selectedHospital.hospitalName, userCoords?.lat, userCoords?.lng, refreshTick]);

    const simulationLift = useMemo(() => {
        const weatherLift = clampNumber(((signals?.weather?.rainMm ?? 0) * 1.3) + (((signals?.weather?.windKph ?? 0) - 12) * 0.35), 0, 14);
        const eventLift = clampNumber((signals?.events?.events?.length ?? 0) * 1.8, 0, 8);
        const newsLift = clampNumber((signals?.news?.headlines?.length ?? 0) * 1.2, 0, 6);
        const airLift = clampNumber(((signals?.airQuality?.usAqi ?? 60) - 50) * 0.07, 0, 8);
        const diseaseLift = signals?.disease?.severity === 'moderate' ? 5 : 2;
        const peakHour = parseIstHour(signals?.istTime?.iso);
        const timeLift = (peakHour >= 7 && peakHour <= 11) || (peakHour >= 16 && peakHour <= 22) ? 7 : peakHour <= 5 ? -3 : 2;
        return clampNumber(weatherLift + eventLift + newsLift + airLift + diseaseLift + timeLift, 2, 34);
    }, [signals]);

    const forecastSeries = useMemo(() => {
        const base = buildForecastSeries();
        const riskLift = signals ? Math.round((signals.riskScore - 42) / 4.4) : 0;
        const seed = `${selectedHospital.id}-${signals?.geo?.district || selectedHospital.district}-${refreshTick}`;
        return base.map((point, index) => {
            const slotHour = getSlotHour(point.time);
            const slotLift = (slotHour >= 7 && slotHour <= 11) || (slotHour >= 16 && slotHour <= 22) ? 6 : slotHour <= 5 ? -2 : 1;
            const noise = (seededOffset(seed, index) - 0.5) * 3.5;
            const dynamicLift = Math.round((simulationLift * 0.48) + riskLift + slotLift + noise);

            return {
            ...point,
            inflow: Math.max(point.baseline, point.inflow + dynamicLift),
        };
        });
    }, [signals, selectedHospital.id, selectedHospital.district, refreshTick, simulationLift]);

    const insights = useMemo(() => getOperationsInsights(), []);
    const bedLayout = useMemo(() => {
        const baseLayout = buildBedLayout(selectedHospital.id);
        const seed = `${selectedHospital.id}-${refreshTick}-${signals?.riskScore ?? 52}`;
        const risk = signals?.riskScore ?? 52;

        return baseLayout.map((bed, index) => {
            const signal = seededOffset(seed, index);
            let status = bed.status;

            if (risk >= 68 && signal > 0.76 && (status === 'available' || status === 'reserved')) {
                status = index % 4 === 0 ? 'icu' : 'occupied';
            } else if (risk <= 45 && signal > 0.74 && status === 'occupied') {
                status = 'discharge';
            } else if (signal > 0.88 && status === 'available') {
                status = 'reserved';
            }

            const patientName = status === 'occupied' || status === 'icu' || status === 'ventilator'
                ? (bed.patientName || `Patient ${String((index % 18) + 1).padStart(2, '0')}`)
                : bed.patientName;

            const waitLabel = patientName
                ? `${((index + refreshTick) % 9) + 1}h ago`
                : bed.waitLabel;

            return {
                ...bed,
                status,
                patientName,
                waitLabel,
            };
        });
    }, [selectedHospital.id, refreshTick, signals?.riskScore]);

    const filteredBeds = useMemo(() => {
        if (selectedWard === 'All') return bedLayout;
        return bedLayout.filter((bed) => bed.ward === selectedWard);
    }, [bedLayout, selectedWard]);

    useEffect(() => {
        setSelectedBedId((prev) => {
            if (prev && filteredBeds.some((bed) => bed.id === prev)) return prev;
            return filteredBeds[0]?.id || '';
        });
    }, [filteredBeds]);

    const selectedBed = useMemo(() => filteredBeds.find((bed) => bed.id === selectedBedId) || filteredBeds[0], [filteredBeds, selectedBedId]);

    const flowPatients = useMemo<FlowPatient[]>(() => {
        const rows: FlowPatient[] = bedLayout
            .filter((bed) => bed.status !== 'available' && bed.status !== 'cleaning')
            .slice(0, 14)
            .map((bed, index) => {
                const stage: FlowPatient['stage'] =
                    bed.status === 'discharge'
                        ? 'discharge'
                        : bed.status === 'reserved' || bed.status === 'isolation'
                            ? 'triage'
                            : 'in-care';
                const priority: FlowPatient['priority'] =
                    bed.status === 'icu' || bed.status === 'ventilator'
                        ? 'high'
                        : bed.status === 'reserved' || bed.status === 'isolation'
                            ? 'medium'
                            : 'low';

                return {
                    id: `flow-${index + 1}`,
                    name: bed.patientName || `Patient ${String(index + 1).padStart(2, '0')}`,
                    reason: bed.status === 'icu' || bed.status === 'ventilator' ? 'Respiratory distress' : bed.status === 'discharge' ? 'Post observation clearance' : 'Fever and dehydration',
                    stage,
                    wait: bed.waitLabel || `${(index % 5) + 1}h ago`,
                    priority,
                };
            });

        return rows;
    }, [bedLayout]);

    const flowChartData = useMemo(() => {
        const slots = forecastSeries.slice(0, 8);
        return slots.map((slot, index) => {
            const triage = Math.max(6, Math.round(slot.inflow * 0.34 + ((index % 3) - 1) * 2));
            const admitted = Math.max(4, Math.round(slot.inflow * 0.42));
            const discharged = Math.max(2, Math.round(slot.baseline * 0.26));
            return {
                time: slot.time,
                triage,
                admitted,
                discharged,
            };
        });
    }, [forecastSeries]);

    const dynamicOccupiedBeds = useMemo(() => {
        const noise = Math.round(((seededOffset(`${selectedHospital.id}-${refreshTick}`, 99) - 0.5) * 8));
        const lift = Math.round((simulationLift * 0.42) + noise);
        return clampNumber(manualBeds + lift, 0, selectedHospital.totalBeds);
    }, [manualBeds, selectedHospital.id, selectedHospital.totalBeds, refreshTick, simulationLift]);

    const availableBeds = Math.max(0, selectedHospital.totalBeds - dynamicOccupiedBeds);

    const bedOccupancy = Math.min(100, Math.round((dynamicOccupiedBeds / selectedHospital.totalBeds) * 100));
    const ventilatorAvailability = selectedHospital.ventilatorsAvailable;
    const staffRatio = (selectedHospital.staffOnDuty / Math.max(1, dynamicOccupiedBeds)).toFixed(2);
    const predictedSurge = forecastSeries.length > 0 ? forecastSeries[forecastSeries.length - 1].inflow - forecastSeries[0].baseline : 0;
    const riskScore = signals?.riskScore ?? 52;

    const triageCount = flowPatients.filter((item) => item.stage === 'triage').length;
    const inCareCount = flowPatients.filter((item) => item.stage === 'in-care').length;
    const dischargeCount = flowPatients.filter((item) => item.stage === 'discharge').length;

    const applyBedAdjustment = (delta: number) => {
        const nextBeds = Math.max(0, Math.min(selectedHospital.totalBeds, manualBeds + delta));
        setManualBeds(nextBeds);
        setSyncTick((value) => value + 1);
    };

    const publishLiveUpdate = () => {
        setSyncTick((value) => value + 1);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                        <Sparkles size={12} />
                        Operations & Resources
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Live operations command center</h2>
                        <p className="text-sm text-slate-500">
                            Showing only your mapped hospital: <span className="font-bold text-slate-700">{selectedHospital.hospitalName}</span> in {selectedHospital.district}.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 size={16} />
                        Live sync active
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <TimerReset size={16} />
                        IST {signals?.istTime?.timeLabel || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <Route size={16} />
                        {geoStatus === 'enabled' ? 'Geo enabled' : geoStatus === 'requesting' ? 'Geo requesting' : 'Geo blocked'}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <RefreshCw size={16} />
                        Dynamic refresh 3m
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <button
                    onClick={() => setActiveSection('overview')}
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${activeSection === 'overview' ? 'border-brand-300 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                    <div className="mt-2 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">Overview</h3>
                        <LayoutPanelTop size={16} className="text-brand-600" />
                    </div>
                </button>
                <button
                    onClick={() => setActiveSection('beds')}
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${activeSection === 'beds' ? 'border-brand-300 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                    <div className="mt-2 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">Bed vacancies</h3>
                        <BedDouble size={16} className="text-brand-600" />
                    </div>
                </button>
                <button
                    onClick={() => setActiveSection('flow')}
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${activeSection === 'flow' ? 'border-brand-300 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                    <div className="mt-2 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">Patient flow</h3>
                        <Route size={16} className="text-brand-600" />
                    </div>
                </button>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Risk index</p>
                    <div className="mt-2 flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900">{riskScore}%</h3>
                        <Gauge size={18} className="text-amber-500" />
                    </div>
                </div>
            </div>

            {activeSection === 'overview' && (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                                    <BedDouble size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Live</span>
                            </div>
                            <p className="mt-5 text-sm font-medium text-slate-500">Current Bed Occupancy</p>
                            <div className="mt-1 flex items-end gap-2">
                                <h3 className="text-3xl font-black text-slate-900">{bedOccupancy}%</h3>
                                <span className="pb-1 text-xs font-bold text-amber-600">{manualBeds}/{selectedHospital.totalBeds}</span>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                                    <Wind size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Ready</span>
                            </div>
                            <p className="mt-5 text-sm font-medium text-slate-500">Ventilator Status</p>
                            <div className="mt-1 flex items-end gap-2">
                                <h3 className="text-3xl font-black text-slate-900">{ventilatorAvailability}</h3>
                                <span className="pb-1 text-xs font-bold text-sky-600">available</span>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                    <Users size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Load</span>
                            </div>
                            <p className="mt-5 text-sm font-medium text-slate-500">Current Staff-to-Patient Ratio</p>
                            <div className="mt-1 flex items-end gap-2">
                                <h3 className="text-3xl font-black text-slate-900">1:{staffRatio}</h3>
                                <span className="pb-1 text-xs font-bold text-emerald-600">staff coverage</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                        <div className="xl:col-span-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Predicted Patient Inflow</h3>
                                    <p className="text-sm text-slate-500">48-hour forecast tuned by live district weather, events, and disease trend signals.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Surge outlook</p>
                                    <p className="text-sm font-black text-slate-900">+{predictedSurge}% expected</p>
                                </div>
                            </div>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                                            </linearGradient>
                                            <linearGradient id="baselineFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={12} interval={3} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(15,23,42,0.08)' }}
                                            formatter={(value: number, label) => [value, label === 'inflow' ? 'Predicted inflow' : 'Baseline']}
                                            labelFormatter={(value) => `IST ${value}`}
                                        />
                                        <Area type="monotone" dataKey="baseline" stroke="#cbd5e1" strokeWidth={2} fill="url(#baselineFill)" dot={false} />
                                        <Area type="monotone" dataKey="inflow" stroke="#0ea5e9" strokeWidth={3} fill="url(#forecastFill)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="xl:col-span-2 rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200">
                                        <ShieldAlert size={12} />
                                        AI staffing assistant
                                    </div>
                                    <h3 className="mt-3 text-lg font-bold">Reallocation recommendation</h3>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-2 text-emerald-300">
                                    <CloudRain size={18} />
                                </div>
                            </div>

                            <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold leading-6 text-slate-100">
                                    {signals?.recommendation || `Moderate pressure expected in ${selectedHospital.district}. Re-allocate 2 staff from General Ward to Emergency if occupancy rises above 75%.`}
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                        <p className="text-slate-400">Festival load</p>
                                        <p className="mt-1 text-white">{signals?.events?.events?.[0] || `${selectedHospital.district}: evening crowd expected`}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                        <p className="text-slate-400">Weather signal</p>
                                        <p className="mt-1 text-white">
                                            {signals?.weather ? `${signals.weather.condition}, ${signals.weather.temperatureC} C` : 'Rain + travel friction'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                                        <p className="text-slate-400">Risk</p>
                                        <p className="mt-1 font-bold text-amber-300">{riskScore}%</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                                        <p className="text-slate-400">Humidity</p>
                                        <p className="mt-1 font-bold text-slate-100">{signals?.weather?.humidity ?? 68}%</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                                        <p className="text-slate-400">Rain</p>
                                        <p className="mt-1 font-bold text-slate-100">{signals?.weather?.rainMm ?? 2} mm</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                                        <p className="text-slate-400">Air quality</p>
                                        <p className="mt-1 font-bold text-slate-100">AQI {signals?.airQuality?.usAqi ?? 62}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                                        <p className="text-slate-400">PM2.5</p>
                                        <p className="mt-1 font-bold text-slate-100">{signals?.airQuality?.pm2_5 ?? 24}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                                        <p className="text-slate-400">Geo district</p>
                                        <p className="mt-1 font-bold text-slate-100">{signals?.geo?.district || selectedHospital.district}</p>
                                    </div>
                                </div>

                                {signalsError && <p className="text-xs text-amber-200">{signalsError}</p>}
                                {signalsLoading && <p className="text-xs text-slate-300">Refreshing live signals...</p>}
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button onClick={publishLiveUpdate} className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 cursor-pointer">
                                    Accept recommendation
                                </button>
                                <button className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 cursor-pointer">
                                    Review manually
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeSection === 'beds' && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="xl:col-span-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Bed vacancies</h3>
                                <p className="text-sm text-slate-500">Real-time ward board inspired by floor operations layouts.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {WARD_OPTIONS.map((ward) => (
                                    <button
                                        key={ward}
                                        onClick={() => setSelectedWard(ward)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${selectedWard === ward ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {ward}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {filteredBeds.map((bed) => (
                                <button
                                    key={bed.id}
                                    onClick={() => setSelectedBedId(bed.id)}
                                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${selectedBed?.id === bed.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800">{bed.label}</h4>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{bed.ward}</p>
                                        </div>
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClasses(bed.status)}`}>
                                            {statusLabel(bed.status)}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-slate-700">{bed.patientName || 'No patient assigned'}</p>
                                    <p className="mt-1 text-xs text-slate-400">{bed.waitLabel || 'Ready for admission'}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="xl:col-span-2 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Bed detail panel</h3>
                                <p className="text-sm text-slate-500">Selected bed status and quick controls.</p>
                            </div>
                            <CalendarClock size={18} className="text-brand-600" />
                        </div>

                        <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Selected bed</p>
                            <h4 className="mt-2 text-xl font-black text-slate-900">{selectedBed?.label || 'Bed --'}</h4>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{selectedBed?.ward || 'Ward not selected'}</p>

                            <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClasses(selectedBed?.status || 'available')}`}>
                                    {statusLabel(selectedBed?.status || 'available')}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">{selectedBed?.waitLabel || 'Ready for admission'}</span>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold text-slate-400">Patient</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <UserCircle2 size={18} className="text-slate-500" />
                                    <p className="text-sm font-bold text-slate-700">{selectedBed?.patientName || 'No patient assigned'}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Occupancy</p>
                                    <p className="mt-2 text-lg font-black text-slate-900">{bedOccupancy}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Available beds</p>
                                    <p className="mt-2 text-lg font-black text-emerald-600">{availableBeds}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => applyBedAdjustment(-adjustmentStep)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600 cursor-pointer"
                                >
                                    <Minus size={16} />
                                </button>
                                <button
                                    onClick={() => applyBedAdjustment(adjustmentStep)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600 cursor-pointer"
                                >
                                    <Plus size={16} />
                                </button>
                                <div className="ml-auto flex gap-1">
                                    {[1, 2, 4].map((step) => (
                                        <button
                                            key={step}
                                            onClick={() => setAdjustmentStep(step)}
                                            className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${adjustmentStep === step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {step}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={publishLiveUpdate}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-500 cursor-pointer"
                            >
                                Publish realtime update
                                <MoveRight size={14} />
                            </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                            <p className="font-semibold text-slate-600">Hospital context</p>
                            <p className="mt-1">{doctorName || selectedHospital.doctorName} • {specialty || selectedHospital.specialty}</p>
                            <p className="mt-1">{hospitalLocation || selectedHospital.address}</p>
                            <a
                                href="#"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                                onClick={(event) => event.preventDefault()}
                            >
                                Floor plan mode
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'flow' && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="xl:col-span-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Patient flow</h3>
                                <p className="text-sm text-slate-500">Separated clinical flow lanes for quick triage decisions.</p>
                            </div>
                            <div className="text-xs font-semibold text-slate-400">{syncTick} live sync events</div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Triage</p>
                                <p className="mt-2 text-2xl font-black text-slate-900">{triageCount}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">In care</p>
                                <p className="mt-2 text-2xl font-black text-slate-900">{inCareCount}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Discharge queue</p>
                                <p className="mt-2 text-2xl font-black text-slate-900">{dischargeCount}</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            {[
                                { title: 'Triage lane', stage: 'triage' as const, tint: 'border-amber-200 bg-amber-50/40' },
                                { title: 'Under care', stage: 'in-care' as const, tint: 'border-blue-200 bg-blue-50/40' },
                                { title: 'Ready discharge', stage: 'discharge' as const, tint: 'border-emerald-200 bg-emerald-50/40' },
                            ].map((lane) => (
                                <div key={lane.title} className={`rounded-2xl border p-3 ${lane.tint}`}>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{lane.title}</p>
                                    <div className="mt-3 space-y-2">
                                        {flowPatients.filter((item) => item.stage === lane.stage).slice(0, 4).map((item) => (
                                            <div key={item.id} className="rounded-xl border border-white/90 bg-white p-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityClasses(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
                                                <p className="mt-1 text-[11px] text-slate-400">{item.wait}</p>
                                            </div>
                                        ))}
                                        {flowPatients.filter((item) => item.stage === lane.stage).length === 0 && (
                                            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-400">No active patients in this lane.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="xl:col-span-2 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Flow trend by slot</h3>
                                <p className="text-sm text-slate-500">Hourly movement across triage, admissions, and discharges.</p>
                            </div>
                            <RefreshCw size={18} className="text-brand-600" />
                        </div>

                        <div className="mt-4 h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={flowChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                                        labelFormatter={(value) => `IST ${value}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="triage" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="admitted" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="discharged" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-3 space-y-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-700">Signal note:</span> {signals?.news?.headlines?.[0] || `${selectedHospital.district} public activity trending`}
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-700">Disease trend:</span> {signals?.disease?.summary || 'Seasonal respiratory burden in moderate zone'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {insights.map((insight) => (
                    <div key={insight.title} className={`rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-sm ${toneClasses(insight.tone)}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-500">{insight.title}</p>
                            <div className="rounded-full bg-white p-2 shadow-sm">
                                <Droplets size={14} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-3">
                            <h4 className="text-3xl font-black text-slate-900">{insight.value}</h4>
                            <p className="text-xs font-semibold text-slate-500">{insight.delta}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-[2rem] border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-red-600 shadow-sm">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Update loop</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">Manual bed changes are broadcast live</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Updates are scoped to {selectedHospital.hospitalName}. Only this doctor's mapped hospital data is shown in this tab and tuned using district popularity in nearby regions.
                        </p>
                        <a
                            href="#"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                            onClick={(event) => event.preventDefault()}
                        >
                            Operational sync details
                            <ExternalLink size={12} />
                        </a>
                    </div>
                    <div className="hidden md:flex items-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-700">
                        <HeartPulse size={14} />
                        Realtime safe
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-semibold">Hospital category: {selectedHospital.category}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-semibold">District: {selectedHospital.district}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-semibold">Calibrated bed model: location popularity + near-actual overrides</span>
                </div>
            </div>
        </div>
    );
};

export default OperationsResources;
