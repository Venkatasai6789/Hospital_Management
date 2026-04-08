
import React from 'react';
import { Clock, Activity, FileText, CheckCircle, LogOut } from 'lucide-react';

interface PendingApprovalScreenProps {
    onLogout?: () => void;
    onBack?: () => void; // Optional, for initial signup flow if needed
}

const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ onLogout }) => {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in text-center relative">
            {onLogout && (
                <button
                    onClick={onLogout}
                    className="absolute top-6 right-6 flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-semibold"
                >
                    <LogOut size={18} /> Logout
                </button>
            )}

            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border-4 border-amber-100 rounded-full animate-ping opacity-20"></div>
                <Clock size={48} className="text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg">
                Thank you for registering with MediConnect. Your profile and documents are currently under review by our administrative team.
            </p>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 max-w-md w-full text-left shadow-sm mb-10">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-brand-500" /> Verification Process
                </h4>
                <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                    <div className="flex gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm shrink-0 flex items-center justify-center">
                            <CheckCircle size={12} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Registration Complete</p>
                            <p className="text-xs text-slate-500">Account created successfully</p>
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm shrink-0 flex items-center justify-center">
                            <CheckCircle size={12} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Documents Uploaded</p>
                            <p className="text-xs text-slate-500">Professional credentials submitted</p>
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-amber-500 border-4 border-white shadow-sm shrink-0 flex items-center justify-center animate-pulse">
                            <Clock size={12} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Admin Review</p>
                            <p className="text-xs text-slate-500">Estimated time: 24-48 hours</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 text-blue-800 px-6 py-4 rounded-xl text-sm max-w-md flex items-start gap-3">
                <FileText size={18} className="shrink-0 mt-0.5" />
                <p>You will receive an email notification once your account is displayed effectively verified and approved.</p>
            </div>
        </div>
    );
};

export default PendingApprovalScreen;
