
import { Users, Calendar, MessageSquare, DollarSign, Video, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface DoctorStat {
  label: string;
  value: string;
  icon: any;
  color: string;
  bg: string;
}

export interface Appointment {
  id: string;
  time: string;
  date?: string; // Added date for history
  patientId: string;
  patientName: string;
  patientImage: string;
  age: number;
  gender: string;
  type: 'Video Call' | 'In-Clinic';
  reason: string;
  status: 'Upcoming' | 'Pending' | 'Completed' | 'Cancelled';
  symptoms?: string[];
  phone?: string;
  email?: string;
  bloodType?: string;
}

export interface Patient {
  id: string;
  patientId: string; // Display ID like #P-1234
  name: string;
  image: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
  status: 'Active' | 'Recovered' | 'Critical';
  phone: string;
  email: string;
  bloodType: string;
  reason?: string; // Added to support AI assessment display
}

export interface PatientHistoryItem {
  id: string;
  date: string;
  doctor: string;
  diagnosis: string;
  notes: string;
  prescription?: string;
}

export interface PatientDocument {
  id: string;
  title: string;
  date: string;
  type: 'Report' | 'Prescription' | 'Scan';
  url?: string;
}

export interface ChatThread {
  id: string;
  patientId: string;
  patientName: string;
  patientImage: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  typing?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  status: 'sent' | 'delivered' | 'read';
}

export const DOCTOR_STATS: DoctorStat[] = [
  { label: 'Total Patients', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Appointments', value: '42', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Consultations', value: '12', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Revenue', value: '$4.2k', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export const TODAY_SCHEDULE: Appointment[] = [
  {
    id: '1',
    time: '09:00 AM',
    patientId: 'P-2849',
    patientName: 'Sarah Jenkins',
    patientImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
    age: 28,
    gender: 'Female',
    type: 'Video Call',
    reason: 'Migraine Follow-up',
    status: 'Upcoming',
    symptoms: ['Headache', 'Sensitivity to Light', 'Nausea']
  },
  {
    id: '2',
    time: '10:30 AM',
    patientId: 'P-3920',
    patientName: 'Michael Chen',
    patientImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop',
    age: 45,
    gender: 'Male',
    type: 'In-Clinic',
    reason: 'Cardiac Review',
    status: 'Upcoming',
    symptoms: ['Chest Pain', 'Shortness of Breath']
  },
  {
    id: '3',
    time: '11:15 AM',
    patientId: 'P-4421',
    patientName: 'Emma Watson',
    patientImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    age: 32,
    gender: 'Female',
    type: 'Video Call',
    reason: 'Skin Rash Analysis',
    status: 'Upcoming',
    symptoms: ['Itching', 'Redness']
  },
  {
    id: '4',
    time: '02:00 PM',
    patientId: 'P-5501',
    patientName: 'Robert Fox',
    patientImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
    age: 56,
    gender: 'Male',
    type: 'In-Clinic',
    reason: 'Routine Checkup',
    status: 'Upcoming',
    symptoms: ['General Fatigue']
  }
];

export const PENDING_REQUESTS: Appointment[] = [
  {
    id: 'r1',
    time: '11:15 AM', // Requested time
    patientId: 'P-4421',
    patientName: 'Emma Watson',
    patientImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    age: 32,
    gender: 'Female',
    type: 'Video Call',
    reason: 'Skin Rash Analysis',
    status: 'Pending'
  },
  {
    id: 'r2',
    time: '04:00 PM',
    patientId: 'P-9982',
    patientName: 'David Kim',
    patientImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop',
    age: 24,
    gender: 'Male',
    type: 'In-Clinic',
    reason: 'Sports Injury',
    status: 'Pending'
  }
];

export const HISTORY_LOG: Appointment[] = [
  {
    id: 'h1',
    time: '10:00 AM',
    date: 'Jan 28, 2026',
    patientId: 'P-1123',
    patientName: 'Alice Cooper',
    patientImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
    age: 29,
    gender: 'Female',
    type: 'Video Call',
    reason: 'Flu Symptoms',
    status: 'Completed'
  },
  {
    id: 'h2',
    time: '02:30 PM',
    date: 'Jan 28, 2026',
    patientId: 'P-8821',
    patientName: 'Marcus Johnson',
    patientImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=100&auto=format&fit=crop',
    age: 41,
    gender: 'Male',
    type: 'In-Clinic',
    reason: 'Back Pain',
    status: 'Cancelled'
  }
];

export const ALL_PATIENTS: Patient[] = [
  {
    id: 'p1',
    patientId: '#P-2849',
    name: 'Sarah Jenkins',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
    age: 28,
    gender: 'Female',
    condition: 'Migraine',
    lastVisit: 'Jan 12, 2024',
    status: 'Active',
    phone: '+91 98765 43210',
    email: 'sarah.j@example.com',
    bloodType: 'O+'
  },
  {
    id: 'p2',
    patientId: '#P-3920',
    name: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    lastVisit: 'Dec 05, 2023',
    status: 'Active',
    phone: '+91 98765 12345',
    email: 'michael.c@example.com',
    bloodType: 'A+'
  },
  {
    id: 'p3',
    patientId: '#P-4521',
    name: 'Emma Watson',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    age: 32,
    gender: 'Female',
    condition: 'Dermatitis',
    lastVisit: 'Nov 20, 2023',
    status: 'Recovered',
    phone: '+91 98123 45678',
    email: 'emma.w@example.com',
    bloodType: 'B-'
  },
  {
    id: 'p4',
    patientId: '#P-5678',
    name: 'James Wilson',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
    age: 54,
    gender: 'Male',
    condition: 'Diabetes Type 2',
    lastVisit: 'Jan 05, 2024',
    status: 'Critical',
    phone: '+91 91234 56789',
    email: 'james.w@example.com',
    bloodType: 'AB+'
  },
  {
    id: 'p5',
    patientId: '#P-1234',
    name: 'Linda Martinez',
    image: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?q=80&w=100&auto=format&fit=crop',
    age: 29,
    gender: 'Female',
    condition: 'Pregnancy',
    lastVisit: 'Jan 15, 2024',
    status: 'Active',
    phone: '+91 99887 76655',
    email: 'linda.m@example.com',
    bloodType: 'O-'
  }
];

// Mock Data for the Patient Profile Modal
export const MOCK_PATIENT_HISTORY: PatientHistoryItem[] = [
  {
    id: 'ph1',
    date: 'Jan 12, 2026',
    doctor: 'Dr. Sarah Mitchell',
    diagnosis: 'Regular Checkup',
    notes: 'Patient reported mild headaches. BP was slightly elevated. Recommended diet changes.',
    prescription: 'Paracetamol'
  },
  {
    id: 'ph2',
    date: 'Nov 20, 2025',
    doctor: 'Dr. Sarah Mitchell',
    diagnosis: 'Dermatology Consult',
    notes: 'Skin rash evaluation. Prescribed topical ointment.',
    prescription: 'Cortisone Cream'
  }
];

export const MOCK_PATIENT_DOCUMENTS: PatientDocument[] = [
  { id: 'pd1', title: 'Blood Test Report', date: 'Jan 12, 2026', type: 'Report' },
  { id: 'pd2', title: 'X-Ray (Chest)', date: 'Dec 05, 2025', type: 'Scan' },
  { id: 'pd3', title: 'Prescription', date: 'Nov 20, 2025', type: 'Prescription' }
];

export const MOCK_CHAT_THREADS: ChatThread[] = [
  {
    id: 'c1',
    patientId: 'P-2849',
    patientName: 'Sarah Jenkins',
    patientImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
    lastMessage: 'The medicine is working well, thanks!',
    time: '10:05 AM',
    unreadCount: 2,
    online: true
  },
  {
    id: 'c2',
    patientId: 'P-3920',
    patientName: 'Michael Chen',
    patientImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop',
    lastMessage: 'Can we reschedule our appointment?',
    time: 'Yesterday',
    unreadCount: 0,
    online: false
  },
  {
    id: 'c3',
    patientId: 'P-4521',
    patientName: 'Emma Watson',
    patientImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    lastMessage: 'Sent a photo of the rash.',
    time: '09:30 AM',
    unreadCount: 1,
    online: true,
    typing: true
  }
];

export const MOCK_CHAT_HISTORY: Record<string, ChatMessage[]> = {
  'c1': [
    { id: 'm1', sender: 'patient', text: 'Hi Dr., I have a quick question.', time: '10:00 AM', type: 'text', status: 'read' },
    { id: 'm2', sender: 'doctor', text: 'Hello Sarah, sure. What is it?', time: '10:02 AM', type: 'text', status: 'read' },
    { id: 'm3', sender: 'patient', text: 'The medicine is working well, thanks!', time: '10:05 AM', type: 'text', status: 'read' },
  ],
  'c2': [
    { id: 'm1', sender: 'doctor', text: 'Hi Michael, how are you feeling today?', time: 'Yesterday', type: 'text', status: 'read' },
    { id: 'm2', sender: 'patient', text: 'Better, but I have a conflict for tomorrow.', time: 'Yesterday', type: 'text', status: 'read' },
    { id: 'm3', sender: 'patient', text: 'Can we reschedule our appointment?', time: 'Yesterday', type: 'text', status: 'delivered' },
  ],
  'c3': [
    { id: 'm1', sender: 'patient', text: 'Sent a photo of the rash.', time: '09:30 AM', type: 'text', status: 'delivered' },
  ]
};
