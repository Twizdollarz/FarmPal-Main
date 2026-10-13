/**
 * Persistence & Multi-Tenant Restart Audit Script
 */
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FARMER_A_TOKEN = 'test-token-farmer-audit-a';
const FARMER_B_TOKEN = 'test-token-farmer-audit-b';

export async function createAndVerifyFarmerARecords() {
  console.log('--- [Step 1] Creating Records for Farmer A ---');

  // 1. Crop
  const cropRes = await fetch(`${BASE_URL}/api/crops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({ name: 'Audit Cassava Plot', variety: 'TMS 30572', farmSizeAcres: 3.5 }),
  });
  const crop = await cropRes.json();
  console.log('  • Created Crop:', crop.id, crop.name);

  // 2. Expense
  const expRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      categoryId: 'cat-fertilizer',
      categoryName: 'Fertilizer',
      totalAmount: 45000,
      cropId: crop.id,
      description: 'NPK 15-15-15 for Audit Cassava',
    }),
  });
  const expense = await expRes.json();
  console.log('  • Created Expense:', expense.id, `₦${expense.totalAmount}`);

  // 3. Harvest
  const harvRes = await fetch(`${BASE_URL}/api/harvest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      cropId: crop.id,
      quantity: 50,
      unit: 'bags',
      notes: 'Initial test harvest bags',
    }),
  });
  const harvest = await harvRes.json();
  console.log('  • Created Harvest:', harvest.id, `${harvest.quantity} ${harvest.unit}`);

  // 4. Sale
  const saleRes = await fetch(`${BASE_URL}/api/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      cropId: crop.id,
      quantitySold: 20,
      unit: 'bags',
      pricePerUnit: 5000,
      buyerName: 'Alhaji Audit Buyer',
    }),
  });
  const sale = await saleRes.json();
  console.log('  • Created Sale:', sale.id, `₦${sale.totalRevenue}`);

  // 5. Inventory
  const invRes = await fetch(`${BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      name: 'Audit Seed Stock Bags',
      category: 'Seeds',
      currentQuantity: 100,
      unit: 'kg',
      storageLocation: 'Audit Depot',
    }),
  });
  const inventory = await invRes.json();
  console.log('  • Created Inventory:', inventory.id, inventory.name);

  // 6. Planning Task
  const taskRes = await fetch(`${BASE_URL}/api/planning/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FARMER_A_TOKEN}` },
    body: JSON.stringify({
      cropId: crop.id,
      title: 'Audit Weeding Operation',
      category: 'Weeding',
      dueDate: '2026-10-15',
    }),
  });
  const task = await taskRes.json();
  console.log('  • Created Planning Task:', task.id, task.title);

  return {
    cropId: crop.id,
    expenseId: expense.id,
    harvestId: harvest.id,
    saleId: sale.id,
    inventoryId: inventory.id,
    taskId: task.id,
  };
}

export async function verifyFarmerIsolation(createdIds: any, phase: 'BEFORE_RESTART' | 'AFTER_RESTART') {
  console.log(`\n--- [Step 2] Verifying Isolation & Presence (${phase}) ---`);

  // Farmer A reads
  const aCrops = await (await fetch(`${BASE_URL}/api/crops`, { headers: { 'Authorization': `Bearer ${FARMER_A_TOKEN}` } })).json();
  const aExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { 'Authorization': `Bearer ${FARMER_A_TOKEN}` } })).json();
  const aHarv = await (await fetch(`${BASE_URL}/api/harvest`, { headers: { 'Authorization': `Bearer ${FARMER_A_TOKEN}` } })).json();
  const aSales = await (await fetch(`${BASE_URL}/api/sales`, { headers: { 'Authorization': `Bearer ${FARMER_A_TOKEN}` } })).json();
  const aInv = await (await fetch(`${BASE_URL}/api/inventory`, { headers: { 'Authorization': `Bearer ${FARMER_A_TOKEN}` } })).json();
  const aCalendar = await (await fetch(`${BASE_URL}/api/planning/calendar`, { headers: { 'Authorization': `Bearer ${FARMER_A_TOKEN}` } })).json();
  const aTasks = aCalendar.tasks || [];

  console.log('Farmer A Retrievability:');
  console.log('  • Crop Present:', aCrops.some((c: any) => c.id === createdIds.cropId));
  console.log('  • Expense Present:', aExp.some((e: any) => e.id === createdIds.expenseId));
  console.log('  • Harvest Present:', aHarv.some((h: any) => h.id === createdIds.harvestId));
  console.log('  • Sale Present:', aSales.some((s: any) => s.id === createdIds.saleId));
  console.log('  • Inventory Present:', aInv.some((i: any) => i.id === createdIds.inventoryId));
  console.log('  • Task Present:', aTasks.some((t: any) => t.id === createdIds.taskId));

  // Farmer B reads
  const bCrops = await (await fetch(`${BASE_URL}/api/crops`, { headers: { 'Authorization': `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bExp = await (await fetch(`${BASE_URL}/api/expenses`, { headers: { 'Authorization': `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bHarv = await (await fetch(`${BASE_URL}/api/harvest`, { headers: { 'Authorization': `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bSales = await (await fetch(`${BASE_URL}/api/sales`, { headers: { 'Authorization': `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bInv = await (await fetch(`${BASE_URL}/api/inventory`, { headers: { 'Authorization': `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bCalendar = await (await fetch(`${BASE_URL}/api/planning/calendar`, { headers: { 'Authorization': `Bearer ${FARMER_B_TOKEN}` } })).json();
  const bTasks = bCalendar.tasks || [];

  console.log('\nFarmer B Cross-Tenant Leakage Check (Should all be FALSE):');
  console.log('  • Farmer B sees Farmer A Crop:', bCrops.some((c: any) => c.id === createdIds.cropId));
  console.log('  • Farmer B sees Farmer A Expense:', bExp.some((e: any) => e.id === createdIds.expenseId));
  console.log('  • Farmer B sees Farmer A Harvest:', bHarv.some((h: any) => h.id === createdIds.harvestId));
  console.log('  • Farmer B sees Farmer A Sale:', bSales.some((s: any) => s.id === createdIds.saleId));
  console.log('  • Farmer B sees Farmer A Inventory:', bInv.some((i: any) => i.id === createdIds.inventoryId));
  console.log('  • Farmer B sees Farmer A Task:', bTasks.some((t: any) => t.id === createdIds.taskId));

  return {
    farmerA: {
      crop: aCrops.some((c: any) => c.id === createdIds.cropId),
      expense: aExp.some((e: any) => e.id === createdIds.expenseId),
      harvest: aHarv.some((h: any) => h.id === createdIds.harvestId),
      sale: aSales.some((s: any) => s.id === createdIds.saleId),
      inventory: aInv.some((i: any) => i.id === createdIds.inventoryId),
      task: aTasks.some((t: any) => t.id === createdIds.taskId),
    },
    farmerBLeak: {
      crop: bCrops.some((c: any) => c.id === createdIds.cropId),
      expense: bExp.some((e: any) => e.id === createdIds.expenseId),
      harvest: bHarv.some((h: any) => h.id === createdIds.harvestId),
      sale: bSales.some((s: any) => s.id === createdIds.saleId),
      inventory: bInv.some((i: any) => i.id === createdIds.inventoryId),
      task: bTasks.some((t: any) => t.id === createdIds.taskId),
    },
  };
}

async function main() {
  const mode = process.argv[2] || 'create';
  if (mode === 'create') {
    const ids = await createAndVerifyFarmerARecords();
    await verifyFarmerIsolation(ids, 'BEFORE_RESTART');
    console.log('\nRECORD_IDS_JSON:' + JSON.stringify(ids));
  } else if (mode === 'verify-after') {
    const ids = JSON.parse(process.argv[3]);
    await verifyFarmerIsolation(ids, 'AFTER_RESTART');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
