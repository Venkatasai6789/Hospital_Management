
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') }); // Point to root .env

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mockDoctors = [
    {
        firstName: "John", surname: "Doe", age: 45, gender: "male",
        specialty: "Cardiology", experience: 15,
        location: "New York, USA", hospital: "General Hospital"
    },
    {
        firstName: "Jane", surname: "Smith", age: 38, gender: "female",
        specialty: "Pediatrics", experience: 10,
        location: "London, UK", hospital: "City Children's Center"
    },
    {
        firstName: "Robert", surname: "Brown", age: 52, gender: "male",
        specialty: "Neurology", experience: 20,
        location: "Toronto, Canada", hospital: "Neuro Care Institute"
    },
    {
        firstName: "Emily", surname: "Davis", age: 34, gender: "female",
        specialty: "Dermatology", experience: 8,
        location: "Sydney, Australia", hospital: "Skin Health Clinic"
    },
    {
        firstName: "Michael", surname: "Wilson", age: 48, gender: "male",
        specialty: "Orthopedics", experience: 18,
        location: "Chicago, USA", hospital: "Bone & Joint Center"
    },
    {
        firstName: "Sarah", surname: "Taylor", age: 41, gender: "female",
        specialty: "Gynecology", experience: 12,
        location: "Manchester, UK", hospital: "Women's Wellness"
    },
    {
        firstName: "David", surname: "Martinez", age: 39, gender: "male",
        specialty: "Psychiatry", experience: 9,
        location: "Austin, USA", hospital: "Mindful Health"
    },
    {
        firstName: "Lisa", surname: "Anderson", age: 36, gender: "female",
        specialty: "Dental Surgery", experience: 7,
        location: "Seattle, USA", hospital: "Smile Bright Clinic"
    },
    {
        firstName: "James", surname: "Thomas", age: 55, gender: "male",
        specialty: "Oncology", experience: 25,
        location: "Boston, USA", hospital: "Cancer Research Institute"
    },
    {
        firstName: "Patricia", surname: "White", age: 44, gender: "female",
        specialty: "General Medicine", experience: 14,
        location: "Denver, USA", hospital: "Community Health Center"
    }
];

async function seedDoctors() {
    console.log('🌱 Seeding 10 Mock Doctors...');
    const credentials = [];

    for (let i = 0; i < mockDoctors.length; i++) {
        const doc = mockDoctors[i];
        const email = `doctor${i + 1}@mediconnect.com`;
        const password = `Pass123!Doc${i + 1}`; // Strong password pattern

        console.log(`\n🔹 Processing Doctor ${i + 1}: ${doc.firstName} ${doc.surname}`);

        // 1. Sign Up User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role: 'doctor' } // Trigger will create users_profiles entry
            }
        });

        if (authError) {
            console.error(`   ❌ Auth Error: ${authError.message}`);
            continue;
        }

        const userId = authData.user?.id;
        if (!userId) {
            console.error('   ❌ User ID missing after signup (User might already exist)');
            continue;
        }

        console.log(`   ✅ User created (ID: ${userId})`);

        // 2. Insert Doctor Details
        // We use the returned session/user context to insert into the doctors table if possible,
        // or rely on the fact that 'signUp' returns a session if email confirmation is off.
        // If email confirmation IS on, we won't get a session and can't insert via RLS unless we are admin.
        // Since we are using ANON key, we strictly rely on "signUp returns session" OR "RLS allows insert based on auth.uid()".
        // BUT without a session token in the client, we can't act AS that user.
        // `supabase.auth.signUp` automatically sets the session on the client IF successful.

        // Wait a moment for trigger to create user profile
        await new Promise(r => setTimeout(r, 1000));

        const { error: dbError } = await supabase.from('doctors').insert({
            user_id: userId,
            first_name: doc.firstName,
            surname: doc.surname,
            age: doc.age,
            gender: doc.gender,
            mobile_number: `555-010${i}`,
            email: email,
            address: {
                city: doc.location.split(', ')[0],
                country: doc.location.split(', ')[1],
                street: "123 Medical Way",
                pincode: "10001"
            },
            hospital_name: doc.hospital,
            specialty: doc.specialty,
            years_of_experience: doc.experience,
            hospital_location: doc.location,
            hospital_website: `www.${doc.hospital.replace(/\s+/g, '').toLowerCase()}.com`,
            professional_bio: `Experienced ${doc.specialty} specialist with over ${doc.experience} years of practice.`,
            approval_status: 'approved', // Auto-approve for mock data
            approved_at: new Date().toISOString()
        });

        if (dbError) {
            console.error(`   ❌ Database Insert Error: ${dbError.message}`);
            // If insert failed (e.g. RLS), we might need to manually handle it or warn user.
        } else {
            console.log(`   ✅ Doctor profile created in DB`);
            credentials.push(`Email: ${email} | Password: ${password} | Name: Dr. ${doc.firstName} ${doc.surname} | Specialty: ${doc.specialty}`);
        }

        // Sign out to clear session for next user
        await supabase.auth.signOut();
    }

    // Write credentials to file
    const credsContent = "DUMMY DOCTOR CREDENTIALS\n========================\n\n" + credentials.join('\n');
    await fs.writeFile(path.join(__dirname, '../doctor_credentials.txt'), credsContent, 'utf-8');

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Seeding Complete!');
    console.log('📄 Credentials saved to: doctor_credentials.txt');
}

seedDoctors();
