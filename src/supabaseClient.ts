import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

import { logger } from './lib/logger';

export async function safeDbCall<T>(promise: Promise<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await promise;
    if (error) {
      logger.error('Database call returned error:', error);
      throw new Error(error.message || 'Database request failed.');
    }
    return data;
  } catch (err) {
    logger.error('Execution / connection exception during database call:', err);
    throw err;
  }
}
