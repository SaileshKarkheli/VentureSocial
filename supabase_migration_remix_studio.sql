-- ==========================================
-- REMIX STUDIO MIGRATION
-- ==========================================

-- 1. Add custom_day to saved_spots for Day Reassignment
ALTER TABLE public.saved_spots ADD COLUMN IF NOT EXISTS custom_day INTEGER;

-- 2. Update notifications type constraint to allow 'remix'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('follow', 'like', 'trip_invite', 'remix'));

-- Note: Integrity Check for Folder Deletion
-- public.saved_spots was created with:
-- folder_id UUID REFERENCES public.remix_folders(id) ON DELETE CASCADE NOT NULL
-- This means deleting a remix_folder automatically deletes all its saved_spots natively.
