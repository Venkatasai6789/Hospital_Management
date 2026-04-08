-- ----------------------------------------------------------------
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX SIGNUP ERRORS
-- ----------------------------------------------------------------

-- 1. Drop existing trigger to clean up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Ensure users_profiles table exists and is correct
CREATE TABLE IF NOT EXISTS public.users_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Function with SECURITY DEFINER and search_path (CRITICAL FIX)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profiles (id, role, created_at, updated_at)
    VALUES (
        NEW.id,
        -- Cast the role string to user_role enum, default to 'patient'
        (COALESCE(NEW.raw_user_meta_data->>'role', 'patient'))::user_role,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Re-create Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verify Tables exist
SELECT * FROM public.users_profiles LIMIT 1;
