/**
 * Automated Verification Suite for FarmPal Persistence Milestone P3:
 * 1. Agronomic Planning Tasks
 * 2. Production Budgets
 *
 * Covers:
 * - Planning: Create, Read, Toggle, Read completed state, Delete, Confirm deletion,
 *   Restart persistence (deleted stays deleted, created survives, toggled state survives)
 * - Planning Multi-Tenancy: Farmer B cannot read, toggle, or delete Farmer A's task
 * - Budgets: Multi-tenant isolated budgets for Farmer A and Farmer B for same crop type
 *   Independent updates, restart persistence
 * - Crop Ownership: Farmer B cannot configure budget or tasks against Farmer A's crop
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FARMER_A_TOKEN = 'test-token-farmer-p3-alpha';
const FARMER_B_TOKEN = 'test-token-farmer-p3-beta';
const STATE_FILE = path.join(process.cwd(), 'scripts', '.p3-test-state.json');

async function phase1() {
  console.log('====================================================');
  console.log('🧪 P3 PERSISTENCE TEST - PHASE 1: PRE-RESTART');
  console.log('====================================================\n');

  // Step 0: Ensure crops exist for Farmer A and Farmer B
  console.log('0. Setting up base crops for Farmer A and Farmer B...');
  const cropARes = await fetch(`${BASE_URL}/api/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      name: 'P3 Alpha Roma Tomato',
      variety: 'Roma VF',
      farmSizeAcres: 3.5,
    }),
  });
  if (!cropARes.ok) throw new Error(`Failed to create crop for Farmer A: ${cropARes.status}`);
  const cropA = await cropARes.json();
  console.log(`   Created Farmer A Crop: ${cropA.id} (${cropA.name})`);

  const cropBRes = await fetch(`${BASE_URL}/api/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_B_TOKEN}`,
    },
    body: JSON.stringify({
      name: 'P3 Beta Beefsteak Tomato',
      variety: 'Beefsteak F1',
      farmSizeAcres: 2.0,
    }),
  });
  if (!cropBRes.ok) throw new Error(`Failed to create crop for Farmer B: ${cropBRes.status}`);
  const cropB = await cropBRes.json();
  console.log(`   Created Farmer B Crop: ${cropB.id} (${cropB.name})`);

  // =========================================================================
  // PLANNING TASKS TESTS
  // =========================================================================
  console.log('\n--- PART 1: PLANNING TASKS ---');

  // 1. Create task for Farmer A
  console.log('1. Testing Create Planning Task (with client-spoofed userId)...');
  const task1Res = await fetch(`${BASE_URL}/api/planning/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      userId: 'hacker-impostor-id', // MUST be ignored
      cropId: cropA.id,
      title: 'Drip line emitter pressure testing',
      category: 'Irrigation',
      dueDate: '2026-04-10',
      estimatedCost: 15000,
      notes: 'Test lateral line pressure after filter flush',
    }),
  });
  if (task1Res.status !== 201) {
    const errText = await task1Res.text();
    throw new Error(`Create task 1 failed: HTTP ${task1Res.status} - ${errText}`);
  }
  const task1 = await task1Res.json();
  console.log(`   ✓ Created Task 1: ${task1.id} - "${task1.title}" (Completed: ${task1.completed})`);

  if (task1.userId === 'hacker-impostor-id') {
    throw new Error('SECURITY VIOLATION: Server accepted client-supplied userId for planning task!');
  }

  // 2. Read task by ID and from calendar
  console.log('\n2. Testing Read Task (GET /api/planning/tasks/:id and GET /api/planning/calendar)...');
  const readTaskRes = await fetch(`${BASE_URL}/api/planning/tasks/${task1.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!readTaskRes.ok) throw new Error(`Failed to read task by ID: ${readTaskRes.status}`);
  const readTask = await readTaskRes.json();
  if (readTask.title !== task1.title || readTask.cropId !== cropA.id) {
    throw new Error('Task read mismatch!');
  }
  console.log(`   ✓ Single task read confirmed: "${readTask.title}" for crop ${readTask.cropName}`);

  const calendarRes = await fetch(`${BASE_URL}/api/planning/calendar`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!calendarRes.ok) throw new Error(`Failed to read calendar: ${calendarRes.status}`);
  const calData = await calendarRes.json();
  const taskInCal = calData.tasks.some((t: any) => t.id === task1.id);
  if (!taskInCal) throw new Error('Created task missing from calendar tasks list');
  console.log(`   ✓ Task confirmed present in Farmer A calendar schedule`);

  // 3. Toggle task
  console.log('\n3. Testing Toggle Task (POST /api/planning/tasks/:id/toggle)...');
  const toggleRes = await fetch(`${BASE_URL}/api/planning/tasks/${task1.id}/toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!toggleRes.ok) throw new Error(`Toggle task failed: ${toggleRes.status}`);
  const toggledTask = await toggleRes.json();
  if (!toggledTask.completed) throw new Error('Expected task to be completed after toggle!');
  console.log(`   ✓ Toggled task: completed=${toggledTask.completed}, completedDate=${toggledTask.completedDate}`);

  // 4. Read completed state
  console.log('\n4. Verifying Read Completed State...');
  const verifyCompletedRes = await fetch(`${BASE_URL}/api/planning/tasks/${task1.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  const verifyCompleted = await verifyCompletedRes.json();
  if (!verifyCompleted.completed || !verifyCompleted.completedDate) {
    throw new Error('Completed state was not preserved in database read');
  }
  console.log(`   ✓ Verified task completed state in PostgreSQL: ${verifyCompleted.completed}`);

  // 5. Create a second task specifically to test deletion
  console.log('\n5. Creating Task to be Deleted...');
  const delTaskRes = await fetch(`${BASE_URL}/api/planning/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      cropId: cropA.id,
      title: 'Temporary weeding trial batch',
      category: 'Labour',
      dueDate: '2026-04-12',
    }),
  });
  const taskToDelete = await delTaskRes.json();
  console.log(`   Created Task to Delete: ${taskToDelete.id} - "${taskToDelete.title}"`);

  // Delete the task
  console.log('\n6. Deleting Task and Confirming Deletion...');
  const deleteRes = await fetch(`${BASE_URL}/api/planning/tasks/${taskToDelete.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!deleteRes.ok) throw new Error(`Delete task failed: ${deleteRes.status}`);
  console.log(`   ✓ Task deleted: HTTP ${deleteRes.status}`);

  // Confirm deletion returns 404
  const confirmDelRes = await fetch(`${BASE_URL}/api/planning/tasks/${taskToDelete.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (confirmDelRes.status !== 404) {
    throw new Error(`Deleted task still accessible! HTTP ${confirmDelRes.status}`);
  }
  console.log(`   ✓ Deleted task confirmed absent (HTTP 404)`);

  // 9. Create a task that should survive restart (both uncompleted and completed)
  console.log('\n9. Creating Task to Test Cold Restart Persistence...');
  const surviveTaskRes = await fetch(`${BASE_URL}/api/planning/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      cropId: cropA.id,
      title: 'Staking and trellising tomato vines',
      category: 'Labour',
      dueDate: '2026-04-18',
      estimatedCost: 20000,
      notes: 'Use 2m bamboo stakes with jute twine',
    }),
  });
  const surviveTask = await surviveTaskRes.json();
  console.log(`   Created Task to Survive Restart: ${surviveTask.id} - "${surviveTask.title}"`);

  // =========================================================================
  // PLANNING MULTI-TENANCY
  // =========================================================================
  console.log('\n--- PART 2: PLANNING MULTI-TENANCY ---');
  console.log('12-15. Testing Farmer B cannot access, toggle, or delete Farmer A task...');

  // Farmer B cannot read Farmer A task
  const crossReadRes = await fetch(`${BASE_URL}/api/planning/tasks/${task1.id}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossReadRes.status !== 404) {
    throw new Error(`Farmer B could read Farmer A task! HTTP ${crossReadRes.status}`);
  }
  console.log('   ✓ Farmer B GET /api/planning/tasks/:id returned 404');

  // Farmer B calendar does not expose Farmer A task
  const bCalRes = await fetch(`${BASE_URL}/api/planning/calendar`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const bCalData = await bCalRes.json();
  const leakFound = bCalData.tasks.some((t: any) => t.id === task1.id || t.id === surviveTask.id);
  if (leakFound) {
    throw new Error('Farmer B calendar contains Farmer A tasks!');
  }
  console.log('   ✓ Farmer B calendar schedule contains 0 of Farmer A tasks');

  // Farmer B cannot toggle Farmer A task
  const crossToggleRes = await fetch(`${BASE_URL}/api/planning/tasks/${task1.id}/toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossToggleRes.status !== 404) {
    throw new Error(`Farmer B could toggle Farmer A task! HTTP ${crossToggleRes.status}`);
  }
  console.log('   ✓ Farmer B POST /api/planning/tasks/:id/toggle returned 404');

  // Farmer B cannot delete Farmer A task
  const crossDeleteRes = await fetch(`${BASE_URL}/api/planning/tasks/${task1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossDeleteRes.status !== 404) {
    throw new Error(`Farmer B could delete Farmer A task! HTTP ${crossDeleteRes.status}`);
  }
  console.log('   ✓ Farmer B DELETE /api/planning/tasks/:id returned 404');

  // =========================================================================
  // PRODUCTION BUDGETS TESTS
  // =========================================================================
  console.log('\n--- PART 3: PRODUCTION BUDGETS ---');

  // 16. Farmer A creates Tomato budget
  console.log('16. Farmer A sets budget for Alpha Tomato...');
  const budgetARes = await fetch(`${BASE_URL}/api/planning/budgets/${cropA.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      targetYieldQuantity: 150,
      targetYieldUnit: 'crates',
      targetSellingPricePerUnit: 22000,
      categoryAllocations: {
        Seeds: 80000,
        Fertilizer: 140000,
        Labour: 160000,
        Chemicals: 45000,
      },
    }),
  });
  if (!budgetARes.ok) throw new Error(`Farmer A set budget failed: ${budgetARes.status}`);
  const budgetA = await budgetARes.json();
  console.log(`   ✓ Farmer A budget configured: Yield=${budgetA.budget.targetYieldQuantity}, Price=₦${budgetA.budget.targetSellingPricePerUnit}, Total=₦${budgetA.budget.totalBudget}`);

  // 17. Farmer B creates separate budget for Beta Tomato
  console.log('17. Farmer B sets budget for Beta Tomato (same crop type, different values)...');
  const budgetBRes = await fetch(`${BASE_URL}/api/planning/budgets/${cropB.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_B_TOKEN}`,
    },
    body: JSON.stringify({
      targetYieldQuantity: 95,
      targetYieldUnit: 'crates',
      targetSellingPricePerUnit: 14000,
      categoryAllocations: {
        Seeds: 35000,
        Fertilizer: 60000,
        Labour: 70000,
      },
    }),
  });
  if (!budgetBRes.ok) throw new Error(`Farmer B set budget failed: ${budgetBRes.status}`);
  const budgetB = await budgetBRes.json();
  console.log(`   ✓ Farmer B budget configured: Yield=${budgetB.budget.targetYieldQuantity}, Price=₦${budgetB.budget.targetSellingPricePerUnit}, Total=₦${budgetB.budget.totalBudget}`);

  // 18. Verify both remain independent
  console.log('\n18. Verifying both budgets remain strictly independent in GET /api/planning/budgets...');
  const allBudgetsARes = await fetch(`${BASE_URL}/api/planning/budgets`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  const allBudgetsA = await allBudgetsARes.json();
  const aFoundInA = allBudgetsA.find((b: any) => b.cropId === cropA.id);
  const bFoundInA = allBudgetsA.find((b: any) => b.cropId === cropB.id);

  if (!aFoundInA || aFoundInA.targetYieldQuantity !== 150) {
    throw new Error('Farmer A budget values incorrect on retrieval');
  }
  if (bFoundInA) {
    throw new Error('Farmer A received Farmer B crop budget!');
  }

  const allBudgetsBRes = await fetch(`${BASE_URL}/api/planning/budgets`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const allBudgetsB = await allBudgetsBRes.json();
  const bFoundInB = allBudgetsB.find((b: any) => b.cropId === cropB.id);
  const aFoundInB = allBudgetsB.find((b: any) => b.cropId === cropA.id);

  if (!bFoundInB || bFoundInB.targetYieldQuantity !== 95) {
    throw new Error('Farmer B budget values incorrect on retrieval');
  }
  if (aFoundInB) {
    throw new Error('Farmer B received Farmer A crop budget!');
  }
  console.log('   ✓ Zero cross-tenant leakage between Farmer A and Farmer B budgets');

  // 19. Update Farmer A budget
  console.log('\n19. Updating Farmer A budget...');
  const updateARes = await fetch(`${BASE_URL}/api/planning/budgets/${cropA.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      targetYieldQuantity: 200,
      targetSellingPricePerUnit: 25000,
      categoryAllocations: {
        Seeds: 100000,
        Fertilizer: 180000,
        Labour: 200000,
        Chemicals: 60000,
      },
    }),
  });
  if (!updateARes.ok) throw new Error('Update Farmer A budget failed');
  const updatedA = await updateARes.json();
  console.log(`   ✓ Farmer A updated to Yield=${updatedA.budget.targetYieldQuantity}, Price=₦${updatedA.budget.targetSellingPricePerUnit}`);

  // 20. Verify Farmer B budget remains unchanged
  console.log('\n20. Verifying Farmer B budget remains unchanged after Farmer A update...');
  const checkBRes = await fetch(`${BASE_URL}/api/planning/budgets`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const checkB = await checkBRes.json();
  const bBudgetAfter = checkB.find((b: any) => b.cropId === cropB.id);
  if (bBudgetAfter.targetYieldQuantity !== 95 || bBudgetAfter.targetSellingPricePerUnit !== 14000) {
    throw new Error('Farmer B budget was corrupted by Farmer A update!');
  }
  console.log(`   ✓ Farmer B budget confirmed unchanged: Yield=${bBudgetAfter.targetYieldQuantity}, Price=₦${bBudgetAfter.targetSellingPricePerUnit}`);

  // =========================================================================
  // CROP OWNERSHIP TESTS
  // =========================================================================
  console.log('\n--- PART 4: CROP OWNERSHIP VERIFICATION ---');
  // 23-24. Farmer B attempts to configure a budget against Farmer A's crop
  console.log('23-24. Testing Farmer B configuring budget or task against Farmer A crop...');
  const unauthBudgetRes = await fetch(`${BASE_URL}/api/planning/budgets/${cropA.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_B_TOKEN}`,
    },
    body: JSON.stringify({
      targetYieldQuantity: 999,
    }),
  });
  if (unauthBudgetRes.status !== 404) {
    throw new Error(`Unauthorized crop budget modification was NOT rejected with 404! HTTP ${unauthBudgetRes.status}`);
  }
  console.log('   ✓ Farmer B PUT budget on Farmer A crop rejected with HTTP 404');

  const unauthTaskRes = await fetch(`${BASE_URL}/api/planning/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_B_TOKEN}`,
    },
    body: JSON.stringify({
      cropId: cropA.id, // Farmer A crop
      title: 'Malicious task on competitor crop',
    }),
  });
  if (unauthTaskRes.status !== 400 && unauthTaskRes.status !== 404) {
    throw new Error(`Unauthorized task creation on another user crop was NOT rejected! HTTP ${unauthTaskRes.status}`);
  }
  console.log(`   ✓ Farmer B creating task on Farmer A crop rejected with HTTP ${unauthTaskRes.status}`);

  // Save state for Phase 2 post-restart verification
  const state = {
    cropAId: cropA.id,
    cropBId: cropB.id,
    task1Id: task1.id,
    taskToDeleteId: taskToDelete.id,
    surviveTaskId: surviveTask.id,
    expectedTask1Completed: true,
    expectedBudgetAYield: 200,
    expectedBudgetAPrice: 25000,
    expectedBudgetBYield: 95,
    expectedBudgetBPrice: 14000,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('\n💾 State saved to .p3-test-state.json for cold restart verification.');
  console.log('✅ Phase 1 complete!');
}

async function phase2() {
  console.log('====================================================');
  console.log('🧪 P3 PERSISTENCE TEST - PHASE 2: POST-RESTART');
  console.log('====================================================\n');

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`State file ${STATE_FILE} not found! Run phase1 first.`);
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

  // 8. Confirm deleted task remains absent
  console.log('8. Verifying deleted task remains absent post-restart...');
  const delCheckRes = await fetch(`${BASE_URL}/api/planning/tasks/${state.taskToDeleteId}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (delCheckRes.status !== 404) {
    throw new Error(`Deleted task was resurrected after cold restart! HTTP ${delCheckRes.status}`);
  }
  console.log('   ✓ Deleted task confirmed absent post-restart (HTTP 404)');

  // 11. Confirm task survives restart
  console.log('\n11. Verifying surviving tasks and toggled states survived restart...');
  const task1Res = await fetch(`${BASE_URL}/api/planning/tasks/${state.task1Id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!task1Res.ok) throw new Error(`Task 1 missing post-restart: ${task1Res.status}`);
  const task1 = await task1Res.json();
  if (task1.completed !== state.expectedTask1Completed) {
    throw new Error(`Task 1 completed state lost! Expected ${state.expectedTask1Completed}, got ${task1.completed}`);
  }
  console.log(`   ✓ Task 1 survived with completed state: ${task1.completed} (Completed Date: ${task1.completedDate})`);

  const surviveTaskRes = await fetch(`${BASE_URL}/api/planning/tasks/${state.surviveTaskId}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!surviveTaskRes.ok) throw new Error(`Surviving task missing post-restart: ${surviveTaskRes.status}`);
  const surviveTask = await surviveTaskRes.json();
  console.log(`   ✓ Task "${surviveTask.title}" survived with dueDate=${surviveTask.dueDate}`);

  // 21-22. Verify both budgets survive restart
  console.log('\n21-22. Verifying both budgets survived restart with exact customized values...');
  const budgetsARes = await fetch(`${BASE_URL}/api/planning/budgets`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  const budgetsA = await budgetsARes.json();
  const budgetA = budgetsA.find((b: any) => b.cropId === state.cropAId);
  if (!budgetA || budgetA.targetYieldQuantity !== state.expectedBudgetAYield || budgetA.targetSellingPricePerUnit !== state.expectedBudgetAPrice) {
    throw new Error(`Farmer A budget mismatch post-restart! Got: ${JSON.stringify(budgetA)}`);
  }
  console.log(`   ✓ Farmer A budget survived: Yield=${budgetA.targetYieldQuantity}, Price=₦${budgetA.targetSellingPricePerUnit}`);

  const budgetsBRes = await fetch(`${BASE_URL}/api/planning/budgets`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const budgetsB = await budgetsBRes.json();
  const budgetB = budgetsB.find((b: any) => b.cropId === state.cropBId);
  if (!budgetB || budgetB.targetYieldQuantity !== state.expectedBudgetBYield || budgetB.targetSellingPricePerUnit !== state.expectedBudgetBPrice) {
    throw new Error(`Farmer B budget mismatch post-restart! Got: ${JSON.stringify(budgetB)}`);
  }
  console.log(`   ✓ Farmer B budget survived: Yield=${budgetB.targetYieldQuantity}, Price=₦${budgetB.targetSellingPricePerUnit}`);

  // Multi-tenant check post-restart
  console.log('\n23. Verifying multi-tenant isolation intact post-restart...');
  const crossCheckRes = await fetch(`${BASE_URL}/api/planning/tasks/${state.task1Id}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossCheckRes.status !== 404) {
    throw new Error(`Farmer B could access Farmer A task post-restart! HTTP ${crossCheckRes.status}`);
  }
  const hasAInB = budgetsB.some((b: any) => b.cropId === state.cropAId);
  if (hasAInB) {
    throw new Error('Farmer B received Farmer A budgets post-restart!');
  }
  console.log('   ✓ Multi-tenant isolation verified completely intact post-restart');

  console.log('\n====================================================');
  console.log('🎉 ALL P3 PLANNING & BUDGET PERSISTENCE TESTS PASSED!');
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
  console.error('Usage: npx tsx scripts/test-p3-planning-persistence.ts [phase1|phase2]');
  process.exit(1);
}
