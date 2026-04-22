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


-- 4. Remix Stats (The Select/Basket Table)
CREATE TABLE public.remix_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
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

-- ==========================================
-- PROFILES & OAUTH SYNC TRIGGER
-- ==========================================

-- 7. Public Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  cover_photo_url TEXT,
  bio TEXT,
  location TEXT,
  education TEXT,
  dob TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 8. Auth Trigger for Google OAuth Sync
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires instantly upon Google OAuth success
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- PHASE 8: THE SOCIAL GRAPH
-- ==========================================

-- 9. Follows Relational Table
CREATE TABLE public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Everyone can see who follows who
CREATE POLICY "Public follows are viewable by everyone." 
ON public.follows FOR SELECT USING (true);

-- Authenticated Users can only follow people as themselves
CREATE POLICY "Users can follow others." 
ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Authenticated Users can only unfollow people as themselves
CREATE POLICY "Users can unfollow others." 
ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ==========================================
-- PHASE 9: ENGAGEMENT & COORDINATION
-- ==========================================

-- 10. Likes Table
CREATE TABLE public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public likes are viewable by everyone." ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 11. Comments Table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 12. Conversations Table (Private Message Threads)
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(participant_1, participant_2)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view conversations they are in" ON public.conversations 
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Users insert conversations they are in" ON public.conversations 
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 13. Messages Table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view messages in their conversations" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
    )
  );
CREATE POLICY "Users send messages to their conversations" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
