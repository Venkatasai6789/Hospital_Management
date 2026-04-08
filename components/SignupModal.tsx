import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, User, Mail, Phone, Calendar, Home, Navigation, CheckCircle } from 'lucide-react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [addressMode, setAddressMode] = useState<'manual' | 'map'>('manual');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle success (could close modal or show success state)
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-6xl h-auto max-h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden animate-fade-in-up">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-500 hover:text-slate-900 hover:bg-white transition-all shadow-sm"
        >
          <X size={20} />
        </button>

        {/* Form Section - Takes up more space (70-75%) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <div className="p-8 lg:p-12">

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
                  <User size={18} />
                </div>
                <span className="text-brand-600 font-bold tracking-wide text-sm uppercase">{t('signup.patientReg')}</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">{t('signup.createAccount')}</h2>
              <p className="text-slate-500 mt-2">{t('signup.join')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Personal Details Group */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{t('signup.personalInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">{t('signup.firstName')}</label>
                    <input type="text" placeholder="Sarah" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">{t('signup.surname')}</label>
                    <input type="text" placeholder="Mitchell" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.age')}</label>
                      <input type="number" placeholder="28" min="0" max="120" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.gender')}</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-slate-700 appearance-none" required>
                        <option value="">{t('signup.select')}</option>
                        <option value="male">{t('signup.male')}</option>
                        <option value="female">{t('signup.female')}</option>
                        <option value="other">{t('signup.other')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Details Group */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{t('signup.contactDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">{t('signup.mobile')}</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="tel" placeholder="+91 98765 43210" className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">{t('signup.gmail')}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" placeholder="sarah.m@gmail.com" className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('signup.address')}</h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAddressMode('manual')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${addressMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {t('signup.manual')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressMode('map')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${addressMode === 'map' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {t('signup.gmaps')}
                    </button>
                  </div>
                </div>

                {addressMode === 'manual' ? (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4 animate-fade-in">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.doorNo')}</label>
                      <input type="text" placeholder="42-B" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.street')}</label>
                      <input type="text" placeholder="Greenwood Avenue" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.city')}</label>
                      <input type="text" placeholder="Bangalore" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.district')}</label>
                      <input type="text" placeholder="Urban" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.state')}</label>
                      <input type="text" placeholder="Karnataka" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.country')}</label>
                      <input type="text" defaultValue="India" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">{t('signup.pincode')}</label>
                      <input type="text" placeholder="560001" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 h-[280px] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer animate-fade-in">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=2662&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-600 animate-bounce">
                        <MapPin size={24} className="fill-current" />
                      </div>
                      <button type="button" className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-brand-50 transition-colors flex items-center gap-2">
                        <Navigation size={16} /> {t('signup.locateMe')}
                      </button>
                      <p className="text-xs font-medium text-slate-600 bg-white/80 px-3 py-1 rounded-md backdrop-blur-sm">{t('signup.mapHint')}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Submit Action */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-brand-600 hover:shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('signup.submit')} <CheckCircle size={18} />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
                  {t('signup.agreement')} <a href="#" className="underline hover:text-brand-600">{t('footer.terms')}</a> {t('common.and')} <a href="#" className="underline hover:text-brand-600">{t('footer.privacy')}</a>.
                </p>
              </div>

            </form>
          </div>
        </div>

        {/* Side Image Section - Smaller (25-30%) and Decorative */}
        <div className="hidden lg:block w-[320px] xl:w-[400px] relative bg-slate-50">
          <img
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1760&auto=format&fit=crop"
            alt="Medical Research"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 to-brand-900/80"></div>

          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/30">
              <Home size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t('signup.welcome')}</h3>
            <p className="text-brand-100 text-sm leading-relaxed mb-6">
              {t('signup.sideDesc')}
            </p>

            <div className="flex items-center gap-3 pt-6 border-t border-white/20">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-900 bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-full h-full object-cover" alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium">{t('signup.joinCount')}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignupModal;