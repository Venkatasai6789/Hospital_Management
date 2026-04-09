#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.name);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Sample medicines data
const sampleMedicines = [
    {
        brand_name: 'Dolo 650mg',
        generic_name: 'Paracetamol',
        therapeutic_class: 'Analgesic',
        action_class: 'Pain reliever',
        dosage_form: 'Tablet',
        price: 30,
        description: 'Effective for mild to moderate pain and fever',
        side_effects: 'Liver damage with overdose',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
    },
    {
        brand_name: 'Aspirin 500mg',
        generic_name: 'Acetylsalicylic Acid',
        therapeutic_class: 'Analgesic',
        action_class: 'Anti-inflammatory',
        dosage_form: 'Tablet',
        price: 25,
        description: 'For pain, fever, and inflammation',
        side_effects: 'Stomach upset, allergic reactions',
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?auto=format&fit=crop&q=80&w=800'
    },
    {
        brand_name: 'Benadryl Cough Syrup',
        generic_name: 'Diphenhydramine',
        therapeutic_class: 'Antihistamine',
        action_class: 'Cough suppressant',
        dosage_form: 'Syrup',
        price: 110,
        description: 'Relieves cough and cold symptoms',
        side_effects: 'Drowsiness, dizziness',
        image: 'https://images.unsplash.com/photo-1603555501671-3f938d01f92e?auto=format&fit=crop&q=80&w=800'
    },
    {
        brand_name: 'Volini Gel',
        generic_name: 'Diclofenac',
        therapeutic_class: 'Anti-inflammatory',
        action_class: 'Pain relief gel',
        dosage_form: 'Gel',
        price: 145,
        description: 'For muscle and joint pain',
        side_effects: 'Skin irritation at application site',
        image: 'https://images.unsplash.com/photo-1626968037373-c4eb9d042299?auto=format&fit=crop&q=80&w=800'
    },
    {
        brand_name: 'Shelcal 500',
        generic_name: 'Calcium Carbonate',
        therapeutic_class: 'Supplement',
        action_class: 'Bone health',
        dosage_form: 'Tablet',
        price: 120,
        description: 'Calcium supplement for bone health',
        side_effects: 'Constipation, nausea',
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800'
    }
];

// Sample lab tests data
const sampleLabTests = [
    {
        title: 'Complete Blood Count (CBC)',
        type: 'Blood Test',
        test_count: 25,
        price: 299,
        original_price: 500,
        discount: 40,
        tat: '24 hours',
        category: 'Hematology',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
        description: 'Complete blood count test to check overall blood health',
        tests_included: 'RBC, WBC, Hemoglobin, Hematocrit, Platelets',
        preparation: 'No fasting required',
        location: 'Mumbai, Delhi, Bangalore',
        contact_number: '+91-XXXXX-XXXXX',
        lab_address: 'Main Lab Center, Mumbai',
        tags: 'blood, hematology, routine'
    },
    {
        title: 'Thyroid Profile (TSH, T3, T4)',
        type: 'Blood Test',
        test_count: 3,
        price: 599,
        original_price: 900,
        discount: 33,
        tat: '24 hours',
        category: 'Endocrinology',
        image: 'https://images.unsplash.com/photo-1530836369250-ef72a3649b62?auto=format&fit=crop&q=80&w=800',
        description: 'Thyroid function test panel',
        tests_included: 'TSH, Free T3, Free T4',
        preparation: 'Fasting 8 hours recommended',
        location: 'Mumbai, Delhi, Pune',
        contact_number: '+91-XXXXX-XXXXX',
        lab_address: 'Diagnostic Center, Pune',
        tags: 'thyroid, hormones, endocrinology'
    },
    {
        title: 'Lipid Profile',
        type: 'Blood Test',
        test_count: 4,
        price: 399,
        original_price: 600,
        discount: 33,
        tat: '24 hours',
        category: 'Biochemistry',
        image: 'https://images.unsplash.com/photo-1631217314830-4865ec7af1a8?auto=format&fit=crop&q=80&w=800',
        description: 'Check cholesterol and triglyceride levels',
        tests_included: 'Total Cholesterol, LDL, HDL, Triglycerides',
        preparation: 'Fasting 12 hours required',
        location: 'All Cities',
        contact_number: '+91-XXXXX-XXXXX',
        lab_address: 'Metropolitan Labs',
        tags: 'lipid, cholesterol, heart'
    },
    {
        title: 'COVID-19 RT-PCR Test',
        type: 'Molecular Test',
        test_count: 1,
        price: 499,
        original_price: 800,
        discount: 37,
        tat: '24 hours',
        category: 'Virology',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
        description: 'COVID-19 detection via RT-PCR',
        tests_included: 'SARS-CoV-2 RT-PCR',
        preparation: 'No preparation needed',
        location: 'All Cities',
        contact_number: '+91-XXXXX-XXXXX',
        lab_address: 'Quick Test Centers',
        tags: 'covid, pcr, viral'
    },
    {
        title: 'Liver Function Test (LFT)',
        type: 'Blood Test',
        test_count: 10,
        price: 449,
        original_price: 700,
        discount: 35,
        tat: '24 hours',
        category: 'Biochemistry',
        image: 'https://images.unsplash.com/photo-1631217314830-4865ec7af1a8?auto=format&fit=crop&q=80&w=800',
        description: 'Comprehensive liver function assessment',
        tests_included: 'Bilirubin, ALT, AST, ALP, Albumin, Total Protein',
        preparation: 'Fasting 8 hours recommended',
        location: 'All Cities',
        contact_number: '+91-XXXXX-XXXXX',
        lab_address: 'Premium Diagnostic Labs',
        tags: 'liver, hepatic, enzymes'
    }
];

async function seedDatabase() {
    try {
        console.log('Starting database seeding...\n');

        // Clear existing data
        console.log('Clearing existing medicines...');
        await supabase.from('medicines').delete().neq('id', '');
        
        console.log('Clearing existing lab tests...');
        await supabase.from('lab_tests').delete().neq('id', '');

        // Insert medicines
        console.log('Inserting sample medicines...');
        const { data: medicinesData, error: medicinesError } = await supabase
            .from('medicines')
            .insert(sampleMedicines);

        if (medicinesError) {
            console.error('Error inserting medicines:', medicinesError);
        } else {
            console.log(`✅ Successfully inserted ${sampleMedicines.length} medicines`);
        }

        // Insert lab tests
        console.log('Inserting sample lab tests...');
        const { data: labTestsData, error: labTestsError } = await supabase
            .from('lab_tests')
            .insert(sampleLabTests);

        if (labTestsError) {
            console.error('Error inserting lab tests:', labTestsError);
        } else {
            console.log(`✅ Successfully inserted ${sampleLabTests.length} lab tests`);
        }

        console.log('\n✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('Fatal error during seeding:', error);
        process.exit(1);
    }
}

seedDatabase().catch(console.error);
