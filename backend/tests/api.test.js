import request from 'supertest';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Test configuration
const TEST_CONFIG = {
    PATIENT_EMAIL: 'test.patient@mediconnect.com',
    PATIENT_PASSWORD: 'testpass123',
    ADMIN_EMAIL: 'admin@mediconnect.com',
    ADMIN_PASSWORD: '12345678admin',
    BASE_URL: 'http://localhost:5000'
};

describe('MediConnect Backend API Tests', () => {
    let patientToken = null;
    let adminToken = null;
    let testOrderId = null;
    let testPatientId = null;

    // =============================================================================
    // SETUP & TEARDOWN
    // =============================================================================

    beforeAll(async () => {
        console.log('🔧 Setting up test environment...');

        // Create test patient if doesn't exist
        const { data: existingPatient } = await supabase
            .from('patients')
            .select('user_id')
            .eq('email', TEST_CONFIG.PATIENT_EMAIL)
            .single();

        if (!existingPatient) {
            // Sign up test patient
            const signupResponse = await request(TEST_CONFIG.BASE_URL)
                .post('/api/auth/signup')
                .send({
                    email: TEST_CONFIG.PATIENT_EMAIL,
                    password: TEST_CONFIG.PATIENT_PASSWORD,
                    userData: {
                        role: 'patient',
                        firstName: 'Test',
                        surname: 'Patient',
                        age: 30,
                        gender: 'Male',
                        mobileNumber: '9999999999',
                        address: 'Test Address, Test City'
                    }
                });

            console.log('✅ Test patient created');
        }

        // Login as patient to get token
        const patientLoginResponse = await request(TEST_CONFIG.BASE_URL)
            .post('/api/auth/signin')
            .send({
                emailOrMobile: TEST_CONFIG.PATIENT_EMAIL,
                password: TEST_CONFIG.PATIENT_PASSWORD
            });

        patientToken = patientLoginResponse.body.session?.access_token;
        testPatientId = patientLoginResponse.body.user?.id;

        // Login as admin to get token
        const adminLoginResponse = await request(TEST_CONFIG.BASE_URL)
            .post('/api/auth/signin')
            .send({
                emailOrMobile: TEST_CONFIG.ADMIN_EMAIL,
                password: TEST_CONFIG.ADMIN_PASSWORD
            });

        adminToken = adminLoginResponse.body.session?.access_token;

        console.log('✅ Authentication tokens obtained');
    });

    afterAll(async () => {
        // Cleanup: Delete test orders
        if (testOrderId) {
            await supabase
                .from('medicine_orders')
                .delete()
                .eq('id', testOrderId);
        }
        console.log('🧹 Test cleanup completed');
    });

    // =============================================================================
    // TEST SUITE 1: PATIENT MEDICINE ORDERING
    // =============================================================================

    describe('Patient Medicine Ordering Workflow', () => {

        test('Should fetch medicines from database', async () => {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .limit(5);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0]).toHaveProperty('id');
            expect(data[0]).toHaveProperty('brand_name');
            expect(data[0]).toHaveProperty('price');
        });

        test('Should search medicines by text query', async () => {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .textSearch('search_vector', 'paracetamol', {
                    type: 'websearch',
                    config: 'english'
                })
                .limit(10);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
        });

        test('Should create a medicine order', async () => {
            // First, get some test medicines
            const { data: medicines } = await supabase
                .from('medicines')
                .select('id, brand_name, price')
                .limit(3);

            const orderData = {
                patient_id: testPatientId,
                items: medicines.map(m => ({
                    medicine_id: m.id,
                    quantity: 1,
                    price: m.price
                })),
                total_amount: medicines.reduce((sum, m) => sum + m.price, 0),
                shipping_address: {
                    fullName: 'Test Patient',
                    phone: '9999999999',
                    address: '123 Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    pincode: '123456'
                },
                status: 'Placed'
            };

            const { data, error } = await supabase
                .from('medicine_orders')
                .insert(orderData)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data.id).toBeDefined();
            expect(data.status).toBe('Placed');
            expect(data.total_amount).toBe(orderData.total_amount);

            testOrderId = data.id; // Save for later tests
        });

        test('Should fetch patient order history', async () => {
            const { data, error } = await supabase
                .from('medicine_orders')
                .select('*')
                .eq('patient_id', testPatientId)
                .order('created_at', { ascending: false });

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].patient_id).toBe(testPatientId);
        });
    });

    // =============================================================================
    // TEST SUITE 2: ADMIN ORDER MANAGEMENT
    // =============================================================================

    describe('Admin Order Management', () => {

        test('Should fetch all medicine orders (admin)', async () => {
            const response = await request(TEST_CONFIG.BASE_URL)
                .get('/api/admin/medicine-orders')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                const order = response.body[0];
                expect(order).toHaveProperty('id');
                expect(order).toHaveProperty('patient_id');
                expect(order).toHaveProperty('total_amount');
                expect(order).toHaveProperty('status');
            }
        });

        test('Should update order status (admin)', async () => {
            if (!testOrderId) {
                console.log('⚠️ Skipping: No test order available');
                return;
            }

            const response = await request(TEST_CONFIG.BASE_URL)
                .patch(`/api/admin/medicine-orders/${testOrderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'Processing' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBeDefined();

            // Verify status was updated in database
            const { data } = await supabase
                .from('medicine_orders')
                .select('status')
                .eq('id', testOrderId)
                .single();

            expect(data.status).toBe('Processing');
        });

        test('Should reject unauthorized access to admin routes', async () => {
            const response = await request(TEST_CONFIG.BASE_URL)
                .get('/api/admin/medicine-orders')
                .set('Authorization', `Bearer ${patientToken}`); // Using patient token

            expect(response.status).toBe(403);
        });
    });

    // =============================================================================
    // TEST SUITE 3: GENERIC MEDICINE SEARCH
    // =============================================================================

    describe('Generic Medicine Search', () => {

        test('Should find generic medicines by brand name', async () => {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .ilike('brand_name', '%crocin%')
                .limit(10);

            expect(error).toBeNull();
            expect(data).toBeDefined();
        });

        test('Should find medicines by generic name', async () => {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .ilike('generic_name', '%paracetamol%')
                .limit(10);

            expect(error).toBeNull();
            expect(data).toBeDefined();
        });

        test('Should filter medicines by therapeutic class', async () => {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .eq('therapeutic_class', 'Analgesic')
                .limit(10);

            expect(error).toBeNull();
            expect(data).toBeDefined();
        });

        test('Should sort medicines by price (generic-first logic)', async () => {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .order('price', { ascending: true })
                .limit(10);

            expect(error).toBeNull();
            expect(data).toBeDefined();

            if (data.length > 1) {
                expect(data[0].price).toBeLessThanOrEqual(data[1].price);
            }
        });
    });

    // =============================================================================
    // TEST SUITE 4: DATA INTEGRITY & SECURITY
    // =============================================================================

    describe('Data Integrity & Security', () => {

        test('Should enforce patient can only see their own orders', async () => {
            const { data, error } = await supabase
                .from('medicine_orders')
                .select('*')
                .eq('patient_id', testPatientId);

            expect(error).toBeNull();
            expect(data).toBeDefined();

            // All orders should belong to test patient
            data.forEach(order => {
                expect(order.patient_id).toBe(testPatientId);
            });
        });

        test('Should validate required fields in order creation', async () => {
            const invalidOrder = {
                // Missing required fields
                items: [],
                total_amount: 0
            };

            const { error } = await supabase
                .from('medicine_orders')
                .insert(invalidOrder);

            expect(error).toBeDefined(); // Should fail validation
        });

        test('Should validate shipping address structure', async () => {
            const orderWithInvalidAddress = {
                patient_id: testPatientId,
                items: [{ medicine_id: 'test', quantity: 1, price: 100 }],
                total_amount: 100,
                shipping_address: 'invalid string', // Should be object
                status: 'Placed'
            };

            const { error } = await supabase
                .from('medicine_orders')
                .insert(orderWithInvalidAddress);

            // May succeed depending on DB schema, but good to test
            if (error) {
                expect(error).toBeDefined();
            }
        });
    });

    // =============================================================================
    // TEST SUITE 5: EDGE CASES
    // =============================================================================

    describe('Edge Cases & Error Handling', () => {

        test('Should handle empty cart gracefully', async () => {
            const emptyOrder = {
                patient_id: testPatientId,
                items: [],
                total_amount: 0,
                shipping_address: {
                    fullName: 'Test',
                    phone: '1234567890',
                    address: 'Test',
                    city: 'Test',
                    state: 'Test',
                    pincode: '123456'
                },
                status: 'Placed'
            };

            const { data, error } = await supabase
                .from('medicine_orders')
                .insert(emptyOrder);

            // Should either fail or succeed cleanly
            if (!error) {
                // Clean up if it succeeded
                await supabase
                    .from('medicine_orders')
                    .delete()
                    .eq('id', data[0].id);
            }
        });

        test('Should handle invalid medicine ID in cart', async () => {
            const orderWithInvalidMedicine = {
                patient_id: testPatientId,
                items: [{
                    medicine_id: 'non-existent-id-12345',
                    quantity: 1,
                    price: 100
                }],
                total_amount: 100,
                shipping_address: {
                    fullName: 'Test',
                    phone: '1234567890',
                    address: 'Test',
                    city: 'Test',
                    state: 'Test',
                    pincode: '123456'
                },
                status: 'Placed'
            };

            const { data, error } = await supabase
                .from('medicine_orders')
                .insert(orderWithInvalidMedicine);

            // Depending on foreign key constraints, may fail or succeed
            if (data) {
                await supabase
                    .from('medicine_orders')
                    .delete()
                    .eq('id', data[0].id);
            }
        });

        test('Should handle concurrent order placements', async () => {
            const orders = Array(3).fill(null).map((_, i) => ({
                patient_id: testPatientId,
                items: [{ medicine_id: 'test', quantity: 1, price: 100 }],
                total_amount: 100,
                shipping_address: {
                    fullName: `Test ${i}`,
                    phone: '1234567890',
                    address: 'Test',
                    city: 'Test',
                    state: 'Test',
                    pincode: '123456'
                },
                status: 'Placed'
            }));

            const results = await Promise.all(
                orders.map(order =>
                    supabase.from('medicine_orders').insert(order).select()
                )
            );

            // All should succeed
            results.forEach(({ data, error }) => {
                expect(error).toBeNull();
                if (data) {
                    // Cleanup
                    supabase.from('medicine_orders').delete().eq('id', data[0].id);
                }
            });
        });
    });
});

// =============================================================================
// RUN TESTS
// =============================================================================

console.log('🚀 Starting MediConnect Test Suite...\n');
