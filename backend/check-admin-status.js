
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
    console.log('--- Checking Admin User ---');
    const email = 'admin@mediconnect.com';

    // 1. Check Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
        console.error('Error listing users:', authError);
        return;
    }

    const adminUser = users.find(u => u.email === email);
    if (!adminUser) {
        console.log('❌ Admin user NOT found in Auth.');
    } else {
        console.log('✅ Admin user found in Auth:', adminUser.id);
    }

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', adminUser?.id)
        .maybeSingle();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else if (!profile) {
        console.log('❌ Admin profile NOT found in users_profiles.');
    } else {
        console.log('✅ Admin profile found:', profile);
    }
}

checkAdmin();
