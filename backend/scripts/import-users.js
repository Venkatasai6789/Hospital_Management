import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importUsers() {
  const usersPath = path.join(__dirname, '../../migration_users.json');
  if (!fs.existsSync(usersPath)) {
    console.error('migration_users.json not found');
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  console.log(`Found ${users.length} users to import.`);

  for (const user of users) {
    console.log(`Importing user: ${user.email} (${user.id})`);
    
    // Check if user exists
    const { data: existingUser } = await supabase.auth.admin.getUserById(user.id);
    
    if (existingUser?.user) {
      console.log(`User ${user.email} already exists. Skipping.`);
      continue;
    }

    // Create user with administrative privileges
    // We use the same ID to maintain relational integrity
    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      email_confirm: true,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
      password: 'TemporaryPassword123!', // Users will need to reset this
    });

    if (error) {
      console.error(`Error importing ${user.email}:`, error.message);
    } else {
      console.log(`Successfully imported ${user.email}`);
    }
  }

  console.log('User import completed.');
}

importUsers();
