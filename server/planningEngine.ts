import {
  Crop,
  Expense,
  SaleRecord,
  CropBudget,
  CategoryBudget,
  MarketPriceBenchmark,
  MarketAdvisoryInsight,
  CropCalendarSchedule,
  GrowthStageMilestone,
  AgronomicTask,
  UssdSessionResponse,
} from '../src/types';
import { db } from './store';
import {
  defaultMarketBenchmarks,
  defaultMarketInsights,
  calculateMarketBenchmarks,
  syncWeeklyMarketBenchmarks,
  VERIFIED_MARKET_SOURCES,
} from './marketPriceEngine';

export {
  defaultMarketBenchmarks,
  defaultMarketInsights,
  calculateMarketBenchmarks,
  syncWeeklyMarketBenchmarks,
  VERIFIED_MARKET_SOURCES,
};

// ======================== SEED PLANNING & BENCHMARK DATA ========================

export interface RawCropBudgetConfig {
  cropId: string;
  targetYieldQuantity: number;
  targetYieldUnit: string;
  targetSellingPricePerUnit: number;
  categoryAllocations: Record<string, number>; // categoryName -> allocated amount (₦)
}

export const defaultBudgetConfigs: Record<string, RawCropBudgetConfig> = {
  'crop-tomato': {
    cropId: 'crop-tomato',
    targetYieldQuantity: 80,
    targetYieldUnit: 'crates',
    targetSellingPricePerUnit: 18000,
    categoryAllocations: {
      'Seeds': 65000,
      'Labour': 150000,
      'Fertilizer': 120000,
      'Fuel': 65000,
      'Chemicals': 50000,
      'Irrigation': 30000,
      'Transport': 30000,
      'Packaging': 30000,
    },
  },
  'crop-cucumber': {
    cropId: 'crop-cucumber',
    targetYieldQuantity: 120,
    targetYieldUnit: 'bags',
    targetSellingPricePerUnit: 12500,
    categoryAllocations: {
      'Seeds': 45000,
      'Labour': 80000,
      'Fertilizer': 65000,
      'Fuel': 35000,
      'Chemicals': 30000,
      'Transport': 25000,
    },
  },
  'crop-sweetcorn': {
    cropId: 'crop-sweetcorn',
    targetYieldQuantity: 90,
    targetYieldUnit: 'bags',
    targetSellingPricePerUnit: 17000,
    categoryAllocations: {
      'Seeds': 40000,
      'Labour': 70000,
      'Fertilizer': 60000,
      'Fuel': 30000,
      'Chemicals': 25000,
    },
  },
};


export const defaultAgronomicTasks: AgronomicTask[] = [
  {
    id: 'task-1',
    userId: 'farmer-1',
    cropId: 'crop-tomato',
    cropName: 'Tomato',
    title: 'Top-dressing Fertilizer (NPK 15:15:15)',
    category: 'Fertilizer',
    dueDate: '2026-03-15',
    completed: false,
    estimatedCost: 25000,
    notes: 'Apply 50g ring placement around flowering plants before watering',
  },
  {
    id: 'task-2',
    userId: 'farmer-1',
    cropId: 'crop-tomato',
    cropName: 'Tomato',
    title: 'Foliar Calcium spray for Blossom End Rot prevention',
    category: 'Chemicals',
    dueDate: '2026-03-18',
    completed: false,
    estimatedCost: 12000,
    notes: 'Early morning spray to strengthen fruit skin against heat stress',
  },
  {
    id: 'task-3',
    userId: 'farmer-1',
    cropId: 'crop-cucumber',
    cropName: 'Cucumber',
    title: '2nd Harvest Flush & Trellis Tightening',
    category: 'Harvesting',
    dueDate: '2026-03-14',
    completed: false,
    estimatedCost: 15000,
    notes: 'Harvest early morning when crisp, pick every 3 days',
  },
  {
    id: 'task-4',
    userId: 'farmer-1',
    cropId: 'crop-sweetcorn',
    cropName: 'Sweetcorn',
    title: 'Stem Borer scouting & Neem extract spray',
    category: 'Chemicals',
    dueDate: '2026-03-16',
    completed: true,
    completedDate: '2026-03-10',
    estimatedCost: 8000,
    notes: 'Check inner funnel whorl for frass or caterpillar damage',
  },
  {
    id: 'task-5',
    userId: 'farmer-1',
    cropId: 'crop-cucumber',
    cropName: 'Cucumber',
    title: 'Post-harvest irrigation line flushing',
    category: 'Irrigation',
    dueDate: '2026-03-20',
    completed: false,
    estimatedCost: 5000,
    notes: 'Flush drip nozzles to prevent sand and mineral blockages',
  },
];

// ======================== ENGINE CALCULATION FUNCTIONS ========================

// 1. Calculate Crop Budgets vs Actual Expenses
export function calculateCropBudgets(
  crops: Crop[],
  expenses: Expense[],
  budgetConfigs: Record<string, RawCropBudgetConfig>
): CropBudget[] {
  return crops.map((crop) => {
    const config = budgetConfigs[crop.id] || {
      cropId: crop.id,
      targetYieldQuantity: 100,
      targetYieldUnit: 'units',
      targetSellingPricePerUnit: 5000,
      categoryAllocations: {
        'Seeds': 30000,
        'Labour': 80000,
        'Fertilizer': 60000,
        'Fuel': 30000,
        'Chemicals': 20000,
      },
    };

    // Calculate actual spending per category for this crop
    const spentByCategory: Record<string, number> = {};
    let totalSpent = 0;

    for (const exp of expenses) {
      const match = exp.allocations.find((a) => a.cropId === crop.id);
      if (match) {
        totalSpent += match.allocatedAmount;
        spentByCategory[exp.categoryName] = (spentByCategory[exp.categoryName] || 0) + match.allocatedAmount;
      }
    }

    // Merge allocated categories with any actual spent categories
    const allCategoryNames = Array.from(
      new Set([...Object.keys(config.categoryAllocations), ...Object.keys(spentByCategory)])
    );

    let totalBudget = 0;
    const categoryBudgets: CategoryBudget[] = allCategoryNames.map((catName) => {
      const allocated = config.categoryAllocations[catName] || 0;
      totalBudget += allocated;
      const spent = spentByCategory[catName] || 0;
      const remaining = allocated - spent;
      const burnPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : spent > 0 ? 100 : 0;

      let status: 'healthy' | 'warning' | 'exceeded' = 'healthy';
      if (burnPercent > 100) status = 'exceeded';
      else if (burnPercent >= 80) status = 'warning';

      return {
        categoryName: catName,
        allocatedBudget: allocated,
        spentAmount: spent,
        remainingAmount: remaining,
        burnPercent,
        status,
      };
    });

    // Sort: exceeded first, then warning, then healthy
    categoryBudgets.sort((a, b) => b.burnPercent - a.burnPercent);

    const remainingBudget = totalBudget - totalSpent;
    const overallBurnPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    let status: 'under' | 'near_limit' | 'exceeded' = 'under';
    if (overallBurnPercent > 100) status = 'exceeded';
    else if (overallBurnPercent >= 85) status = 'near_limit';

    const projectedRevenue = config.targetYieldQuantity * config.targetSellingPricePerUnit;
    const projectedNetProfit = projectedRevenue - totalBudget;

    return {
      cropId: crop.id,
      cropName: crop.name,
      farmSizeAcres: crop.farmSizeAcres,
      totalBudget,
      totalSpent,
      remainingBudget,
      overallBurnPercent,
      targetYieldQuantity: config.targetYieldQuantity,
      targetYieldUnit: config.targetYieldUnit,
      targetSellingPricePerUnit: config.targetSellingPricePerUnit,
      projectedRevenue,
      projectedNetProfit,
      categoryBudgets,
      status,
    };
  });
}


// 3. Agronomic Calendar & Growth Stages Schedule
export function calculateCropCalendar(
  crops: Crop[],
  tasks: AgronomicTask[]
): CropCalendarSchedule[] {
  const today = new Date();

  return crops
    .filter((c) => c.status === 'active')
    .map((crop) => {
      const plantDate = new Date(crop.plantingDate);
      const diffMs = today.getTime() - plantDate.getTime();
      const daysAfterPlanting = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      // Standard agronomic cycle for typical crops
      let totalDays = 90;
      let stageDefs: { name: string; start: number; end: number; tips: string; action: string }[] = [];

      if (crop.name.toLowerCase().includes('tomato')) {
        totalDays = 85;
        stageDefs = [
          {
            name: 'Nursery & Land Prep',
            start: 1,
            end: 21,
            tips: 'Hardening seedlings with reduced watering 5 days before transplanting.',
            action: 'Transplant healthy, stocky seedlings in early evening.',
          },
          {
            name: 'Vegetative Growth & 1st Weeding',
            start: 22,
            end: 45,
            tips: 'Rapid stem and leaf elongation. Critical water and nitrogen window.',
            action: 'Stake or trellis plants and complete shallow manual weeding.',
          },
          {
            name: 'Flowering & Fruit Set',
            start: 46,
            end: 65,
            tips: 'Pollen viability requires regular soil moisture without waterlogging.',
            action: 'Apply potassium-rich booster and Calcium foliar spray for firm skin.',
          },
          {
            name: 'Fruit Maturation & Peak Harvest',
            start: 66,
            end: 85,
            tips: 'Fruits turning breaker stage (pink blush) to deep red.',
            action: 'Harvest into aerated plastic crates during cool morning hours.',
          },
        ];
      } else if (crop.name.toLowerCase().includes('cucumber')) {
        totalDays = 55;
        stageDefs = [
          {
            name: 'Germination & Early Leafing',
            start: 1,
            end: 14,
            tips: 'Keep seedbeds damp; protect tender shoots from beetles.',
            action: 'Thin to 2 vigorous plants per planting station.',
          },
          {
            name: 'Vining & Trellising',
            start: 15,
            end: 32,
            tips: 'Rapid vine climb; female flowers showing miniature fruit bases.',
            action: 'Guide vines onto twine or wooden bamboo trellis.',
          },
          {
            name: 'Continuous Harvesting',
            start: 33,
            end: 55,
            tips: 'Harvest every 2 to 3 days to stimulate new flower flushes.',
            action: 'Cut fruit cleanly with pruning shears leaving short stem.',
          },
        ];
      } else {
        // General cereal / sweetcorn cycle
        totalDays = 75;
        stageDefs = [
          {
            name: 'Seedling Emergence',
            start: 1,
            end: 18,
            tips: 'Even germination; guard against birds and cutworms.',
            action: 'Gap filling and first basal fertilizer application.',
          },
          {
            name: 'Knee-High Vegetative & Top-Dressing',
            start: 19,
            end: 45,
            tips: 'Rapid stem thickening; high nitrogen demand.',
            action: 'Side-dress with urea or NPK and mound soil around base.',
          },
          {
            name: 'Tasseling & Silking',
            start: 46,
            end: 60,
            tips: 'Pollen shedding onto silks; high water requirement.',
            action: 'Ensure uninterrupted furrow or drip irrigation.',
          },
          {
            name: 'Grain Filling & Cob Harvest',
            start: 61,
            end: 75,
            tips: 'Silks turn dark brown; kernels milky-sweet when punctured.',
            action: 'Harvest early morning and cool immediately.',
          },
        ];
      }

      const overallProgress = Math.min(100, Math.round((daysAfterPlanting / totalDays) * 100));
      const estHarvestDate = new Date(plantDate.getTime() + totalDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const stages: GrowthStageMilestone[] = stageDefs.map((s, idx) => {
        const isCompleted = daysAfterPlanting > s.end;
        const isCurrent = daysAfterPlanting >= s.start && daysAfterPlanting <= s.end;
        let progress = 0;
        if (isCompleted) progress = 100;
        else if (isCurrent) {
          progress = Math.round(((daysAfterPlanting - s.start) / (s.end - s.start + 1)) * 100);
        }

        return {
          id: `stage-${crop.id}-${idx}`,
          cropId: crop.id,
          cropName: crop.name,
          stageName: s.name,
          startDay: s.start,
          endDay: s.end,
          isCurrent,
          isCompleted,
          progressPercent: progress,
          advisoryNotes: s.tips,
          keyAction: s.action,
        };
      });

      const currentStage = stages.find((s) => s.isCurrent) || stages[stages.length - 1];
      const cropTasks = tasks.filter((t) => t.cropId === crop.id);

      return {
        cropId: crop.id,
        cropName: crop.name,
        variety: crop.variety,
        plantingDate: crop.plantingDate,
        daysAfterPlanting,
        totalDaysToMaturity: totalDays,
        overallProgressPercent: overallProgress,
        estimatedHarvestDate: estHarvestDate,
        currentStage,
        stages,
        upcomingTasks: cropTasks,
      };
    });
}

// 4. USSD Gateway Engine (Simulating Nigerian Telecoms USSD shortcode *384*24#)
export function handleUssdSession(
  text: string,
  crops: Crop[],
  expenses: Expense[],
  sales: SaleRecord[],
  userId: string = 'farmer-1'
): UssdSessionResponse {
  const parts = text.split('*').filter((p) => p.length > 0);

  // Root Menu
  if (parts.length === 0) {
    return {
      message:
        'FarmPal Nigeria\n' +
        '1. Log Expense\n' +
        '2. Live Market Prices\n' +
        '3. Check Crop Balance\n' +
        '4. Debtors Outstanding\n' +
        '5. Today Summary',
      action: 'CON',
    };
  }

  const mainChoice = parts[0];

  // Option 1: Log Expense
  if (mainChoice === '1') {
    if (parts.length === 1) {
      // Prompt for crop
      const active = crops.filter((c) => c.status === 'active');
      const cropList = active.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      return {
        message: `Select Crop for Expense:\n${cropList}`,
        action: 'CON',
      };
    }

    const cropIndex = parseInt(parts[1], 10) - 1;
    const active = crops.filter((c) => c.status === 'active');
    const selectedCrop = active[cropIndex] || active[0];

    if (parts.length === 2) {
      return {
        message: `Select Category for ${selectedCrop.name}:\n1. Labour\n2. Fertilizer\n3. Fuel\n4. Seeds\n5. Chemicals`,
        action: 'CON',
      };
    }

    if (parts.length === 3) {
      return {
        message: `Enter Amount in Naira (e.g. 15000):`,
        action: 'CON',
      };
    }

    if (parts.length >= 4) {
      const catMap: Record<string, string> = {
        '1': 'Labour',
        '2': 'Fertilizer',
        '3': 'Fuel',
        '4': 'Seeds',
        '5': 'Chemicals',
      };
      const catName = catMap[parts[2]] || 'Other';
      const amount = parseInt(parts[3], 10) || 0;

      // Auto-save this expense into database
      const newExp: Expense = {
        id: `exp-ussd-${Date.now()}`,
        userId,
        categoryId: `cat-${catName.toLowerCase()}`,
        categoryName: catName,
        totalAmount: amount,
        expenseDate: new Date().toISOString().split('T')[0],
        description: `USSD quick entry: ${catName}`,
        isShared: false,
        allocations: [
          {
            cropId: selectedCrop.id,
            cropName: selectedCrop.name,
            percentage: 100,
            allocatedAmount: amount,
          },
        ],
        source: 'whatsapp', // marked as quick channel
        createdAt: new Date().toISOString(),
      };
      db.expenses.unshift(newExp);
      db.persistExpense(newExp).catch(() => {});

      return {
        message: `Success! Recorded ₦${amount.toLocaleString('en-NG')} on ${catName} for ${selectedCrop.name}.\nFarmPal notebook updated.`,
        action: 'END',
      };
    }
  }

  // Option 2: Live Market Prices
  if (mainChoice === '2') {
    if (parts.length === 1) {
      return {
        message: 'Select Commodity:\n1. Tomato (crate)\n2. Cucumber (bag)\n3. Sweetcorn (bag)\n4. Nationwide Top Prices',
        action: 'CON',
      };
    }

    if (parts[1] === '1') {
      return {
        message:
          'Tomato Prices Today:\n' +
          '• Kano Dawanau: ₦8,200/crate\n' +
          '• Lagos Mile 12: ₦11,000/crate (Rising)\n' +
          '• Jos Farin Gada: ₦7,800/crate\n' +
          'Tip: Lagos offering ₦2.8k premium.',
        action: 'END',
      };
    }

    if (parts[1] === '2') {
      return {
        message:
          'Cucumber Prices Today:\n' +
          '• Kano Yankaba: ₦6,200/bag\n' +
          '• Ibadan Bodija: ₦7,700/bag\n' +
          '• Lagos Mile 12: ₦8,600/bag',
        action: 'END',
      };
    }

    if (parts[1] === '3') {
      return {
        message:
          'Sweetcorn Prices Today:\n' +
          '• Kano Dawanau: ₦8,000/bag\n' +
          '• Onitsha Ogbaru: ₦10,200/bag (High demand)',
        action: 'END',
      };
    }

    return {
      message:
        'Top National Markets:\n' +
        '1. Lagos Mile 12: Tomato ₦11k\n' +
        '2. Onitsha Ogbaru: Corn ₦10.2k\n' +
        '3. Ibadan Bodija: Cucumber ₦7.7k',
      action: 'END',
    };
  }

  // Option 3: Check Crop Balance
  if (mainChoice === '3') {
    const active = crops.filter((c) => c.status === 'active');
    const lines = active.map((c) => {
      let spent = 0;
      for (const e of expenses) {
        const m = e.allocations.find((a) => a.cropId === c.id);
        if (m) spent += m.allocatedAmount;
      }
      let earned = 0;
      for (const s of sales.filter((s) => s.cropId === c.id)) {
        earned += s.totalRevenue;
      }
      const net = earned - spent;
      return `${c.name}: Net ${net >= 0 ? '+' : ''}₦${(net / 1000).toFixed(0)}k`;
    });

    return {
      message: `Active Crop Financials:\n${lines.join('\n')}\nDial *384*24# for full menu.`,
      action: 'END',
    };
  }

  // Option 4: Debtors Outstanding
  if (mainChoice === '4') {
    let totalDebt = 0;
    const unpaidBuyers: Record<string, number> = {};

    for (const s of sales) {
      if (s.amountDue > 0) {
        totalDebt += s.amountDue;
        const buyer = s.buyerName || 'Unnamed Buyer';
        unpaidBuyers[buyer] = (unpaidBuyers[buyer] || 0) + s.amountDue;
      }
    }

    const debtorList = Object.entries(unpaidBuyers)
      .slice(0, 3)
      .map(([name, bal]) => `• ${name}: ₦${bal.toLocaleString('en-NG')}`)
      .join('\n');

    return {
      message:
        `Total Debtors Balance: ₦${totalDebt.toLocaleString('en-NG')}\n` +
        `Top Outstanding:\n${debtorList || 'None'}\n` +
        `Track or collect via FarmPal web.`,
      action: 'END',
    };
  }

  // Option 5: Today Summary
  if (mainChoice === '5') {
    const today = new Date().toISOString().split('T')[0];
    const todayExp = expenses.filter((e) => e.expenseDate === today);
    const todaySales = sales.filter((s) => s.saleDate === today);

    const spent = todayExp.reduce((acc, e) => acc + e.totalAmount, 0);
    const earned = todaySales.reduce((acc, s) => acc + s.totalRevenue, 0);

    return {
      message:
        `FarmPal Daily Check (${today}):\n` +
        `• Spent: ₦${spent.toLocaleString('en-NG')}\n` +
        `• Sales: ₦${earned.toLocaleString('en-NG')}\n` +
        `• Net: ₦${(earned - spent).toLocaleString('en-NG')}\n` +
        `Keep recording with FarmPal!`,
      action: 'END',
    };
  }

  return {
    message: 'Invalid choice. Dial *384*24# to try again.',
    action: 'END',
  };
}

// 5. Clean CSV Generators for Farmers and Co-op Audits
export function generateExpensesCsv(expenses: Expense[]): string {
  const headers = ['ID', 'Date', 'Category', 'Description', 'Amount (NGN)', 'Is Shared', 'Crop Allocations', 'Source'];
  const rows = expenses.map((e) => [
    e.id,
    e.expenseDate,
    `"${e.categoryName}"`,
    `"${e.description || ''}"`,
    e.totalAmount,
    e.isShared ? 'Yes' : 'No',
    `"${e.allocations.map((a) => `${a.cropName}: ₦${a.allocatedAmount}`).join('; ')}"`,
    e.source,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateSalesCsv(sales: SaleRecord[]): string {
  const headers = ['ID', 'Date', 'Crop', 'Quantity', 'Unit', 'Price Per Unit (NGN)', 'Total Revenue (NGN)', 'Amount Paid (NGN)', 'Amount Due (NGN)', 'Buyer', 'Payment Status', 'Notes'];
  const rows = sales.map((s) => [
    s.id,
    s.saleDate,
    `"${s.cropName}"`,
    s.quantitySold,
    s.unit,
    s.pricePerUnit,
    s.totalRevenue,
    s.amountPaid,
    s.amountDue,
    `"${s.buyerName || ''}"`,
    s.paymentStatus,
    `"${s.notes || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateDebtorsCsv(sales: SaleRecord[]): string {
  const debtors = sales.filter((s) => s.amountDue > 0);
  const headers = ['Sale ID', 'Sale Date', 'Buyer Name', 'Crop', 'Quantity Sold', 'Total Revenue', 'Amount Paid', 'Outstanding Balance (NGN)', 'Promise Due Date', 'Notes'];
  const rows = debtors.map((d) => [
    d.id,
    d.saleDate,
    `"${d.buyerName || 'Unknown'}"`,
    `"${d.cropName}"`,
    `${d.quantitySold} ${d.unit}`,
    d.totalRevenue,
    d.amountPaid,
    d.amountDue,
    d.dueDate || 'N/A',
    `"${d.notes || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
