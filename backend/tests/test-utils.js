import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export const generateTestUser = (role = 'patient') => {
    const timestamp = Date.now();
    const email = `test.${role}.${timestamp}@mediconnect.com`;
    const password = 'TestPass123!';
    
    return {
        email,
        password,
        userData: {
            role,
            firstName: 'Test',
            surname: role.charAt(0).toUpperCase() + role.slice(1),
            age: 30,
            gender: 'Other',
            mobileNumber: String(timestamp).slice(-10),
            address: '123 Test St, Test City'
        }
    };
};

export const cleanupTestUser = async (userId) => {
    if (!userId) return;
    
    // Delete from auth.users (requires service role key)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) console.error(`Error deleting test user ${userId}:`, error.message);
    
    // Note: Triggers should handle profile cleanup, but we can be explicit if needed
};
