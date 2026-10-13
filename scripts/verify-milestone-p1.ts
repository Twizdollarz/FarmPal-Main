import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function request(path: string, options: any = {}): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING MILESTONE P1 VERIFICATION TESTS ---');

  const farmerAToken = 'Bearer test-token-farmer-p1-alpha';
  const farmerBToken = 'Bearer test-token-farmer-p1-beta';

  // ============================================================
  // TEST 1: Farmer Profiles
  // ============================================================
  console.log('\n[TEST 1] Farmer Profiles: Multi-tenant Isolation & Update');
  const profileUpdateA = {
    name: 'Alhaji Alpha Danbatta',
    phone: '+234 801 111 9999',
    location: 'Danbatta, Kano State',
    preferredLanguage: 'ha',
  };

  const putA = await request('/api/profile', {
    method: 'PUT',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify(profileUpdateA),
  });
  console.log('Farmer A PUT /api/profile status:', putA.status, putA.data?.name);
  if (putA.data?.name !== 'Alhaji Alpha Danbatta') throw new Error('Farmer A profile update failed');

  const profileUpdateB = {
    name: 'Chief Beta Oladipo',
    phone: '+234 802 222 8888',
    location: 'Ibadan, Oyo State',
    preferredLanguage: 'yo',
  };

  const putB = await request('/api/profile', {
    method: 'PUT',
    headers: { Authorization: farmerBToken },
    body: JSON.stringify(profileUpdateB),
  });
  console.log('Farmer B PUT /api/profile status:', putB.status, putB.data?.name);
  if (putB.data?.name !== 'Chief Beta Oladipo') throw new Error('Farmer B profile update failed');

  const getA = await request('/api/profile', { headers: { Authorization: farmerAToken } });
  const getB = await request('/api/profile', { headers: { Authorization: farmerBToken } });

  console.log('Farmer A retrieved:', getA.data.name, getA.data.phone, getA.data.location);
  console.log('Farmer B retrieved:', getB.data.name, getB.data.phone, getB.data.location);

  if (getA.data.name !== 'Alhaji Alpha Danbatta' || getA.data.phone !== '+234 801 111 9999') {
    throw new Error('Farmer A profile retrieval mismatch');
  }
  if (getB.data.name !== 'Chief Beta Oladipo' || getB.data.phone !== '+234 802 222 8888') {
    throw new Error('Farmer B profile retrieval mismatch');
  }
  if (getA.data.name === getB.data.name || getA.data.phone === getB.data.phone) {
    throw new Error('CRITICAL: Farmer A and Farmer B profiles leaked into each other!');
  }
  console.log('✅ TEST 1 PASSED: Farmer profiles isolated and saved.');

  // ============================================================
  // PREPARATION: Crops for Farmer A and Farmer B
  // ============================================================
  console.log('\n[SETUP] Creating test crops for Farmer A and Farmer B');
  const cropA = await request('/api/crops', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      name: 'P1 Alpha Tomatoes',
      variety: 'Roma VF',
      plantingDate: '2026-03-01',
      farmSizeAcres: 2.5,
      status: 'active',
    }),
  });
  console.log('Crop A created:', cropA.data?.id, cropA.data?.name);

  const cropB = await request('/api/crops', {
    method: 'POST',
    headers: { Authorization: farmerBToken },
    body: JSON.stringify({
      name: 'P1 Beta Cassava',
      variety: 'TME 419',
      plantingDate: '2026-02-15',
      farmSizeAcres: 5.0,
      status: 'active',
    }),
  });
  console.log('Crop B created:', cropB.data?.id, cropB.data?.name);

  // ============================================================
  // TEST 2: Expense Creation and Ownership-Scoped Deletion
  // ============================================================
  console.log('\n[TEST 2] Expense Creation & Scoped Deletion');
  const expA = await request('/api/expenses', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      categoryId: 'cat-fertilizer',
      categoryName: 'Fertilizer',
      totalAmount: 45000,
      expenseDate: '2026-03-10',
      description: 'NPK fertilizer for tomato field',
      allocations: [{ cropId: cropA.data.id, cropName: cropA.data.name, percentage: 100, allocatedAmount: 45000 }],
    }),
  });
  console.log('Farmer A Expense created:', expA.data?.id, expA.data?.totalAmount);

  // Farmer B attempts to delete Farmer A's expense -> Must fail with 404
  const deleteByB = await request(`/api/expenses/${expA.data.id}`, {
    method: 'DELETE',
    headers: { Authorization: farmerBToken },
  });
  console.log('Farmer B trying to delete Farmer A expense -> status:', deleteByB.status);
  if (deleteByB.status !== 404) {
    throw new Error(`Expected 404 when Farmer B deletes Farmer A's expense, got ${deleteByB.status}`);
  }

  // Farmer A deletes their own expense -> Must succeed
  const deleteByA = await request(`/api/expenses/${expA.data.id}`, {
    method: 'DELETE',
    headers: { Authorization: farmerAToken },
  });
  console.log('Farmer A deleting own expense -> status:', deleteByA.status);
  if (deleteByA.status !== 200) {
    throw new Error(`Expected 200 when Farmer A deletes own expense, got ${deleteByA.status}`);
  }

  // Verify it is absent for Farmer A
  const getExpensesA = await request('/api/expenses', { headers: { Authorization: farmerAToken } });
  const stillFound = (getExpensesA.data || []).some((e: any) => e.id === expA.data.id);
  if (stillFound) throw new Error('Expense still present after deletion!');
  console.log('✅ TEST 2 PASSED: Expense deletion is ownership-scoped and verified.');

  // ============================================================
  // TEST 3: Labour Persistence
  // ============================================================
  console.log('\n[TEST 3] Labour Persistence');
  const labourA = await request('/api/labour', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      cropId: cropA.data.id,
      labourDate: '2026-03-12',
      workType: 'Weeding & Ridging',
      workerCount: 4,
      amountPaid: 16000,
      description: '4 daily laborers for ridge clearing',
    }),
  });
  console.log('Farmer A Labour created:', labourA.data?.labour?.id, 'Amount:', labourA.data?.labour?.amountPaid);
  if (!labourA.data?.labour?.id) throw new Error('Labour creation failed');

  const getLabourA = await request('/api/labour', { headers: { Authorization: farmerAToken } });
  const hasLabourA = (getLabourA.data || []).some((l: any) => l.id === labourA.data.labour.id);
  if (!hasLabourA) throw new Error('Farmer A cannot retrieve created labour record');

  // Verify Farmer B cannot see Farmer A's labour record
  const getLabourB = await request('/api/labour', { headers: { Authorization: farmerBToken } });
  const leakLabour = (getLabourB.data || []).some((l: any) => l.id === labourA.data.labour.id);
  if (leakLabour) throw new Error('Farmer B can see Farmer A labour record!');
  console.log('✅ TEST 3 PASSED: Labour record persisted and multi-tenant scoped.');

  // ============================================================
  // TEST 4: Harvest Persistence
  // ============================================================
  console.log('\n[TEST 4] Harvest Persistence');
  // Attempting to harvest Farmer B's crop using Farmer A's token -> Must be rejected with 400
  const invalidHarvest = await request('/api/harvest', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      cropId: cropB.data.id,
      quantity: 50,
      unit: 'crates',
    }),
  });
  console.log('Farmer A harvesting Farmer B crop -> status:', invalidHarvest.status);
  if (invalidHarvest.status !== 400) {
    throw new Error('Unowned crop harvest was not rejected with 400');
  }

  // Valid harvest on Farmer A's crop
  const validHarvestA = await request('/api/harvest', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      cropId: cropA.data.id,
      harvestDate: '2026-03-20',
      quantity: 35,
      unit: 'crates',
      qualityGrade: 'Grade A',
      notes: 'First flush harvest',
    }),
  });
  console.log('Farmer A Harvest created:', validHarvestA.data?.id, 'Qty:', validHarvestA.data?.quantity);
  if (!validHarvestA.data?.id) throw new Error('Harvest creation failed');

  const getHarvestA = await request('/api/harvest', { headers: { Authorization: farmerAToken } });
  const hasHarvestA = (getHarvestA.data || []).some((h: any) => h.id === validHarvestA.data.id);
  if (!hasHarvestA) throw new Error('Farmer A cannot retrieve created harvest record');
  console.log('✅ TEST 4 PASSED: Harvest persisted and crop ownership enforced.');

  // ============================================================
  // TEST 5: Debtor Payments & Sales Persistence
  // ============================================================
  console.log('\n[TEST 5] Sales & Debtor Payments Persistence');
  // Create a credit sale for Farmer A
  const creditSaleA = await request('/api/sales', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      cropId: cropA.data.id,
      saleDate: '2026-03-22',
      quantitySold: 20,
      unit: 'crates',
      pricePerUnit: 5000,
      buyerName: 'Alhaji Garba Market Trader',
      paymentStatus: 'credit',
      notes: 'Agreed 14 days credit terms',
    }),
  });
  console.log('Credit sale created:', creditSaleA.data?.id, 'Revenue:', creditSaleA.data?.totalRevenue, 'Due:', creditSaleA.data?.amountDue);
  if (creditSaleA.data?.amountDue !== 100000 || creditSaleA.data?.amountPaid !== 0) {
    throw new Error('Credit sale amount due calculation mismatch');
  }

  // Collect partial payment of ₦40,000 from debtor
  const collectPayment = await request(`/api/sales/${creditSaleA.data.id}/collect-payment`, {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      amountCollected: 40000,
      notes: 'Cash installment received at Kano Central Market',
    }),
  });
  console.log('Partial payment collected:', collectPayment.status, collectPayment.data?.sale?.amountPaid, 'Remaining due:', collectPayment.data?.sale?.amountDue);
  if (collectPayment.data?.sale?.amountPaid !== 40000 || collectPayment.data?.sale?.amountDue !== 60000) {
    throw new Error('Payment collection did not update sale balance properly');
  }
  if (collectPayment.data?.sale?.paymentStatus !== 'partial') {
    throw new Error('Sale status should be partial');
  }

  // Verify payments ledger endpoint
  const getPayments = await request(`/api/sales/${creditSaleA.data.id}/payments`, {
    headers: { Authorization: farmerAToken },
  });
  console.log('Debtor payments ledger entries:', getPayments.data?.length);
  if (!getPayments.data || getPayments.data.length === 0 || getPayments.data[0].amount !== 40000) {
    throw new Error('Debtor payment ledger record missing');
  }
  console.log('✅ TEST 5 PASSED: Debtor payment collected, ledger recorded, and sale balance updated.');

  // ============================================================
  // TEST 6: WhatsApp Actions Persistence
  // ============================================================
  console.log('\n[TEST 6] WhatsApp Actions Persistence');
  const waExpense = await request('/api/whatsapp/execute-action', {
    method: 'POST',
    headers: { Authorization: farmerAToken },
    body: JSON.stringify({
      actionType: 'confirm_expenses',
      data: {
        expenses: [
          {
            cropId: cropA.data.id,
            category: 'Chemicals',
            amount: 18500,
            description: 'Fungicide spray via WhatsApp',
          },
        ],
      },
    }),
  });
  console.log('WhatsApp expense action status:', waExpense.status, waExpense.data?.message);
  if (!waExpense.data?.success) throw new Error('WhatsApp expense execution failed');

  const expensesAfterWA = await request('/api/expenses', { headers: { Authorization: farmerAToken } });
  const foundWAExp = (expensesAfterWA.data || []).find((e: any) => e.description === 'Fungicide spray via WhatsApp');
  if (!foundWAExp || foundWAExp.totalAmount !== 18500) {
    throw new Error('WhatsApp created expense not found in farm expenses');
  }
  console.log('✅ TEST 6 PASSED: WhatsApp action persisted into farmer expenses.');

  console.log('\n======================================================');
  console.log('ALL MILESTONE P1 IN-MEMORY & CLOUD SQL TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
