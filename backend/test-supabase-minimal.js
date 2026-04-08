import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMinimalSignup() {
    const timestamp = Date.now();
    const email = `minimal_${timestamp}@example.com`;
    const password = 'Password123!';

    console.log(`Testing MINIMAL signup for ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error('❌ Minimal Signup Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Minimal Signup Success:', data.user.id);
    }
}

testMinimalSignup();
