-- Add Medicines and Lab Tests Tables to MediConnect
-- Run this in your Supabase SQL Editor

-- 6. Medicines Table
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name TEXT NOT NULL,
    generic_name TEXT,
    therapeutic_class TEXT,
    action_class TEXT,
    dosage_form TEXT,
    price DECIMAL(10, 2),
    description TEXT,
    side_effects TEXT,
    image TEXT,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(brand_name, '') || ' ' || COALESCE(generic_name, '') || ' ' || COALESCE(therapeutic_class, ''))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Lab Tests Table
CREATE TABLE IF NOT EXISTS public.lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT,
    test_count INTEGER,
    price DECIMAL(10, 2),
    original_price DECIMAL(10, 2),
    discount INTEGER,
    tat TEXT,
    category TEXT,
    image TEXT,
    description TEXT,
    tests_included TEXT,
    preparation TEXT,
    location TEXT,
    contact_number TEXT,
    lab_address TEXT,
    tags TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medicines_brand_name ON public.medicines(brand_name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON public.medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_search ON public.medicines USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON public.lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_lab_tests_title ON public.lab_tests(title);

-- Enable Row Level Security (RLS)
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicines (anyone can read, only admins can write)
CREATE POLICY "Anyone can view medicines"
    ON public.medicines FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert medicines"
    ON public.medicines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update medicines"
    ON public.medicines FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete medicines"
    ON public.medicines FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for lab_tests (anyone can read, only admins can write)
CREATE POLICY "Anyone can view lab tests"
    ON public.lab_tests FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert lab tests"
    ON public.lab_tests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update lab tests"
    ON public.lab_tests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete lab tests"
    ON public.lab_tests FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Triggers for updated_at
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON public.lab_tests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
