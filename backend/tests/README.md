# MediConnect Test Suite Documentation

## Overview
Comprehensive automated testing for the MediConnect healthcare platform, covering patient medicine ordering, admin management, generic medicine search, and security validation.

## Test Structure

### 1. **Backend API Tests** (`tests/api.test.js`)
Full Jest test suite with 20+ test cases covering:
- Patient medicine ordering workflow
- Admin order management
- Generic medicine search functionality
- Data integrity & security
- Edge cases & error handling

### 2. **Integration Tests** (`tests/integration.test.js`)
End-to-end workflow simulation with 7 comprehensive scenarios:
- Medicine search with text queries
- Cart total calculation
- Order creation and validation
- Admin order retrieval
- Order status updates
- Generic medicine prioritization
- Patient order history

## Installation

### 1. Install Test Dependencies

```bash
cd backend
npm install
```

This will install:
- `jest` - Testing framework
- `supertest` - HTTP assertion library for API testing

### 2. Verify Environment Variables

Ensure your `backend/.env` file contains:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### 3. Ensure Test Data Exists

Before running tests, make sure you have:
- ✅ Admin account created (run `node seed-admin.js`)
- ✅ Test patient account (tests will create one automatically)
- ✅ Medicines seeded in database (run `node migrate-medicines.js`)

## Running Tests

### Quick Start - Integration Tests (Recommended for First Run)

```bash
cd backend
node tests/integration.test.js
```

**Output Example:**
```
🚀 Starting MediConnect Integration Test Suite

================================================================================
  TEST 1: Medicine Search & Generic Alternatives
================================================================================

✅ PASSED: Found 15 medicines
   Sample: CROCIN PAIN RELIEF TABLET (₹122)

================================================================================
  TEST 2: Cart Total Calculation
================================================================================

📦 Simulating cart with 3 items...
   1. CROCIN PAIN RELIEF TABLET - ₹122
   2. PARACETAMOL 500MG TABLET - ₹45
   3. DOLO 650 TABLET - ₹65

💰 Expected Total: ₹232
✅ PASSED: Cart total calculated correctly

...

📊 Pass Rate: 100.0%
🎉 All tests passed! MediConnect is ready for production.
```

### Full Jest Test Suite

```bash
cd backend
npm test
```

**Run Specific Test Suite:**
```bash
npm test -- --testNamePattern="Patient Medicine Ordering"
npm test -- --testNamePattern="Admin Order Management"
```

### Watch Mode (Auto-rerun on File Changes)

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage report will be generated in `backend/coverage/` directory.

## Test Scenarios Covered

### ✅ Patient Workflows
1. **Medicine Search**
   - Full-text search using Supabase
   - Filter by therapeutic class
   - Sort by price (generic-first)
   - Search by brand and generic names

2. **Cart Management**
   - Add/remove items
   - Calculate total (fixes ₹0 bug)
   - Validate cart state

3. **Order Placement**
   - Create order with shipping address
   - Validate required fields
   - Store items array correctly
   - Generate unique order ID

4. **Order History**
   - Fetch patient's own orders only (RLS)
   - Display order details
   - Show current status

### ✅ Admin Workflows
1. **Order Dashboard**
   - Fetch all medicine orders
   - Include patient information
   - Filter and search orders

2. **Order Management**
   - View order details
   - Update order status
   - Validate status transitions

3. **Security**
   - Reject unauthorized patient access to admin routes
   - Verify JWT token validation

### ✅ Security & Data Integrity
1. **Authentication**
   - Patient login with email/mobile
   - Admin role verification
   - Session management

2. **Authorization**
   - RLS policies enforcement
   - Patient can only see their orders
   - Admin can see all orders

3. **Data Validation**
   - Required field checks
   - Shipping address structure
   - Order items format

### ✅ Generic Medicine Features
1. **Search & Discovery**
   - Find generics by brand name
   - Search by active ingredient
   - Price comparison (brand vs generic)

2. **AI Integration** (if available)
   - Test AI service endpoint
   - Graceful fallback when offline
   - Handle CORS errors

### ✅ Edge Cases
1. Empty cart handling
2. Invalid medicine IDs
3. Concurrent order placements
4. Large orders (20+ items)
5. Network errors

## Test Results Interpretation

### Integration Tests Output

**Green (✅ PASSED)**: Test executed successfully
**Red (❌ FAILED)**: Test failed, check error message
**Yellow (⚠️ SKIPPED)**: Test skipped due to missing prerequisites

**Pass Rate Target**: ≥ 80% for production readiness

### Jest Test Output

```
PASS  tests/api.test.js
  Patient Medicine Ordering Workflow
    ✓ Should fetch medicines from database (245ms)
    ✓ Should search medicines by text query (189ms)
    ✓ Should create a medicine order (321ms)
    ✓ Should fetch patient order history (156ms)
  
  Admin Order Management
    ✓ Should fetch all medicine orders (admin) (198ms)
    ✓ Should update order status (admin) (276ms)
    ✓ Should reject unauthorized access to admin routes (145ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        8.543s
```

## Troubleshooting

### Common Issues

**1. "Cannot find module 'jest'"**
```bash
cd backend
npm install
```

**2. "Test patient not found"**
Run the integration test first, it will create one automatically, or manually create:
```bash
cd backend
node seed-patients.js
```

**3. "No medicines found in database"**
```bash
cd backend
node migrate-medicines.js
```

**4. "Unauthorized access" errors**
- Ensure admin account exists: `node seed-admin.js`
- Check `.env` file has correct Supabase credentials
- Verify JWT tokens are being generated correctly

**5. "CORS error for AI service"**
This is **expected** if the AI generic service is offline. Tests will pass regardless by using fallback search.

**6. Tests timing out**
- Increase timeout in `jest.config.js`: `testTimeout: 60000`
- Check if backend server is running
- Verify Supabase connection

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## What Each Test Validates

### Patient Ordering Flow
| Test | Validates |
|------|-----------|
| Fetch medicines | Supabase connection, medicines table populated |
| Search medicines | Full-text search working, indexed correctly |
| Create order | Order saved to DB, items array formatted correctly |
| Fetch order history | RLS policies working, patient sees only their orders |

### Admin Management
| Test | Validates |
|------|-----------|
| Fetch all orders | Admin can query all orders, patient data joined correctly |
| Update status | Status transitions working, changes persist |
| Reject unauthorized | Middleware blocking non-admin users |

### Generic Search
| Test | Validates |
|------|-----------|
| Find by brand | ILIKE queries working |
| Find by generic | Generic name column searchable |
| Sort by price | Ordering logic correct (generics appear first when searching) |

## Success Criteria

### Must Pass (Critical)
- [x] Patient can search and find medicines
- [x] Cart total calculates correctly (not ₹0)
- [x] Orders save to database
- [x] Admin can view all orders
- [x] Admin can update order status
- [x] Security: Patients can't access admin routes

### Should Pass (Important)
- [x] Generic medicine search works
- [x] AI service integration (or graceful fallback)
- [x] Order history displays correctly
- [x] RLS policies enforced

### Nice to Have (Optional)
- [ ] Performance under load (use separate load testing tools)
- [ ] Mobile responsiveness (use Playwright/Cypress for UI tests)
- [ ] Print receipt functionality

## Next Steps

1. **Run Integration Tests First**
   ```bash
   cd backend
   node tests/integration.test.js
   ```
   This gives you a quick overview of all workflows.

2. **Run Full Jest Suite**
   ```bash
   npm test
   ```
   For detailed unit and API testing.

3. **Fix Any Failures**
   - Red tests indicate broken functionality
   - Check error messages for specific issues

4. **Generate Coverage Report**
   ```bash
   npm run test:coverage
   ```
   Aim for >80% coverage on critical routes.

5. **Integrate into CI/CD**
   - Add test running to your deployment pipeline
   - Block merges if tests fail

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test output for specific error messages
3. Verify environment variables and database state
4. Ensure all seeding scripts have been run

---

**Happy Testing! 🧪✨**
