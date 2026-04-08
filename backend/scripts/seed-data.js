import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const specialties = [
  'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Psychiatry', 
  'Orthopedics', 'Ophthalmology', 'Gastroenterology', 'Endocrinology', 'Urology'
];

const hospitals = [
  'City General Hospital', 'St. Mary\'s Medical Center', 'Unity Health Institute', 
  'Grace Memorial Clinic', 'Pioneer Specialty Hospital'
];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
  console.log('--- Starting Data Seeding ---');
  const credentials = [];

  // Reset before seeding to avoid duplicates or orphans
  console.log('Resetting current users...');
  const { data: { users: subseUsers } } = await supabase.auth.admin.listUsers();
  for (const u of subseUsers) {
    await supabase.auth.admin.deleteUser(u.id);
  }

  // 1. Create Admin
  console.log('Creating Admin...');
  const adminEmail = 'admin@mediconnect.com';
  const adminPassword = 'AdminPassword2026!';
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: 'System Admin' }
  });

  if (adminAuthError) {
    console.error('Error creating admin auth:', adminAuthError.message);
  } else {
    const { error: adminProfileError } = await supabase.from('users_profiles').insert({
      id: adminAuth.user.id,
      full_name: 'System Admin',
      email: adminEmail,
      role: 'admin'
    });
    if (adminProfileError) console.error('Error creating admin profile:', adminProfileError.message);
    credentials.push({ role: 'admin', email: adminEmail, password: adminPassword });
  }

  // 2. Create 20 Doctors
  console.log('Creating 20 Doctors...');
  for (let i = 1; i <= 20; i++) {
    const fName = getRandomItem(firstNames);
    const sName = getRandomItem(lastNames);
    const fullName = `Dr. ${fName} ${sName}`;
    const email = `doctor${i}@mediconnect.com`;
    const password = `DoctorPass${i}!2026`;
    const specialty = specialties[(i - 1) % specialties.length];
    const hospital = getRandomItem(hospitals);

    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error(`Error creating doctor ${i} auth:`, authError.message);
      continue;
    }

    const userId = auth.user.id;
    await supabase.from('users_profiles').insert({
      id: userId,
      full_name: fullName,
      email: email,
      role: 'doctor'
    });

    const { error: docError } = await supabase.from('doctors').insert({
      user_id: userId,
      first_name: fName,
      surname: sName,
      age: 30 + (i % 30),
      gender: (i % 2 === 0 ? 'female' : 'male'),
      mobile_number: `555-01${i.toString().padStart(2, '0')}`,
      email: email,
      hospital_name: hospital,
      specialty: specialty,
      years_of_experience: 5 + (i % 15),
      hospital_location: 'Main St, Medical District',
      professional_bio: `Expert in ${specialty} with a focus on patient-centered care.`,
      approval_status: 'approved',
      address: { "city": "Springfield", "street": "Health Boulevard", "zip": "12345" }
    });

    if (docError) {
      console.error(`Error inserting doctor ${i} record:`, docError.message);
    }

    credentials.push({ role: 'doctor', email: email, password: password, name: fullName, specialty: specialty });
  }

  // 3. Create 5 Patients
  console.log('Creating 5 Patients...');
  for (let i = 1; i <= 5; i++) {
    const fName = getRandomItem(firstNames);
    const sName = getRandomItem(lastNames);
    const fullName = `${fName} ${sName}`;
    const email = `patient${i}@mediconnect.com`;
    const password = `PatientPass${i}!2026`;

    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error(`Error creating patient ${i} auth:`, authError.message);
      continue;
    }

    const userId = auth.user.id;
    await supabase.from('users_profiles').insert({
      id: userId,
      full_name: fullName,
      email: email,
      role: 'patient'
    });

    const { error: patError } = await supabase.from('patients').insert({
      user_id: userId,
      first_name: fName,
      surname: sName,
      age: 20 + (i * 10),
      gender: (i % 2 === 0 ? 'female' : 'male'),
      mobile_number: `555-02${i}`,
      email: email,
      address: { "city": "Riverdale", "street": "Patient Circle", "zip": "54321" }
    });

    if (patError) {
      console.error(`Error inserting patient ${i} record:`, patError.message);
    }

    credentials.push({ role: 'patient', email: email, password: password, name: fullName });
  }

  // 4. Generate Credentials Document
  console.log('Generating USER_CREDENTIALS.md...');
  let md = '# MediConnect User Credentials\n\nGenerated on ' + new Date().toLocaleString() + '\n\n';
  
  md += '## Admin Account\n';
  const admin = credentials.find(c => c.role === 'admin');
  if (admin) {
    md += `- **Email**: \`${admin.email}\`\n`;
    md += `- **Password**: \`${admin.password}\`\n\n`;
  }

  md += '## Doctors (20)\n';
  md += '| Name | Specialty | Email | Password |\n';
  md += '| :--- | :--- | :--- | :--- |\n';
  credentials.filter(c => c.role === 'doctor').forEach(doc => {
    md += `| ${doc.name} | ${doc.specialty} | ${doc.email} | ${doc.password} |\n`;
  });
  md += '\n';

  md += '## Patients (5)\n';
  md += '| Name | Email | Password |\n';
  md += '| :--- | :--- | :--- |\n';
  credentials.filter(c => c.role === 'patient').forEach(p => {
    md += `| ${p.name} | ${p.email} | ${p.password} |\n`;
  });

  fs.writeFileSync('./USER_CREDENTIALS.md', md);
  console.log('--- Data Seeding Completed ---');
}

seedData().catch(err => {
  console.error('Fatal error during seeding:', err);
});
