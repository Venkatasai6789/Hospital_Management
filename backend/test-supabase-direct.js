import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSignup() {
    const timestamp = Date.now();
    const email = `test_${timestamp}@example.com`;
    const password = 'Password123!';

    console.log(`Testing signup directly for ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'patient',
                fullName: 'Direct Test',
                mobileNumber: '9999999999'
            }
        }
    });

    if (error) {
        console.error('❌ Direct Signup Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Direct Signup Success:', data.user.id);
    }
}

testSignup();
