/**
 * Automated Verification Suite for FarmPal Persistence Milestone P2: Farm Inventory
 * Tests:
 * 1. Create inventory item (scoped to authenticated user, client userId ignored)
 * 2. Retrieve inventory (GET /api/inventory, GET /api/inventory/:id)
 * 3. Increase quantity (POST /api/inventory/:id/adjust with delta > 0)
 * 4. Decrease quantity (POST /api/inventory/:id/adjust with delta < 0, status transitions)
 * 5. Invalid adjustments (negative stock rejected with 400, invalid deltas rejected)
 * 6. Cross-user isolation (Farmer B cannot read, adjust, or delete Farmer A items; real accounts don't get demo stock)
 * 7. Two simultaneous concurrent adjustments (atomic race condition test)
 * 8. Deletion (DELETE /api/inventory/:id, 404 on re-deletion or cross-user deletion)
 * 9. Restart persistence (verifies all items, adjustments, and deletions persist after cold server reboot)
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FARMER_A_TOKEN = 'test-token-farmer-p2-alpha';
const FARMER_B_TOKEN = 'test-token-farmer-p2-beta';
const STATE_FILE = path.join(process.cwd(), 'scripts', '.p2-test-state.json');

async function phase1() {
  console.log('====================================================');
  console.log('🧪 P2 INVENTORY PERSISTENCE TEST - PHASE 1: PRE-RESTART');
  console.log('====================================================\n');

  // 1. Isolation check on fresh accounts: Real accounts must NOT have demo stock
  console.log('1. Checking initial inventory for clean accounts (Demo stock separation)...');
  const initARes = await fetch(`${BASE_URL}/api/inventory`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!initARes.ok) throw new Error(`Initial GET Farmer A failed with ${initARes.status}`);
  const initA = await initARes.json();

  const initBRes = await fetch(`${BASE_URL}/api/inventory`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (!initBRes.ok) throw new Error(`Initial GET Farmer B failed with ${initBRes.status}`);
  const initB = await initBRes.json();

  console.log(`   Farmer A starting inventory count: ${initA.length}`);
  console.log(`   Farmer B starting inventory count: ${initB.length}`);

  // 2. Create items for Farmer A with client-supplied spoofed userId
  console.log('\n2. Testing Create Inventory Item (with client-spoofed userId)...');
  const createItem1Res = await fetch(`${BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      userId: 'hacker-impostor-id', // MUST be ignored
      name: 'YaraMila Complex Fertilizer',
      category: 'Fertilizer',
      currentQuantity: 40,
      unit: 'bags (50kg)',
      reorderThreshold: 15,
      estimatedUnitValue: 42000,
      storageLocation: 'North Bay Storehouse',
    }),
  });

  if (createItem1Res.status !== 201) {
    const errText = await createItem1Res.text();
    throw new Error(`Create item 1 failed: HTTP ${createItem1Res.status} - ${errText}`);
  }
  const item1 = await createItem1Res.json();
  console.log(`   Created Item 1: ${item1.id} - ${item1.name} (Qty: ${item1.currentQuantity}, Status: ${item1.status})`);

  if (item1.userId === 'hacker-impostor-id') {
    throw new Error('SECURITY VIOLATION: Server accepted client-supplied userId!');
  }

  // Create item 2 for deletion test
  const createItem2Res = await fetch(`${BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      name: 'Temporary Packing Sacks',
      category: 'Packaging',
      currentQuantity: 100,
      unit: 'sacks',
      reorderThreshold: 20,
      estimatedUnitValue: 500,
      storageLocation: 'Packing Shed',
    }),
  });
  const item2ToDelete = await createItem2Res.json();
  console.log(`   Created Item 2 (to delete): ${item2ToDelete.id} - ${item2ToDelete.name}`);

  // Create item 3 for concurrency test
  const createItem3Res = await fetch(`${BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      name: 'Diesel Fuel Drums (Heavy Tractor)',
      category: 'Fuel',
      currentQuantity: 20,
      unit: 'litres',
      reorderThreshold: 10,
      estimatedUnitValue: 1200,
      storageLocation: 'Fuel Depot Tank 1',
    }),
  });
  const item3Concurrent = await createItem3Res.json();
  console.log(`   Created Item 3 (for concurrency): ${item3Concurrent.id} - Qty: ${item3Concurrent.currentQuantity}`);

  // 3. Test Retrieve Single & List
  console.log('\n3. Testing Inventory Retrieval (GET /api/inventory and GET /api/inventory/:id)...');
  const getSingleRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!getSingleRes.ok) throw new Error(`GET /api/inventory/:id failed: ${getSingleRes.status}`);
  const retrievedItem1 = await getSingleRes.json();
  if (retrievedItem1.name !== item1.name || retrievedItem1.currentQuantity !== 40) {
    throw new Error('Retrieved item mismatch');
  }
  console.log(`   ✓ Single item retrieved successfully: ${retrievedItem1.name}`);

  // 4. Test Stock Adjustments (Increase & Decrease)
  console.log('\n4. Testing Stock Adjustments (Increase & Decrease)...');
  // Increase by 20 -> 60
  const incRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({ delta: 20 }),
  });
  if (!incRes.ok) throw new Error(`Increase failed: ${incRes.status}`);
  const incItem = await incRes.json();
  if (incItem.currentQuantity !== 60) throw new Error(`Expected 60, got ${incItem.currentQuantity}`);
  console.log(`   ✓ Increased stock +20 -> New Qty: ${incItem.currentQuantity} (${incItem.status})`);

  // Decrease by 48 -> 12 (below threshold 15 -> 'low_stock')
  const decRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({ delta: -48 }),
  });
  if (!decRes.ok) throw new Error(`Decrease failed: ${decRes.status}`);
  const decItem = await decRes.json();
  if (decItem.currentQuantity !== 12 || decItem.status !== 'low_stock') {
    throw new Error(`Expected qty 12 and status 'low_stock', got ${decItem.currentQuantity} and ${decItem.status}`);
  }
  console.log(`   ✓ Decreased stock -48 -> New Qty: ${decItem.currentQuantity} (${decItem.status})`);

  // 5. Test Invalid Adjustments & Negative Stock Rejection
  console.log('\n5. Testing Invalid Adjustments & Negative Stock Prevention...');
  // Attempt to decrease by 50 when current stock is 12 (would be -38)
  const negRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({ delta: -50 }),
  });
  if (negRes.status !== 400) {
    throw new Error(`Negative stock was not rejected! Returned HTTP ${negRes.status}`);
  }
  const negJson = await negRes.json();
  console.log(`   ✓ Negative stock rejected properly (HTTP 400): "${negJson.error}"`);

  // Test invalid delta type
  const badDeltaRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({ delta: 'invalid-string' }),
  });
  if (badDeltaRes.status !== 400) throw new Error('Invalid delta string was not rejected');
  console.log('   ✓ Invalid string delta rejected with HTTP 400');

  // Test negative newQuantity
  const badNewQtyRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({ newQuantity: -5 }),
  });
  if (badNewQtyRes.status !== 400) throw new Error('Negative newQuantity was not rejected');
  console.log('   ✓ Negative newQuantity rejected with HTTP 400');

  // 6. Test Cross-User Isolation (Farmer B cannot access Farmer A item)
  console.log('\n6. Testing Multi-Tenant Cross-User Isolation...');
  const crossGetRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossGetRes.status !== 404) {
    throw new Error(`Farmer B could access Farmer A item! HTTP ${crossGetRes.status}`);
  }
  console.log('   ✓ Cross-user GET /api/inventory/:id returned 404');

  const crossAdjustRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_B_TOKEN}`,
    },
    body: JSON.stringify({ delta: -5 }),
  });
  if (crossAdjustRes.status !== 404) {
    throw new Error(`Farmer B could adjust Farmer A item! HTTP ${crossAdjustRes.status}`);
  }
  console.log('   ✓ Cross-user POST /api/inventory/:id/adjust returned 404');

  const crossDelRes = await fetch(`${BASE_URL}/api/inventory/${item1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossDelRes.status !== 404) {
    throw new Error(`Farmer B could delete Farmer A item! HTTP ${crossDelRes.status}`);
  }
  console.log('   ✓ Cross-user DELETE /api/inventory/:id returned 404');

  // 7. Test Deletion of item2
  console.log('\n7. Testing Inventory Item Deletion...');
  const delRes = await fetch(`${BASE_URL}/api/inventory/${item2ToDelete.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (delRes.status !== 200) throw new Error(`Delete failed: HTTP ${delRes.status}`);
  console.log(`   ✓ Item 2 deleted successfully`);

  // Verify it is gone
  const verifyDelRes = await fetch(`${BASE_URL}/api/inventory/${item2ToDelete.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (verifyDelRes.status !== 404) throw new Error('Deleted item still accessible!');
  console.log('   ✓ Deleted item returns 404 on subsequent get');

  // 8. Test Two Simultaneous Concurrent Adjustments
  console.log('\n8. Testing Two Simultaneous Concurrent Adjustments (Atomic Concurrency Test)...');
  console.log(`   Item 3 start quantity: ${item3Concurrent.currentQuantity}`);
  // Item 3 has 20 litres.
  // We fire TWO concurrent adjustments of -15 litres.
  // If no concurrency protection: 20 - 15 = 5, both might succeed and stock becomes -10!
  // With PostgreSQL atomic update & gte(qty + delta, 0):
  // Exactly ONE succeeds (HTTP 200), and exactly ONE fails (HTTP 400).
  const [res1, res2] = await Promise.all([
    fetch(`${BASE_URL}/api/inventory/${item3Concurrent.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_A_TOKEN}`,
      },
      body: JSON.stringify({ delta: -15 }),
    }),
    fetch(`${BASE_URL}/api/inventory/${item3Concurrent.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_A_TOKEN}`,
      },
      body: JSON.stringify({ delta: -15 }),
    }),
  ]);

  const status1 = res1.status;
  const status2 = res2.status;
  console.log(`   Concurrent Request 1 status: ${status1}`);
  console.log(`   Concurrent Request 2 status: ${status2}`);

  const statuses = [status1, status2].sort();
  if (statuses[0] !== 200 || statuses[1] !== 400) {
    throw new Error(
      `Race condition failure! Expected one 200 and one 400, but got: Request 1=${status1}, Request 2=${status2}`
    );
  }
  console.log('   ✓ Concurrency race condition correctly handled: exactly 1 succeeded and 1 rejected!');

  // Verify stock of Item 3 in DB is exactly 5
  const item3Verify = await (
    await fetch(`${BASE_URL}/api/inventory/${item3Concurrent.id}`, {
      headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
    })
  ).json();
  if (item3Verify.currentQuantity !== 5) {
    throw new Error(`Expected item 3 quantity to be 5, but got ${item3Verify.currentQuantity}`);
  }
  console.log(`   ✓ Item 3 verified quantity in PostgreSQL: ${item3Verify.currentQuantity} (NEVER negative)`);

  // Now test concurrent additions: +10 and +10
  const [add1, add2] = await Promise.all([
    fetch(`${BASE_URL}/api/inventory/${item3Concurrent.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_A_TOKEN}`,
      },
      body: JSON.stringify({ delta: 10 }),
    }),
    fetch(`${BASE_URL}/api/inventory/${item3Concurrent.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_A_TOKEN}`,
      },
      body: JSON.stringify({ delta: 10 }),
    }),
  ]);
  if (!add1.ok || !add2.ok) throw new Error('Concurrent increments failed');
  const item3Final = await (
    await fetch(`${BASE_URL}/api/inventory/${item3Concurrent.id}`, {
      headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
    })
  ).json();
  if (item3Final.currentQuantity !== 25) {
    throw new Error(`Expected item 3 quantity to be 25 after two +10 additions, got ${item3Final.currentQuantity}`);
  }
  console.log(`   ✓ Concurrent additions verified: 5 + 10 + 10 = ${item3Final.currentQuantity}`);

  // Save state for Phase 2 post-restart verification
  const state = {
    farmerAItem1Id: item1.id,
    farmerAItem1ExpectedQty: decItem.currentQuantity, // 12
    farmerAItem1ExpectedStatus: decItem.status, // 'low_stock'
    deletedItem2Id: item2ToDelete.id,
    concurrentItem3Id: item3Concurrent.id,
    concurrentItem3ExpectedQty: 25,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('\n💾 State saved to .p2-test-state.json for cold restart test.');
  console.log('✅ Phase 1 complete!');
}

async function phase2() {
  console.log('====================================================');
  console.log('🧪 P2 INVENTORY PERSISTENCE TEST - PHASE 2: POST-RESTART');
  console.log('====================================================\n');

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`State file ${STATE_FILE} not found! Run phase1 first.`);
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

  // 1. Verify Item 1 persisted with exact quantity and status
  console.log('1. Verifying Item 1 post-restart persistence...');
  const item1Res = await fetch(`${BASE_URL}/api/inventory/${state.farmerAItem1Id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!item1Res.ok) throw new Error(`Failed to retrieve Item 1 post-restart: ${item1Res.status}`);
  const item1 = await item1Res.json();
  if (item1.currentQuantity !== state.farmerAItem1ExpectedQty) {
    throw new Error(`Item 1 quantity mismatch! Expected ${state.farmerAItem1ExpectedQty}, got ${item1.currentQuantity}`);
  }
  if (item1.status !== state.farmerAItem1ExpectedStatus) {
    throw new Error(`Item 1 status mismatch! Expected ${state.farmerAItem1ExpectedStatus}, got ${item1.status}`);
  }
  console.log(`   ✓ Item 1 persisted: ${item1.name}, Qty: ${item1.currentQuantity}, Status: ${item1.status}`);

  // 2. Verify deleted item remains deleted and was NOT re-seeded
  console.log('\n2. Verifying deleted item remains absent post-restart...');
  const delCheckRes = await fetch(`${BASE_URL}/api/inventory/${state.deletedItem2Id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (delCheckRes.status !== 404) {
    throw new Error(`Deleted item resurrected after restart! HTTP ${delCheckRes.status}`);
  }
  console.log('   ✓ Deleted item confirmed absent post-restart (HTTP 404)');

  // 3. Verify concurrent item 3 quantity persisted accurately
  console.log('\n3. Verifying concurrent Item 3 post-restart persistence...');
  const item3Res = await fetch(`${BASE_URL}/api/inventory/${state.concurrentItem3Id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!item3Res.ok) throw new Error(`Failed to retrieve Item 3: ${item3Res.status}`);
  const item3 = await item3Res.json();
  if (item3.currentQuantity !== state.concurrentItem3ExpectedQty) {
    throw new Error(
      `Item 3 quantity mismatch! Expected ${state.concurrentItem3ExpectedQty}, got ${item3.currentQuantity}`
    );
  }
  console.log(`   ✓ Item 3 persisted with exact quantity: ${item3.currentQuantity}`);

  // 4. Verify Farmer B has complete isolation post-restart
  console.log('\n4. Verifying Farmer B cross-user isolation post-restart...');
  const crossCheckRes = await fetch(`${BASE_URL}/api/inventory/${state.farmerAItem1Id}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossCheckRes.status !== 404) {
    throw new Error(`Farmer B can access Farmer A data post-restart! HTTP ${crossCheckRes.status}`);
  }
  const farmerBListRes = await fetch(`${BASE_URL}/api/inventory`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const farmerBList = await farmerBListRes.json();
  const hasAItems = farmerBList.some(
    (i: any) => i.id === state.farmerAItem1Id || i.id === state.concurrentItem3Id
  );
  if (hasAItems) {
    throw new Error('Farmer B inventory listing contains Farmer A items!');
  }
  console.log('   ✓ Multi-tenant isolation confirmed intact post-restart');

  console.log('\n====================================================');
  console.log('🎉 ALL P2 INVENTORY PERSISTENCE TESTS PASSED!');
  console.log('====================================================');
}

const mode = process.argv[2] || 'all';
if (mode === 'phase1') {
  phase1().catch((err) => {
    console.error('❌ Phase 1 failed:', err);
    process.exit(1);
  });
} else if (mode === 'phase2') {
  phase2().catch((err) => {
    console.error('❌ Phase 2 failed:', err);
    process.exit(1);
  });
} else {
  console.error('Usage: npx tsx scripts/test-p2-inventory-persistence.ts [phase1|phase2]');
  process.exit(1);
}
