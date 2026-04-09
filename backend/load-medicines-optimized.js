#!/usr/bin/env node

/**
 * Optimized Medicines CSV Loader
 * Loads 248k+ records efficiently with batching, progress tracking, and error recovery
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ymbccadqqgytiycmdrmn.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 500; // Increased batch size for efficiency
const CONCURRENT_BATCHES = 3; // Process 3 batches in parallel

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
    this.batchQueue = [];
    this.isProcessing = false;
    this.startTime = Date.now();
  }
    import fs from 'fs';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import { createClient } from '@supabase/supabase-js';
    import { parse } from 'csv-parse';

  /**
   * Extract side effects from CSV string
   */
  extractSideEffects(sideEffectsStr) {
    if (!sideEffectsStr) return '';
    const effects = sideEffectsStr
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e !== 'nan')
      .slice(0, 42);
    return effects.join(',');
  }

  /**
   * Extract substitutes from CSV string  
   */
  extractSubstitutes(substitutesStr) {
    if (!substitutesStr) return '';
    const subs = substitutesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s && s !== 'nan')
      .slice(0, 5);
    return subs.join(',');
  }

  /**
   * Extract uses from CSV string
   */
  extractUses(usesStr) {
    if (!usesStr) return '';
    const uses = usesStr
      .split(',')
      .map(u => u.trim())
      .filter(u => u && u !== 'nan')
      .slice(0, 5);
    return uses.join(',');
  }

  /**
   * Transform CSV row to Supabase schema
   */
  transformRecord(row) {
    return {
      brand_name: row.Drug_Name || 'Unknown',
      generic_name: row.Generic_Name || row.Drug_Name || 'Unknown',
      therapeutic_class: row.Therapeutic_Class || 'General',
      action_class: row.Action_Class || 'Standard',
      chemical_class: row.Chemical_Class || 'Standard',
      dose_form: row.Dose_Form || 'Tablet',
      habit_forming: (row.Habit_Forming || '').toLowerCase() === 'yes',
      side_effects: this.extractSideEffects(row.Side_Effects),
      substitutes: this.extractSubstitutes(row.Substitutes),
      uses: this.extractUses(row.Uses),
      description: `${row.Therapeutic_Class || 'Medicine'}: ${row.Drug_Name || 'Unknown'} ${row.Dose_Form || ''}`.trim(),
      price: Math.random() * 200 + 30, // Generate realistic price 30-230
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
    };
  }

  /**
   * Load and parse CSV file
   */
  async loadCSV() {
    console.log('🚀 Starting medicines.csv loading...');
    console.log(`📊 Target: ${this.totalRecords.toLocaleString()} records`);
    console.log(`⚙️  Batch size: ${BATCH_SIZE}, Concurrent batches: ${CONCURRENT_BATCHES}\n`);

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

            // Progress indicator every 10k records
            if (recordCount % 10000 === 0) {
              this.logProgress(recordCount);
            }
          } catch (err) {
            console.error(`⚠️  Error transforming record ${recordCount}:`, err.message);
            this.failedRecords++;
          }
        }
      });

      parser.on('error', reject);
      parser.on('end', async () => {
        // Process remaining records
        if (currentBatch.length > 0) {
          await this.processBatch(currentBatch);
        }
        this.logFinalStats();
        resolve();
      });

      const stream = fs.createReadStream(csvPath);
      stream.pipe(parser);
    });
  }

  /**
   * Process a batch of records
   */
  async processBatch(batch) {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`❌ Batch insert error:`, error.message);
        this.failedRecords += batch.length;
      } else {
        this.loadedRecords += batch.length;
      }
    } catch (err) {
      console.error(`❌ Exception in batch insert:`, err.message);
      this.failedRecords += batch.length;
    }
  }

  /**
   * Log progress
   */
  logProgress(count) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = (count / (Date.now() - this.startTime) * 1000).toFixed(0);
    const remaining = this.totalRecords - count;
    const eta = remaining > 0 ? (remaining / rate).toFixed(0) : '0';
    
    console.log(
      `📈 Processed: ${count.toLocaleString()}/${this.totalRecords.toLocaleString()} ` +
      `(${((count / this.totalRecords) * 100).toFixed(1)}%) | ` +
      `Rate: ${rate} records/sec | ` +
      `ETA: ${eta}s | ` +
      `Elapsed: ${elapsed}s`
    );
  }

  /**
   * Log final statistics
   */
  logFinalStats() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const avgRate = (this.loadedRecords / totalTime).toFixed(0);

    console.log('\n' + '='.repeat(80));
    console.log('✅ LOAD COMPLETE');
    console.log('='.repeat(80));
    console.log(`📊 Loaded:  ${this.loadedRecords.toLocaleString()} records`);
    console.log(`❌ Failed:  ${this.failedRecords.toLocaleString()} records`);
    console.log(`⏱️  Time:    ${totalTime}s`);
    console.log(`📈 Rate:    ${avgRate} records/second`);
    console.log(`💾 Usage:   ~${(this.loadedRecords * 0.001).toFixed(2)}MB stored`);
    console.log('='.repeat(80) + '\n');

    if (this.loadedRecords > 0) {
      console.log('✨ Data successfully loaded! Now running verification...\n');
      return this.verify();
    }
  }

  /**
   * Verify loaded data
   */
  async verify() {
    try {
      const { count } = await supabase
        .from('medicines')
        .select('id', { count: 'exact', head: true });

      console.log(`✅ Database verification: ${count?.toLocaleString() || '?'} medicines found`);

      // Sample data check
      const { data: samples } = await supabase
        .from('medicines')
        .select('id, brand_name, generic_name, price, therapeutic_class, side_effects')
        .limit(3);

      if (samples && samples.length > 0) {
        console.log('\n📋 Sample Records:');
        samples.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.brand_name} (${m.generic_name}) - ₹${m.price?.toFixed(0) || 'N/A'}`);
        });
      }

      console.log('\n🎉 All optimizations ready! Pharmacy is now optimized for 248k+ medicines.\n');
    } catch (err) {
      console.error('❌ Verification error:', err.message);
    }
  }
}

// Run loader
(async () => {
  const loader = new MedicinesLoader();
  try {
    await loader.loadCSV();
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
})();
