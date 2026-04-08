import React from 'react';
import { CheckCircle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

interface UploadedFileSummary {
    name: string;
    size: string;
}

interface DoctorRegistrationSuccessModalProps {
    isOpen: boolean;
    files: UploadedFileSummary[];
    onContinue: () => void;
}

const DoctorRegistrationSuccessModal: React.FC<DoctorRegistrationSuccessModalProps> = ({ isOpen, files, onContinue }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in relative">

                {/* Decorative Header */}
                <div className="bg-green-50 p-8 text-center border-b border-green-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle size={32} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Upload Successful!</h2>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Your professional documents have been securely received.
                    </p>
                </div>

                {/* Content Body */}
                <div className="p-8">
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={14} /> Uploaded Documents
                        </h4>
                        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-400">{file.size} MB</p>
                                        </div>
                                    </div>
                                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-xs flex gap-3 mb-8 leading-relaxed">
                        <ShieldCheck size={16} className="shrink-0 mt-0.5 text-blue-600" />
                        <p>Your profile is now pending admin verification. You will be notified once the review is complete.</p>
                    </div>

                    <button
                        onClick={onContinue}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-brand-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Continue to Dashboard <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorRegistrationSuccessModal;
