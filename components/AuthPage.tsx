
import React, { useState, useEffect } from 'react';
import { MapPin, User, Mail, Phone, Lock, Navigation, CheckCircle, ShieldCheck, ArrowLeft, Stethoscope, Activity, Upload, FileText, Clock, AlertCircle, Briefcase, Globe, Eye, EyeOff } from 'lucide-react';
import { authService, doctorService } from '../src/services/api';
import PendingApprovalScreen from './PendingApprovalScreen';
import DoctorRegistrationSuccessModal from './DoctorRegistrationSuccessModal';

// ... (existing code)

{/* VIEW 2: OTP (REMOVED) */ }

interface AuthPageProps {
  onBack: () => void;
  onLoginSuccess: (role: 'patient' | 'doctor' | 'admin') => void;
}

type AuthView = 'login' | 'signup'; // Removed OTP
type UserRole = 'patient' | 'doctor' | 'admin';

const AuthPage: React.FC<AuthPageProps> = ({ onBack, onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [role, setRole] = useState<UserRole>('patient');
  const [signupStep, setSignupStep] = useState<0 | 1>(0); // 0: Role Selection, 1: Form

  // Auth State
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup specific state
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState(''); // Kept for signup form specific field

  // Address State
  const [addressMode, setAddressMode] = useState<'manual' | 'map'>('manual');

  // Doctor Specific State
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [hospitalName, setHospitalName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [hospitalLocation, setHospitalLocation] = useState('');
  const [professionalBio, setProfessionalBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittedForApproval, setIsSubmittedForApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{ name: string, size: string }[]>([]);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, signupStep, isSubmittedForApproval]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(emailOrMobile, password);

      const userRole = response.profile.role;
      const approvalStatus = response.profile.approval_status;

      if (userRole === 'doctor') {
        if (approvalStatus === 'pending') {
          setIsSubmittedForApproval(true);
          return;
        } else if (approvalStatus === 'rejected') {
          setError('Your account application has been rejected. Please contact support for more information.');
          return;
        }
      }

      onLoginSuccess(userRole);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare user data based on role
      const userData: any = {
        role,
        firstName,
        surname,
        age: parseInt(age),
        gender,
        mobileNumber,
        address: addressMode === 'manual' ? { mode: 'manual' } : { mode: 'map' } // Simplified address for now
      };

      if (role === 'doctor') {
        Object.assign(userData, {
          hospitalName,
          specialty,
          yearsOfExperience: parseInt(experience),
          hospitalLocation,
          hospitalWebsite: '',
          professionalBio
        });
      }

      // 1. Sign up user
      const response = await authService.signup({
        email,
        password,
        ...userData
      });

      if (response.user) {
        // 2. Upload documents if doctor
        if (role === 'doctor') {
          const userId = response.user.id;
          const documentTypes: string[] = [];
          const formData = new FormData();

          // Append files
          console.log('Files to upload:', Object.keys(uploadedFiles));

          Object.keys(uploadedFiles).forEach((key) => {
            formData.append('documents', uploadedFiles[key]);
            documentTypes.push(key);
          });

          formData.append('documentTypes', JSON.stringify(documentTypes));

          console.log('FormData documentTypes:', JSON.stringify(documentTypes));

          console.log('Preparing to upload files. Count:', Object.keys(uploadedFiles).length);

          if (Object.keys(uploadedFiles).length > 0) {
            try {
              console.log('Sending upload request to backend...');
              const uploadRes = await doctorService.uploadDocuments(userId, formData);
              console.log('Upload response:', uploadRes);

              // Calculate sizes and show confirmation modal
              const fileSummary = Object.keys(uploadedFiles).map(key => ({
                name: uploadedFiles[key].name,
                size: (uploadedFiles[key].size / (1024 * 1024)).toFixed(2)
              }));

              setUploadSummary(fileSummary);
              console.log('SHOWING SUCCESS MODAL NOW with files:', fileSummary);
              setShowSuccessModal(true);
              setIsLoading(false);
              return; // Wait for modal continue
            } catch (uploadErr) {
              console.error('File upload failed but user created:', uploadErr);
              alert('Account created, but some documents failed to upload. Please contact support.');
            }
          }

          setIsSubmittedForApproval(true);
        } else {
          // Patient success
          onLoginSuccess('patient');
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalContinue = () => {
    setShowSuccessModal(false);
    setIsSubmittedForApproval(true);
  };

  const switchToSignup = () => {
    setView('signup');
    setSignupStep(0);
    setError(null);
  };

  const goBackStep = () => {
    if (isSubmittedForApproval) {
      onBack();
      return;
    }
    if (view === 'signup') {
      if (signupStep === 1) {
        setSignupStep(0);
      } else {
        setView('login');
      }
    }
  };

  const selectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setSignupStep(1);
  };

  // Ultra Concise File Upload Component
  const ConciseFileUpload = ({ label, required = true, type, onFileSelect }: { label: string, required?: boolean, type: string, onFileSelect: (file: File) => void }) => {
    const [fileName, setFileName] = useState<string | null>(null);

    return (
      <div className="relative flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white hover:border-brand-400 transition-all cursor-pointer group">
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File is too large. Please upload a file smaller than 5MB.");
                e.target.value = ''; // Reset input
                return;
              }
              setFileName(file.name);
              onFileSelect(file);
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          required={required && !fileName}
          accept="image/*,.pdf"
        />
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 shadow-sm transition-colors ${fileName ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-400 group-hover:text-brand-500'}`}>
            {fileName ? <CheckCircle size={14} /> : <Upload size={14} />}
          </div>
          <div className="min-w-0 flex flex-col">
            <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-brand-700">{label}</p>
            <p className={`text-[10px] ${fileName ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
              {fileName ? 'Ready to Upload' : 'PDF/JPG • Max 5MB'}
            </p>
            {fileName && <p className="text-[9px] text-slate-500 truncate">{fileName}</p>}
          </div>
        </div>
        {required && !fileName && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-400 rounded-full"></span>}
      </div>
    );
  };

  if (isSubmittedForApproval) {
    return <PendingApprovalScreen onLogout={onBack} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row animate-fade-in relative">
      <DoctorRegistrationSuccessModal
        isOpen={showSuccessModal}
        files={uploadSummary}
        onContinue={handleSuccessModalContinue}
      />


      {/* LEFT PANEL: Branding & Image (Fixed on Desktop) */}
      <div className="lg:w-5/12 xl:w-4/12 relative hidden lg:flex flex-col bg-slate-900 text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
            alt="Medical Team"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/80 to-slate-900/90 mix-blend-multiply"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Top: Logo & Back */}
          <div>
            <button
              onClick={onBack}
              className="group flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm font-medium"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-700 shadow-lg">
                <Activity size={20} />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Medi<span className="text-brand-300">Connect</span>
              </span>
            </div>
          </div>

          {/* Bottom: Testimonial/Info */}
          <div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">Secure, Intelligent Healthcare Access.</h2>
            <p className="text-brand-100 leading-relaxed mb-8">
              "MediConnect has revolutionized how I manage my patients. The AI diagnostics are incredibly accurate and save valuable time."
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-900 bg-slate-600 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} className="w-full h-full object-cover" alt="User" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium text-white/80">Trusted by 10k+ Specialists</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Scrollable Form Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto custom-scrollbar bg-slate-50 lg:bg-white">

        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center">
              <Activity size={18} />
            </div>
            <span className="text-lg font-bold">MediConnect</span>
          </div>
          <button onClick={onBack} className="p-2 bg-slate-100 rounded-full text-slate-600">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 max-w-4xl mx-auto w-full">

          {/* Back Button for sub-views (within form area) */}
          {view !== 'login' && (
            <div className="mb-6">
              <button
                onClick={goBackStep}
                className="text-slate-500 hover:text-brand-600 flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          )}

          {/* VIEW 1: LOGIN */}
          {view === 'login' && (
            <div className="animate-fade-in w-full max-w-md mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome Back</h2>
                <p className="text-slate-500">Enter your credentials to access your portal</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email or Mobile Number</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={emailOrMobile}
                      onChange={(e) => setEmailOrMobile(e.target.value)}
                      placeholder="Email or Mobile Number"
                      className="w-full pl-11 pr-4 py-4 rounded-xl bg-white border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-300 font-medium text-lg text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-12 py-4 rounded-xl bg-white border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-300 font-medium text-lg text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-800">Forgot Password?</button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:shadow-brand-600/40 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Login'}
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
            </div>
          )}



          {/* VIEW 3: SIGNUP - ROLE SELECTION */}
          {view === 'signup' && signupStep === 0 && (
            <div className="animate-fade-in w-full">
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-2xl mb-4 text-brand-600">
                  <User size={28} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Choose your profile</h2>
                <p className="text-slate-500 max-w-md mx-auto">Select the account type that best describes you to customize your experience.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {/* Patient Card */}
                <div
                  onClick={() => selectRole('patient')}
                  className="group cursor-pointer bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <User size={36} />
                  </div>
                  <h3 className="relative z-10 font-bold text-xl text-slate-900 mb-2">Patient</h3>
                  <p className="relative z-10 text-sm text-slate-500 leading-snug">Book appointments, view records & consult doctors.</p>
                </div>

                {/* Doctor Card */}
                <div
                  onClick={() => selectRole('doctor')}
                  className="group cursor-pointer bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Stethoscope size={36} />
                  </div>
                  <h3 className="relative z-10 font-bold text-xl text-slate-900 mb-2">Doctor</h3>
                  <p className="relative z-10 text-sm text-slate-500 leading-snug">Manage schedule, patients & provide consultations.</p>
                </div>


              </div>
            </div>
          )}

          {/* VIEW 3: SIGNUP - FORM DETAILS */}
          {view === 'signup' && signupStep === 1 && (
            <div className="animate-fade-in-up w-full">
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{role} Account</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Complete your profile</h2>
                <p className="text-slate-500 mt-2">Please provide your details to finish setting up your account.</p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-8">

                {/* Personal Details Group */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <User size={16} className="text-brand-500" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Sarah"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Surname</label>
                      <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Mitchell"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Age</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="28" min="0" max="120"
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-slate-700 appearance-none bg-white"
                          required
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Security Group */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Lock size={16} className="text-brand-500" /> Account Security
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sarah.m@gmail.com"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create password"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={16} className="text-brand-500" /> Address
                    </h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setAddressMode('manual')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${addressMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressMode('map')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${addressMode === 'map' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
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
                    <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 h-[280px] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer animate-fade-in hover:border-brand-300 transition-colors">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=2662&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-700"></div>
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-600 animate-bounce">
                          <MapPin size={28} className="fill-current" />
                        </div>
                        <button type="button" className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-brand-600 hover:text-white transition-colors flex items-center gap-2">
                          <Navigation size={16} /> Locate Me
                        </button>
                        <p className="text-xs font-medium text-slate-700 bg-white/90 px-3 py-1 rounded-md backdrop-blur-sm">Click to select location on map</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* DOCTOR SPECIFIC SECTION */}
                {role === 'doctor' && (
                  <>
                    {/* PROFESSIONAL EXPERIENCE */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Briefcase size={16} className="text-brand-500" /> Professional Experience
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Current Hospital/Clinic Name</label>
                          <input
                            type="text"
                            value={hospitalName}
                            onChange={(e) => setHospitalName(e.target.value)}
                            placeholder="Apollo Hospital, Bangalore"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                            required={role === 'doctor'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Department/Specialty</label>
                          <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="Cardiology"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                            required={role === 'doctor'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Years of Experience</label>
                          <input
                            type="number"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="5"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                            required={role === 'doctor'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Hospital Location (City)</label>
                          <input
                            type="text"
                            value={hospitalLocation}
                            onChange={(e) => setHospitalLocation(e.target.value)}
                            placeholder="Indiranagar, Bangalore"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400"
                            required={role === 'doctor'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Hospital Website / Contact</label>
                          <div className="relative">
                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="www.apollo.com" className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400" />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Brief Professional Bio</label>
                          <textarea
                            rows={3}
                            value={professionalBio}
                            onChange={(e) => setProfessionalBio(e.target.value)}
                            placeholder="Tell us about your specialization and achievements..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder:text-slate-400 resize-none"
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    {/* PROFESSIONAL DOCUMENTS (Concise List Layout) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <FileText size={16} className="text-brand-500" /> Professional Documents
                        </h3>
                        <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-1 rounded-full font-bold">5 Required</span>
                      </div>

                      <div className="mb-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                        <AlertCircle size={16} className="text-blue-500 shrink-0" />
                        <p className="text-xs text-blue-700 font-medium leading-tight">
                          Upload clear images or PDFs. Admin verification takes 24-48 hours.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ConciseFileUpload
                          label="Provisional Registration Cert"
                          type="provisional_reg"
                          onFileSelect={(file) => {
                            console.log('Selected file for provisional_reg:', file.name);
                            setUploadedFiles(prev => ({ ...prev, provisional_reg: file }));
                          }}
                        />
                        <ConciseFileUpload
                          label="Proof of Identity (Aadhar/Passport)"
                          type="identity_proof"
                          onFileSelect={(file) => {
                            console.log('Selected file for identity_proof:', file.name);
                            setUploadedFiles(prev => ({ ...prev, identity_proof: file }));
                          }}
                        />
                        <ConciseFileUpload
                          label="State Medical Council Cert"
                          type="medical_council"
                          onFileSelect={(file) => {
                            console.log('Selected file for medical_council:', file.name);
                            setUploadedFiles(prev => ({ ...prev, medical_council: file }));
                          }}
                        />
                        <ConciseFileUpload
                          label="Medical Licence"
                          type="medical_license"
                          onFileSelect={(file) => {
                            console.log('Selected file for medical_license:', file.name);
                            setUploadedFiles(prev => ({ ...prev, medical_license: file }));
                          }}
                        />
                        <ConciseFileUpload
                          label="Degree Certificates"
                          type="degree_cert"
                          onFileSelect={(file) => {
                            console.log('Selected file for degree_cert:', file.name);
                            setUploadedFiles(prev => ({ ...prev, degree_cert: file }));
                          }}
                        />

                        {/* Add More Button */}
                        <div className="relative flex items-center justify-center p-3 border border-slate-200 border-dashed rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-600 hover:border-brand-300 cursor-pointer transition-all h-full min-h-[50px] group">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">+</div>
                            <span className="text-xs font-bold">Add Other</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Action */}
                <div className="pt-4 pb-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-brand-600 hover:shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {role === 'doctor' && Object.keys(uploadedFiles).length > 0
                          ? 'Uploading & Creating...'
                          : 'Creating Account...'}
                      </div>
                    ) : (
                      <>
                        {role === 'doctor' ? 'Create Account' : 'Create Account'}
                        {role === 'doctor' ? <Upload size={18} /> : <CheckCircle size={18} />}
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4">
                    By clicking {role === 'doctor' ? 'Create Account' : 'Create Account'}, you agree to our <a href="#" className="underline hover:text-brand-600">Terms</a> and <a href="#" className="underline hover:text-brand-600">Privacy Policy</a>.
                  </p>
                </div>

              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
