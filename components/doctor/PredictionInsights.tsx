import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    CloudRain,
    Gauge,
    MapPin,
    RefreshCw,
    Sparkles,
    TrendingUp,
    Wind,
} from 'lucide-react';
import { buildForecastSeries, resolveHospitalForDoctorProfile } from './operationsResourcesData';
import { operationsService } from '../../src/services/api';

interface PredictionInsightsProps {
    doctorName?: string;
    hospitalName?: string;
    hospitalLocation?: string;
    specialty?: string;
}

type SignalsPayload = {
    fetchedAt?: string;
    riskScore?: number;
    recommendation?: string;
    weather?: {
        condition?: string;
        temperatureC?: number;
        humidity?: number;
        rainMm?: number;
        windKph?: number;
        source?: string;
    };
    airQuality?: {
        usAqi?: number;
        pm2_5?: number;
        pm10?: number;
        label?: string;
        source?: string;
    };
    events?: {
        events?: string[];
        source?: string;
    };
    news?: {
        headlines?: string[];
        source?: string;
    };
    disease?: {
        summary?: string;
        severity?: string;
        source?: string;
        todayCases?: number;
        active?: number;
    };
    diseaseTrend?: {
        source?: string;
        metric?: string;
        series?: Array<{
            date: string;
            dailyCases: number;
            avg7?: number;
        }>;
    };
    geo?: {
        district?: string;
        lat?: number;
        lng?: number;
        source?: string;
    };
    istTime?: {
        timeLabel?: string;
        timezone?: string;
        source?: string;
        iso?: string;
    };
};

type OverflowReason = {
    title: string;
    detail: string;
    impact: 'high' | 'medium' | 'low';
};

type SimulationFactors = {
    weatherLift: number;
    eventLift: number;
    newsLift: number;
    airLift: number;
    diseaseLift: number;
    peakLift: number;
    totalLift: number;
};

type SimulatedPoint = {
    time: string;
    baseline: number;
    inflow: number;
    increase: number;
    slotHour: number;
};

function clampNumber(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function parseSlotHour(time: string) {
    const raw = Number(time.split(':')[0]);
    return Number.isFinite(raw) ? clampNumber(raw, 0, 23) : 0;
}

function seededNoise(seedText: string, index: number) {
    const base = `${seedText}-${index}`;
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
        hash = ((hash << 5) - hash) + base.charCodeAt(i);
        hash |= 0;
    }
    const normalized = Math.abs(Math.sin(hash) * 10000) % 1;
    return (normalized - 0.5) * 3.2;
}

function parseIstHour(istIso?: string) {
    const date = istIso ? new Date(istIso) : new Date();
    if (Number.isNaN(date.getTime())) {
        return new Date().getHours();
    }
    return Number(date.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }));
}

function getPeakWindowLift(hour: number) {
    if (hour >= 7 && hour <= 11) return 7;
    if (hour >= 16 && hour <= 22) return 8;
    if (hour >= 0 && hour <= 5) return -4;
    return 2;
}

function toShortDateLabel(dateText: string) {
    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) return dateText;
    return parsed.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
}

function impactClasses(impact: OverflowReason['impact']) {
    if (impact === 'high') return 'bg-red-50 border-red-200 text-red-700';
    if (impact === 'medium') return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
}

const PredictionInsights: React.FC<PredictionInsightsProps> = ({
    doctorName,
    hospitalName,
    hospitalLocation,
    specialty,
}) => {
    const selectedHospital = useMemo(
        () => resolveHospitalForDoctorProfile({ hospitalName, doctorName, specialty, hospitalLocation }),
        [hospitalName, doctorName, specialty, hospitalLocation]
    );
    const [signals, setSignals] = useState<SignalsPayload | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [geoStatus, setGeoStatus] = useState<'requesting' | 'enabled' | 'blocked'>('requesting');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoStatus('blocked');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setGeoStatus('enabled');
            },
            () => setGeoStatus('blocked'),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
        );
    }, []);

    const loadSignals = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await operationsService.getSignals(
                selectedHospital.hospitalName,
                selectedHospital.district,
                coords?.lat,
                coords?.lng
            );
            setSignals(response as SignalsPayload);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Unable to fetch prediction signals.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSignals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedHospital.id, coords?.lat, coords?.lng, refreshTick]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setRefreshTick((value) => value + 1);
        }, 180000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    const simulationFactors = useMemo<SimulationFactors>(() => {
        const weather = signals?.weather;
        const rainLift = clampNumber((weather?.rainMm ?? 0) * 1.4, 0, 12);
        const windLift = clampNumber(((weather?.windKph ?? 0) - 14) * 0.5, -2, 8);
        const humidityLift = (weather?.humidity ?? 65) > 78 ? 2.2 : 0;
        const weatherLift = clampNumber(rainLift + windLift + humidityLift, 0, 15);

        const eventCount = signals?.events?.events?.length ?? 0;
        const eventPriorityBoost = (signals?.events?.events || []).some((text) => /festival|holiday|crowd|gathering/i.test(text)) ? 2.5 : 0;
        const eventLift = clampNumber((eventCount * 2.1) + eventPriorityBoost, 0, 10);

        const newsCount = signals?.news?.headlines?.length ?? 0;
        const newsPriorityBoost = (signals?.news?.headlines || []).some((text) => /alert|outbreak|surge|emergency|advisory/i.test(text)) ? 2 : 0;
        const newsLift = clampNumber((newsCount * 1.6) + newsPriorityBoost, 0, 8);

        const aqi = signals?.airQuality?.usAqi ?? 60;
        const airLift = clampNumber((aqi - 50) * 0.08, 0, 9);

        const severity = signals?.disease?.severity || 'low';
        const diseaseLift = severity === 'moderate' ? 6 : 2;

        const istHour = parseIstHour(signals?.istTime?.iso);
        const peakLift = getPeakWindowLift(istHour);

        const totalLift = clampNumber(weatherLift + eventLift + newsLift + airLift + diseaseLift + peakLift, 4, 36);

        return {
            weatherLift,
            eventLift,
            newsLift,
            airLift,
            diseaseLift,
            peakLift,
            totalLift,
        };
    }, [signals]);

    const forecast = useMemo(() => {
        const base = buildForecastSeries();
        const riskLift = Math.round(((signals?.riskScore ?? 52) - 42) / 4.5);
        const seedKey = `${selectedHospital.id}-${signals?.geo?.district || selectedHospital.district}-${refreshTick}`;

        return base.slice(0, 12).map((item, index): SimulatedPoint => {
            const slotHour = parseSlotHour(item.time);
            const peakWindowLift = getPeakWindowLift(slotHour);
            const trendWeight = index >= 6 ? 1.08 : 1;
            const variability = seededNoise(seedKey, index);

            const lift = (riskLift + simulationFactors.totalLift * 0.55 + peakWindowLift + variability) * trendWeight;
            const dynamicInflow = item.inflow + Math.round(lift);
            const inflow = Math.max(item.baseline, dynamicInflow);
            const increase = Math.max(0, inflow - item.baseline);
            return {
                ...item,
                inflow,
                increase,
                slotHour,
            };
        });
    }, [signals?.riskScore, signals?.geo?.district, selectedHospital.district, selectedHospital.id, simulationFactors.totalLift, refreshTick]);

    const todayTotals = useMemo(() => {
        const baselineTotal = forecast.reduce((sum, p) => sum + p.baseline, 0);
        const inflowTotal = forecast.reduce((sum, p) => sum + p.inflow, 0);
        const increaseCount = Math.max(0, inflowTotal - baselineTotal);
        const increasePct = baselineTotal > 0 ? Math.round((increaseCount / baselineTotal) * 100) : 0;
        return { baselineTotal, inflowTotal, increaseCount, increasePct };
    }, [forecast]);

    const reasons = useMemo<OverflowReason[]>(() => {
        const list: OverflowReason[] = [];
        const rain = signals?.weather?.rainMm ?? 0;
        const wind = signals?.weather?.windKph ?? 0;
        const aqi = signals?.airQuality?.usAqi ?? 60;
        const event = signals?.events?.events?.[0];
        const headline = signals?.news?.headlines?.[0];
        const diseaseSummary = signals?.disease?.summary;

        if (simulationFactors.weatherLift >= 5 || rain > 2 || wind > 18) {
            list.push({
                title: 'Weather pressure',
                detail: `${signals?.weather?.condition || 'Weather change'} with rain ${rain} mm and wind ${wind} km/h increases emergency walk-ins (impact +${Math.round(simulationFactors.weatherLift)}).`,
                impact: simulationFactors.weatherLift > 9 ? 'high' : 'medium',
            });
        }

        if (event || simulationFactors.eventLift > 2) {
            list.push({
                title: 'Public event load',
                detail: event || 'Regional gathering indicators suggest higher OPD and ER demand windows.',
                impact: simulationFactors.eventLift > 6 ? 'high' : 'medium',
            });
        }

        if (headline || simulationFactors.newsLift > 2) {
            list.push({
                title: 'Local news signal',
                detail: headline || 'Realtime news trend points to increased same-day healthcare traffic.',
                impact: simulationFactors.newsLift > 5 ? 'high' : 'medium',
            });
        }

        if (aqi > 80 || simulationFactors.airLift >= 3) {
            list.push({
                title: 'Air quality impact',
                detail: `AQI is ${aqi} (${signals?.airQuality?.label || 'Moderate'}), likely to increase respiratory complaints today (impact +${Math.round(simulationFactors.airLift)}).`,
                impact: simulationFactors.airLift > 6 ? 'high' : 'medium',
            });
        }

        if (diseaseSummary) {
            list.push({
                title: 'Disease trend',
                detail: diseaseSummary,
                impact: signals?.disease?.severity === 'moderate' ? 'medium' : 'low',
            });
        }

        list.push({
            title: 'Time-of-day pattern (IST)',
            detail: `IST demand window lift currently contributes ${Math.round(simulationFactors.peakLift)} points with stronger morning/evening peaks.`,
            impact: simulationFactors.peakLift >= 7 ? 'medium' : 'low',
        });

        return list.slice(0, 5);
    }, [signals, simulationFactors]);

    const topIncreaseSlot = useMemo(() => {
        if (forecast.length === 0) return null;
        return forecast.reduce((max, curr) => (curr.increase > max.increase ? curr : max), forecast[0]);
    }, [forecast]);

    const diseaseTrendSeries = useMemo(() => {
        const raw = signals?.diseaseTrend?.series || [];
        return raw.slice(-10).map((item) => ({
            ...item,
            dateShort: toShortDateLabel(item.date),
            avg7: item.avg7 ?? item.dailyCases,
        }));
    }, [signals?.diseaseTrend?.series]);

    const diseaseTrendSummary = useMemo(() => {
        if (diseaseTrendSeries.length === 0) {
            return { latest: 0, avg7: 0, deltaPct: 0 };
        }
        const latest = Number(diseaseTrendSeries[diseaseTrendSeries.length - 1].dailyCases || 0);
        const prev = Number(diseaseTrendSeries[Math.max(0, diseaseTrendSeries.length - 2)]?.dailyCases || latest);
        const avg7 = Math.round(diseaseTrendSeries.slice(-7).reduce((sum, row) => sum + Number(row.dailyCases || 0), 0) / Math.max(1, Math.min(7, diseaseTrendSeries.length)));
        const deltaPct = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;
        return { latest, avg7, deltaPct };
    }, [diseaseTrendSeries]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                        <Sparkles size={12} />
                        Prediction Insights
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Today's patient overflow prediction</h2>
                        <p className="text-sm text-slate-500">
                            Realtime prediction for <span className="font-bold text-slate-700">{selectedHospital.hospitalName}</span> using free APIs (weather, events, news, air quality, IST time, disease trend).
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <CalendarClock size={16} />
                        IST {signals?.istTime?.timeLabel || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <MapPin size={16} />
                        {geoStatus === 'enabled' ? 'Geo enabled' : geoStatus === 'requesting' ? 'Geo requesting' : 'Geo blocked'}
                    </div>
                    <button
                        onClick={loadSignals}
                        className="flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition cursor-pointer"
                    >
                        <RefreshCw size={16} />
                        Refresh signals
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-[1.5rem] border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">Today increase</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">+{todayTotals.increaseCount}</p>
                    <p className="mt-1 text-xs font-semibold text-red-600">patients vs baseline</p>
                </div>
                <div className="rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Increase ratio</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{todayTotals.increasePct}%</p>
                    <p className="mt-1 text-xs font-semibold text-amber-600">today overflow uplift</p>
                </div>
                <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Risk index</p>
                    <div className="mt-2 flex items-center gap-2">
                        <p className="text-3xl font-black text-slate-900">{signals?.riskScore ?? 52}%</p>
                        <Gauge size={18} className="text-sky-600" />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-sky-600">aggregated realtime pressure</p>
                </div>
                <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Peak slot</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{topIncreaseSlot?.time || '--:--'}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-600">+{topIncreaseSlot?.increase || 0} patients</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="xl:col-span-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Today overflow curve</h3>
                        <p className="text-sm text-slate-500">Forecasted inflow vs baseline for today (IST).</p>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecast} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="overflowFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.26} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="baselineFillPrediction" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={12} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(15,23,42,0.08)' }}
                                    formatter={(value: number, label) => [value, label === 'inflow' ? 'Predicted inflow' : 'Baseline']}
                                    labelFormatter={(value) => `IST ${value}`}
                                />
                                <Area type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} fill="url(#baselineFillPrediction)" dot={false} />
                                <Area type="monotone" dataKey="inflow" stroke="#ef4444" strokeWidth={3} fill="url(#overflowFill)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="xl:col-span-2 rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200">
                                <CheckCircle2 size={12} />
                                Why increase today
                            </div>
                            <h3 className="mt-3 text-lg font-bold">Detailed reason breakdown</h3>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-2 text-emerald-300">
                            <CloudRain size={18} />
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {reasons.map((reason) => (
                            <div key={reason.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold text-white">{reason.title}</p>
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${impactClasses(reason.impact)}`}>
                                        {reason.impact}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-300 leading-5">{reason.detail}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs">
                        <p className="font-semibold text-slate-200">Prediction note</p>
                        <p className="mt-1 text-slate-300">{signals?.recommendation || 'Monitor triage and emergency staffing proactively for evening surge.'}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Disease trend snapshot (realtime)</h3>
                        <p className="text-sm text-slate-500">Actual disease trend signal integrated into prediction reasoning.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                        <TrendingUp size={14} />
                        {signals?.diseaseTrend?.source || 'fallback'}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Latest daily cases</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{diseaseTrendSummary.latest.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">7-day avg</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{diseaseTrendSummary.avg7.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Day-over-day</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{diseaseTrendSummary.deltaPct >= 0 ? '+' : ''}{diseaseTrendSummary.deltaPct}%</p>
                    </div>
                </div>

                {diseaseTrendSeries.length > 0 && (
                    <div className="mt-4 h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={diseaseTrendSeries}>
                                <defs>
                                    <linearGradient id="diseaseTrendFillPrediction" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="dateShort" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: number, label) => [value.toLocaleString(), label === 'dailyCases' ? 'Daily cases' : '7-day avg']}
                                />
                                <Area type="monotone" dataKey="dailyCases" stroke="#ef4444" strokeWidth={3} fill="url(#diseaseTrendFillPrediction)" dot={false} />
                                <Area type="monotone" dataKey="avg7" stroke="#0ea5e9" strokeWidth={2} fill="transparent" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Today's increase details</h3>
                        <p className="text-sm text-slate-500">Detailed slot-level overflow explanation for doctor decisions.</p>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                        {doctorName || selectedHospital.doctorName} • {specialty || selectedHospital.specialty}
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-400 text-xs uppercase tracking-[0.16em] border-b border-slate-200">
                                <th className="py-3 pr-4">IST slot</th>
                                <th className="py-3 pr-4">Baseline</th>
                                <th className="py-3 pr-4">Predicted</th>
                                <th className="py-3 pr-4">Increase</th>
                                <th className="py-3 pr-4">Reason context</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forecast.map((slot) => (
                                <tr key={slot.time} className="border-b border-slate-100 last:border-0">
                                    <td className="py-3 pr-4 font-bold text-slate-700">{slot.time}</td>
                                    <td className="py-3 pr-4 text-slate-600">{slot.baseline}</td>
                                    <td className="py-3 pr-4 text-slate-600">{slot.inflow}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${slot.increase >= 10 ? 'bg-red-100 text-red-700' : slot.increase >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            +{slot.increase}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-slate-500">
                                        {slot.increase >= 12 ? 'Weather + event + peak window' : slot.increase >= 7 ? 'Moderate external pressure' : slot.slotHour >= 7 && slot.slotHour <= 11 ? 'Morning IST peak' : slot.slotHour >= 16 && slot.slotHour <= 22 ? 'Evening IST peak' : 'Near baseline'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Geo location</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{signals?.geo?.district || selectedHospital.district}</p>
                        <p className="mt-1 text-xs text-slate-500">{hospitalLocation || selectedHospital.address}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Air quality</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">AQI {signals?.airQuality?.usAqi ?? 62} ({signals?.airQuality?.label || 'Moderate'})</p>
                        <p className="mt-1 text-xs text-slate-500">PM2.5 {signals?.airQuality?.pm2_5 ?? 24} • PM10 {signals?.airQuality?.pm10 ?? 42}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Weather context</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{signals?.weather?.condition || 'Partly Cloudy'}, {signals?.weather?.temperatureC ?? 31} C</p>
                        <p className="mt-1 text-xs text-slate-500">Humidity {signals?.weather?.humidity ?? 68}% • Rain {signals?.weather?.rainMm ?? 2} mm • Wind {signals?.weather?.windKph ?? 14} km/h</p>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Dynamic simulation factors</p>
                    <p className="mt-1">Weather +{Math.round(simulationFactors.weatherLift)} • Events +{Math.round(simulationFactors.eventLift)} • News +{Math.round(simulationFactors.newsLift)} • AQI +{Math.round(simulationFactors.airLift)} • Disease +{Math.round(simulationFactors.diseaseLift)} • IST +{Math.round(simulationFactors.peakLift)}</p>
                    <p className="mt-1">Total dynamic lift: +{Math.round(simulationFactors.totalLift)} (re-simulated automatically every 3 minutes).</p>
                </div>

                {(error || isLoading) && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5" />
                        <div>
                            {isLoading ? 'Refreshing realtime prediction signals...' : error}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PredictionInsights;
