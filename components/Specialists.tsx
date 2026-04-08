import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { Specialist } from '../types';

const Specialists: React.FC = () => {
  const { t } = useTranslation();

  const specialists: Specialist[] = [
    {
      id: '1',
      name: t('specialists.doctor1.name'),
      role: t('specialists.doctor1.role'),
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop',
      description: t('specialists.doctor1.desc'),
      availability: ['Mon', 'Wed', 'Fri']
    },
    {
      id: '2',
      name: t('specialists.doctor2.name'),
      role: t('specialists.doctor2.role'),
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop',
      description: t('specialists.doctor2.desc'),
      availability: ['Tue', 'Thu']
    },
    {
      id: '3',
      name: t('specialists.doctor3.name'),
      role: t('specialists.doctor3.role'),
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop',
      description: t('specialists.doctor3.desc'),
      availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    {
      id: '4',
      name: t('specialists.doctor4.name'),
      role: t('specialists.doctor4.role'),
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop',
      description: t('specialists.doctor4.desc'),
      availability: ['Wed', 'Fri', 'Sat']
    }
  ];

  return (
    <section id="specialists" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">{t('specialists.title')} <span className="text-brand-600">{t('specialists.titleHighlight')}</span></h2>
          <p className="text-lg text-slate-600">
            {t('specialists.subtitle')}
          </p>
        </div>

        {/* Specialists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialists.map((specialist) => (
            <div key={specialist.id} className="group relative bg-white rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-brand-900/5 transition-all duration-300 border border-slate-100 flex flex-col">

              {/* Image Container */}
              <div className="relative h-72 overflow-hidden bg-slate-100">
                <img
                  src={specialist.image}
                  alt={specialist.name}
                  className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Floating Role Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-white/50">
                  {specialist.role}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{specialist.name}</h3>
                  <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-700">4.9</span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{specialist.description}</p>

                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={14} className="text-brand-500" />
                    <span className="text-xs font-medium text-slate-500">{t('dashboard.nextAvailable')}: <span className="text-slate-700">{specialist.availability[0]}</span></span>
                  </div>

                  <button className="w-full py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 text-sm font-bold hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn">
                    {t('specialists.bookConsultation')}
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-12 flex justify-center">
          <button className="flex items-center gap-2 text-slate-900 font-bold border-b-2 border-slate-200 hover:border-brand-600 hover:text-brand-600 transition-all pb-1 active:scale-95">
            {t('specialists.viewAll')} <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Specialists;