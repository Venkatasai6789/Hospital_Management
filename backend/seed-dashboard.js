
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

async function seedDashboard() {
    console.log('🌱 Seeding Dashboard Data...');

    try {
        // 1. Get Patient ID
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'test.patient@mediconnect.com',
            password: 'Password123!'
        });

        if (authError || !authData.session) {
            throw new Error('Login failed for test.patient');
        }
        const patientUserId = authData.user.id;
        console.log(`✅ Identified Patient: ${patientUserId}`);

        // 2. Get a Doctor ID
        const { data: doctor, error: docError } = await supabase
            .from('doctors')
            .select('id, first_name, surname, user_id')
            .eq('approval_status', 'approved')
            .limit(1)
            .single();

        if (docError || !doctor) {
            console.log('⚠️ No approved doctors found. Seeding without doctor link (or failing).');
            // Attempt to get ANY doctor (even pending) if approved missing
            // Or verify if seed-doctors.js ran.
            throw new Error("No approved doctors found to link appointments to.");
        }
        console.log(`✅ Identified Doctor: Dr. ${doctor.first_name} ${doctor.surname} (${doctor.id})`);

        // 3. Clear existing data for this patient (optional, to avoid dupes)
        await supabase.from('appointments').delete().eq('patient_id', patientUserId);
        await supabase.from('interactions').delete().eq('user_id', patientUserId);

        // 4. Insert Appointment
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { error: appError } = await supabase.from('appointments').insert({
            patient_id: patientUserId,
            doctor_id: doctor.id,
            date: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD
            time: '10:00:00',
            type: 'video',
            status: 'upcoming',
            notes: 'Follow-up consultation',
            meeting_link: 'https://meet.google.com/abc-defg-hij'
        });

        if (appError) throw new Error(`Appointment Insert Error: ${appError.message}`);
        console.log('✅ Appointment created');

        // 5. Insert Interactions
        const interactions = [
            {
                user_id: patientUserId,
                type: 'system',
                title: 'Account Created',
                description: 'Welcome to MediConnect!',
                icon: 'user-plus'
            },
            {
                user_id: patientUserId,
                type: 'appointment',
                title: 'Appointment Scheduled',
                description: `Consultation with Dr. ${doctor.surname}`,
                action_label: 'View Details',
                date: new Date().toISOString(),
                icon: 'calendar'
            }
        ];

        const { error: intError } = await supabase.from('interactions').insert(interactions);
        if (intError) throw new Error(`Interaction Insert Error: ${intError.message}`);
        console.log('✅ Interactions created');

        console.log('✨ Dashboard seeding complete!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedDashboard();
