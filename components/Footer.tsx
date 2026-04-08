import React from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 text-white p-2 rounded-xl">
                <Stethoscope size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Medi<span className="text-brand-400">Connect</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('footer.brandDesc')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-600 transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.services')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.specialists')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.testimonials')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.bookAppt')}</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-6">{t('footer.serviceTitle')}</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.ortho')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.cosmetic')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.pediatric')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.implants')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.surgery')}</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-6">{t('footer.stayUpdated')}</h4>
            <p className="text-slate-400 text-sm mb-4">{t('footer.newsletter')}</p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder') || "Enter your email"}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white placeholder-slate-500"
              />
              <button className="bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 transition-colors">
                {t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">{t('footer.copyright')}</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;