
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

const hospitalNames = [
    'Government Hospital Srivilliputhur',
    'Sri Meenakshi Hospital',
    'Sree Devi Hospital',
    'KVT Hospital',
    'Virudhunagar Government Medical College Hospital',
    'Government Hospital Virudhunagar',
    'Meenakshi Hospital Virudhunagar',
    'Vadamalayan Hospital Virudhunagar',
    'Shanmuganathan Hospital',
    'Government Rajaji Hospital Madurai',
    'Meenakshi Mission Hospital & Research Centre',
    'Apollo Speciality Hospitals Madurai',
    'Vadamalayan Hospitals Madurai',
    'Velammal Medical College Hospital',
    'Devadoss Multispeciality Hospital',
    'Sundaram Medical Foundation Madurai',
    'Government Hospital Krishnankoil',
    'Meenakshi Hospital Krishnankoil',
    'Aravind Eye Hospital Madurai',
    'Aachi Hospital Krishnankoil',
];

const hospitalLocations = [
    'Main Road, Srivilliputhur, Virudhunagar District',
    'Thiruthangal Road, Srivilliputhur',
    'Rajapalayam Road, Srivilliputhur',
    'Watrap Road, Srivilliputhur',
    'Medical College Road, Virudhunagar',
    'Hospital Road, Virudhunagar',
    'Sivakasi Road, Virudhunagar',
    'Madurai Road, Virudhunagar',
    'South Car Street, Virudhunagar',
    'Panagal Road, Madurai - 625020',
    'Lake Area, Melur Road, Madurai - 625107',
    'KK Nagar, Madurai - 625020',
    'Simmakkal, Madurai - 625001',
    'Anuppanadi, Madurai - 625009',
    'Gorimedu, Madurai - 625007',
    'Anna Nagar, Madurai - 625020',
    'Main Road, Krishnankoil, Virudhunagar District',
    'Srivilliputhur Road, Krishnankoil',
    'Anna Nagar, Madurai - 625020',
    'Virudhunagar Road, Krishnankoil',
];

const doctorProfiles = [
    { firstName: 'Arjun', surname: 'Kumar', age: 44, gender: 'male', specialty: 'General Medicine', experience: 16 },
    { firstName: 'Meera', surname: 'Iyer', age: 39, gender: 'female', specialty: 'Cardiology', experience: 13 },
    { firstName: 'Vikram', surname: 'Rao', age: 41, gender: 'male', specialty: 'Pediatrics', experience: 12 },
    { firstName: 'Nandini', surname: 'Shah', age: 36, gender: 'female', specialty: 'Orthopedics', experience: 10 },
    { firstName: 'Sanjay', surname: 'Menon', age: 49, gender: 'male', specialty: 'Neurology', experience: 18 },
    { firstName: 'Priya', surname: 'Nair', age: 37, gender: 'female', specialty: 'Gynecology', experience: 11 },
    { firstName: 'Karthik', surname: 'Subramanian', age: 42, gender: 'male', specialty: 'Emergency', experience: 15 },
    { firstName: 'Ananya', surname: 'Das', age: 34, gender: 'female', specialty: 'Dermatology', experience: 9 },
    { firstName: 'Raghav', surname: 'Patel', age: 46, gender: 'male', specialty: 'Surgery', experience: 17 },
    { firstName: 'Fatima', surname: 'Khan', age: 45, gender: 'female', specialty: 'Trauma Care', experience: 16 },
    { firstName: 'Srinivasan', surname: 'K', age: 52, gender: 'male', specialty: 'Oncology', experience: 22 },
    { firstName: 'Aishwarya', surname: 'Balan', age: 33, gender: 'female', specialty: 'Pulmonology', experience: 8 },
    { firstName: 'Hari', surname: 'Prasad', age: 47, gender: 'male', specialty: 'Nephrology', experience: 19 },
    { firstName: 'Lavanya', surname: 'S', age: 35, gender: 'female', specialty: 'General Medicine', experience: 10 },
    { firstName: 'Mohanraj', surname: 'V', age: 50, gender: 'male', specialty: 'Cardiology', experience: 21 },
    { firstName: 'Sowmya', surname: 'R', age: 38, gender: 'female', specialty: 'General Medicine', experience: 12 },
    { firstName: 'Naveen', surname: 'Selvam', age: 40, gender: 'male', specialty: 'Emergency', experience: 14 },
    { firstName: 'Divya', surname: 'Suresh', age: 32, gender: 'female', specialty: 'Ophthalmology', experience: 8 },
    { firstName: 'Balaji', surname: 'Kumar', age: 43, gender: 'male', specialty: 'ENT', experience: 15 },
    { firstName: 'Keerthi', surname: 'Anand', age: 31, gender: 'female', specialty: 'General Medicine', experience: 7 },
];

const mockDoctors = doctorProfiles.map((doctor, index) => ({
    ...doctor,
    location: hospitalLocations[index],
    hospital: hospitalNames[index],
}));

async function seedDoctors() {
    console.log('🌱 Seeding 20 Mock Doctors...');
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
            hospital_website: `www.${doc.hospital.replace(/\s+/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
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
