import axios from 'axios';
import i18next from 'i18next';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const session = localStorage.getItem('supabase_session');
    if (session) {
        const { access_token } = JSON.parse(session);
        if (access_token) {
            config.headers.Authorization = `Bearer ${access_token}`;
        }
    }
    // Add Language Header for Backend AI
    config.headers['x-lang'] = i18next.language || 'en';

    return config;
});

export const authService = {
    // Login with Email/Mobile and Password
    login: async (emailOrMobile: string, password: string) => {
        const response = await api.post('/auth/signin', { emailOrMobile, password });
        if (response.data.session) {
            localStorage.setItem('supabase_session', JSON.stringify(response.data.session));
            localStorage.setItem('user_role', response.data.profile.role);
        }
        return response.data;
    },

    // Signup
    signup: async (userData: any) => {
        // userData should include email, password, and role-specific fields
        const response = await api.post('/auth/signup', {
            email: userData.email,
            password: userData.password,
            userData: userData
        });
        return response.data;
    },

    // Logout
    logout: async () => {
        try {
            await api.post('/auth/signout');
        } finally {
            localStorage.removeItem('supabase_session');
            localStorage.removeItem('user_role');
        }
    },

    // Get Current User
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export const doctorService = {
    // Upload Documents
    uploadDocuments: async (userId: string, formData: FormData) => {
        const response = await api.post(`/doctors/${userId}/documents`, formData);
        return response.data;
    },

    // Get Doctor Profile
    getProfile: async (userId: string) => {
        const response = await api.get(`/doctors/${userId}`);
        return response.data;
    }
};

export const adminService = {
    getPendingDoctors: async () => {
        const response = await api.get('/admin/doctors/pending');
        return response.data;
    },
    approveDoctor: async (doctorId: string) => {
        const response = await api.put(`/admin/doctors/${doctorId}/approve`);
        return response.data;
    },
    rejectDoctor: async (doctorId: string) => {
        const response = await api.put(`/admin/doctors/${doctorId}/reject`);
        return response.data;
    },
    getMedicineOrders: async () => {
        const response = await api.get('/admin/medicine-orders');
        return response.data;
    },
    updateOrderStatus: async (orderId: string, status: string) => {
        const response = await api.patch(`/admin/medicine-orders/${orderId}/status`, { status });
        return response.data;
    }
};

export const patientService = {
    // Get Patient Profile
    getProfile: async (userId: string) => {
        const response = await api.get(`/patients/${userId}`);
        return response.data;
    }
};

export default api;
