import React from 'react';
import { X, Clock, Activity, AlertCircle, CheckCircle, ShieldCheck, MapPin, Phone, ShoppingCart } from 'lucide-react';

export interface LabTest {
    id: string;
    title: string;
    type: 'Package' | 'Test';
    test_count: number;
    price: number;
    original_price: number;
    discount: number;
    tat: string;
    category: string;
    image: string;
    description: string;
    tests_included: string[];
    preparation: string[];
    location: string;
    contact_number?: string;
    lab_address?: string;
    tags?: string[];
}

interface LabTestDetailsProps {
    test: LabTest;
    onClose: () => void;
    onAddToCart: (test: LabTest) => void;
}

const LabTestDetails: React.FC<LabTestDetailsProps> = ({ test, onClose, onAddToCart }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-xl border border-white/20"
                >
                    <X size={20} />
                </button>

                {/* Left Visual Panel */}
                <div className="w-full md:w-[45%] relative h-[300px] md:h-auto overflow-hidden group">
                    <img
                        src={test.image}
                        alt={test.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-8 text-white">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${test.type === 'Package'
                                    ? 'bg-purple-500/80 border-purple-400'
                                    : 'bg-brand-500/80 border-brand-400'
                                }`}>
                                {test.type}
                            </span>
                            {test.tags && test.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/80 border border-emerald-400 uppercase tracking-widest">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4 drop-shadow-lg">{test.title}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Duration</p>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-brand-400" />
                                    <span className="font-bold text-sm">{test.tat}</span>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Test Count</p>
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-emerald-400" />
                                    <span className="font-bold text-sm">{test.test_count} Tests</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Panel */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    <div className="p-8 md:p-10">

                        {/* Pricing Header */}
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-black text-slate-900">₹{test.price}</span>
                                    {test.original_price && (
                                        <span className="text-lg text-slate-400 line-through">₹{test.original_price}</span>
                                    )}
                                </div>
                                <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-100">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    SAVE {test.discount}% ON THIS ORDER
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Hospital Info Section */}
                            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <MapPin size={14} className="text-brand-600" /> Lab Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{test.location}</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed text-wrap">
                                            {test.lab_address || "Full address not available. Check booking details."}
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 text-brand-600">
                                            <Phone size={14} />
                                            <span className="text-xs font-bold">{test.contact_number || "+91 80 000 0000"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <ShieldCheck size={14} />
                                            <span className="text-xs font-bold">Verified Lab</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Overview */}
                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Overview</h3>
                                <p className="text-slate-600 leading-relaxed text-[15px]">
                                    {test.description}
                                </p>
                            </section>

                            {/* Preparation */}
                            <section className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 italic">
                                <h3 className="text-xs font-black text-amber-800 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <AlertCircle size={14} /> Preparation Guidelines
                                </h3>
                                <ul className="space-y-2">
                                    {test.preparation.map((prep, idx) => (
                                        <li key={idx} className="text-[13px] text-amber-900 flex items-start gap-3">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                                            {prep}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Included Tests grid */}
                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <CheckCircle size={14} className="text-brand-600" />
                                    Whats Included ({test.tests_included.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {test.tests_included.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-[13px] font-medium text-slate-700">
                                            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                                                <Activity size={14} />
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl p-8 border-t border-slate-200 flex items-center justify-between gap-6 shadow-2xl">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => onAddToCart(test)}
                            className="flex-1 max-w-[300px] py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-sm"
                        >
                            <ShoppingCart size={18} />
                            ADD TO CART
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabTestDetails;
