
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
    console.log('Checking storage buckets...');
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const bucketName = 'doctor-documents';
    const exists = data.find(b => b.name === bucketName);

    if (exists) {
        console.log(`✅ Bucket '${bucketName}' exists.`);
        console.log('Is Public:', exists.public);
    } else {
        console.log(`❌ Bucket '${bucketName}' DOES NOT EXIST.`);
        console.log('Attempts to create it via code are restricted properly to Dashboard usually, but trying...');

        // Attempt create (might fail with Anon key)
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
            fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
            console.error('Failed to create bucket:', createError);
            console.log('PLEASE CREATE BUCKET MANUALY IN DASHBOARD: "doctor-documents" (Public)');
        } else {
            console.log('✅ Created bucket successfully!');
        }
    }
}

checkBucket();
