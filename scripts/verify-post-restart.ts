import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function request(path: string, token: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function verifyPostRestart() {
  console.log('--- VERIFYING COLD RESTART PERSISTENCE ---');

  const farmerAToken = 'Bearer test-token-farmer-p1-alpha';
  const farmerBToken = 'Bearer test-token-farmer-p1-beta';

  // 1. Farmer Profiles
  const profileA = await request('/api/profile', farmerAToken);
  const profileB = await request('/api/profile', farmerBToken);

  console.log('Post-Restart Profile A:', profileA.data?.name, profileA.data?.phone, profileA.data?.location);
  console.log('Post-Restart Profile B:', profileB.data?.name, profileB.data?.phone, profileB.data?.location);

  if (profileA.data?.name !== 'Alhaji Alpha Danbatta' || profileA.data?.phone !== '+234 801 111 9999') {
    throw new Error('Profile A failed to survive restart!');
  }
  if (profileB.data?.name !== 'Chief Beta Oladipo' || profileB.data?.phone !== '+234 802 222 8888') {
    throw new Error('Profile B failed to survive restart!');
  }

  // 2. Deleted Expense must NOT return
  const expensesA = await request('/api/expenses', farmerAToken);
  const hasDeletedExp = (expensesA.data || []).some((e: any) => e.id === 'exp-1790667267876-343');
  if (hasDeletedExp) {
    throw new Error('CRITICAL BUG: Deleted expense returned after server restart!');
  }
  const hasWAExp = (expensesA.data || []).some((e: any) => e.description === 'Fungicide spray via WhatsApp');
  if (!hasWAExp) {
    throw new Error('WhatsApp expense failed to survive restart!');
  }
  console.log('Post-Restart Expenses A: Deleted expense absent, WhatsApp expense present.');

  // 3. Labour Records
  const labourA = await request('/api/labour', farmerAToken);
  const hasLabour = (labourA.data || []).some((l: any) => l.amountPaid === 16000 && l.workType === 'Weeding & Ridging');
  if (!hasLabour) {
    throw new Error('Labour records failed to survive restart!');
  }
  console.log('Post-Restart Labour A: 16,000 NGN Weeding & Ridging record present.');

  // 4. Harvest Records
  const harvestA = await request('/api/harvest', farmerAToken);
  const hasHarvest = (harvestA.data || []).some((h: any) => h.quantity === 35 && h.unit === 'crates');
  if (!hasHarvest) {
    throw new Error('Harvest records failed to survive restart!');
  }
  console.log('Post-Restart Harvest A: 35 crates Grade A harvest present.');

  // 5. Debtor Payments & Sales
  const salesA = await request('/api/sales', farmerAToken);
  const partialSale = (salesA.data || []).find((s: any) => s.buyerName === 'Alhaji Garba Market Trader');
  if (!partialSale) {
    throw new Error('Debtor sale missing after restart!');
  }
  console.log('Post-Restart Sale A:', {
    revenue: partialSale.totalRevenue,
    paid: partialSale.amountPaid,
    due: partialSale.amountDue,
    status: partialSale.paymentStatus,
  });

  if (partialSale.amountPaid !== 40000 || partialSale.amountDue !== 60000 || partialSale.paymentStatus !== 'partial') {
    throw new Error('Sale payment state corrupted after restart!');
  }

  const paymentsA = await request(`/api/sales/${partialSale.id}/payments`, farmerAToken);
  console.log('Post-Restart Payments Ledger count:', paymentsA.data?.length);
  if (!paymentsA.data || paymentsA.data.length === 0 || paymentsA.data[0].amount !== 40000) {
    throw new Error('Debtor payment ledger record missing after restart!');
  }

  console.log('\n======================================================');
  console.log('ALL POST-RESTART PERSISTENCE VERIFICATIONS PASSED! 🎉');
  console.log('======================================================\n');
}

verifyPostRestart().catch((err) => {
  console.error('\n❌ Post-restart verification failed:', err);
  process.exit(1);
});
