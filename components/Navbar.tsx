import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Activity, LayoutGrid, Tag, Users, MessageCircle, ChevronDown } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

interface NavbarProps {
  onOpenSignup: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenSignup }) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // ... lines 13-27 unchanged
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { name: t('navbar.features'), icon: LayoutGrid, href: '#features' },
    { name: t('navbar.pricing'), icon: Tag, href: '#pricing', hasDropdown: true },
    { name: t('navbar.about'), icon: Users, href: '#about-us' },
    { name: t('navbar.contact'), icon: MessageCircle, href: '#contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4 bg-white/80 backdrop-blur-lg border-b border-slate-100/50' : 'py-6 bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer z-50 relative">
            <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Medi<span className="text-brand-600">Connect</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors relative group"
              >
                <item.icon size={18} className="text-slate-900 group-hover:text-brand-600 transition-colors stroke-[2.5px]" />
                <span>{item.name}</span>
                {item.hasDropdown && <ChevronDown size={14} className="mt-0.5 text-slate-500 group-hover:text-brand-600 transition-colors" />}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageToggle />
            <button
              onClick={onOpenSignup}
              className="text-sm font-semibold bg-brand-600 text-white px-6 py-2.5 rounded-full hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200"
            >
              {t('navbar.getStarted')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden relative z-50 p-2 text-slate-900 hover:bg-slate-100 rounded-full transition-colors active:scale-90 duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Full Screen Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-xl transition-all duration-500 lg:hidden flex flex-col justify-center px-8 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col gap-6 items-center text-center">
          {navItems.map((item, index) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 text-2xl font-bold text-slate-900 hover:text-brand-600 transition-all transform ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={28} className="text-brand-600" />
              {item.name}
              {item.hasDropdown && <ChevronDown size={24} className="opacity-50" />}
            </a>
          ))}

          <div
            className={`w-full max-w-xs h-px bg-slate-200 my-4 transition-all duration-700 ${mobileMenuOpen ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
            style={{ transitionDelay: '400ms' }}
          ></div>

          <div className={`flex flex-col gap-4 w-full max-w-xs transition-all duration-700 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '500ms' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSignup();
              }}
              className="w-full text-center bg-brand-600 text-white font-semibold rounded-xl py-4 shadow-xl shadow-brand-500/20 active:scale-95 transition-transform"
            >
              {t('navbar.getStarted')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;