import request from 'supertest';
import app from './server.js';
import { supabase, generateTestUser, cleanupTestUser } from './tests/test-utils.js';
import assert from 'assert';

async function runVerification() {
    console.log('🚀 Starting Verification Script...');
    const testPatient = generateTestUser('patient');
    let patientId = null;

    try {
        console.log(`Step 1: Signing up patient ${testPatient.email}...`);
        const signupRes = await request(app)
            .post('/api/auth/signup')
            .send({
                email: testPatient.email,
                password: testPatient.password,
                userData: testPatient.userData
            });

        assert.strictEqual(signupRes.status, 201, `Signup failed: ${JSON.stringify(signupRes.body)}`);
        console.log('✅ Signup successful');
        patientId = signupRes.body.user.id;

        console.log('Step 2: Signing in...');
        const signinRes = await request(app)
            .post('/api/auth/signin')
            .send({
                emailOrMobile: testPatient.email,
                password: testPatient.password
            });

        assert.strictEqual(signinRes.status, 200, `Signin failed: ${JSON.stringify(signinRes.body)}`);
        assert.strictEqual(signinRes.body.profile.role, 'patient');
        console.log('✅ Signin successful');

        console.log('Step 3: Verifying Supabase profile...');
        const { data: profile, error } = await supabase
            .from('users_profiles')
            .select('*')
            .eq('id', patientId)
            .single();
        
        assert.ifError(error);
        assert.strictEqual(profile.role, 'patient');
        console.log('✅ Database verification successful');

        console.log('🎉 ALL VERRFICATIONS PASSED!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        if (patientId) {
            console.log('🧹 Cleaning up...');
            await cleanupTestUser(patientId);
        }
        process.exit(0);
    }
}

runVerification();
