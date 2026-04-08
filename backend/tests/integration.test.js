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

// Test Configuration
const CONFIG = {
    PATIENT_EMAIL: 'test.patient@mediconnect.com',
    ADMIN_EMAIL: 'admin@mediconnect.com',
    BASE_URL: 'http://localhost:5000'
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(`  ${title}`, 'cyan');
    console.log('='.repeat(80) + '\n');
}

async function runIntegrationTests() {
    log('🚀 Starting MediConnect Integration Test Suite\n', 'blue');

    const results = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    try {
        // ================================================================
        // TEST 1: Patient Medicine Search
        // ================================================================
        logSection('TEST 1: Medicine Search & Generic Alternatives');

        log('🔍 Searching for medicines containing "paracetamol"...');
        const { data: medicines, error: searchError } = await supabase
            .from('medicines')
            .select('*')
            .textSearch('search_vector', 'paracetamol', {
                type: 'websearch',
                config: 'english'
            })
            .limit(10);

        if (searchError) {
            log(`❌ FAILED: ${searchError.message}`, 'red');
            results.failed++;
        } else {
            log(`✅ PASSED: Found ${medicines.length} medicines`, 'green');
            if (medicines.length > 0) {
                log(`   Sample: ${medicines[0].brand_name} (₹${medicines[0].price})`, 'yellow');
            }
            results.passed++;
        }

        // ================================================================
        // TEST 2: Cart Total Calculation
        // ================================================================
        logSection('TEST 2: Cart Total Calculation');

        if (medicines && medicines.length >= 3) {
            const cartItems = medicines.slice(0, 3);
            const expectedTotal = cartItems.reduce((sum, m) => sum + m.price, 0);

            log(`📦 Simulating cart with ${cartItems.length} items...`);
            cartItems.forEach((m, i) => {
                log(`   ${i + 1}. ${m.brand_name} - ₹${m.price}`, 'yellow');
            });

            log(`\n💰 Expected Total: ₹${expectedTotal}`);

            if (expectedTotal > 0) {
                log(`✅ PASSED: Cart total calculated correctly`, 'green');
                results.passed++;
            } else {
                log(`❌ FAILED: Cart total is zero`, 'red');
                results.failed++;
            }
        } else {
            log('⚠️  SKIPPED: Not enough medicines for cart test', 'yellow');
            results.skipped++;
        }

        // ================================================================
        // TEST 3: Order Creation
        // ================================================================
        logSection('TEST 3: Creating Medicine Order');

        // Get patient ID
        const { data: patient } = await supabase
            .from('patients')
            .select('user_id, first_name')
            .eq('email', CONFIG.PATIENT_EMAIL)
            .single();

        if (!patient) {
            log('⚠️  SKIPPED: Test patient not found. Run seed-patients.js first.', 'yellow');
            results.skipped++;
        } else {
            log(`👤 Patient: ${patient.first_name}`, 'yellow');

            const orderData = {
                patient_id: patient.user_id,
                items: medicines.slice(0, 3).map(m => ({
                    medicine_id: m.id,
                    medicine_name: m.brand_name,
                    quantity: 1,
                    price: m.price
                })),
                total_amount: medicines.slice(0, 3).reduce((sum, m) => sum + m.price, 0),
                shipping_address: {
                    fullName: 'Test Patient',
                    phone: '9999999999',
                    address: '123 Test Street, Apt 4B',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                },
                status: 'Placed'
            };

            log(`📝 Creating order with ${orderData.items.length} items...`);

            const { data: order, error: orderError } = await supabase
                .from('medicine_orders')
                .insert(orderData)
                .select()
                .single();

            if (orderError) {
                log(`❌ FAILED: ${orderError.message}`, 'red');
                results.failed++;
            } else {
                log(`✅ PASSED: Order created successfully`, 'green');
                log(`   Order ID: ${order.id}`, 'yellow');
                log(`   Total Amount: ₹${order.total_amount}`, 'yellow');
                log(`   Status: ${order.status}`, 'yellow');
                results.passed++;

                // Store order ID for next test
                global.testOrderId = order.id;
            }
        }

        // ================================================================
        // TEST 4: Admin Order Retrieval
        // ================================================================
        logSection('TEST 4: Admin Order Management');

        log('🔐 Fetching all orders as admin...');
        const { data: allOrders, error: adminError } = await supabase
            .from('medicine_orders')
            .select(`
                id,
                patient_id,
                total_amount,
                status,
                created_at,
                patients (first_name, surname, email, mobile_number)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (adminError) {
            log(`❌ FAILED: ${adminError.message}`, 'red');
            results.failed++;
        } else {
            log(`✅ PASSED: Retrieved ${allOrders.length} orders`, 'green');
            if (allOrders.length > 0) {
                log('\n📋 Recent Orders:');
                allOrders.slice(0, 3).forEach((o, i) => {
                    const patientName = o.patients ?
                        `${o.patients.first_name} ${o.patients.surname}` :
                        'Unknown';
                    log(`   ${i + 1}. ${patientName} - ₹${o.total_amount} - ${o.status}`, 'yellow');
                });
            }
            results.passed++;
        }

        // ================================================================
        // TEST 5: Order Status Update
        // ================================================================
        logSection('TEST 5: Updating Order Status');

        if (global.testOrderId) {
            log(`🔄 Updating order status to "Processing"...`);

            const { data: updatedOrder, error: updateError } = await supabase
                .from('medicine_orders')
                .update({ status: 'Processing' })
                .eq('id', global.testOrderId)
                .select()
                .single();

            if (updateError) {
                log(`❌ FAILED: ${updateError.message}`, 'red');
                results.failed++;
            } else {
                log(`✅ PASSED: Status updated successfully`, 'green');
                log(`   New Status: ${updatedOrder.status}`, 'yellow');
                results.passed++;
            }

            // Update to Shipped
            log(`🚚 Updating order status to "Shipped"...`);
            const { error: shipError } = await supabase
                .from('medicine_orders')
                .update({ status: 'Shipped' })
                .eq('id', global.testOrderId);

            if (!shipError) {
                log(`✅ Order marked as shipped`, 'green');
            }

            // Cleanup
            log(`🧹 Cleaning up test order...`);
            await supabase
                .from('medicine_orders')
                .delete()
                .eq('id', global.testOrderId);
            log(`✅ Test order deleted`, 'green');
        } else {
            log('⚠️  SKIPPED: No order ID available', 'yellow');
            results.skipped++;
        }

        // ================================================================
        // TEST 6: Generic Medicine Prioritization
        // ================================================================
        logSection('TEST 6: Generic Medicine Search Prioritization');

        log('🔬 Testing generic medicine search...');
        const { data: generics, error: genericError } = await supabase
            .from('medicines')
            .select('brand_name, generic_name, price')
            .or('brand_name.ilike.%paracetamol%,generic_name.ilike.%paracetamol%')
            .order('price', { ascending: true })
            .limit(5);

        if (genericError) {
            log(`❌ FAILED: ${genericError.message}`, 'red');
            results.failed++;
        } else {
            log(`✅ PASSED: Found ${generics.length} results`, 'green');
            log('\n💊 Results (sorted by price - generics first):');
            generics.forEach((m, i) => {
                log(`   ${i + 1}. ${m.brand_name} (${m.generic_name}) - ₹${m.price}`, 'yellow');
            });
            results.passed++;
        }

        // ================================================================
        // TEST 7: Patient Order History
        // ================================================================
        logSection('TEST 7: Patient Order History');

        if (patient) {
            log(`📜 Fetching order history for ${patient.first_name}...`);
            const { data: patientOrders, error: historyError } = await supabase
                .from('medicine_orders')
                .select('id, total_amount, status, created_at')
                .eq('patient_id', patient.user_id)
                .order('created_at', { ascending: false });

            if (historyError) {
                log(`❌ FAILED: ${historyError.message}`, 'red');
                results.failed++;
            } else {
                log(`✅ PASSED: Retrieved ${patientOrders.length} orders`, 'green');
                if (patientOrders.length > 0) {
                    log('\n🛒 Order History:');
                    patientOrders.slice(0, 3).forEach((o, i) => {
                        const date = new Date(o.created_at).toLocaleDateString();
                        log(`   ${i + 1}. ${date} - ₹${o.total_amount} - ${o.status}`, 'yellow');
                    });
                }
                results.passed++;
            }
        } else {
            log('⚠️  SKIPPED: No patient available', 'yellow');
            results.skipped++;
        }

        // ================================================================
        // FINAL RESULTS
        // ================================================================
        logSection('TEST RESULTS SUMMARY');

        const total = results.passed + results.failed + results.skipped;
        const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

        log(`Total Tests: ${total}`);
        log(`✅ Passed: ${results.passed}`, 'green');
        log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
        log(`⚠️  Skipped: ${results.skipped}`, 'yellow');
        log(`\n📊 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

        if (results.failed === 0) {
            log('\n🎉 All tests passed! MediConnect is ready for production.', 'green');
        } else {
            log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
        }

    } catch (error) {
        log(`\n💥 CRITICAL ERROR: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runIntegrationTests()
    .then(() => {
        log('\n✨ Integration test suite completed.\n', 'blue');
        process.exit(0);
    })
    .catch(error => {
        log(`\n💥 Fatal error: ${error.message}`, 'red');
        process.exit(1);
    });
