import React from 'react';
import { AlertCircle, CloudRain, CloudSnow, Sun, Cloud, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SurgeBadgeProps {
    surgeLevel: 'low' | 'medium' | 'high' | 'critical';
    weatherCondition: string;
    className?: string;
}

const weatherIcons: Record<string, React.ElementType> = {
    'Clear': Sun,
    'Cloudy': Cloud,
    'Rain': CloudRain,
    'Heavy Rain': CloudRain,
    'Storm': Zap,
    'Snow': CloudSnow,
};

const surgeConfig: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
    low: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'Low Surge',
    },
    medium: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        label: 'Moderate Surge',
    },
    high: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        label: 'High Surge',
    },
    critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500',
        label: 'Critical Surge',
    },
};

const SurgeBadge: React.FC<SurgeBadgeProps> = ({ surgeLevel, weatherCondition, className = '' }) => {
    const { t } = useTranslation();
    const config = surgeConfig[surgeLevel] || surgeConfig.low;
    const WeatherIcon = weatherIcons[weatherCondition] || Cloud;

    const showWarning = (surgeLevel === 'high' || surgeLevel === 'critical') &&
        (weatherCondition === 'Heavy Rain' || weatherCondition === 'Storm');

    return (
        <div className={className}>
            {/* Surge + Weather Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.border} ${config.text} border backdrop-blur-sm`}>
                <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                <span>{config.label}</span>
                <span className="text-[10px] opacity-60">|</span>
                <WeatherIcon size={13} className="opacity-80" />
                <span className="opacity-80">{weatherCondition}</span>
            </div>

            {/* Alert Banner */}
            {showWarning && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-200 text-red-700 text-xs font-semibold animate-fade-in">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{t('emergencyRoute.highSurgeWarning')}</span>
                </div>
            )}
        </div>
    );
};

export default SurgeBadge;
