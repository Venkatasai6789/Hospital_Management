
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Specialists from './components/Specialists';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

type UserRole = 'patient' | 'doctor' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'patient-dashboard' | 'doctor-dashboard' | 'admin-dashboard'>('landing');
  const [userRole, setUserRole] = useState<UserRole>('patient');

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    if (role === 'doctor') {
      setCurrentView('doctor-dashboard');
    } else if (role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('patient-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentView('landing');
    setUserRole('patient');
  };

  // VIEW: DOCTOR DASHBOARD
  if (currentView === 'doctor-dashboard') {
    return <DoctorDashboard onLogout={handleLogout} />;
  }

  // VIEW: ADMIN DASHBOARD
  if (currentView === 'admin-dashboard') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // VIEW: PATIENT DASHBOARD
  if (currentView === 'patient-dashboard') {
    return <PatientDashboard onLogout={handleLogout} />;
  }

  // VIEW: AUTH PAGE (Login/Signup)
  if (currentView === 'auth') {
    return (
      <AuthPage
        onBack={() => setCurrentView('landing')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // VIEW: LANDING PAGE
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-brand-200 selection:text-brand-900">
      <Navbar onOpenSignup={() => setCurrentView('auth')} />
      <main>
        <Hero onOpenSignup={() => setCurrentView('auth')} />

        {/* Decorative Divider Section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="p-8 md:p-12 rounded-3xl bg-brand-900 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">First consultation is free</h3>
                <p className="text-brand-200">Book your visit today and get a comprehensive dental checkup.</p>
              </div>
              <button
                onClick={() => setCurrentView('auth')}
                className="relative z-10 whitespace-nowrap bg-white text-brand-900 px-8 py-3 rounded-full font-bold hover:bg-brand-50 transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </section>

        <Specialists />
      </main>
      <Footer />
    </div>
  );
};

export default App;
