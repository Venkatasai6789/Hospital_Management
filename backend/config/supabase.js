import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
export async function testConnection() {
    try {
        const { data, error } = await supabase.from('users_profiles').select('count');
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase connection error:', error.message);
            return false;
        }
        console.log('✅ Backend connected to Supabase successfully!');
        return true;
    } catch (err) {
        console.error('❌ Failed to connect to Supabase:', err.message);
        return false;
    }
}
