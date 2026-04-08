import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSignup() {
    const email = `test_admin_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log(`Attempting admin user creation for ${email}...`);
    
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            role: 'patient',
            fullName: 'Test Admin User'
        }
    });
    
    if (error) {
        console.error('Admin Create Error:', error);
    } else {
        console.log('Admin Create Success:', data.user.id);
    }
}

testSignup();
