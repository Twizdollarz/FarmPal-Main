/**
 * FarmPal Production Security Milestone Automated Verification Suite
 * Tests TASK 1 through TASK 8:
 * 1. Unauthenticated request -> 401
 * 2. Authenticated Farmer A -> can access Farmer A data
 * 3. Authenticated Farmer B -> cannot access Farmer A data
 * 4. Farmer B cannot modify Farmer A crop
 * 5. Farmer B cannot delete Farmer A expense
 * 6. Farmer B cannot collect Farmer A debtor payment
 * 7. Client-supplied userId is ignored
 * 8. Financial analytics only contain the authenticated farmer's records
 * 9. Production environment blocks destructive test/reset endpoints
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FARMER_A_TOKEN = 'test-token-farmer-1';
const FARMER_B_TOKEN = 'test-token-farmer-b-test';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('====================================================');
  console.log('🔒 FarmPal Security Milestone Verification Suite');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // Health check first
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (!healthRes.ok) throw new Error(`Health check returned ${healthRes.status}`);
    console.log('✓ Health check endpoint responding (Public)\n');
  } catch (err: any) {
    console.error('❌ Server is not reachable at', BASE_URL, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 1: Unauthenticated request -> 401
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/crops`);
    const passed = res.status === 401;
    results.push({
      num: 1,
      name: 'Unauthenticated request -> 401',
      passed,
      details: `GET /api/crops without token returned HTTP ${res.status} (expected 401)`,
    });
  } catch (e: any) {
    results.push({ num: 1, name: 'Unauthenticated request -> 401', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 2: Authenticated Farmer A -> can access Farmer A data
  // -------------------------------------------------------------------------
  let farmerACropId = '';
  let farmerAExpenseId = '';
  let farmerASaleId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/crops`, {
      headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
    });
    const crops = await res.json();
    const passed = res.status === 200 && Array.isArray(crops) && crops.length > 0;
    if (passed && crops[0]) {
      farmerACropId = crops[0].id;
    }

    // Get an expense of Farmer A
    const expRes = await fetch(`${BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
    });
    const expenses = await expRes.json();
    if (Array.isArray(expenses) && expenses.length > 0) {
      farmerAExpenseId = expenses[0].id;
    }

    // Get a sale of Farmer A
    const salesRes = await fetch(`${BASE_URL}/api/sales`, {
      headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
    });
    const sales = await salesRes.json();
    if (Array.isArray(sales) && sales.length > 0) {
      farmerASaleId = sales[0].id;
    }

    results.push({
      num: 2,
      name: 'Authenticated Farmer A -> can access Farmer A data',
      passed,
      details: `Farmer A retrieved ${crops.length} crops. Crop ID: ${farmerACropId}, Expense ID: ${farmerAExpenseId}, Sale ID: ${farmerASaleId}`,
    });
  } catch (e: any) {
    results.push({ num: 2, name: 'Authenticated Farmer A -> can access Farmer A data', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 3: Authenticated Farmer B -> cannot access Farmer A data
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/crops`, {
      headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
    });
    const crops = await res.json();
    // Farmer B should not see Farmer A's crops
    const containsFarmerACrops = Array.isArray(crops) && crops.some((c: any) => c.userId === 'farmer-1');
    const passed = res.status === 200 && Array.isArray(crops) && !containsFarmerACrops;
    results.push({
      num: 3,
      name: 'Authenticated Farmer B -> cannot access Farmer A data',
      passed,
      details: `Farmer B received ${crops.length} crops. Zero Farmer A crops exposed (containsFarmerACrops: ${containsFarmerACrops})`,
    });
  } catch (e: any) {
    results.push({ num: 3, name: 'Authenticated Farmer B -> cannot access Farmer A data', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 4: Farmer B cannot modify Farmer A crop
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/crops/${farmerACropId}/finish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
    });
    // Should be 404 Not Found (or 403 Forbidden)
    const passed = res.status === 404 || res.status === 403;
    results.push({
      num: 4,
      name: 'Farmer B cannot modify Farmer A crop',
      passed,
      details: `Farmer B attempted to finish Farmer A crop (${farmerACropId}): HTTP ${res.status} (expected 404/403)`,
    });
  } catch (e: any) {
    results.push({ num: 4, name: 'Farmer B cannot modify Farmer A crop', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 5: Farmer B cannot delete Farmer A expense
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/expenses/${farmerAExpenseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
    });
    const passed = res.status === 404 || res.status === 403;
    results.push({
      num: 5,
      name: 'Farmer B cannot delete Farmer A expense',
      passed,
      details: `Farmer B attempted to delete Farmer A expense (${farmerAExpenseId}): HTTP ${res.status} (expected 404/403)`,
    });
  } catch (e: any) {
    results.push({ num: 5, name: 'Farmer B cannot delete Farmer A expense', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 6: Farmer B cannot collect Farmer A debtor payment
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/sales/${farmerASaleId}/collect-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_B_TOKEN}`,
      },
      body: JSON.stringify({ amountCollected: 50000, notes: 'Malicious collection attempt' }),
    });
    const passed = res.status === 404 || res.status === 403;
    results.push({
      num: 6,
      name: 'Farmer B cannot collect Farmer A debtor payment',
      passed,
      details: `Farmer B attempted to collect payment on Farmer A sale (${farmerASaleId}): HTTP ${res.status} (expected 404/403)`,
    });
  } catch (e: any) {
    results.push({ num: 6, name: 'Farmer B cannot collect Farmer A debtor payment', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 7: Client-supplied userId is ignored
  // -------------------------------------------------------------------------
  try {
    // Farmer B tries to create a crop with userId: 'farmer-1' (Farmer A) in body
    const cropRes = await fetch(`${BASE_URL}/api/crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_B_TOKEN}`,
      },
      body: JSON.stringify({
        name: 'Spoofed Wheat Plot',
        farmSizeAcres: 3,
        userId: 'farmer-1', // Malicious client attempt
      }),
    });
    const cropData = await cropRes.json();
    const passed = cropRes.status === 201 && cropData.userId === 'farmer-b-test' && cropData.userId !== 'farmer-1';
    results.push({
      num: 7,
      name: 'Client-supplied userId is ignored',
      passed,
      details: `Farmer B sent { userId: 'farmer-1' }; created record assigned userId='${cropData.userId}'`,
    });
  } catch (e: any) {
    results.push({ num: 7, name: 'Client-supplied userId is ignored', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 8: Financial analytics only contain the authenticated farmer's records
  // -------------------------------------------------------------------------
  try {
    const finRes = await fetch(`${BASE_URL}/api/financials`, {
      headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
    });
    const finData = await finRes.json();
    // Farmer B has 1 newly created crop with 0 expenses and 0 sales
    const earned = finData.farmSummary?.totalEarned || 0;
    const spent = finData.farmSummary?.totalSpent || 0;
    // Farmer A has over 2,000,000 revenue. If Farmer B's summary is isolated, earned should be 0.
    const passed = finRes.status === 200 && earned === 0 && spent === 0;
    results.push({
      num: 8,
      name: 'Financial analytics only contain the authenticated farmer’s records',
      passed,
      details: `Farmer B financials: Total Earned = ₦${earned}, Total Spent = ₦${spent}. Fully isolated from Farmer A.`,
    });
  } catch (e: any) {
    results.push({ num: 8, name: 'Financial analytics only contain the authenticated farmer’s records', passed: false, details: e.message });
  }

  // -------------------------------------------------------------------------
  // TEST 9: Production environment blocks destructive test/reset endpoints
  // -------------------------------------------------------------------------
  try {
    // When NODE_ENV=production, requireDevOnly returns 403
    // We can simulate this check by verifying requireDevOnly middleware functionality directly
    const { requireDevOnly } = await import('../src/middleware/auth.ts');
    let blockedInProd = false;
    const fakeReq: any = {};
    const fakeRes: any = {
      statusCode: 200,
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = data;
        return this;
      },
    };
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    requireDevOnly(fakeReq, fakeRes, () => {});
    blockedInProd = fakeRes.statusCode === 403;
    process.env.NODE_ENV = prevEnv;

    results.push({
      num: 9,
      name: 'Production environment blocks destructive test/reset endpoints',
      passed: blockedInProd,
      details: `requireDevOnly in NODE_ENV=production returned HTTP ${fakeRes.statusCode}: "${fakeRes.body?.error || ''}"`,
    });
  } catch (e: any) {
    results.push({ num: 9, name: 'Production environment blocks destructive test/reset endpoints', passed: false, details: e.message });
  }

  // Print Summary Table
  console.log('--------------------------------------------------------------------------------');
  console.log('| # | Test Scenario                                             | Result | Status |');
  console.log('--------------------------------------------------------------------------------');
  for (const r of results) {
    const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.num} | ${r.name.padEnd(57, ' ')} | ${statusIcon} |`);
    console.log(`    ↳ ${r.details}`);
  }
  console.log('--------------------------------------------------------------------------------');

  const allPassed = results.every((r) => r.passed);
  if (allPassed) {
    console.log('\n🎉 ALL 9 PRODUCTION SECURITY TEST SCENARIOS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('\n⚠️ Some security test scenarios failed.\n');
    process.exit(1);
  }
}

runTests();
