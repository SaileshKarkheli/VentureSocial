-- ==========================================
-- SOCIAL GRAPH MIGRATION
-- ==========================================

-- 1. Add Bio and Cover URL to profiles
-- Note: 'bio' and 'cover_photo_url' might already exist from a previous migration, 
-- but we are adding 'cover_url' and 'bio' explicitly as requested using IF NOT EXISTS.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Create connections table (Social Graph)
-- Note: A 'follows' table might already exist in your database, but this explicitly 
-- creates the requested 'connections' table.
CREATE TABLE IF NOT EXISTS public.connections (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS for the new connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public connections are viewable by everyone." 
ON public.connections FOR SELECT USING (true);

CREATE POLICY "Users can create their own connections." 
ON public.connections FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own connections." 
ON public.connections FOR DELETE USING (auth.uid() = follower_id);

-- 3. Search Index Trigger for Fast, Case-Insensitive Search
-- We add a tsvector column and a trigger to automatically update it whenever a profile changes.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create the trigger function to update the search vector
CREATE OR REPLACE FUNCTION public.update_profile_search_vector() 
RETURNS trigger AS $$
BEGIN
  -- Combine full_name and username for case-insensitive full-text search
  NEW.search_vector := to_tsvector('english', coalesce(NEW.full_name, '') || ' ' || coalesce(NEW.username, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_profile_search_vector ON public.profiles;
CREATE TRIGGER trg_profile_search_vector
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_search_vector();

-- Create a GIN index on the search vector for ultra-fast querying
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON public.profiles USING GIN (search_vector);

-- Backfill the search_vector for existing rows
UPDATE public.profiles SET id = id; -- This fires the trigger on all existing rows
