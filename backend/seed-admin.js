import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Require the service role key to use admin APIs
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required to seed admin properly.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
    console.log('Seeding Admin User...');

    const email = 'admin@mediconnect.com';
    const password = '12345678admin'; // Using provided pass pattern
    const role = 'admin';

    // 1. Check if auth user exists
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
         console.error('Error listing users:', authError);
         return;
    }

    let userId;
    const existingAdmin = users.find(u => u.email === email);

    if (existingAdmin) {
        console.log('Admin user already exists in auth.');
        userId = existingAdmin.id;
    } else {
        // Create user with auto-confirmed email
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role }
        });

        if (error) {
            console.error('Error creating admin:', JSON.stringify(error, null, 2));
            return;
        }

        console.log('✅ Admin user created successfully in Auth!');
        userId = data.user.id;
    }

    // 2. Guarantee row exists in users_profiles to prevent PGRST116 (0 rows with .single())
    const { error: profileError } = await supabase
        .from('users_profiles')
        .upsert({
            id: userId,
            role: role,
            email: email
        });

    if (profileError) {
        console.error('Error creating admin profile:', profileError);
    } else {
        console.log('✅ Admin profile explicitly ensured in users_profiles!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('UUID:', userId);
    }
}

seedAdmin();
