import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handling __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const baseUrl = 'http://localhost:5000/api';
    const email = `test.doc.${Date.now()}@test.com`;
    const password = 'password123';

    console.log(`1. Signing up as ${email}...`);

    try {
        const signupRes = await fetch(`${baseUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                userData: {
                    role: 'doctor',
                    firstName: 'Test',
                    surname: 'Script',
                    age: 30,
                    gender: 'male',
                    mobileNumber: `98${Date.now().toString().slice(-8)}`,
                    address: { mode: 'manual' },
                    hospitalName: 'Script Hosp',
                    specialty: 'Testing',
                    yearsOfExperience: 5,
                    hospitalLocation: 'Test City',
                    professionalBio: 'Script Bio'
                }
            })
        });

        const signupText = await signupRes.text();
        if (!signupRes.ok) {
            throw new Error(`Signup failed: ${signupRes.status} ${signupText}`);
        }

        const signupData = JSON.parse(signupText);
        const userId = signupData.user.id;
        console.log(`   Success. User ID: ${userId}`);

        console.log('2. Uploading document...');

        // Load file
        const filePath = path.resolve(__dirname, '../test_upload.png');
        console.log(`   Reading file from: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Test file not found at ${filePath}`);
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });

        const formData = new FormData();
        formData.append('documents', fileBlob, 'test_upload.png');
        formData.append('documentTypes', JSON.stringify(['identity_proof']));

        const uploadRes = await fetch(`${baseUrl}/doctors/${userId}/documents`, {
            method: 'POST',
            body: formData
        });

        const uploadText = await uploadRes.text();
        if (!uploadRes.ok) {
            throw new Error(`Upload failed: ${uploadRes.status} ${uploadText}`);
        }

        const uploadData = JSON.parse(uploadText);
        console.log('   Success. Response:', JSON.stringify(uploadData, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
