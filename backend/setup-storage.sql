
-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-documents', 'doctor-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policies (Safely)

-- Policy: Doctors can upload their own documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Doctors can upload their own documents'
    ) THEN
        CREATE POLICY "Doctors can upload their own documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( 
          bucket_id = 'doctor-documents' 
          AND (storage.foldername(name))[1] = auth.uid()::text 
        );
    END IF;
END $$;

-- Policy: Doctors can view their own documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Doctors can view their own documents'
    ) THEN
        CREATE POLICY "Doctors can view their own documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING ( 
          bucket_id = 'doctor-documents' 
          AND (storage.foldername(name))[1] = auth.uid()::text 
        );
    END IF;
END $$;

-- Policy: Admins can view all documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Admins can view all documents'
    ) THEN
        CREATE POLICY "Admins can view all documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING ( 
          bucket_id = 'doctor-documents' 
          AND EXISTS (
            SELECT 1 FROM public.users_profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END $$;

-- 7. (Optional) Allow public access if you want easiest debugging, 
-- but above policies are better for security. 
-- Uncomment below if you struggle with access:
-- CREATE POLICY "Public View" ON storage.objects FOR SELECT USING ( bucket_id = 'doctor-documents' );
