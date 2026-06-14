-- ======================================================
-- MIGRATION: EXTEND POSTS & TRIP_SPOTS FOR MOCKDATA PARITY
-- ======================================================

-- 1. Extend public.posts table with new parameters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='caption') THEN
        ALTER TABLE public.posts ADD COLUMN caption TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='activities') THEN
        ALTER TABLE public.posts ADD COLUMN activities TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='hotel_type') THEN
        ALTER TABLE public.posts ADD COLUMN hotel_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='is_private') THEN
        ALTER TABLE public.posts ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='price') THEN
        ALTER TABLE public.posts ADD COLUMN price DECIMAL(10, 2);
    END IF;
END $$;

-- 2. Extend public.trip_spots table with new parameters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_spots' AND column_name='activities') THEN
        ALTER TABLE public.trip_spots ADD COLUMN activities TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_spots' AND column_name='lat') THEN
        ALTER TABLE public.trip_spots ADD COLUMN lat DECIMAL(10, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trip_spots' AND column_name='lng') THEN
        ALTER TABLE public.trip_spots ADD COLUMN lng DECIMAL(11, 8);
    END IF;
END $$;
