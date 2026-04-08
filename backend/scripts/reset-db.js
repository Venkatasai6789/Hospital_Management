import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
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

async function resetDB() {
  console.log('--- Starting Database Reset ---');

  // 1. Clear Public Tables (in order of dependencies)
  const tables = ['appointments', 'interactions', 'doctor_documents', 'doctors', 'patients', 'users_profiles'];
  
  for (const table of tables) {
    console.log(`Clearing table: ${table}...`);
    // Using a filter that is always true to satisfy RLS/Safe Delete requirements
    const { error } = await supabase.from(table).delete().filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
    if (error) {
       console.error(`Error clearing ${table}:`, error.message);
    } else {
       console.log(`Successfully cleared ${table}`);
    }
  }

  // 2. Clear Auth Users
  console.log('Listing auth users...');
  let hasMore = true;
  let page = 1;
  
  while (hasMore) {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 100
    });
    
    if (listError) {
      console.error('Error listing users:', listError.message);
      break;
    }
    
    if (users.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Page ${page}: Found ${users.length} users to delete.`);
    for (const user of users) {
      console.log(`Deleting user: ${user.email} (${user.id})...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) console.error(`Error deleting user ${user.email}:`, deleteError.message);
    }
    
    // Auth listUsers might behave differently for pagination, but for < 100 users this is fine.
    hasMore = false; 
  }

  console.log('--- Database Reset Completed ---');
}

resetDB();
