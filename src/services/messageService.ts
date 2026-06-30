import { supabase } from '../supabaseClient';

const isMock = () => import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');

const initMockStore = () => {
  if (!localStorage.getItem('venturesocial_mock_conversations')) {
    const seedConvos = [
      {
        id: 'convo-1',
        participant_1: 'u123',
        participant_2: 'u1',
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        p1: { id: 'u123', full_name: 'Alex Explorer', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100', username: 'alex_explorer' },
        p2: { id: 'u1', full_name: 'Sarah Miller', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100', username: 'sarah_miller' }
      },
      {
        id: 'convo-2',
        participant_1: 'u123',
        participant_2: 'u2',
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        p1: { id: 'u123', full_name: 'Alex Explorer', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100', username: 'alex_explorer' },
        p2: { id: 'u2', full_name: 'Alex Chen', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100', username: 'alex_chen' }
      }
    ];
    localStorage.setItem('venturesocial_mock_conversations', JSON.stringify(seedConvos));
  }

  if (!localStorage.getItem('venturesocial_mock_messages')) {
    const seedMsgs = [
      { id: 'm1', conversation_id: 'convo-1', sender_id: 'u1', content: 'Hey Alex! Loved your Venice photos. Are you planning any trips soon?', created_at: new Date(Date.now() - 3400000).toISOString() },
      { id: 'm2', conversation_id: 'convo-1', sender_id: 'u123', content: "Thanks Sarah! I'm thinking of doing a Japan trip in the fall.", created_at: new Date(Date.now() - 3200000).toISOString() },
      { id: 'm3', conversation_id: 'convo-1', sender_id: 'u1', content: 'Oh nice, Japan is amazing! Let me know if you need any recommendations.', created_at: new Date(Date.now() - 3000000).toISOString() },
      { id: 'm4', conversation_id: 'convo-2', sender_id: 'u2', content: 'Hey, did you finish editing the Venice remix itinerary?', created_at: new Date(Date.now() - 7000000).toISOString() },
      { id: 'm5', conversation_id: 'convo-2', sender_id: 'u123', content: 'Almost done! Just sequencing the spots for Day 2.', created_at: new Date(Date.now() - 6800000).toISOString() }
    ];
    localStorage.setItem('venturesocial_mock_messages', JSON.stringify(seedMsgs));
  }
};

export const messageService = {
  // Get or create conversation thread between two users
  async getOrCreateConversation(userA: string, userB: string) {
    if (isMock()) {
      initMockStore();
      const convos = JSON.parse(localStorage.getItem('venturesocial_mock_conversations') || '[]');
      const p1 = userA < userB ? userA : userB;
      const p2 = userA < userB ? userB : userA;
      const found = convos.find((c: any) => c.participant_1 === p1 && c.participant_2 === p2);
      if (found) return found.id;

      const newId = `convo-mock-${Date.now()}`;
      const profiles: Record<string, any> = {
        'u1': { id: 'u1', full_name: 'Sarah Miller', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100', username: 'sarah_miller' },
        'u2': { id: 'u2', full_name: 'Alex Chen', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100', username: 'alex_chen' },
        'u3': { id: 'u3', full_name: 'Emma Wilson', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100', username: 'emma_wilson' }
      };
      const partnerProfile = profiles[userB] || { id: userB, full_name: 'Mock Traveler', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100', username: 'mock_traveler' };
      const newConvo = {
        id: newId,
        participant_1: p1,
        participant_2: p2,
        updated_at: new Date().toISOString(),
        p1: { id: userA, full_name: 'Alex Explorer', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100', username: 'alex_explorer' },
        p2: partnerProfile
      };
      convos.push(newConvo);
      localStorage.setItem('venturesocial_mock_conversations', JSON.stringify(convos));
      return newId;
    }

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
    if (isMock()) {
      initMockStore();
      return JSON.parse(localStorage.getItem('venturesocial_mock_conversations') || '[]');
    }

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
    if (isMock()) {
      initMockStore();
      const allMsgs = JSON.parse(localStorage.getItem('venturesocial_mock_messages') || '[]');
      return allMsgs.filter((m: any) => m.conversation_id === conversationId);
    }

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
    if (isMock()) {
      initMockStore();
      const allMsgs = JSON.parse(localStorage.getItem('venturesocial_mock_messages') || '[]');
      const newMsg = {
        id: `m-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString()
      };
      allMsgs.push(newMsg);
      localStorage.setItem('venturesocial_mock_messages', JSON.stringify(allMsgs));

      window.dispatchEvent(new CustomEvent('mock_message_sent', { detail: newMsg }));
      return;
    }

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
    if (isMock()) {
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && customEvent.detail.conversation_id === conversationId) {
          callback({ new: customEvent.detail });
        }
      };
      window.addEventListener('mock_message_sent', handler);
      return {
        unsubscribe: () => window.removeEventListener('mock_message_sent', handler)
      };
    }

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
