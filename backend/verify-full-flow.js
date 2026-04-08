import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as authService from './services/authService.js';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyFlow() {
    console.log('--- Starting Verification Flow ---');

    // 1. Test Patient Signup (Admin bypass)
    const patientEmail = `patient_verify_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log(`1. Creating patient: ${patientEmail}`);
    const { data: patientData, error: patientError } = await supabase.auth.admin.createUser({
        email: patientEmail,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'patient', fullName: 'Test Patient' }
    });

    if (patientError) {
        console.error('❌ Patient creation failed:', patientError);
        return;
    }
    console.log('✅ Patient created successfully. ID:', patientData.user.id);

    // 2. Test Doctor Signup (Admin bypass)
    const doctorEmail = `doctor_verify_${Date.now()}@example.com`;
    console.log(`2. Creating doctor: ${doctorEmail}`);
    
    const { data: doctorData, error: doctorError } = await authService.registerDoctor({
        email: doctorEmail,
        password: password,
        fullName: 'Dr. Test Verify',
        mobileNumber: '9998887776',
        specialty: 'Cardiology',
        hospitalName: 'Test Hospital',
        yearsOfExperience: 10,
        address: '123 Verified St'
    });
    
    // Let's verify the users_profiles trigger
    const { data: triggerVerificationPatient, error: dbError } = await supabase
        .from('users_profiles')
        .select('role, email')
        .eq('id', patientData.user.id)
        .single();
    
    if (triggerVerificationPatient) {
        console.log('✅ trigger works for patient. Role:', triggerVerificationPatient.role);
    } else {
        console.error('❌ Trigger failed - patient not in users_profiles.', dbError);
    }
    
    if (doctorError) {
        console.error('⚠️ Doctor registration issue (might be rate limit):', doctorError.message);
    } else {
        console.log('✅ Doctor registration successful.');
    }
    
    console.log('--- Verification Complete ---');
}

verifyFlow().catch(console.error);
