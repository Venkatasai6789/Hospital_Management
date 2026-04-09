import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const doctorHospitalMapping = [
    { email: 'doctor1@mediconnect.com', hospital_name: 'Government Hospital Srivilliputhur', hospital_location: 'Main Road, Srivilliputhur, Virudhunagar District', specialty: 'General Medicine', years_of_experience: 16 },
    { email: 'doctor2@mediconnect.com', hospital_name: 'Sri Meenakshi Hospital', hospital_location: 'Thiruthangal Road, Srivilliputhur', specialty: 'Cardiology', years_of_experience: 13 },
    { email: 'doctor3@mediconnect.com', hospital_name: 'Sree Devi Hospital', hospital_location: 'Rajapalayam Road, Srivilliputhur', specialty: 'Pediatrics', years_of_experience: 12 },
    { email: 'doctor4@mediconnect.com', hospital_name: 'KVT Hospital', hospital_location: 'Watrap Road, Srivilliputhur', specialty: 'Orthopedics', years_of_experience: 10 },
    { email: 'doctor5@mediconnect.com', hospital_name: 'Virudhunagar Government Medical College Hospital', hospital_location: 'Medical College Road, Virudhunagar', specialty: 'Neurology', years_of_experience: 18 },
    { email: 'doctor6@mediconnect.com', hospital_name: 'Government Hospital Virudhunagar', hospital_location: 'Hospital Road, Virudhunagar', specialty: 'Gynecology', years_of_experience: 11 },
    { email: 'doctor7@mediconnect.com', hospital_name: 'Meenakshi Hospital Virudhunagar', hospital_location: 'Sivakasi Road, Virudhunagar', specialty: 'Emergency', years_of_experience: 15 },
    { email: 'doctor8@mediconnect.com', hospital_name: 'Vadamalayan Hospital Virudhunagar', hospital_location: 'Madurai Road, Virudhunagar', specialty: 'Dermatology', years_of_experience: 9 },
    { email: 'doctor9@mediconnect.com', hospital_name: 'Shanmuganathan Hospital', hospital_location: 'South Car Street, Virudhunagar', specialty: 'Surgery', years_of_experience: 17 },
    { email: 'doctor10@mediconnect.com', hospital_name: 'Government Rajaji Hospital Madurai', hospital_location: 'Panagal Road, Madurai - 625020', specialty: 'Trauma Care', years_of_experience: 16 },
    { email: 'doctor11@mediconnect.com', hospital_name: 'Meenakshi Mission Hospital & Research Centre', hospital_location: 'Lake Area, Melur Road, Madurai - 625107', specialty: 'Oncology', years_of_experience: 22 },
    { email: 'doctor12@mediconnect.com', hospital_name: 'Apollo Speciality Hospitals Madurai', hospital_location: 'KK Nagar, Madurai - 625020', specialty: 'Pulmonology', years_of_experience: 8 },
    { email: 'doctor13@mediconnect.com', hospital_name: 'Vadamalayan Hospitals Madurai', hospital_location: 'Simmakkal, Madurai - 625001', specialty: 'Nephrology', years_of_experience: 19 },
    { email: 'doctor14@mediconnect.com', hospital_name: 'Velammal Medical College Hospital', hospital_location: 'Anuppanadi, Madurai - 625009', specialty: 'General Medicine', years_of_experience: 10 },
    { email: 'doctor15@mediconnect.com', hospital_name: 'Devadoss Multispeciality Hospital', hospital_location: 'Gorimedu, Madurai - 625007', specialty: 'Cardiology', years_of_experience: 21 },
    { email: 'doctor16@mediconnect.com', hospital_name: 'Sundaram Medical Foundation Madurai', hospital_location: 'Anna Nagar, Madurai - 625020', specialty: 'General Medicine', years_of_experience: 12 },
    { email: 'doctor17@mediconnect.com', hospital_name: 'Government Hospital Krishnankoil', hospital_location: 'Main Road, Krishnankoil, Virudhunagar District', specialty: 'Emergency', years_of_experience: 14 },
    { email: 'doctor18@mediconnect.com', hospital_name: 'Meenakshi Hospital Krishnankoil', hospital_location: 'Srivilliputhur Road, Krishnankoil - 626190', specialty: 'Ophthalmology', years_of_experience: 8 },
    { email: 'doctor19@mediconnect.com', hospital_name: 'Aravind Eye Hospital Madurai', hospital_location: 'Anna Nagar, Madurai - 625020', specialty: 'ENT', years_of_experience: 15 },
    { email: 'doctor20@mediconnect.com', hospital_name: 'Aachi Hospital Krishnankoil', hospital_location: 'Virudhunagar Road, Krishnankoil', specialty: 'General Medicine', years_of_experience: 7 },
];

async function syncDoctorHospitalMapping() {
    console.log('Starting doctor-hospital mapping sync for 20 nearby hospitals...');

    const { data: doctors, error: fetchError } = await supabase
        .from('doctors')
        .select('id,email,first_name,surname,hospital_name,hospital_location,approval_status')
        .in('email', doctorHospitalMapping.map((item) => item.email));

    if (fetchError) {
        console.error('Failed to fetch doctors:', fetchError.message);
        process.exit(1);
    }

    const doctorByEmail = new Map((doctors || []).map((doctor) => [doctor.email, doctor]));
    const missing = doctorHospitalMapping.filter((item) => !doctorByEmail.has(item.email)).map((item) => item.email);

    if (missing.length > 0) {
        console.warn('Missing doctor accounts for mapping:', missing.join(', '));
    }

    let successCount = 0;

    for (const mapping of doctorHospitalMapping) {
        const doctor = doctorByEmail.get(mapping.email);
        if (!doctor) continue;

        const payload = {
            hospital_name: mapping.hospital_name,
            hospital_location: mapping.hospital_location,
            specialty: mapping.specialty,
            years_of_experience: mapping.years_of_experience,
            approval_status: 'approved',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from('doctors')
            .update(payload)
            .eq('id', doctor.id);

        if (updateError) {
            console.error(`Failed to update ${mapping.email}:`, updateError.message);
            continue;
        }

        successCount += 1;
        console.log(`Updated ${mapping.email} -> ${mapping.hospital_name}`);
    }

    console.log(`Mapping sync complete. Updated ${successCount} doctors.`);
}

syncDoctorHospitalMapping().catch((error) => {
    console.error('Unexpected sync failure:', error.message);
    process.exit(1);
});
