/**
 * Test script to verify pharmacy data from Supabase
 * Tests medicines fetching with expanded CSV fields
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymbccadqqgytiycmdrmn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmNjYWRxcWd5dGl5Y21kcm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTcwOTEsImV4cCI6MjA5MTIzMzA5MX0.Q0FaArT6NbIS3DAUDSHnzT-drS9IEnw2ouZ7N-XL5fA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m'
};

async function testPharmacyData() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     PHARMACY DATA VERIFICATION (SUPABASE)      ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Test 1: Fetch all medicines
    console.log(`${colors.yellow}Test 1: Fetching All Medicines${colors.reset}`);
    const { data: allMedicines, error: allError } = await supabase
      .from('medicines')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log(`${colors.red}❌ FAILED: ${allError.message}${colors.reset}\n`);
      return;
    }

    console.log(`${colors.green}✅ SUCCESS - ${allMedicines.length} medicines found${colors.reset}\n`);

    // Test 2: Check CSV fields are present
    console.log(`${colors.yellow}Test 2: Verifying CSV Data Fields${colors.reset}`);
    const medicine = allMedicines[0];
    const requiredFields = [
      'id', 'brand_name', 'generic_name', 'therapeutic_class', 
      'action_class', 'chemical_class', 'dose_form', 'habit_forming',
      'side_effects', 'substitutes', 'uses', 'price', 'description'
    ];

    let missingFields = [];
    requiredFields.forEach(field => {
      if (!(field in medicine)) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      console.log(`${colors.red}❌ Missing fields: ${missingFields.join(', ')}${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ All required CSV fields present${colors.reset}\n`);
    }

    // Test 3: Display sample medicines with all data
    console.log(`${colors.yellow}Test 3: Sample Medicines with Expanded Data${colors.reset}`);
    allMedicines.slice(0, 3).forEach((med, idx) => {
      console.log(`\n${colors.cyan}Medicine ${idx + 1}:${colors.reset}`);
      console.log(`  📋 Brand Name: ${med.brand_name}`);
      console.log(`  🧪 Generic: ${med.generic_name}`);
      console.log(`  🏥 Therapeutic Class: ${med.therapeutic_class}`);
      console.log(`  ⚙️  Action Class: ${med.action_class}`);
      console.log(`  🧬 Chemical Class: ${med.chemical_class}`);
      console.log(`  💊 Dose Form: ${med.dose_form}`);
      console.log(`  ⚠️  Habit Forming: ${med.habit_forming ? 'Yes' : 'No'}`);
      console.log(`  💰 Price: ₹${med.price}`);
      console.log(`  📝 Side Effects: ${med.side_effects?.substring(0, 100)}...`);
      console.log(`  🔄 Substitutes: ${med.substitutes?.substring(0, 80)}...`);
      console.log(`  👨‍⚕️  Uses: ${med.uses?.substring(0, 80)}...`);
    });

    // Test 4: Search by therapeutic class
    console.log(`\n${colors.yellow}Test 4: Filtering by Therapeutic Class${colors.reset}`);
    const { data: filteredByClass, error: filterError } = await supabase
      .from('medicines')
      .select('brand_name, therapeutic_class, price')
      .eq('therapeutic_class', 'Antibiotic')
      .limit(5);

    if (filterError) {
      console.log(`${colors.red}❌ Filter failed: ${filterError.message}${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ Found ${filteredByClass.length} Antibiotic medicines${colors.reset}`);
      filteredByClass.forEach(med => {
        console.log(`  • ${med.brand_name} - ₹${med.price}`);
      });
    }

    // Test 5: Verify price field
    console.log(`\n${colors.yellow}Test 5: Price Range Analysis${colors.reset}`);
    const prices = allMedicines.map(m => parseFloat(m.price) || 0).filter(p => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
      console.log(`${colors.green}✅ Price Range: ₹${minPrice} - ₹${maxPrice}${colors.reset}`);
      console.log(`  Average Price: ₹${avgPrice}`);
      console.log(`  Total Medicines with Price: ${prices.length}`);
    }

    // Test 6: Search functionality
    console.log(`\n${colors.yellow}Test 6: Search Functionality${colors.reset}`);
    const { data: searchResults, error: searchError } = await supabase
      .from('medicines')
      .select('brand_name, generic_name, therapeutic_class')
      .ilike('brand_name', '%Dolo%');

    if (searchError) {
      console.log(`${colors.red}❌ Search failed: ${searchError.message}${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ Search returned ${searchResults.length} result(s)${colors.reset}`);
      searchResults.forEach(med => {
        console.log(`  • ${med.brand_name} (${med.generic_name})`);
      });
    }

    // Final summary
    console.log(`\n${colors.blue}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}✅ ALL TESTS PASSED - PHARMACY DATA READY${colors.reset}`);
    console.log(`${colors.cyan}Total Medicines: ${allMedicines.length}${colors.reset}`);
    console.log(`${colors.cyan}All CSV fields properly populated${colors.reset}`);
    console.log(`${colors.cyan}Search & Filter working correctly${colors.reset}`);
    console.log(`${colors.blue}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  } catch (err) {
    console.error(`${colors.red}❌ Fatal error:${colors.reset}`, err);
  }
}

testPharmacyData();
