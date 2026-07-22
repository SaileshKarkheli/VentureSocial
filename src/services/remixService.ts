import { supabase } from '../supabaseClient';

export interface SavedSpotData {
  id: string;
  custom_day: number;
  trip_spots: {
    id: string;
    title: string;
    description: string;
    category: 'Transport' | 'Stay' | 'Dining' | 'Activity';
    image_url?: string;
    link_url?: string;
    day_number: number;
  };
}

export const remixService = {
  // Fetch user remix folders with counts and cover image urls
  async fetchFolders(userId: string) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    const mockFolders = [
      {
        id: 'mock-folder-1',
        name: 'Kyoto Getaway',
        count: 3,
        cover_url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'mock-folder-2',
        name: 'Venice Explorer',
        count: 2,
        cover_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80'
      }
    ];

    if (isMockMode) {
      return mockFolders;
    }

    try {
      const { data, error } = await supabase
        .from('remix_folders')
        .select(`
          id,
          name,
          created_at,
          saved_spots ( count )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const foldersWithCovers = await Promise.all(data.map(async (folder: any) => {
          let cover_url = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';
          try {
            const { data: spotData, error: spotError } = await supabase
              .from('saved_spots')
              .select(`
                trip_spots ( image_url )
              `)
              .eq('folder_id', folder.id)
              .limit(1);

            if (!spotError && spotData && spotData.length > 0) {
              const url = (spotData[0]?.trip_spots as any)?.image_url;
              if (url) cover_url = url;
            }
          } catch (e) {
            console.error("Error fetching cover image for folder:", e);
          }

          const savedSpotsArray = Array.isArray(folder.saved_spots) ? folder.saved_spots : [folder.saved_spots];
          const count = savedSpotsArray[0]?.count || 0;

          return {
            id: folder.id,
            name: folder.name,
            count: count,
            cover_url: cover_url
          };
        }));
        return foldersWithCovers;
      }
      return [];
    } catch (err) {
      console.warn("Supabase fetch failed in remixService, falling back to mock folders:", err);
      return mockFolders;
    }
  },

  // Fetch all saved spots inside a folder
  async fetchFolderSpots(folderId: string) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    const getMockSpots = () => {
      if (folderId === 'mock-folder-1') {
        return [
          {
            id: 'mock-spot-1',
            custom_day: 1,
            trip_spots: { id: 'ms-1', title: 'Bullet Train to Kyoto', description: 'Smooth ride on Shinkansen', category: 'Transport' as const, image_url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80' }
          },
          {
            id: 'mock-spot-2',
            custom_day: 1,
            trip_spots: { id: 'ms-2', title: 'Traditional Ryokan', description: 'Authentic Ryokan inn', category: 'Stay' as const, image_url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80' }
          },
          {
            id: 'mock-spot-3',
            custom_day: 2,
            trip_spots: { id: 'ms-3', title: 'Fushimi Inari Shrine', description: 'Walking the Torii Gates', category: 'Activity' as const, image_url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=800&q=80' }
          }
        ];
      } else {
        return [
          {
            id: 'mock-spot-4',
            custom_day: 1,
            trip_spots: { id: 'ms-4', title: 'Private Gondola Tour', description: 'Exploring Venice canals', category: 'Transport' as const, image_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80' }
          },
          {
            id: 'mock-spot-5',
            custom_day: 1,
            trip_spots: { id: 'ms-5', title: 'St Mark Square Hotel', description: 'Boutique stay in the center', category: 'Stay' as const, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80' }
          }
        ];
      }
    };

    if (isMockMode) {
      return getMockSpots();
    }

    try {
      const { data, error } = await supabase
        .from('saved_spots')
        .select(`
          id,
          custom_day,
          trip_spots (
            id, title, description, category, image_url, image_urls, link_url, day_number,
            lat, lng,
            post_id,
            posts ( id, user_id )
          )
        `)
        .eq('folder_id', folderId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase fetch failed in remixService.fetchFolderSpots, falling back to mock spots:", err);
      return getMockSpots();
    }
  },

  // Move saved spot to a different custom day number
  async reassignSpotDay(savedSpotId: string, newDay: number) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    if (isMockMode) return;

    try {
      await supabase
        .from('saved_spots')
        .update({ custom_day: newDay })
        .eq('id', savedSpotId);
    } catch (err) {
      console.error("Error reassigning day in remixService:", err);
    }
  },

  // Remove saved spot from active workspace folder
  async removeSpot(savedSpotId: string) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    if (isMockMode) return;

    try {
      await supabase
        .from('saved_spots')
        .delete()
        .eq('id', savedSpotId);
    } catch (err) {
      console.error("Error deleting spot in remixService:", err);
    }
  },

  // Delete remix folder
  async deleteFolder(folderId: string) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    if (isMockMode) return;

    try {
      await supabase
        .from('remix_folders')
        .delete()
        .eq('id', folderId);
    } catch (err) {
      console.error("Error deleting folder in remixService:", err);
    }
  }
};
