/**
 * Comprehensive Automated Verification Suite for FarmPal Persistence Milestone P1
 * Tests:
 * 1. Profiles (create/update, two-user isolation, restart persistence)
 * 2. Expenses (create, read, delete with SQL delete, restart persistence of deletion, isolation)
 * 3. Labour (create, read, restart persistence, isolation)
 * 4. Harvest (create, read, restart persistence, isolation)
 * 5. Debtor Payments (create sale, collect payment, SQL persistence, restart persistence, balance check)
 * 6. WhatsApp Actions (create expense via WhatsApp, create sale via WhatsApp, restart persistence)
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FARMER_A_TOKEN = 'test-token-farmer-p1-alpha';
const FARMER_B_TOKEN = 'test-token-farmer-p1-beta';
const STATE_FILE = path.join(process.cwd(), 'scripts', '.p1-test-state.json');

async function phase1() {
  console.log('====================================================');
  console.log('🧪 P1 PERSISTENCE TEST - PHASE 1: PRE-RESTART');
  console.log('====================================================\n');

  // 1. Profile: Update Farmer A and Farmer B profiles
  console.log('1. Testing Farmer Profiles...');
  const profARes = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({ name: 'Alhaji Alpha Farmer', location: 'Zaria, Kaduna', phone: '+234 801 111 2222' }),
  });
  const profA = await profARes.json();

  const profBRes = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_B_TOKEN}` },
    body: JSON.stringify({ name: 'Chief Beta Farmer', location: 'Oyo, Nigeria', phone: '+234 802 333 4444' }),
  });
  const profB = await profBRes.json();

  console.log('   Farmer A Profile:', profA.name, `(${profA.location})`);
  console.log('   Farmer B Profile:', profB.name, `(${profB.location})`);

  // Verify initial read & isolation
  const getProfA = await (await fetch(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const getProfB = await (await fetch(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  if (getProfA.name !== 'Alhaji Alpha Farmer' || getProfB.name !== 'Chief Beta Farmer') {
    throw new Error('Profile setup verification failed');
  }

  // 2. Crops for Farmer A (base for other records)
  console.log('\n2. Creating Crop for Farmer A...');
  const cropRes = await fetch(`${BASE_URL}/api/crops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({ name: 'P1 Maize Pioneer', variety: 'Oba Super 2', farmSizeAcres: 5.0 }),
  });
  const cropA = await cropRes.json();
  console.log('   Created Crop A:', cropA.id, cropA.name);

  // 3. Expenses: Create 2 expenses (one to keep, one to delete)
  console.log('\n3. Testing Expenses (Create & Delete)...');
  const expKeepRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      categoryId: 'cat-fertilizer',
      categoryName: 'Fertilizer',
      totalAmount: 60000,
      cropId: cropA.id,
      description: 'DAP Fertilizer 50kg Bags',
    }),
  });
  const expKeep = await expKeepRes.json();

  const expDelRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      categoryId: 'cat-fuel',
      categoryName: 'Fuel',
      totalAmount: 15000,
      cropId: cropA.id,
      description: 'Accidental Duplicate Fuel Expense',
    }),
  });
  const expDel = await expDelRes.json();
  console.log('   Created Expense to Keep:', expKeep.id, `₦${expKeep.totalAmount}`);
  console.log('   Created Expense to Delete:', expDel.id, `₦${expDel.totalAmount}`);

  // Delete expDel
  const delRes = await fetch(`${BASE_URL}/api/expenses/${expDel.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  const delJson = await delRes.json();
  console.log('   Deleted Expense status:', delRes.status, delJson.id);

  // Verify deletion immediately
  const curExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const keepFound = curExp.some((e: any) => e.id === expKeep.id);
  const delFound = curExp.some((e: any) => e.id === expDel.id);
  console.log(`   Verification pre-restart: Keep present: ${keepFound}, Deleted absent: ${!delFound}`);
  if (!keepFound || delFound) throw new Error('Expense delete verification failed pre-restart');

  // 4. Labour: Create Labour record for Farmer A
  console.log('\n4. Testing Labour Persistence...');
  const labRes = await fetch(`${BASE_URL}/api/labour`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      cropId: cropA.id,
      workType: 'Land clearing and ridging',
      workerCount: 4,
      amountPaid: 28000,
      labourDate: '2026-09-25',
      description: '4 workers for ridging',
    }),
  });
  const labJson = await labRes.json();
  const labA = labJson.labour;
  console.log('   Created Labour Record:', labA.id, `₦${labA.amountPaid} for ${labA.workType}`);

  // 5. Harvest: Create Harvest record for Farmer A
  console.log('\n5. Testing Harvest Persistence...');
  const harvRes = await fetch(`${BASE_URL}/api/harvest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      cropId: cropA.id,
      quantity: 120,
      unit: 'bags',
      qualityGrade: 'Grade A',
      notes: 'First bumper harvest of Oba Super 2',
    }),
  });
  const harvA = await harvRes.json();
  console.log('   Created Harvest Record:', harvA.id, `${harvA.quantity} ${harvA.unit}`);

  // 6. Debtor Sale & Payment:
  console.log('\n6. Testing Debtor Sale and Payment Collection...');
  const saleRes = await fetch(`${BASE_URL}/api/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      cropId: cropA.id,
      quantitySold: 50,
      unit: 'bags',
      pricePerUnit: 6000, // Total = 300,000
      buyerName: 'Hajiya Halima Grains',
      paymentStatus: 'credit',
      amountPaid: 0,
      amountDue: 300000,
      dueDate: '2026-10-30',
    }),
  });
  const saleA = await saleRes.json();
  console.log('   Created Debtor Sale:', saleA.id, `Total: ₦${saleA.totalRevenue}, Due: ₦${saleA.amountDue}`);

  // Collect partial payment of 120,000
  const collectRes = await fetch(`${BASE_URL}/api/sales/${saleA.id}/collect-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({ amountCollected: 120000, notes: 'Bank transfer instalment 1' }),
  });
  const collectJson = await collectRes.json();
  console.log('   Collected Payment:', collectJson.message);
  console.log('   Updated Sale in Response:', `Paid: ₦${collectJson.sale.amountPaid}, Due: ₦${collectJson.sale.amountDue}, Status: ${collectJson.sale.paymentStatus}`);

  // 7. WhatsApp Actions:
  console.log('\n7. Testing WhatsApp Action Persistence...');
  const waExpRes = await fetch(`${BASE_URL}/api/whatsapp/execute-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      actionType: 'confirm_expenses',
      data: {
        expenses: [
          {
            category: 'Chemicals',
            amount: 18500,
            description: 'Uproot weed spray logged via WhatsApp',
            cropId: cropA.id,
          },
        ],
      },
    }),
  });
  const waExpJson = await waExpRes.json();
  console.log('   WhatsApp Expense Action Result:', waExpJson.message);

  const waSaleRes = await fetch(`${BASE_URL}/api/whatsapp/execute-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      actionType: 'confirm_sale',
      data: {
        cropId: cropA.id,
        cropName: cropA.name,
        quantitySold: 10,
        unit: 'bags',
        pricePerUnit: 6500,
        totalRevenue: 65000,
        buyerName: 'Ibrahim Retailer (WhatsApp)',
      },
    }),
  });
  const waSaleJson = await waSaleRes.json();
  console.log('   WhatsApp Sale Action Result:', waSaleJson.message);

  // Retrieve current records for Farmer A to find the created WhatsApp IDs
  const allExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const waExp = allExp.find((e: any) => e.description === 'Uproot weed spray logged via WhatsApp');
  if (!waExp) throw new Error('WhatsApp expense not found in ledger pre-restart');

  const allSales = await (await fetch(`${BASE_URL}/api/sales`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const waSale = allSales.find((s: any) => s.buyerName === 'Ibrahim Retailer (WhatsApp)');
  if (!waSale) throw new Error('WhatsApp sale not found in ledger pre-restart');

  // 8. Verify Farmer B cannot access any Farmer A records
  console.log('\n8. Checking Pre-Restart Isolation (Farmer B should see 0 of Farmer A records)...');
  const bCrops = await (await fetch(`${BASE_URL}/api/crops`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bLab = await (await fetch(`${BASE_URL}/api/labour`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bHarv = await (await fetch(`${BASE_URL}/api/harvest`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bSales = await (await fetch(`${BASE_URL}/api/sales`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();

  const bSeesACrop = bCrops.some((c: any) => c.id === cropA.id);
  const bSeesAExp = bExp.some((e: any) => e.id === expKeep.id || e.id === waExp.id);
  const bSeesALab = bLab.some((l: any) => l.id === labA.id);
  const bSeesAHarv = bHarv.some((h: any) => h.id === harvA.id);
  const bSeesASale = bSales.some((s: any) => s.id === saleA.id || s.id === waSale.id);

  console.log(`   Farmer B sees Crop A: ${bSeesACrop}`);
  console.log(`   Farmer B sees Expense A: ${bSeesAExp}`);
  console.log(`   Farmer B sees Labour A: ${bSeesALab}`);
  console.log(`   Farmer B sees Harvest A: ${bSeesAHarv}`);
  console.log(`   Farmer B sees Sale A: ${bSeesASale}`);

  if (bSeesACrop || bSeesAExp || bSeesALab || bSeesAHarv || bSeesASale) {
    throw new Error('Isolation check failed pre-restart!');
  }

  // Save state for Phase 2 verification
  const state = {
    farmerA: {
      profileName: 'Alhaji Alpha Farmer',
      profileLocation: 'Zaria, Kaduna',
      cropId: cropA.id,
      expKeepId: expKeep.id,
      expDelId: expDel.id,
      labourId: labA.id,
      harvestId: harvA.id,
      saleId: saleA.id,
      paymentId: collectJson.payment?.id,
      waExpId: waExp.id,
      waSaleId: waSale.id,
    },
    farmerB: {
      profileName: 'Chief Beta Farmer',
      profileLocation: 'Oyo, Nigeria',
    },
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('\n✅ Phase 1 complete. Saved state to:', STATE_FILE);
}

async function phase2() {
  console.log('====================================================');
  console.log('🧪 P1 PERSISTENCE TEST - PHASE 2: POST-RESTART');
  console.log('====================================================\n');

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error('State file not found. Run phase 1 first.');
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const { farmerA, farmerB } = state;

  const results: { test: string; passed: boolean; details: string }[] = [];

  // TEST 1: Farmer Profiles after restart
  console.log('1. Verifying Profiles After Restart...');
  const profA = await (await fetch(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const profB = await (await fetch(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();

  const profAPassed = profA.name === farmerA.profileName && profA.location === farmerA.profileLocation;
  const profBPassed = profB.name === farmerB.profileName && profB.location === farmerB.profileLocation;
  const profIsolation = profA.id !== profB.id && profA.name !== profB.name;

  results.push({
    test: 'Farmer A Profile survived restart',
    passed: profAPassed,
    details: `Expected: ${farmerA.profileName} (${farmerA.profileLocation}), Actual: ${profA.name} (${profA.location})`,
  });
  results.push({
    test: 'Farmer B Profile survived restart',
    passed: profBPassed,
    details: `Expected: ${farmerB.profileName} (${farmerB.profileLocation}), Actual: ${profB.name} (${profB.location})`,
  });
  results.push({
    test: 'Two-user profile isolation preserved',
    passed: profIsolation,
    details: `Farmer A (${profA.id}) != Farmer B (${profB.id})`,
  });

  // TEST 2: Expenses after restart (Keep survives, Delete stays deleted)
  console.log('\n2. Verifying Expenses After Restart...');
  const aExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const keepSurvived = aExp.some((e: any) => e.id === farmerA.expKeepId);
  const delRemainsDeleted = !aExp.some((e: any) => e.id === farmerA.expDelId);

  results.push({
    test: 'Created expense survived restart',
    passed: keepSurvived,
    details: `Expense ${farmerA.expKeepId} present in ledger: ${keepSurvived}`,
  });
  results.push({
    test: 'Deleted expense NOT resurrected on restart (SQL DELETE verified)',
    passed: delRemainsDeleted,
    details: `Deleted expense ${farmerA.expDelId} absent from ledger: ${delRemainsDeleted}`,
  });

  // TEST 3: Labour after restart
  console.log('\n3. Verifying Labour After Restart...');
  const aLab = await (await fetch(`${BASE_URL}/api/labour`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const labSurvived = aLab.some((l: any) => l.id === farmerA.labourId);
  results.push({
    test: 'Labour record survived restart',
    passed: labSurvived,
    details: `Labour ${farmerA.labourId} present: ${labSurvived}`,
  });

  // TEST 4: Harvest after restart
  console.log('\n4. Verifying Harvest After Restart...');
  const aHarv = await (await fetch(`${BASE_URL}/api/harvest`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const harvSurvived = aHarv.some((h: any) => h.id === farmerA.harvestId);
  results.push({
    test: 'Harvest record survived restart',
    passed: harvSurvived,
    details: `Harvest ${farmerA.harvestId} present: ${harvSurvived}`,
  });

  // TEST 5: Debtor Sale & Partial Payment after restart
  console.log('\n5. Verifying Debtor Payment & Balance After Restart...');
  const aSales = await (await fetch(`${BASE_URL}/api/sales`, { headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` } })).json();
  const saleRecord = aSales.find((s: any) => s.id === farmerA.saleId);

  const saleSurvived = !!saleRecord;
  const balanceCorrect = saleRecord ? saleRecord.amountPaid === 120000 && saleRecord.amountDue === 180000 && saleRecord.paymentStatus === 'partial' : false;

  results.push({
    test: 'Debtor sale record survived restart',
    passed: saleSurvived,
    details: `Sale ${farmerA.saleId} present: ${saleSurvived}`,
  });
  results.push({
    test: 'Debtor payment balance preserved in PostgreSQL after restart',
    passed: balanceCorrect,
    details: saleRecord ? `Paid: ₦${saleRecord.amountPaid} (expected 120,000), Due: ₦${saleRecord.amountDue} (expected 180,000), Status: ${saleRecord.paymentStatus}` : 'Sale not found',
  });

  // TEST 6: WhatsApp Actions after restart
  console.log('\n6. Verifying WhatsApp Actions After Restart...');
  const waExpSurvived = aExp.some((e: any) => e.id === farmerA.waExpId);
  const waSaleSurvived = aSales.some((s: any) => s.id === farmerA.waSaleId);

  results.push({
    test: 'WhatsApp-created expense survived restart',
    passed: waExpSurvived,
    details: `WhatsApp Expense ${farmerA.waExpId} present: ${waExpSurvived}`,
  });
  results.push({
    test: 'WhatsApp-created sale survived restart',
    passed: waSaleSurvived,
    details: `WhatsApp Sale ${farmerA.waSaleId} present: ${waSaleSurvived}`,
  });

  // TEST 7: Farmer B isolation after restart
  console.log('\n7. Verifying Multi-Tenant Isolation After Restart...');
  const bCrops = await (await fetch(`${BASE_URL}/api/crops`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bLab = await (await fetch(`${BASE_URL}/api/labour`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bHarv = await (await fetch(`${BASE_URL}/api/harvest`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bSales = await (await fetch(`${BASE_URL}/api/sales`, { headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` } })).json();

  const bSeesACrop = bCrops.some((c: any) => c.id === farmerA.cropId);
  const bSeesAExp = bExp.some((e: any) => e.id === farmerA.expKeepId || e.id === farmerA.waExpId);
  const bSeesALab = bLab.some((l: any) => l.id === farmerA.labourId);
  const bSeesAHarv = bHarv.some((h: any) => h.id === farmerA.harvestId);
  const bSeesASale = bSales.some((s: any) => s.id === farmerA.saleId || s.id === farmerA.waSaleId);

  const isolationPassed = !bSeesACrop && !bSeesAExp && !bSeesALab && !bSeesAHarv && !bSeesASale;

  results.push({
    test: 'Farmer B zero cross-tenant leakage after restart',
    passed: isolationPassed,
    details: `Farmer B sees: Crop=${bSeesACrop}, Expense=${bSeesAExp}, Labour=${bSeesALab}, Harvest=${bSeesAHarv}, Sale=${bSeesASale}`,
  });

  // Print Summary Table
  console.log('\n================================================================================');
  console.log('| # | Test Description                                     | Result |');
  console.log('================================================================================');
  results.forEach((r, idx) => {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${(idx + 1).toString().padEnd(2)}| ${r.test.padEnd(52)}| ${icon} |`);
    console.log(`    ↳ ${r.details}`);
  });
  console.log('================================================================================\n');

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    console.error('❌ SOME P1 PERSISTENCE TESTS FAILED!');
    process.exit(1);
  }
  console.log('🎉 ALL P1 PERSISTENCE AND RESTART TESTS PASSED SUCCESSFULLY!\n');
}

async function main() {
  const mode = process.argv[2] || 'phase1';
  if (mode === 'phase1') {
    await phase1();
  } else if (mode === 'phase2') {
    await phase2();
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
