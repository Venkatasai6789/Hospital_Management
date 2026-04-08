import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X, Bot, User, BrainCircuit, Sparkles, Pill, Activity, ChevronDown, ChevronUp, FileText, Star, MapPin, Calendar, Clock, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiService, DiseasePredictionResponse, MedicineAlternativeResponse } from '../src/services/aiService';
import { supabase } from '../src/lib/supabase';

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text?: string;
    type: 'text' | 'doctor_report' | 'medicine_alternatives' | 'doctor_recommendations' | 'error';
    data?: any; // For structured data like doctor report or medicine alternatives
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
}

interface ChatBotProps {
    userName: string;
    isOpen: boolean;
    onClose: () => void;
    onBookAppointment: (doctor: any, notes?: string) => void;
}

const DISEASE_SPECIALTY_MAP: Record<string, string> = {
    // Cardiology
    'Hypertension': 'Cardiology',
    'Heart Disease': 'Cardiology',
    'Coronary Artery Disease': 'Cardiology',

    // Psychiatry
    'Depression': 'Psychiatry',
    'Anxiety': 'Psychiatry',

    // Oncology
    'Cancer': 'Oncology',
    'Tumor': 'Oncology',

    // Neurology
    'Migraine': 'Neurology',
    'Epilepsy': 'Neurology',
    'Stroke': 'Neurology',

    // Dermatology
    'Eczema': 'Dermatology',
    'Psoriasis': 'Dermatology',
    'Acne': 'Dermatology',

    // Orthopedics
    'Arthritis': 'Orthopedics',
    'Fracture': 'Orthopedics',
    'Back Pain': 'Orthopedics',

    // Gynecology
    'PCOS': 'Gynecology',
    'Menstrual Disorders': 'Gynecology',

    // Pediatrics
    'Childhood Diseases': 'Pediatrics',

    // Dental
    'Tooth Pain': 'Dental Surgery',
    'Gum Disease': 'Dental Surgery',

    // General Medicine (FALLBACK)
    'Malaria': 'General Medicine',
    'Typhoid': 'General Medicine',
    'Dengue': 'General Medicine',
    'Fever': 'General Medicine',
    'Cold': 'General Medicine',
    'Flu': 'General Medicine',
    'Fungal Infection': 'Dermatology',
    'Allergy': 'General Medicine',
    'Drug Reaction': 'General Medicine',
    'AIDS': 'General Medicine',
    'Diabetes': 'General Medicine',
    'Gastroenteritis': 'General Medicine',
    'Bronchial Asthma': 'General Medicine',
    'Alcoholic Hepatitis': 'General Medicine',
    'Tuberculosis': 'General Medicine',
    'Pneumonia': 'General Medicine',
    'Hepatitis A': 'General Medicine',
    'Hepatitis B': 'General Medicine',
    'Hepatitis C': 'General Medicine',
    'Hepatitis D': 'General Medicine',
    'Hepatitis E': 'General Medicine',
    'Varicose Veins': 'General Medicine',
    'Hypothyroidism': 'General Medicine',
    'Hyperthyroidism': 'General Medicine',
    'Hypoglycemia': 'General Medicine',
    'Osteoarthristis': 'Orthopedics',
    '(vertigo) Paroymsal  Positional Vertigo': 'Neurology',
    'Urinary Tract Infection': 'General Medicine',
    'Impetigo': 'Dermatology',
    'default': 'General Medicine'
};

const ChatBot: React.FC<ChatBotProps> = ({ userName, isOpen, onClose, onBookAppointment }) => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'bot',
            type: 'text',
            text: t('chat.welcome', { name: userName })
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [mode, setMode] = useState<'symptom' | 'medicine'>('symptom');
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isTyping, isLoadingDoctors]);

    const fetchDoctors = async (specialty: string) => {
        try {
            const mappedSpecialty = DISEASE_SPECIALTY_MAP[specialty] || DISEASE_SPECIALTY_MAP['default'];

            let { data, error } = await supabase
                .from('doctors')
                .select('*')
                .eq('specialty', mappedSpecialty)
                .eq('approval_status', 'approved')
                .limit(3);

            if (error) throw error;

            // If no doctors found in that specialty, fallback to General Medicine
            if (!data || data.length === 0) {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('specialty', 'General Medicine')
                    .eq('approval_status', 'approved')
                    .limit(3);

                if (fallbackError) throw fallbackError;
                data = fallbackData;
            }

            return data?.map(doc => ({
                id: doc.id,
                name: `Dr. ${doc.first_name} ${doc.surname}`,
                specialty: doc.specialty,
                hospital: doc.hospital_name,
                rating: 4.8, // Mock as not in DB
                reviews: 124, // Mock
                experience: `${doc.years_of_experience} Years`,
                image: `https://ui-avatars.com/api/?name=${doc.first_name}+${doc.surname}&background=6366f1&color=fff`,
                nextAvailable: 'Today, 4:00 PM',
                price: 500,
                location: doc.hospital_location || 'Consultation Clinic',
                distance: '2.5 km',
                travelTime: '15 mins'
            })) || [];
        } catch (error) {
            console.error('Error fetching doctors:', error);
            return [];
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            type: 'text',
            text: inputValue
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const currentLang = i18n.language === 'ta' ? 'tamil' : 'english';
            if (mode === 'symptom') {
                const response: DiseasePredictionResponse = await aiService.predictDisease(userMsg.text || '', currentLang);

                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    type: 'text',
                    text: response.patient_response
                };

                const reportMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    sender: 'bot',
                    type: 'doctor_report',
                    data: {
                        disease: response.disease,
                        confidence: response.confidence,
                        report: response.doctor_report
                    }
                };

                setMessages(prev => [...prev, botMsg, reportMsg]);

                // Fetch Doctors based on predicted disease
                const confidenceVal = parseFloat(response.confidence.replace('%', ''));
                setIsLoadingDoctors(true);
                const doctors = await fetchDoctors(response.disease);
                setIsLoadingDoctors(false);

                const recoMsg: Message = {
                    id: (Date.now() + 3).toString(),
                    sender: 'bot',
                    type: 'doctor_recommendations',
                    data: {
                        doctors,
                        severity: confidenceVal >= 60 ? 'serious' : 'mild',
                        disease: response.disease,
                        doctor_report: response.doctor_report,
                        assessment: {
                            symptoms: userMsg.text,
                            disease: response.disease,
                            confidence: response.confidence,
                            doctorReport: response.doctor_report
                        }
                    }
                };
                setMessages(prev => [...prev, recoMsg]);

            } else {
                // Medicine Mode
                const response: MedicineAlternativeResponse = await aiService.findGeneric(userMsg.text || '', currentLang);

                let textResponse = response.message;
                if (response.status === 'found' && response.alternatives.length > 0) {
                    textResponse = t('chat.foundSubstitutes', { count: response.alternatives.length, brand: response.original_brand });
                }

                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    type: 'text',
                    text: textResponse
                };

                const altsMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    sender: 'bot',
                    type: 'medicine_alternatives',
                    data: response
                };

                setMessages(prev => [...prev, botMsg, altsMsg]);
            }
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                type: 'error',
                text: t('chat.errorConnecting')
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setIsLoadingDoctors(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-full max-w-[480px] animate-fade-in-up">
            <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col h-[680px]">

                {/* Header */}
                <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner group">
                            <BrainCircuit className="text-white group-hover:scale-110 transition-transform" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-xl tracking-tight">{t('chat.aiName')}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${isTyping || isLoadingDoctors ? 'bg-amber-300 animate-pulse' : 'bg-emerald-400'}`}></span>
                                <span className="text-brand-50 text-xs font-semibold uppercase tracking-wider">
                                    {isTyping ? t('chat.analyzing') : isLoadingDoctors ? t('chat.finding') : t('chat.ready')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90 border border-transparent hover:border-white/20">
                        <X size={22} />
                    </button>
                </div>

                {/* Mode Switcher */}
                <div className="bg-slate-50 p-2.5 flex gap-2 border-b border-slate-200/60">
                    <button
                        onClick={() => setMode('symptom')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-bold transition-all ${mode === 'symptom' ? 'bg-white text-brand-600 shadow-md border border-brand-100' : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'}`}
                    >
                        <Activity size={18} /> {t('chat.symptomCheck')}
                    </button>
                    <button
                        onClick={() => setMode('medicine')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-bold transition-all ${mode === 'medicine' ? 'bg-white text-brand-600 shadow-md border border-brand-100' : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'}`}
                    >
                        <Pill size={18} /> {t('chat.medFinder')}
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fdfdfd] relative custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>

                                {msg.sender === 'bot' && (
                                    <div className="flex items-center gap-2 mb-2 ml-1">
                                        <div className="w-6 h-6 bg-brand-600 rounded-lg flex items-center justify-center shadow-md shadow-brand-500/20">
                                            <Sparkles size={12} className="text-white fill-current animate-pulse-slow" />
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">{t('chat.aiName')}</span>
                                    </div>
                                )}

                                <div className={`group relative px-5 py-4 rounded-[2rem] shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-brand-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                    }`}>
                                    {msg.sender === 'bot' ? (
                                        <div className="prose prose-slate prose-sm max-w-none prose-headings:text-brand-700 prose-strong:text-brand-600 prose-p:leading-relaxed">
                                            <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                    {msg.sender === 'user' && (
                                        <div className="absolute -left-10 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Special Message Types */}
                                {msg.type === 'doctor_report' && msg.data && (
                                    <div className="mt-3 w-full bg-white rounded-3xl border border-brand-100 overflow-hidden shadow-md animate-fade-in-up">
                                        <div className="bg-brand-50/80 p-4 flex items-center justify-between border-b border-brand-100">
                                            <div className="flex items-center gap-2">
                                                <FileText size={18} className="text-brand-600" />
                                                <span className="font-bold text-brand-900 text-sm tracking-tight uppercase">{t('chat.clinicalAssessment')}</span>
                                            </div>
                                            <div className="px-2 py-1 bg-brand-600 text-[10px] text-white font-black rounded-md uppercase tracking-tighter">{t('chat.aiAnalysis')}</div>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('chat.suspectedCondition')}</span>
                                                    <p className="font-extrabold text-slate-900 text-lg leading-tight">{msg.data.disease}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('chat.confidence')}</span>
                                                    <p className="font-black text-brand-600 text-lg leading-tight">{msg.data.confidence}</p>
                                                </div>
                                            </div>

                                            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: msg.data.confidence }}></div>
                                            </div>

                                            <div className="bg-slate-50/80 p-4 rounded-2xl text-[13px] text-slate-600 border border-slate-200/50 leading-relaxed italic">
                                                "{msg.data.report}"
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'doctor_recommendations' && msg.data && (
                                    <div className="mt-4 w-full space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${msg.data.severity === 'serious' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                            <div className="mt-0.5">
                                                {msg.data.severity === 'serious' ? <ShieldCheck size={20} /> : <Info size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">
                                                    {msg.data.severity === 'serious'
                                                        ? t('chat.recommendation_serious')
                                                        : t('chat.recommendation_routine')}
                                                </h4>
                                                <p className="text-xs mt-1 opacity-90 leading-relaxed">
                                                    {msg.data.severity === 'serious'
                                                        ? t('chat.rec_desc_serious', { disease: msg.data.disease })
                                                        : t('chat.rec_desc_routine')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('chat.availableDoctors', { specialty: DISEASE_SPECIALTY_MAP[msg.data.disease] || 'General Medicine' })}</span>
                                            {msg.data.doctors.length > 0 ? (
                                                msg.data.doctors.map((doc: Doctor) => (
                                                    <div key={doc.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                                        <div className="flex gap-4">
                                                            <div className="relative">
                                                                <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100" />
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-lg flex items-center justify-center">
                                                                    <Star size={10} className="text-white fill-current" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <h5 className="font-extrabold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{doc.name}</h5>
                                                                    <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                                                        <Star size={10} className="text-amber-500 fill-current" />
                                                                        <span className="text-[10px] font-bold text-slate-700">{doc.rating}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-brand-600 font-bold">{doc.specialty}</p>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                                                        <MapPin size={10} /> {doc.hospital}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                                                        <Clock size={10} /> {doc.experience}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex gap-3">
                                                            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                                <Calendar size={14} className="text-brand-500" />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{doc.nextAvailable}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => onBookAppointment(doc, JSON.stringify(msg.data.assessment))}
                                                                className="px-6 py-2.5 bg-slate-900 border border-slate-900 text-white text-[11px] font-black rounded-2xl hover:bg-brand-600 hover:border-brand-600 active:scale-95 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 group/btn"
                                                            >
                                                                {t('chat.bookNow')}
                                                                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                    <p className="text-sm text-slate-400 font-medium italic">{t('chat.searchingSpecialists')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'medicine_alternatives' && msg.data && msg.data.alternatives && msg.data.alternatives.length > 0 && (
                                    <div className="mt-3 w-full bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-md animate-fade-in-up">
                                        <div className="bg-emerald-50/80 p-4 flex items-center gap-2 border-b border-emerald-100">
                                            <Pill size={18} className="text-emerald-600" />
                                            <span className="font-bold text-emerald-900 text-sm uppercase tracking-tight">{t('chat.verifiedAlternatives')}</span>
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {msg.data.alternatives.map((alt: string, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between gap-3 text-sm text-slate-700 bg-emerald-50/40 px-4 py-3 rounded-2xl border border-emerald-100/60 hover:border-emerald-300 transition-colors group cursor-default">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 bg-emerald-500 rounded-full group-hover:scale-125 transition-transform"></div>
                                                            <span className="font-semibold text-slate-800">{alt}</span>
                                                        </div>
                                                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-100/50 px-2 py-0.5 rounded-md">{t('chat.substitute')}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/50 flex items-start gap-2.5">
                                                <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                                    {t('chat.genericDisclaimer')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}

                    {(isTyping || isLoadingDoctors) && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white px-6 py-4 rounded-3xl rounded-bl-none shadow-sm border border-slate-200/60">
                                <div className="flex gap-2">
                                    <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce"></span>
                                    <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-8 bg-white border-t border-slate-50 relative">
                    <div className="relative flex items-center gap-3">
                        <div className="flex-1 relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                                {mode === 'symptom' ? <Bot size={20} /> : <Pill size={20} />}
                            </div>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isTyping && !isLoadingDoctors && handleSendMessage()}
                                placeholder={mode === 'symptom' ? t('chat.placeholder') : t('chat.medPlaceholder')}
                                className="w-full pl-14 pr-24 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-400 shadow-inner group-focus-within:bg-white"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isTyping || isLoadingDoctors}
                                className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-slate-900 text-white rounded-[1.5rem] shadow-xl shadow-slate-900/10 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center group/send"
                            >
                                {isTyping || isLoadingDoctors ? (
                                    <Activity size={18} className="animate-spin" />
                                ) : (
                                    <Send size={18} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 opacity-50">
                        <div className="h-[1px] flex-1 bg-slate-200"></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            MediConnect Intelligence v2.0
                        </p>
                        <div className="h-[1px] flex-1 bg-slate-200"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ChatBot;
