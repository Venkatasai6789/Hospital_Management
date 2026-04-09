import React from 'react';
import { 
    MapPin, Clock, Navigation, Phone, 
    BedDouble, Wind, Building2, CheckCircle2, TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SurgeBadge from './SurgeBadge';

interface HospitalCardProps {
    name: string;
    address: string;
    phone: string;
    distance: string;
    travelTime: string;
    type: 'government' | 'private';
    totalBeds: number;
    bedsAvailable: number;
    totalVentilators: number;
    ventilatorsAvailable: number;
    bedOccupancyPct: number;
    emergency24x7: boolean;
    ambulanceAvailable: boolean;
    specialties: string[];
    weatherCondition: string;
    weatherSeverity: number;
    surgeLevel: 'low' | 'medium' | 'high' | 'critical';
    matchesDiseaseTrend: boolean;
    isRecommended?: boolean;
    rank?: number;
    lat: number;
    lng: number;
    onClick?: () => void;
    onGetDirections?: () => void;
}

function getBedStatus(pct: number): { color: string; bg: string; text: string; label: string } {
    if (pct <= 50) return { 
        color: 'bg-emerald-500', 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700',
        label: 'High Availability',
    };
    if (pct <= 75) return { 
        color: 'bg-amber-500', 
        bg: 'bg-amber-50', 
        text: 'text-amber-700',
        label: 'Moderate',
    };
    if (pct <= 90) return { 
        color: 'bg-orange-500', 
        bg: 'bg-orange-50', 
        text: 'text-orange-700',
        label: 'Limited',
    };
    return { 
        color: 'bg-red-500', 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        label: 'Critical',
    };
}

const HospitalCard: React.FC<HospitalCardProps> = ({
    name,
    address,
    phone,
    distance,
    travelTime,
    type,
    totalBeds,
    bedsAvailable,
    totalVentilators,
    ventilatorsAvailable,
    bedOccupancyPct,
    emergency24x7,
    specialties,
    weatherCondition,
    surgeLevel,
    matchesDiseaseTrend,
    isRecommended = false,
    rank,
    lat,
    lng,
    onClick,
    onGetDirections,
}) => {
    const { t } = useTranslation();
    const bedStatus = getBedStatus(bedOccupancyPct);

    const handleNavigate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onGetDirections) {
            onGetDirections();
        } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
        }
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`tel:${phone}`, '_self');
    };

    return (
        <div 
            onClick={onClick}
            className={`
                group relative w-full flex flex-col bg-white rounded-[2rem] border transition-all duration-300
                ${isRecommended 
                    ? 'border-brand-300 shadow-[0_8px_30px_rgb(0,0,0,0.08)] shadow-brand-100/50' 
                    : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'}
                ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
                overflow-hidden
            `}
            role={onClick ? 'button' : 'article'}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* Top Badges Area - Gracefully stacked at the very top */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-0">
                <div className="flex flex-wrap gap-2">
                    {isRecommended && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                            <CheckCircle2 size={14} className="text-brand-600" />
                            <span className="text-xs font-bold">{t('emergencyRoute.recommended', 'Recommended')}</span>
                        </div>
                    )}
                    {matchesDiseaseTrend && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                            <TrendingUp size={14} className="text-amber-600" />
                            <span className="text-xs font-bold">{t('emergencyRoute.trendMatch', 'Trend Match')}</span>
                        </div>
                    )}
                </div>
                <div className="flex shrink-0">
                    <SurgeBadge surgeLevel={surgeLevel} weatherCondition={weatherCondition} />
                </div>
            </div>

            {/* Header: Identity & Core Details */}
            <div className="p-4 flex gap-4">
                <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                    ${type === 'government' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}
                `}>
                    <Building2 size={24} className="stroke-[1.5]" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-brand-600 transition-colors">
                        {name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1 mb-2">
                        <MapPin size={14} className="shrink-0 text-slate-400" />
                        <p className="text-sm truncate">{address}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${type === 'government' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                            {type === 'government' ? t('emergencyRoute.govtHospital', 'Govt Hospital') : t('emergencyRoute.privateHospital', 'Private Hospital')}
                        </span>
                        {emergency24x7 && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                24/7 Care
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-slate-100 via-slate-100 to-transparent w-full" />

            {/* Logistics & Resources - Gestalt Proximity: Two Clear Blocks */}
            <div className="grid md:grid-cols-2 bg-slate-50/50">
                
                {/* Left Block: Travel & Distance */}
                <div className="p-4 md:border-r border-b md:border-b-0 border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Logistics</span>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-lg">
                                <Clock size={16} className="text-brand-500" />
                                {travelTime}
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Drive</span>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-200"></div>
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-lg">
                                <Navigation size={14} className="text-slate-400" />
                                {distance}
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Away</span>
                        </div>
                    </div>
                </div>

                {/* Right Block: Capacity (Beds & Vents) */}
                <div className="p-4 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Capacity</span>
                    <div className="flex items-center gap-4">
                        <div className={`flex flex-col ${bedStatus.text}`}>
                            <div className="flex items-center gap-1.5 font-extrabold text-lg">
                                <BedDouble size={16} />
                                {bedsAvailable}
                            </div>
                            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider mt-0.5">Beds</span>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-200"></div>
                        
                        <div className={`flex flex-col ${ventilatorsAvailable > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            <div className="flex items-center gap-1.5 font-extrabold text-lg">
                                <Wind size={16} />
                                {ventilatorsAvailable}
                            </div>
                            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider mt-0.5">Vents</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Action Buttons - Fitts's Law & Von Restorff */}
            <div className="p-4 flex gap-3 mt-auto bg-white">
                <button 
                    onClick={handleCall}
                    className="flex flex-1 items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 group/call"
                >
                    <Phone size={18} className="group-hover/call:rotate-12 transition-transform text-slate-500" />
                    <span>Call</span>
                </button>
                <button 
                    onClick={handleNavigate}
                    className="flex flex-[2] items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 group/nav"
                >
                    <span>{t('emergencyRoute.go', 'Get Directions')}</span>
                    <Navigation size={18} className="group-hover/nav:translate-x-1 group-hover/nav:-translate-y-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export { HospitalCard };
export default HospitalCard;
