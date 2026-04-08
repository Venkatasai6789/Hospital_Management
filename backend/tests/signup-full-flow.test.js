import request from 'supertest';
import app from '../server.js';
import { supabase, generateTestUser, cleanupTestUser } from './test-utils.js';

describe('Signup Full Flow Integration Tests', () => {
    let testPatient = generateTestUser('patient');
    let testDoctor = generateTestUser('doctor');
    let patientId = null;
    let doctorId = null;

    afterAll(async () => {
        console.log('🧹 Cleaning up test users...');
        await cleanupTestUser(patientId);
        await cleanupTestUser(doctorId);
    });

    describe('Patient Signup Workflow', () => {
        test('Should successfully register a new patient', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testPatient.email,
                    password: testPatient.password,
                    userData: testPatient.userData
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body.user).toBeDefined();
            patientId = response.body.user.id;

            // Verify users_profiles entry
            const { data: profile, error: profileErr } = await supabase
                .from('users_profiles')
                .select('*')
                .eq('id', patientId)
                .single();

            expect(profileErr).toBeNull();
            expect(profile.role).toBe('patient');
            expect(profile.email).toBe(testPatient.email);

            // Verify patients entry
            const { data: patient, error: patientErr } = await supabase
                .from('patients')
                .select('*')
                .eq('user_id', patientId)
                .single();

            expect(patientErr).toBeNull();
            expect(patient.first_name).toBe(testPatient.userData.firstName);
        });

        test('Should successfully sign in as the new patient', async () => {
            const response = await request(app)
                .post('/api/auth/signin')
                .send({
                    emailOrMobile: testPatient.email,
                    password: testPatient.password
                });

            expect(response.status).toBe(200);
            expect(response.body.profile.role).toBe('patient');
            expect(response.body.session).toBeDefined();
        });
    });

    describe('Doctor Registration Workflow', () => {
        test('Should successfully register a new doctor with documents', async () => {
            // Doctors use /register-doctor endpoint which is multipart/form-data
            const response = await request(app)
                .post('/api/auth/register-doctor')
                .field('email', testDoctor.email)
                .field('password', testDoctor.password)
                .field('firstName', testDoctor.userData.firstName)
                .field('surname', testDoctor.userData.surname)
                .field('mobileNumber', testDoctor.userData.mobileNumber)
                .field('specialization', 'Cardiology')
                .field('address', testDoctor.userData.address)
                .field('experience', '10')
                .attach('medicalLicense', Buffer.from('dummy license content'), 'license.pdf')
                .attach('degree', Buffer.from('dummy degree content'), 'degree.pdf');

            // console.log('Doctor Response:', response.body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Doctor registration successful');
            doctorId = response.body.user.id;

            // Verify users_profiles entry
            const { data: profile, error: profileErr } = await supabase
                .from('users_profiles')
                .select('*')
                .eq('id', doctorId)
                .single();

            expect(profileErr).toBeNull();
            expect(profile.role).toBe('doctor');

            // Verify doctors entry
            const { data: doctor, error: doctorErr } = await supabase
                .from('doctors')
                .select('*')
                .eq('user_id', doctorId)
                .single();

            expect(doctorErr).toBeNull();
            expect(doctor.specialization).toBe('Cardiology');
            expect(doctor.verification_status).toBe('PENDING');
        });

        test('Should successfully sign in as the new doctor', async () => {
            const response = await request(app)
                .post('/api/auth/signin')
                .send({
                    emailOrMobile: testDoctor.email,
                    password: testDoctor.password
                });

            expect(response.status).toBe(200);
            expect(response.body.profile.role).toBe('doctor');
            expect(response.body.verificationStatus).toBe('PENDING');
        });
    });
});
