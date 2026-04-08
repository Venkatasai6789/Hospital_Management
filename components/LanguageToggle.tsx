import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
    const { i18n } = useTranslation();
    const [lang, setLang] = useState(i18n.language || 'en');

    useEffect(() => {
        setLang(i18n.language);
    }, [i18n.language]);

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'ta' : 'en';
        i18n.changeLanguage(newLang);
        setLang(newLang);
        localStorage.setItem('i18nextLng', newLang);
        // Force reload to update axios interceptors immediately if needed, 
        // although simply changing state should be enough for reactive components.
        // However, for the 'x-lang' header to be picked up reliably by non-reactive logic if any:
        // window.location.reload(); // Optional, but smoother without it.
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`
                relative flex items-center justify-between gap-2 px-4 py-2 rounded-full 
                border transition-all duration-300 active:scale-95 group overflow-hidden
                ${lang === 'ta'
                    ? 'bg-gradient-to-r from-brand-50 to-indigo-50 border-brand-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }
            `}
            title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
        >
            <div className={`
                flex items-center gap-2 z-10 
                ${lang === 'ta' ? 'text-brand-700' : 'text-slate-600'}
            `}>
                <Globe size={16} className={`transition-transform duration-500 ${lang === 'ta' ? 'rotate-180' : ''}`} />
                <span className="text-xs font-bold tracking-wide min-w-[24px]">
                    {lang === 'en' ? 'ENG' : 'தமிழ்'}
                </span>
            </div>

            {/* Animated Indicator */}
            {lang === 'ta' && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                </span>
            )}
        </button>
    );
};

export default LanguageToggle;
