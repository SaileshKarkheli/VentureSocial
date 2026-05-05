-- ==========================================
-- SEED SAMPLE TRIPS FOR CURRENT USER
-- ==========================================

DO $$
DECLARE
    target_user_id UUID;
    new_post_id UUID;
BEGIN
    -- 1. Get the first available user (which should be you in your local dev)
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in auth.users. Please create an account first.';
    END IF;

    -- 2. Check if a profile exists for this user, if not, create a fallback
    INSERT INTO public.profiles (id, full_name, username, bio)
    VALUES (target_user_id, 'Traveler', 'traveler_01', 'Exploring the world.')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create a Master Post (Trip Header) for this user
    INSERT INTO public.posts (user_id, location_name, category) 
    VALUES (target_user_id, 'My First Trip: Kyoto', 'Activity')
    RETURNING id INTO new_post_id;

    -- 4. Insert 3 Sample Trip Spots tied to this post
    -- Spot 1: Transport
    INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url) 
    VALUES (new_post_id, 1, 'Bullet Train to Kyoto', 'Smooth ride on the Shinkansen.', 'Transport', 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80');

    -- Spot 2: Stay
    INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url) 
    VALUES (new_post_id, 1, 'Traditional Ryokan', 'Authentic Japanese inn experience.', 'Stay', 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80');

    -- Spot 3: Activity
    INSERT INTO public.trip_spots (post_id, day_number, title, description, category, image_url) 
    VALUES (new_post_id, 2, 'Fushimi Inari Shrine', 'Walking through the thousand Torii gates.', 'Activity', 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80');

END $$;
