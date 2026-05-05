import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log("Starting...");
  try {
    const { data, error, count } = await supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', 'some-id');
    console.log("Finished follows query:", { data, error, count });
  } catch (e) {
    console.error("CAUGHT EXCEPTION ON FOLLOWS:", e);
  }
}
run();
