
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
    console.log('🔍 Checking for appointments table...');
    const { data, error } = await supabase.from('appointments').select('count').limit(1);

    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log('❌ Table "appointments" does NOT exist.');
            process.exit(1);
        } else {
            console.error('⚠️ Error checking table:', error.message);
            // If it's another error, we assume it might exist but we assume failure to be safe
            process.exit(1);
        }
    } else {
        console.log('✅ Table "appointments" exists!');
        process.exit(0);
    }
}

checkTables();
