import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdmin() {
    console.log('--- Resetting Admin User ---');
    const email = 'admin@mediconnect.com';
    const password = '12345678admin';

    // 1. Check Auth to get user ID
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
        console.error('Error listing users:', authError);
        return;
    }

    const adminUser = users.find(u => u.email === email);
    if (adminUser) {
        console.log('Deleting existing admin user:', adminUser.id);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(adminUser.id);
        if (deleteError) {
             console.error('Error deleting user:', deleteError);
             return;
        }
    }
    
    console.log('Creating admin user...');
    const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });
    
    if (createError) {
        console.error('Error creating user:', createError);
        return;
    }
    
    console.log('Admin user recreated with id:', newUserData.user.id);
    
    // Upsert into users_profiles
    const { error: profileError } = await supabase
        .from('users_profiles')
        .upsert({
             id: newUserData.user.id,
             role: 'admin',
             email: email
        });
        
    if (profileError) {
        console.error('Error setting profile:', profileError);
    } else {
        console.log('Profile created or updated for admin');
    }
}

resetAdmin();
