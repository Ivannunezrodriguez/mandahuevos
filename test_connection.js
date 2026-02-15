
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Connection to:', SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Environment Variables!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        // 1. Test Read (Health Check)
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed (Read):', error.message);
            // Check if it's a connection error or specific RLS error
        } else {
            console.log('✅ Connection Successful! Profiles count:', data); // data is null for head:true usually, count is in count
        }

        // 2. Test Auth Service (verify key validity)
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('❌ Auth Service Error:', authError.message);
        } else {
            console.log('✅ Auth Service Reachable.');
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
