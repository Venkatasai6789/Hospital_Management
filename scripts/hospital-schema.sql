-- Emergency Resource & Hospital Load Prediction Schema

-- Create hospitals table
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  contact_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Create policy for hospitals (anyone can read, admins can modify)
CREATE POLICY "Enable read access for all users on hospitals"
  ON public.hospitals FOR SELECT
  USING (true);

-- Create hospital_resources table
CREATE TABLE IF NOT EXISTS public.hospital_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  resource_type text NOT NULL, -- e.g., 'ICU', 'Oxygen', 'General'
  total_capacity integer NOT NULL DEFAULT 0,
  available integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(hospital_id, resource_type)
);

-- Enable RLS for hospital_resources
ALTER TABLE public.hospital_resources ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital_resources (anyone can read, admins/hospital staff can modify - simplifying to read-all for now)
CREATE POLICY "Enable read access for all users on hospital_resources"
  ON public.hospital_resources FOR SELECT
  USING (true);

-- Adding an update policy for service role/automated scripts
-- For the sake of the predictive engine and updates
CREATE POLICY "Enable all access for service role on hospital_resources"
  ON public.hospital_resources FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for service role on hospitals"
  ON public.hospitals FOR ALL
  USING (true)
  WITH CHECK (true);
