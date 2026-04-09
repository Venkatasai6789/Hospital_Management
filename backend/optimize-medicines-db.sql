/*
 * Database Optimizations for 248k+ Medicines
 * Indexes, full-text search, and query optimization
 */

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_medicines_brand_name 
ON public.medicines(brand_name);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name 
ON public.medicines(generic_name);

CREATE INDEX IF NOT EXISTS idx_medicines_therapeutic_class 
ON public.medicines(therapeutic_class);

CREATE INDEX IF NOT EXISTS idx_medicines_price 
ON public.medicines(price);

CREATE INDEX IF NOT EXISTS idx_medicines_created_at 
ON public.medicines(created_at DESC);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_medicines_search 
ON public.medicines(therapeutic_class, price, created_at DESC);

-- Create full-text search index on brand and generic names
CREATE INDEX IF NOT EXISTS idx_medicines_fts 
ON public.medicines 
USING GIN(to_tsvector('english', brand_name || ' ' || generic_name || ' ' || COALESCE(description, '')));

-- Enable full-text search functionality
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing records with search vector
UPDATE public.medicines 
SET search_vector = to_tsvector('english', 
    brand_name || ' ' || 
    COALESCE(generic_name, '') || ' ' || 
    COALESCE(therapeutic_class, '') || ' ' ||
    COALESCE(description, ''))
WHERE search_vector IS NULL;

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION medicines_search_trigger() RETURNS TRIGGER AS $$
BEGIN
  new.search_vector := to_tsvector('english', 
    new.brand_name || ' ' || 
    COALESCE(new.generic_name, '') || ' ' ||
    COALESCE(new.therapeutic_class, '') || ' ' ||
    COALESCE(new.description, ''));
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS medicines_search_trigger ON public.medicines;
CREATE TRIGGER medicines_search_trigger BEFORE INSERT OR UPDATE 
ON public.medicines FOR EACH ROW 
EXECUTE FUNCTION medicines_search_trigger();

-- Analyze table for query optimization
ANALYZE public.medicines;

-- Show statistics (for monitoring)
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'medicines'
ORDER BY indexname;
