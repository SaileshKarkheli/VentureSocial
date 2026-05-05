-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.trip_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Transport', 'Stay', 'Dining', 'Activity')),
    image_url TEXT,
    link_url TEXT,
    location_coords POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.remix_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID REFERENCES public.remix_folders(id) ON DELETE CASCADE NOT NULL,
    spot_id UUID REFERENCES public.trip_spots(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(folder_id, spot_id)
);

-- 2. RLS Policies
ALTER TABLE public.trip_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_spots ENABLE ROW LEVEL SECURITY;

-- Trip spots are public
CREATE POLICY "Trip spots are viewable by everyone."
ON public.trip_spots FOR SELECT
USING (true);

-- Remix folders are private to the user
CREATE POLICY "Users can manage their own remix folders."
ON public.remix_folders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Saved spots are viewable if the user owns the folder
CREATE POLICY "Users can manage saved spots in their folders."
ON public.saved_spots
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.remix_folders
    WHERE remix_folders.id = saved_spots.folder_id AND remix_folders.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.remix_folders
    WHERE remix_folders.id = saved_spots.folder_id AND remix_folders.user_id = auth.uid()
  )
);

-- 3. Data Hydration (Mapping mock tripData to dynamic posts)
DO $$
DECLARE
    italy_post_id UUID;
    bali_post_id UUID;
    ny_post_id UUID;
BEGIN
    -- Find existing posts
    SELECT id INTO italy_post_id FROM public.posts WHERE location_name ILIKE '%Italy%' LIMIT 1;
    SELECT id INTO bali_post_id FROM public.posts WHERE location_name ILIKE '%Bali%' LIMIT 1;
    SELECT id INTO ny_post_id FROM public.posts WHERE location_name ILIKE '%New York%' LIMIT 1;

    -- Insert Trip 1 (Italy) if found
    IF italy_post_id IS NOT NULL THEN
        -- Day 1
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category) 
        VALUES (italy_post_id, 1, 'Flight to FCO (Rome)', 'Touching down in the Eternal City. The history is already palpable.', 'Transport');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url, link_url)
        VALUES (italy_post_id, 1, 'Hotel Eden Rome', 'Luxury stay in Rome', 'Stay', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80', 'https://www.dorchestercollection.com/rome/hotel-eden');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url, link_url)
        VALUES (italy_post_id, 1, 'Roscioli Salumeria', 'Famous Roman pasta', 'Dining', 'https://images.unsplash.com/photo-1590846406792-0adc7f928f1d?auto=format&fit=crop&w=1200&q=80', 'https://www.salumeriaroscioli.com');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (italy_post_id, 1, 'Colosseum Guided Tour', 'Exploring the ancient gladiatorial arena.', 'Activity', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80');

        -- Day 2
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category) 
        VALUES (italy_post_id, 2, 'High-speed Train to Venice', 'Taking the efficient Italo train up to the floating city. Every turn is a postcard.', 'Transport');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url, link_url)
        VALUES (italy_post_id, 2, 'Belmond Hotel Cipriani', 'Iconic Venetian luxury', 'Stay', 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80', 'https://www.belmond.com');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url, link_url)
        VALUES (italy_post_id, 2, 'Osteria alle Testiere', 'Incredible seafood', 'Dining', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80', 'https://osteriaalletestiere.it');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (italy_post_id, 2, 'Gondola Ride', 'A classic Venetian experience through the narrow canals.', 'Activity', 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80');
    END IF;

    -- Insert Trip 3 (Bali) if found
    IF bali_post_id IS NOT NULL THEN
        -- Day 1
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category) 
        VALUES (bali_post_id, 1, 'Private Transfer from DPS', 'Winding through the lush green rice paddies.', 'Transport');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (bali_post_id, 1, 'Viceroy Bali', 'Jungle luxury', 'Stay', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (bali_post_id, 1, 'Locavore', 'Local dining experience', 'Dining', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (bali_post_id, 1, 'Sacred Monkey Forest', 'Meeting the playful macaques in a mystical jungle temple.', 'Activity', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80');
    END IF;

    -- Insert Trip 4 (New York) if found
    IF ny_post_id IS NOT NULL THEN
        -- Day 1
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category) 
        VALUES (ny_post_id, 1, 'Yellow Cab from JFK', 'Seeing the skyline emerge from the backseat of an iconic NYC taxi.', 'Transport');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (ny_post_id, 1, 'The Plaza Hotel', 'Classic NYC luxury', 'Stay', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (ny_post_id, 1, 'Katz''s Delicatessen', 'Famous pastrami', 'Dining', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80');
        
        INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url)
        VALUES (ny_post_id, 1, 'Central Park Walk', 'Strolling through the green heart of Manhattan.', 'Activity', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80');
    END IF;
END $$;
