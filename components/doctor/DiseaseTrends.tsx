import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Activity,
    AlertTriangle,
    CalendarClock,
    Gauge,
    MapPin,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { operationsService } from '../../src/services/api';
import { resolveHospitalForDoctorProfile } from './operationsResourcesData';

interface DiseaseTrendsProps {
    doctorName?: string;
    hospitalName?: string;
    hospitalLocation?: string;
    specialty?: string;
}

type DiseaseTrendPoint = {
    date: string;
    dailyCases: number;
    cumulativeCases?: number;
    cumulativeDeaths?: number;
    avg7?: number;
};

type SignalsPayload = {
    riskScore?: number;
    geo?: {
        district?: string;
    };
    istTime?: {
        timeLabel?: string;
    };
    disease?: {
        summary?: string;
        severity?: string;
        todayCases?: number;
        active?: number;
        source?: string;
    };
    diseaseTrend?: {
        source?: string;
        metric?: string;
        series?: DiseaseTrendPoint[];
        predictedNext24h?: number;
        pressureContributionPct?: number;
    };
    weather?: {
        condition?: string;
        temperatureC?: number;
        humidity?: number;
    };
    airQuality?: {
        usAqi?: number;
        label?: string;
    };
};

function formatShortDate(dateText: string) {
    const d = new Date(dateText);
    if (Number.isNaN(d.getTime())) return dateText;
    return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
}

const DiseaseTrends: React.FC<DiseaseTrendsProps> = ({
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
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [geoStatus, setGeoStatus] = useState<'requesting' | 'enabled' | 'blocked'>('requesting');
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoStatus('blocked');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
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
            setError(err?.response?.data?.message || 'Unable to load disease trend signals.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSignals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedHospital.id, coords?.lat, coords?.lng, refreshTick]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setRefreshTick((value) => value + 1);
        }, 180000);
        return () => window.clearInterval(timer);
    }, []);

    const trendSeries = useMemo(() => {
        const raw = signals?.diseaseTrend?.series || [];
        return raw.slice(-21).map((item) => ({
            ...item,
            dateShort: formatShortDate(item.date),
            avg7: item.avg7 ?? item.dailyCases,
        }));
    }, [signals?.diseaseTrend?.series]);

    const trendChartSeries = useMemo(() => {
        if (trendSeries.length === 0) return [];

        const predicted = Number(
            signals?.diseaseTrend?.predictedNext24h ?? trendSeries[trendSeries.length - 1]?.avg7 ?? 0
        );
        const startProjectionIndex = Math.max(0, trendSeries.length - 6);
        const projectionBase = trendSeries.map((item, index) => {
            let projected24h: number | null = null;
            if (index >= startProjectionIndex) {
                const denominator = Math.max(1, trendSeries.length - startProjectionIndex - 1);
                const progress = (index - startProjectionIndex) / denominator;
                projected24h = Math.round(item.avg7 + (predicted - item.avg7) * progress);
            }

            return {
                ...item,
                projected24h,
            };
        });

        return [
            ...projectionBase,
            {
                date: 'Next 24h',
                dateShort: 'Next 24h',
                dailyCases: null,
                avg7: null,
                projected24h: predicted,
            },
        ];
    }, [signals?.diseaseTrend?.predictedNext24h, trendSeries]);

    const trendSummary = useMemo(() => {
        if (trendSeries.length === 0) {
            return {
                latest: 0,
                avg7: 0,
                deltaPct: 0,
                trendDirection: 'stable' as 'up' | 'down' | 'stable',
            };
        }

        const latest = Number(trendSeries[trendSeries.length - 1].dailyCases || 0);
        const prev = Number(trendSeries[Math.max(0, trendSeries.length - 2)]?.dailyCases || latest);
        const avg7 = Math.round(trendSeries.slice(-7).reduce((sum, row) => sum + Number(row.dailyCases || 0), 0) / Math.max(1, Math.min(7, trendSeries.length)));
        const deltaPct = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;
        const trendDirection = deltaPct > 3 ? 'up' : deltaPct < -3 ? 'down' : 'stable';
        return { latest, avg7, deltaPct, trendDirection };
    }, [trendSeries]);

    const riskNarrative = useMemo(() => {
        const directionText = trendSummary.trendDirection === 'up'
            ? 'rising'
            : trendSummary.trendDirection === 'down'
                ? 'cooling'
                : 'stable';

        const projected = Number(signals?.diseaseTrend?.predictedNext24h || 0);
        const contribution = Number(signals?.diseaseTrend?.pressureContributionPct || 0);

        return `Disease trend is ${directionText} with ${trendSummary.latest.toLocaleString()} latest daily cases, 7-day average ${trendSummary.avg7.toLocaleString()}, and next 24h projected disease pressure ${projected.toLocaleString()} (${contribution}% contribution to risk).`;
    }, [signals?.diseaseTrend?.predictedNext24h, signals?.diseaseTrend?.pressureContributionPct, trendSummary]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                        <Sparkles size={12} />
                        Disease Trends
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Realtime disease trend monitor</h2>
                        <p className="text-sm text-slate-500">
                            Dynamic disease trend analytics for <span className="font-bold text-slate-700">{selectedHospital.hospitalName}</span>, aligned to geolocation and IST.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                        <CalendarClock size={16} />
                        IST {signals?.istTime?.timeLabel || '--:--'}
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
                        Refresh disease data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="rounded-[1.5rem] border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">Latest daily cases</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{trendSummary.latest.toLocaleString()}</p>
                    <p className="mt-1 text-xs font-semibold text-red-600">source: {signals?.diseaseTrend?.source || 'fallback'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">7-day average</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{trendSummary.avg7.toLocaleString()}</p>
                    <p className="mt-1 text-xs font-semibold text-amber-600">rolling mean</p>
                </div>
                <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Day-over-day</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{trendSummary.deltaPct >= 0 ? '+' : ''}{trendSummary.deltaPct}%</p>
                    <p className="mt-1 text-xs font-semibold text-sky-600">daily movement</p>
                </div>
                <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Signal risk</p>
                    <div className="mt-2 flex items-center gap-2">
                        <p className="text-3xl font-black text-slate-900">{signals?.riskScore ?? 52}%</p>
                        <Gauge size={18} className="text-emerald-600" />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-emerald-600">{signals?.disease?.severity || 'moderate'} severity</p>
                </div>
                <div className="rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Predicted next 24h</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {(signals?.diseaseTrend?.predictedNext24h ?? trendSummary.avg7).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-orange-600">
                        +{signals?.diseaseTrend?.pressureContributionPct ?? 0}% risk contribution
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="xl:col-span-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Disease pressure tracks (daily vs 7-day vs next 24h)</h3>
                        <p className="text-sm text-slate-500">Three-layer view to compare raw daily load, trend baseline, and projected pressure trajectory.</p>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartSeries}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="dateShort" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(15,23,42,0.08)' }}
                                    formatter={(value: number, name) => {
                                        if (!Number.isFinite(value)) return ['-', String(name)];
                                        if (name === 'dailyCases') return [value.toLocaleString(), 'Daily cases'];
                                        if (name === 'avg7') return [value.toLocaleString(), '7-day avg'];
                                        return [value.toLocaleString(), 'Projected next 24h'];
                                    }}
                                />
                                <Line type="monotone" dataKey="dailyCases" stroke="#ef4444" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="avg7" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                                <Line
                                    type="monotone"
                                    dataKey="projected24h"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    strokeDasharray="7 5"
                                    dot={{ r: 2 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="xl:col-span-2 rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200">
                                <ShieldAlert size={12} />
                                Trend intelligence
                            </div>
                            <h3 className="mt-3 text-lg font-bold">Hospital readiness advisory</h3>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-2 text-emerald-300">
                            <Activity size={18} />
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 leading-6">
                        {signals?.disease?.summary || 'Disease trend summary unavailable.'}
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 leading-6">
                        {riskNarrative}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-slate-400">Geo district</p>
                            <p className="mt-1 font-bold text-slate-100">{signals?.geo?.district || selectedHospital.district}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-slate-400">AQI impact</p>
                            <p className="mt-1 font-bold text-slate-100">{signals?.airQuality?.usAqi ?? 62} ({signals?.airQuality?.label || 'Moderate'})</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-slate-400">Weather</p>
                            <p className="mt-1 font-bold text-slate-100">{signals?.weather?.condition || 'Partly Cloudy'}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-slate-400">Humidity</p>
                            <p className="mt-1 font-bold text-slate-100">{signals?.weather?.humidity ?? 68}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Disease trend detail table</h3>
                        <p className="text-sm text-slate-500">Latest daily values for clinical planning and staffing decisions.</p>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                        {doctorName || selectedHospital.doctorName} • {specialty || selectedHospital.specialty} • {hospitalLocation || selectedHospital.address}
                    </div>
                </div>

                <div className="mt-4 h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendSeries.slice(-12)}>
                            <defs>
                                <linearGradient id="diseaseFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="dateShort" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                                formatter={(value: number) => [value.toLocaleString(), 'Daily cases']}
                            />
                            <Area type="monotone" dataKey="dailyCases" stroke="#ef4444" strokeWidth={3} fill="url(#diseaseFill)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {(error || isLoading) && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5" />
                        <div>{isLoading ? 'Refreshing realtime disease trend signals...' : error}</div>
                    </div>
                )}

                {!error && !isLoading && trendSeries.length === 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                        No disease trend records were returned for this interval. Try refreshing in a minute.
                    </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Data source:</span> {signals?.diseaseTrend?.source || 'fallback'} •
                    <span className="font-semibold text-slate-700"> refresh:</span> every 3 minutes •
                    <span className="font-semibold text-slate-700"> dynamic risk:</span> weather + AQI + events + news + disease trend
                </div>
            </div>
        </div>
    );
};

export default DiseaseTrends;
