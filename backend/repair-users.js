
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const usersToRepair = [
    // Admin
    { email: 'admin@mediconnect.com', password: 'AdminPassword2026!', role: 'admin' },
    
    // Master Test Accounts
    { email: 'doctor@mediconnect.com', password: 'DoctorPassword2026!', role: 'doctor' },
    { email: 'patient@mediconnect.com', password: 'PatientPassword2026!', role: 'patient' },

    // Doctors
    { email: 'doctor1@mediconnect.com', password: 'DoctorPass1!2026', role: 'doctor' },
    { email: 'doctor2@mediconnect.com', password: 'DoctorPass2!2026', role: 'doctor' },
    { email: 'doctor3@mediconnect.com', password: 'DoctorPass3!2026', role: 'doctor' },
    { email: 'doctor4@mediconnect.com', password: 'DoctorPass4!2026', role: 'doctor' },
    { email: 'doctor5@mediconnect.com', password: 'DoctorPass5!2026', role: 'doctor' },
    { email: 'doctor6@mediconnect.com', password: 'DoctorPass6!2026', role: 'doctor' },
    { email: 'doctor7@mediconnect.com', password: 'DoctorPass7!2026', role: 'doctor' },
    { email: 'doctor8@mediconnect.com', password: 'DoctorPass8!2026', role: 'doctor' },
    { email: 'doctor9@mediconnect.com', password: 'DoctorPass9!2026', role: 'doctor' },
    { email: 'doctor10@mediconnect.com', password: 'DoctorPass10!2026', role: 'doctor' },
    { email: 'doctor11@mediconnect.com', password: 'DoctorPass11!2026', role: 'doctor' },
    { email: 'doctor12@mediconnect.com', password: 'DoctorPass12!2026', role: 'doctor' },
    { email: 'doctor13@mediconnect.com', password: 'DoctorPass13!2026', role: 'doctor' },
    { email: 'doctor14@mediconnect.com', password: 'DoctorPass14!2026', role: 'doctor' },
    { email: 'doctor15@mediconnect.com', password: 'DoctorPass15!2026', role: 'doctor' },
    { email: 'doctor16@mediconnect.com', password: 'DoctorPass16!2026', role: 'doctor' },
    { email: 'doctor17@mediconnect.com', password: 'DoctorPass17!2026', role: 'doctor' },
    { email: 'doctor18@mediconnect.com', password: 'DoctorPass18!2026', role: 'doctor' },
    { email: 'doctor19@mediconnect.com', password: 'DoctorPass19!2026', role: 'doctor' },
    { email: 'doctor20@mediconnect.com', password: 'DoctorPass20!2026', role: 'doctor' },

    // Patients
    { email: 'patient1@mediconnect.com', password: 'PatientPass1!2026', role: 'patient' },
    { email: 'patient2@mediconnect.com', password: 'PatientPass2!2026', role: 'patient' },
    { email: 'patient3@mediconnect.com', password: 'PatientPass3!2026', role: 'patient' },
    { email: 'patient4@mediconnect.com', password: 'PatientPass4!2026', role: 'patient' },
    { email: 'patient5@mediconnect.com', password: 'PatientPass5!2026', role: 'patient' },
];

async function repairUsers() {
    console.log('--- Repairing Users ---');
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    for (const target of usersToRepair) {
        console.log(`\n🔹 Repairing ${target.email}...`);
        
        let user = users.find(u => u.email === target.email);
        let userId;

        if (!user) {
            console.log(`User ${target.email} not found. Creating...`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: target.email,
                password: target.password,
                email_confirm: true,
                user_metadata: { role: target.role }
            });
            if (createError) {
                console.error(`Error creating user ${target.email}:`, createError.message);
                continue;
            }
            userId = newUser.user.id;
            console.log(`✅ Created user ${target.email} (ID: ${userId})`);
        } else {
            userId = user.id;
            console.log(`User exists (ID: ${userId}). Updating password...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                password: target.password
            });
            if (updateError) {
                console.error(`Error updating password for ${target.email}:`, updateError.message);
            } else {
                console.log(`✅ Updated password for ${target.email}`);
            }
        }

        // Repair Profile
        const { data: profile, error: profileError } = await supabase
            .from('users_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (profileError) {
            console.error(`Error checking profile for ${target.email}:`, profileError.message);
        } else if (!profile) {
            console.log(`Profile missing for ${target.email}. Creating...`);
            const { error: insertError } = await supabase
                .from('users_profiles')
                .insert({ id: userId, role: target.role });
            if (insertError) {
                console.error(`Error inserting profile for ${target.email}:`, insertError.message);
            } else {
                console.log(`✅ Created profile for ${target.email}`);
            }
        } else if (profile.role !== target.role) {
            console.log(`Role mismatch for ${target.email}: ${profile.role} -> ${target.role}. Updating...`);
            const { error: roleUpdateError } = await supabase
                .from('users_profiles')
                .update({ role: target.role })
                .eq('id', userId);
            if (roleUpdateError) {
                console.error(`Error updating role for ${target.email}:`, roleUpdateError.message);
            } else {
                console.log(`✅ Updated role for ${target.email}`);
            }
        } else {
            console.log(`✅ Profile is correct for ${target.email}`);
        }
    }

    console.log('\n--- Repair Complete ---');
}

repairUsers();
