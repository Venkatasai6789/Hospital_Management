import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('users_profiles').select('count');
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
            console.error('Supabase connection error:', error);
            return false;
        }
        console.log('✅ Supabase connection successful!');
        return true;
    } catch (err) {
        console.error('❌ Supabase connection failed:', err);
        return false;
    }
};
