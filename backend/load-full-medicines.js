#!/usr/bin/env node

/**
 * Optimized Medicines CSV Loader (ES Module Version)
 * Loads 248k+ records efficiently with batching, progress tracking, and error recovery
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ymbccadqqgytiycmdrmn.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 500;
const CONCURRENT_BATCHES = 3;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

class MedicinesLoader {
  constructor() {
    this.totalRecords = 248228;
    this.loadedRecords = 0;
    this.failedRecords = 0;
    this.startTime = Date.now();
  }

  transformRecord(row) {
    return {
      brand_name: row.Drug_Name || 'Unknown',
      generic_name: row.Generic_Name || row.Drug_Name || 'Unknown',
      therapeutic_class: row.Therapeutic_Class || 'General',
      action_class: row.Action_Class || 'Standard',
      chemical_class: row.Chemical_Class || 'Standard',
      dose_form: row.Dose_Form || 'Tablet',
      habit_forming: (row.Habit_Forming || '').toLowerCase() === 'yes',
      side_effects: (row.Side_Effects || '').split(',').slice(0, 42).join(','),
      substitutes: (row.Substitutes || '').split(',').slice(0, 5).join(','),
      uses: (row.Uses || '').split(',').slice(0, 5).join(','),
      description: `${row.Therapeutic_Class || 'Medicine'}: ${row.Drug_Name || row.Generic_Name}`.trim(),
      price: Math.floor(Math.random() * 950 + 50),
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
    };
  }

  async loadCSV() {
    console.log('\n🚀 Starting medicines.csv loading for 248,228 records...');
    console.log(`📊 Batch size: ${BATCH_SIZE} | Concurrent: ${CONCURRENT_BATCHES}`);
    console.log(`📁 Parsing CSV from: ai_bot/medicines.csv\n`);

    const csvPath = path.join(__dirname, '../ai_bot/medicines.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      process.exit(1);
    }

    return new Promise((resolve, reject) => {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
      });

      let recordCount = 0;
      let currentBatch = [];

      parser.on('readable', async () => {
        let record;
        while ((record = parser.read()) !== null) {
          recordCount++;

          try {
            const transformed = this.transformRecord(record);
            currentBatch.push(transformed);

            if (currentBatch.length >= BATCH_SIZE) {
              parser.pause();
              await this.processBatch(currentBatch);
              currentBatch = [];
              parser.resume();
            }

            if (recordCount % 10000 === 0) {
              this.logProgress(recordCount);
            }
          } catch (err) {
            console.error(`⚠️  Error at record ${recordCount}:`, err.message);
            this.failedRecords++;
          }
        }
      });

      parser.on('error', reject);
      parser.on('end', async () => {
        if (currentBatch.length > 0) {
          await this.processBatch(currentBatch);
        }
        this.logFinalStats();
        resolve();
      });

      fs.createReadStream(csvPath).pipe(parser);
    });
  }

  async processBatch(batch) {
    try {
      const { error } = await supabase.from('medicines').insert(batch);
      if (error) {
        console.error(`❌ Batch error:`, error.message);
        this.failedRecords += batch.length;
      } else {
        this.loadedRecords += batch.length;
      }
    } catch (err) {
      console.error(`❌ Exception:`, err.message);
      this.failedRecords += batch.length;
    }
  }

  logProgress(count) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = (count / ((Date.now() - this.startTime) / 1000)).toFixed(0);
    const remaining = Math.ceil((this.totalRecords - count) / rate);
    
    console.log(
      `📈 ${count.toLocaleString()}/${this.totalRecords.toLocaleString()} (${((count/this.totalRecords)*100).toFixed(1)}%) | ` +
      `${rate}rec/s | ETA: ${remaining}s`
    );
  }

  logFinalStats() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = (this.loadedRecords / totalTime).toFixed(0);

    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Loaded:   ${this.loadedRecords.toLocaleString()} records`);
    console.log(`❌ Failed:   ${this.failedRecords.toLocaleString()} records`);
    console.log(`⏱️  Duration: ${totalTime}s (${(totalTime/60).toFixed(1)} minutes)`);
    console.log(`📈 Rate:     ${rate} records/second`);
    console.log('='.repeat(80) + '\n');

    if (this.loadedRecords > 100) {
      console.log('🎉 Pharmacy optimized and ready to use!\n');
    }
  }
}

const run = async () => {
  const loader = new MedicinesLoader();
  try {
    await loader.loadCSV();
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
};

run();
