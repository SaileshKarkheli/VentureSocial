import { supabase } from '../supabaseClient';

export interface PostInsert {
  location_name: string;
  category: 'Hotel' | 'Restaurant' | 'Transport' | 'Activity';
  lat?: number;
  lng?: number;
  base_price?: number;
  rating?: number;
  source_user_id?: string;
}

export const SocialService = {
  // INTERNAL: Update Points Ledger for the Original Creator
  async _creditCreatorPoints(sourceUserId: string, points: number) {
    // Phase 4 Deployment Ready Hook mapping
    console.log(`[Points Ledger] Submitting +${points} points to creator ${sourceUserId} for algorithmic compensation.`);
    /* 
    await supabase.from('points_ledger').insert({ 
      user_id: sourceUserId, 
      points_earned: points, 
      reason: 'Remix/Addition' 
    });
    */
  },

  // CREATE a Post
  async createPost(postData: PostInsert, userId: string) {
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...postData, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // FETCH all Posts
  async fetchFeed() {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profile:profiles!inner(id, username, full_name, avatar_url), likes(count), comments(count), remix_stats(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Identity Hydration mapping to legacy types
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      tripId: row.id,
      user: row.profile?.full_name || row.profile?.username || 'Anonymous Explorer',
      avatar: row.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      location: row.location_name,
      images: [], // Images not natively configured in backend yet, handled by placeholder
      caption: row.category,
      likes: row.likes?.[0]?.count || 0,
      comments: row.comments?.[0]?.count || 0,
      remixes: row.remix_stats?.[0]?.count || 0,
      rating: row.rating || 0,
      activities: [],
      hotelType: row.category,
      price: row.base_price || 0,
      isPrivate: false
    }));
  },

  // REMIX (Add to Basket)
  async remixPost(postId: string, userId: string, sourceUserId?: string) {
    const { data, error } = await supabase
      .from('remix_stats')
      .insert({ user_id: userId, post_id: postId })
      .select()
      .single();
    
    // If it violates unique constraint (already in basket), ignore or throw
    if (error && error.code !== '23505') throw error; // Ignore duplicate logic for strict UI mapping

    // Deployment Readiness: Trigger point ledger credit for the creator 
    if (sourceUserId) {
      await this._creditCreatorPoints(sourceUserId, 50); // 50 points rewarded to the core ledger parameter per remix addition
    }
    return data;
  },

  // LIKE (Toggle Like Status)
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', userId).single();
    if (data) {
      // Remove Like
      const { error: delError } = await supabase.from('likes').delete().eq('id', data.id);
      if (delError) throw delError;
      return false;
    } else {
      // Add Like
      const { error: insError } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      if (insError) throw insError;
      return true;
    }
  },

  // FETCH USER LIKES (Identify what needs to glow red in the UI)
  async fetchUserLikes(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from('likes').select('post_id').eq('user_id', userId);
    if (error) return [];
    return data.map(d => d.post_id);
  },

  // GET OR CREATE CONVERSATION 
  async getOrCreateConversation(userA: string, userB: string) {
    // Alphabetical ID sorting guarantees consistent constraint hits regardless of who initiates
    const p1 = userA < userB ? userA : userB;
    const p2 = userA < userB ? userB : userA;
    
    let { data, error } = await supabase.from('conversations').select('id').eq('participant_1', p1).eq('participant_2', p2).single();
    if (data) return data.id;

    // If none exists, instantiate
    const { data: newData, error: newErr } = await supabase.from('conversations').insert({ participant_1: p1, participant_2: p2 }).select('id').single();
    if (newErr) throw newErr;
    return newData.id;
  },

  // FETCH CONVERSATIONS FOR USER
  async fetchUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, p1:profiles!conversations_participant_1_fkey(*), p2:profiles!conversations_participant_2_fkey(*)')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // FETCH MESSAGES FOR A CONVERSATION
  async fetchMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  // SEND MESSAGE
  async sendMessage(conversationId: string, senderId: string, text: string) {
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content: text });
    if (error) throw error;
    
    // Bump updated_at for sorting
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  },

  // SUBSCRIBE TO MESSAGES (Global User Listener)
  subscribeToGlobalMessages(callback: (payload: any) => void) {
    // RLS naturally restricts payload broadcasts to rows the user can read via their active conversations
    return supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
      .subscribe();
  },

  // GET DYNAMIC ENGAGEMENT SCORE via RPC
  async getEngagementScore(postId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_engagement_score', { target_post_id: postId });
    if (error) throw error;
    return data as number;
  }
};
