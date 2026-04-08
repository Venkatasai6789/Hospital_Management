// Test Supabase connection
import { testSupabaseConnection } from './lib/supabase';

console.log('🔍 Testing Supabase connection...');
testSupabaseConnection().then(success => {
    if (success) {
        console.log('✅ Supabase is properly configured and connected!');
    } else {
        console.warn('⚠️ Supabase connection test failed. Check your credentials and network.');
    }
});
