# 🚀 Quick Start Guide - Loading Pharmacy Data

## Current Status

✅ **13 sample medicines** already loaded and tested  
✅ **Pharmacy section** fetching from Supabase  
✅ **All CSV fields** properly mapped  
✅ **Build & tests** passing  

---

## Load Additional Medicines from medicines.csv

### Option 1: Load Complete CSV File (Recommended)

```bash
cd backend
npm install csv-parse
node load-medicines-from-csv.js
```

**What this does:**
- Reads full `ai_bot/medicines.csv`
- Parses all 50+ columns per medicine
- Extracts and transforms data:
  - Combines sideEffect0-41 → side_effects
  - Combines substitute0-4 → substitutes  
  - Combines use0-4 → uses
- Clears existing medicines
- Batch inserts to Supabase (100 per batch)
- Shows progress for each batch

**Expected Output:**
```
📂 Reading CSV file...
✓ CSV file loaded (XX.XX MB)
Found XXXXX medicine records
✓ Transformed XXXXX records
📤 Uploading medicines in XXX batches...
✓ Batch 1/XXX uploaded (100/XXXXX)
✓ Batch 2/XXX uploaded (200/XXXXX)
...
✅ Successfully loaded XXXXX medicines!
```

---

## Option 2: Manual SQL Insert

### Insert Specific Medicines

```sql
INSERT INTO public.medicines (
  brand_name, 
  generic_name, 
  therapeutic_class, 
  action_class, 
  chemical_class,
  dose_form,
  habit_forming,
  side_effects,
  substitutes,
  uses,
  description,
  image,
  price
) VALUES (
  'Medicine Brand',
  'Generic Name',
  'Therapeutic Class',
  'Action Class',
  'Chemical Class',
  'Tablet',
  false,
  'Effect1, Effect2, Effect3',
  'Alt1, Alt2',
  'Use1, Use2',
  'Description',
  'https://image-url.jpg',
  95.00
);
```

---

## Verify Data After Loading

```bash
# Run verification tests
cd backend
node test-pharmacy-data.js
```

**Expected Results:**
- ✅ All medicines fetched
- ✅ CSV fields verified
- ✅ Sample data displayed
- ✅ Filtering working
- ✅ Search functional
- ✅ Price analysis complete

---

## Pharmacy Features Available Now

### Patient Dashboard Pharmacy Section

**Search & Filter:**
- Find medicines by brand name
- Search by generic (molecular) name
- Filter by therapeutic class
- View by dose form

**Medicine Information Displayed:**
- Brand & generic name
- Therapeutic classification
- Action mechanism
- Chemical class
- Dose form & pack size
- Price & discount
- Uses/indications
- Side effects list
- Generic alternatives
- Habit-forming status
- Mechanism of action

**Shopping Features:**
- Add to cart
- Quantity adjustment
- Cart total calculation
- Checkout process
- Order tracking

---

## File Locations

| File | Purpose | Status |
|------|---------|--------|
| `ai_bot/medicines.csv` | Source data (50+ columns) | ✅ Ready |
| `backend/load-medicines-from-csv.js` | CSV loader script | ✅ Ready |
| `backend/test-pharmacy-data.js` | Verification tests | ✅ Ready |
| `backend/test-patient-endpoints.js` | API endpoint tests | ✅ Ready |
| `components/PatientDashboard.tsx` | React component | ✅ Updated |
| `supabase` | Physical database | ✅ Extended |

---

## Sample Query - Get All Available Data

```sql
SELECT 
  brand_name,
  generic_name,
  therapeutic_class,
  action_class,
  chemical_class,
  dose_form,
  habit_forming,
  side_effects,
  substitutes,
  uses,
  price,
  created_at
FROM public.medicines
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: "Invalid API Key" when loading CSV

**Solution:** Use the correct service role key in environment:
```bash
# Set environment variables
export VITE_SUPABASE_URL=https://ymbccadqqgytiycmdrmn.supabase.co
export VITE_SUPABASE_ANON_KEY=your_anon_key
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Issue: "CSV file too large"

**Solution:** Load in batches or use Node.js
```bash
npm install csv-parse
node load-medicines-from-csv.js  # Handles large files automatically
```

### Issue: Duplicate medicines after loading

**Solution:** Script clears old data automatically
```javascript
// Already included in load-medicines-from-csv.js
await supabase.from('medicines').delete().neq('id', '00000000-...');
```

---

## Database Schema Reference

```sql
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL,
  generic_name TEXT,
  therapeutic_class TEXT,
  action_class TEXT,
  chemical_class TEXT,
  dose_form TEXT,
  habit_forming BOOLEAN DEFAULT false,
  side_effects TEXT,
  substitutes TEXT,
  uses TEXT,
  description TEXT,
  image TEXT,
  price DECIMAL(10, 2),
  search_vector tsvector GENERATED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medicines_therapeutic_class ON medicines(therapeutic_class);
CREATE INDEX idx_medicines_action_class ON medicines(action_class);
CREATE INDEX idx_medicines_search ON medicines USING GIN(search_vector);
```

---

## Currently Loaded Medicines (13)

```
1. Dolo 650mg - ₹30 (Analgesic)
2. Benadryl Cough Syrup - ₹110 (Cough suppressant)
3. Volini Gel - ₹145 (Topical pain relief)
4. Aspirin 75mg - ₹45 (Antiplatelet)
5. Amoxicillin 500mg - ₹120 (Antibiotic)
6. Metformin 500mg - ₹85 (Antidiabetic)
7. Lisinopril 10mg - ₹95 (Antihypertensive)
8. Omeprazole 20mg - ₹75 (PPI)
9. Atorvastatin 20mg - ₹105 (Lipid-lowering)
10. Levothyroxine 75mcg - ₹55 (Thyroid hormone)
11. Ibuprofen 400mg - ₹65 (NSAID)
12. Cetirizine 10mg - ₹35 (Antihistamine)
13. Ranitidine 150mg - ₹48 (H2 blocker)
```

**Price Range:** ₹30 - ₹145  
**Average:** ₹77.92

---

## Testing & Validation

### Test 1: Fetch All Medicines
```bash
node test-pharmacy-data.js
# Result: ✅ All medicines fetched
```

### Test 2: Verify CSV Fields
```bash
node test-pharmacy-data.js
# Result: ✅ brand_name, generic_name, therapeutic_class, etc.
```

### Test 3: Search Functionality
```bash
node test-pharmacy-data.js
# Result: ✅ Search returns correct results
```

### Test 4: Filter by Class
```bash
node test-pharmacy-data.js
# Result: ✅ Filtering works by therapeutic class
```

### Test 5: Price Validation
```bash
node test-pharmacy-data.js
# Result: ✅ Price range: ₹30 - ₹145
```

---

## Build & Deploy

```bash
# Build the project
npm run build

# Expected: ✅ built in 9-10 seconds

# No errors or warnings
# Ready for deployment
```

---

## 🎯 Next Steps

1. ✅ **Load full medicines.csv** (commands above)
2. ✅ **Test pharmacy section** in patient dashboard
3. ✅ **Add more medicines** via admin panel
4. ✅ **Customize pricing** based on your rates
5. ✅ **Add prescriptions** integration
6. ✅ **Enable medicine recommendations** based on doctor prescriptions

---

## Support & Documentation

- **CSV Data Mapping:** See `CSV_SUPABASE_MAPPING.md`
- **Integration Details:** See `PHARMACY_DATA_INTEGRATION.md`
- **API Endpoints:** See `backend/test-patient-endpoints.js`
- **Database Info:** See Supabase Dashboard

---

## ✅ Status

**PRODUCTION READY**

All systems operational:
- ✅ Database extended with pharmacy fields
- ✅ 13 sample medicines loaded
- ✅ Patient dashboard updated
- ✅ Search & filter working
- ✅ Tests passing
- ✅ Build successful
- ✅ No errors or warnings

**Ready to accept more medicines from medicines.csv!**
