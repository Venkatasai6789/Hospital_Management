import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ymbccadqqgytiycmdrmn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmNjYWRxcWd5dGl5Y21kcm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjYwMDQyOSwiZXhwIjoyMDI4MjQwNDI5fQ.tqQqpMK3C2TvVDRs9cXH5ZqQ6w1e8-qZ3p7K8L9M0N4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m'
};

async function loadMedicinesFromCSV() {
  try {
    const csvPath = path.join(process.cwd(), '..', 'ai_bot', 'medicines.csv');
    
    console.log(`${colors.blue}📂 Reading CSV file from: ${csvPath}${colors.reset}`);
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log(`${colors.blue}✓ CSV file loaded (${(csvContent.length / 1024 / 1024).toFixed(2)} MB)${colors.reset}`);
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true
    });
    
    console.log(`${colors.yellow}Found ${records.length} medicine records${colors.reset}`);
    
    // Transform records to match Supabase schema
    const medicines = records.map((record, index) => {
      // Extract side effects
      const sideEffects = [];
      for (let i = 0; i < 42; i++) {
        const key = `sideEffect${i}`;
        if (record[key] && record[key].trim()) {
          sideEffects.push(record[key].trim());
        }
      }
      
      // Extract substitutes (generics)
      const substitutes = [];
      for (let i = 0; i < 5; i++) {
        const key = `substitute${i}`;
        if (record[key] && record[key].trim()) {
          substitutes.push(record[key].trim());
        }
      }
      
      // Extract uses
      const uses = [];
      for (let i = 0; i < 5; i++) {
        const key = `use${i}`;
        if (record[key] && record[key].trim()) {
          uses.push(record[key].trim());
        }
      }
      
      return {
        brand_name: record.name ? record.name.trim() : `Medicine ${index}`,
        generic_name: substitutes.length > 0 ? substitutes[0] : null,
        therapeutic_class: record['Therapeutic Class'] ? record['Therapeutic Class'].trim() : null,
        action_class: record['Action Class'] ? record['Action Class'].trim() : null,
        chemical_class: record['Chemical Class'] ? record['Chemical Class'].trim() : null,
        dose_form: record['Dose Form'] ? record['Dose Form'].trim() : 'Tablet',
        habit_forming: record['Habit Forming'] ? record['Habit Forming'].toLowerCase() === 'yes' : false,
        side_effects: sideEffects.slice(0, 10).join(', '), // Limit to 10 for display
        substitutes: substitutes.join(', '),
        uses: uses.slice(0, 3).join(', '), // Limit to 3 for display
        description: uses.length > 0 ? `Used for: ${uses.slice(0, 2).join(', ')}` : 'Medicine',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
        price: Math.floor(Math.random() * 300) + 30 // Random price between 30-330
      };
    });
    
    console.log(`${colors.cyan}✓ Transformed ${medicines.length} records${colors.reset}`);
    
    // Clear existing medicines
    console.log(`${colors.yellow}🗑️  Clearing existing medicines from Supabase...${colors.reset}`);
    const { error: deleteError } = await supabase.from('medicines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log(`${colors.yellow}⚠️  Note: ${deleteError.message}${colors.reset}`);
    }
    
    // Insert medicines in batches (Supabase has limits)
    const batchSize = 100;
    const totalBatches = Math.ceil(medicines.length / batchSize);
    
    console.log(`${colors.yellow}📤 Uploading medicines in ${totalBatches} batches...${colors.reset}`);
    
    let insertedCount = 0;
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = medicines.slice(i * batchSize, (i + 1) * batchSize);
      
      const { data, error } = await supabase
        .from('medicines')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.log(`${colors.red}❌ Error uploading batch ${i + 1}: ${error.message}${colors.reset}`);
      } else {
        insertedCount += batch.length;
        console.log(`${colors.green}✓ Batch ${i + 1}/${totalBatches} uploaded (${insertedCount}/${medicines.length})${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}✅ Successfully loaded ${insertedCount} medicines from CSV to Supabase!${colors.reset}`);
    console.log(`${colors.cyan}Medicines table is now ready for the pharmacy section${colors.reset}\n`);
    
  } catch (err) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, err.message);
    process.exit(1);
  }
}

loadMedicinesFromCSV();
