
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDoctors() {
    console.log('🔍 Checking for doctors...');
    const { count, error } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved');

    if (error) {
        console.error('❌ Error checking doctors:', error.message);
    } else {
        console.log(`✅ Found ${count} approved doctors.`);
    }
}

checkDoctors();
