/**
 * Test script to verify all patient dashboard API endpoints
 * Tests medicines, lab_tests, and related patient endpoints
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with anon key (like the frontend)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ymbccadqqgytiycmdrmn.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmNjYWRxcWd5dGl5Y21kcm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTcwOTEsImV4cCI6MjA5MTIzMzA5MX0.Q0FaArT6NbIS3DAUDSHnzT-drS9IEnw2ouZ7N-XL5fA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function testEndpoint(name, query) {
  try {
    console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
    const { data, error } = await query;
    
    if (error) {
      console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}`);
      return false;
    } 
    
    console.log(`${colors.green}✅ SUCCESS${colors.reset}`);
    console.log(`   Records returned: ${Array.isArray(data) ? data.length : 1}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
    }
    return true;
  } catch (err) {
    console.log(`${colors.red}❌ EXCEPTION: ${err.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`${colors.yellow}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}MediConnect Patient API Endpoint Tests${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════${colors.reset}`);
  
  const results = {};
  
  // Test 1: Medicines table
  results['Medicines (Select All)'] = await testEndpoint(
    'Medicines Table - Select All',
    supabase.from('medicines').select('*')
  );
  
  // Test 2: Medicines with limit
  results['Medicines (Limit 5)'] = await testEndpoint(
    'Medicines Table - Limit 5',
    supabase.from('medicines').select('*').limit(5)
  );
  
  // Test 3: Lab Tests table
  results['Lab Tests (Select All)'] = await testEndpoint(
    'Lab Tests Table - Select All',
    supabase.from('lab_tests').select('*')
  );
  
  // Test 4: Lab Tests with filters
  results['Lab Tests (Category)'] = await testEndpoint(
    'Lab Tests - Filter by Category',
    supabase.from('lab_tests').select('*').eq('category', 'Full Body')
  );
  
  // Test 5: Medicines with textSearch (if full-text search is needed)
  results['Medicines (Text Search)'] = await testEndpoint(
    'Medicines - Text Search',
    supabase.from('medicines').select('*').ilike('brand_name', '%Dolo%')
  );
  
  // Test 6: Connection test
  results['Supabase Connection'] = await testEndpoint(
    'Supabase Connection Check',
    supabase.from('users_profiles').select('count')
  );
  
  // Test 7: RLS Policy test - verify anonymous access works
  results['RLS Policy (Medicines Read)'] = await testEndpoint(
    'RLS Policy - Medicines Read Access',
    supabase.from('medicines').select('id, brand_name').limit(1)
  );

  // Test 8: RLS Policy test - verify anonymous access works for lab tests
  results['RLS Policy (Lab Tests Read)'] = await testEndpoint(
    'RLS Policy - Lab Tests Read Access',
    supabase.from('lab_tests').select('id, title').limit(1)
  );
  
  // Summary
  console.log(`\n${colors.yellow}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}Test Summary:${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════${colors.reset}`);
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
    console.log(`  ${status} - ${test}`);
  }
  
  console.log(`\n${colors.yellow}Overall: ${passed}/${total} tests passed${colors.reset}`);
  
  if (passed === total) {
    console.log(`\n${colors.green}🎉 All tests passed! Patient endpoints are working correctly.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed. Check the errors above.${colors.reset}\n`);
  }
}

runTests().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
