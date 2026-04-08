
-- 1. Allow anyone (authenticated or anon) to view APPROVED doctors
CREATE POLICY "Public can view approved doctors"
    ON public.doctors FOR SELECT
    USING (approval_status = 'approved');

-- 2. Allow patients to view their own appointments (Already in previous script, but good to ensure)
-- Note: If you ran the previous script, this might exist. 
-- Checking existence to avoid error or just using CREATE POLICY IF NOT EXISTS (Postgres 9.5+ doesn't support IF NOT EXISTS for policy standardly until v16/extensions, so we drop first)

DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;
CREATE POLICY "Patients can view their own appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid() = patient_id);

-- 3. Allow patients to create appointments (Booking flow)
CREATE POLICY "Patients can insert appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- 4. Allow patients to see their interactions
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
CREATE POLICY "Users can view their own interactions"
    ON public.interactions FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Allow anyone to read user profiles (needed for dashboard name display if not own?)
-- Actually, dashboard reads own profile, which is covered by "Users can view their own profile".
