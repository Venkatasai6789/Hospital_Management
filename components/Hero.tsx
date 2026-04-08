import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, ArrowRight, Dna, Activity, Search, Sparkles } from 'lucide-react';

interface HeroProps {
  onOpenSignup: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenSignup }) => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mesh-gradient min-h-screen flex items-center">

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left Column: Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-8 order-2 lg:order-1">

            {/* Badge */}
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-brand-100 rounded-full text-xs font-bold text-brand-700 uppercase tracking-wider shadow-sm hover:bg-white/90 transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                {t('hero.badge')}
              </div>
            </div>

            {/* Heading */}
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
                <span className="block">{t('hero.titlePrefix')}</span>
                <span className="relative inline-block my-2">
                  <span className="relative z-10 text-brand-600 px-2">{t('hero.titleHighlight')}</span>
                  <span className="absolute inset-0 bg-brand-50 rounded-lg -rotate-1 z-0 mix-blend-multiply"></span>
                </span>
                <span className="block mt-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">{t('hero.titleSuffix')}</span>
                </span>
              </h1>
            </div>

            {/* Subtext */}
            <p className="max-w-lg text-lg text-slate-600 leading-relaxed animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s' }}>
              {t('hero.subtitle')}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-in-up opacity-0 pt-4" style={{ animationDelay: '0.6s' }}>
              <button
                onClick={onOpenSignup}
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 hover:shadow-2xl hover:shadow-brand-600/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t('hero.ctaPrimary')}
                <ArrowRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <Play size={12} className="fill-slate-900 ml-0.5 group-hover:fill-brand-600 transition-colors" />
                </div>
                {t('hero.ctaSecondary')}
              </button>
            </div>

            {/* Trust Badges / Stats (Optional addition for credibility) */}
            <div className="pt-8 flex items-center gap-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-slate-900">10k+</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active Patients</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-slate-900">500+</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Specialists</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visuals */}
          <div className="relative order-1 lg:order-2 h-[500px] lg:h-[700px] w-full flex items-center justify-center animate-fade-in opacity-0" style={{ animationDelay: '0.4s' }}>

            {/* Background Orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-gradient-to-tr from-brand-200 to-indigo-200 rounded-full blur-[80px] opacity-60 animate-pulse-slow"></div>

            {/* Main Image Container */}
            <div className="relative w-[300px] lg:w-[380px] h-[550px] lg:h-[680px] bg-slate-900 rounded-[3rem] border-8 border-slate-950 shadow-2xl overflow-hidden z-20 hover:scale-[1.02] transition-transform duration-500 ring-1 ring-white/10">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
                alt="Medical App Interface"
                className="w-full h-full object-cover opacity-90"
              />

              {/* Overlay UI elements on the phone screen */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/90 flex flex-col justify-end p-8 text-center text-white">
                <div className="mb-4 inline-flex mx-auto items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                  <Sparkles className="text-brand-300" size={24} />
                </div>
                <h3 className="font-bold text-2xl mb-2">AI Diagnosis</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Instant analysis of symptoms with high clinical accuracy.</p>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute top-[20%] -left-4 lg:left-0 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 animate-float border border-slate-100 hidden md:block z-30 max-w-[180px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Activity size={16} />
                </div>
                <span className="font-bold text-slate-800 text-xs">{t('hero.floatingCard1')}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[85%] rounded-full"></div>
              </div>
            </div>

            <div className="absolute bottom-[15%] -right-4 lg:right-4 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 animate-float border border-slate-100 hidden md:block z-30 max-w-[200px]" style={{ animationDelay: '1.5s' }}>
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="Dr" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">{t('specialists.doctor1.name')}</p>
                  <p className="text-[10px] text-brand-600 font-medium">Cardiologist</p>
                </div>
              </div>
              <div className="mt-2 bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 font-medium">Next Available: Today, 4pm</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;