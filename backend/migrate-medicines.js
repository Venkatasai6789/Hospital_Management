import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_SERVICE_ROLE_KEY')) {
    console.error("Missing valid Supabase credentials in .env");
    console.error("Please add SUPABASE_SERVICE_ROLE_KEY to backend/.env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CSV_PATH = path.join(__dirname, '..', 'ai_bot', 'medicines.csv');

async function migrateMedicines() {
    console.log("Starting migration...");
    console.log("Reading CSV from:", CSV_PATH);

    if (!fs.existsSync(CSV_PATH)) {
        console.error("CSV file not found at:", CSV_PATH);
        process.exit(1);
    }

    const parser = fs.createReadStream(CSV_PATH).pipe(parse({ columns: true, skip_empty_lines: true }));

    let batch = [];
    const BATCH_SIZE = 500;
    let totalCount = 0;

    for await (const row of parser) {
        const genericNames = [
            row.substitute0, row.substitute1, row.substitute2, row.substitute3, row.substitute4
        ].filter(v => v && v !== 'NA').join(', ');

        const sideEffects = Array.from({ length: 42 }, (_, i) => row[`sideEffect${i}`])
            .filter(v => v && v !== 'NA').join(', ');

        const uses = Array.from({ length: 5 }, (_, i) => row[`use${i}`])
            .filter(v => v && v !== 'NA').join(', ');

        let dosageForm = 'Medicine';
        const nameLower = row.name.toLowerCase();
        if (nameLower.includes('tablet')) dosageForm = 'Tablet';
        else if (nameLower.includes('syrup')) dosageForm = 'Syrup';
        else if (nameLower.includes('capsule')) dosageForm = 'Capsule';
        else if (nameLower.includes('injection')) dosageForm = 'Injection';
        else if (nameLower.includes('gel')) dosageForm = 'Gel';
        else if (nameLower.includes('cream')) dosageForm = 'Cream';

        batch.push({
            brand_name: row.name,
            generic_name: genericNames || null,
            therapeutic_class: row['Therapeutic Class'] !== 'NA' ? row['Therapeutic Class'] : null,
            action_class: row['Action Class'] !== 'NA' ? row['Action Class'] : null,
            dosage_form: dosageForm,
            price: Math.floor(Math.random() * 400) + 50,
            description: uses || null,
            side_effects: sideEffects || null,
            image: `https://loremflickr.com/320/240/medicine,${dosageForm.toLowerCase()}?lock=${totalCount}`
        });

        if (batch.length >= BATCH_SIZE) {
            const { error } = await supabase.from('medicines').insert(batch);
            if (error) {
                console.error("Error inserting batch:", error.message);
            } else {
                totalCount += batch.length;
                console.log(`Inserted ${totalCount} records...`);
            }
            batch = [];
            if (totalCount >= 5000) {
                console.log("Reached test limit of 5000 records.");
                break;
            }
        }
    }

    if (batch.length > 0) {
        const { error } = await supabase.from('medicines').insert(batch);
        if (!error) totalCount += batch.length;
    }

    console.log(`Migration complete! Total records inserted: ${totalCount}`);
}

migrateMedicines().catch(console.error);
