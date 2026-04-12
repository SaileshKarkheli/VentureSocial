import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if(!url || !key) {
    console.error("❌ Missing URL or Key");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    console.log("Testing Supabase connection...");
    try {
        // Trying to query auth health or a dummy query
        // Even if tables don't exist, we can ping the auth endpoint or just check the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("❌ Connection failed! Credentials might be incorrect.", error.message);
        } else {
            console.log("✅ SUCCESS! Successfully connected to Supabase.");
        }
    } catch(err) {
        console.error("❌ Network or setup error:", err);
    }
}

testConnection();
