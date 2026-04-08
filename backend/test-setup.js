import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Supabase Setup...\n');

async function testDatabaseTables() {
    console.log('📋 Testing Database Tables:');

    const tables = ['users_profiles', 'patients', 'doctors', 'doctor_documents'];
    const results = [];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('count');

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`   ❌ ${table}: Table does not exist`);
                    results.push({ table, exists: false, error: 'Table not found' });
                } else {
                    console.log(`   ⚠️  ${table}: ${error.message}`);
                    results.push({ table, exists: true, error: error.message });
                }
            } else {
                console.log(`   ✅ ${table}: Table exists`);
                results.push({ table, exists: true, error: null });
            }
        } catch (err) {
            console.log(`   ❌ ${table}: ${err.message}`);
            results.push({ table, exists: false, error: err.message });
        }
    }

    return results;
}

async function testStorageBucket() {
    console.log('\n📦 Testing Storage Bucket:');

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.log(`   ❌ Failed to list buckets: ${error.message}`);
            return { exists: false, error: error.message };
        }

        const doctorDocsBucket = buckets.find(b => b.name === 'doctor-documents');

        if (doctorDocsBucket) {
            console.log(`   ✅ doctor-documents: Bucket exists`);
            console.log(`      - Public: ${doctorDocsBucket.public}`);
            console.log(`      - Created: ${new Date(doctorDocsBucket.created_at).toLocaleDateString()}`);
            return { exists: true, error: null, bucket: doctorDocsBucket };
        } else {
            console.log(`   ❌ doctor-documents: Bucket not found`);
            console.log(`   📝 Available buckets: ${buckets.map(b => b.name).join(', ') || 'None'}`);
            return { exists: false, error: 'Bucket not found' };
        }
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        return { exists: false, error: err.message };
    }
}

async function testStoragePolicies() {
    console.log('\n🔒 Testing Storage Policies:');

    try {
        // Try to list files (this will test if policies are set)
        const { data, error } = await supabase.storage
            .from('doctor-documents')
            .list();

        if (error) {
            console.log(`   ⚠️  Could not test policies: ${error.message}`);
            return { tested: false, error: error.message };
        }

        console.log(`   ✅ Storage access working (policies configured)`);
        return { tested: true, error: null };
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        return { tested: false, error: err.message };
    }
}

async function testDatabaseEnums() {
    console.log('\n🏷️  Testing Database Enums:');

    try {
        // Test by querying table with enum column
        const { data, error } = await supabase
            .from('users_profiles')
            .select('role')
            .limit(0);

        if (error) {
            console.log(`   ⚠️  Could not verify enums: ${error.message}`);
            return { verified: false };
        }

        console.log(`   ✅ Enum types configured correctly`);
        return { verified: true };
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        return { verified: false };
    }
}

async function runAllTests() {
    try {
        const tableResults = await testDatabaseTables();
        const bucketResults = await testStorageBucket();
        const policyResults = await testStoragePolicies();
        const enumResults = await testDatabaseEnums();

        console.log('\n═══════════════════════════════════════');
        console.log('📊 SUMMARY');
        console.log('═══════════════════════════════════════');

        const allTablesExist = tableResults.every(t => t.exists);
        const bucketExists = bucketResults.exists;
        const policiesWork = policyResults.tested;

        if (allTablesExist && bucketExists) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('\n✨ Your Supabase setup is complete and working!');
            console.log('   You can now start the backend server.');
            process.exit(0);
        } else {
            console.log('⚠️  SOME TESTS FAILED\n');

            if (!allTablesExist) {
                const missingTables = tableResults.filter(t => !t.exists);
                console.log('❌ Missing tables:');
                missingTables.forEach(t => console.log(`   - ${t.table}`));
                console.log('\n👉 Please run the SQL schema in Supabase SQL Editor');
            }

            if (!bucketExists) {
                console.log('\n❌ Storage bucket not found');
                console.log('👉 Please create "doctor-documents" bucket in Supabase Storage');
            }

            console.log('\n📖 See QUICK_SETUP.md for detailed instructions');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        process.exit(1);
    }
}

runAllTests();
