import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../src/lib/supabase';
import ChatBot from './ChatBot';
import JitsiMeet from './JitsiMeet';
import HospitalSuggestionSection from './HospitalSuggestionSection';
import {
    LayoutGrid,
    Stethoscope,
    TestTube,
    Pill,
    FileText,
    BrainCircuit,
    LogOut,
    Menu,
    X,
    Search,
    Mic,
    Bell,
    FlaskConical,
    Video,
    MessageCircle,
    Thermometer,
    Snowflake,
    Smile,
    Zap,
    Activity,
    Calendar,
    Clock,
    MapPin,
    Download,
    FileCheck,
    Bone,
    Eye,
    Heart,
    Send,
    Star,
    Filter,
    Check,
    CreditCard,
    Receipt,
    Navigation,
    ChevronRight,
    Phone,
    ShoppingCart,
    Minus,
    Plus,
    Trash2,
    Info,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    ShieldCheck,
    ShoppingBag,
    Truck,
    Package,
    Image as ImageIcon,
    File,
    CheckCircle,
    Loader2,
    Sparkles
} from 'lucide-react';
import { pharmacyService } from '../src/services/pharmacyService';
import LabTestDetails, { LabTest } from './LabTestDetails';
import LabReceipt from './LabReceipt';

interface PatientDashboardProps {
    onLogout: () => void;
}

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    hospital: string;
    rating: number;
    reviews: number;
    experience: string;
    image: string;
    nextAvailable: string;
    price: number;
    location: string;
    distance: string;
    travelTime: string;
}

interface PharmacyMedicine {
    id: string;
    name: string;
    genericName?: string;
    type: string;
    price: number;
    originalPrice: number;
    discount: number;
    image: string;
    category: string;
    manufacturer: string;
    dosage: string;
    packSize: string;
    description: string;
    mechanismOfAction?: string; // AI Enhanced Description
    isGeneric?: boolean;
}

interface HealthReport {
    id: string;
    title: string;
    type: string;
    date: string;
    doctorOrLab: string;
    fileType: string;
    fileSize: string;
    rawNotes?: any; // To store parsed AI notes
}

const MOCK_ALL_DOCTORS: Doctor[] = [];
// NOTE: for brevity in this replace call I will not copy all mock lines, assuming I can use multi_replace or just insert the logic.
// Actually, `replace_file_content` requires exact match.
// Accessing the file content again to be sure I match exactly.



// --- TYPES ---
interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text?: string;
    type: 'text' | 'doctor-recommendation';
    doctors?: Doctor[];
    categoryRecommended?: string;
}

interface Appointment {
    id: string;
    doctorId: string;
    doctorName: string;
    doctorImage: string;
    specialty: string;
    hospital: string;
    date: string;
    time: string;
    type: 'video' | 'clinic';
    status: 'Upcoming' | 'Completed';
    travelTime?: string; // Only for clinic
}

interface PaymentReceipt {
    transactionId: string;
    date: string;
    doctorName: string;
    amount: number;
    status: 'Success';
    description: string;
}

interface Interaction {
    id: string;
    doctorName: string;
    doctorImage: string;
    date: string;
    type: 'Chat' | 'Video Call';
    summary: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ onLogout }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    const MEDICINE_PAGE_SIZE = 24;

    // --- LOCALIZED DATA ---
    const SYMPTOMS_LIST = React.useMemo(() => [
        { id: 'fever', label: t('dashboard.symptoms.fever_label'), icon: Thermometer, color: 'text-rose-500', bg: 'bg-rose-50', category: 'General Physician' },
        { id: 'cold', label: t('dashboard.symptoms.cold_label'), icon: Snowflake, color: 'text-sky-500', bg: 'bg-sky-50', category: 'General Physician' },
        { id: 'stomach', label: t('dashboard.symptoms.stomach_label'), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', category: 'General Physician' },
        { id: 'headache', label: t('dashboard.symptoms.headache_label'), icon: BrainCircuit, color: 'text-purple-500', bg: 'bg-purple-50', category: 'Neurologist' },
        { id: 'dental', label: t('dashboard.symptoms.dental_label'), icon: Smile, color: 'text-teal-500', bg: 'bg-teal-50', category: 'Dentist' },
        { id: 'eye', label: t('dashboard.symptoms.eye_label'), icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50', category: 'Ophthalmologist' },
        { id: 'joint', label: t('dashboard.symptoms.joint_label'), icon: Bone, color: 'text-slate-500', bg: 'bg-slate-100', category: 'Orthopedist' },
        { id: 'heart', label: t('dashboard.symptoms.heart_label'), icon: Heart, color: 'text-red-500', bg: 'bg-red-50', category: 'Cardiologist' },
    ], [t]);

    const SPECIALTY_FILTERS = React.useMemo(() => ['All', 'General Physician', 'Dentist', 'Cardiologist', 'Neurologist', 'Orthopedist', 'Ophthalmologist'], []);

    const LAB_CATEGORIES = React.useMemo(() => ['All', 'Full Body', 'Diabetes', 'Heart', 'Thyroid', 'Blood Studies', 'Women\'s Health', 'Senior Citizen'].map(cat =>
        cat === 'All' ? t('dashboard.labCategories.all') :
            cat === 'Full Body' ? t('dashboard.labCategories.fullBody') :
                cat === 'Diabetes' ? t('dashboard.labCategories.diabetes') :
                    cat === 'Heart' ? t('dashboard.labCategories.heart') :
                        cat === 'Thyroid' ? t('dashboard.labCategories.thyroid') :
                            cat === 'Blood Studies' ? t('dashboard.labCategories.blood') :
                                cat === 'Women\'s Health' ? t('dashboard.labCategories.womenHealth') :
                                    cat === 'Senior Citizen' ? t('dashboard.labCategories.senior') : cat
    ), [t]);

    const MEDICINES: PharmacyMedicine[] = React.useMemo(() => [
        { id: 'med1', name: 'Dolo 650mg', type: 'Tablet', price: 30, originalPrice: 40, discount: 25, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800', category: 'Tablets', manufacturer: 'Micro Labs Ltd', dosage: '650mg', packSize: '15 Tablets', description: t('pharmacy.medicines.dolo.desc') },
        { id: 'med2', name: 'Benadryl Cough Syrup', type: 'Syrup', price: 110, originalPrice: 125, discount: 12, image: 'https://images.unsplash.com/photo-1603555501671-3f938d01f92e?auto=format&fit=crop&q=80&w=800', category: 'Syrups', manufacturer: 'Johnson & Johnson', dosage: '150ml', packSize: '1 Bottle', description: t('pharmacy.medicines.benadryl.desc') },
        { id: 'med3', name: 'Volini Gel', type: 'Ointment', price: 145, originalPrice: 160, discount: 9, image: 'https://images.unsplash.com/photo-1626968037373-c4eb9d042299?auto=format&fit=crop&q=80&w=800', category: 'Creams & Ointments', manufacturer: 'Sun Pharma', dosage: '30g', packSize: '1 Tube', description: t('pharmacy.medicines.volini.desc') },
        { id: 'med4', name: 'Seven Seas Cod Liver Oil', type: 'Capsule', price: 320, originalPrice: 400, discount: 20, image: 'https://images.unsplash.com/photo-1550572017-ed108bc2773d?auto=format&fit=crop&q=80&w=800', category: 'Supplements', manufacturer: 'Merck', dosage: '300mg', packSize: '100 Capsules', description: t('pharmacy.medicines.sevenseas.desc') },
        { id: 'med5', name: 'Dettol Antiseptic', type: 'Liquid', price: 180, originalPrice: 200, discount: 10, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800', category: 'First Aid', manufacturer: 'Reckitt', dosage: '500ml', packSize: '1 Bottle', description: t('pharmacy.medicines.dettol.desc') },
        { id: 'med6', name: 'Refresh Tears', type: 'Drops', price: 480, originalPrice: 550, discount: 12, image: 'https://images.unsplash.com/photo-1588625902096-747209930605?auto=format&fit=crop&q=80&w=800', category: 'Eye Drops', manufacturer: 'Allergan', dosage: '10ml', packSize: '1 Bottle', description: t('pharmacy.medicines.refresh.desc') },
        { id: 'med7', name: 'Hansaplast Bandage', type: 'Bandage', price: 50, originalPrice: 60, discount: 16, image: 'https://images.unsplash.com/photo-1599407333919-61994e773703?auto=format&fit=crop&q=80&w=800', category: 'First Aid', manufacturer: 'Beiersdorf', dosage: 'Standard', packSize: '20 Strips', description: t('pharmacy.medicines.hansaplast.desc') },
        { id: 'med8', name: 'Otrivin Nasal Drops', type: 'Drops', price: 65, originalPrice: 75, discount: 13, image: 'https://images.unsplash.com/photo-1631549916768-4119b2d3f9e2?auto=format&fit=crop&q=80&w=800', category: 'Ear & Nasal Drops', manufacturer: 'GSK', dosage: '10ml', packSize: '1 Bottle', description: t('pharmacy.medicines.otrivin.desc') },
        { id: 'med9', name: 'Shelcal 500', type: 'Tablet', price: 120, originalPrice: 140, discount: 14, image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800', category: 'Supplements', manufacturer: 'Torrent Pharma', dosage: '500mg', packSize: '15 Tablets', description: t('pharmacy.medicines.shelcal.desc') },
    ], [t]);


    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [viewAllSymptomsOpen, setViewAllSymptomsOpen] = useState(false);

    // Filter Logic States
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // --- DYNAMIC DATA STATE ---
    const [userName, setUserName] = useState<string>('User');
    const [userId, setUserId] = useState<string | null>(null);
    const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [medicinesList, setMedicinesList] = useState<PharmacyMedicine[]>([]);
    const [loadingMedicines, setLoadingMedicines] = useState(false);
    const [medicinePage, setMedicinePage] = useState(1);
    const [hasMoreMedicines, setHasMoreMedicines] = useState(false);
    const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // 1. Fetch User
        const fetchUserData = async () => {
            // Check if there is a session stored by the backend logic
            const storedSession = localStorage.getItem('supabase_session');
            let currentSession = null;

            if (storedSession) {
                try {
                    const parsedSession = JSON.parse(storedSession);
                    if (parsedSession && parsedSession.access_token && parsedSession.refresh_token) {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: parsedSession.access_token,
                            refresh_token: parsedSession.refresh_token
                        });
                        if (error) console.error("Error setting session from storage:", error);
                        currentSession = data.session;
                    }
                } catch (e) {
                    console.error("Error parsing stored session:", e);
                }
            }

            // Fallback to getting user if setSession worked or if already logged in via client logic
            const { data: { user } } = await supabase.auth.getUser();
            console.log("Current User:", user);
            if (user) {
                setUserId(user.id);
                // Prioritize fetching from 'patients' table as it's the source of truth
                const { data: patient, error } = await supabase
                    .from('patients')
                    .select('first_name')
                    .eq('user_id', user.id)
                    .single();

                if (patient?.first_name) {
                    console.log("Fetched name from DB:", patient.first_name);
                    setUserName(patient.first_name);
                } else if (user.user_metadata?.firstName) {
                    console.log("Fallback to metadata name:", user.user_metadata.firstName);
                    setUserName(user.user_metadata.firstName);
                } else {
                    console.log("No name found in DB or metadata.");
                    if (user.email) {
                        setUserName(user.email.split('@')[0]); // Fallback to email prefix
                    }
                }

                if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                    console.error("Error fetching patient profile:", error);
                }

                // --- FETCH DASHBOARD DATA (APPOINTMENTS & INTERACTIONS) ---
                // Helper to fetch appointments
                const { data: appointments, error: appError } = await supabase
                    .from('appointments')
                    .select(`
                        id, 
                        doctor_id,
                        date, 
                        time, 
                        type, 
                        doctor:doctors(first_name, surname, specialty, hospital_name, hospital_location),
                        meeting_link
                    `)
                    .eq('patient_id', user.id)
                    .eq('status', 'upcoming')
                    .order('date', { ascending: true });

                // --- FETCH REPORTS (Completed Apps) ---
                const { data: historyApps, error: histError } = await supabase
                    .from('appointments')
                    .select(`
                        id, 
                        doctor_id,
                        date, 
                        time, 
                        type, 
                        notes,
                        doctor:doctors(first_name, surname, specialty, hospital_name),
                        meeting_link
                    `)
                    .eq('patient_id', user.id)
                    .eq('status', 'completed')
                    .order('date', { ascending: false });

                if (historyApps) {
                    const dbReports: HealthReport[] = historyApps.map((app: any) => {
                        let title = 'Consultation Report';
                        let type: 'Prescription' | 'Medical Report' | 'Lab Report' = 'Medical Report';
                        let parsedNotes = null;

                        if (app.notes) {
                            try {
                                const n = typeof app.notes === 'string' ? JSON.parse(app.notes) : app.notes;
                                parsedNotes = n;
                                if (n.medicines && n.medicines.length > 0) type = 'Prescription';
                                title = `Rx: Dr. ${app.doctor?.first_name || 'Doctor'} - ${n.diagnosis?.substring(0, 20) || 'General'}`;
                            } catch (e) {
                                console.log("Error parsing notes", e);
                            }
                        }

                        return {
                            id: app.id,
                            title: title,
                            type: type,
                            date: new Date(app.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                            doctorOrLab: app.doctor ? `Dr. ${app.doctor.first_name} ${app.doctor.surname}` : 'MediConnect Doctor',
                            fileType: 'View',
                            fileSize: 'N/A',
                            rawNotes: parsedNotes || app.notes
                        };
                    });
                    // Reports section removed
                }

                if (appointments) {
                    const mappedApps = appointments.map((app: any) => ({
                        id: app.id,
                        doctorId: app.doctor_id,
                        doctorName: `Dr. ${app.doctor?.first_name} ${app.doctor?.surname}`,
                        specialty: app.doctor?.specialty || 'General',
                        date: app.date,
                        time: app.time.substring(0, 5), // HH:MM
                        type: app.type as 'video' | 'clinic',
                        doctorImage: `https://ui-avatars.com/api/?name=${app.doctor?.first_name}+${app.doctor?.surname}&background=random`,
                        status: 'Upcoming' as 'Upcoming',
                        hospital: app.doctor?.hospital_name,
                        location: app.doctor?.hospital_location
                    }));
                    setMyAppointments(mappedApps);
                }
                if (appError) console.error("Error fetching appointments:", appError);

                // Helper to fetch interactions
                const { data: interactions, error: intError } = await supabase
                    .from('interactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (interactions) {
                    const mappedInts = interactions.map((int: any) => ({
                        id: int.id,
                        doctorName: int.title || 'MediConnect AI',
                        doctorImage: int.icon === 'calendar'
                            ? 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
                            : `https://ui-avatars.com/api/?name=AI&background=random`,
                        date: new Date(int.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' }),
                        type: (int.type === 'Chat' || int.type === 'Video Call') ? int.type : 'Chat' as 'Chat',
                        summary: int.description || 'System interaction recorded'
                    }));
                    setRecentInteractions(mappedInts);
                }
                if (intError) console.error("Error fetching interactions:", intError);

            } else {
                console.log("No active session found.");
            }
        };

        // 2. Fetch Doctors
        const fetchDoctors = async () => {
            const { data, error } = await supabase.from('doctors').select('*').eq('approval_status', 'approved');
            if (data && data.length > 0) {
                const mappedDoctors: Doctor[] = data.map((doc: any) => ({
                    id: doc.id,
                    name: `Dr. ${doc.first_name} ${doc.surname}`,
                    specialty: doc.specialty,
                    hospital: doc.hospital_name,
                    rating: 4.8, // Mock for now
                    reviews: 120, // Mock for now
                    experience: `${doc.years_of_experience} Years`,
                    image: `https://ui-avatars.com/api/?name=${doc.first_name}+${doc.surname}&background=random`,
                    nextAvailable: 'Today, 4:00 PM',
                    price: 800,
                    location: doc.hospital_location,
                    distance: '2.5 km',
                    travelTime: '15 mins'
                }));
                setDoctorsList(mappedDoctors);
                setFilteredDoctors(mappedDoctors); // Initialize filtered list
            }
        };

        fetchUserData();
        fetchDoctors();
        fetchLabTests();
        fetchMedicines();
    }, []);

    const mapMedicineData = (m: any, searchQuery?: string): PharmacyMedicine => {
        const query = searchQuery?.toLowerCase() || '';
        const isGenericMatch = m.generic_name?.toLowerCase().includes(query) ||
            m.brand_name?.toLowerCase().includes(query);

        // Show only the first generic name/substitute to avoid cluttering the UI
        const firstGeneric = m.generic_name?.split(',')[0] || m.brand_name;

        // Enhanced description using CSV data
        let enhancedDescription = m.description || '';
        if (!enhancedDescription && m.uses) {
            enhancedDescription = `Used for: ${m.uses}`;
        }
        if (!enhancedDescription && m.side_effects) {
            enhancedDescription = `Clinically used for treatment. Common side effects: ${m.side_effects.split(',').slice(0, 2).join(', ')}`;
        }
        if (enhancedDescription.length < 30 && m.therapeutic_class) {
            enhancedDescription = `Clinically used for ${m.therapeutic_class.toLowerCase()} management.`;
        }

        // Get side effects array
        const sideEffectsArray = m.side_effects ? m.side_effects.split(',').map((s: string) => s.trim()).slice(0, 5) : [];
        
        // Get chemical class for better categorization
        const mechanismText = m.action_class || m.chemical_class || m.therapeutic_class || 'Clinical standard';
        const fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800';
        const normalizedImage = typeof m.image === 'string' && /^https?:\/\//i.test(m.image) ? m.image : fallbackImage;

        return {
            id: m.id,
            name: m.brand_name,
            genericName: firstGeneric,
            type: m.dose_form || 'Tablet',
            price: parseFloat(m.price) || 50,
            originalPrice: Math.floor((parseFloat(m.price) || 50) * 1.3),
            discount: 20,
            image: normalizedImage,
            category: m.therapeutic_class || 'General Medicine',
            manufacturer: 'MediConnect Partner',
            dosage: m.chemical_class || 'Standard Dose',
            packSize: m.dose_form === 'Syrup' ? '100ml' : m.dose_form === 'Injection' ? '1 Vial' : m.dose_form === 'Gel' ? '30g' : '10 Units',
            description: enhancedDescription,
            mechanismOfAction: `This ${m.therapeutic_class?.toLowerCase() || 'medicine'} works as a ${mechanismText.toLowerCase()} to provide therapeutic relief. ${m.habit_forming ? '⚠️ Habit forming' : '✓ Non-habit forming'}.`,
            isGeneric: isGenericMatch && !!searchQuery
        };
    };

    const fetchMedicines = async (page = 1, append = false) => {
        setLoadingMedicines(true);
        try {
            const from = (page - 1) * MEDICINE_PAGE_SIZE;
            const to = from + MEDICINE_PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error fetching medicines from database:', error);
                setHasMoreMedicines(false);
                setMedicinePage(1);
                setMedicinesList(MEDICINES);
            } else if (data && data.length > 0) {
                console.log(`✅ Fetched ${data.length} medicines from Supabase (page ${page})`);
                const mapped = data.map((m: any) => mapMedicineData(m));
                setMedicinesList(prev => {
                    if (!append) return mapped;
                    const byId = new Map<string, PharmacyMedicine>();
                    [...prev, ...mapped].forEach(item => byId.set(item.id, item));
                    return Array.from(byId.values());
                });
                setMedicinePage(page);
                setHasMoreMedicines(data.length === MEDICINE_PAGE_SIZE);
            } else {
                setHasMoreMedicines(false);
                if (page === 1) {
                    console.log('⚠️ No medicines found in database, using mock data');
                    setMedicinesList(MEDICINES);
                }
            }
        } catch (err) {
            console.error('Exception fetching medicines:', err);
            setHasMoreMedicines(false);
            setMedicinePage(1);
            setMedicinesList(MEDICINES);
        }
        setLoadingMedicines(false);
    };

    const handleSearchMedicines = async (query: string) => {
        if (!query) {
            setMedicinePage(1);
            fetchMedicines(1, false);
            setAiSuggestedAlternatives([]);
            return;
        }
        setLoadingMedicines(true);
        setIsSearchingAI(true);
        setHasMoreMedicines(false);

        try {
            // 1. Fast Supabase search with ilike fallback-safe filters
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .or(`brand_name.ilike.%${query}%,generic_name.ilike.%${query}%,therapeutic_class.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(40);

            if (error) {
                console.warn('Database search failed, using local fallback:', error);
                // Fallback to client-side search on mock data
                const localResults = MEDICINES.filter(m =>
                    m.name.toLowerCase().includes(query.toLowerCase()) ||
                    m.manufacturer.toLowerCase().includes(query.toLowerCase())
                );
                setMedicinesList(localResults);
            } else if (data && data.length > 0) {
                setMedicinesList(data.map((m: any) => mapMedicineData(m, query)));
            } else {
                // No results from database, fallback to mock data search
                const localResults = MEDICINES.filter(m =>
                    m.name.toLowerCase().includes(query.toLowerCase()) ||
                    m.manufacturer.toLowerCase().includes(query.toLowerCase())
                );
                setMedicinesList(localResults);
            }
        } catch (err) {
            console.error("Medicine search exception:", err);
            // Use local fallback when database is unavailable
            const localResults = MEDICINES.filter(m =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.manufacturer.toLowerCase().includes(query.toLowerCase())
            );
            setMedicinesList(localResults);
        }

        // 2. Call AI Generic Finder
        try {
            const aiResponse = await pharmacyService.findGenericAlternatives(query);
            if (aiResponse && aiResponse.alternatives && aiResponse.alternatives.length > 0) {
                setAiSuggestedAlternatives(aiResponse.alternatives);
            } else {
                setAiSuggestedAlternatives([]);
            }
        } catch (err) {
            console.error("AI Search Failed:", err);
            setAiSuggestedAlternatives([]);
        }

        setIsSearchingAI(false);
        setLoadingMedicines(false);
    };

    const handleLoadMoreMedicines = useCallback(async () => {
        if (loadingMedicines || !hasMoreMedicines || searchQuery.trim()) return;
        await fetchMedicines(medicinePage + 1, true);
    }, [loadingMedicines, hasMoreMedicines, searchQuery, medicinePage]);

    useEffect(() => {
        if (activeTab !== 'pharmacy') return;
        if (searchQuery.trim()) return;
        if (!hasMoreMedicines) return;

        const sentinel = loadMoreSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    handleLoadMoreMedicines();
                }
            },
            {
                root: null,
                rootMargin: '200px 0px',
                threshold: 0.1
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [activeTab, searchQuery, hasMoreMedicines, handleLoadMoreMedicines]);

    const fetchLabTests = async () => {
        setLoadingLabs(true);
        try {
            const { data, error } = await supabase
                .from('lab_tests')
                .select('*');

            if (error) {
                console.error('Error fetching lab tests from database:', error);
                // If database fetch fails, use empty array or mock data
                setLabTests([]);
            } else if (data && data.length > 0) {
                const mappedTests: LabTest[] = data.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    type: t.type,
                    test_count: t.test_count,
                    price: t.price,
                    original_price: t.original_price,
                    discount: t.discount,
                    tat: t.tat,
                    category: t.category,
                    image: t.image,
                    description: t.description,
                    tests_included: t.tests_included,
                    preparation: t.preparation,
                    location: t.location,
                    contact_number: t.contact_number,
                    lab_address: t.lab_address,
                    tags: t.tags
                }));
                setLabTests(mappedTests);
            } else {
                setLabTests([]);
            }
        } catch (err) {
            console.error('Exception while fetching lab tests:', err);
            setLabTests([]);
        }
        setLoadingLabs(false);
    };

    // Filter Logic
    // Filter Logic
    useEffect(() => {
        let result = doctorsList;

        // 1. Filter by Specialty
        if (selectedSpecialty !== 'All') {
            result = result.filter(d => d.specialty === selectedSpecialty || d.specialty.includes(selectedSpecialty));
        }

        // 2. Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(doc =>
                doc.name.toLowerCase().includes(query) ||
                doc.specialty.toLowerCase().includes(query) ||
                (doc.hospital && doc.hospital.toLowerCase().includes(query))
            );
        }

        setFilteredDoctors(result);
    }, [selectedSpecialty, searchQuery, doctorsList]);

    // Data States
    const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
    const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);




    const [paymentHistory, setPaymentHistory] = useState<PaymentReceipt[]>([
        { transactionId: 'TXN_123456', date: 'Jan 28, 2024', doctorName: 'Dr. James Wilson', amount: 2500, status: 'Success', description: 'Video Consultation' }
    ]);

    // Medicine Orders State
    const [medicineOrders, setMedicineOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Fetch Medicine Orders
    const fetchMedicineOrders = async () => {
        if (!userId) return;
        setLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from('medicine_orders')
                .select('*')
                .eq('patient_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching medicine orders:', error);
            } else {
                setMedicineOrders(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch medicine orders:', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Fetch orders when tab changes to 'orders' or when userId is available
    useEffect(() => {
        if (activeTab === 'orders' && userId) {
            fetchMedicineOrders();
        }
    }, [activeTab, userId]);

    // Booking Modal State
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [bookingDate, setBookingDate] = useState<string>('Today');
    const [bookingTime, setBookingTime] = useState<string>('');
    const [bookingType, setBookingType] = useState<'video' | 'clinic'>('video');
    const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'success'>('details');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [bookingNotes, setBookingNotes] = useState<string>('');

    // Doctor Filter State (Moved up)

    // Lab Tests State
    const [labTests, setLabTests] = useState<LabTest[]>([]);
    const [loadingLabs, setLoadingLabs] = useState(false);
    const [selectedLabCategory, setSelectedLabCategory] = useState('All');
    const [cart, setCart] = useState<LabTest[]>([]); // Changed to store Objects for Receipt
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [labBookingStep, setLabBookingStep] = useState<'cart' | 'payment' | 'success'>('cart');
    const [isProcessingLabPayment, setIsProcessingLabPayment] = useState(false);
    const [viewLabTest, setViewLabTest] = useState<LabTest | null>(null);
    const [showLabReceipt, setShowLabReceipt] = useState(false);
    const [lastTransactionId, setLastTransactionId] = useState<string>('');



    // Pharmacy State
    const [pharmacyCart, setPharmacyCart] = useState<string[]>([]);
    const [pharmacyBookingStep, setPharmacyBookingStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');
    const [isProcessingPharmaPayment, setIsProcessingPharmaPayment] = useState(false);
    const [viewMedicine, setViewMedicine] = useState<PharmacyMedicine | null>(null);
    const [aiSuggestedAlternatives, setAiSuggestedAlternatives] = useState<string[]>([]);
    const [isSearchingAI, setIsSearchingAI] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    // Reports State


    // VIDEO CALL STATE
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);

    // --- SCROLL LOCK LOGIC ---
    useEffect(() => {
        const anyModalOpen = !!viewLabTest || !!selectedDoctor || isCartOpen || !!showLabReceipt || !!isCallOpen || !!viewMedicine;
        if (anyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [viewLabTest, selectedDoctor, isCartOpen, showLabReceipt, isCallOpen, viewMedicine]);

    const handleJoinCall = async (appointment: Appointment) => {
        try {
            // Call backend to get link
            const response = await fetch('http://localhost:5000/api/video/generate-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    userId: userId
                })
            });

            const data = await response.json();

            if (data.success) {
                // Determine if we can join (Check handled by backend effectively, but extra safety here)
                // Since this is Patient, if backend returned success=true, it means link exists (or created if we allowed it, which we blocked now)
                setActiveCallRoom(data.roomId);
                setIsCallOpen(true);
            } else {
                alert(data.message || "Failed to join call. Doctor may not have started yet.");
            }
        } catch (error) {
            console.error("Error joining call:", error);
            alert("Connection error. Please try again.");
        }
    };

    const handleCloseCall = useCallback(() => {
        setIsCallOpen(false);
        setActiveCallRoom(null);
    }, []);



    const sidebarItems = [
        { id: 'overview', icon: LayoutGrid, label: t('dashboard.overview') },
        { id: 'book-doctor', icon: Stethoscope, label: t('dashboard.bookDoctor') },
        { id: 'lab-tests', icon: FlaskConical, label: t('dashboard.labTests'), badge: 'Offer' },
        { id: 'pharmacy', icon: ShoppingBag, label: t('dashboard.pharmacy') },
        { id: 'orders', icon: Package, label: t('dashboard.myOrders') },
        { id: 'payments', icon: CreditCard, label: t('dashboard.payments') },
    ];

    const specialties = [
        { label: 'Cardiology', icon: Heart, doctors: 12 },
        { label: 'Dentistry', icon: Smile, doctors: 8 },
        { label: 'Orthopedics', icon: Bone, doctors: 5 },
        { label: 'Neurology', icon: BrainCircuit, doctors: 7 },
        { label: 'Ophthalmology', icon: Eye, doctors: 4 },
        { label: 'General', icon: Stethoscope, doctors: 15 },
    ];

    // --- FILTERED DOCTORS ---
    // (Logic moved to useEffect)

    // --- FILTERED LAB TESTS ---
    const filteredLabTests = labTests.filter(test => {
        const matchesCategory = selectedLabCategory === 'All' || test.category === selectedLabCategory;
        const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // --- FILTERED MEDICINES ---
    const filteredMedicines = medicinesList;

    // Use a separate effect for medicine search to debounce or trigger Supabase search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'pharmacy') {
                handleSearchMedicines(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    // --- CART LOGIC ---
    const toggleCartItem = (test: LabTest) => {
        setCart(prev => {
            const exists = prev.find(item => item.id === test.id);
            if (exists) {
                return prev.filter(item => item.id !== test.id);
            } else {
                return [...prev, test];
            }
        });
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + item.price, 0);
    };

    const togglePharmacyCartItem = (id: string) => {
        setPharmacyCart(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const getPharmacyCartTotal = () => {
        return pharmacyCart.reduce((total, id) => {
            const med = medicinesList.find(m => m.id === id);
            return total + (med?.price || 0);
        }, 0);
    };

    const handleOpenCart = () => {
        if (activeTab === 'pharmacy') {
            setPharmacyBookingStep('cart');
        } else {
            setLabBookingStep('cart');
        }
        setIsCartOpen(true);
    };

    const handleLabCheckout = () => {
        setLabBookingStep('payment');
    };

    const handlePharmacyCheckout = () => {
        setPharmacyBookingStep('shipping');
    };

    const handlePharmacyShipping = () => {
        setPharmacyBookingStep('payment');
    }

    const handleConfirmLabPayment = async () => {
        if (!userId) {
            alert("Please login to book.");
            return;
        }
        setIsProcessingLabPayment(true);

        try {
            // Create booking entries in DB
            const bookings = cart.map(test => ({
                patient_id: userId,
                test_id: test.id,
                booking_date: new Date().toISOString().split('T')[0], // Today
                amount: test.price,
                payment_status: 'paid',
                status: 'confirmed'
            }));

            const { error: bookingError } = await supabase.from('lab_bookings').insert(bookings);
            if (bookingError) throw bookingError;

            // 2. Generate Receipt Data
            const txnId = `LAB_${Math.floor(Math.random() * 1000000)}`;
            const totalAmount = getCartTotal();

            // 3. Insert into lab_receipts for persistence
            const { error: receiptError } = await supabase.from('lab_receipts').insert({
                patient_id: userId,
                transaction_id: txnId,
                items: cart.map(item => ({ id: item.id, title: item.title, price: item.price })),
                total_amount: totalAmount
            });

            if (receiptError) throw receiptError;

            // 4. Update UI
            setLabBookingStep('success');
            setLastTransactionId(txnId);

            // 5. Generate Receipt for History (Local UI state)
            const newReceipt: PaymentReceipt = {
                transactionId: txnId,
                date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                doctorName: 'MediConnect Labs',
                amount: totalAmount,
                status: 'Success',
                description: `Lab Order: ${cart.length} Tests`
            };
            setPaymentHistory(prev => [newReceipt, ...prev]);

        } catch (err) {
            console.error("Error booking lab tests:", err);
            alert("Payment failed. Please try again.");
        } finally {
            setIsProcessingLabPayment(false);
        }
    };

    const handleShowLabReceipt = () => {
        setShowLabReceipt(true);
    };

    const handleConfirmPharmacyPayment = async () => {
        if (!userId) {
            alert("Please login to place orders.");
            return;
        }
        setIsProcessingPharmaPayment(true);

        try {
            const totalAmount = getPharmacyCartTotal() + (getPharmacyCartTotal() > 500 ? 0 : 50);

            // 1. Get full medicine details for the order
            const orderItems = pharmacyCart.map(id => {
                const med = medicinesList.find(m => m.id === id);
                return {
                    id: med?.id,
                    name: med?.name,
                    price: med?.price,
                    image: med?.image,
                    quantity: 1 // Default to 1 for now
                };
            });

            // 2. Insert into Supabase
            const { error } = await supabase.from('medicine_orders').insert({
                patient_id: userId,
                full_name: shippingAddress.fullName,
                phone: shippingAddress.phone,
                address: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                items: orderItems,
                total_amount: totalAmount,
                status: 'Placed'
            });

            if (error) throw error;

            // 3. Update UI
            setPharmacyBookingStep('success');

            const newReceipt: PaymentReceipt = {
                transactionId: `PHR_${Math.floor(Math.random() * 1000000)}`,
                date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                doctorName: 'MediConnect Pharmacy',
                amount: totalAmount,
                status: 'Success',
                description: `Pharmacy Order: ${pharmacyCart.length} Items`
            };
            setPaymentHistory(prev => [newReceipt, ...prev]);

        } catch (err) {
            console.error("Error placing pharmacy order:", err);
            alert("Payment failed. Please try again.");
        } finally {
            setIsProcessingPharmaPayment(false);
        }
    };

    const handleLabOrderComplete = () => {
        setCart([]);
        setIsCartOpen(false);
        setLabBookingStep('cart');
        setActiveTab('payments');
    };

    const handlePharmacyOrderComplete = () => {
        setPharmacyCart([]);
        setIsCartOpen(false);
        setPharmacyBookingStep('cart');
        setActiveTab('payments');
    }

    const handleViewLabTest = (test: LabTest) => {
        setViewLabTest(test);
    };

    const handleViewMedicine = (med: PharmacyMedicine) => {
        setViewMedicine(med);
    }

    const closeLabTestModal = () => {
        setViewLabTest(null);
    };

    const closeMedicineModal = () => {
        setViewMedicine(null);
    }

    // --- CHAT LOGIC ---

    const handleSymptomClick = (symptom: typeof SYMPTOMS_LIST[0]) => {
        setViewAllSymptomsOpen(false);
        setIsChatOpen(true);
    };

    // --- BOOKING LOGIC ---
    const openBookingModal = (doctor: Doctor, notes?: string) => {
        setSelectedDoctor(doctor);
        setBookingDate('Today');
        setBookingTime('');
        setBookingType('video');
        setBookingStep('details');
        setBookingNotes(notes || '');
    };

    const handleProceedToPayment = () => {
        setBookingStep('payment');
    };

    const handleConfirmPayment = async () => {
        if (!selectedDoctor || !userId || isProcessingPayment) return;
        setIsProcessingPayment(true);

        try {
            // 1. Insert into Supabase 'appointments' table
            const { data: newApt, error } = await supabase
                .from('appointments')
                .insert({
                    patient_id: userId,
                    doctor_id: selectedDoctor.id,
                    date: bookingDate === 'Today' ? new Date().toISOString().split('T')[0] : bookingDate,
                    time: bookingTime || '10:00:00',
                    type: bookingType,
                    status: 'upcoming',
                    notes: bookingNotes
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Add to local state
            const mappedApt: Appointment = {
                id: newApt.id,
                doctorId: selectedDoctor.id,
                doctorName: selectedDoctor.name,
                doctorImage: selectedDoctor.image,
                specialty: selectedDoctor.specialty,
                hospital: selectedDoctor.hospital,
                date: newApt.date,
                time: newApt.time.substring(0, 5),
                type: newApt.type as 'video' | 'clinic',
                status: 'Upcoming' as 'Upcoming',
                travelTime: bookingType === 'clinic' ? selectedDoctor.travelTime : undefined
            };
            setMyAppointments(prev => [mappedApt, ...prev]);

            // 3. Generate Receipt
            const newReceipt: PaymentReceipt = {
                transactionId: `TXN_${Math.floor(Math.random() * 1000000)}`,
                date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                doctorName: selectedDoctor.name,
                amount: selectedDoctor.price,
                status: 'Success',
                description: bookingType === 'video' ? 'Video Consultation' : 'In-Clinic Consultation'
            };
            setPaymentHistory(prev => [newReceipt, ...prev]);

            setBookingStep('success');
        } catch (error) {
            console.error("Error booking appointment:", error);
            alert("Failed to book appointment. Please try again.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const closeBookingModal = () => {
        setSelectedDoctor(null);
        setBookingStep('details');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden">

            {/* DESKTOP SIDEBAR (Fixed 260px) */}
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
                            <span className="text-xs font-medium text-brand-600 tracking-wider uppercase">Medical</span>
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
                            {item.badge && (
                                <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-gradient-to-br from-brand-50 to-white p-3 rounded-2xl border border-brand-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                            <p className="text-xs text-brand-500 truncate">Patient</p>
                        </div>
                        <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE HEADER */}
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

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 px-6 animate-fade-in">
                    <nav className="space-y-4">
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
                        <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-medium text-red-500 mt-8 bg-red-50">
                            <LogOut size={24} /> Logout
                        </button>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 lg:pl-[260px] w-full relative">
                <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 pt-20 lg:pt-8 max-w-7xl mx-auto">

                    {/* HEADER SECTION (Greeting & Search) */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm py-2">
                        <div className="animate-fade-in-down">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                {activeTab === 'overview' ? `Good Morning, ${userName}` :
                                    activeTab === 'book-doctor' ? 'Book a Doctor' :
                                        activeTab === 'lab-tests' ? 'Lab Tests & Packages' :
                                                activeTab === 'pharmacy' ? 'Pharmacy' :
                                                    activeTab === 'payments' ? 'Payments & Receipts' : 'Dashboard'}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {activeTab === 'overview' ? 'Here is your daily health intelligence summary.' :
                                    activeTab === 'lab-tests' ? 'Book health checkups from top certified labs.' :
                                            activeTab === 'pharmacy' ? 'Order medicines and healthcare products.' :
                                                'Manage your health journey.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                            <div className="relative hidden md:block group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={activeTab === 'pharmacy' ? "Search medicines, syrup..." : "Search doctors..."}
                                    className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition-all w-64 shadow-sm"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded-full text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                    <Mic size={12} />
                                </button>
                            </div>
                            <button className="relative w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all shadow-sm">
                                <Bell size={18} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>
                            {/* Cart Icon (Lab Tests & Pharmacy) */}
                            {(activeTab === 'lab-tests' || activeTab === 'pharmacy') && (
                                <button
                                    onClick={handleOpenCart}
                                    className="relative w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition-all shadow-md"
                                >
                                    <ShoppingCart size={18} />
                                    {(activeTab === 'pharmacy' ? pharmacyCart.length : cart.length) > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                            {activeTab === 'pharmacy' ? pharmacyCart.length : cart.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="space-y-8 pb-20">

                        {/* --- VIEW: OVERVIEW --- */}
                        {activeTab === 'overview' && (
                            <>
                                {/* 1. SYMPTOM QUICK CONNECT */}
                                <section className="animate-fade-in-up">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-900">Feeling unwell?</h3>
                                        <span
                                            onClick={() => setViewAllSymptomsOpen(true)}
                                            className="text-xs font-bold text-brand-600 cursor-pointer hover:underline"
                                        >
                                            View all symptoms
                                        </span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {SYMPTOMS_LIST.slice(0, 5).map((symptom, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSymptomClick(symptom)}
                                                className="flex-shrink-0 flex items-center gap-3 bg-white p-3 pr-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-xl ${symptom.bg} ${symptom.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    <symptom.icon size={20} />
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm">{t(`dashboard.symptoms.${symptom.id}`)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* 1B. HOSPITAL SUGGESTIONS */}
                                <HospitalSuggestionSection />

                                {/* 2. UPCOMING SCHEDULE (DYNAMIC) */}
                                <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Schedule</h3>
                                    {myAppointments.length > 0 ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {myAppointments.map((apt) => (
                                                <div key={apt.id} className={`relative overflow-hidden rounded-[2rem] shadow-xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.01] ${apt.type === 'video' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/20' : 'bg-white border border-slate-200 text-slate-900'}`}>
                                                    {apt.type === 'video' && <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}

                                                    <div className="relative z-10">
                                                        <div className="flex items-start justify-between mb-6">
                                                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${apt.type === 'video' ? 'bg-white/20 backdrop-blur-md border-white/20' : 'bg-brand-50 text-brand-700 border-brand-100'}`}>
                                                                {apt.type === 'video' ? <Video size={12} /> : <MapPin size={12} />}
                                                                {apt.type === 'video' ? t('dashboard.appointmentTypes.video') : t('dashboard.appointmentTypes.clinic')}
                                                            </div>
                                                            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden ${apt.type === 'video' ? 'border-white/30 bg-white/10' : 'border-slate-100'}`}>
                                                                <img src={apt.doctorImage} alt="Doctor" className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-2xl font-bold mb-1">{apt.doctorName}</h3>
                                                        <p className={`text-sm ${apt.type === 'video' ? 'text-indigo-100' : 'text-slate-500'}`}>{t(`dashboard.specialties.${apt.specialty.toLowerCase()}`) || apt.specialty} • {apt.hospital}</p>
                                                    </div>

                                                    <div className={`relative z-10 mt-6 rounded-xl p-3 flex items-center justify-between ${apt.type === 'video' ? 'bg-black/10 backdrop-blur-sm' : 'bg-slate-50 border border-slate-100'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apt.type === 'video' ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                                                <Clock size={20} />
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs font-medium ${apt.type === 'video' ? 'text-indigo-200' : 'text-slate-400'}`}>{apt.date}</p>
                                                                <p className={`font-bold ${apt.type === 'video' ? 'text-white' : 'text-slate-900'}`}>{apt.time}</p>
                                                            </div>
                                                        </div>
                                                        {apt.type === 'video' ? (
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
                                                                <Navigation size={12} /> {t('common.action') || 'Directions'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
                                            <p className="text-slate-500">{t('dashboard.noAppointments')}</p>
                                            <button onClick={() => setActiveTab('book-doctor')} className="mt-4 text-brand-600 font-bold hover:underline">{t('dashboard.bookDoctor')}</button>
                                        </div>
                                    )}
                                </section>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* 3. RECENT INTERACTIONS (NEW) */}
                                    <section className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-900">{t('dashboard.recentInteractions')}</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {recentInteractions.map((interaction) => (
                                                <div key={interaction.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:border-brand-200 transition-colors group">
                                                    <img src={interaction.doctorImage} alt={interaction.doctorName} className="w-12 h-12 rounded-xl object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between">
                                                            <h4 className="font-bold text-slate-900 text-sm">{interaction.doctorName}</h4>
                                                            <span className="text-xs text-slate-400">{interaction.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${interaction.type === 'Chat' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                                {interaction.type === 'Chat' ? t('dashboard.interactionTypes.chat') : t('dashboard.interactionTypes.videoCall')}
                                                            </span>
                                                            <p className="text-xs text-slate-500 truncate">{interaction.summary}</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                                        <MessageCircle size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 4. SPECIALIST CATEGORIES */}
                                    <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-900">{t('specialists.bookConsultation')}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {specialties.map((spec, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setActiveTab('book-doctor');
                                                        setSelectedSpecialty(spec.label === 'General' ? 'General Physician' : spec.label);
                                                    }}
                                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group text-center"
                                                >
                                                    <div className="w-10 h-10 mx-auto bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                                        <spec.icon size={20} />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-700">{t(`dashboard.specialties.${spec.label.toLowerCase()}`)}</h4>
                                                    <p className="text-[10px] text-slate-400 mt-1">{spec.doctors} Doctors</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </>
                        )}



                        {/* --- VIEW: PHARMACY (RE-DESIGNED) --- */}
                        {activeTab === 'pharmacy' && (
                            <div className="animate-fade-in space-y-8">

                                {/* AI SEARCH SUGGESTIONS PANEL */}
                                {aiSuggestedAlternatives.length > 0 && (
                                    <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden animate-fade-in-up">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Sparkles size={20} className="text-brand-200" />
                                                <h3 className="font-bold text-lg">AI Generic Suggestions</h3>
                                            </div>
                                            <p className="text-brand-100 text-sm mb-6 max-w-lg">
                                                We found more cost-effective generic alternatives for your search. These contain the same active ingredients but at significant savings.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSuggestedAlternatives.map((alt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSearchQuery(alt)}
                                                        className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-sm font-bold hover:bg-white/30 transition-all flex items-center gap-2"
                                                    >
                                                        <Search size={14} /> {alt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pharmacy Header & Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h4 className="font-bold text-slate-900">Verified Quality</h4>
                                        <p className="text-xs text-slate-500 mt-1">All medicines are checked for authenticity.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-4">
                                            <Sparkles size={20} />
                                        </div>
                                        <h4 className="font-bold text-slate-900">Generic First</h4>
                                        <p className="text-xs text-slate-500 mt-1">Save up to 80% with molecular substitutes.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                            <Truck size={20} />
                                        </div>
                                        <h4 className="font-bold text-slate-900">Fast Delivery</h4>
                                        <p className="text-xs text-slate-500 mt-1">Free delivery on orders above ₹500.</p>
                                    </div>
                                </div>

                                {/* Medicines Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredMedicines.map((med: PharmacyMedicine) => (
                                        <div
                                            key={med.id}
                                            onClick={() => handleViewMedicine(med)}
                                            className="bg-white rounded-[2rem] border border-slate-200 flex flex-col justify-between hover:shadow-2xl hover:shadow-brand-900/10 transition-all group relative overflow-hidden cursor-pointer"
                                        >
                                            {/* Badge for Generic */}
                                            {med.isGeneric && (
                                                <div className="absolute top-4 left-4 z-20">
                                                    <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                                                        <ShieldCheck size={10} /> GENERIC
                                                    </span>
                                                </div>
                                            )}

                                            {/* Image Banner */}
                                            <div className="h-48 overflow-hidden relative bg-slate-50 flex items-center justify-center">
                                                <img
                                                    src={med.image}
                                                    alt={med.name}
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800';
                                                    }}
                                                    className="h-36 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>

                                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] font-bold">
                                                    <span className="px-2 py-1 rounded-md border border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
                                                        {med.type}
                                                    </span>
                                                    {med.discount > 0 && (
                                                        <span className="text-white bg-green-500 px-2 py-1 rounded-full shadow-md">
                                                            SAVE {med.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-brand-600 transition-colors line-clamp-2 uppercase">
                                                        {med.name}
                                                    </h3>
                                                    {med.genericName && (
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <div className="px-1.5 py-0.5 bg-brand-50 rounded text-brand-600 font-bold text-[9px] border border-brand-100 uppercase">Molecule</div>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{med.genericName.split(',')[0]}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-xs text-slate-400 mb-4 font-medium">{med.packSize} • {med.manufacturer}</p>

                                                {/* Mechanism of Action (Shortened for Card) */}
                                                <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 italic line-clamp-2">
                                                        {med.mechanismOfAction || "Mechanism of action verified by clinical standards."}
                                                    </p>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-100">
                                                    <div className="flex items-end justify-between mb-4">
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-2xl font-black text-slate-900 tracking-tight">₹{med.price}</span>
                                                            <span className="text-sm text-slate-300 line-through mb-1">₹{med.originalPrice}</span>
                                                        </div>
                                                        <div className="text-[9px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                            Best Price
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePharmacyCartItem(med.id);
                                                        }}
                                                        className={`w-full py-3.5 font-black text-sm rounded-2xl border transition-all flex items-center justify-center gap-2 ${pharmacyCart.includes(med.id)
                                                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                            : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/20 active:scale-95'
                                                            }`}
                                                    >
                                                        {pharmacyCart.includes(med.id) ? (
                                                            <><Trash2 size={16} /> Remove From Cart</>
                                                        ) : (
                                                            <><ShoppingCart size={16} /> Add To Cart</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!searchQuery.trim() && (
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">
                                            Showing {filteredMedicines.length} medicines
                                        </p>
                                    </div>
                                )}

                                {!searchQuery.trim() && hasMoreMedicines && (
                                    <div ref={loadMoreSentinelRef} className="h-10 w-full flex items-center justify-center">
                                        {loadingMedicines && (
                                            <div className="inline-flex items-center gap-2 text-sm text-slate-500 font-semibold">
                                                <Loader2 size={16} className="animate-spin" />
                                                Loading more medicines...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Empty State */}
                                {filteredMedicines.length === 0 && !loadingMedicines && (
                                    <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                            <ShoppingBag size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">{t('pharmacy.noProducts')}</h3>
                                        <p className="text-slate-500 mt-2 max-w-xs mx-auto">{t('pharmacy.searchHint')}</p>
                                    </div>
                                )}

                                {loadingMedicines && (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <Loader2 size={40} className="text-brand-600 animate-spin mb-4" />
                                        <p className="text-slate-500 font-bold animate-pulse">Consulting AI for alternatives...</p>
                                    </div>
                                )}

                                {/* CART FLOATING BAR */}
                                {pharmacyCart.length > 0 && (
                                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:left-[calc(50%+130px)] z-[60] w-full max-w-lg px-6 animate-fade-in-up">
                                        <div className="bg-slate-900/95 backdrop-blur-xl text-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold">
                                                    {pharmacyCart.length}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estimated Total</p>
                                                    <p className="text-2xl font-black">₹{getPharmacyCartTotal()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleOpenCart}
                                                className="bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-brand-50 transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                                            >
                                                Checkout <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- VIEW: LAB TESTS (RESTORED & NEW UI) --- */}
                        {activeTab === 'lab-tests' && (
                            <div className="animate-fade-in">
                                {/* Categories Filter */}
                                <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
                                    <div className="flex gap-3">
                                        {LAB_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedLabCategory(cat)}
                                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${selectedLabCategory === cat
                                                    ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tests Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredLabTests.map((test) => (
                                        <div
                                            key={test.id}
                                            onClick={() => handleViewLabTest(test)}
                                            className="bg-white rounded-3xl border border-slate-200 flex flex-col justify-between hover:shadow-xl hover:shadow-brand-900/5 transition-all group relative overflow-hidden cursor-pointer"
                                        >
                                            {/* Image Banner */}
                                            <div className="h-40 overflow-hidden relative">
                                                <img src={test.image} alt={test.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border text-white backdrop-blur-md ${test.type === 'Package' ? 'bg-purple-500/80 border-purple-400' : 'bg-blue-500/80 border-blue-400'}`}>
                                                        {test.type}
                                                    </span>
                                                    {test.tat && (
                                                        <span className="text-[10px] font-bold text-white/90 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md">
                                                            <Clock size={10} /> {test.tat}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-5 flex flex-col flex-1">
                                                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-brand-600 transition-colors">{test.title}</h3>
                                                <p className="text-xs text-slate-500 mb-3">{test.test_count} Tests Included</p>

                                                {test.tags && test.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {test.tags.map((tag, i) => (
                                                            <span key={i} className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-4 border-t border-slate-50">
                                                    <div className="flex items-end gap-2 mb-4">
                                                        <span className="text-2xl font-bold text-slate-900">₹{test.price}</span>
                                                        <span className="text-sm text-slate-400 line-through mb-1">₹{test.original_price}</span>
                                                        <span className="text-sm font-bold text-green-600 mb-1">{test.discount}% off</span>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening modal
                                                            toggleCartItem(test);
                                                        }}
                                                        className={`w-full py-3 font-bold rounded-xl border transition-colors flex items-center justify-center gap-2 ${cart.some(item => item.id === test.id)
                                                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                            : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20'
                                                            }`}
                                                    >
                                                        {cart.some(item => item.id === test.id) ? (
                                                            <><Trash2 size={16} /> Remove</>
                                                        ) : (
                                                            <>Add To Cart</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Empty State */}
                                {filteredLabTests.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <FlaskConical size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No tests found</h3>
                                        <p className="text-slate-500">Try changing the category or search term.</p>
                                    </div>
                                )}

                                {/* CART FLOATING BAR */}
                                {cart.length > 0 && (
                                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+130px)] z-[60] w-full max-w-md px-4 animate-fade-in-up">
                                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold">{cart.length} Items Selected</p>
                                                <p className="text-xl font-bold">₹{getCartTotal()}</p>
                                            </div>
                                            <button
                                                onClick={handleOpenCart}
                                                className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-brand-50 transition-colors flex items-center gap-2 cursor-pointer"
                                            >
                                                View Cart <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- VIEW: PAYMENTS & RECEIPTS (NEW) --- */}
                        {activeTab === 'payments' && (
                            <div className="animate-fade-in space-y-6">
                                {/* ... (Payments content unchanged) ... */}
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div>
                                            <p className="text-slate-400 text-sm mb-1">Total Spent (This Year)</p>
                                            <h2 className="text-4xl font-bold">₹{paymentHistory.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h2>
                                        </div>
                                        <button className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center gap-2">
                                            <CreditCard size={18} /> Manage Cards
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900">Transaction History</h3>
                                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 tracking-wider">
                                                    <th className="p-6 font-semibold">Transaction ID</th>
                                                    <th className="p-6 font-semibold">Date</th>
                                                    <th className="p-6 font-semibold">Doctor / Service</th>
                                                    <th className="p-6 font-semibold">Amount</th>
                                                    <th className="p-6 font-semibold">Status</th>
                                                    <th className="p-6 font-semibold text-right">Receipt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {paymentHistory.map((receipt) => (
                                                    <tr key={receipt.transactionId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-6 font-mono text-slate-500">{receipt.transactionId}</td>
                                                        <td className="p-6 font-medium text-slate-900">{receipt.date}</td>
                                                        <td className="p-6">
                                                            <p className="font-bold text-slate-900">{receipt.doctorName}</p>
                                                            <p className="text-xs text-slate-500">{receipt.description}</p>
                                                        </td>
                                                        <td className="p-6 font-bold text-slate-900">₹{receipt.amount}</td>
                                                        <td className="p-6">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                                <Check size={10} /> {receipt.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                                                <Receipt size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- VIEW: BOOK DOCTOR --- */}
                        {activeTab === 'book-doctor' && (
                            <div className="animate-fade-in">

                                {/* Filters & Search */}
                                <div className="mb-8">
                                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                                        <div className="relative flex-1">
                                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search doctor, condition, or specialty..."
                                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition-all shadow-sm"
                                            />
                                        </div>
                                        <button className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 transition-all flex items-center gap-2 shadow-sm">
                                            <Filter size={20} /> Filters
                                        </button>
                                    </div>

                                    {/* Filter Pills */}
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {SPECIALTY_FILTERS.map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setSelectedSpecialty(filter)}
                                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${selectedSpecialty === filter
                                                    ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                                                    }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Doctors Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredDoctors.map((doctor) => (
                                        <div key={doctor.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                                                    <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[10px] font-bold text-white bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded">
                                                        <Star size={8} className="fill-amber-400 text-amber-400" /> {doctor.rating}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate pr-2">{doctor.name}</h3>
                                                        <button className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Heart size={18} />
                                                        </button>
                                                    </div>
                                                    <p className="text-brand-600 text-xs font-bold uppercase tracking-wide mt-1">{doctor.specialty}</p>
                                                    <p className="text-slate-500 text-sm mt-0.5 truncate">{doctor.hospital} • {doctor.experience} Exp</p>
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Next Available</p>
                                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                                        <Clock size={14} className="text-brand-500" /> {doctor.nextAvailable}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Consultation</p>
                                                    <p className="text-sm font-bold text-slate-900">₹{doctor.price}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => openBookingModal(doctor)}
                                                className="w-full mt-4 py-3 bg-brand-50 text-brand-600 font-bold rounded-xl border border-brand-100 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all active:scale-95"
                                            >
                                                Book Appointment
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {filteredDoctors.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <Search size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No doctors found</h3>
                                        <p className="text-slate-500">Try adjusting your filters or search query.</p>
                                        <button
                                            onClick={() => { setSelectedSpecialty('All'); setSearchQuery(''); }}
                                            className="mt-4 text-brand-600 font-bold hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- VIEW: MY ORDERS (NEW) --- */}
                        {activeTab === 'orders' && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Medicine Orders</h2>
                                        <p className="text-slate-500 font-medium">Track your pharmacy orders and delivery status</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('pharmacy')}
                                        className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <ShoppingBag size={18} /> Order Medicines
                                    </button>
                                </div>

                                {loadingOrders ? (
                                    <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                                        <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="text-slate-500 mt-4">Loading orders...</p>
                                    </div>
                                ) : medicineOrders.length === 0 ? (
                                    <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <Package size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto mb-8">You haven't placed any medicine orders yet. Your order history will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {medicineOrders.map((order) => (
                                            <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5 transition-all p-6 md:p-8">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center shadow-inner">
                                                            <Package size={28} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Order ID: {order.id.slice(0, 8)}</span>
                                                                <span className="text-slate-200">•</span>
                                                                <span className="text-xs font-bold text-slate-500">{new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-slate-900">{order.full_name}</h3>
                                                            <p className="text-sm font-medium text-slate-500">{order.items?.length || 0} items • {order.city}, {order.state}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                                                            <p className="text-2xl font-black text-slate-900">₹{order.total_amount}</p>
                                                        </div>
                                                        <div className={`px-4 py-2 rounded-full text-xs font-black uppercase ${order.status === 'Delivered' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                order.status === 'Processing' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                                            }`}>
                                                            {order.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Shipping Address */}
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shipping Address</p>
                                                    <p className="text-sm font-medium text-slate-700">{order.address}</p>
                                                    <p className="text-sm text-slate-600">{order.city}, {order.state} - {order.pincode}</p>
                                                    <p className="text-sm text-slate-600 mt-1">Phone: {order.phone}</p>
                                                </div>

                                                {/* Order Items */}
                                                {order.items && order.items.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Items</p>
                                                        <div className="space-y-2">
                                                            {order.items.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl">
                                                                    {item.image && (
                                                                        <img src={item.image} alt={item.name || 'Medicine'} className="w-12 h-12 rounded-lg object-contain bg-slate-50" />
                                                                    )}
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-slate-900">{item.name || 'Medicine'}</p>
                                                                        <p className="text-xs text-slate-500">Qty: {item.quantity || 1}</p>
                                                                    </div>
                                                                    <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* MEDICINE DETAILS MODAL */}
            {/* MEDICINE DETAILS MODAL (RE-DESIGNED) */}
            {
                viewMedicine && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in-up h-full max-h-[90vh] md:max-h-[85vh]">

                            {/* Left: Image Section */}
                            <div className="md:w-2/5 bg-slate-50 p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-100">
                                <img src={viewMedicine.image} alt={viewMedicine.name} className="w-full h-auto max-h-64 object-contain mix-blend-multiply" />
                                {viewMedicine.discount > 0 && (
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-green-500 text-white font-black px-4 py-1.5 rounded-full text-xs shadow-lg">
                                            {viewMedicine.discount}% DISCOUNT
                                        </span>
                                    </div>
                                )}
                                {viewMedicine.isGeneric && (
                                    <div className="absolute bottom-6 left-6">
                                        <span className="bg-brand-600 text-white font-black px-4 py-1.5 rounded-full text-[10px] shadow-lg flex items-center gap-2">
                                            <ShieldCheck size={12} /> VERIFIED GENERIC
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Info Section */}
                            <div className="md:w-3/5 p-8 flex flex-col overflow-y-auto custom-scrollbar h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <p className="text-brand-600 font-black text-[10px] tracking-widest uppercase">{viewMedicine.category}</p>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase leading-tight">{viewMedicine.name}</h2>
                                        {viewMedicine.genericName && (
                                            <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                                                Molecular Compound: <span className="text-slate-600 underline decoration-brand-200 decoration-2">{viewMedicine.genericName}</span>
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={closeMedicineModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* TABS / SECTIONS */}
                                <div className="space-y-6">
                                    {/* Mechanism of Action Section */}
                                    <div className="bg-brand-50/50 rounded-3xl p-6 border border-brand-100">
                                        <div className="flex items-center gap-2 mb-3 text-brand-700">
                                            <BrainCircuit size={18} />
                                            <h4 className="font-bold text-sm uppercase tracking-wide">How it Works (Mechanism of Action)</h4>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {viewMedicine.mechanismOfAction || "This certified pharmaceutical product acts directly on the target receptors to provide systemic relief and manage symptoms effectively."}
                                        </p>
                                    </div>

                                    {/* Product Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Manufacturer</p>
                                            <p className="text-sm font-bold text-slate-800">{viewMedicine.manufacturer}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pack Size</p>
                                            <p className="text-sm font-bold text-slate-800">{viewMedicine.packSize}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dosage Form</p>
                                            <p className="text-sm font-bold text-slate-800">{viewMedicine.type}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Strength</p>
                                            <p className="text-sm font-bold text-slate-800">{viewMedicine.dosage || 'Standard'}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 mb-2">About Medicine</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">{viewMedicine.description}</p>
                                    </div>

                                    {/* CART ACTION */}
                                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Payable</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl font-black text-slate-900">₹{viewMedicine.price}</span>
                                                <span className="text-lg text-slate-300 line-through">₹{viewMedicine.originalPrice}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => togglePharmacyCartItem(viewMedicine.id)}
                                            className={`px-10 py-4 font-black rounded-2xl transition-all flex items-center gap-2 shadow-xl ${pharmacyCart.includes(viewMedicine.id)
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20 active:scale-95'
                                                }`}
                                        >
                                            {pharmacyCart.includes(viewMedicine.id) ? (
                                                <><Trash2 size={20} /> Remove Item</>
                                            ) : (
                                                <><ShoppingCart size={20} /> Add To Cart</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* AI FAB (Fixed Bottom Right) */}
            <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-600/40 flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95 group relative"
                >
                    <MessageCircle size={28} className="group-hover:animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            </div>

            {/* NEW CHATBOT COMPONENT */}
            <ChatBot
                userName={userName}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onBookAppointment={(doctor, notes) => {
                    setIsChatOpen(false);
                    openBookingModal(doctor, notes);
                }}
            />

            {/* VIEW ALL SYMPTOMS MODAL */}
            {
                viewAllSymptomsOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">Select Symptoms</h3>
                                <button
                                    onClick={() => setViewAllSymptomsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <p className="text-slate-500 mb-6">Select a symptom to start an AI assessment and find the right specialist.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {SYMPTOMS_LIST.map((symptom) => (
                                        <button
                                            key={symptom.id}
                                            onClick={() => handleSymptomClick(symptom)}
                                            className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all group text-center"
                                        >
                                            <div className={`w-12 h-12 rounded-xl ${symptom.bg} ${symptom.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                                <symptom.icon size={24} />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm group-hover:text-brand-700">{symptom.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* LAB CART & CHECKOUT MODAL (Slide Up) */}
            {
                isCartOpen && (
                    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-lg h-[85vh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col relative">

                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                                {(labBookingStep === 'cart' && activeTab !== 'pharmacy') || (pharmacyBookingStep === 'cart' && activeTab === 'pharmacy') ? (
                                    <div className="flex items-center gap-3">
                                        {/* Standardized Cart Icon */}
                                        <ShoppingCart size={24} className="text-brand-600" />
                                        <h3 className="text-xl font-bold text-slate-900">Your Cart</h3>
                                        <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {activeTab === 'pharmacy' ? pharmacyCart.length : cart.length} Items
                                        </span>
                                    </div>
                                ) : null}

                                {(labBookingStep === 'payment' || pharmacyBookingStep === 'payment' || pharmacyBookingStep === 'shipping') && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => activeTab === 'pharmacy'
                                                ? (pharmacyBookingStep === 'payment' ? setPharmacyBookingStep('shipping') : setPharmacyBookingStep('cart'))
                                                : setLabBookingStep('cart')
                                            }
                                            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 mr-1"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <h3 className="text-xl font-bold text-slate-900">{pharmacyBookingStep === 'shipping' ? 'Shipping' : 'Checkout'}</h3>
                                    </div>
                                )}

                                {(labBookingStep === 'success' || pharmacyBookingStep === 'success') && (
                                    <h3 className="text-xl font-bold text-slate-900">Order Confirmed</h3>
                                )}

                                {(labBookingStep !== 'success' && pharmacyBookingStep !== 'success') && (
                                    <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                                {/* === LAB TESTS CART === */}
                                {activeTab !== 'pharmacy' && labBookingStep === 'cart' && (
                                    cart.length > 0 ? (
                                        <div className="p-6 space-y-4">
                                            {cart.map(item => (
                                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${item.type === 'Package' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.title}</h4>
                                                        <div className="flex items-baseline gap-2 mt-2">
                                                            <span className="font-bold text-brand-600">₹{item.price}</span>
                                                            <span className="text-xs text-slate-400 line-through">₹{item.original_price}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleCartItem(item)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6">
                                            <ShoppingCart size={48} className="text-slate-200 mb-4" />
                                            <p className="text-slate-500 font-medium">Your cart is empty.</p>
                                            <button onClick={() => setIsCartOpen(false)} className="mt-4 text-brand-600 font-bold hover:underline">Browse Tests</button>
                                        </div>
                                    )
                                )}

                                {/* === PHARMACY CART === */}
                                {activeTab === 'pharmacy' && pharmacyBookingStep === 'cart' && (
                                    pharmacyCart.length > 0 ? (
                                        <div className="p-6 space-y-4">
                                            {pharmacyCart.map(id => {
                                                const item = MEDICINES.find(t => t.id === id);
                                                if (!item) return null;
                                                return (
                                                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mr-4">
                                                            <img src={item.image} alt={item.name} className="h-12 w-12 object-contain mix-blend-multiply" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                                                            <p className="text-[10px] text-slate-500 mb-1">{item.packSize}</p>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-bold text-slate-900">₹{item.price}</span>
                                                                <span className="text-xs text-slate-400 line-through">₹{item.originalPrice}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => togglePharmacyCartItem(item.id)}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6">
                                            <ShoppingCart size={48} className="text-slate-200 mb-4" />
                                            <p className="text-slate-500 font-medium">Your pharmacy cart is empty.</p>
                                            <button onClick={() => setIsCartOpen(false)} className="mt-4 text-brand-600 font-bold hover:underline">Browse Medicines</button>
                                        </div>
                                    )
                                )}

                                {/* === PHARMACY SHIPPING === */}
                                {activeTab === 'pharmacy' && pharmacyBookingStep === 'shipping' && (
                                    <div className="p-6 space-y-4">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Delivery Address</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={shippingAddress.fullName}
                                                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-500 outline-none text-sm"
                                                        placeholder="Receiver's name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        value={shippingAddress.phone}
                                                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-500 outline-none text-sm"
                                                        placeholder="+91 00000 00000"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Street Address</label>
                                                    <textarea
                                                        value={shippingAddress.address}
                                                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-500 outline-none text-sm h-24"
                                                        placeholder="Flat, House no., Building, Company, Apartment"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">City</label>
                                                        <input
                                                            type="text"
                                                            value={shippingAddress.city}
                                                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-500 outline-none text-sm"
                                                            placeholder="City"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pincode</label>
                                                        <input
                                                            type="text"
                                                            value={shippingAddress.pincode}
                                                            onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand-500 outline-none text-sm"
                                                            placeholder="6-digit PIN"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === PHARMACY PAYMENT === */}
                                {activeTab === 'pharmacy' && pharmacyBookingStep === 'payment' && (
                                    <div className="p-6">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Order Summary</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Items ({pharmacyCart.length})</span>
                                                    <span>₹{getPharmacyCartTotal()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Shipping</span>
                                                    <span className={getPharmacyCartTotal() > 500 ? "text-green-600 font-bold" : "text-slate-900"}>
                                                        {getPharmacyCartTotal() > 500 ? "FREE" : "₹50"}
                                                    </span>
                                                </div>
                                                <div className="border-t border-slate-100 my-2 pt-2 flex justify-between font-bold text-slate-900 text-lg">
                                                    <span>Total Pay</span>
                                                    <span>₹{getPharmacyCartTotal() + (getPharmacyCartTotal() > 500 ? 0 : 50)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Payment Method</h4>
                                        <div className="space-y-3">
                                            <div className="p-4 border-2 border-brand-500 bg-brand-50 rounded-2xl flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-600 shadow-sm">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-900">Online Payment</p>
                                                    <p className="text-[10px] text-brand-600 font-bold">Safe & Secure Transaction</p>
                                                </div>
                                                <div className="w-5 h-5 border-4 border-brand-600 rounded-full bg-white flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="p-4 border border-slate-100 bg-white rounded-2xl flex items-center gap-4 opacity-50">
                                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Truck size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-400">Cash on Delivery</p>
                                                    <p className="text-[10px] text-slate-400">Unavailable for this pincode</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === LAB PAYMENT === */}
                                {activeTab !== 'pharmacy' && labBookingStep === 'payment' && (
                                    <div className="p-6">
                                        {/* Order Summary */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Order Summary</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Lab Tests ({cart.length})</span>
                                                    <span>₹{getCartTotal()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Sample Collection</span>
                                                    <span className="text-green-600 font-bold">FREE</span>
                                                </div>
                                                <div className="border-t border-slate-100 my-2 pt-2 flex justify-between font-bold text-slate-900 text-lg">
                                                    <span>Total Pay</span>
                                                    <span>₹{getCartTotal()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Form */}
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Payment Method</h4>
                                        <div className="space-y-4 mb-8">
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input type="text" placeholder="Card Number" className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                <input type="text" placeholder="CVV" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === PHARMACY SHIPPING === */}
                                {activeTab === 'pharmacy' && pharmacyBookingStep === 'shipping' && (
                                    <div className="p-6">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Shipping Address</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">Full Name</label>
                                                <input type="text" defaultValue="Daniel Bruk" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">Street Address</label>
                                                <input type="text" placeholder="House No, Street" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">City</label>
                                                    <input type="text" placeholder="Bangalore" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-700">Pincode</label>
                                                    <input type="text" placeholder="560001" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === PHARMACY PAYMENT === */}
                                {activeTab === 'pharmacy' && pharmacyBookingStep === 'payment' && (
                                    <div className="p-6">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Order Summary</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Medicines ({pharmacyCart.length})</span>
                                                    <span>₹{getPharmacyCartTotal()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Delivery</span>
                                                    <span className="text-green-600 font-bold">FREE</span>
                                                </div>
                                                <div className="border-t border-slate-100 my-2 pt-2 flex justify-between font-bold text-slate-900 text-lg">
                                                    <span>Total Pay</span>
                                                    <span>₹{getPharmacyCartTotal()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Payment Method</h4>
                                        <div className="space-y-4 mb-8">
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input type="text" placeholder="Card Number" className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                <input type="text" placeholder="CVV" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === SUCCESS STATES === */}
                                {(labBookingStep === 'success' || pharmacyBookingStep === 'success') && (
                                    <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                            <Check size={40} className="text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h3>
                                        <p className="text-slate-500 mb-8">
                                            {activeTab === 'pharmacy' ? 'Your medicines will be delivered within 24 hours.' : 'Your lab test appointment has been scheduled successfully.'}
                                        </p>
                                        {activeTab === 'pharmacy' ? (
                                            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                                <Truck className="text-brand-600" />
                                                <div className="text-left">
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Estimated Delivery</p>
                                                    <p className="font-bold text-slate-900">Tomorrow, by 6 PM</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                                <Calendar className="text-brand-600" />
                                                <div className="text-left">
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Sample Collection</p>
                                                    <p className="font-bold text-slate-900">Tomorrow, 08:00 AM</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* Modal Footer (Sticky) */}
                            {(labBookingStep !== 'success' && pharmacyBookingStep !== 'success') && (
                                <div className="p-6 border-t border-slate-100 bg-white">

                                    {/* LAB: CART -> CHECKOUT */}
                                    {activeTab !== 'pharmacy' && labBookingStep === 'cart' && (
                                        <button
                                            onClick={handleLabCheckout}
                                            disabled={cart.length === 0}
                                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            Proceed to Checkout <ChevronRight size={18} />
                                        </button>
                                    )}

                                    {/* LAB: PAYMENT -> PAY */}
                                    {activeTab !== 'pharmacy' && labBookingStep === 'payment' && (
                                        <button
                                            onClick={handleConfirmLabPayment}
                                            disabled={isProcessingLabPayment}
                                            className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isProcessingLabPayment ? 'Processing...' : `Pay ₹${getCartTotal()}`}
                                        </button>
                                    )}

                                    {/* PHARMACY: CART -> SHIPPING */}
                                    {activeTab === 'pharmacy' && pharmacyBookingStep === 'cart' && (
                                        <button
                                            onClick={handlePharmacyCheckout}
                                            disabled={pharmacyCart.length === 0}
                                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            Proceed to Shipping <ChevronRight size={18} />
                                        </button>
                                    )}

                                    {/* PHARMACY: SHIPPING -> PAYMENT */}
                                    {activeTab === 'pharmacy' && pharmacyBookingStep === 'shipping' && (
                                        <button
                                            onClick={handlePharmacyShipping}
                                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Proceed to Payment <ChevronRight size={18} />
                                        </button>
                                    )}

                                    {/* PHARMACY: PAYMENT -> PAY */}
                                    {activeTab === 'pharmacy' && pharmacyBookingStep === 'payment' && (
                                        <button
                                            onClick={handleConfirmPharmacyPayment}
                                            disabled={isProcessingPharmaPayment}
                                            className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isProcessingPharmaPayment ? 'Processing...' : `Pay ₹${getPharmacyCartTotal()}`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Success Footer */}
                            {(labBookingStep === 'success' || pharmacyBookingStep === 'success') && (
                                <div className="p-6 border-t border-slate-100 bg-white">
                                    <button
                                        onClick={activeTab === 'pharmacy' ? handlePharmacyOrderComplete : handleShowLabReceipt}
                                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                                    >
                                        View Receipt
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                )
            }

            {/* Booking Modal for Doctor - Needs to be rendered if selectedDoctor is not null */}
            {
                selectedDoctor && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {bookingStep === 'details' ? 'Book Appointment' :
                                        bookingStep === 'payment' ? 'Confirm & Pay' : 'Booking Confirmed'}
                                </h3>
                                {bookingStep !== 'success' && (
                                    <button onClick={closeBookingModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {bookingStep === 'details' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <img src={selectedDoctor.image} className="w-16 h-16 rounded-xl object-cover" alt="Doctor" />
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-900">{selectedDoctor.name}</h4>
                                                <p className="text-sm text-slate-500">{selectedDoctor.specialty} • {selectedDoctor.hospital}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Consultation Type</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setBookingType('video')}
                                                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${bookingType === 'video' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                                >
                                                    <Video size={18} /> Video Call
                                                </button>
                                                <button
                                                    onClick={() => setBookingType('clinic')}
                                                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${bookingType === 'clinic' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                                >
                                                    <MapPin size={18} /> Clinic Visit
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Select Date</label>
                                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                {['Today', 'Tomorrow', 'Fri, 28 Jan', 'Sat, 29 Jan'].map(date => (
                                                    <button
                                                        key={date}
                                                        onClick={() => setBookingDate(date)}
                                                        className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${bookingDate === date ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                                                    >
                                                        {date}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Select Time</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM', '06:00 PM', '07:30 PM'].map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setBookingTime(time)}
                                                        className={`px-2 py-2 rounded-lg border text-sm font-medium transition-all ${bookingTime === time ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleProceedToPayment}
                                            disabled={!bookingTime}
                                            className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                        >
                                            Proceed to Pay ₹{selectedDoctor.price}
                                        </button>
                                    </div>
                                )}

                                {bookingStep === 'payment' && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex justify-between mb-2 text-sm text-slate-600">
                                                <span>Consultation Fee</span>
                                                <span>₹{selectedDoctor.price}</span>
                                            </div>
                                            <div className="flex justify-between mb-2 text-sm text-slate-600">
                                                <span>Service Charge</span>
                                                <span>₹50</span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900 text-lg">
                                                <span>Total</span>
                                                <span>₹{selectedDoctor.price + 50}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-3 block">Card Details</label>
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                    <input type="text" placeholder="Card Number" className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                    <input type="text" placeholder="CVV" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConfirmPayment}
                                            disabled={isProcessingPayment}
                                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessingPayment ? 'Processing...' : `Pay ₹${selectedDoctor.price + 50}`}
                                        </button>
                                    </div>
                                )}

                                {bookingStep === 'success' && (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Check size={40} className="text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
                                        <p className="text-slate-500 mb-8">
                                            Your appointment with Dr. {selectedDoctor.name} has been scheduled for {bookingDate} at {bookingTime}.
                                        </p>
                                        <button
                                            onClick={closeBookingModal}
                                            className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-all"
                                        >
                                            Go to Appointments
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* VIDEO CALL OVERLAY */}
            {
                isCallOpen && activeCallRoom && (
                    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-fade-in">
                        <div className="flex-1 relative">
                            <JitsiMeet
                                roomName={activeCallRoom}
                                displayName={userName}
                                onLeave={handleCloseCall}
                                className="w-full h-full"
                            />
                            <button
                                onClick={handleCloseCall}
                                className="absolute top-6 right-6 z-10 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                            >
                                <Phone size={18} className="rotate-[135deg]" /> Leave Call
                            </button>
                        </div>
                    </div>
                )
            }

            {/* LAB TEST DETAILS MODAL */}
            {
                viewLabTest && (
                    <LabTestDetails
                        test={viewLabTest}
                        onClose={() => setViewLabTest(null)}
                        onAddToCart={(test) => {
                            if (!cart.find(c => c.id === test.id)) {
                                toggleCartItem(test);
                            }
                            setViewLabTest(null);
                            // Optional: Open cart or show toast
                            setIsCartOpen(true);
                        }}
                    />
                )
            }

            {/* LAB RECEIPT MODAL */}
            {
                showLabReceipt && (
                    <LabReceipt
                        transactionId={lastTransactionId}
                        patientName={userName}
                        date={new Date().toLocaleDateString()}
                        items={cart.map(item => ({ title: item.title, price: item.price }))}
                        totalAmount={getCartTotal()}
                        onClose={() => {
                            setShowLabReceipt(false);
                            setLabBookingStep('cart');
                            setCart([]);
                            setIsCartOpen(false);
                            setActiveTab('overview'); // or stay on lab-tests
                        }}
                    />
                )
            }

        </div >
    );
};

export default PatientDashboard;