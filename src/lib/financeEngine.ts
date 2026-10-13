import {
  Crop,
  Expense,
  HarvestRecord,
  SaleRecord,
  CropFinancials,
  FarmSummary,
  CategoryExpenseBreakdown,
  CropComparison,
  DebtorSummary,
  DebtorRecord,
  CashflowMonth,
  FarmFinancialHealth,
} from '../types';
import { formatNaira } from './i18n';

export function calculateCropFinancials(
  crop: Crop,
  expenses: Expense[],
  harvests: HarvestRecord[],
  sales: SaleRecord[]
): CropFinancials {
  // 1. Calculate expenses for this crop
  let totalSpent = 0;
  const categoryMap = new Map<string, number>();

  for (const exp of expenses) {
    if (exp.isShared) {
      const match = exp.allocations.find((a) => a.cropId === crop.id);
      if (match) {
        totalSpent += match.allocatedAmount;
        const prev = categoryMap.get(exp.categoryName) || 0;
        categoryMap.set(exp.categoryName, prev + match.allocatedAmount);
      }
    } else {
      // Single crop expense
      const match = exp.allocations.find((a) => a.cropId === crop.id);
      if (match) {
        totalSpent += match.allocatedAmount;
        const prev = categoryMap.get(exp.categoryName) || 0;
        categoryMap.set(exp.categoryName, prev + match.allocatedAmount);
      }
    }
  }

  // Category distribution
  const expenseDistribution: CategoryExpenseBreakdown[] = [];
  for (const [categoryName, amount] of categoryMap.entries()) {
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 1000) / 10 : 0;
    expenseDistribution.push({
      categoryName,
      amount,
      percentage,
    });
  }
  // Sort descending by amount
  expenseDistribution.sort((a, b) => b.amount - a.amount);

  // 2. Calculate sales and weighted average price
  const cropSales = sales.filter((s) => s.cropId === crop.id);
  const totalEarned = cropSales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalSoldQuantity = cropSales.reduce((acc, s) => acc + s.quantitySold, 0);

  const weightedAvgSellingPrice =
    totalSoldQuantity > 0 ? Math.round((totalEarned / totalSoldQuantity) * 100) / 100 : 0;

  // 3. Harvest metrics
  const cropHarvests = harvests.filter((h) => h.cropId === crop.id);
  const totalHarvestedQuantity = cropHarvests.reduce((acc, h) => acc + h.quantity, 0);

  // Determine primary unit
  const primaryUnit =
    cropSales[0]?.unit || cropHarvests[0]?.unit || (crop.name.toLowerCase().includes('tomato') ? 'crates' : 'bags');

  // 4. Profit & Margins
  const netProfit = totalEarned - totalSpent;
  const profitMarginPercent =
    totalEarned > 0 ? Math.round((netProfit / totalEarned) * 1000) / 10 : 0;

  // 5. Cost per unit & Break-even price
  const baseQuantity = totalHarvestedQuantity > 0 ? totalHarvestedQuantity : totalSoldQuantity;
  const costPerUnit = baseQuantity > 0 ? Math.round((totalSpent / baseQuantity) * 100) / 100 : 0;
  const breakEvenPrice = baseQuantity > 0 ? Math.round((totalSpent / baseQuantity) * 100) / 100 : 0;

  // 6. Grounded deterministic Smart Insights
  const insights: string[] = [];

  if (totalSpent > 0) {
    if (expenseDistribution.length > 0) {
      const topExpense = expenseDistribution[0];
      insights.push(`${topExpense.categoryName} is currently your biggest expense (${formatNaira(topExpense.amount)} or ${topExpense.percentage}% of total costs).`);
    }
  }

  if (totalEarned > 0) {
    insights.push(`You have earned ${formatNaira(totalEarned)} from ${crop.name} sales so far.`);
    if (netProfit > 0) {
      insights.push(`Your current profit is ${formatNaira(netProfit)} with a ${profitMarginPercent}% profit margin.`);
    } else if (netProfit < 0) {
      const remainingToCover = totalSpent - totalEarned;
      insights.push(`You need approximately ${formatNaira(remainingToCover)} more sales to cover your recorded costs.`);
    }
  }

  if (cropSales.length > 1) {
    // Check price trend between last two sales
    const sortedSales = [...cropSales].sort(
      (a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()
    );
    const lastSale = sortedSales[sortedSales.length - 1];
    const prevSale = sortedSales[sortedSales.length - 2];
    if (lastSale.pricePerUnit > prevSale.pricePerUnit) {
      insights.push(`You sold at a higher price in your latest sale (${formatNaira(lastSale.pricePerUnit)} vs ${formatNaira(prevSale.pricePerUnit)}/${lastSale.unit}).`);
    } else if (lastSale.pricePerUnit < prevSale.pricePerUnit) {
      insights.push(`Your latest sale price was lower (${formatNaira(lastSale.pricePerUnit)} vs ${formatNaira(prevSale.pricePerUnit)}/${lastSale.unit}).`);
    }
  }

  if (totalSoldQuantity > 0 && weightedAvgSellingPrice > 0) {
    insights.push(`Your weighted average selling price is ${formatNaira(weightedAvgSellingPrice)} per ${primaryUnit}.`);
  }

  if (totalHarvestedQuantity > 0 && totalSoldQuantity > 0 && totalHarvestedQuantity >= totalSoldQuantity) {
    const remainingStock = totalHarvestedQuantity - totalSoldQuantity;
    if (remainingStock > 0) {
      insights.push(`You have harvested ${totalHarvestedQuantity} ${primaryUnit} and sold ${totalSoldQuantity}. Balance in storage/transit: ${remainingStock} ${primaryUnit}.`);
    }
  }

  return {
    cropId: crop.id,
    cropName: crop.name,
    plantingDate: crop.plantingDate,
    farmSizeAcres: crop.farmSizeAcres,
    status: crop.status,
    totalSpent,
    totalEarned,
    netProfit,
    profitMarginPercent,
    totalHarvestedQuantity,
    totalSoldQuantity,
    primaryUnit,
    weightedAvgSellingPrice,
    costPerUnit,
    breakEvenPrice,
    expenseDistribution,
    insights,
  };
}

export function calculateFarmSummary(
  crops: Crop[],
  expenses: Expense[],
  sales: SaleRecord[]
): FarmSummary {
  // Farm-wide total spent reconciles original expenses to avoid duplicating shared expenses
  const totalSpent = expenses.reduce((acc, exp) => acc + exp.totalAmount, 0);
  const totalEarned = sales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const netProfit = totalEarned - totalSpent;

  const activeCrops = crops.filter((c) => c.status === 'active');
  const finishedCrops = crops.filter((c) => c.status === 'finished');

  const primaryInsights: string[] = [];

  if (activeCrops.length > 0) {
    primaryInsights.push(`You have ${activeCrops.length} active crop${activeCrops.length > 1 ? 's' : ''} currently growing.`);
  }

  if (totalSpent > 0 && totalEarned > 0) {
    if (netProfit > 0) {
      primaryInsights.push(`Your overall farm is profitable by ${formatNaira(netProfit)}.`);
    } else {
      primaryInsights.push(`Farm expenses are currently ${formatNaira(totalSpent)} against ${formatNaira(totalEarned)} earned.`);
    }
  }

  return {
    totalSpent,
    totalEarned,
    netProfit,
    activeCropsCount: activeCrops.length,
    finishedCropsCount: finishedCrops.length,
    primaryInsights,
  };
}

// 1. Crop Performance Benchmarking & Comparison
export function calculateCropComparisons(
  crops: Crop[],
  cropFinancials: Record<string, CropFinancials>
): CropComparison[] {
  return crops.map((crop) => {
    const fin = cropFinancials[crop.id] || {
      totalSpent: 0,
      totalEarned: 0,
      netProfit: 0,
      profitMarginPercent: 0,
      weightedAvgSellingPrice: 0,
      primaryUnit: 'crates',
    };

    const acres = crop.farmSizeAcres > 0 ? crop.farmSizeAcres : 1;
    const roiPercent =
      fin.totalSpent > 0 ? Math.round((fin.netProfit / fin.totalSpent) * 1000) / 10 : 0;
    const costPerAcre = Math.round(fin.totalSpent / acres);
    const revenuePerAcre = Math.round(fin.totalEarned / acres);
    const profitPerAcre = Math.round(fin.netProfit / acres);

    return {
      cropId: crop.id,
      cropName: crop.name,
      status: crop.status,
      farmSizeAcres: crop.farmSizeAcres,
      totalSpent: fin.totalSpent,
      totalEarned: fin.totalEarned,
      netProfit: fin.netProfit,
      profitMarginPercent: fin.profitMarginPercent,
      roiPercent,
      costPerAcre,
      revenuePerAcre,
      profitPerAcre,
      weightedAvgSellingPrice: fin.weightedAvgSellingPrice,
      primaryUnit: fin.primaryUnit,
    };
  });
}

// 2. Sales Credit & Debtors Tracker ("Who owes the farmer?")
export function calculateDebtorSummary(sales: SaleRecord[]): DebtorSummary {
  const buyerMap = new Map<string, SaleRecord[]>();

  for (const s of sales) {
    if (s.paymentStatus === 'credit' || s.paymentStatus === 'partial' || (s.amountDue && s.amountDue > 0)) {
      const buyer = s.buyerName?.trim() || 'Unknown Buyer';
      const existing = buyerMap.get(buyer) || [];
      existing.push(s);
      buyerMap.set(buyer, existing);
    }
  }

  const debtors: DebtorRecord[] = [];
  let totalCreditExtended = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;

  for (const [buyerName, buyerSales] of buyerMap.entries()) {
    let creditSalesTotal = 0;
    let paidTotal = 0;
    let dueTotal = 0;

    for (const s of buyerSales) {
      creditSalesTotal += s.totalRevenue;
      const paid = s.amountPaid !== undefined ? s.amountPaid : (s.paymentStatus === 'paid' ? s.totalRevenue : 0);
      const due = s.amountDue !== undefined ? s.amountDue : (s.paymentStatus === 'paid' ? 0 : s.totalRevenue);
      paidTotal += paid;
      dueTotal += due;
    }

    totalCreditExtended += creditSalesTotal;
    totalCollected += paidTotal;
    totalOutstanding += dueTotal;

    const latestDate = buyerSales
      .map((s) => s.saleDate)
      .sort()
      .reverse()[0] || '';

    debtors.push({
      buyerName,
      totalCreditSales: creditSalesTotal,
      totalAmountPaid: paidTotal,
      totalOutstanding: dueTotal,
      unpaidSalesCount: buyerSales.length,
      sales: buyerSales,
      latestSaleDate: latestDate,
    });
  }

  // Sort debtors by highest outstanding balance
  debtors.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  return {
    totalCreditExtended,
    totalCollected,
    totalOutstanding,
    debtors,
  };
}

// 3. Cashflow Timeline Aggregation (Monthly)
export function calculateCashflowTimeline(
  expenses: Expense[],
  sales: SaleRecord[]
): CashflowMonth[] {
  const monthsMap = new Map<string, { spent: number; earned: number }>();

  // Helper for "YYYY-MM" -> "Month YYYY"
  const formatMonthKey = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.slice(0, 7);
      return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr.slice(0, 7);
    }
  };

  for (const exp of expenses) {
    const key = formatMonthKey(exp.expenseDate);
    const curr = monthsMap.get(key) || { spent: 0, earned: 0 };
    curr.spent += exp.totalAmount;
    monthsMap.set(key, curr);
  }

  for (const s of sales) {
    const key = formatMonthKey(s.saleDate);
    const curr = monthsMap.get(key) || { spent: 0, earned: 0 };
    curr.earned += s.totalRevenue;
    monthsMap.set(key, curr);
  }

  const result: CashflowMonth[] = [];
  for (const [month, data] of monthsMap.entries()) {
    result.push({
      month,
      spent: data.spent,
      earned: data.earned,
      net: data.earned - data.spent,
    });
  }

  return result;
}

// 4. Farm Financial Health & Creditworthiness Assessment
export function calculateFarmFinancialHealth(
  farmSummary: FarmSummary,
  debtorSummary: DebtorSummary,
  cropComparisons: CropComparison[]
): FarmFinancialHealth {
  let score = 50; // Base score

  // 1. Profitability factor (+/- up to 30 points)
  const margin = farmSummary.totalEarned > 0
    ? (farmSummary.netProfit / farmSummary.totalEarned) * 100
    : 0;

  if (margin > 40) score += 30;
  else if (margin > 20) score += 20;
  else if (margin > 0) score += 10;
  else score -= 15;

  // 2. Diversification factor (multiple active crops, up to +10 points)
  if (farmSummary.activeCropsCount >= 3) score += 10;
  else if (farmSummary.activeCropsCount >= 2) score += 6;

  // 3. Outstanding Debt / Receivables Risk factor
  const creditRatio = farmSummary.totalEarned > 0
    ? debtorSummary.totalOutstanding / farmSummary.totalEarned
    : 0;

  if (creditRatio > 0.4) score -= 15; // too much money tied up in uncollected debtor debt
  else if (creditRatio > 0.2) score -= 5;
  else score += 10;

  // Bound score between 10 and 98
  score = Math.max(10, Math.min(98, Math.round(score)));

  let rating: 'Excellent' | 'Strong' | 'Moderate' | 'Vulnerable' = 'Moderate';
  if (score >= 80) rating = 'Excellent';
  else if (score >= 65) rating = 'Strong';
  else if (score >= 45) rating = 'Moderate';
  else rating = 'Vulnerable';

  const debtCollectionRate = debtorSummary.totalCreditExtended > 0
    ? Math.round((debtorSummary.totalCollected / debtorSummary.totalCreditExtended) * 100)
    : 100;

  const recommendations: string[] = [];
  if (debtorSummary.totalOutstanding > 50000) {
    recommendations.push(`Collect outstanding ₦${debtorSummary.totalOutstanding.toLocaleString('en-NG')} from buyers before expanding input expenses.`);
  }

  const highestRoiCrop = [...cropComparisons].sort((a, b) => b.roiPercent - a.roiPercent)[0];
  if (highestRoiCrop && highestRoiCrop.roiPercent > 0) {
    recommendations.push(`${highestRoiCrop.cropName} is your most lucrative crop with ${highestRoiCrop.roiPercent}% ROI.`);
  }

  recommendations.push('Maintain strict dated expense tracking to support seasonal loan applications.');

  return {
    healthScore: score,
    healthRating: rating,
    operatingMarginPercent: Math.round(margin * 10) / 10,
    outstandingCreditRatio: Math.round(creditRatio * 100) / 100,
    debtCollectionRate,
    repaymentReadiness: score >= 65 ? 'Prime Candidate for Agri-Credit' : 'Moderate Repayment Risk',
    keyRecommendations: recommendations,
  };
}
