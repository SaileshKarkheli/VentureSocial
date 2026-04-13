-- 1. Posts Core Table
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_user_id UUID REFERENCES auth.users(id), 
    location_name TEXT NOT NULL,
    category TEXT CHECK (category IN ('Hotel', 'Restaurant', 'Transport', 'Activity')) NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    base_price DECIMAL(10, 2),
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Likes Table
CREATE TABLE public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id) 
);

-- 3. Comments Table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Remix Stats (The Select/Basket Table)
CREATE TABLE public.remix_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 5. Real-time P2P Interaction Hub
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_a UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_b UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX unique_conversation_pair 
ON public.conversations (LEAST(user_a, user_b), GREATEST(user_a, user_b));

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Social Scoring RPC (Database Function)
CREATE OR REPLACE FUNCTION calculate_engagement_score(target_post_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    WITH post_stats AS (
        SELECT
            (SELECT COUNT(*) FROM public.likes WHERE post_id = target_post_id) AS total_likes,
            (SELECT COUNT(*) FROM public.comments WHERE post_id = target_post_id) AS total_comments,
            (SELECT COUNT(*) FROM public.remix_stats WHERE post_id = target_post_id) AS total_remixes,
            (SELECT rating FROM public.posts WHERE id = target_post_id) AS base_rating
    )
    SELECT
        (total_likes * 1) + 
        (total_comments * 2) + 
        (total_remixes * 5) + 
        COALESCE(base_rating * 10, 0)
    FROM post_stats;
$$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_stats ENABLE ROW LEVEL SECURITY;

-- POSTS: Public can read, only creators can modify
CREATE POLICY "Public posts are viewable by everyone." 
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts." 
ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts." 
ON public.posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts." 
ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- REMIX_STATS (Baskets): Public can read, users can remix anything
CREATE POLICY "Remix stats are public." 
ON public.remix_stats FOR SELECT USING (true);

CREATE POLICY "Users can add posts to their basket." 
ON public.remix_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove posts from their basket." 
ON public.remix_stats FOR DELETE USING (auth.uid() = user_id);
