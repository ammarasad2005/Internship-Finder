-- Create a B-Tree index on discovered_at to support the Internship-Centric Delta Batch fetching
CREATE INDEX IF NOT EXISTS idx_internships_discovered_at ON public.internships(discovered_at);
