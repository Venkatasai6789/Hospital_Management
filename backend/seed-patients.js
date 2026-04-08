
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_PATIENT = {
    email: 'test.patient@mediconnect.com',
    password: 'Password123!',
    firstName: 'Sarah',
    surname: 'Jenkins',
    age: 29,
    gender: 'female',
    mobileNumber: '+919876543210',
    address: '123, Green Park, Bangalore',
    details: {
        mode: 'manual',
        city: 'Bangalore',
        state: 'Karnataka'
    }
};

async function seedPatients() {
    console.log('🌱 Seeding Patient Data...');

    try {
        // 1. Sign Up User
        console.log(`Creating user: ${TEST_PATIENT.email}`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: TEST_PATIENT.email,
            password: TEST_PATIENT.password,
            options: {
                data: {
                    firstName: TEST_PATIENT.firstName, // Store in metadata too as backup
                    role: 'patient'
                }
            }
        });

        if (authError) {
            console.error('❌ Auth Error:', authError.message);
            // If user already exists, try to sign in to get ID
            if (authError.message.includes('already registered')) {
                console.log('User exists, signing in to update profile...');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: TEST_PATIENT.email,
                    password: TEST_PATIENT.password
                });
                if (signInError) throw signInError;
                authData.user = signInData.user;
            } else {
                throw authError;
            }
        }

        if (!authData.user) {
            throw new Error('User creation failed - no user data returned');
        }

        const userId = authData.user.id;
        console.log(`✅ User authenticated with ID: ${userId}`);

        // 2. Insert into Patients Table
        const { error: patientError } = await supabase
            .from('patients')
            .upsert({
                user_id: userId,
                first_name: TEST_PATIENT.firstName,
                surname: TEST_PATIENT.surname,
                age: TEST_PATIENT.age,
                gender: TEST_PATIENT.gender,
                mobile_number: TEST_PATIENT.mobileNumber,
                email: TEST_PATIENT.email,
                address: TEST_PATIENT.address,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (patientError) {
            console.error('❌ Patient Insert Error:', patientError);
            throw patientError;
        }

        console.log('✅ Patient profile created successfully!');
        console.log('------------------------------------------------');
        console.log('Login Credentials:');
        console.log(`Email: ${TEST_PATIENT.email}`);
        console.log(`Password: ${TEST_PATIENT.password}`);
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedPatients();
