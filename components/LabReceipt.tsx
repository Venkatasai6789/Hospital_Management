import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle, MapPin, Phone, Mail, Activity, ShieldCheck, Printer, X, Receipt } from 'lucide-react';

interface ReceiptProps {
    transactionId: string;
    patientName: string;
    date: string;
    items: {
        title: string;
        price: number;
    }[];
    totalAmount: number;
    clinicName?: string;
    clinicAddress?: string;
    clinicContact?: string;
    onClose: () => void;
}

const LabReceipt: React.FC<ReceiptProps> = ({
    transactionId,
    patientName,
    date,
    items,
    totalAmount,
    clinicName = "MediConnect Labs",
    clinicAddress = "123 Health Street, Wellness City, Bangalore, 560001",
    clinicContact = "+91 80 1234 5678",
    onClose
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `MediConnect_Receipt_${transactionId}.png`;
            link.click();
        } catch (error) {
            console.error("Error generating receipt:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 my-8">

                {/* Control Header (Not part of receipt) */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                        <Receipt size={16} /> Digital Receipt
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Actual Printable Receipt */}
                <div ref={receiptRef} className="p-10 bg-white min-h-[600px] flex flex-col">

                    {/* Header: Logo & Hospital Info */}
                    <div className="flex justify-between items-start mb-10 pb-10 border-b-2 border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-brand-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-brand-500/20">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">MediConnect</h1>
                                <p className="text-[10px] uppercase font-black text-brand-600 tracking-[0.3em]">Diagnostics & Labs</p>
                            </div>
                        </div>
                        <div className="text-right max-w-[200px]">
                            <h2 className="text-sm font-black text-slate-900">{clinicName}</h2>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{clinicAddress}</p>
                            <p className="text-[11px] font-bold text-slate-700 mt-2 flex items-center justify-end gap-1">
                                <Phone size={10} /> {clinicContact}
                            </p>
                        </div>
                    </div>

                    {/* Success Badge */}
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-4 mb-10">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={18} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Payment Successful</p>
                            <p className="text-xs font-medium text-emerald-600/80">Transaction verified at {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Receipt Details Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Billed To</p>
                                <p className="text-sm font-bold text-slate-900">{patientName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Receipt Date</p>
                                <p className="text-sm font-bold text-slate-900">{date}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Transaction ID</p>
                                <p className="text-sm font-mono font-bold text-slate-900 tracking-tighter">{transactionId.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Status</p>
                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black tracking-widest">PAID</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="flex-1">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b-2 border-slate-50">Description</th>
                                    <th className="py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b-2 border-slate-50 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="py-5 border-b border-slate-50">
                                            <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Medical Diagnostic Test</p>
                                        </td>
                                        <td className="py-5 border-b border-slate-50 text-right text-sm font-black text-slate-900">
                                            ₹{item.price.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="pt-8 text-right pr-10">
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Amount Paid</span>
                                    </td>
                                    <td className="pt-8 text-right">
                                        <span className="text-3xl font-black text-brand-600">₹{totalAmount.toFixed(2)}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Hospital Verification Footer */}
                    <div className="mt-16 pt-10 border-t-2 border-slate-50 flex justify-between items-end">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <ShieldCheck size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Authentic Document</span>
                            </div>
                            <p className="text-[11px] text-slate-500 max-w-[300px] italic">
                                Please present this digital or printed receipt at the hospital reception for priority check-in.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-2 mx-auto sm:mr-0 opacity-50 grayscale">
                                <Activity size={40} className="text-slate-300" />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certified Digital Stamp</p>
                        </div>
                    </div>

                    <p className="text-center text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-10">
                        MediConnect Digital Health Network • 2024 • End-to-End Encrypted Receipt
                    </p>
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 text-sm tracking-widest"
                    >
                        <Download size={18} />
                        DOWNLOAD SECURE RECEIPT
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="p-4 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all flex items-center justify-center shadow-sm"
                    >
                        <Printer size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabReceipt;
