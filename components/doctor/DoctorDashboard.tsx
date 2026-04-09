
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutGrid,
    Calendar,
    Users,
    LogOut,
    Search,
    Bell,
    Menu,
    X,
    FileText,
    Video,
    Activity,
    ChevronRight,
    Clock,
    MapPin,
    Phone,
    Mail,
    MoreVertical,
    CheckCircle,
    Plus,
    ArrowRight,
    Filter,
    Image as ImageIcon,
    DollarSign,
    Sparkles,
    Navigation,
    Boxes,
    Gauge
} from 'lucide-react';
import {
    DOCTOR_STATS,
    TODAY_SCHEDULE,
    PENDING_REQUESTS,
    HISTORY_LOG,
    ALL_PATIENTS,
    Appointment,
    Patient,
    MOCK_PATIENT_HISTORY,
    MOCK_PATIENT_DOCUMENTS
} from './doctor-data';
import { supabase } from '../../src/lib/supabase';
import JitsiMeet from '../JitsiMeet';
import OperationsResources from './OperationsResources';
import PredictionInsights from './PredictionInsights';
import DiseaseTrends from './DiseaseTrends';

interface DoctorDashboardProps {
    onLogout: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onLogout }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [appointmentTab, setAppointmentTab] = useState<'upcoming' | 'pending' | 'history'>('upcoming');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Patient View State
    const [patientFilter, setPatientFilter] = useState<'All' | 'Active' | 'Recovered' | 'Critical'>('All');
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Appointment | Patient | null>(null);
    const [profileTab, setProfileTab] = useState<'overview' | 'history' | 'documents'>('overview');



    // REAL DATA STATES
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [doctorName, setDoctorName] = useState('Doctor');
    const [doctorSpecialty, setDoctorSpecialty] = useState('');
    const [doctorHospitalName, setDoctorHospitalName] = useState('');
    const [doctorHospitalLocation, setDoctorHospitalLocation] = useState('');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // CONSULTATION STATE
    const [isConsultationActive, setIsConsultationActive] = useState(false);
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
    const [consultationPatient, setConsultationPatient] = useState<Appointment | null>(null);
    const [prescriptionNotes, setPrescriptionNotes] = useState('');
    const [prescriptionMedicines, setPrescriptionMedicines] = useState<{ name: string; dosage: string }[]>([]);
    const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '' });
    const [isSaving, setIsSaving] = useState(false);



    const sidebarItems = [
        { id: 'dashboard', icon: LayoutGrid, label: t('dashboard.overview') },
        { id: 'appointments', icon: Calendar, label: t('doctor.consultations') },
        { id: 'operations-resources', icon: Boxes, label: 'Operations & Resources' },
        { id: 'prediction-insights', icon: Gauge, label: 'Prediction Insights' },
        { id: 'disease-trends', icon: Activity, label: 'Disease Trends' },
        { id: 'patients', icon: Users, label: t('doctor.myPatients') },
    ];



    // FETCH REAL DATA
    useEffect(() => {
        const fetchDoctorData = async () => {
            setIsLoading(true);
            try {
                // 1. Session Sync (Copied from PatientDashboard logic)
                const storedSession = localStorage.getItem('supabase_session');
                if (storedSession) {
                    try {
                        const parsedSession = JSON.parse(storedSession);
                        if (parsedSession && parsedSession.access_token && parsedSession.refresh_token) {
                            const { error } = await supabase.auth.setSession({
                                access_token: parsedSession.access_token,
                                refresh_token: parsedSession.refresh_token
                            });
                            if (error) console.error("Error setting session from storage:", error);
                        }
                    } catch (e) {
                        console.error("Error parsing stored session:", e);
                    }
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    console.log("✅ Current User (Doctor):", user.email);
                    // 2. Fetch Doctor Profile
                    const { data: doctor, error: docError } = await supabase
                        .from('doctors')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (doctor) {
                        console.log("✅ Doctor Profile Found:", doctor.first_name);
                        setDoctorId(doctor.id);
                        setDoctorName(`Dr. ${doctor.first_name} ${doctor.surname}`);
                        setDoctorSpecialty(doctor.specialty);
                        setDoctorHospitalName(doctor.hospital_name || '');
                        setDoctorHospitalLocation(doctor.hospital_location || '');

                        // 3. Fetch Appointments with inner join to ensure patient data exists
                        const { data: appts, error: apptError } = await supabase
                            .from('appointments')
                            .select('*, patient:patients(*)')
                            .eq('doctor_id', doctor.id)
                            .order('date', { ascending: true });

                        if (appts) {
                            console.log(`✅ Fetched ${appts.length} appointments`);
                            const mapped: Appointment[] = appts.map((a: any) => {
                                // Default status to 'Upcoming' if missing or ensure proper case
                                const rawStatus = a.status ? a.status.toLowerCase() : 'upcoming';
                                const formattedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

                                return {
                                    id: a.id,
                                    time: a.time ? (a.time.substring(0, 5) + (parseInt(a.time.substring(0, 2)) >= 12 ? ' PM' : ' AM')) : '00:00',
                                    date: a.date,
                                    patientId: a.patient ? `#P-${a.patient.id.substring(0, 4)}` : '#P-UNKNOWN',
                                    patientName: a.patient ? `${a.patient.first_name} ${a.patient.surname}` : 'Unknown Patient',
                                    patientImage: a.patient ? `https://ui-avatars.com/api/?name=${a.patient.first_name}+${a.patient.surname}&background=random` : 'https://ui-avatars.com/api/?name=Unknown&background=gray',
                                    age: a.patient?.age || 25, // Mock if not in DB
                                    gender: a.patient?.gender || 'N/A',
                                    type: a.type === 'video' ? 'Video Call' : 'In-Clinic',
                                    reason: a.notes || 'General Consultation',
                                    status: formattedStatus as any, // 'Upcoming' | 'Pending' | 'Completed' | 'Cancelled'
                                    symptoms: [],
                                    // EXTRACTED REAL CONTACT INFO
                                    phone: a.patient?.phone || '+91 N/A',
                                    email: a.patient?.email || 'patient@email.com',
                                    bloodType: a.patient?.blood_type || 'O+'
                                };
                            });
                            setAppointments(mapped);

                            // 4. Extract Unique Patients
                            const uniquePatientsMap = new Map();
                            mapped.forEach(apt => {
                                // Always update to keep the latest appointment data (since list is sorted by date asc)
                                // This ensures 'condition' and 'reason' reflect the most recent context.
                                if (apt.patientName !== 'Unknown Patient') {
                                    uniquePatientsMap.set(apt.patientId, {
                                        id: apt.id, // ID of the latest appointment
                                        patientId: apt.patientId,
                                        name: apt.patientName,
                                        image: apt.patientImage,
                                        age: apt.age,
                                        gender: apt.gender,
                                        condition: apt.reason, // Latest reason/notes
                                        lastVisit: apt.date, // Latest date (future or past)
                                        status: apt.status === 'Upcoming' ? 'Active' : 'Recovered', // Simple status derivation
                                        phone: apt.phone || '+91 98765 43210', // Use real phone or fallback
                                        email: apt.email || 'patient@email.com', // Use real email or fallback
                                        bloodType: apt.bloodType || 'O+'
                                    });
                                }
                            });
                            setPatients(Array.from(uniquePatientsMap.values()));
                        } else {
                            if (apptError) console.error("❌ Error fetching appointments:", apptError);
                        }
                    } else {
                        console.error("❌ Doctor profile not found in 'doctors' table for user:", user.id);
                        if (docError) console.error("Doctor fetch error:", docError);
                    }
                } else {
                    console.log("No user found in auth.getUser(), skipping data fetch.");
                }
            } catch (error) {
                console.error("Error in fetchDoctorData:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDoctorData();
    }, []);

    const handleOpenPatientProfile = (data: Appointment | Patient) => {
        setSelectedPatient(data);
        setProfileTab('overview');
    };

    const closePatientProfile = () => {
        setSelectedPatient(null);
    };



    // --- VIDEO CALL HANDLERS ---
    const handleJoinCall = async (appointment: Appointment) => {
        try {
            // 1. Check expiration (Client-side pre-check)
            // Assuming appointment has date/time, we can check basic validity
            const apptDate = new Date(`${appointment.date}T${appointment.time.replace(' AM', '').replace(' PM', '')}`); // Rough check
            // For now, relies on Backend for strict check.

            // 2. Generate/Get Link from Backend
            const response = await fetch('http://localhost:5000/api/video/generate-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    userId: doctorId
                })
            });

            const data = await response.json();

            if (data.success) {
                setActiveCallRoom(data.roomId);
                setConsultationPatient(appointment);
                setIsConsultationActive(true);
                setIsVideoEnded(false);
            } else {
                alert(`Error: ${data.message || 'Could not join call'}`);
            }
        } catch (error) {
            console.error("Error joining call:", error);
            alert("Failed to connect to video service.");
        }
    };

    // Called when user hangs up via Jitsi UI or connection drops
    // Called when user hangs up via Jitsi UI or connection drops
    const handleJitsiLeft = useCallback(() => {
        // Do NOT close the modal, just mark video as ended so they can finish notes
        setIsVideoEnded(true);
    }, []);

    // Called when doctor manually clicks "Save & Close"
    const handleSaveAndClose = async () => {
        if (!consultationPatient) return;

        if (confirm("Save prescription and end consultation?")) {
            setIsSaving(true);
            try {
                // 1. Prepare Data
                const prescriptionData = JSON.stringify({
                    diagnosis: prescriptionNotes,
                    medicines: prescriptionMedicines,
                    date: new Date().toISOString()
                });

                // 2. Update Appointment in DB
                const { error } = await supabase
                    .from('appointments')
                    .update({
                        status: 'completed',
                        notes: prescriptionData
                    })
                    .eq('id', consultationPatient.id);

                if (error) throw error;

                // 3. Close UI
                setIsConsultationActive(false);
                setActiveCallRoom(null);
                setConsultationPatient(null);
                setPrescriptionNotes('');
                setPrescriptionMedicines([]);

                // 4. Refresh List
                // In a real app, you'd refetch appointments here
                setAppointments(prev => prev.map(a => a.id === consultationPatient.id ? { ...a, status: 'Completed', type: 'Video Call' } : a));

            } catch (error) {
                console.error("Error saving prescription:", error);
                alert("Failed to save record. Please try again.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const addMedicine = () => {
        if (newMedicine.name && newMedicine.dosage) {
            setPrescriptionMedicines([...prescriptionMedicines, newMedicine]);
            setNewMedicine({ name: '', dosage: '' });
        }
    };

    // Helper to get normalized data from either Appointment or Patient type
    const getPatientDisplayData = (data: Appointment | Patient) => {
        if ('patientName' in data) {
            return {
                name: data.patientName,
                id: data.patientId,
                image: data.patientImage,
                reason: data.reason,
                age: data.age,
                gender: data.gender,
                email: data.email || data.patientName.toLowerCase().replace(' ', '.') + '@email.com',
                phone: data.phone || '+91 98765 43210',
                bloodType: data.bloodType || 'O+',
                visitTime: data.time,
                visitType: data.type,
                symptoms: data.symptoms
            };
        } else {
            return {
                name: data.name,
                id: data.patientId,
                image: data.image,
                reason: data.condition,
                age: data.age,
                gender: data.gender,
                email: data.email,
                phone: data.phone,
                bloodType: data.bloodType,
                visitTime: null,
                visitType: null,
                symptoms: []
            };
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesFilter = patientFilter === 'All' || p.status === patientFilter;
        const matchesSearch = p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.patientId.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.condition.toLowerCase().includes(patientSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });



    // Derived appointment lists
    const todaySchedule = appointments.filter(a => a.status === 'Upcoming');
    const pendingRequests = appointments.filter(a => a.status === 'Pending');
    const historyLog = appointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden">

            {/* DESKTOP SIDEBAR */}
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:flex flex-col w-[260px] h-screen fixed left-0 top-0 bg-white/80 backdrop-blur-xl border-r border-slate-100 z-40">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                            <Activity size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                                MediConnect
                            </span>
                            <span className="text-xs font-medium text-brand-600 tracking-wider uppercase">{t('doctor.portal')}</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${activeTab === item.id
                                ? 'bg-brand-50 text-brand-600 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} className={activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2 group-hover:stroke-[2.5px]'} />
                                {item.label}
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-gradient-to-br from-brand-50 to-white p-3 rounded-2xl border border-brand-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                            <img src={`https://ui-avatars.com/api/?name=${doctorName.replace('Dr. ', '').replace(' ', '+')}&background=e2e8f0&color=475569`} alt="Doctor Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{doctorName}</p>
                            <p className="text-xs text-brand-500 truncate">{doctorSpecialty || 'Doctor'}</p>
                        </div>
                        <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE HEADER & MENU */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center">
                        <Activity size={18} />
                    </div>
                    <span className="font-bold text-slate-900">MediConnect</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 px-6 animate-fade-in">
                    <nav className="space-y-2">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-medium ${activeTab === item.id ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
                                    }`}
                            >
                                <item.icon size={24} />
                                {item.label}
                            </button>
                        ))}
                        <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-bold text-red-500 mt-8 bg-red-50">
                            <LogOut size={24} /> {t('dashboard.logout')}
                        </button>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 lg:pl-[260px] w-full h-screen overflow-hidden relative max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
                {/* Standard wrapper for non-message tabs to match Patient Dashboard padding/layout */}
                <div className={`${isConsultationActive ? 'h-full' : 'p-4 md:p-8 pt-20 lg:pt-8 h-full'}`}>

                    {/* --- CONSULTATION VIEW (SPLIT SCREEN) --- */}
                    {isConsultationActive && activeCallRoom && consultationPatient && (
                        <div className="h-full flex flex-col lg:flex-row bg-slate-900 animate-fade-in fixed inset-0 z-[60]">
                            {/* VIDEO AREA */}
                            <div className="flex-1 relative h-full flex flex-col items-center justify-center bg-slate-900">
                                {!isVideoEnded ? (
                                    <>
                                        <JitsiMeet
                                            roomName={activeCallRoom}
                                            displayName={doctorName}
                                            onLeave={handleJitsiLeft}
                                            className="h-full w-full"
                                        />
                                        <button
                                            onClick={() => setIsVideoEnded(true)}
                                            className="absolute top-6 right-6 z-10 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                                        >
                                            <Phone size={18} className="rotate-[135deg]" /> {t('doctor.hangUp')}
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-8 animate-fade-in-up">
                                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                                            <Phone size={32} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{t('doctor.callEnded')}</h2>
                                        <p className="text-slate-400 mb-8">{t('doctor.callEndedMsg')}</p>
                                    </div>
                                )}
                            </div>

                            {/* EXAM / PRESCRIPTION PANEL */}
                            <div className="w-full lg:w-[400px] bg-white h-1/3 lg:h-full overflow-y-auto p-6 shadow-2xl flex flex-col gap-6">
                                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                    <img src={consultationPatient.patientImage} alt="Patient" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{consultationPatient.patientName}</h2>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span>{consultationPatient.age} Yrs</span>
                                            <span>•</span>
                                            <span>{consultationPatient.gender}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DIAGNOSIS & NOTES */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('doctor.clinicalNotes')}</label>
                                    <textarea
                                        value={prescriptionNotes}
                                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                                        placeholder="Enter observations, diagnosis, and patient instructions..."
                                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                                    ></textarea>
                                </div>

                                {/* MEDICINES */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('doctor.proscription')}</label>

                                    <div className="space-y-3 mb-4">
                                        {prescriptionMedicines.map((med, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-brand-50 p-3 rounded-lg border border-brand-100">
                                                <div>
                                                    <p className="font-bold text-brand-900 text-sm">{med.name}</p>
                                                    <p className="text-xs text-brand-600">{med.dosage}</p>
                                                </div>
                                                <button onClick={() => setPrescriptionMedicines(prev => prev.filter((_, i) => i !== idx))} className="text-brand-400 hover:text-red-500">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Medicine Name"
                                            value={newMedicine.name}
                                            onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Dosage"
                                            value={newMedicine.dosage}
                                            onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                                            className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        />
                                        <button onClick={addMedicine} className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveAndClose}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-auto disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>{t('common.loading')}</>
                                    ) : (
                                        <><CheckCircle size={20} /> {t('doctor.saveAndClose')}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* VIEW: OVERVIEW (DASHBOARD) */}
                    {!isConsultationActive && (
                        // ... (Rest of the Dashboard Logic from previous steps, truncated here for brevity as we are only updating Messages UI)
                        // Re-pasting the existing logic for non-message tabs to ensure file integrity.

                        <div className="animate-fade-in">
                            {/* HEADER FOR NON-MESSAGES TABS */}
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm py-2">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                        {activeTab === 'dashboard' ? `${t('doctor.goodMorning')}, ${doctorName}` :
                                            activeTab === 'appointments' ? t('doctor.consultations') :
                                                activeTab === 'operations-resources' ? 'Operations & Resources' :
                                                activeTab === 'prediction-insights' ? 'Prediction Insights' :
                                                activeTab === 'disease-trends' ? 'Disease Trends' :
                                                activeTab === 'patients' ? t('doctor.myPatients') : t('dashboard.overview')}
                                    </h1>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {activeTab === 'dashboard' ? `${t('doctor.dailySummary')} ${new Date().toDateString()}.` :
                                            activeTab === 'appointments' ? t('doctor.manageSchedule') :
                                                activeTab === 'operations-resources' ? 'Track beds, staffing, and predicted inflow in real time.' :
                                                activeTab === 'prediction-insights' ? 'Predict today patient overflow using realtime free APIs and detailed reason analysis.' :
                                                activeTab === 'disease-trends' ? 'Monitor realtime disease trends with graphical surveillance insights.' :
                                                t('doctor.viewRecords')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {activeTab !== 'dashboard' && (
                                        <div className="relative group">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={activeTab === 'patients' ? patientSearch : ''}
                                                onChange={(e) => activeTab === 'patients' && setPatientSearch(e.target.value)}
                                                placeholder="Search..."
                                                className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition-all w-64 shadow-sm"
                                            />
                                        </div>
                                    )}
                                    <button className="relative w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all shadow-sm">
                                        <Bell size={18} />
                                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                    </button>
                                </div>
                            </header>

                            {/* DASHBOARD STATS */}
                            {/* DASHBOARD STATS */}
                            {activeTab === 'dashboard' && (
                                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    {[
                                        { label: t('doctor.totalPatients'), value: patients.length.toString(), icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
                                        { label: t('dashboard.upcomingAppointments'), value: appointments.length.toString(), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
                                        { label: t('doctor.consultations'), value: appointments.filter(a => a.type === 'Video Call').length.toString(), icon: Video, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: t('doctor.revenue'), value: `₹${(appointments.length * 500).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-brand-200 shadow-sm hover:shadow-lg hover:shadow-brand-500/5 transition-all flex flex-col justify-between h-[160px] group cursor-default relative overflow-hidden">
                                            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                                            <div className="flex justify-between items-start z-10">
                                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                                    <stat.icon size={24} className="stroke-[2.5px]" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">+2.5%</span>
                                            </div>
                                            <div className="z-10">
                                                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                                                <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            )}

                            {/* MAIN CONTENT GRIDS FOR NON-MESSAGE TABS */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                                {activeTab === 'operations-resources' && (
                                    <div className="xl:col-span-3">
                                        <OperationsResources
                                            doctorName={doctorName}
                                            hospitalName={doctorHospitalName}
                                            hospitalLocation={doctorHospitalLocation}
                                            specialty={doctorSpecialty}
                                        />
                                    </div>
                                )}

                                {activeTab === 'prediction-insights' && (
                                    <div className="xl:col-span-3">
                                        <PredictionInsights
                                            doctorName={doctorName}
                                            hospitalName={doctorHospitalName}
                                            hospitalLocation={doctorHospitalLocation}
                                            specialty={doctorSpecialty}
                                        />
                                    </div>
                                )}

                                {activeTab === 'disease-trends' && (
                                    <div className="xl:col-span-3">
                                        <DiseaseTrends
                                            doctorName={doctorName}
                                            hospitalName={doctorHospitalName}
                                            hospitalLocation={doctorHospitalLocation}
                                            specialty={doctorSpecialty}
                                        />
                                    </div>
                                )}

                                {/* --- SCHEDULE / APPOINTMENTS LIST --- */}
                                {activeTab !== 'patients' && activeTab !== 'operations-resources' && activeTab !== 'prediction-insights' && activeTab !== 'disease-trends' && (
                                    <div className="xl:col-span-2 space-y-6">
                                        {(activeTab === 'dashboard' || activeTab === 'appointments') && (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-bold text-slate-900">
                                                        {activeTab === 'appointments' ?
                                                            (appointmentTab === 'upcoming' ? t('dashboard.upcomingAppointments') : appointmentTab === 'pending' ? t('doctor.pendingReq') : t('doctor.history'))
                                                            : t('doctor.todaySchedule')}
                                                    </h3>
                                                    {activeTab === 'dashboard' && (
                                                        <button onClick={() => setActiveTab('appointments')} className="text-brand-600 font-bold text-sm hover:underline">View All</button>
                                                    )}
                                                    {activeTab === 'appointments' && (
                                                        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                                                            {['upcoming', 'pending', 'history'].map((tab) => (
                                                                <button
                                                                    key={tab}
                                                                    onClick={() => setAppointmentTab(tab as any)}
                                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${appointmentTab === tab
                                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-700'
                                                                        }`}
                                                                >
                                                                    {tab === 'upcoming' ? t('dashboard.upcomingAppointments') : tab === 'pending' ? t('doctor.pendingReq') : t('doctor.history')}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    {/* TODAY'S SCHEDULE LIST */}
                                                    {(activeTab === 'dashboard' || (activeTab === 'appointments' && appointmentTab === 'upcoming')) && todaySchedule.map((apt) => (
                                                        <div key={apt.id} onClick={() => handleOpenPatientProfile(apt)} className={`relative overflow-hidden rounded-[2rem] shadow-xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.01] cursor-pointer ${apt.type === 'Video Call' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/20' : 'bg-white border border-slate-200 text-slate-900 shadow-slate-200/50'}`}>
                                                            {apt.type === 'Video Call' && <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}

                                                            <div className="relative z-10">
                                                                <div className="flex items-start justify-between mb-6">
                                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${apt.type === 'Video Call' ? 'bg-white/20 backdrop-blur-md border-white/20' : 'bg-brand-50 text-brand-700 border-brand-100'}`}>
                                                                        {apt.type === 'Video Call' ? <Video size={12} /> : <MapPin size={12} />}
                                                                        {apt.type}
                                                                    </div>
                                                                    <div className={`w-10 h-10 rounded-full border-2 overflow-hidden ${apt.type === 'Video Call' ? 'border-white/30 bg-white/10' : 'border-slate-100'}`}>
                                                                        <img src={apt.patientImage} alt="Patient" className="w-full h-full object-cover" />
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-2xl font-bold mb-1">{apt.patientName}</h3>
                                                                <p className={`text-sm ${apt.type === 'Video Call' ? 'text-indigo-100' : 'text-slate-500'} line-clamp-2`}>
                                                                    {(() => {
                                                                        try {
                                                                            const parsed = JSON.parse(apt.reason || '{}');
                                                                            // User wants "correct symptoms" shown here, e.g. "i feel dizzines"
                                                                            if (parsed.symptoms) return parsed.symptoms;
                                                                            if (parsed.disease) return `Suspected: ${parsed.disease}`;
                                                                            return apt.reason;
                                                                        } catch (e) {
                                                                            return apt.reason;
                                                                        }
                                                                    })()}
                                                                    {' '}• {apt.age} Years • {apt.gender}
                                                                </p>
                                                            </div>

                                                            <div className={`relative z-10 mt-6 rounded-xl p-3 flex items-center justify-between ${apt.type === 'Video Call' ? 'bg-black/10 backdrop-blur-sm' : 'bg-slate-50 border border-slate-100'}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apt.type === 'Video Call' ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                                                        <Clock size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className={`text-xs font-medium ${apt.type === 'Video Call' ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(apt.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                                                        <p className={`font-bold ${apt.type === 'Video Call' ? 'text-white' : 'text-slate-900'}`}>{apt.time}</p>
                                                                    </div>
                                                                </div>
                                                                {apt.type === 'Video Call' ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleJoinCall(apt);
                                                                        }}
                                                                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors z-20 relative"
                                                                    >
                                                                        {t('dashboard.joinCall')}
                                                                    </button>
                                                                ) : (
                                                                    <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-1">
                                                                        <CheckCircle size={12} /> {t('doctor.checkIn')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* PENDING REQUESTS VIEW */}
                                                    {activeTab === 'appointments' && appointmentTab === 'pending' && pendingRequests.map((req) => (
                                                        <div key={req.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-300 transition-all flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up">
                                                            <div className="flex-1 flex items-center gap-4 w-full">
                                                                <img src={req.patientImage} className="w-12 h-12 rounded-xl object-cover" alt={req.patientName} />
                                                                <div>
                                                                    <h3 className="text-base font-bold text-slate-900">{req.patientName || 'Unknown Request'}</h3>
                                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide max-w-[200px] truncate">
                                                                            {(() => {
                                                                                try {
                                                                                    const parsed = JSON.parse(req.reason || '{}');
                                                                                    if (parsed.symptoms) return parsed.symptoms;
                                                                                    if (parsed.disease) return parsed.disease;
                                                                                    return req.reason;
                                                                                } catch (e) {
                                                                                    return req.reason;
                                                                                }
                                                                            })()}
                                                                        </span>
                                                                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><Clock size={10} /> {req.time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 w-full sm:w-auto">
                                                                <button className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors">{t('doctor.decline')}</button>
                                                                <button className="flex-1 sm:flex-none px-4 py-2 bg-brand-600 text-white font-bold rounded-lg text-xs hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-colors">{t('doctor.accept')}</button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* HISTORY VIEW */}
                                                    {activeTab === 'appointments' && appointmentTab === 'history' && historyLog.map((hist) => (
                                                        <div key={hist.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 opacity-80 hover:opacity-100 transition-opacity animate-fade-in-up">
                                                            <div className="flex-1 flex items-center gap-4 w-full">
                                                                <img src={hist.patientImage} className="w-14 h-14 rounded-2xl object-cover grayscale" alt={hist.patientName} />
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-slate-900">{hist.patientName}</h3>
                                                                    <p className="text-sm text-slate-500">{hist.date} • {hist.time}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${hist.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                                    {hist.status}
                                                                </span>
                                                                <button className="text-brand-600 text-sm font-bold hover:underline">{t('doctor.viewReport')}</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* --- SIDEBAR WIDGETS (Only on Dashboard) --- */}
                                {activeTab === 'dashboard' && (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                            {t('doctor.pendingReq')}
                                        </h3>
                                        <div className="space-y-4">
                                            {pendingRequests.length === 0 ? (
                                                <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                                                    <p className="text-slate-400 text-sm font-medium">{t('doctor.noPendingReq')}</p>
                                                </div>
                                            ) : pendingRequests.map((req) => (
                                                <div key={req.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <img src={req.patientImage} alt={req.patientName} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-slate-900 truncate">{req.patientName || 'Unknown'}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{req.time}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mb-4 line-clamp-2">{req.reason}</p>
                                                    <div className="flex gap-2">
                                                        <button className="flex-1 bg-brand-600 text-white py-2 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 active:scale-95 text-xs">
                                                            {t('doctor.accept')}
                                                        </button>
                                                        <button className="flex-1 bg-white text-slate-500 border border-slate-200 py-2 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors active:scale-95 text-xs">
                                                            {t('doctor.decline')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* --- MY PATIENTS VIEW --- */}
                                {activeTab === 'patients' && (
                                    <div className="xl:col-span-3">
                                        {/* Filters */}
                                        <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
                                            <div className="flex gap-2">
                                                {['All', 'Active', 'Recovered', 'Critical'].map((filter) => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => setPatientFilter(filter as any)}
                                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${patientFilter === filter
                                                            ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                                                            }`}
                                                    >
                                                        {t(`common.${filter.toLowerCase()}`) || filter}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Patients List Grid Layout */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredPatients.map((patient) => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => handleOpenPatientProfile(patient)}
                                                    className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all p-6 cursor-pointer group relative overflow-hidden flex flex-col"
                                                >
                                                    {/* Status Badge */}
                                                    <div className="absolute top-6 right-6 z-10">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${patient.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            patient.status === 'Recovered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                'bg-red-50 text-red-600 border-red-100'
                                                            }`}>
                                                            {patient.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="relative">
                                                            <img src={patient.image} alt={patient.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300" />
                                                            {patient.status === 'Active' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full"></div>}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">{patient.name}</h4>
                                                            <p className="text-xs text-slate-500 font-medium">{patient.patientId}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{t('doctor.ageGender')}</p>
                                                            <p className="font-bold text-slate-900 text-sm">{patient.age} / {patient.gender}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{t('doctor.condition')}</p>
                                                            <p className="font-bold text-slate-900 text-sm truncate">{patient.condition}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-slate-400" />
                                                            <p className="text-xs font-bold text-slate-500">{t('doctor.lastVisit')}: <span className="text-slate-900">{patient.lastVisit}</span></p>
                                                        </div>
                                                        <button className="w-8 h-8 rounded-full bg-slate-50 md:bg-white md:border md:border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-all">
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {filteredPatients.length === 0 && (
                                            <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                    <Users size={32} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">{t('doctor.noPatientsFound')}</h3>
                                                <p className="text-slate-500">{t('doctor.searchHint')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* PATIENT PROFILE MODAL */}
            {
                selectedPatient && (() => {
                    const data = getPatientDisplayData(selectedPatient);
                    return (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-hidden">
                            <div className="bg-white w-full max-w-5xl h-[85vh] max-h-[800px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up relative">
                                {/* Sidebar Side */}
                                <div className="w-full md:w-[320px] bg-slate-50 border-r border-slate-200 p-8 flex flex-col h-full overflow-y-auto custom-scrollbar text-center shrink-0">
                                    <div className="mb-8">
                                        <div className="w-28 h-28 mx-auto rounded-full p-1 border-2 border-brand-200 relative mb-4">
                                            <img src={data.image} className="w-full h-full rounded-full object-cover" alt={data.name} />
                                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{data.name}</h2>
                                        <p className="text-brand-600 font-bold text-sm mt-1">{data.id}</p>
                                    </div>

                                    <div className="space-y-6 mb-8 text-left">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('doctor.contactInfo')}</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                                    <Phone size={16} className="text-slate-400" /> {data.phone}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                                    <Mail size={16} className="text-slate-400" /> <span className="truncate">{data.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-3">{t('doctor.vitals')}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t('doctor.bp')}</p>
                                                    <p className="text-lg font-bold text-slate-900">118/75</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t('doctor.weight')}</p>
                                                    <p className="text-lg font-bold text-slate-900">65kg</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t('doctor.height')}</p>
                                                    <p className="text-lg font-bold text-slate-900">170cm</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t('doctor.blood')}</p>
                                                    <p className="text-lg font-bold text-slate-900">{data.bloodType}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={closePatientProfile}
                                        className="mt-auto w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        {t('doctor.closeProfile')}
                                    </button>
                                </div>

                                {/* Right Panel - Main Content */}
                                <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
                                    <div className="px-8 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                                        <div className="flex gap-6">
                                            {['overview', 'history', 'documents'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setProfileTab(tab as any)}
                                                    className={`pb-3 text-sm font-bold capitalize relative transition-all ${profileTab === tab ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                                                        }`}
                                                >
                                                    {t(`dashboard.${tab}`) || tab}
                                                    {profileTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full"></div>}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs text-slate-400 font-bold uppercase">{t('doctor.lastVisit')}</p>
                                            <p className="text-sm font-bold text-slate-900">{data.visitTime ? `${data.visitTime}` : 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                        {profileTab === 'overview' && (
                                            <div className="space-y-8 animate-fade-in">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <Activity className="text-brand-600" size={20} /> AI Medical Assessment
                                                    </h3>
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                                    <Sparkles size={20} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900">{t('doctor.aiAssessment')}</h4>
                                                                    <p className="text-xs text-slate-500">{t('doctor.aiAssessmentSub')}</p>
                                                                </div>
                                                            </div>
                                                            {(() => {
                                                                try {
                                                                    const aiData = JSON.parse(selectedPatient.reason || "{}");
                                                                    if (aiData.symptoms || aiData.doctorReport) {
                                                                        return (
                                                                            <div className="space-y-4">
                                                                                {aiData.symptoms && (
                                                                                    <div>
                                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('doctor.reportedSymptoms')}</p>
                                                                                        <p className="text-sm font-semibold text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60 italic">"{aiData.symptoms}"</p>
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex gap-4">
                                                                                    <div className="flex-1">
                                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('doctor.suspectedCondition')}</p>
                                                                                        <p className="font-bold text-brand-900">{aiData.disease || 'Undetected'}</p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('doctor.confidence')}</p>
                                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${parseFloat(aiData.confidence) > 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                                            {aiData.confidence || 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('doctor.clinicalAnalysis')}</p>
                                                                                    <div className="text-sm leading-relaxed text-slate-600">
                                                                                        {aiData.doctorReport}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        throw new Error("Not structured data");
                                                                    }
                                                                } catch (e) {
                                                                    return selectedPatient.reason || "No specific AI symptoms reported for this visit.";
                                                                }
                                                            })()}
                                                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 mb-3">
                                                                <span className="text-xs font-bold text-slate-400 uppercase">{t('doctor.doctorsNotes')}</span>
                                                            </div>
                                                            <textarea
                                                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition-all resize-none h-32"
                                                                placeholder={t('doctor.enterObservations') || "Add clinical notes..."}
                                                            ></textarea>
                                                            <div className="flex justify-end mt-3">
                                                                <button className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/30">
                                                                    {t('doctor.saveNotes')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {data.visitTime && (
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                            <Calendar className="text-brand-600" size={20} /> {t('doctor.appointmentInfo')}
                                                        </h3>
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date</p>
                                                                <p className="font-bold text-slate-900">{data.visitTime ? 'Today' : 'N/A'}</p>
                                                            </div>
                                                            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Time</p>
                                                                <p className="font-bold text-slate-900">{data.visitTime || 'N/A'}</p>
                                                            </div>
                                                            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Type</p>
                                                                <p className="font-bold text-slate-900">{data.visitType || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {profileTab === 'history' && (
                                            <div className="space-y-6 animate-fade-in pb-4">
                                                {(() => {
                                                    const patientHistory = appointments.filter(a =>
                                                        a.patientId === data.id && (a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'Upcoming')
                                                    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                                    if (patientHistory.length === 0) {
                                                        return (
                                                            <div className="text-center p-8 bg-slate-50 rounded-[2rem]">
                                                                <p className="text-slate-500">{t('doctor.noHistory')}</p>
                                                            </div>
                                                        );
                                                    }

                                                    return patientHistory.map((item) => (
                                                        <div key={item.id} className="relative pl-8 pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${item.status === 'Completed' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="text-lg font-bold text-slate-900">{item.reason || 'Consultation'}</h4>
                                                                    <span className="text-xs font-bold text-slate-400">{item.date}</span>
                                                                </div>
                                                                <p className="text-xs font-bold text-brand-600 mb-3">{doctorName}</p>
                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                                                                    {t('common.status')}: {item.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}

                                        {profileTab === 'documents' && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                                                {MOCK_PATIENT_DOCUMENTS.map((doc) => (
                                                    <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer text-center flex flex-col items-center justify-center h-48">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                                            <FileText size={24} />
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 text-sm mb-1">{doc.title}</h4>
                                                        <p className="text-xs text-slate-400">{doc.date}</p>
                                                        <button className="mt-4 text-xs font-bold text-brand-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {t('doctor.viewDocument')} <ArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center h-48 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all text-slate-400 hover:text-brand-600">
                                                    <Plus size={32} className="mb-2" />
                                                    <span className="text-sm font-bold">{t('doctor.uploadNew')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
};

export default DoctorDashboard;
