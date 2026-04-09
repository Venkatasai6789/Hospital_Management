-- MediConnect Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('registration_cert', 'identity_proof', 'medical_council', 'license', 'degree', 'other');

-- 1. User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 150),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address JSONB, -- stores {door_no, street, city, district, state, country, pincode}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Doctors Table  
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 150),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address JSONB,
    hospital_name TEXT,
    specialty TEXT,
    years_of_experience INTEGER CHECK (years_of_experience >= 0),
    hospital_location TEXT,
    hospital_website TEXT,
    professional_bio TEXT,
    approval_status approval_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES public.users_profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Doctor Documents Table
CREATE TABLE IF NOT EXISTS public.doctor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profiles_role ON public.users_profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_approval_status ON public.doctors(approval_status);
CREATE INDEX IF NOT EXISTS idx_doctor_documents_doctor_id ON public.doctor_documents(doctor_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profiles
CREATE POLICY "Users can view their own profile"
    ON public.users_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users_profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for patients
CREATE POLICY "Patients can view their own data"
    ON public.patients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert their own data"
    ON public.patients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can update their own data"
    ON public.patients FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for doctors  
CREATE POLICY "Doctors can view their own data"
    ON public.doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own data"
    ON public.doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own data"
    ON public.doctors FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can view all doctors (for approval workflow)
CREATE POLICY "Admins can view all doctors"
    ON public.doctors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for doctor_documents
CREATE POLICY "Doctors can view their own documents"
    ON public.doctor_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE id = doctor_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can insert their own documents"
    ON public.doctor_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE id = doctor_id AND user_id = auth.uid()
        )
    );

-- Admins can view all doctor documents
CREATE POLICY "Admins can view all doctor documents"
    ON public.doctor_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profiles (id, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::user_role,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_profiles_updated_at BEFORE UPDATE ON public.users_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Hospitals Table (Smart Emergency Route)
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    coordinates JSONB NOT NULL, -- { "lat": ..., "lng": ... }
    cases INTEGER DEFAULT 0,
    weather_condition TEXT DEFAULT 'Clear',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hospitals"
    ON public.hospitals FOR SELECT
    USING (true);

