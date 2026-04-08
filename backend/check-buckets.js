import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkBuckets() {
    console.log('Checking all storage buckets...\n');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Found buckets:');
    buckets.forEach(bucket => {
        console.log(`  - Name: "${bucket.name}" (Public: ${bucket.public})`);
    });

    console.log('\nLooking for: "doctor-documents"');
    const found = buckets.find(b => b.name === 'doctor-documents');
    console.log(found ? '✅ Found exact match!' : '❌ No exact match found');

    // Try case-insensitive
    const foundCaseInsensitive = buckets.find(b => b.name.toLowerCase() === 'doctor-documents');
    if (foundCaseInsensitive && !found) {
        console.log(`⚠️  Found case-insensitive match: "${foundCaseInsensitive.name}"`);
    }
}

checkBuckets();
