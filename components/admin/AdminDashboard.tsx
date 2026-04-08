
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../src/services/api';
import { ShieldCheck, User, CheckCircle, XCircle, FileText, Clock, AlertCircle, LogOut, Package, ShoppingCart, Truck, ChevronRight } from 'lucide-react';

interface DoctorRequest {
    id: string;
    first_name: string;
    surname: string;
    email: string; // from join
    hospital_name: string;
    specialty: string;
    years_of_experience: number;
    hospital_location: string;
    professional_bio: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    documents: Array<{
        id: string;
        document_type: string;
        file_url: string;
    }>;
    user?: { email: string };
}

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<DoctorRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<DoctorRequest | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Orders State
    const [activeTab, setActiveTab] = useState<'doctors' | 'orders'>('doctors');
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        if (activeTab === 'doctors') {
            fetchRequests();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchRequests = async () => {
        try {
            const data = await adminService.getPendingDoctors();
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch requests', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const data = await adminService.getMedicineOrders();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        setActionLoading(true);
        try {
            await adminService.updateOrderStatus(orderId, status);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this doctor?')) return;
        setActionLoading(true);
        try {
            await adminService.approveDoctor(id);
            setRequests(prev => prev.filter(req => req.id !== id));
            setSelectedRequest(null);
        } catch (err) {
            alert('Failed to approve');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this doctor?')) return;
        setActionLoading(true);
        try {
            await adminService.rejectDoctor(id);
            setRequests(prev => prev.filter(req => req.id !== id));
            setSelectedRequest(null);
        } catch (err) {
            alert('Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Navbar */}
            <div className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-purple-400">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{t('admin.title')}</h1>
                        <p className="text-xs text-slate-400">{t('admin.subtitle')}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/10 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'doctors' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-300 hover:text-white'}`}
                    >
                        {t('admin.requests')}
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-300 hover:text-white'}`}
                    >
                        {t('admin.orders')}
                    </button>
                </div>

                <button onClick={onLogout} className="flex items-center gap-2 text-sm font-semibold hover:text-purple-300 transition-colors">
                    <LogOut size={16} /> {t('dashboard.logout')}
                </button>
            </div>

            <div className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: List of Requests */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Clock size={18} className="text-amber-500" />
                        {t('admin.pendingApp')} ({requests.length})
                    </h2>

                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 shadow-sm text-slate-400">
                                <CheckCircle size={48} className="mx-auto mb-3 text-slate-200" />
                                <p>{t('admin.noPending')}</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedRequest?.id === req.id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-slate-100'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-800">Dr. {req.first_name} {req.surname}</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">Pending</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">{req.specialty} • {req.hospital_name}</p>
                                    <p className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Detail View */}
                <div className="lg:col-span-2">
                    {selectedRequest ? (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                            {/* Header */}
                            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Dr. {selectedRequest.first_name} {selectedRequest.surname}</h2>
                                    <p className="text-slate-500">{selectedRequest.user?.email || 'No Email'}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleReject(selectedRequest.id)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle size={18} /> {t('admin.reject')}
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedRequest.id)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} /> {t('admin.approve')}
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-8 space-y-8">

                                {/* Professional Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('common.specialty')}</label>
                                        <p className="font-semibold text-slate-800">{selectedRequest.specialty}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.experience')}</label>
                                        <p className="font-semibold text-slate-800">{selectedRequest.years_of_experience} Years</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('common.hospital')}</label>
                                        <p className="font-semibold text-slate-800">{selectedRequest.hospital_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.location')}</label>
                                        <p className="font-semibold text-slate-800">{selectedRequest.hospital_location}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('common.bio')}</label>
                                        <p className="text-sm text-slate-600 mt-1">{selectedRequest.professional_bio}</p>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <FileText size={18} className="text-brand-500" /> {t('admin.submittedDocs')}
                                    </h3>

                                    {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedRequest.documents.map((doc, idx) => (
                                                <a
                                                    key={idx}
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-colors group"
                                                >
                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-brand-600 group-hover:bg-white">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                                                        <p className="text-xs text-brand-600 font-medium">{t('admin.clickToView')}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 text-sm italic">No documents uploaded.</div>
                                    )}
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-12">
                            <User size={64} className="mb-4 text-slate-200" />
                            <p className="text-lg font-medium">{t('admin.selectDoctor') || 'Select a doctor to review details'}</p>
                        </div>
                    )}
                </div>

                {/* --- ORDERS VIEW --- */}
                {activeTab === 'orders' && (
                    <>
                        {/* LEFT: Order List */}
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Package size={18} className="text-blue-500" />
                                {t('admin.orders')} ({orders.length})
                            </h2>
                            <div className="space-y-3">
                                {loadingOrders ? (
                                    <div className="text-center py-10"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto"></div></div>
                                ) : orders.length === 0 ? (
                                    <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-400">
                                        <Package size={48} className="mx-auto mb-3 text-slate-200" />
                                        <p>No orders placed yet</p>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedOrder?.id === order.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-slate-800 uppercase text-xs">#{order.id.slice(0, 8)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="font-bold text-sm text-slate-900">{order.full_name}</p>
                                            <p className="text-xs text-slate-500">₹{order.total_amount} • {order.items.length} items</p>
                                            <p className="text-[10px] text-slate-400 mt-2">{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Order Detail View */}
                        <div className="lg:col-span-2">
                            {selectedOrder ? (
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                                    <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('admin.orderDetails')}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs font-bold text-slate-500">ID: {selectedOrder.id}</span>
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">{selectedOrder.full_name}</h2>
                                            <p className="text-slate-500">{selectedOrder.phone} • {selectedOrder.city}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedOrder.status}
                                                onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            >
                                                <option value="Placed">Placed</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {/* Shipping Address */}
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Truck size={14} className="text-brand-500" /> {t('admin.shippingInfo')}
                                            </h3>
                                            <p className="text-sm font-bold text-slate-800">{selectedOrder.full_name}</p>
                                            <p className="text-sm text-slate-600 mt-1">{selectedOrder.address}</p>
                                            <p className="text-sm text-slate-600">{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                                            <p className="text-sm text-slate-600 mt-2 font-bold">Contact: {selectedOrder.phone}</p>
                                        </div>

                                        {/* Items */}
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('admin.orderItems')}</h3>
                                            <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                                {selectedOrder.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b last:border-b-0 border-slate-50">
                                                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-contain bg-slate-50 mix-blend-multiply" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-slate-900 uppercase">{item.name}</p>
                                                            <p className="text-xs text-slate-500">Qty: {item.quantity || 1}</p>
                                                        </div>
                                                        <p className="font-bold text-slate-900 text-sm">₹{item.price}</p>
                                                    </div>
                                                ))}
                                                <div className="bg-slate-50 p-4 flex justify-between items-center">
                                                    <span className="font-black text-slate-900 text-lg">{t('admin.totalPaid')}</span>
                                                    <span className="font-black text-brand-600 text-xl">₹{selectedOrder.total_amount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Patient History Link (Conceptual) */}
                                        <div className="pt-4 border-t border-slate-100">
                                            <button className="text-sm font-bold text-brand-600 hover:underline flex items-center gap-1">
                                                {t('admin.patientHistory')} <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-12">
                                    <ShoppingCart size={64} className="mb-4 text-slate-200" />
                                    <p className="text-lg font-medium">Select an order to view details</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
