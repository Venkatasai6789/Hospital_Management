
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log('🔍 Checking RLS Policies...');

    // 1. Login as the seeded patient
    console.log('Logging in as test.patient@mediconnect.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'test.patient@mediconnect.com',
        password: 'Password123!'
    });

    if (authError || !authData.session) {
        console.error('❌ Login failed:', authError?.message);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Logged in. User ID: ${userId}`);

    // 2. Try to SELECT from patients table
    console.log('Attempting to SELECT from patients table...');
    const { data: patientData, error: selectError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (selectError) {
        console.error('❌ SELECT failed (RLS likely blocking):', selectError.message);
        console.log('---------------------------------------------------');
        console.log('Diagnosis: The user cannot read their own record.');
        console.log('Solution: Run the following SQL in Supabase Editor:');
        console.log(`
CREATE POLICY "Enable read access for own profile"
ON public.patients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
        `);
        console.log('---------------------------------------------------');
    } else {
        console.log('✅ SELECT successful!');
        console.log('Data:', patientData);
        if (!patientData.first_name) {
            console.warn('⚠️ Data fetched but first_name is missing/empty.');
        }
    }
}

checkRLS();
