import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Mail, Phone, Lock, Navigation, CheckCircle, ShieldCheck, ArrowRight, ArrowLeft, Stethoscope, ChevronRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'otp' | 'signup';
type UserRole = 'patient' | 'doctor' | 'admin';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [role, setRole] = useState<UserRole>('patient');
  const [signupStep, setSignupStep] = useState<0 | 1>(0); // 0: Role Selection, 1: Form
  const [mobileNumber, setMobileNumber] = useState('');
  const [addressMode, setAddressMode] = useState<'manual' | 'map'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setView('login');
      setSignupStep(0);
      setMobileNumber('');
      setOtp(['', '', '', '']);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Check
    setTimeout(() => {
      setIsLoading(false);
      // Logic: For demo, if number ends in 0, simulate "New User", else "Existing User"
      if (mobileNumber.endsWith('0')) {
        setView('signup');
        setSignupStep(0); // Start at role selection
      } else {
        setView('otp');
      }
    }, 1000);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1500);
  };

  const switchToSignup = () => {
    setView('signup');
    setSignupStep(0);
  };

  const goBack = () => {
    if (view === 'signup') {
        if (signupStep === 1) {
            setSignupStep(0);
        } else {
            setView('login');
        }
    } else if (view === 'otp') {
        setView('login');
    }
  };

  const selectRole = (selectedRole: UserRole) => {
      setRole(selectedRole);
      setSignupStep(1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-6xl h-auto max-h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden animate-fade-in-up transition-all duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-500 hover:text-slate-900 hover:bg-white transition-all shadow-sm"
        >
          <X size={20} />
        </button>

        {/* Left Side - Image */}
        <div className={`hidden lg:block relative bg-slate-50 transition-all duration-500 ease-in-out ${view === 'signup' ? 'w-[280px]' : 'w-[400px]'}`}>
          <img 
            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=2091&auto=format&fit=crop" 
            alt="Medical Professional" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/30 to-brand-900/90"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/30">
               <ShieldCheck size={20} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Secure Access</h3>
            <p className="text-brand-100 text-sm leading-relaxed mb-6">
              {view === 'signup' 
                ? "Join thousands of users managing their health with MediConnect's advanced AI platform."
                : "Log in to access your personalized health dashboard and specialist consultations."}
            </p>
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
          
          {/* Back Button for sub-views */}
          {view !== 'login' && (
            <button 
              onClick={goBack} 
              className="absolute top-6 left-6 text-slate-500 hover:text-brand-600 flex items-center gap-1 text-sm font-semibold transition-colors z-10"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {/* VIEW 1: LOGIN */}
          {view === 'login' && (
            <div className="h-full flex flex-col justify-center px-8 md:px-16 py-12 animate-fade-in">
              <div className="max-w-md mx-auto w-full">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                  <p className="text-slate-500">Enter your details to access your account</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 px-4 bg-slate-100 rounded-l-xl flex items-center border border-r-0 border-slate-200 text-slate-500 font-bold text-sm">
                        +91
                      </div>
                      <input 
                        type="tel" 
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        maxLength={10}
                        placeholder="98765 43210" 
                        className="w-full pl-16 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-300 font-medium text-lg" 
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading || mobileNumber.length < 10}
                    className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:shadow-brand-600/40 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Continue'}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-slate-500 text-sm">Don't have an account?</p>
                  <button 
                    onClick={switchToSignup}
                    className="mt-2 text-brand-600 font-bold hover:text-brand-700 hover:underline transition-all"
                  >
                    Create an account
                  </button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                  <Lock size={12} />
                  <span>Secured by MediConnect AI</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: OTP */}
          {view === 'otp' && (
            <div className="h-full flex flex-col justify-center px-8 md:px-16 py-12 animate-fade-in-up">
              <div className="max-w-md mx-auto w-full text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Code</h2>
                <p className="text-slate-500 mb-8">
                  We have sent a verification code to <br/>
                  <span className="font-bold text-slate-900">+91 {mobileNumber}</span>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const newOtp = [...otp];
                          newOtp[index] = e.target.value.replace(/\D/g, '');
                          setOtp(newOtp);
                          if (e.target.value && index < 3) {
                            const nextInput = document.getElementById(`otp-${index + 1}`);
                            nextInput?.focus();
                          }
                        }}
                        id={`otp-${index}`}
                        className="w-14 h-14 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      />
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading || otp.join('').length < 4}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-brand-600 hover:shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Login'}
                  </button>
                </form>

                <div className="mt-8">
                  <button className="text-sm text-slate-500 hover:text-brand-600 font-medium transition-colors">
                    Resend Code in 30s
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: SIGNUP - ROLE SELECTION */}
          {view === 'signup' && signupStep === 0 && (
             <div className="h-full flex flex-col justify-center px-8 lg:px-12 py-12 animate-fade-in">
                <div className="max-w-2xl mx-auto w-full">
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center justify-center p-2 bg-brand-50 rounded-xl mb-4 text-brand-600">
                             <User size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Who are you?</h2>
                        <p className="text-slate-500">Select your account type to proceed with registration.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Patient Card */}
                        <div 
                            onClick={() => selectRole('patient')}
                            className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <User size={32} />
                            </div>
                            <h3 className="relative z-10 font-bold text-lg text-slate-900 mb-1">Patient</h3>
                            <p className="relative z-10 text-xs text-slate-500">Book appointments & view history</p>
                        </div>

                        {/* Doctor Card */}
                        <div 
                             onClick={() => selectRole('doctor')}
                             className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Stethoscope size={32} />
                            </div>
                            <h3 className="relative z-10 font-bold text-lg text-slate-900 mb-1">Doctor</h3>
                            <p className="relative z-10 text-xs text-slate-500">Manage patients & schedules</p>
                        </div>

                        {/* Admin Card */}
                        <div 
                             onClick={() => selectRole('admin')}
                             className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="relative z-10 font-bold text-lg text-slate-900 mb-1">Admin</h3>
                            <p className="relative z-10 text-xs text-slate-500">Facility & user management</p>
                        </div>
                    </div>
                </div>
             </div>
          )}

          {/* VIEW 3: SIGNUP - FORM DETAILS */}
          {view === 'signup' && signupStep === 1 && (
            <div className="p-8 lg:p-12 animate-fade-in-up">
              <div className="max-w-3xl mx-auto">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
                      {role === 'patient' && <User size={18} />}
                      {role === 'doctor' && <Stethoscope size={18} />}
                      {role === 'admin' && <ShieldCheck size={18} />}
                    </div>
                    <span className="text-brand-600 font-bold tracking-wide text-sm uppercase">{role} Registration</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Create your account</h2>
                  <p className="text-slate-500 mt-2">Join MediConnect for personalized healthcare management.</p>
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-8">
                  
                  {/* Personal Details Group */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">First Name</label>
                        <input type="text" placeholder="Sarah" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Surname</label>
                        <input type="text" placeholder="Mitchell" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Age</label>
                          <input type="number" placeholder="28" min="0" max="120" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Gender</label>
                          <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-slate-700 appearance-none" required>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Contact Details Group */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="tel" 
                            defaultValue={mobileNumber}
                            placeholder="+91 98765 43210" 
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" 
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Gmail Account</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="email" placeholder="sarah.m@gmail.com" className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" required />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Address Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Address</h3>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                          type="button"
                          onClick={() => setAddressMode('manual')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${addressMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                          Manual
                        </button>
                        <button 
                          type="button"
                          onClick={() => setAddressMode('map')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${addressMode === 'map' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                          Google Maps
                        </button>
                      </div>
                    </div>

                    {addressMode === 'manual' ? (
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4 animate-fade-in">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Door / House No.</label>
                          <input type="text" placeholder="42-B" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Area / Street Name</label>
                          <input type="text" placeholder="Greenwood Avenue" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                        </div>
                        
                        <div className="md:col-span-3 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">City</label>
                          <input type="text" placeholder="Bangalore" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">District</label>
                          <input type="text" placeholder="Urban" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">State</label>
                          <input type="text" placeholder="Karnataka" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Country</label>
                          <input type="text" defaultValue="India" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Pincode</label>
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
                            <Navigation size={16} /> Locate Me
                          </button>
                          <p className="text-xs font-medium text-slate-600 bg-white/80 px-3 py-1 rounded-md backdrop-blur-sm">Click to select location on map</p>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Submit Action */}
                  <div className="pt-4 pb-4">
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-brand-600 hover:shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Account <CheckCircle size={18} />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                      By clicking Create Account, you agree to our <a href="#" className="underline hover:text-brand-600">Terms</a> and <a href="#" className="underline hover:text-brand-600">Privacy Policy</a>.
                    </p>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AuthModal;