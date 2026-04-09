import React, { useState } from 'react';
import { Activity, Heart, Flame, Moon, TrendingUp, ChevronRight } from 'lucide-react';

export default function HealthTracking() {
    const [period, setPeriod] = useState('Today');

    const metrics = [
        {
            title: "Heart Rate",
            value: "72",
            unit: "bpm",
            trend: "+2 bpm",
            trendUp: true,
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-50",
            border: "border-rose-100"
        },
        {
            title: "Steps Taken",
            value: "8,432",
            unit: "steps",
            trend: "+12% vs last week",
            trendUp: true,
            icon: Activity,
            color: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            title: "Calories Burned",
            value: "1,840",
            unit: "kcal",
            trend: "-5% vs yesterday",
            trendUp: false,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50",
            border: "border-orange-100"
        },
        {
            title: "Sleep Duration",
            value: "6h 45m",
            unit: "",
            trend: "Optimal",
            trendUp: true,
            icon: Moon,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
            border: "border-indigo-100"
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Health Activity
                    </h2>
                    <p className="text-sm text-slate-500">Monitor your daily health metrics and progress.</p>
                </div>
                
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 self-start">
                    {['Today', 'Week', 'Month'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                                period === p 
                                    ? 'bg-brand-50 text-brand-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <div 
                        key={index}
                        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${metric.bg}`}>
                                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                                metric.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                                {metric.trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                                {metric.trend}
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">{metric.title}</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
                                {metric.unit && <span className="text-sm font-medium text-slate-400">{metric.unit}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area (e.g. Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px]">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Weekly Activity Chart</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Detailed charting will appear here. Integrations with Apple Health and Google Fit are coming soon.
                        </p>
                        <button className="mt-4 px-4 py-2 bg-brand-50 text-brand-600 font-medium text-sm rounded-xl hover:bg-brand-100 transition-colors">
                            Connect Devices
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-12 -left-12 w-48 h-48 bg-brand-500/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-2">Health Score</h3>
                        <p className="text-slate-300 text-sm mb-6">Based on your activity, sleep, and vitals over the last 7 days.</p>
                        
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 rounded-full border-[8px] border-brand-500/20 flex items-center justify-center border-t-brand-500 border-r-brand-500 rotate-45 relative">
                                <div className="-rotate-45 text-center">
                                    <span className="text-4xl font-black lock">85</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Trending Up</span>
                                <span className="text-emerald-400 font-bold text-sm">+5 points</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
}
