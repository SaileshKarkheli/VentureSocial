import { supabase } from '../supabaseClient';

export const messageService = {
  // Get or create conversation thread between two users
  async getOrCreateConversation(userA: string, userB: string) {
    const p1 = userA < userB ? userA : userB;
    const p2 = userA < userB ? userB : userA;

    try {
      let { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .single();
        
      if (data) return data.id;

      const { data: newData, error: newErr } = await supabase
        .from('conversations')
        .insert({ participant_1: p1, participant_2: p2 })
        .select('id')
        .single();
        
      if (newErr) throw newErr;
      return newData.id;
    } catch (err) {
      console.error("Error inside messageService.getOrCreateConversation:", err);
      throw err;
    }
  },

  // Fetch all conversations for a user
  async fetchUserConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, p1:profiles!conversations_participant_1_fkey(*), p2:profiles!conversations_participant_2_fkey(*)')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching conversations in messageService:", err);
      return [];
    }
  },

  // Fetch message history for a conversation
  async fetchMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching messages in messageService:", err);
      return [];
    }
  },

  // Send message in a conversation
  async sendMessage(conversationId: string, senderId: string, content: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, content });
        
      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error("Error sending message in messageService:", err);
    }
  },

  // Subscribe to real-time changes inside an active conversation thread
  subscribeToThreadMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`active_thread:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        callback
      )
      .subscribe();
  }
};
