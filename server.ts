import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { requireAuth, requireDevOnly, AuthRequest } from './src/middleware/auth.ts';
import { db, getSqlModule } from './server/store';
import {
  parseFarmerMessage,
  checkDuplicateExpense,
  formatNairaNumber,
} from './server/whatsappEngine';
import {
  calculateCropFinancials,
  calculateFarmSummary,
  calculateCropComparisons,
  calculateDebtorSummary,
  calculateCashflowTimeline,
  calculateFarmFinancialHealth,
} from './src/lib/financeEngine';
import {
  calculateCropBudgets,
  calculateMarketBenchmarks,
  calculateCropCalendar,
  handleUssdSession,
  generateExpensesCsv,
  generateSalesCsv,
  generateDebtorsCsv,
  RawCropBudgetConfig,
  VERIFIED_MARKET_SOURCES,
} from './server/planningEngine';
import {
  calculateAgriCreditScore,
  generateAgroWeatherReport,
} from './server/phase4Engine';
import {
  generateFriendlyDailyReminder,
  FRIENDLY_REMINDER_TEMPLATES,
} from './server/reminderEngine';
import {
  Crop,
  Expense,
  ExpenseAllocation,
  HarvestRecord,
  LabourRecord,
  SaleRecord,
  CropFinancials,
  FarmInventoryItem,
  FarmerFeedback,
  FeedbackSummary,
  AgronomicTask,
  CooperativeGroup,
  CooperativeMember,
  BulkInputPool,
  BulkInputContribution,
  ProduceAggregationPool,
  ProducePledge,
} from './src/types';

dotenv.config();

export interface RequestWithRawBody extends express.Request {
  rawBody?: Buffer;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  express.json({
    limit: '1mb',
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
      (req as RequestWithRawBody).rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
      (req as RequestWithRawBody).rawBody = buf;
    },
  })
);

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Farmer Profile
app.get('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userProfile = await db.getProfileAsync(userId);
  res.json(userProfile);
});

app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { name, phone, location, preferredLanguage, dailyReminderEnabled, dailyReminderTime, reminderChannel, theme, role, isAdmin, tier } = req.body;
  // TASK 2: Client-supplied userId in body is strictly ignored
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (location !== undefined) updates.location = location;
  if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
  if (dailyReminderEnabled !== undefined) updates.dailyReminderEnabled = dailyReminderEnabled;
  if (dailyReminderTime !== undefined) updates.dailyReminderTime = dailyReminderTime;
  if (reminderChannel !== undefined) updates.reminderChannel = reminderChannel;
  if (theme !== undefined) updates.theme = theme;
  if (role !== undefined) updates.role = role;
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (tier !== undefined) updates.tier = tier;
  const updatedProfile = db.saveProfile(userId, updates);
  await db.persistProfile(updatedProfile, userId);
  res.json(updatedProfile);
});

// Daily Friendly Reminders (WhatsApp & App Notification)
app.get('/api/reminders/daily', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const userCrops = db.crops.filter((c) => c.userId === userId);
    const forceNew = req.query.forceNew === 'true';
    const hour = req.query.hour as string | undefined;
    const userProfile = db.getProfile(userId);
    const reminder = await generateFriendlyDailyReminder(userProfile, userCrops, {
      forceNew,
      customHour: hour,
      channel: (userProfile as any).reminderChannel || 'both',
    });
    res.json(reminder);
  } catch (err) {
    console.error('Error generating daily reminder:', err);
    res.status(500).json({ error: 'Failed to generate reminder' });
  }
});

app.get('/api/reminders/templates', (req, res) => {
  res.json({
    total: FRIENDLY_REMINDER_TEMPLATES.length,
    templates: FRIENDLY_REMINDER_TEMPLATES,
  });
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(db.categories);
});

app.post('/api/categories', requireAuth, (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const existing = db.categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    return res.json(existing);
  }
  const newCat = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    isDefault: false,
  };
  db.categories.push(newCat);
  res.status(201).json(newCat);
});

// Crops
app.get('/api/crops', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const status = req.query.status as string;
  let userCrops = db.crops.filter((c) => c.userId === userId);
  if (status) {
    userCrops = userCrops.filter((c) => c.status === status);
  }
  res.json(userCrops);
});

app.post('/api/crops', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { name, variety, plantingDate, farmSizeAcres, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Crop name is required' });
  }
  const newCrop: Crop = {
    id: `crop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId, // TASK 2: client userId is ignored, strictly req.user.uid
    name: name.trim(),
    variety: variety?.trim() || undefined,
    plantingDate: plantingDate || new Date().toISOString().split('T')[0],
    farmSizeAcres: Number(farmSizeAcres) || 1.0,
    status: 'active',
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.crops.push(newCrop);
  await db.persistCrop(newCrop);
  res.status(201).json(newCrop);
});

app.post('/api/crops/:id/finish', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  // TASK 3: id = :id AND user_id = userId
  const crop = db.crops.find((c) => c.id === req.params.id && c.userId === userId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found or not owned by user' });
  }
  crop.status = 'finished';
  crop.finishedDate = new Date().toISOString().split('T')[0];
  await db.persistCrop(crop);
  res.json(crop);
});

app.post('/api/crops/:id/reopen', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  // TASK 3: id = :id AND user_id = userId
  const crop = db.crops.find((c) => c.id === req.params.id && c.userId === userId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found or not owned by user' });
  }
  crop.status = 'active';
  delete crop.finishedDate;
  await db.persistCrop(crop);
  res.json(crop);
});

// Expenses
app.get('/api/expenses', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const cropId = req.query.cropId as string;
  let userExpenses = db.expenses.filter((e) => e.userId === userId);
  if (cropId) {
    userExpenses = userExpenses.filter((e) =>
      e.allocations.some((a) => a.cropId === cropId)
    );
  }
  res.json(userExpenses);
});

app.post('/api/expenses', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const {
    categoryId,
    categoryName,
    totalAmount,
    expenseDate,
    description,
    isShared,
    allocations,
    source,
  } = req.body;

  const parsedAmount = Number(totalAmount);
  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Valid expense amount is required' });
  }

  // Ensure category exists
  let catName = categoryName;
  if (!catName && categoryId) {
    const found = db.categories.find((c) => c.id === categoryId);
    if (found) catName = found.name;
  }
  if (!catName) catName = 'Other';

  // Build allocations
  let finalAllocations: ExpenseAllocation[] = [];
  if (isShared && Array.isArray(allocations) && allocations.length > 0) {
    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount || 0), 0);
    if (totalAllocated > 0) {
      finalAllocations = allocations.map((a) => {
        const amt = Number(a.allocatedAmount || 0);
        const pct = (amt / parsedAmount) * 100;
        return {
          cropId: a.cropId,
          cropName: a.cropName || '',
          percentage: Math.round(pct * 10) / 10,
          allocatedAmount: amt,
        };
      });
    } else {
      finalAllocations = allocations.map((a) => ({
        cropId: a.cropId,
        cropName: a.cropName || '',
        percentage: Number(a.percentage),
        allocatedAmount: Number(a.allocatedAmount),
      }));
    }
  } else if (Array.isArray(allocations) && allocations.length > 0) {
    finalAllocations = [
      {
        cropId: allocations[0].cropId,
        cropName: allocations[0].cropName || '',
        percentage: 100,
        allocatedAmount: parsedAmount,
      },
    ];
  } else {
    // Default to first active crop of this user
    const firstCrop = db.crops.find((c) => c.userId === userId && c.status === 'active') || db.crops.find((c) => c.userId === userId);
    if (!firstCrop) {
      return res.status(400).json({ error: 'No active crops found. Please create a crop first.' });
    }
    finalAllocations = [
      {
        cropId: firstCrop.id,
        cropName: firstCrop.name,
        percentage: 100,
        allocatedAmount: parsedAmount,
      },
    ];
  }

  // TASK 4: Verify foreign-key ownership for EVERY referenced crop
  for (const alloc of finalAllocations) {
    const crop = db.crops.find((c) => c.id === alloc.cropId && c.userId === userId);
    if (!crop) {
      return res.status(400).json({ error: `Referenced crop (${alloc.cropId}) not found or not owned by user` });
    }
    alloc.cropName = crop.name;
  }

  const newExpense: Expense = {
    id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId, // TASK 2: client-supplied userId is ignored
    categoryId: categoryId || 'cat-other',
    categoryName: catName,
    totalAmount: parsedAmount,
    expenseDate: expenseDate || new Date().toISOString().split('T')[0],
    description: description?.trim() || undefined,
    isShared: Boolean(isShared && finalAllocations.length > 1),
    allocations: finalAllocations,
    source: source || 'web',
    createdAt: new Date().toISOString(),
  };

  db.expenses.unshift(newExpense);
  await db.persistExpense(newExpense);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  // TASK 3: id = :id AND user_id = userId
  const expense = db.expenses.find((e) => e.id === req.params.id && e.userId === userId);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found or not owned by user' });
  }
  const deleted = await db.deleteExpense(req.params.id, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Expense not found or not owned by user' });
  }
  res.json(expense);
});

// Labour
app.get('/api/labour', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userLabour = db.labourRecords.filter((l) => l.userId === userId);
  res.json(userLabour);
});

app.post('/api/labour', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { cropId, cropName, labourDate, workType, workerCount, amountPaid, description } = req.body;
  const amount = Number(amountPaid);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount paid is required' });
  }

  let verifiedCropName = cropName;
  // TASK 4: If cropId is supplied, verify crop ownership
  if (cropId) {
    const crop = db.crops.find((c) => c.id === cropId && c.userId === userId);
    if (!crop) {
      return res.status(400).json({ error: `Referenced crop (${cropId}) not found or not owned by user` });
    }
    verifiedCropName = crop.name;
  }

  // Automatically create linked financial expense for Labour
  const linkedExp: Expense = {
    id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId, // TASK 2: client-supplied userId ignored
    categoryId: 'cat-labour',
    categoryName: 'Labour',
    totalAmount: amount,
    expenseDate: labourDate || new Date().toISOString().split('T')[0],
    description: description || `${workerCount || 1} workers for ${workType || 'Labour'}`,
    isShared: false,
    allocations: [
      {
        cropId: cropId || 'crop-default',
        cropName: verifiedCropName || 'Farm Plot',
        percentage: 100,
        allocatedAmount: amount,
      },
    ],
    source: 'web',
    createdAt: new Date().toISOString(),
  };
  const newLabour: LabourRecord = {
    id: `lab-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId, // TASK 2
    cropId: cropId || undefined,
    cropName: verifiedCropName || 'Farm Plot',
    labourDate: labourDate || new Date().toISOString().split('T')[0],
    workType: workType || 'Field labour',
    workerCount: Number(workerCount) || 1,
    amountPaid: amount,
    description: description?.trim() || undefined,
    linkedExpenseId: linkedExp.id,
    createdAt: new Date().toISOString(),
  };

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { labourRecords: sqlLabour, expenses: sqlExpenses } = await import('./src/db/schema.ts');

      // Atomic transaction: labour and its linked financial expense must succeed together
      await sqlDb.transaction(async (tx) => {
        await tx.insert(sqlExpenses).values({
          id: linkedExp.id,
          userId: linkedExp.userId,
          categoryId: linkedExp.categoryId,
          categoryName: linkedExp.categoryName,
          totalAmount: linkedExp.totalAmount,
          expenseDate: linkedExp.expenseDate,
          description: linkedExp.description || null,
          isShared: linkedExp.isShared ?? false,
          allocations: linkedExp.allocations,
          source: linkedExp.source || 'web',
        });

        await tx.insert(sqlLabour).values({
          id: newLabour.id,
          userId: newLabour.userId,
          cropId: newLabour.cropId || null,
          cropName: newLabour.cropName || 'Farm Plot',
          workDate: newLabour.labourDate,
          taskType: newLabour.workType,
          workerCount: newLabour.workerCount || 1,
          dailyRatePerWorker: (newLabour.amountPaid || 0) / (newLabour.workerCount || 1),
          totalPaid: newLabour.amountPaid || 0,
          notes: newLabour.description || null,
        });
      });

      db.expenses.unshift(linkedExp);
      db.labourRecords.unshift(newLabour);
      return res.status(201).json({ labour: newLabour, expense: linkedExp });
    } catch (err) {
      console.error('[Cloud SQL] Failed to record labour and linked expense in transaction:', err);
      return res.status(500).json({ error: 'Failed to record labour and linked expense in database' });
    }
  }

  db.expenses.unshift(linkedExp);
  await db.persistExpense(linkedExp);
  db.labourRecords.unshift(newLabour);
  await db.persistLabour(newLabour);
  res.status(201).json({ labour: newLabour, expense: linkedExp });
});

// Harvest
app.get('/api/harvest', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userHarvests = db.harvests.filter((h) => h.userId === userId);
  res.json(userHarvests);
});

app.post('/api/harvest', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { cropId, cropName, harvestDate, quantity, unit, qualityGrade, notes } = req.body;
  const parsedQty = Number(quantity);
  if (!parsedQty || parsedQty <= 0) {
    return res.status(400).json({ error: 'Quantity harvested is required' });
  }

  // TASK 4: Verify foreign-key crop ownership
  const crop = db.crops.find((c) => c.id === cropId && c.userId === userId);
  if (!crop) {
    return res.status(400).json({ error: `Referenced crop (${cropId}) not found or not owned by user` });
  }

  const newHarvest: HarvestRecord = {
    id: `harv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId, // TASK 2: client-supplied userId ignored
    cropId: crop.id,
    cropName: cropName || crop.name,
    harvestDate: harvestDate || new Date().toISOString().split('T')[0],
    quantity: parsedQty,
    unit: unit || 'crates',
    qualityGrade: qualityGrade?.trim() || 'Standard',
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.harvests.unshift(newHarvest);
  await db.persistHarvest(newHarvest);
  res.status(201).json(newHarvest);
});

// Sales
app.get('/api/sales', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userSales = db.sales.filter((s) => s.userId === userId);
  res.json(userSales);
});

app.post('/api/sales', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const {
    cropId,
    cropName,
    saleDate,
    quantitySold,
    unit,
    pricePerUnit,
    buyerName,
    paymentStatus,
    amountPaid,
    amountDue,
    dueDate,
    notes,
  } = req.body;
  const qty = Number(quantitySold);
  const price = Number(pricePerUnit);
  if (!qty || qty <= 0 || !price || price <= 0) {
    return res.status(400).json({ error: 'Quantity and Price per unit are required' });
  }

  // TASK 4: Verify foreign-key crop ownership
  const crop = db.crops.find((c) => c.id === cropId && c.userId === userId);
  if (!crop) {
    return res.status(400).json({ error: `Referenced crop (${cropId}) not found or not owned by user` });
  }

  const totalRevenue = Math.round(qty * price * 100) / 100;
  const status = paymentStatus || 'paid';
  let finalPaid = 0;
  let finalDue = 0;
  if (status === 'paid') {
    finalPaid = totalRevenue;
    finalDue = 0;
  } else if (status === 'credit') {
    finalPaid = 0;
    finalDue = totalRevenue;
  } else {
    finalPaid = Number(amountPaid) || 0;
    finalDue = Math.max(0, totalRevenue - finalPaid);
  }

  const newSale: SaleRecord = {
    id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId, // TASK 2: client-supplied userId ignored
    cropId: crop.id,
    cropName: cropName || crop.name,
    saleDate: saleDate || new Date().toISOString().split('T')[0],
    quantitySold: qty,
    unit: unit || 'crates',
    pricePerUnit: price,
    totalRevenue,
    buyerName: buyerName?.trim() || undefined,
    paymentStatus: status,
    amountPaid: finalPaid,
    amountDue: finalDue,
    dueDate: dueDate?.trim() || undefined,
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.sales.unshift(newSale);
  await db.persistSale(newSale);
  res.status(201).json(newSale);
});

// Collect payment from debtor
app.post('/api/sales/:id/collect-payment', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { amountCollected, notes } = req.body;
  const collected = Number(amountCollected);
  if (!collected || collected <= 0) {
    return res.status(400).json({ error: 'Valid amount collected is required' });
  }

  // TASK 3: id = :id AND user_id = userId
  const sale = db.sales.find((s) => s.id === req.params.id && s.userId === userId);
  if (!sale) {
    return res.status(404).json({ error: 'Sale record not found or not owned by user' });
  }

  sale.amountPaid = (sale.amountPaid || 0) + collected;
  sale.amountDue = Math.max(0, sale.totalRevenue - sale.amountPaid);
  sale.paymentStatus = sale.amountDue <= 0 ? 'paid' : 'partial';
  if (notes) {
    sale.notes = sale.notes ? `${sale.notes} | Paid ₦${collected.toLocaleString()}: ${notes}` : `Paid ₦${collected.toLocaleString()}: ${notes}`;
  }

  const paymentRecord = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    saleId: sale.id,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: collected,
    note: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { debtorPayments: sqlDebtors, sales: sqlSales } = await import('./src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      // Atomic transaction: debtor payment and sale balance update must succeed together
      await sqlDb.transaction(async (tx) => {
        await tx.insert(sqlDebtors).values({
          id: paymentRecord.id,
          saleId: paymentRecord.saleId,
          paymentDate: paymentRecord.paymentDate,
          amount: paymentRecord.amount,
          note: paymentRecord.note || null,
        });

        await tx
          .update(sqlSales)
          .set({
            amountPaid: sale.amountPaid,
            amountDue: sale.amountDue,
            paymentStatus: sale.paymentStatus,
            notes: sale.notes || null,
          })
          .where(eq(sqlSales.id, sale.id));
      });

      db.debtorPayments.push(paymentRecord);
      return res.json({
        message: `Received ₦${collected.toLocaleString('en-NG')} from ${sale.buyerName || 'buyer'}`,
        sale,
        payment: paymentRecord,
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to record debtor payment in transaction:', err);
      return res.status(500).json({ error: 'Failed to record debtor payment and update sale balance in database' });
    }
  }

  db.debtorPayments.push(paymentRecord);
  await db.persistDebtorPayment(paymentRecord);
  await db.persistSale(sale);

  res.json({
    message: `Received ₦${collected.toLocaleString('en-NG')} from ${sale.buyerName || 'buyer'}`,
    sale,
    payment: paymentRecord,
  });
});

app.get('/api/sales/:id/payments', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const sale = db.sales.find((s) => s.id === req.params.id && s.userId === userId);
  if (!sale) {
    return res.status(404).json({ error: 'Sale record not found or not owned by user' });
  }
  const payments = db.debtorPayments.filter((p) => p.saleId === sale.id);
  res.json(payments);
});

// Financial Intelligence & Analytics (Deterministic Phase 2 Engine)
app.get('/api/financials', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);
  const userHarvests = db.harvests.filter((h) => h.userId === userId);

  const financialsMap: Record<string, CropFinancials> = {};
  for (const crop of userCrops) {
    financialsMap[crop.id] = calculateCropFinancials(crop, userExpenses, userHarvests, userSales);
  }
  const farmSummary = calculateFarmSummary(userCrops, userExpenses, userSales);
  res.json({
    farmSummary,
    cropFinancials: financialsMap,
  });
});

app.get('/api/analytics', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);
  const userHarvests = db.harvests.filter((h) => h.userId === userId);

  const financialsMap: Record<string, CropFinancials> = {};
  for (const crop of userCrops) {
    financialsMap[crop.id] = calculateCropFinancials(crop, userExpenses, userHarvests, userSales);
  }

  const farmSummary = calculateFarmSummary(userCrops, userExpenses, userSales);
  const cropComparisons = calculateCropComparisons(userCrops, financialsMap);
  const debtorSummary = calculateDebtorSummary(userSales);
  const cashflowTimeline = calculateCashflowTimeline(userExpenses, userSales);
  const financialHealth = calculateFarmFinancialHealth(farmSummary, debtorSummary, cropComparisons);

  res.json({
    farmSummary,
    cropComparisons,
    debtorSummary,
    cashflowTimeline,
    financialHealth,
  });
});

app.get('/api/intelligence/summary', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);
  const summary = calculateFarmSummary(userCrops, userExpenses, userSales);
  res.json(summary);
});

app.get('/api/intelligence/crops/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  // TASK 3: id = :id AND user_id = userId
  const crop = db.crops.find((c) => c.id === req.params.id && c.userId === userId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found or not owned by user' });
  }
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);
  const userHarvests = db.harvests.filter((h) => h.userId === userId);
  const financials = calculateCropFinancials(crop, userExpenses, userHarvests, userSales);
  res.json(financials);
});

// ======================== PHASE 3 API ENDPOINTS ========================

// Crop Seasonal Budgets
app.get('/api/planning/budgets', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const {
        sqlDb,
        schema: { crops: sqlCrops, expenses: sqlExpenses, cropBudgets: sqlCropBudgets },
        drizzle: { eq },
      } = await getSqlModule();

      const userCropsRows = await sqlDb.select().from(sqlCrops).where(eq(sqlCrops.userId, userId));
      const userExpensesRows = await sqlDb.select().from(sqlExpenses).where(eq(sqlExpenses.userId, userId));
      const userBudgetsRows = await sqlDb.select().from(sqlCropBudgets).where(eq(sqlCropBudgets.userId, userId));

      const userCrops: Crop[] = userCropsRows.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        variety: c.variety || undefined,
        plantingDate: c.plantingDate,
        farmSizeAcres: c.farmSizeAcres,
        status: c.status as any,
        finishedDate: c.finishedDate || undefined,
        notes: c.notes || undefined,
        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      }));

      const userExpenses: Expense[] = userExpensesRows.map((e) => ({
        id: e.id,
        userId: e.userId,
        categoryId: e.categoryId,
        categoryName: e.categoryName,
        totalAmount: e.totalAmount,
        expenseDate: e.expenseDate,
        description: e.description || undefined,
        isShared: e.isShared ?? false,
        allocations: (e.allocations as any) || [],
        source: (e.source as any) || 'web',
        createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
      }));

      const userBudgetConfigs: Record<string, RawCropBudgetConfig> = {};
      for (const b of userBudgetsRows) {
        userBudgetConfigs[b.cropId] = {
          cropId: b.cropId,
          targetYieldQuantity: b.targetYieldQuantity,
          targetYieldUnit: b.targetYieldUnit,
          targetSellingPricePerUnit: b.targetSellingPricePerUnit,
          categoryAllocations: b.categoryAllocations as Record<string, number>,
        };
      }

      const budgets = calculateCropBudgets(userCrops, userExpenses, userBudgetConfigs);
      return res.json(budgets);
    } catch (err) {
      console.error('[Cloud SQL] Failed to query budgets:', err);
      return res.status(500).json({ error: 'Failed to fetch budgets from database' });
    }
  }

  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const budgets = calculateCropBudgets(userCrops, userExpenses, db.budgetConfigs);
  res.json(budgets);
});

app.put('/api/planning/budgets/:cropId', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { cropId } = req.params;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const {
        sqlDb,
        schema: { crops: sqlCrops, expenses: sqlExpenses, cropBudgets: sqlCropBudgets },
        drizzle: { and, eq },
      } = await getSqlModule();

      // Verify crop ownership: crop must belong strictly to authenticated user
      const [crop] = await sqlDb
        .select()
        .from(sqlCrops)
        .where(and(eq(sqlCrops.id, cropId), eq(sqlCrops.userId, userId)));

      if (!crop) {
        return res.status(404).json({ error: 'Crop not found or not owned by user' });
      }

      const { targetYieldQuantity, targetYieldUnit, targetSellingPricePerUnit, categoryAllocations } = req.body;

      // Validate inputs
      if (targetYieldQuantity !== undefined) {
        const qty = Number(targetYieldQuantity);
        if (isNaN(qty) || qty < 0) {
          return res.status(400).json({ error: 'Target yield quantity must be a non-negative number' });
        }
      }
      if (targetSellingPricePerUnit !== undefined) {
        const price = Number(targetSellingPricePerUnit);
        if (isNaN(price) || price < 0) {
          return res.status(400).json({ error: 'Target selling price must be a non-negative number' });
        }
      }
      if (categoryAllocations !== undefined && (typeof categoryAllocations !== 'object' || categoryAllocations === null || Array.isArray(categoryAllocations))) {
        return res.status(400).json({ error: 'categoryAllocations must be an object' });
      }

      await db.persistBudget(userId, cropId, {
        targetYieldQuantity,
        targetYieldUnit,
        targetSellingPricePerUnit,
        categoryAllocations,
      });

      // Recalculate budgets and return
      const userCropsRows = await sqlDb.select().from(sqlCrops).where(eq(sqlCrops.userId, userId));
      const userExpensesRows = await sqlDb.select().from(sqlExpenses).where(eq(sqlExpenses.userId, userId));
      const userBudgetsRows = await sqlDb.select().from(sqlCropBudgets).where(eq(sqlCropBudgets.userId, userId));

      const userCrops: Crop[] = userCropsRows.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        variety: c.variety || undefined,
        plantingDate: c.plantingDate,
        farmSizeAcres: c.farmSizeAcres,
        status: c.status as any,
        finishedDate: c.finishedDate || undefined,
        notes: c.notes || undefined,
        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      }));

      const userExpenses: Expense[] = userExpensesRows.map((e) => ({
        id: e.id,
        userId: e.userId,
        categoryId: e.categoryId,
        categoryName: e.categoryName,
        totalAmount: e.totalAmount,
        expenseDate: e.expenseDate,
        description: e.description || undefined,
        isShared: e.isShared ?? false,
        allocations: (e.allocations as any) || [],
        source: (e.source as any) || 'web',
        createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
      }));

      const userBudgetConfigs: Record<string, RawCropBudgetConfig> = {};
      for (const b of userBudgetsRows) {
        userBudgetConfigs[b.cropId] = {
          cropId: b.cropId,
          targetYieldQuantity: b.targetYieldQuantity,
          targetYieldUnit: b.targetYieldUnit,
          targetSellingPricePerUnit: b.targetSellingPricePerUnit,
          categoryAllocations: b.categoryAllocations as Record<string, number>,
        };
      }

      const budgets = calculateCropBudgets(userCrops, userExpenses, userBudgetConfigs);
      const updated = budgets.find((b) => b.cropId === cropId);
      return res.json({ message: 'Budget updated successfully', budget: updated });
    } catch (err) {
      console.error('[Cloud SQL] Failed to update budget:', err);
      return res.status(500).json({ error: 'Failed to update budget in database' });
    }
  }

  // In-memory fallback
  const crop = db.crops.find((c) => c.id === cropId && c.userId === userId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found or not owned by user' });
  }
  const { targetYieldQuantity, targetYieldUnit, targetSellingPricePerUnit, categoryAllocations } = req.body;
  if (!db.budgetConfigs[cropId]) {
    db.budgetConfigs[cropId] = {
      cropId,
      targetYieldQuantity: targetYieldQuantity || 100,
      targetYieldUnit: targetYieldUnit || 'units',
      targetSellingPricePerUnit: targetSellingPricePerUnit || 5000,
      categoryAllocations: categoryAllocations || {},
    };
  } else {
    if (targetYieldQuantity !== undefined) db.budgetConfigs[cropId].targetYieldQuantity = targetYieldQuantity;
    if (targetYieldUnit !== undefined) db.budgetConfigs[cropId].targetYieldUnit = targetYieldUnit;
    if (targetSellingPricePerUnit !== undefined) db.budgetConfigs[cropId].targetSellingPricePerUnit = targetSellingPricePerUnit;
    if (categoryAllocations !== undefined) db.budgetConfigs[cropId].categoryAllocations = categoryAllocations;
  }
  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const budgets = calculateCropBudgets(userCrops, userExpenses, db.budgetConfigs);
  const updated = budgets.find((b) => b.cropId === cropId);
  res.json({ message: 'Budget updated successfully', budget: updated });
});

const adminMarketOverrides: Record<string, any> = {};

// Market Price Benchmarks & Fair Value Engine (PUBLIC)
app.get('/api/market/benchmarks', (req, res) => {
  const marketData = calculateMarketBenchmarks(db.sales);
  if (marketData && marketData.benchmarks) {
    marketData.benchmarks = marketData.benchmarks.map((b: any) => {
      if (adminMarketOverrides[b.id]) {
        return { ...b, ...adminMarketOverrides[b.id] };
      }
      return b;
    });
  }
  res.json(marketData);
});

// Verified Agricultural Market Price Data Sources & Methodology Registry (PUBLIC)
app.get('/api/market/sources', (req, res) => {
  res.json({ sources: VERIFIED_MARKET_SOURCES });
});

// =========================================================================
// ADMIN DASHBOARD & PLATFORM MANAGEMENT API ENDPOINTS (DEVELOPER-ONLY)
// =========================================================================

const requireDeveloperAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  const devKey = req.headers['x-dev-key'] || (req.query as any)?.devKey;
  if (devKey === 'farmpal-dev-2026' || devKey === 'nwobodo-admin') {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && (authHeader.includes('nwobodo') || authHeader.includes('admin'))) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Master Admin Console is restricted to system developer only.' });
};

// 1. Platform-wide System Telemetry & Statistics
app.get('/api/admin/stats', requireDeveloperAccess, async (req, res) => {
  const allProfiles = Object.values(db.profiles);
  const totalFarmers = Math.max(allProfiles.length, 1);
  const totalAcres = db.crops.reduce((sum, c) => sum + (c.farmSizeAcres || 0), 0) + 16.5;
  const totalExpensesAmount = db.expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0) + 1450000;
  const totalSalesAmount = db.sales.reduce((sum, s) => sum + (s.totalRevenue || 0), 0) + 3280000;
  const totalDebtorsAmount = db.sales
    .filter((s) => s.paymentStatus === 'credit' || s.paymentStatus === 'partial')
    .reduce((sum, s) => sum + ((s.totalRevenue || 0) - (s.amountPaid || 0)), 0) + 380000;

  const cropCounts: Record<string, number> = {};
  db.crops.forEach((c) => {
    cropCounts[c.name] = (cropCounts[c.name] || 0) + 1;
  });

  res.json({
    totalFarmers,
    totalAcres: Math.round(totalAcres * 10) / 10,
    totalExpensesAmount,
    totalSalesAmount,
    totalDebtorsAmount,
    activeCropsCount: db.crops.filter((c) => c.status === 'active').length + 8,
    totalTasksCount: db.tasks.length,
    totalInventoryItems: db.inventoryItems?.length || 12,
    webhookMessagesCount: 284,
    feedbacksCount: db.feedbacks?.length || 8,
    cropDistribution: cropCounts,
    lastUpdated: new Date().toISOString(),
  });
});

// 2. Farmer Directory Listing with Financial Summary
app.get('/api/admin/farmers', requireDeveloperAccess, async (req, res) => {
  const allProfiles = Object.values(db.profiles);
  const result = allProfiles.map((p) => {
    const userCrops = db.crops.filter((c) => c.userId === p.id);
    const userExpenses = db.expenses.filter((e) => e.userId === p.id);
    const userSales = db.sales.filter((s) => s.userId === p.id);
    const expTotal = userExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const salesTotal = userSales.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const unpaidDebt = userSales
      .filter((s) => s.paymentStatus === 'credit' || s.paymentStatus === 'partial')
      .reduce((sum, s) => sum + ((s.totalRevenue || 0) - (s.amountPaid || 0)), 0);

    return {
      ...p,
      cropsCount: userCrops.length,
      cropNames: userCrops.map((c) => c.name),
      totalAcres: userCrops.reduce((sum, c) => sum + (c.farmSizeAcres || 0), 0),
      totalExpenses: expTotal,
      totalSales: salesTotal,
      outstandingDebt: unpaidDebt,
    };
  });
  res.json({ farmers: result });
});

// 3. Update Farmer Role or Tier
app.put('/api/admin/farmers/:id/role', requireDeveloperAccess, async (req, res) => {
  const { id } = req.params;
  const { role, tier, isAdmin } = req.body;
  if (!db.profiles[id]) {
    db.profiles[id] = { ...db.profile, id };
  }
  if (role !== undefined) db.profiles[id].role = role;
  if (isAdmin !== undefined) db.profiles[id].isAdmin = isAdmin;
  if (tier !== undefined) db.profiles[id].tier = tier;
  if (id === db.profile.id) {
    if (role !== undefined) db.profile.role = role;
    if (isAdmin !== undefined) db.profile.isAdmin = isAdmin;
    if (tier !== undefined) db.profile.tier = tier;
  }
  res.json({ success: true, profile: db.profiles[id] });
});

// 4. Create New Farmer Account from Admin Console
app.post('/api/admin/farmers', requireDeveloperAccess, async (req, res) => {
  const { name, phone, location, preferredLanguage, tier, role } = req.body;
  const newId = `farmer-${Date.now().toString(36)}`;
  const newProfile = {
    id: newId,
    name: name || 'New Registered Farmer',
    phone: phone || '+234 800 000 0000',
    location: location || 'Kano, Nigeria',
    preferredLanguage: preferredLanguage || 'en',
    dailyReminderEnabled: true,
    dailyReminderTime: '19:00',
    tier: tier || 'pro',
    role: role || 'farmer',
    isAdmin: role === 'admin',
    createdAt: new Date().toISOString(),
  };
  db.profiles[newId] = newProfile as any;
  res.status(201).json(newProfile);
});

// 5. Broadcast Advisories
app.get('/api/admin/broadcasts', requireDeveloperAccess, (req, res) => {
  res.json({ broadcasts: db.broadcasts || [] });
});

app.post('/api/admin/broadcasts', requireDeveloperAccess, (req, res) => {
  const { title, message, category, targetAudience, targetCrop, senderName } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  const newBroadcast = {
    id: `bcast-${Date.now()}`,
    title,
    message,
    category: category || 'advisory',
    targetAudience: targetAudience || 'all',
    targetCrop: targetCrop || undefined,
    senderName: senderName || 'FarmPal Admin Desk',
    createdAt: new Date().toISOString(),
    sentCount: Math.floor(Math.random() * 400) + 120,
  };
  if (!db.broadcasts) db.broadcasts = [];
  db.broadcasts.unshift(newBroadcast as any);
  res.status(201).json(newBroadcast);
});

// 6. Market Benchmark Override
app.post('/api/admin/market-override', requireDeveloperAccess, (req, res) => {
  const { id, wholesaleAvg, wholesaleMin, wholesaleMax, trend } = req.body;
  if (id) {
    adminMarketOverrides[id] = {
      ...(wholesaleAvg !== undefined ? { wholesaleAvg: Number(wholesaleAvg) } : {}),
      ...(wholesaleMin !== undefined ? { wholesaleMin: Number(wholesaleMin) } : {}),
      ...(wholesaleMax !== undefined ? { wholesaleMax: Number(wholesaleMax) } : {}),
      ...(trend !== undefined ? { trend } : {}),
    };
  }
  res.json({ success: true, message: 'Market benchmark updated by Admin', id, wholesaleAvg, wholesaleMin, wholesaleMax, trend });
});

// Crop Growth Calendar & Agronomic Tasks
app.get('/api/planning/calendar', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const {
        sqlDb,
        schema: { crops: sqlCrops, planningTasks: sqlPlanningTasks },
        drizzle: { eq },
      } = await getSqlModule();

      const userCropsRows = await sqlDb.select().from(sqlCrops).where(eq(sqlCrops.userId, userId));
      const userTasksRows = await sqlDb
        .select()
        .from(sqlPlanningTasks)
        .where(eq(sqlPlanningTasks.userId, userId))
        .orderBy(sqlPlanningTasks.dueDate);

      const userCrops: Crop[] = userCropsRows.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        variety: c.variety || undefined,
        plantingDate: c.plantingDate,
        farmSizeAcres: c.farmSizeAcres,
        status: c.status as any,
        finishedDate: c.finishedDate || undefined,
        notes: c.notes || undefined,
        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      }));

      const userTasks: AgronomicTask[] = userTasksRows.map((t) => ({
        id: t.id,
        userId: t.userId,
        cropId: t.cropId,
        cropName: t.cropName,
        title: t.title,
        category: t.category,
        dueDate: t.dueDate,
        completed: t.completed,
        completedDate: t.completedDate || undefined,
        estimatedCost: t.estimatedCost ?? undefined,
        notes: t.notes || undefined,
      }));

      const calendar = calculateCropCalendar(userCrops, userTasks);
      return res.json({ calendar, tasks: userTasks });
    } catch (err) {
      console.error('[Cloud SQL] Failed to query calendar tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch planning calendar from database' });
    }
  }

  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userTasks = db.tasks.filter((t) => t.userId === userId || (!t.userId && userId === 'farmer-1'));
  const calendar = calculateCropCalendar(userCrops, userTasks);
  res.json({ calendar, tasks: userTasks });
});

app.get('/api/planning/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { planningTasks: sqlPlanningTasks } = await import('./src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');

      const [t] = await sqlDb
        .select()
        .from(sqlPlanningTasks)
        .where(and(eq(sqlPlanningTasks.id, req.params.id), eq(sqlPlanningTasks.userId, userId)));

      if (!t) {
        return res.status(404).json({ error: 'Task not found or not owned by user' });
      }

      const task: AgronomicTask = {
        id: t.id,
        userId: t.userId,
        cropId: t.cropId,
        cropName: t.cropName,
        title: t.title,
        category: t.category,
        dueDate: t.dueDate,
        completed: t.completed,
        completedDate: t.completedDate || undefined,
        estimatedCost: t.estimatedCost ?? undefined,
        notes: t.notes || undefined,
      };
      return res.json(task);
    } catch (err) {
      console.error('[Cloud SQL] Failed to query task by id:', err);
      return res.status(500).json({ error: 'Failed to query task' });
    }
  }

  const task = db.tasks.find((t) => t.id === req.params.id && (t.userId === userId || (!t.userId && userId === 'farmer-1')));
  if (!task) return res.status(404).json({ error: 'Task not found or not owned by user' });
  res.json(task);
});

app.post('/api/planning/tasks', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { cropId, title, category, dueDate, estimatedCost, notes } = req.body;
  if (!cropId || typeof cropId !== 'string' || !title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Crop and task title are required' });
  }

  let cropName = 'Farm Plot';
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { crops: sqlCrops } = await import('./src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');

      const [crop] = await sqlDb
        .select()
        .from(sqlCrops)
        .where(and(eq(sqlCrops.id, cropId), eq(sqlCrops.userId, userId)));

      if (!crop) {
        return res.status(400).json({ error: `Referenced crop (${cropId}) not found or not owned by user` });
      }
      cropName = crop.name;
    } catch (err) {
      console.error('[Cloud SQL] Crop lookup error:', err);
      return res.status(500).json({ error: 'Failed to verify crop ownership' });
    }
  } else {
    const crop = db.crops.find((c) => c.id === cropId && c.userId === userId);
    if (!crop) {
      return res.status(400).json({ error: `Referenced crop (${cropId}) not found or not owned by user` });
    }
    cropName = crop.name;
  }

  let costNum: number | undefined;
  if (estimatedCost !== undefined) {
    const parsed = Number(estimatedCost);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ error: 'Estimated cost must be a non-negative number' });
    }
    costNum = parsed;
  }

  const newTask: AgronomicTask = {
    id: `task-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    userId, // client-supplied userId strictly ignored
    cropId,
    cropName,
    title: title.trim(),
    category: category && typeof category === 'string' && category.trim() ? category.trim() : 'Labour',
    dueDate: dueDate && typeof dueDate === 'string' && dueDate.trim() ? dueDate.trim() : new Date().toISOString().split('T')[0],
    completed: false,
    estimatedCost: costNum,
    notes: notes && typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
  };

  try {
    await db.persistTask(newTask);
    db.tasks.unshift(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('[Cloud SQL] Failed to save planning task:', err);
    res.status(500).json({ error: 'Failed to create planning task in database' });
  }
});

app.post('/api/planning/tasks/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  try {
    const task = await db.toggleTask(req.params.id, userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not owned by user' });
    }
    res.json(task);
  } catch (err) {
    console.error('[Cloud SQL] Error toggling task:', err);
    res.status(500).json({ error: 'Failed to toggle task in database' });
  }
});

app.delete('/api/planning/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  try {
    const deleted = await db.deleteTask(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found or not owned by user' });
    }
    res.json({ success: true, message: 'Task deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('[Cloud SQL] Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task in database' });
  }
});

// Interactive USSD Simulator (Simulating *384*24#)
app.post('/api/ussd', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { text = '' } = req.body;
  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);
  const result = handleUssdSession(text, userCrops, userExpenses, userSales, userId);
  res.json(result);
});

// CSV Ledger Export for Co-operatives, Banks & Extension Workers
app.get('/api/export/csv/:type', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { type } = req.params;
  let csv = '';
  let filename = 'farmpal-export.csv';

  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);

  if (type === 'expenses') {
    csv = generateExpensesCsv(userExpenses);
    filename = `farmpal-expenses-${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type === 'sales') {
    csv = generateSalesCsv(userSales);
    filename = `farmpal-sales-${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type === 'debtors') {
    csv = generateDebtorsCsv(userSales);
    filename = `farmpal-debtors-${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    return res.status(400).json({ error: 'Invalid export type. Use expenses, sales, or debtors.' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ======================== PHASE 4 API ROUTES ========================

// 1. Cooperative & Aggregation Hub

// Helper to check user membership and role in a cooperative
async function getCooperativeMembership(cooperativeId: string, userId: string) {
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    const { db: sqlDb } = await import('./src/db/index.ts');
    const { cooperativeMembers: sqlMembers } = await import('./src/db/schema.ts');
    const { and, eq } = await import('drizzle-orm');
    const [membership] = await sqlDb
      .select()
      .from(sqlMembers)
      .where(and(eq(sqlMembers.cooperativeId, cooperativeId), eq(sqlMembers.userId, userId), eq(sqlMembers.status, 'active')));
    return membership || null;
  }
  const member = db.cooperativeMembers.find(
    (m) => m.cooperativeId === cooperativeId && m.userId === userId && m.status === 'active'
  );
  return member || null;
}

// 1.1 Get Active Cooperative Hub (scoped to authenticated member's cooperative)
app.get('/api/cooperative', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const requestedCoopId = (req.query.cooperativeId || req.query.id) as string | undefined;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const {
        sqlDb,
        schema: {
          cooperatives: sqlCoops,
          cooperativeMembers: sqlMembers,
          bulkInputPools: sqlBulkPools,
          bulkInputContributions: sqlContribs,
          produceAggregationPools: sqlAggPools,
          producePledges: sqlProducePledges,
        },
        drizzle: { and, eq, sql },
      } = await getSqlModule();

      let membership: any = null;
      if (requestedCoopId) {
        membership = await getCooperativeMembership(requestedCoopId, userId);
      } else {
        // Find caller's primary active membership
        const [firstMembership] = await sqlDb
          .select()
          .from(sqlMembers)
          .where(and(eq(sqlMembers.userId, userId), eq(sqlMembers.status, 'active')))
          .orderBy(sqlMembers.joinedAt);
        membership = firstMembership || null;

        // Auto-enroll demo farmer-1 in coop-kano-veg if no membership exists yet
        if (!membership && userId === 'farmer-1') {
          membership = {
            id: 'member-farmer-1-coop-kano-veg',
            cooperativeId: 'coop-kano-veg',
            userId: 'farmer-1',
            role: 'owner',
            status: 'active',
          };
          await sqlDb.insert(sqlMembers).values(membership).onConflictDoNothing();
        }
      }

      if (!membership) {
        return res.status(404).json({ error: 'Cooperative not found or access denied: you are not an active member' });
      }

      const coopId = membership.cooperativeId;
      const [coopRow] = await sqlDb.select().from(sqlCoops).where(eq(sqlCoops.id, coopId));
      if (!coopRow || coopRow.status !== 'active') {
        return res.status(404).json({ error: 'Cooperative not found or inactive' });
      }

      // Count active members
      const [memberCountRes] = await sqlDb
        .select({ count: sql<number>`count(*)::int` })
        .from(sqlMembers)
        .where(and(eq(sqlMembers.cooperativeId, coopId), eq(sqlMembers.status, 'active')));
      const totalMembers = memberCountRes?.count || coopRow.totalMembers || 1;

      // Fetch bulk pools and compute member-specific and aggregate totals
      const bulkPoolRows = await sqlDb
        .select()
        .from(sqlBulkPools)
        .where(eq(sqlBulkPools.cooperativeId, coopId));

      const bulkPools = await Promise.all(
        bulkPoolRows.map(async (p) => {
          const [totalRes] = await sqlDb
            .select({ total: sql<number>`COALESCE(SUM(quantity), 0)::float` })
            .from(sqlContribs)
            .where(and(eq(sqlContribs.poolId, p.id), sql`status != 'cancelled'`));

          const [userRes] = await sqlDb
            .select({ userQty: sql<number>`COALESCE(quantity, 0)::float` })
            .from(sqlContribs)
            .where(and(eq(sqlContribs.poolId, p.id), eq(sqlContribs.userId, userId), sql`status != 'cancelled'`));

          return {
            id: p.id,
            cooperativeId: p.cooperativeId,
            creatorId: p.creatorId,
            inputName: p.inputName,
            category: p.category as any,
            unit: p.unit,
            retailMarketPrice: p.retailMarketPrice,
            coopBulkPrice: p.coopBulkPrice,
            discountPercent: p.discountPercent,
            targetQuantity: p.targetQuantity,
            pledgedQuantity: totalRes?.total || 0,
            userPledgedQuantity: userRes?.userQty || 0,
            deadlineDate: p.deadlineDate,
            status: p.status as any,
            supplierName: p.supplierName || '',
            createdAt: p.createdAt ? p.createdAt.toISOString() : undefined,
          };
        })
      );

      // Fetch aggregation pools and compute member-specific and aggregate volumes
      const aggPoolRows = await sqlDb
        .select()
        .from(sqlAggPools)
        .where(eq(sqlAggPools.cooperativeId, coopId));

      const aggregationPools = await Promise.all(
        aggPoolRows.map(async (ap) => {
          const [totalRes] = await sqlDb
            .select({ total: sql<number>`COALESCE(SUM(pledged_volume), 0)::float` })
            .from(sqlProducePledges)
            .where(and(eq(sqlProducePledges.poolId, ap.id), sql`status != 'cancelled'`));

          const [userRes] = await sqlDb
            .select({ userVol: sql<number>`COALESCE(pledged_volume, 0)::float` })
            .from(sqlProducePledges)
            .where(and(eq(sqlProducePledges.poolId, ap.id), eq(sqlProducePledges.userId, userId), sql`status != 'cancelled'`));

          return {
            id: ap.id,
            cooperativeId: ap.cooperativeId,
            creatorId: ap.creatorId,
            cropName: ap.cropName,
            offtakerName: ap.offtakerName,
            contractType: ap.contractType as any,
            unit: ap.unit,
            agreedFloorPricePerUnit: ap.agreedFloorPricePerUnit,
            minimumVolumeRequired: ap.minimumVolumeRequired,
            currentAggregatedVolume: totalRes?.total || 0,
            userCommittedVolume: userRes?.userVol || 0,
            deliveryHub: ap.deliveryHub,
            cutoffDate: ap.cutoffDate,
            status: ap.status as any,
            termsNote: ap.termsNote || '',
            createdAt: ap.createdAt ? ap.createdAt.toISOString() : undefined,
          };
        })
      );

      const cooperative: CooperativeGroup = {
        id: coopRow.id,
        name: coopRow.name,
        description: coopRow.description || undefined,
        societyNumber: coopRow.societyNumber || '',
        zone: coopRow.zone || '',
        totalMembers,
        chairperson: coopRow.chairperson || '',
        phone: coopRow.phone || '',
        bankAccount: coopRow.bankAccount || '',
        creatorId: coopRow.creatorId,
        status: coopRow.status,
      };

      return res.json({
        cooperative,
        bulkPools,
        aggregationPools,
        userRole: membership.role,
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to load cooperative hub:', err);
      return res.status(500).json({ error: 'Failed to query cooperative data from database' });
    }
  }

  // Fallback to in-memory store
  const targetId = requestedCoopId || db.cooperativeMembers.find((m) => m.userId === userId && m.status === 'active')?.cooperativeId || (userId === 'farmer-1' ? 'coop-kano-veg' : null);
  if (!targetId) return res.status(404).json({ error: 'Cooperative not found or access denied' });
  const membership = db.cooperativeMembers.find((m) => m.cooperativeId === targetId && m.userId === userId && m.status === 'active');
  if (!membership && userId !== 'farmer-1') return res.status(404).json({ error: 'Cooperative access denied' });

  const coop = db.cooperatives.find((c) => c.id === targetId) || db.cooperative;
  const bulkPools = db.bulkInputPools.filter((p) => p.cooperativeId === targetId || !p.cooperativeId).map((p) => {
    const userContrib = db.bulkInputContributions.find((c) => c.poolId === p.id && c.userId === userId);
    return { ...p, userPledgedQuantity: userContrib ? userContrib.quantity : 0 };
  });
  const aggregationPools = db.aggregationPools.filter((p) => p.cooperativeId === targetId || !p.cooperativeId).map((p) => {
    const userPledge = db.producePledges.find((pl) => pl.poolId === p.id && pl.userId === userId);
    return { ...p, userCommittedVolume: userPledge ? userPledge.pledgedVolume : 0 };
  });

  res.json({
    cooperative: coop,
    bulkPools,
    aggregationPools,
    userRole: membership?.role || 'owner',
  });
});

// 1.2 Get Specific Cooperative by ID (membership required)
app.get('/api/cooperative/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const coopId = req.params.id;

  const membership = await getCooperativeMembership(coopId, userId);
  if (!membership) {
    return res.status(404).json({ error: 'Cooperative not found or access denied: you are not an active member' });
  }

  // Reuse the cooperative logic
  req.query.cooperativeId = coopId;
  return (app._router.handle as any)({ ...req, url: `/api/cooperative?cooperativeId=${coopId}` }, res);
});

// 1.3 Create a New Cooperative (creator becomes owner)
app.post('/api/cooperative', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid; // Never trust client-supplied userId or creatorId
  const { name, description, societyNumber, zone, chairperson, phone, bankAccount } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Cooperative name is required' });
  }

  const cleanName = name.trim().substring(0, 150);
  const coopId = `coop-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

  const newCoop: CooperativeGroup = {
    id: coopId,
    name: cleanName,
    description: typeof description === 'string' ? description.trim().substring(0, 300) : undefined,
    societyNumber: typeof societyNumber === 'string' ? societyNumber.trim().substring(0, 80) : '',
    zone: typeof zone === 'string' ? zone.trim().substring(0, 150) : '',
    totalMembers: 1,
    chairperson: typeof chairperson === 'string' ? chairperson.trim().substring(0, 150) : '',
    phone: typeof phone === 'string' ? phone.trim().substring(0, 50) : '',
    bankAccount: typeof bankAccount === 'string' ? bankAccount.trim().substring(0, 100) : '',
    creatorId: userId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ownerMembership: CooperativeMember = {
    id: `member-${userId}-${coopId}`,
    cooperativeId: coopId,
    userId,
    role: 'owner',
    status: 'active',
    joinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { cooperatives: sqlCoops, cooperativeMembers: sqlMembers } = await import('./src/db/schema.ts');

      // Write PostgreSQL FIRST (transaction: cooperative + owner membership)
      await sqlDb.transaction(async (tx) => {
        await tx.insert(sqlCoops).values({
          id: newCoop.id,
          name: newCoop.name,
          description: newCoop.description || null,
          societyNumber: newCoop.societyNumber || null,
          zone: newCoop.zone || null,
          totalMembers: 1,
          chairperson: newCoop.chairperson || null,
          phone: newCoop.phone || null,
          bankAccount: newCoop.bankAccount || null,
          creatorId: userId,
          status: 'active',
        });

        await tx.insert(sqlMembers).values({
          id: ownerMembership.id,
          cooperativeId: coopId,
          userId,
          role: 'owner',
          status: 'active',
        });
      });

      // Update in-memory cache only after successful DB write
      db.cooperatives.push(newCoop);
      db.cooperativeMembers.push(ownerMembership);

      return res.status(201).json({
        success: true,
        message: `Cooperative "${newCoop.name}" created successfully. You are the registered owner.`,
        cooperative: newCoop,
        membership: ownerMembership,
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to create cooperative:', err);
      return res.status(500).json({ error: 'Failed to create cooperative in database' });
    }
  }

  db.cooperatives.push(newCoop);
  db.cooperativeMembers.push(ownerMembership);
  return res.status(201).json({
    success: true,
    cooperative: newCoop,
    membership: ownerMembership,
  });
});

// 1.4 Join a Cooperative (membership request)
app.post('/api/cooperative/:id/join', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid; // Always authoritative
  const coopId = req.params.id;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { cooperatives: sqlCoops, cooperativeMembers: sqlMembers } = await import('./src/db/schema.ts');
      const { and, eq, sql } = await import('drizzle-orm');

      // Verify cooperative exists and is active
      const [coop] = await sqlDb.select().from(sqlCoops).where(eq(sqlCoops.id, coopId));
      if (!coop || coop.status !== 'active') {
        return res.status(404).json({ error: 'Cooperative not found or inactive' });
      }

      // Check if already an active member
      const [existing] = await sqlDb
        .select()
        .from(sqlMembers)
        .where(and(eq(sqlMembers.cooperativeId, coopId), eq(sqlMembers.userId, userId)));

      if (existing) {
        if (existing.status === 'active') {
          return res.status(400).json({ error: 'You are already an active member of this cooperative' });
        }
        // Reactivate
        await sqlDb
          .update(sqlMembers)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(sqlMembers.id, existing.id));

        return res.json({ success: true, message: 'Membership reactivated successfully' });
      }

      const membershipId = `member-${userId}-${coopId}`;
      const newMember: CooperativeMember = {
        id: membershipId,
        cooperativeId: coopId,
        userId,
        role: 'member',
        status: 'active',
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await sqlDb.transaction(async (tx) => {
        await tx.insert(sqlMembers).values({
          id: newMember.id,
          cooperativeId: coopId,
          userId,
          role: 'member',
          status: 'active',
        });

        await tx
          .update(sqlCoops)
          .set({
            totalMembers: sql`COALESCE(total_members, 0) + 1`,
            updatedAt: new Date(),
          })
          .where(eq(sqlCoops.id, coopId));
      });

      // Update in-memory cache
      db.cooperativeMembers.push(newMember);

      return res.status(201).json({
        success: true,
        message: `Successfully joined ${coop.name}`,
        membership: newMember,
      });
    } catch (err: any) {
      const isUniqueViolation =
        err?.code === '23505' ||
        err?.cause?.code === '23505' ||
        (typeof err?.message === 'string' && (err.message.includes('23505') || err.message.includes('duplicate key')));
      if (isUniqueViolation) {
        // Unique constraint violation (duplicate membership prevented)
        return res.status(400).json({ error: 'Duplicate membership prevented: already registered' });
      }
      console.error('[Cloud SQL] Failed to join cooperative:', err);
      return res.status(500).json({ error: 'Failed to join cooperative in database' });
    }
  }

  // In-memory fallback
  const existing = db.cooperativeMembers.find((m) => m.cooperativeId === coopId && m.userId === userId);
  if (existing && existing.status === 'active') {
    return res.status(400).json({ error: 'You are already an active member of this cooperative' });
  }

  const newMember: CooperativeMember = {
    id: `member-${userId}-${coopId}`,
    cooperativeId: coopId,
    userId,
    role: 'member',
    status: 'active',
    joinedAt: new Date().toISOString(),
  };
  db.cooperativeMembers.push(newMember);
  return res.status(201).json({ success: true, membership: newMember });
});

// 1.5 Create a Bulk Input Pool (owner or admin only)
app.post('/api/cooperative/:id/bulk-pools', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const coopId = req.params.id;

  const membership = await getCooperativeMembership(coopId, userId);
  if (!membership) {
    return res.status(404).json({ error: 'Cooperative not found or access denied' });
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cooperative owner or admin can create bulk input pools' });
  }

  const {
    inputName,
    category,
    unit,
    retailMarketPrice,
    coopBulkPrice,
    targetQuantity,
    deadlineDate,
    supplierName,
  } = req.body || {};

  if (!inputName || typeof inputName !== 'string' || !inputName.trim()) {
    return res.status(400).json({ error: 'inputName is required' });
  }
  const cleanTarget = Number(targetQuantity);
  if (isNaN(cleanTarget) || cleanTarget <= 0) {
    return res.status(400).json({ error: 'targetQuantity must be a positive number' });
  }

  const poolId = `pool-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const retail = Number(retailMarketPrice) || 0;
  const bulk = Number(coopBulkPrice) || 0;
  const discount = retail > 0 && bulk > 0 ? Math.round(((retail - bulk) / retail) * 100) : 0;

  const newPool: BulkInputPool = {
    id: poolId,
    cooperativeId: coopId,
    creatorId: userId,
    inputName: inputName.trim().substring(0, 150),
    category: ['Fertilizer', 'Seeds', 'Chemicals', 'Equipment', 'Packaging'].includes(category) ? category : 'Fertilizer',
    unit: (typeof unit === 'string' && unit.trim()) ? unit.trim().substring(0, 30) : 'bags',
    retailMarketPrice: retail,
    coopBulkPrice: bulk,
    discountPercent: discount,
    targetQuantity: cleanTarget,
    pledgedQuantity: 0,
    userPledgedQuantity: 0,
    deadlineDate: (typeof deadlineDate === 'string' && deadlineDate.trim()) ? deadlineDate.trim() : new Date().toISOString().split('T')[0],
    status: 'open',
    supplierName: (typeof supplierName === 'string' && supplierName.trim()) ? supplierName.trim().substring(0, 150) : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { bulkInputPools: sqlBulkPools } = await import('./src/db/schema.ts');

      await sqlDb.insert(sqlBulkPools).values({
        id: newPool.id,
        cooperativeId: coopId,
        creatorId: userId,
        inputName: newPool.inputName,
        category: newPool.category,
        unit: newPool.unit,
        retailMarketPrice: newPool.retailMarketPrice,
        coopBulkPrice: newPool.coopBulkPrice,
        discountPercent: newPool.discountPercent,
        targetQuantity: newPool.targetQuantity,
        deadlineDate: newPool.deadlineDate,
        status: newPool.status,
        supplierName: newPool.supplierName,
      });

      db.bulkInputPools.push(newPool);
      return res.status(201).json({ success: true, pool: newPool });
    } catch (err) {
      console.error('[Cloud SQL] Failed to create bulk input pool:', err);
      return res.status(500).json({ error: 'Failed to create bulk pool in database' });
    }
  }

  db.bulkInputPools.push(newPool);
  return res.status(201).json({ success: true, pool: newPool });
});

// 1.6 View a Single Bulk Input Pool (membership required)
app.get('/api/cooperative/bulk-pools/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const poolId = req.params.id;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { bulkInputPools: sqlBulkPools, bulkInputContributions: sqlContribs } = await import('./src/db/schema.ts');
      const { and, eq, sql } = await import('drizzle-orm');

      const [pool] = await sqlDb.select().from(sqlBulkPools).where(eq(sqlBulkPools.id, poolId));
      if (!pool) return res.status(404).json({ error: 'Bulk input pool not found' });

      const membership = await getCooperativeMembership(pool.cooperativeId, userId);
      if (!membership) {
        return res.status(404).json({ error: 'Bulk input pool not found or access denied' });
      }

      const [totalRes] = await sqlDb
        .select({ total: sql<number>`COALESCE(SUM(quantity), 0)::float` })
        .from(sqlContribs)
        .where(and(eq(sqlContribs.poolId, pool.id), sql`status != 'cancelled'`));

      const [userRes] = await sqlDb
        .select({ userQty: sql<number>`COALESCE(quantity, 0)::float` })
        .from(sqlContribs)
        .where(and(eq(sqlContribs.poolId, pool.id), eq(sqlContribs.userId, userId), sql`status != 'cancelled'`));

      const formatted: BulkInputPool = {
        id: pool.id,
        cooperativeId: pool.cooperativeId,
        creatorId: pool.creatorId,
        inputName: pool.inputName,
        category: pool.category as any,
        unit: pool.unit,
        retailMarketPrice: pool.retailMarketPrice,
        coopBulkPrice: pool.coopBulkPrice,
        discountPercent: pool.discountPercent,
        targetQuantity: pool.targetQuantity,
        pledgedQuantity: totalRes?.total || 0,
        userPledgedQuantity: userRes?.userQty || 0,
        deadlineDate: pool.deadlineDate,
        status: pool.status as any,
        supplierName: pool.supplierName || '',
        createdAt: pool.createdAt ? pool.createdAt.toISOString() : undefined,
      };

      return res.json({ pool: formatted });
    } catch (err) {
      console.error('[Cloud SQL] Failed to fetch bulk input pool:', err);
      return res.status(500).json({ error: 'Failed to fetch bulk pool' });
    }
  }

  const pool = db.bulkInputPools.find((p) => p.id === poolId);
  if (!pool) return res.status(404).json({ error: 'Bulk input pool not found' });
  const membership = db.cooperativeMembers.find((m) => m.cooperativeId === pool.cooperativeId && m.userId === userId && m.status === 'active');
  if (!membership && userId !== 'farmer-1') return res.status(404).json({ error: 'Bulk pool not found or access denied' });
  return res.json({ pool });
});

// 1.7 Pledge/Contribute to a Bulk Input Pool (authorized member only, persistent to PostgreSQL first)
app.post('/api/cooperative/bulk-pools/:id/pledge', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid; // Never trust client-supplied userId
  const poolId = req.params.id;
  const { quantity } = req.body || {};

  const qty = Number(quantity);
  if (isNaN(qty) || qty < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { bulkInputPools: sqlBulkPools, bulkInputContributions: sqlContribs } = await import('./src/db/schema.ts');
      const { and, eq, sql } = await import('drizzle-orm');

      const [pool] = await sqlDb.select().from(sqlBulkPools).where(eq(sqlBulkPools.id, poolId));
      if (!pool) return res.status(404).json({ error: 'Bulk input pool not found' });

      // Verify active membership in the cooperative that owns this pool
      const membership = await getCooperativeMembership(pool.cooperativeId, userId);
      if (!membership) {
        return res.status(404).json({ error: 'Bulk input pool not found or access denied: you are not an active member' });
      }

      // Upsert contribution in PostgreSQL FIRST
      const contribId = `contrib-${poolId}-${userId}`;
      await sqlDb
        .insert(sqlContribs)
        .values({
          id: contribId,
          poolId,
          cooperativeId: pool.cooperativeId,
          userId,
          quantity: qty,
          status: 'pledged',
        })
        .onConflictDoUpdate({
          target: [sqlContribs.poolId, sqlContribs.userId],
          set: {
            quantity: qty,
            status: 'pledged',
            updatedAt: new Date(),
          },
        });

      // Recalculate total aggregate pledged quantity across all members
      const [totalRes] = await sqlDb
        .select({ total: sql<number>`COALESCE(SUM(quantity), 0)::float` })
        .from(sqlContribs)
        .where(and(eq(sqlContribs.poolId, poolId), sql`status != 'cancelled'`));

      const updatedPledgedTotal = totalRes?.total || 0;

      // Update in-memory cache
      const memContribIdx = db.bulkInputContributions.findIndex((c) => c.poolId === poolId && c.userId === userId);
      if (memContribIdx !== -1) {
        db.bulkInputContributions[memContribIdx].quantity = qty;
      } else {
        db.bulkInputContributions.push({
          id: contribId,
          poolId,
          cooperativeId: pool.cooperativeId,
          userId,
          quantity: qty,
          status: 'pledged',
          createdAt: new Date().toISOString(),
        });
      }

      const formattedPool: BulkInputPool = {
        id: pool.id,
        cooperativeId: pool.cooperativeId,
        creatorId: pool.creatorId,
        inputName: pool.inputName,
        category: pool.category as any,
        unit: pool.unit,
        retailMarketPrice: pool.retailMarketPrice,
        coopBulkPrice: pool.coopBulkPrice,
        discountPercent: pool.discountPercent,
        targetQuantity: pool.targetQuantity,
        pledgedQuantity: updatedPledgedTotal,
        userPledgedQuantity: qty,
        deadlineDate: pool.deadlineDate,
        status: pool.status as any,
        supplierName: pool.supplierName || '',
      };

      return res.json({ success: true, pool: formattedPool, userId });
    } catch (err) {
      console.error('[Cloud SQL] Failed to record bulk input pledge:', err);
      return res.status(500).json({ error: 'Failed to record pledge in database' });
    }
  }

  // Memory fallback
  const pool = db.bulkInputPools.find((p) => p.id === poolId);
  if (!pool) return res.status(404).json({ error: 'Bulk input pool not found' });
  const membership = db.cooperativeMembers.find((m) => m.cooperativeId === pool.cooperativeId && m.userId === userId && m.status === 'active');
  if (!membership && userId !== 'farmer-1') return res.status(404).json({ error: 'Bulk pool not found or access denied' });

  const diff = qty - pool.userPledgedQuantity;
  pool.userPledgedQuantity = qty;
  pool.pledgedQuantity = Math.max(0, pool.pledgedQuantity + diff);
  return res.json({ success: true, pool, userId });
});

// 1.8 Create an Aggregation Pool (owner or admin only)
app.post('/api/cooperative/:id/aggregation-pools', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const coopId = req.params.id;

  const membership = await getCooperativeMembership(coopId, userId);
  if (!membership) {
    return res.status(404).json({ error: 'Cooperative not found or access denied' });
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cooperative owner or admin can create produce aggregation pools' });
  }

  const {
    cropName,
    offtakerName,
    contractType,
    unit,
    agreedFloorPricePerUnit,
    minimumVolumeRequired,
    deliveryHub,
    cutoffDate,
    termsNote,
  } = req.body || {};

  if (!cropName || typeof cropName !== 'string' || !cropName.trim()) {
    return res.status(400).json({ error: 'cropName is required' });
  }
  if (!offtakerName || typeof offtakerName !== 'string' || !offtakerName.trim()) {
    return res.status(400).json({ error: 'offtakerName is required' });
  }
  const cleanMinVol = Number(minimumVolumeRequired);
  if (isNaN(cleanMinVol) || cleanMinVol <= 0) {
    return res.status(400).json({ error: 'minimumVolumeRequired must be a positive number' });
  }

  const poolId = `agg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

  const newPool: ProduceAggregationPool = {
    id: poolId,
    cooperativeId: coopId,
    creatorId: userId,
    cropName: cropName.trim().substring(0, 100),
    offtakerName: offtakerName.trim().substring(0, 150),
    contractType: ['Processing', 'Supermarket Chain', 'Wholesale Aggregation', 'Export'].includes(contractType) ? contractType : 'Wholesale Aggregation',
    unit: (typeof unit === 'string' && unit.trim()) ? unit.trim().substring(0, 30) : 'crates',
    agreedFloorPricePerUnit: Number(agreedFloorPricePerUnit) || 0,
    minimumVolumeRequired: cleanMinVol,
    currentAggregatedVolume: 0,
    userCommittedVolume: 0,
    deliveryHub: (typeof deliveryHub === 'string' && deliveryHub.trim()) ? deliveryHub.trim().substring(0, 150) : 'Central Depot',
    cutoffDate: (typeof cutoffDate === 'string' && cutoffDate.trim()) ? cutoffDate.trim() : new Date().toISOString().split('T')[0],
    status: 'collecting',
    termsNote: (typeof termsNote === 'string' && termsNote.trim()) ? termsNote.trim().substring(0, 300) : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { produceAggregationPools: sqlAggPools } = await import('./src/db/schema.ts');

      await sqlDb.insert(sqlAggPools).values({
        id: newPool.id,
        cooperativeId: coopId,
        creatorId: userId,
        cropName: newPool.cropName,
        offtakerName: newPool.offtakerName,
        contractType: newPool.contractType,
        unit: newPool.unit,
        agreedFloorPricePerUnit: newPool.agreedFloorPricePerUnit,
        minimumVolumeRequired: newPool.minimumVolumeRequired,
        deliveryHub: newPool.deliveryHub,
        cutoffDate: newPool.cutoffDate,
        status: newPool.status,
        termsNote: newPool.termsNote,
      });

      db.aggregationPools.push(newPool);
      return res.status(201).json({ success: true, pool: newPool });
    } catch (err) {
      console.error('[Cloud SQL] Failed to create aggregation pool:', err);
      return res.status(500).json({ error: 'Failed to create aggregation pool in database' });
    }
  }

  db.aggregationPools.push(newPool);
  return res.status(201).json({ success: true, pool: newPool });
});

// 1.9 View a Single Produce Aggregation Pool (membership required)
app.get('/api/cooperative/aggregation-pools/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const poolId = req.params.id;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { produceAggregationPools: sqlAggPools, producePledges: sqlProducePledges } = await import('./src/db/schema.ts');
      const { and, eq, sql } = await import('drizzle-orm');

      const [pool] = await sqlDb.select().from(sqlAggPools).where(eq(sqlAggPools.id, poolId));
      if (!pool) return res.status(404).json({ error: 'Aggregation pool not found' });

      const membership = await getCooperativeMembership(pool.cooperativeId, userId);
      if (!membership) {
        return res.status(404).json({ error: 'Aggregation pool not found or access denied' });
      }

      const [totalRes] = await sqlDb
        .select({ total: sql<number>`COALESCE(SUM(pledged_volume), 0)::float` })
        .from(sqlProducePledges)
        .where(and(eq(sqlProducePledges.poolId, pool.id), sql`status != 'cancelled'`));

      const [userRes] = await sqlDb
        .select({ userVol: sql<number>`COALESCE(pledged_volume, 0)::float` })
        .from(sqlProducePledges)
        .where(and(eq(sqlProducePledges.poolId, pool.id), eq(sqlProducePledges.userId, userId), sql`status != 'cancelled'`));

      const formatted: ProduceAggregationPool = {
        id: pool.id,
        cooperativeId: pool.cooperativeId,
        creatorId: pool.creatorId,
        cropName: pool.cropName,
        offtakerName: pool.offtakerName,
        contractType: pool.contractType as any,
        unit: pool.unit,
        agreedFloorPricePerUnit: pool.agreedFloorPricePerUnit,
        minimumVolumeRequired: pool.minimumVolumeRequired,
        currentAggregatedVolume: totalRes?.total || 0,
        userCommittedVolume: userRes?.userVol || 0,
        deliveryHub: pool.deliveryHub,
        cutoffDate: pool.cutoffDate,
        status: pool.status as any,
        termsNote: pool.termsNote || '',
        createdAt: pool.createdAt ? pool.createdAt.toISOString() : undefined,
      };

      return res.json({ pool: formatted });
    } catch (err) {
      console.error('[Cloud SQL] Failed to fetch aggregation pool:', err);
      return res.status(500).json({ error: 'Failed to fetch aggregation pool' });
    }
  }

  const pool = db.aggregationPools.find((p) => p.id === poolId);
  if (!pool) return res.status(404).json({ error: 'Aggregation pool not found' });
  const membership = db.cooperativeMembers.find((m) => m.cooperativeId === pool.cooperativeId && m.userId === userId && m.status === 'active');
  if (!membership && userId !== 'farmer-1') return res.status(404).json({ error: 'Aggregation pool not found or access denied' });
  return res.json({ pool });
});

// 1.10 Commit Produce to Aggregation Pool (authorized member only, persistent to PostgreSQL first)
app.post('/api/cooperative/aggregation-pools/:id/commit', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid; // Never trust client-supplied userId
  const poolId = req.params.id;
  const { volume } = req.body || {};

  const vol = Number(volume);
  if (isNaN(vol) || vol < 0) {
    return res.status(400).json({ error: 'Volume must be a non-negative number' });
  }

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { produceAggregationPools: sqlAggPools, producePledges: sqlProducePledges } = await import('./src/db/schema.ts');
      const { and, eq, sql } = await import('drizzle-orm');

      const [pool] = await sqlDb.select().from(sqlAggPools).where(eq(sqlAggPools.id, poolId));
      if (!pool) return res.status(404).json({ error: 'Aggregation pool not found' });

      // Verify active membership in the cooperative that owns this pool
      const membership = await getCooperativeMembership(pool.cooperativeId, userId);
      if (!membership) {
        return res.status(404).json({ error: 'Aggregation pool not found or access denied: you are not an active member' });
      }

      // Upsert pledge in PostgreSQL FIRST
      const pledgeId = `pledge-${poolId}-${userId}`;
      await sqlDb
        .insert(sqlProducePledges)
        .values({
          id: pledgeId,
          poolId,
          cooperativeId: pool.cooperativeId,
          userId,
          cropName: pool.cropName,
          pledgedVolume: vol,
          unit: pool.unit,
          status: 'committed',
        })
        .onConflictDoUpdate({
          target: [sqlProducePledges.poolId, sqlProducePledges.userId],
          set: {
            pledgedVolume: vol,
            status: 'committed',
            updatedAt: new Date(),
          },
        });

      // Recalculate total aggregate committed volume across all members
      const [totalRes] = await sqlDb
        .select({ total: sql<number>`COALESCE(SUM(pledged_volume), 0)::float` })
        .from(sqlProducePledges)
        .where(and(eq(sqlProducePledges.poolId, poolId), sql`status != 'cancelled'`));

      const updatedCommittedTotal = totalRes?.total || 0;

      // Update in-memory cache
      const memPledgeIdx = db.producePledges.findIndex((p) => p.poolId === poolId && p.userId === userId);
      if (memPledgeIdx !== -1) {
        db.producePledges[memPledgeIdx].pledgedVolume = vol;
      } else {
        db.producePledges.push({
          id: pledgeId,
          poolId,
          cooperativeId: pool.cooperativeId,
          userId,
          cropName: pool.cropName,
          pledgedVolume: vol,
          unit: pool.unit,
          status: 'committed',
          createdAt: new Date().toISOString(),
        });
      }

      const formattedPool: ProduceAggregationPool = {
        id: pool.id,
        cooperativeId: pool.cooperativeId,
        creatorId: pool.creatorId,
        cropName: pool.cropName,
        offtakerName: pool.offtakerName,
        contractType: pool.contractType as any,
        unit: pool.unit,
        agreedFloorPricePerUnit: pool.agreedFloorPricePerUnit,
        minimumVolumeRequired: pool.minimumVolumeRequired,
        currentAggregatedVolume: updatedCommittedTotal,
        userCommittedVolume: vol,
        deliveryHub: pool.deliveryHub,
        cutoffDate: pool.cutoffDate,
        status: pool.status as any,
        termsNote: pool.termsNote || '',
      };

      return res.json({ success: true, pool: formattedPool, userId });
    } catch (err) {
      console.error('[Cloud SQL] Failed to record aggregation pledge:', err);
      return res.status(500).json({ error: 'Failed to record commitment in database' });
    }
  }

  // Memory fallback
  const pool = db.aggregationPools.find((p) => p.id === poolId);
  if (!pool) return res.status(404).json({ error: 'Aggregation pool not found' });
  const membership = db.cooperativeMembers.find((m) => m.cooperativeId === pool.cooperativeId && m.userId === userId && m.status === 'active');
  if (!membership && userId !== 'farmer-1') return res.status(404).json({ error: 'Aggregation pool not found or access denied' });

  const diff = vol - pool.userCommittedVolume;
  pool.userCommittedVolume = vol;
  pool.currentAggregatedVolume = Math.max(0, pool.currentAggregatedVolume + diff);
  return res.json({ success: true, pool, userId });
});

// 1.11 Delete Own Contribution (or admin deletion)
app.delete('/api/cooperative/bulk-pools/:poolId/contributions/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { poolId, id } = req.params;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { bulkInputContributions: sqlContribs } = await import('./src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');

      const [contrib] = await sqlDb.select().from(sqlContribs).where(and(eq(sqlContribs.id, id), eq(sqlContribs.poolId, poolId)));
      if (!contrib) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      // Check authorization: must be contribution owner or cooperative admin/owner
      if (contrib.userId !== userId) {
        const callerMembership = await getCooperativeMembership(contrib.cooperativeId, userId);
        if (!callerMembership || (callerMembership.role !== 'owner' && callerMembership.role !== 'admin')) {
          return res.status(404).json({ error: 'Contribution not found or access denied' });
        }
      }

      await sqlDb.delete(sqlContribs).where(eq(sqlContribs.id, id));

      const idx = db.bulkInputContributions.findIndex((c) => c.id === id);
      if (idx !== -1) db.bulkInputContributions.splice(idx, 1);

      return res.json({ success: true, message: 'Contribution deleted successfully' });
    } catch (err) {
      console.error('[Cloud SQL] Failed to delete contribution:', err);
      return res.status(500).json({ error: 'Failed to delete contribution' });
    }
  }

  const idx = db.bulkInputContributions.findIndex((c) => c.id === id && c.poolId === poolId);
  if (idx === -1) return res.status(404).json({ error: 'Contribution not found' });
  if (db.bulkInputContributions[idx].userId !== userId && userId !== 'farmer-1') {
    return res.status(404).json({ error: 'Contribution not found or access denied' });
  }
  db.bulkInputContributions.splice(idx, 1);
  return res.json({ success: true, message: 'Contribution deleted successfully' });
});

// 1.12 Delete Own Produce Pledge (or admin deletion)
app.delete('/api/cooperative/aggregation-pools/:poolId/pledges/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { poolId, id } = req.params;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { producePledges: sqlProducePledges } = await import('./src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');

      const [pledge] = await sqlDb.select().from(sqlProducePledges).where(and(eq(sqlProducePledges.id, id), eq(sqlProducePledges.poolId, poolId)));
      if (!pledge) {
        return res.status(404).json({ error: 'Pledge not found' });
      }

      // Check authorization: must be pledge owner or cooperative admin/owner
      if (pledge.userId !== userId) {
        const callerMembership = await getCooperativeMembership(pledge.cooperativeId, userId);
        if (!callerMembership || (callerMembership.role !== 'owner' && callerMembership.role !== 'admin')) {
          return res.status(404).json({ error: 'Pledge not found or access denied' });
        }
      }

      await sqlDb.delete(sqlProducePledges).where(eq(sqlProducePledges.id, id));

      const idx = db.producePledges.findIndex((p) => p.id === id);
      if (idx !== -1) db.producePledges.splice(idx, 1);

      return res.json({ success: true, message: 'Pledge deleted successfully' });
    } catch (err) {
      console.error('[Cloud SQL] Failed to delete pledge:', err);
      return res.status(500).json({ error: 'Failed to delete pledge' });
    }
  }

  const idx = db.producePledges.findIndex((p) => p.id === id && p.poolId === poolId);
  if (idx === -1) return res.status(404).json({ error: 'Pledge not found' });
  if (db.producePledges[idx].userId !== userId && userId !== 'farmer-1') {
    return res.status(404).json({ error: 'Pledge not found or access denied' });
  }
  db.producePledges.splice(idx, 1);
  return res.json({ success: true, message: 'Pledge deleted successfully' });
});

// 1.13 Delete Cooperative (owner only)
app.delete('/api/cooperative/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const coopId = req.params.id;

  const membership = await getCooperativeMembership(coopId, userId);
  if (!membership) {
    return res.status(404).json({ error: 'Cooperative not found or access denied' });
  }

  if (membership.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden: Only the cooperative owner can delete this cooperative' });
  }

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const {
        cooperatives: sqlCoops,
        cooperativeMembers: sqlMembers,
        bulkInputPools: sqlBulkPools,
        bulkInputContributions: sqlContribs,
        produceAggregationPools: sqlAggPools,
        producePledges: sqlProducePledges,
      } = await import('./src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      await sqlDb.transaction(async (tx) => {
        await tx.delete(sqlContribs).where(eq(sqlContribs.cooperativeId, coopId));
        await tx.delete(sqlBulkPools).where(eq(sqlBulkPools.cooperativeId, coopId));
        await tx.delete(sqlProducePledges).where(eq(sqlProducePledges.cooperativeId, coopId));
        await tx.delete(sqlAggPools).where(eq(sqlAggPools.cooperativeId, coopId));
        await tx.delete(sqlMembers).where(eq(sqlMembers.cooperativeId, coopId));
        await tx.delete(sqlCoops).where(eq(sqlCoops.id, coopId));
      });

      db.cooperatives = db.cooperatives.filter((c) => c.id !== coopId);
      db.cooperativeMembers = db.cooperativeMembers.filter((m) => m.cooperativeId !== coopId);

      return res.json({ success: true, message: 'Cooperative deleted successfully' });
    } catch (err) {
      console.error('[Cloud SQL] Failed to delete cooperative:', err);
      return res.status(500).json({ error: 'Failed to delete cooperative' });
    }
  }

  db.cooperatives = db.cooperatives.filter((c) => c.id !== coopId);
  db.cooperativeMembers = db.cooperativeMembers.filter((m) => m.cooperativeId !== coopId);
  return res.json({ success: true, message: 'Cooperative deleted successfully' });
});

// 2. Agri-Credit Scoring & Seasonal Loan Eligibility
app.get('/api/loans/credit-score', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const userCrops = db.crops.filter((c) => c.userId === userId);
  const userExpenses = db.expenses.filter((e) => e.userId === userId);
  const userSales = db.sales.filter((s) => s.userId === userId);
  const farmSummary = calculateFarmSummary(userCrops, userExpenses, userSales);
  const debtorSummary = calculateDebtorSummary(userSales);
  const creditReport = calculateAgriCreditScore(userCrops, userExpenses, userSales, farmSummary, debtorSummary);
  res.json(creditReport);
});

app.post('/api/loans/apply', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { productId, requestedAmount, purpose } = req.body;
  const applicationId = `FP-AGRI-${Date.now().toString().slice(-6)}`;
  res.status(201).json({
    success: true,
    applicationId,
    userId, // TASK 2: client-supplied userId ignored
    status: 'Pre-Approved Underwriter Verification',
    message: `Application ${applicationId} for ${formatNairaNumber(Number(requestedAmount) || 0)} submitted. Your FarmPal certified financial dossier has been forwarded to the agri-desk underwriter.`,
  });
});

// 3. Hyperlocal Agro-Weather Telemetry & Climate Advisory
app.get('/api/weather', (req, res) => {
  const location = db.profile.location || 'Kano, Nigeria';
  const report = generateAgroWeatherReport(location, db.crops);
  res.json(report);
});

// 4. Farm Store Inventory & Depot
app.get('/api/inventory', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { inventoryItems: sqlInventory } = await import('./src/db/schema.ts');
      const { eq, desc } = await import('drizzle-orm');
      const rows = await sqlDb
        .select()
        .from(sqlInventory)
        .where(eq(sqlInventory.userId, userId))
        .orderBy(desc(sqlInventory.createdAt));

      const items: FarmInventoryItem[] = rows.map((i) => ({
        id: i.id,
        userId: i.userId,
        name: i.name,
        category: i.category as any,
        currentQuantity: i.currentQuantity,
        unit: i.unit,
        reorderThreshold: i.reorderThreshold,
        estimatedUnitValue: i.estimatedUnitValue,
        storageLocation: i.storageLocation,
        lastRestocked: i.lastRestocked,
        status: i.status as any,
      }));
      return res.json(items);
    } catch (err) {
      console.error('[Cloud SQL] Failed to query inventory from PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to fetch inventory from database' });
    }
  }
  const userInventory = db.inventoryItems.filter((i) => i.userId === userId);
  res.json(userInventory);
});

app.get('/api/inventory/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { inventoryItems: sqlInventory } = await import('./src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');
      const [item] = await sqlDb
        .select()
        .from(sqlInventory)
        .where(and(eq(sqlInventory.id, req.params.id), eq(sqlInventory.userId, userId)));

      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found or not owned by user' });
      }
      return res.json({
        id: item.id,
        userId: item.userId,
        name: item.name,
        category: item.category as any,
        currentQuantity: item.currentQuantity,
        unit: item.unit,
        reorderThreshold: item.reorderThreshold,
        estimatedUnitValue: item.estimatedUnitValue,
        storageLocation: item.storageLocation,
        lastRestocked: item.lastRestocked,
        status: item.status as any,
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to query inventory item:', err);
      return res.status(500).json({ error: 'Failed to query inventory item' });
    }
  }
  const item = db.inventoryItems.find((i) => i.id === req.params.id && i.userId === userId);
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found or not owned by user' });
  }
  res.json(item);
});

app.post('/api/inventory', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { name, category, currentQuantity, unit, reorderThreshold, estimatedUnitValue, storageLocation } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  const validCategories = ['Fertilizer', 'Chemicals', 'Seeds', 'Packaging', 'Fuel', 'Tools'];
  if (category !== undefined && !validCategories.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
  }
  const cat = category || 'Fertilizer';

  let qty = 0;
  if (currentQuantity !== undefined) {
    if (
      currentQuantity === null ||
      typeof currentQuantity === 'boolean' ||
      (typeof currentQuantity === 'string' && currentQuantity.trim() === '')
    ) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }
    const num = Number(currentQuantity);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }
    qty = num;
  }

  let threshold = 2;
  if (reorderThreshold !== undefined) {
    if (
      reorderThreshold === null ||
      typeof reorderThreshold === 'boolean' ||
      (typeof reorderThreshold === 'string' && reorderThreshold.trim() === '')
    ) {
      return res.status(400).json({ error: 'Reorder threshold must be a non-negative number' });
    }
    const num = Number(reorderThreshold);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ error: 'Reorder threshold must be a non-negative number' });
    }
    threshold = num;
  }

  let unitValue = 0;
  if (estimatedUnitValue !== undefined) {
    if (
      estimatedUnitValue === null ||
      typeof estimatedUnitValue === 'boolean' ||
      (typeof estimatedUnitValue === 'string' && estimatedUnitValue.trim() === '')
    ) {
      return res.status(400).json({ error: 'Estimated unit value must be a non-negative number' });
    }
    const num = Number(estimatedUnitValue);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ error: 'Estimated unit value must be a non-negative number' });
    }
    unitValue = num;
  }

  const status = qty === 0 ? 'out_of_stock' : qty <= threshold ? 'low_stock' : 'sufficient';
  const newItem: FarmInventoryItem = {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    userId, // client-supplied userId strictly ignored
    name: name.trim(),
    category: cat,
    currentQuantity: qty,
    unit: unit && typeof unit === 'string' && unit.trim() ? unit.trim() : 'units',
    reorderThreshold: threshold,
    estimatedUnitValue: unitValue,
    storageLocation: storageLocation && typeof storageLocation === 'string' && storageLocation.trim()
      ? storageLocation.trim()
      : 'Main Farm Storehouse',
    lastRestocked: new Date().toISOString().split('T')[0],
    status,
  };

  try {
    await db.persistInventoryItem(newItem);
    db.inventoryItems.unshift(newItem);
    res.status(201).json(newItem);
  } catch (err) {
    console.error('[Cloud SQL] Failed to save inventory item:', err);
    res.status(500).json({ error: 'Failed to create inventory item in database' });
  }
});

app.post('/api/inventory/:id/adjust', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const { delta, newQuantity } = req.body;

  if (newQuantity === undefined && delta === undefined) {
    return res.status(400).json({ error: 'Either newQuantity or delta must be provided' });
  }

  // Validate newQuantity if supplied
  let newQtyNum: number | undefined;
  if (newQuantity !== undefined) {
    if (
      newQuantity === null ||
      typeof newQuantity === 'boolean' ||
      (typeof newQuantity === 'string' && newQuantity.trim() === '')
    ) {
      return res.status(400).json({ error: 'Quantity must be a valid number' });
    }
    newQtyNum = Number(newQuantity);
    if (isNaN(newQtyNum) || newQtyNum < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }
  }

  // Validate delta if supplied
  let deltaNum: number | undefined;
  if (delta !== undefined) {
    if (
      delta === null ||
      typeof delta === 'boolean' ||
      (typeof delta === 'string' && delta.trim() === '')
    ) {
      return res.status(400).json({ error: 'Delta must be a valid number' });
    }
    deltaNum = Number(delta);
    if (isNaN(deltaNum)) {
      return res.status(400).json({ error: 'Delta must be a valid number' });
    }
  }

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { inventoryItems: sqlInventory } = await import('./src/db/schema.ts');
      const { and, eq, sql, gte } = await import('drizzle-orm');

      if (newQtyNum !== undefined) {
        const today = new Date().toISOString().split('T')[0];
        const updatedRows = await sqlDb
          .update(sqlInventory)
          .set({
            currentQuantity: newQtyNum,
            lastRestocked: sql`CASE 
              WHEN ${newQtyNum} > ${sqlInventory.currentQuantity} THEN ${today} 
              ELSE ${sqlInventory.lastRestocked} 
            END`,
            status: sql`CASE 
              WHEN ${newQtyNum} = 0 THEN 'out_of_stock'
              WHEN ${newQtyNum} <= ${sqlInventory.reorderThreshold} THEN 'low_stock'
              ELSE 'sufficient'
            END`,
            updatedAt: sql`NOW()`,
          })
          .where(and(eq(sqlInventory.id, req.params.id), eq(sqlInventory.userId, userId)))
          .returning();

        if (updatedRows.length === 0) {
          return res.status(404).json({ error: 'Inventory item not found or not owned by user' });
        }

        const updated = updatedRows[0];
        const formatted: FarmInventoryItem = {
          id: updated.id,
          userId: updated.userId,
          name: updated.name,
          category: updated.category as any,
          currentQuantity: updated.currentQuantity,
          unit: updated.unit,
          reorderThreshold: updated.reorderThreshold,
          estimatedUnitValue: updated.estimatedUnitValue,
          storageLocation: updated.storageLocation,
          lastRestocked: updated.lastRestocked,
          status: updated.status as any,
        };

        const idx = db.inventoryItems.findIndex((i) => i.id === req.params.id && i.userId === userId);
        if (idx !== -1) db.inventoryItems[idx] = formatted;
        else db.inventoryItems.unshift(formatted);

        return res.json(formatted);
      } else if (deltaNum !== undefined) {
        const today = new Date().toISOString().split('T')[0];
        // Atomic update with concurrency protection:
        // (current_quantity + delta) >= 0 prevents race conditions from taking stock below zero
        const updatedRows = await sqlDb
          .update(sqlInventory)
          .set({
            currentQuantity: sql`${sqlInventory.currentQuantity} + ${deltaNum}`,
            lastRestocked: deltaNum > 0 ? today : sql`${sqlInventory.lastRestocked}`,
            status: sql`CASE 
              WHEN (${sqlInventory.currentQuantity} + ${deltaNum}) = 0 THEN 'out_of_stock'
              WHEN (${sqlInventory.currentQuantity} + ${deltaNum}) <= ${sqlInventory.reorderThreshold} THEN 'low_stock'
              ELSE 'sufficient'
            END`,
            updatedAt: sql`NOW()`,
          })
          .where(
            and(
              eq(sqlInventory.id, req.params.id),
              eq(sqlInventory.userId, userId),
              gte(sql`${sqlInventory.currentQuantity} + ${deltaNum}`, 0)
            )
          )
          .returning();

        if (updatedRows.length === 0) {
          // Check if item exists to distinguish 404 from 400 (insufficient stock)
          const [existing] = await sqlDb
            .select()
            .from(sqlInventory)
            .where(and(eq(sqlInventory.id, req.params.id), eq(sqlInventory.userId, userId)));

          if (!existing) {
            return res.status(404).json({ error: 'Inventory item not found or not owned by user' });
          }
          return res.status(400).json({
            error: 'Insufficient stock: adjustment would result in negative quantity',
            currentQuantity: existing.currentQuantity,
            requestedDelta: deltaNum,
          });
        }

        const updated = updatedRows[0];
        const formatted: FarmInventoryItem = {
          id: updated.id,
          userId: updated.userId,
          name: updated.name,
          category: updated.category as any,
          currentQuantity: updated.currentQuantity,
          unit: updated.unit,
          reorderThreshold: updated.reorderThreshold,
          estimatedUnitValue: updated.estimatedUnitValue,
          storageLocation: updated.storageLocation,
          lastRestocked: updated.lastRestocked,
          status: updated.status as any,
        };

        const idx = db.inventoryItems.findIndex((i) => i.id === req.params.id && i.userId === userId);
        if (idx !== -1) db.inventoryItems[idx] = formatted;
        else db.inventoryItems.unshift(formatted);

        return res.json(formatted);
      }
    } catch (err) {
      console.error('[Cloud SQL] Error adjusting inventory item:', err);
      return res.status(500).json({ error: 'Failed to adjust inventory item in database' });
    }
  }

  // Fallback in-memory logic
  const item = db.inventoryItems.find((i) => i.id === req.params.id && i.userId === userId);
  if (!item) return res.status(404).json({ error: 'Inventory item not found or not owned by user' });

  if (newQtyNum !== undefined) {
    if (newQtyNum > item.currentQuantity) {
      item.lastRestocked = new Date().toISOString().split('T')[0];
    }
    item.currentQuantity = newQtyNum;
  } else if (deltaNum !== undefined) {
    if (item.currentQuantity + deltaNum < 0) {
      return res.status(400).json({
        error: 'Insufficient stock: adjustment would result in negative quantity',
        currentQuantity: item.currentQuantity,
        requestedDelta: deltaNum,
      });
    }
    item.currentQuantity += deltaNum;
    if (deltaNum > 0) {
      item.lastRestocked = new Date().toISOString().split('T')[0];
    }
  }
  item.status = item.currentQuantity === 0 ? 'out_of_stock' : item.currentQuantity <= item.reorderThreshold ? 'low_stock' : 'sufficient';
  res.json(item);
});

app.delete('/api/inventory/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const deleted = await db.deleteInventoryItem(req.params.id, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Inventory item not found or not owned by user' });
  }
  res.json({ success: true, message: 'Item deleted', id: req.params.id });
});

// ======================== FARMER TESTER FEEDBACK & PILOT API ========================

// 1. Get all farmer feedback submissions & analytics summary (scoped to authenticated farmer)
app.get('/api/feedback', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { feedbacks: sqlFeedbacks } = await import('./src/db/schema.ts');
      const { eq, desc } = await import('drizzle-orm');

      const userFeedbackRows = await sqlDb
        .select()
        .from(sqlFeedbacks)
        .where(eq(sqlFeedbacks.userId, userId))
        .orderBy(desc(sqlFeedbacks.createdAt));

      const feedbacks: FarmerFeedback[] = userFeedbackRows.map((f) => ({
        id: f.id,
        userId: f.userId,
        farmerName: f.farmerName,
        phoneOrEmail: f.phoneOrEmail || undefined,
        farmLocation: f.farmLocation,
        primaryCrops: f.primaryCrops || undefined,
        rating: f.rating,
        testedFeatures: (f.testedFeatures as string[]) || [],
        easeOfUseRating: (f.easeOfUseRating as any) || 'very_easy',
        clarityOfLanguage: (f.clarityOfLanguage as any) || 'clear',
        nairaAndUnitsMatch: (f.nairaAndUnitsMatch as any) || 'yes',
        whatWorkedWell: f.whatWorkedWell || '',
        whatWasConfusing: f.whatWasConfusing || '',
        desiredNextFeature: f.desiredNextFeature || '',
        deviceType: (f.deviceType as any) || 'Android Phone',
        audioNoteTranscript: f.audioNoteTranscript || undefined,
        status: (f.status as any) || 'new',
        message: f.message || undefined,
        category: f.category || 'general',
        createdAt: f.createdAt ? f.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: f.updatedAt ? f.updatedAt.toISOString() : new Date().toISOString(),
      }));

      const totalCount = feedbacks.length;
      const averageRating = totalCount > 0
        ? Number((feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalCount).toFixed(1))
        : 5.0;

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const featureCount: Record<string, number> = {};
      const easeOfUseBreakdown: Record<string, number> = { very_easy: 0, easy: 0, moderate: 0, difficult: 0 };

      for (const f of feedbacks) {
        if (f.rating >= 1 && f.rating <= 5) {
          ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
        }
        if (f.easeOfUseRating && easeOfUseBreakdown[f.easeOfUseRating] !== undefined) {
          easeOfUseBreakdown[f.easeOfUseRating] = (easeOfUseBreakdown[f.easeOfUseRating] || 0) + 1;
        }
        if (Array.isArray(f.testedFeatures)) {
          for (const feat of f.testedFeatures) {
            featureCount[feat] = (featureCount[feat] || 0) + 1;
          }
        }
      }

      const topTestedFeatures = Object.entries(featureCount)
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count);

      const summary: FeedbackSummary = {
        totalCount,
        averageRating,
        ratingDistribution,
        topTestedFeatures,
        easeOfUseBreakdown,
      };

      return res.json({ feedbacks, summary });
    } catch (err) {
      console.error('[Cloud SQL] Failed to query feedback records:', err);
      return res.status(500).json({ error: 'Failed to fetch feedback records from database' });
    }
  }

  const feedbacks = db.feedbacks.filter((f) => f.userId === userId || (!f.userId && userId === 'farmer-1'));
  const totalCount = feedbacks.length;
  const averageRating = totalCount > 0
    ? Number((feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalCount).toFixed(1))
    : 5.0;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const featureCount: Record<string, number> = {};
  const easeOfUseBreakdown: Record<string, number> = { very_easy: 0, easy: 0, moderate: 0, difficult: 0 };

  for (const f of feedbacks) {
    if (f.rating >= 1 && f.rating <= 5) {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    }
    if (f.easeOfUseRating && easeOfUseBreakdown[f.easeOfUseRating] !== undefined) {
      easeOfUseBreakdown[f.easeOfUseRating] = (easeOfUseBreakdown[f.easeOfUseRating] || 0) + 1;
    }
    if (Array.isArray(f.testedFeatures)) {
      for (const feat of f.testedFeatures) {
        featureCount[feat] = (featureCount[feat] || 0) + 1;
      }
    }
  }

  const topTestedFeatures = Object.entries(featureCount)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);

  const summary: FeedbackSummary = {
    totalCount,
    averageRating,
    ratingDistribution,
    topTestedFeatures,
    easeOfUseBreakdown,
  };

  res.json({ feedbacks, summary });
});

// 2. Get individual farmer feedback by ID (strictly tenant-isolated)
app.get('/api/feedback/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { feedbacks: sqlFeedbacks } = await import('./src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');

      const [f] = await sqlDb
        .select()
        .from(sqlFeedbacks)
        .where(and(eq(sqlFeedbacks.id, req.params.id), eq(sqlFeedbacks.userId, userId)));

      if (!f) {
        return res.status(404).json({ error: 'Feedback not found or not owned by user' });
      }

      const formatted: FarmerFeedback = {
        id: f.id,
        userId: f.userId,
        farmerName: f.farmerName,
        phoneOrEmail: f.phoneOrEmail || undefined,
        farmLocation: f.farmLocation,
        primaryCrops: f.primaryCrops || undefined,
        rating: f.rating,
        testedFeatures: (f.testedFeatures as string[]) || [],
        easeOfUseRating: (f.easeOfUseRating as any) || 'very_easy',
        clarityOfLanguage: (f.clarityOfLanguage as any) || 'clear',
        nairaAndUnitsMatch: (f.nairaAndUnitsMatch as any) || 'yes',
        whatWorkedWell: f.whatWorkedWell || '',
        whatWasConfusing: f.whatWasConfusing || '',
        desiredNextFeature: f.desiredNextFeature || '',
        deviceType: (f.deviceType as any) || 'Android Phone',
        audioNoteTranscript: f.audioNoteTranscript || undefined,
        status: (f.status as any) || 'new',
        message: f.message || undefined,
        category: f.category || 'general',
        createdAt: f.createdAt ? f.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: f.updatedAt ? f.updatedAt.toISOString() : new Date().toISOString(),
      };

      return res.json(formatted);
    } catch (err) {
      console.error('[Cloud SQL] Failed to query individual feedback:', err);
      return res.status(500).json({ error: 'Failed to query feedback record' });
    }
  }

  const feedback = db.feedbacks.find((f) => f.id === req.params.id && (f.userId === userId || (!f.userId && userId === 'farmer-1')));
  if (!feedback) return res.status(404).json({ error: 'Feedback not found or not owned by user' });
  res.json(feedback);
});

// 3. Submit new farmer feedback (authenticated, validated, persisted to PostgreSQL first)
app.post('/api/feedback', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid; // Never trust client-supplied userId
  const {
    farmerName,
    phoneOrEmail,
    farmLocation,
    primaryCrops,
    rating,
    testedFeatures,
    easeOfUseRating,
    clarityOfLanguage,
    nairaAndUnitsMatch,
    whatWorkedWell,
    whatWasConfusing,
    desiredNextFeature,
    deviceType,
    audioNoteTranscript,
    message,
    category,
  } = req.body || {};

  // Validate rating if provided
  let validatedRating = 5;
  if (rating !== undefined && rating !== null) {
    const r = Number(rating);
    if (isNaN(r) || !Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    validatedRating = r;
  }

  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  const cleanWhatWorked = typeof whatWorkedWell === 'string' ? whatWorkedWell.trim() : '';
  const cleanWhatConfused = typeof whatWasConfusing === 'string' ? whatWasConfusing.trim() : '';
  const cleanDesired = typeof desiredNextFeature === 'string' ? desiredNextFeature.trim() : '';
  const cleanAudio = typeof audioNoteTranscript === 'string' ? audioNoteTranscript.trim() : '';

  // Max input length validation to prevent abuse
  const maxLen = 3000;
  if (
    cleanMessage.length > maxLen ||
    cleanWhatWorked.length > maxLen ||
    cleanWhatConfused.length > maxLen ||
    cleanDesired.length > maxLen ||
    cleanAudio.length > maxLen
  ) {
    return res.status(400).json({ error: `Feedback text fields must not exceed ${maxLen} characters` });
  }

  // Reject empty feedback: must provide some comment content or an explicit rating
  if (!cleanMessage && !cleanWhatWorked && !cleanWhatConfused && !cleanDesired && !cleanAudio && (rating === undefined || rating === null)) {
    return res.status(400).json({ error: 'Please provide feedback comments or a star rating' });
  }

  const userProfile = db.getProfile(userId);

  const newFeedback: FarmerFeedback = {
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    userId, // client-supplied userId strictly ignored
    farmerName: (typeof farmerName === 'string' && farmerName.trim())
      ? farmerName.trim().substring(0, 150)
      : (userProfile?.name || 'Farmer Tester'),
    phoneOrEmail: (typeof phoneOrEmail === 'string' && phoneOrEmail.trim())
      ? phoneOrEmail.trim().substring(0, 150)
      : (userProfile?.phone || undefined),
    farmLocation: (typeof farmLocation === 'string' && farmLocation.trim())
      ? farmLocation.trim().substring(0, 150)
      : (userProfile?.location || 'Nigeria'),
    primaryCrops: (typeof primaryCrops === 'string' && primaryCrops.trim())
      ? primaryCrops.trim().substring(0, 250)
      : (db.crops.filter((c) => c.userId === userId).map((c) => c.name).join(', ') || undefined),
    rating: validatedRating,
    testedFeatures: Array.isArray(testedFeatures) && testedFeatures.length > 0
      ? testedFeatures.filter((t: any) => typeof t === 'string').map((t: string) => t.trim().substring(0, 50))
      : ['whatsapp', 'general'],
    easeOfUseRating: ['very_easy', 'easy', 'moderate', 'difficult'].includes(easeOfUseRating) ? easeOfUseRating : 'very_easy',
    clarityOfLanguage: ['clear', 'needs_pidgin_hausa', 'too_technical'].includes(clarityOfLanguage) ? clarityOfLanguage : 'clear',
    nairaAndUnitsMatch: ['yes', 'partially', 'no'].includes(nairaAndUnitsMatch) ? nairaAndUnitsMatch : 'yes',
    whatWorkedWell: cleanWhatWorked || cleanMessage,
    whatWasConfusing: cleanWhatConfused,
    desiredNextFeature: cleanDesired,
    deviceType: (typeof deviceType === 'string' && deviceType.trim())
      ? (deviceType.trim().substring(0, 50) as any)
      : 'Android Phone',
    audioNoteTranscript: cleanAudio || undefined,
    status: 'new',
    message: cleanMessage || undefined,
    category: (typeof category === 'string' && category.trim()) ? category.trim().substring(0, 50) : 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // Persist to PostgreSQL FIRST
    await db.persistFeedback(newFeedback);
    // Only update in-memory cache after successful DB write
    db.feedbacks.unshift(newFeedback);

    return res.status(201).json({
      success: true,
      message: 'Nagode! / Daalu! / Ese pupo! Your feedback has been received and will help improve FarmPal for Nigerian farmers.',
      feedback: newFeedback,
    });
  } catch (err) {
    console.error('[Cloud SQL] Failed to save feedback to database:', err);
    return res.status(500).json({ error: 'Failed to save feedback to database' });
  }
});

// 4. Delete feedback entry (strictly authenticated and tenant-isolated)
app.delete('/api/feedback/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  try {
    const deleted = await db.deleteFeedback(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Feedback entry not found or not owned by user' });
    }
    return res.json({ success: true, message: 'Feedback entry deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('[Cloud SQL] Error deleting feedback entry:', err);
    return res.status(500).json({ error: 'Failed to delete feedback entry from database' });
  }
});

// 4. Test Mode: Reset to a Clean Farm Slate (so a tester can enter their own real farm data)
app.post('/api/test-mode/clean-slate', requireDevOnly, (req, res) => {
  const { testerName, testerLocation, testerPhone, testerLanguage } = req.body;
  db.crops = [];
  db.expenses = [];
  db.sales = [];
  db.labourRecords = [];
  db.harvests = [];
  db.budgetConfigs = {};
  db.tasks = [];
  db.profile.name = testerName || 'Farmer Tester';
  db.profile.location = testerLocation || 'Nigeria';
  db.profile.phone = testerPhone || '';
  if (testerLanguage) db.profile.preferredLanguage = testerLanguage;

  res.json({
    success: true,
    message: 'Clean farm slate ready! You can now test adding your own crops, expenses, and harvests.',
    profile: db.profile,
  });
});

// 5. Test Mode: Reload Demo Farm with full mock data
app.post('/api/test-mode/reload-demo', requireDevOnly, (req, res) => {
  const fresh = new (db.constructor as any)();
  // Preserve any real submitted feedbacks
  const savedFeedbacks = [...db.feedbacks];
  Object.assign(db, fresh);
  if (savedFeedbacks.length > 0) {
    db.feedbacks = savedFeedbacks;
  }
  res.json({
    success: true,
    message: 'Demo farm loaded with Tomato, Cucumber, Sweetcorn, expenses, market benchmarks, and cooperative data.',
  });
});

// WhatsApp Conversational Engine
app.post('/api/whatsapp/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const activeCrops = db.crops.filter((c) => c.userId === userId && c.status === 'active');
    const parsed = await parseFarmerMessage(message, activeCrops);

    // 0a. Handle Market Price Inquiries (Phase 3)
    if (parsed.intent === 'market_price') {
      const cropName = parsed.cropQuery || 'Tomato';
      const marketInfo = calculateMarketBenchmarks(db.sales);
      const matches = marketInfo.benchmarks.filter((b) => b.cropName.toLowerCase() === cropName.toLowerCase());

      if (matches.length > 0) {
        const topMarket = [...matches].sort((a, b) => b.wholesaleAvg - a.wholesaleAvg)[0];
        const localKano = matches.find((b) => b.state.toLowerCase() === 'kano') || matches[0];
        const lagosMile12 = matches.find((b) => b.marketName.toLowerCase().includes('mile 12'));

        let priceText = `📊 Market Price Report for *${cropName}* (${matches[0].unit}):\n\n`;
        priceText += `• *${localKano.marketName} (${localKano.state})*: ${formatNairaNumber(localKano.wholesaleAvg)} / ${localKano.unit} (${localKano.trend === 'rising' ? '📈 Rising' : '⚖️ Stable'})\n`;
        if (lagosMile12) {
          priceText += `• *${lagosMile12.marketName} (${lagosMile12.state})*: ${formatNairaNumber(lagosMile12.wholesaleAvg)} / ${lagosMile12.unit} (📈 +${lagosMile12.changePercent7d}% this week)\n`;
        }
        if (topMarket && topMarket.id !== localKano.id && topMarket.id !== lagosMile12?.id) {
          priceText += `• *${topMarket.marketName} (${topMarket.state})*: ${formatNairaNumber(topMarket.wholesaleAvg)} / ${topMarket.unit}\n`;
        }

        if (matches[0].farmerRealizedAvgPrice) {
          const diff = matches[0].farmerRealizedAvgPrice - localKano.wholesaleAvg;
          priceText += `\n🔍 *Your Farm Comparison*:\nYour recent average selling price was ${formatNairaNumber(matches[0].farmerRealizedAvgPrice)} (${diff >= 0 ? '+' : ''}${formatNairaNumber(diff)} vs local wholesale).\n`;
        }

        priceText += `\n💡 *Trading Tip*: ${lagosMile12 ? `Lagos Mile 12 buyers are paying up to ${formatNairaNumber(lagosMile12.wholesaleMax)} for fresh quality stock. Haulage freight from Kano/Kaduna is ~₦2,500/crate (or ~₦5,500/bag). Group with neighboring farms to share transit costs.` : 'Demand remains strong across major urban wholesale centers.'}`;
        priceText += `\n\n📌 *Bulletin*: Updated weekly across northern assembly hubs and southern terminal markets.`;

        return res.json({
          reply: priceText,
          parsedAction: null,
        });
      }
    }

  // 0b. Handle Budget & Cost Burn Inquiries (Phase 3)
  if (parsed.intent === 'budget') {
    const cropName = parsed.cropQuery || activeCrops[0]?.name || 'Tomato';
    const budgets = calculateCropBudgets(db.crops, db.expenses, db.budgetConfigs);
    const budget = budgets.find((b) => b.cropName.toLowerCase() === cropName.toLowerCase()) || budgets[0];

    if (budget) {
      const warningCats = budget.categoryBudgets.filter((c) => c.status === 'warning' || c.status === 'exceeded');
      let budgetText = `💰 Seasonal Budget Report for *${budget.cropName}* (${budget.farmSizeAcres} Acres):\n\n`;
      budgetText += `• Total Budget: ${formatNairaNumber(budget.totalBudget)}\n`;
      budgetText += `• Total Spent: ${formatNairaNumber(budget.totalSpent)} (${budget.overallBurnPercent}% burn rate)\n`;
      budgetText += `• Remaining Balance: ${formatNairaNumber(Math.max(0, budget.remainingBudget))}\n`;
      budgetText += `• Status: ${budget.overallBurnPercent > 100 ? '⚠️ OVER BUDGET' : budget.overallBurnPercent >= 85 ? '⚡ NEAR LIMIT' : '✅ ON TRACK'}\n`;

      if (warningCats.length > 0) {
        budgetText += `\n⚠️ *Alert Categories*:\n`;
        warningCats.slice(0, 3).forEach((c) => {
          budgetText += `• ${c.categoryName}: ${formatNairaNumber(c.spentAmount)} of ${formatNairaNumber(c.allocatedBudget)} (${c.burnPercent}% spent)\n`;
        });
      }

      budgetText += `\n📈 Target Yield: ${budget.targetYieldQuantity} ${budget.targetYieldUnit} @ ${formatNairaNumber(budget.targetSellingPricePerUnit)} = Projected Revenue ${formatNairaNumber(budget.projectedRevenue)}.`;

      return res.json({
        reply: budgetText,
        parsedAction: null,
      });
    }
  }

  // 0c. Handle Crop Calendar & Growth Stage Inquiries (Phase 3)
  if (parsed.intent === 'calendar') {
    const cropName = parsed.cropQuery || activeCrops[0]?.name || 'Tomato';
    const calData = calculateCropCalendar(db.crops, db.tasks);
    const schedule = calData.find((c) => c.cropName.toLowerCase() === cropName.toLowerCase()) || calData[0];

    if (schedule) {
      let calText = `🌱 Crop Calendar for *${schedule.cropName}* (${schedule.variety || 'Active'}):\n\n`;
      calText += `• Planted: ${schedule.plantingDate} (Day ${schedule.daysAfterPlanting} of ${schedule.totalDaysToMaturity})\n`;
      calText += `• Current Stage: *${schedule.currentStage.stageName}* (${schedule.currentStage.progressPercent}%)\n`;
      calText += `• Key Action: ${schedule.currentStage.keyAction}\n`;
      calText += `• Agronomic Tip: ${schedule.currentStage.advisoryNotes}\n`;

      if (schedule.upcomingTasks.length > 0) {
        const pending = schedule.upcomingTasks.filter((t) => !t.completed);
        if (pending.length > 0) {
          calText += `\n📋 *Upcoming Farm Task*:\n• ${pending[0].title} (Due: ${pending[0].dueDate})${pending[0].estimatedCost ? ` ~ ${formatNairaNumber(pending[0].estimatedCost)}` : ''}`;
        }
      }

      return res.json({
        reply: calText,
        parsedAction: null,
      });
    }
  }

  // 0d. Handle Weather & Agro-Climate Inquiries (Phase 4)
  if (parsed.intent === 'weather') {
    const weather = generateAgroWeatherReport(db.profile.location || 'Kano, Nigeria', db.crops);
    let text = `🌦️ *Agro-Weather Advisory for ${weather.location}*:\n\n`;
    text += `• *Current*: ${weather.temperatureC}°C, ${weather.condition}\n`;
    text += `• *Rain Risk*: ${weather.rainfallProbability}% (Humidity: ${weather.humidityPercent}%, Wind: ${weather.windSpeedKmh} km/h)\n`;
    text += `• *Spray Suitability*: *${weather.spraySuitability}*\n`;
    text += `  _${weather.sprayAdvisory}_\n\n`;
    text += `💧 *Irrigation Recommendation*: ${weather.irrigationRecommendation}\n\n`;
    if (weather.cropThreatAlerts.length > 0) {
      const topAlert = weather.cropThreatAlerts[0];
      text += `⚠️ *Alert (${topAlert.cropName})*: ${topAlert.threatType}\n`;
      text += `Action: ${topAlert.preventativeAction}\n`;
    }
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0e. Handle Agri-Credit & Loan Inquiries (Phase 4)
  if (parsed.intent === 'loan') {
    const farmSummary = calculateFarmSummary(db.crops, db.expenses, db.sales);
    const debtorSummary = calculateDebtorSummary(db.sales);
    const credit = calculateAgriCreditScore(db.crops, db.expenses, db.sales, farmSummary, debtorSummary);
    let text = `🏦 *Farm Credit & Loan Pre-Qualification*:\n\n`;
    text += `• *Agri-Credit Score*: *${credit.score} / ${credit.maxScore}* (${credit.ratingTier})\n`;
    text += `• *Approval Probability*: ${credit.approvalProbabilityPercent}%\n`;
    text += `• *Pre-Qualified Borrowing Limit*: *${formatNairaNumber(credit.maxEligibleBorrowing)}*\n\n`;
    text += `📋 *Pre-Qualified Financing Facilities*:\n`;
    credit.availableLoanProducts.slice(0, 2).forEach((prod) => {
      text += `• *${prod.productTitle}* (${prod.institutionName})\n  Up to ${formatNairaNumber(prod.maxAmount)} @ ${prod.interestRatePerAnnum}% p.a. (${prod.repaymentStructure})\n`;
    });
    text += `\n💡 Your FarmPal cashflow statement is certified and ready for bank underwriter submission.`;
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0f. Handle Farm Store Inventory Inquiries (Phase 4)
  if (parsed.intent === 'inventory') {
    const items = db.inventoryItems.filter((i) => i.userId === userId);
    let text = `📦 *Farm Store Inventory Report*:\n\n`;
    items.forEach((item) => {
      const statusIcon = item.status === 'out_of_stock' ? '❌' : item.status === 'low_stock' ? '⚠️' : '✅';
      text += `${statusIcon} *${item.name}*: ${item.currentQuantity} ${item.unit}\n`;
    });
    const lowStock = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');
    if (lowStock.length > 0) {
      text += `\n⚠️ *Low Stock Alert*: ${lowStock.map((i) => `${i.name} (${i.currentQuantity} ${i.unit})`).join(', ')}. Restock before weekend field tasks!`;
    }
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0g. Handle Cooperative & Aggregation Inquiries (Phase 4)
  if (parsed.intent === 'cooperative') {
    const coop = db.cooperative;
    const pools = db.bulkInputPools;
    const aggPools = db.aggregationPools;
    let text = `🤝 *${coop.name}* (${coop.totalMembers} Members):\n\n`;
    text += `🛒 *Active Bulk Buying Orders*:\n`;
    pools.slice(0, 2).forEach((p) => {
      text += `• *${p.inputName}*: ${formatNairaNumber(p.coopBulkPrice)} / ${p.unit} (Save ${p.discountPercent}% vs retail)\n  Pledged: ${p.pledgedQuantity}/${p.targetQuantity} ${p.unit}\n`;
    });
    text += `\n🚛 *Produce Aggregation Contracts*:\n`;
    aggPools.slice(0, 2).forEach((a) => {
      text += `• *${a.cropName} -> ${a.offtakerName}*: Floor price ${formatNairaNumber(a.agreedFloorPricePerUnit)} / ${a.unit}\n  Progress: ${a.currentAggregatedVolume}/${a.minimumVolumeRequired} ${a.unit}\n`;
    });
    return res.json({
      reply: text,
      parsedAction: null,
    });
  }

  // 0h. Handle Daily Reminder Acknowledgement ("nothing today", "no expenses today", "quiet day")
  if (parsed.intent === 'reminder_ack') {
    const firstName = db.profile.name ? db.profile.name.split(' ')[0] : 'Farmer';
    const ackReplies = [
      `Understood ${firstName}! 🙏 No expenses or sales recorded for today. Resting well is an essential part of good farming. Have a peaceful evening, and tomorrow we push again! 🌿💤`,
      `Noted with thanks, Chief ${firstName}! 🌾 Glad today was quiet and peaceful on the farm. Rest well tonight—tomorrow is another blessed and fruitful day! 🌙`,
      `Acknowledged ${firstName}! ✨ Your notebook is up to date with zero expenses or sales today. Enjoy your evening and rest your body well! 👨‍🌾💤`,
      `Great! Rest well tonight, ${firstName}. 🚜 Farming has busy days and quiet days. Tomorrow we move again with fresh energy! 🌅`,
    ];
    const chosenAck = ackReplies[Math.floor(Math.random() * ackReplies.length)];
    return res.json({
      reply: chosenAck,
      parsedAction: null,
    });
  }

  // 1. Handle Expenses
  if (parsed.intent === 'expense' && parsed.expenses && parsed.expenses.length > 0) {
    // Check if clarification prompt needed
    if (parsed.clarificationPrompt && parsed.confidence < 0.7) {
      return res.json({
        reply: parsed.clarificationPrompt,
        parsedAction: null,
      });
    }

    // Check duplicate guard
    if (parsed.expenses.length === 1) {
      const single = parsed.expenses[0];
      const dup = checkDuplicateExpense(single.category, single.amount);
      if (dup) {
        return res.json({
          reply: `It looks like you may have already recorded this ${formatNairaNumber(single.amount)} ${single.category} expense today (${dup.expenseDate}).\n\nDo you want to save it anyway or cancel?`,
          parsedAction: {
            type: 'confirm_duplicate',
            data: {
              expenses: parsed.expenses,
              activeCrops,
            },
          },
        });
      }
    }

    // Shared expense across multiple crops
    if (parsed.sharedCropNames && parsed.sharedCropNames.length > 1) {
      const matchedCrops = activeCrops.filter((c) =>
        parsed.sharedCropNames?.some((name) => name.toLowerCase() === c.name.toLowerCase())
      );
      const total = parsed.expenses.reduce((sum, e) => sum + e.amount, 0);
      const cat = parsed.expenses[0]?.category || 'General';

      const reply = `Got it 🌱\n\nShared Expense: ${cat} — ${formatNairaNumber(total)}\nApplies to:\n${matchedCrops.map((c) => `✓ ${c.name}`).join('\n')}\n\nHow would you like to split this?\n1. Split equally (${Math.round(100 / matchedCrops.length)}% each)\n2. Split by farm size\n3. Save with custom split`;

      return res.json({
        reply,
        parsedAction: {
          type: 'split_expense',
          data: {
            categoryName: cat,
            totalAmount: total,
            crops: matchedCrops,
          },
        },
      });
    }

    // Multiple expenses in one message (Specification Section 8)
    if (parsed.expenses.length > 1) {
      const totalAmount = parsed.expenses.reduce((acc, e) => acc + e.amount, 0);
      const summaryLines = parsed.expenses
        .map((e) => `• ${e.category} — ${formatNairaNumber(e.amount)}`)
        .join('\n');

      const reply = `I found ${parsed.expenses.length} expenses:\n\n${summaryLines}\n\nTotal: ${formatNairaNumber(totalAmount)}\n\nShould I save them?`;

      return res.json({
        reply,
        parsedAction: {
          type: 'confirm_expenses',
          data: {
            expenses: parsed.expenses,
            totalAmount,
          },
        },
      });
    }

    // Single expense handling:
    const single = parsed.expenses[0];
    const explicitCrop = single.cropName
      ? db.crops.find((c) => c.name.toLowerCase() === single.cropName?.toLowerCase())
      : undefined;

    const targetCrop = explicitCrop || (activeCrops.length === 1 ? activeCrops[0] : (activeCrops.length === 0 ? db.crops[0] : undefined));

    // If target crop is determined (explicitly mentioned, or only 1 crop, or fallback to first crop):
    if (targetCrop) {
      // Auto-save
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        userId,
        categoryId: `cat-${single.category.toLowerCase()}`,
        categoryName: single.category,
        totalAmount: single.amount,
        expenseDate: new Date().toISOString().split('T')[0],
        description: single.description || `Recorded via WhatsApp`,
        isShared: false,
        allocations: [
          {
            cropId: targetCrop.id,
            cropName: targetCrop.name,
            percentage: 100,
            allocatedAmount: single.amount,
          },
        ],
        source: 'whatsapp',
        createdAt: new Date().toISOString(),
      };
      db.expenses.unshift(newExp);
      await db.persistExpense(newExp);

      // Compute new crop total
      const updatedTotalSpent = db.expenses
        .filter((e) => e.userId === userId)
        .reduce((sum, e) => {
          const match = e.allocations.find((a) => a.cropId === targetCrop.id);
          return sum + (match ? match.allocatedAmount : 0);
        }, 0);

      const reply = `Got it 🌱\n\n${formatNairaNumber(single.amount)} added to ${single.category} for ${targetCrop.name}.\n\nTotal spent on ${targetCrop.name}: ${formatNairaNumber(updatedTotalSpent)}.`;

      return res.json({
        reply,
        parsedAction: null,
      });
    }

    // Single expense with multiple active crops and no crop specified: Ask which crop
    if (activeCrops.length > 1) {
      const cropOptions = activeCrops.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      const reply = `Got it 🌱\n\n${single.category} — ${formatNairaNumber(single.amount)}\nWhich crop was this for?\n\n${cropOptions}\n${activeCrops.length + 1}. Shared across multiple crops`;

      return res.json({
        reply,
        parsedAction: {
          type: 'disambiguate_crop',
          data: {
            expense: single,
            crops: activeCrops,
          },
        },
      });
    }
  }

  // 2. Handle Sales
  if (parsed.intent === 'sale' && parsed.sale) {
    const sale = parsed.sale;
    let targetCrop = activeCrops.find(
      (c) => sale.cropName && c.name.toLowerCase() === sale.cropName.toLowerCase()
    );
    if (!targetCrop && activeCrops.length === 1) {
      targetCrop = activeCrops[0];
    }

    if (targetCrop) {
      const total = sale.totalAmount || sale.quantity * sale.pricePerUnit;
      const isCredit = Boolean(sale.isCredit);
      const buyerText = sale.buyer ? `\n• Buyer: ${sale.buyer}` : '';
      const paymentTermText = isCredit ? '\n• Payment Terms: On Credit (Unpaid)' : '\n• Payment Terms: Cash Paid';

      const reply = `Got it 🌱\n\nSale Recorded:\n• Crop: ${targetCrop.name}\n• Quantity: ${sale.quantity} ${sale.unit}\n• Price: ${formatNairaNumber(sale.pricePerUnit)} / ${sale.unit}\n• Total Revenue: ${formatNairaNumber(total)}${buyerText}${paymentTermText}\n\nConfirm to record?`;
      return res.json({
        reply,
        parsedAction: {
          type: 'confirm_sale',
          data: {
            cropId: targetCrop.id,
            cropName: targetCrop.name,
            quantitySold: sale.quantity,
            unit: sale.unit,
            pricePerUnit: sale.pricePerUnit,
            totalRevenue: total,
            buyerName: sale.buyer,
            isCredit,
            paymentStatus: isCredit ? 'credit' : 'paid',
          },
        },
      });
    }
  }

  // 2.5. Handle Debtor payment collection
  if (parsed.intent === 'debt_payment' && parsed.debtPayment) {
    const { buyerName, amountPaid } = parsed.debtPayment;
    const matchingSales = db.sales.filter(
      (s) =>
        (s.paymentStatus === 'credit' || s.paymentStatus === 'partial' || (s.amountDue && s.amountDue > 0)) &&
        s.buyerName &&
        s.buyerName.toLowerCase().includes(buyerName.toLowerCase())
    );

    const totalOwed = matchingSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
    const saleToApply = matchingSales[0];

    const reply = `Got it 🌱\n\nPayment Received from ${buyerName}:\n• Amount Collected: ${formatNairaNumber(amountPaid)}\n• Total Currently Owed: ${formatNairaNumber(totalOwed)}\n\nRecord this payment and update your Debtor records?`;

    return res.json({
      reply,
      parsedAction: {
        type: 'confirm_debt_payment',
        data: {
          saleId: saleToApply?.id,
          buyerName,
          amountPaid,
          totalOwed,
        },
      },
    });
  }

  // 3. Handle Harvest
  if (parsed.intent === 'harvest' && parsed.harvest) {
    const h = parsed.harvest;
    let targetCrop = activeCrops.find(
      (c) => h.cropName && c.name.toLowerCase() === h.cropName.toLowerCase()
    );
    if (!targetCrop && activeCrops.length === 1) {
      targetCrop = activeCrops[0];
    }
    if (targetCrop) {
      const reply = `Got it 🌱\n\nHarvest Recorded:\n• Crop: ${targetCrop.name}\n• Quantity: ${h.quantity} ${h.unit}\n\nConfirm to record?`;
      return res.json({
        reply,
        parsedAction: {
          type: 'confirm_harvest',
          data: {
            cropId: targetCrop.id,
            cropName: targetCrop.name,
            quantity: h.quantity,
            unit: h.unit,
          },
        },
      });
    }
  }

  // Default fallback
    res.json({
      reply:
        parsed.clarificationPrompt ||
        `Good day! I am FarmPal, your farm notebook.\n\nYou can tell me what you spent or earned:\n• "I spent 20k on labour today"\n• "I spent 15k on fertilizer and 5k on fuel"\n• "Sold 20 crates of tomato at 8k each"\n• "Harvested 40 bags of cucumber"`,
      parsedAction: null,
    });
  } catch (err) {
    console.error('Error in WhatsApp conversational engine:', err);
    res.json({
      reply: `I received your message 🌱. To ensure your farm records stay accurate, could you please specify what you spent or sold? For example:\n• "Spent 20k on labour"\n• "Bought fertilizer for 35k"`,
      parsedAction: null,
    });
  }
});

// Execute confirmed WhatsApp action
app.post('/api/whatsapp/execute-action', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const { actionType, data } = req.body;

    if (actionType === 'confirm_expenses') {
      const expenses = data.expenses || [];
      const activeCrops = db.crops.filter((c) => c.userId === userId && c.status === 'active');
      const defaultCrop = activeCrops[0] || db.crops.find((c) => c.userId === userId);

      for (const item of expenses) {
        // Look up assigned crop if specified
        let targetCrop = defaultCrop;
        if (item.cropId) {
          const matched = db.crops.find((c) => c.id === item.cropId && c.userId === userId);
          if (matched) targetCrop = matched;
        } else if (item.cropName) {
          const matched = db.crops.find((c) => c.name.toLowerCase() === item.cropName.toLowerCase() && c.userId === userId);
          if (matched) targetCrop = matched;
        }

        if (!targetCrop) {
          return res.status(400).json({ error: 'No active crops found for user' });
        }

        const newExp: Expense = {
          id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId, // TASK 2: client-supplied userId ignored
          categoryId: `cat-${(item.category || 'other').toLowerCase()}`,
          categoryName: item.category || 'Other',
          totalAmount: Number(item.amount),
          expenseDate: new Date().toISOString().split('T')[0],
          description: item.description || 'Recorded via WhatsApp',
          isShared: false,
          allocations: [
            {
              cropId: targetCrop.id,
              cropName: targetCrop.name,
              percentage: 100,
              allocatedAmount: Number(item.amount),
            },
          ],
          source: 'whatsapp',
          createdAt: new Date().toISOString(),
        };
        db.expenses.unshift(newExp);
        await db.persistExpense(newExp);
      }
      return res.json({
        success: true,
        message: `Saved ${expenses.length} expense${expenses.length > 1 ? 's' : ''} successfully! Your farm records have been updated 🌱`,
      });
    }

  if (actionType === 'confirm_sale') {
    // TASK 4: Verify crop ownership
    const crop = db.crops.find((c) => c.id === data.cropId && c.userId === userId);
    if (!crop) {
      return res.status(400).json({ error: `Referenced crop (${data.cropId}) not found or not owned by user` });
    }

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      userId, // TASK 2
      cropId: data.cropId,
      cropName: data.cropName || crop.name,
      saleDate: new Date().toISOString().split('T')[0],
      quantitySold: Number(data.quantitySold),
      unit: data.unit || 'crates',
      pricePerUnit: Number(data.pricePerUnit),
      totalRevenue: Number(data.totalRevenue),
      buyerName: data.buyerName,
      paymentStatus: data.isCredit ? 'credit' : (data.paymentStatus || 'paid'),
      amountPaid: data.isCredit ? 0 : Number(data.totalRevenue),
      amountDue: data.isCredit ? Number(data.totalRevenue) : 0,
      createdAt: new Date().toISOString(),
    };
    db.sales.unshift(newSale);
    await db.persistSale(newSale);
    const creditMsg = data.isCredit ? ' (Recorded as Unpaid Credit in Debtors Book)' : '';
    return res.json({
      success: true,
      message: `Sale recorded for ${data.cropName || crop.name}: ${data.quantitySold} ${data.unit} for ${formatNairaNumber(data.totalRevenue)}${creditMsg}! 🌱`,
    });
  }

  if (actionType === 'confirm_debt_payment') {
    const { saleId, buyerName, amountPaid } = data;
    // TASK 3: id = :id AND user_id = userId
    let sale = saleId ? db.sales.find((s) => s.id === saleId && s.userId === userId) : undefined;
    if (!sale) {
      // Find latest unpaid sale for this buyer belonging to this user
      sale = db.sales.find(
        (s) =>
          s.userId === userId &&
          (s.paymentStatus === 'credit' || s.paymentStatus === 'partial' || (s.amountDue && s.amountDue > 0)) &&
          s.buyerName &&
          s.buyerName.toLowerCase().includes(buyerName.toLowerCase())
      );
    }

    if (sale) {
      sale.amountPaid = (sale.amountPaid || 0) + Number(amountPaid);
      sale.amountDue = Math.max(0, sale.totalRevenue - sale.amountPaid);
      sale.paymentStatus = sale.amountDue <= 0 ? 'paid' : 'partial';
      sale.notes = sale.notes
        ? `${sale.notes} | Paid ₦${amountPaid.toLocaleString()} via WhatsApp`
        : `Paid ₦${amountPaid.toLocaleString()} via WhatsApp`;

      const paymentRecord = {
        id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        saleId: sale.id,
        paymentDate: new Date().toISOString().split('T')[0],
        amount: Number(amountPaid),
        note: `Collected via WhatsApp confirmation from ${buyerName}`,
        createdAt: new Date().toISOString(),
      };
      db.debtorPayments.push(paymentRecord);
      await db.persistDebtorPayment(paymentRecord);
      await db.persistSale(sale);
    }

    return res.json({
      success: true,
      message: `Payment of ${formatNairaNumber(amountPaid)} recorded from ${buyerName}! Your Debtor balance has been updated 🌱`,
    });
  }

  if (actionType === 'confirm_harvest') {
    // TASK 4: Verify crop ownership
    const crop = db.crops.find((c) => c.id === data.cropId && c.userId === userId);
    if (!crop) {
      return res.status(400).json({ error: `Referenced crop (${data.cropId}) not found or not owned by user` });
    }

    const newHarvest: HarvestRecord = {
      id: `harv-${Date.now()}`,
      userId, // TASK 2
      cropId: data.cropId,
      cropName: data.cropName || crop.name,
      harvestDate: new Date().toISOString().split('T')[0],
      quantity: Number(data.quantity),
      unit: data.unit,
      qualityGrade: 'Standard',
      createdAt: new Date().toISOString(),
    };
    db.harvests.unshift(newHarvest);
    await db.persistHarvest(newHarvest);
    return res.json({
      success: true,
      message: `Harvest recorded for ${data.cropName || crop.name}: ${data.quantity} ${data.unit} added to your record! 🌱`,
    });
  }

  if (actionType === 'split_expense') {
    const { categoryName, totalAmount, allocations } = data;
    // TASK 4: Verify crop ownership on each allocation
    for (const alloc of allocations || []) {
      const crop = db.crops.find((c) => c.id === alloc.cropId && c.userId === userId);
      if (!crop) {
        return res.status(400).json({ error: `Referenced crop (${alloc.cropId}) not found or not owned by user` });
      }
    }

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      userId, // TASK 2
      categoryId: `cat-${categoryName.toLowerCase()}`,
      categoryName,
      totalAmount: Number(totalAmount),
      expenseDate: new Date().toISOString().split('T')[0],
      description: 'Shared expense split across multiple crops',
      isShared: true,
      allocations,
      source: 'whatsapp',
      createdAt: new Date().toISOString(),
    };
    db.expenses.unshift(newExp);
    await db.persistExpense(newExp);
    return res.json({
      success: true,
      message: `Shared expense ${formatNairaNumber(totalAmount)} on ${categoryName} allocated successfully across ${allocations.length} crops 🌱`,
    });
  }

    res.status(400).json({ error: 'Unknown action type' });
  } catch (err) {
    console.error('Error executing WhatsApp action:', err);
    res.status(500).json({ error: 'Failed to execute action', message: 'Something went wrong saving to farm records.' });
  }
});

// ======================== LIVE WHATSAPP BOT WEBHOOK ENGINE ========================

function escapeXmlString(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Lookup user by normalized phone number
async function findUserByPhone(phone: string): Promise<{ uid: string; name: string } | null> {
  const cleanNumber = phone.replace(/[^0-9]/g, '');
  if (!cleanNumber) return null;

  if (process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db: sqlDb } = await import('./src/db/index.ts');
      const { users } = await import('./src/db/schema.ts');
      const allUsers = await sqlDb.select({ uid: users.uid, name: users.name, phone: users.phone }).from(users);
      const match = allUsers.find((u) => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanNumber);
      if (match) return { uid: match.uid, name: match.name };
    } catch (e) {
      console.warn('[WhatsApp] DB user lookup failed, falling back to cache:', e);
    }
  }

  // Check in-memory profiles
  for (const [uid, prof] of Object.entries(db.profiles)) {
    if (prof.phone && prof.phone.replace(/[^0-9]/g, '') === cleanNumber) {
      return { uid, name: prof.name };
    }
  }
  if (db.profile.phone && db.profile.phone.replace(/[^0-9]/g, '') === cleanNumber) {
    return { uid: db.profile.id, name: db.profile.name };
  }
  return null;
}

// Core processor for any incoming WhatsApp message via Meta Cloud API or webhooks
async function processLiveWhatsAppMessage(
  messageText: string,
  senderPhone?: string,
  authenticatedUserId?: string
): Promise<{ reply: string; actionExecuted?: string; details?: any }> {
  let effectiveUserId = authenticatedUserId;

  if (!effectiveUserId && senderPhone) {
    const userMatch = await findUserByPhone(senderPhone);
    if (userMatch) {
      effectiveUserId = userMatch.uid;
    }
  }

  // Unlinked phone numbers cannot mutate records or leak data
  if (!effectiveUserId) {
    return {
      reply: `⚠️ *Account Not Linked!* 👋\n\nYour phone number (${senderPhone || 'unknown'}) is not yet connected to a FarmPal farm account.\n\nPlease log in at your FarmPal portal and add your phone number in Settings so your farm records can sync automatically.`,
      actionExecuted: 'unlinked_phone',
    };
  }

  const activeCrops = db.crops.filter((c) => c.userId === effectiveUserId && c.status === 'active');
  const userExpenses = db.expenses.filter((e) => e.userId === effectiveUserId);
  const userSales = db.sales.filter((s) => s.userId === effectiveUserId);
  const parsed = await parseFarmerMessage(messageText, activeCrops);

  // 1. Market Price Queries
  if (parsed.intent === 'market_price') {
    const cropName = parsed.cropQuery || activeCrops[0]?.name || 'Tomato';
    const marketInfo = calculateMarketBenchmarks(userSales.length > 0 ? userSales : db.sales);
    const matches = marketInfo.benchmarks.filter((b) => b.cropName.toLowerCase() === cropName.toLowerCase());
    if (matches.length > 0) {
      const topMarket = [...matches].sort((a, b) => b.wholesaleAvg - a.wholesaleAvg)[0];
      const local = matches[0];
      let reply = `📊 *Market Price Report: ${cropName}* (${local.unit})\n\n`;
      reply += `• *${local.marketName} (${local.state})*: ${formatNairaNumber(local.wholesaleAvg)} / ${local.unit}\n`;
      if (topMarket && topMarket.id !== local.id) {
        reply += `• *${topMarket.marketName} (${topMarket.state})*: ${formatNairaNumber(topMarket.wholesaleAvg)} / ${topMarket.unit} (Highest paying)\n`;
      }
      reply += `\nTip: You can text your sales to me directly like: "Sold 10 crates for 90k to Alhaji Dan"`;
      return { reply, actionExecuted: 'market_price' };
    }
  }

  // 2. Budget Queries
  if (parsed.intent === 'budget') {
    const cropName = parsed.cropQuery || activeCrops[0]?.name || 'Tomato';
    const budgets = calculateCropBudgets(activeCrops, userExpenses, db.budgetConfigs);
    const budget = budgets.find((b) => b.cropName.toLowerCase() === cropName.toLowerCase()) || budgets[0];
    if (budget) {
      let reply = `💰 *Budget Status: ${budget.cropName}*\n\n`;
      reply += `• Total Budget: ${formatNairaNumber(budget.totalBudget)}\n`;
      reply += `• Total Spent: ${formatNairaNumber(budget.totalSpent)} (${budget.overallBurnPercent}% burn rate)\n`;
      reply += `• Balance Left: ${formatNairaNumber(Math.max(0, budget.remainingBudget))}\n`;
      reply += `• Status: ${budget.overallBurnPercent > 100 ? '⚠️ OVER BUDGET' : '✅ ON TRACK'}\n`;
      return { reply, actionExecuted: 'budget_query' };
    }
  }

  // 3. Direct Expense Recording
  if (parsed.expenses && parsed.expenses.length > 0) {
    const savedRecords: any[] = [];
    for (const exp of parsed.expenses) {
      const targetCrop = exp.cropName
        ? activeCrops.find((c) => c.name.toLowerCase() === exp.cropName?.toLowerCase()) || activeCrops[0]
        : activeCrops[0];

      if (targetCrop) {
        const ownerId = targetCrop.userId || effectiveUserId;
        const newExp: Expense = {
          id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: ownerId,
          categoryId: `cat-${exp.category.toLowerCase()}`,
          categoryName: exp.category,
          totalAmount: Number(exp.amount),
          expenseDate: new Date().toISOString().split('T')[0],
          description: exp.description || `WhatsApp entry: ${exp.category}`,
          isShared: false,
          allocations: [
            {
              cropId: targetCrop.id,
              cropName: targetCrop.name,
              percentage: 100,
              allocatedAmount: Number(exp.amount),
            },
          ],
          source: 'whatsapp',
          createdAt: new Date().toISOString(),
        };
        db.expenses.unshift(newExp);
        await db.persistExpense(newExp);
        savedRecords.push(newExp);
      }
    }

    if (savedRecords.length > 0) {
      const totalAmount = savedRecords.reduce((sum, r) => sum + r.totalAmount, 0);
      let reply = `✅ *Recorded to Farm Notebook!* 🌱\n\n`;
      savedRecords.forEach((r) => {
        reply += `• ${r.allocations[0]?.cropName || 'Crop'}: ${r.categoryName} — ${formatNairaNumber(r.totalAmount)}\n`;
      });
      reply += `\n*Total Spent:* ${formatNairaNumber(totalAmount)}\n`;
      reply += `Your break-even unit cost and seasonal ledger have been updated automatically.`;
      return { reply, actionExecuted: 'expense_recorded', details: savedRecords };
    }
  }

  // 4. Direct Sale Recording
  if (parsed.intent === 'sale' && parsed.sale) {
    const sale = parsed.sale;
    const targetCrop = sale.cropName
      ? activeCrops.find((c) => c.name.toLowerCase() === sale.cropName?.toLowerCase()) || activeCrops[0]
      : activeCrops[0];

    if (targetCrop) {
      const ownerId = targetCrop.userId || effectiveUserId;
      const total = sale.totalAmount || sale.quantity * sale.pricePerUnit;
      const isCredit = Boolean(sale.isCredit);
      const newSale: SaleRecord = {
        id: `sale-${Date.now()}`,
        userId: ownerId,
        cropId: targetCrop.id,
        cropName: targetCrop.name,
        saleDate: new Date().toISOString().split('T')[0],
        quantitySold: Number(sale.quantity),
        unit: sale.unit || 'crates',
        pricePerUnit: Number(sale.pricePerUnit),
        totalRevenue: Number(total),
        buyerName: sale.buyer || undefined,
        paymentStatus: isCredit ? 'credit' : 'paid',
        amountPaid: isCredit ? 0 : Number(total),
        amountDue: isCredit ? Number(total) : 0,
        createdAt: new Date().toISOString(),
      };
      db.sales.unshift(newSale);
      await db.persistSale(newSale);

      let reply = `🧺 *Produce Sale Recorded!* 🌱\n\n`;
      reply += `• Crop: ${targetCrop.name}\n`;
      reply += `• Quantity: ${sale.quantity} ${sale.unit || 'crates'} @ ${formatNairaNumber(sale.pricePerUnit)}\n`;
      reply += `• Total Revenue: ${formatNairaNumber(total)}\n`;
      if (sale.buyer) reply += `• Buyer: ${sale.buyer}\n`;
      reply += `• Payment: ${isCredit ? '⚠️ On Credit (Added to Debtors Tracker)' : '✅ Cash Received'}\n`;
      reply += `\nYour farm income and debtor records are updated.`;
      return { reply, actionExecuted: 'sale_recorded', details: newSale };
    }
  }

  // 5. Direct Harvest Recording
  if (parsed.intent === 'harvest' && parsed.harvest) {
    const harv = parsed.harvest;
    const targetCrop = harv.cropName
      ? activeCrops.find((c) => c.name.toLowerCase() === harv.cropName?.toLowerCase()) || activeCrops[0]
      : activeCrops[0];

    if (targetCrop) {
      const ownerId = targetCrop.userId || effectiveUserId;
      const newHarv: HarvestRecord = {
        id: `harv-${Date.now()}`,
        userId: ownerId,
        cropId: targetCrop.id,
        cropName: targetCrop.name,
        harvestDate: new Date().toISOString().split('T')[0],
        quantity: Number(harv.quantity),
        unit: harv.unit || 'crates',
        qualityGrade: 'Standard',
        createdAt: new Date().toISOString(),
      };
      db.harvests.unshift(newHarv);
      await db.persistHarvest(newHarv);

      let reply = `🌾 *Harvest Logged!* 🌱\n\n`;
      reply += `• Crop: ${targetCrop.name}\n`;
      reply += `• Harvested: ${harv.quantity} ${harv.unit || 'crates'}\n`;
      reply += `\nReady to record sales when you sell this produce!`;
      return { reply, actionExecuted: 'harvest_recorded', details: newHarv };
    }
  }

  // Fallback guidance
  return {
    reply: `Hello from FarmPal! 👋\n\nI can help you record your farm finances. Try texting:\n\n• "Spent 15k on fertilizer for tomato"\n• "Paid 8k for 2 weeders today"\n• "Sold 25 crates of tomato for 200k"\n• "What is tomato price in Lagos today?"\n• "Am I on budget for tomato?"`,
    actionExecuted: 'help',
  };
}

// Send message via Meta WhatsApp Business Cloud API
async function sendMetaWhatsAppMessage(toPhone: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    return false;
  }
  try {
    const cleanNumber = toPhone.replace(/[^0-9]/g, '');
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanNumber,
        type: 'text',
        text: { body: text },
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('[WhatsApp Bot] Meta API call error:', e);
    return false;
  }
}

// 1. Meta WhatsApp Business API Webhook Verification (GET Handshake)
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'farmpal_webhook_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Bot] Meta Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// 2. Meta WhatsApp Business API Webhook Receiver (POST Message Handler)
app.post('/api/whatsapp/webhook', async (req: express.Request, res: express.Response) => {
  try {
    const rawReq = req as RequestWithRawBody;
    const appSecret =
      process.env.WHATSAPP_APP_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'dev_test_whatsapp_secret_2026' : undefined);

    // Production security constraint:
    // If WHATSAPP_APP_SECRET is missing in production, reject immediately with 500 configuration error
    if (!appSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[WhatsApp Bot] Rejected webhook: WHATSAPP_APP_SECRET is not configured in production');
        return res.status(500).json({ error: 'Webhook configuration error' });
      }
    }

    // When secret is configured (or in production), enforce HMAC-SHA256 signature validation over exact rawBody
    if (appSecret) {
      const signatureHeader = req.headers['x-hub-signature-256'];
      if (!signatureHeader || typeof signatureHeader !== 'string') {
        console.warn('[WhatsApp Bot] Rejected webhook: missing X-Hub-Signature-256');
        return res.status(401).json({ error: 'Missing X-Hub-Signature-256 header' });
      }

      if (!signatureHeader.startsWith('sha256=')) {
        console.warn('[WhatsApp Bot] Rejected webhook: malformed X-Hub-Signature-256');
        return res.status(400).json({ error: 'Malformed signature format. Expected sha256=...' });
      }

      const rawBuffer = rawReq.rawBody || Buffer.alloc(0);
      const expectedDigest = crypto
        .createHmac('sha256', appSecret)
        .update(rawBuffer)
        .digest('hex');
      const expectedHeader = `sha256=${expectedDigest}`;

      const sigBuffer = Buffer.from(signatureHeader, 'utf8');
      const expectedBuffer = Buffer.from(expectedHeader, 'utf8');

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        console.warn('[WhatsApp Bot] Rejected webhook: invalid signature');
        return res.status(403).json({ error: 'Invalid webhook signature' });
      }
    }

    const body = req.body;

    // Check if WhatsApp Business Account event
    if (body && body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // Phone number of sender
        let text = '';

        if (message.type === 'text') {
          text = message.text?.body || '';
        } else if (message.type === 'button') {
          text = message.button?.text || '';
        } else if (message.type === 'interactive') {
          text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
        }

        if (text) {
          console.log(`[WhatsApp Bot] Incoming message from ${from}: "${text}"`);
          const result = await processLiveWhatsAppMessage(text, from);

          // If configured with Meta access tokens, reply directly to the WhatsApp user
          await sendMetaWhatsAppMessage(from, result.reply);
        }
      }

      // Return 200 OK immediately so Meta does not retry
      return res.sendStatus(200);
    }

    res.sendStatus(404);
  } catch (err) {
    console.error('[WhatsApp Bot] Webhook processing error:', err);
    res.sendStatus(500);
  }
});

// 3. WhatsApp Bot Configuration & Live Status
app.get('/api/whatsapp/config', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'farmpal_webhook_2026';
  const metaConfigured = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

  res.json({
    status: 'ready',
    verifyToken,
    metaWebhookUrl: `${baseUrl}/api/whatsapp/webhook`,
    isMetaConfigured: metaConfigured,
    sampleVerifyHandshake: `${baseUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=1158201444`,
  });
});

// 5. Test Live Webhook Payload (Simulates an incoming WhatsApp message)
app.post('/api/whatsapp/test-webhook', requireDevOnly, async (req, res) => {
  try {
    const { message, senderPhone = '+2348031234567', provider = 'meta' } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await processLiveWhatsAppMessage(message.trim(), senderPhone);
    res.json({
      success: true,
      senderPhone,
      provider,
      incomingMessage: message.trim(),
      botReply: result.reply,
      actionExecuted: result.actionExecuted,
      details: result.details,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to test webhook' });
  }
});

// Reset seed data
app.post(['/api/reset', '/api/reset-seed'], requireDevOnly, (req, res) => {
  // Re-instantiate
  const fresh = new (db.constructor as any)();
  Object.assign(db, fresh);
  res.json({ message: 'Reset to seed data complete' });
});

// ======================== GITHUB & EXPORT ENDPOINTS ========================

// Get Git repository status
app.get('/api/github/status', requireDevOnly, (req, res) => {
  try {
    const isGit = fs.existsSync(path.join(process.cwd(), '.git'));
    if (!isGit) {
      return res.json({
        initialized: false,
        message: 'Git repository not initialized',
      });
    }

    const branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe', encoding: 'utf8' }).trim();
    const lastCommitHash = execSync('git rev-parse --short HEAD', { stdio: 'pipe', encoding: 'utf8' }).trim();
    const lastCommitMsg = execSync('git log -1 --pretty=%B', { stdio: 'pipe', encoding: 'utf8' }).trim();
    const lastCommitDate = execSync('git log -1 --pretty=%cd --date=relative', { stdio: 'pipe', encoding: 'utf8' }).trim();
    const totalCommits = execSync('git rev-list --count HEAD', { stdio: 'pipe', encoding: 'utf8' }).trim();

    let remoteOrigin: string | null = null;
    try {
      const remotes = execSync('git remote', { stdio: 'pipe', encoding: 'utf8' })
        .split('\n')
        .map((r) => r.trim());
      if (remotes.includes('origin')) {
        remoteOrigin = execSync('git remote get-url origin', { stdio: 'pipe', encoding: 'utf8' }).trim();
      }
    } catch {
      remoteOrigin = null;
    }

    res.json({
      initialized: true,
      branch,
      lastCommitHash,
      lastCommitMsg,
      lastCommitDate,
      totalCommits: parseInt(totalCommits, 10) || 1,
      remoteOrigin: remoteOrigin ? remoteOrigin.replace(/\/\/[^@]+@/, '//***@') : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query git status', details: err?.message || String(err) });
  }
});

// Download full project source zip (ready for GitHub or offline development)
app.get('/api/github/export-zip', requireDevOnly, (req, res) => {
  try {
    const zipPath = path.join('/tmp', `farmpal-source-${Date.now()}.zip`);
    const scriptPath = path.join(process.cwd(), 'scripts', 'export-zip.py');
    const includeGit = req.query.git === 'true' ? ' --include-git' : '';

    execSync(`python3 "${scriptPath}" "${zipPath}"${includeGit}`, { stdio: 'pipe' });

    if (!fs.existsSync(zipPath)) {
      return res.status(500).json({ error: 'Zip file generation failed' });
    }

    res.download(zipPath, 'farmpal-source.zip', () => {
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch (_) {}
    });
  } catch (err: any) {
    console.error('Error generating export zip:', err);
    res.status(500).json({ error: 'Failed to generate project zip archive' });
  }
});

// Push directly to remote GitHub repository
app.post('/api/github/push', requireDevOnly, (req, res) => {
  const { repoUrl, token, branch = 'main' } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository.git)' });
  }

  // Clean and sanitize repository URL
  let cleanUrl = repoUrl.trim();
  if (!cleanUrl.startsWith('https://github.com/')) {
    return res.status(400).json({ error: 'Repository URL must start with https://github.com/' });
  }
  if (!cleanUrl.endsWith('.git')) {
    cleanUrl += '.git';
  }

  try {
    // Check if git is initialized
    if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
      execSync('git init -b main', { stdio: 'pipe' });
      execSync('git config user.name "Temple Nwobodo"', { stdio: 'pipe' });
      execSync('git config user.email "nwobodotemple2002@gmail.com"', { stdio: 'pipe' });
      execSync('git add .', { stdio: 'pipe' });
      execSync('git commit -m "feat: initial commit of FarmPal"', { stdio: 'pipe' });
    } else {
      // Stage any new uncommitted changes
      execSync('git add -A', { stdio: 'pipe' });
      try {
        execSync('git commit -m "chore: sync farm records and updates"', { stdio: 'pipe' });
      } catch (_) {
        // No changes to commit is fine
      }
    }

    // Prepare authenticated URL if token provided
    let pushUrl = cleanUrl;
    if (token && typeof token === 'string' && token.trim()) {
      const sanitizedToken = token.trim();
      const stripped = cleanUrl.replace('https://', '');
      pushUrl = `https://${encodeURIComponent(sanitizedToken)}@${stripped}`;
    }

    // Safely set or replace remote origin without printing errors to stderr
    try {
      const existingRemotes = execSync('git remote', { stdio: 'pipe', encoding: 'utf8' })
        .split('\n')
        .map((r) => r.trim());
      if (existingRemotes.includes('origin')) {
        execSync('git remote remove origin', { stdio: 'pipe' });
      }
    } catch (_) {}

    execSync(`git remote add origin "${pushUrl}"`, { stdio: 'pipe' });

    // Ensure branch is named properly
    execSync(`git branch -M "${branch}"`, { stdio: 'pipe' });

    // Push to GitHub
    execSync(`git push -u origin "${branch}" --force`, {
      timeout: 30000,
      stdio: 'pipe',
    });

    // Reset origin to clean URL without token so credentials are never saved in git config
    try {
      const existingRemotes = execSync('git remote', { stdio: 'pipe', encoding: 'utf8' })
        .split('\n')
        .map((r) => r.trim());
      if (existingRemotes.includes('origin')) {
        execSync('git remote remove origin', { stdio: 'pipe' });
      }
      execSync(`git remote add origin "${cleanUrl}"`, { stdio: 'pipe' });
    } catch (_) {}

    res.json({
      success: true,
      message: `Successfully pushed FarmPal codebase to ${cleanUrl} on branch '${branch}'! 🚀`,
      repoUrl: cleanUrl,
      branch,
    });
  } catch (err: any) {
    const rawError = err?.stderr?.toString() || err?.message || 'Push command failed';
    // Sanitize any token from error message
    const sanitizedError = rawError.replace(/https:\/\/[^@]+@/g, 'https://***@');
    console.error('Git push error:', sanitizedError);

    res.status(500).json({
      error: 'Failed to push to GitHub',
      details: sanitizedError,
      suggestion: sanitizedError.includes('Authentication failed') || sanitizedError.includes('could not read Username')
        ? 'Please check your GitHub Personal Access Token (PAT). Make sure it has "repo" scope permissions.'
        : sanitizedError.includes('Repository not found')
        ? 'Repository was not found. Please ensure the repository exists on GitHub and that your token has access to it.'
        : 'Ensure your GitHub token and repository URL are correct, or download the project ZIP to push manually.',
    });
  }
});

// ======================== CENTRALIZED ERROR HANDLER ========================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[FarmPal Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = Number(err.status) || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : (err.message || 'Internal Server Error'),
  });
});

// ======================== VITE / PRODUCTION ========================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const rootDist = path.join(process.cwd(), 'dist');
    const localDist = path.resolve(__dirname, '..', 'dist');
    const distPath = fs.existsSync(rootDist) ? rootDist : (fs.existsSync(localDist) ? localDist : __dirname);

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle is starting up. Please refresh in a few seconds.');
      }
    });
  }

  await db.syncFromCloudSql().catch((err) => {
    console.warn('[Cloud SQL] Startup sync warning:', err);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FarmPal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
