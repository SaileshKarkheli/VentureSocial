-- ==========================================
-- NOTIFICATIONS TABLE MIGRATION
-- ==========================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('follow', 'like', 'trip_invite')) NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- The system/triggers will handle inserts, but if client-side inserts are needed (e.g., inviting to a trip):
CREATE POLICY "Users can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() = actor_id);

-- 3. Optimization Index
-- It's highly recommended to index user_id and created_at since notifications are typically fetched and sorted by user.
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON public.notifications (user_id, created_at DESC);
