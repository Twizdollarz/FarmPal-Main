import {
  CooperativeGroup,
  BulkInputPool,
  ProduceAggregationPool,
  AgriCreditScore,
  AgroWeatherReport,
  FarmInventoryItem,
  Crop,
  Expense,
  SaleRecord,
  FarmSummary,
  DebtorSummary,
} from '../src/types';

// ==================== 1. COOPERATIVE & AGGREGATION HUB ====================

export const defaultCooperative: CooperativeGroup = {
  id: 'coop-kano-veg',
  name: 'Kano Tomato & Vegetable Growers Multipurpose Cooperative',
  societyNumber: 'KNSG/COOP/2019/4821',
  zone: 'Bunkure / Kadawa Irrigation Belt, Kano State',
  totalMembers: 148,
  chairperson: 'Alhaji Bashir Sanusi',
  phone: '+234 802 991 2233',
  bankAccount: 'Jaiz Bank — 0029381920',
};

export const defaultBulkInputPools: BulkInputPool[] = [
  {
    id: 'pool-npk-wet-2026',
    inputName: 'NPK 15-15-15 Fertilizer (Golden Fertilizer 50kg)',
    category: 'Fertilizer',
    unit: 'bags',
    retailMarketPrice: 42000,
    coopBulkPrice: 33500,
    discountPercent: 20,
    targetQuantity: 500,
    pledgedQuantity: 410,
    userPledgedQuantity: 15,
    deadlineDate: '2026-09-25',
    status: 'open',
    supplierName: 'Flour Mills of Nigeria Agro-Allied Direct',
  },
  {
    id: 'pool-urea-2026',
    inputName: 'Indorama Granular Urea 46% N (50kg)',
    category: 'Fertilizer',
    unit: 'bags',
    retailMarketPrice: 39000,
    coopBulkPrice: 31000,
    discountPercent: 21,
    targetQuantity: 400,
    pledgedQuantity: 360,
    userPledgedQuantity: 10,
    deadlineDate: '2026-09-28',
    status: 'open',
    supplierName: 'Indorama Eleme Petrochemicals Depot',
  },
  {
    id: 'pool-cobra-seeds',
    inputName: 'Technisem Cobra F1 Hybrid Tomato Seed (50g tin)',
    category: 'Seeds',
    unit: 'tins',
    retailMarketPrice: 28000,
    coopBulkPrice: 23000,
    discountPercent: 18,
    targetQuantity: 150,
    pledgedQuantity: 135,
    userPledgedQuantity: 4,
    deadlineDate: '2026-10-05',
    status: 'open',
    supplierName: 'Technisem West Africa Certified Agent',
  },
  {
    id: 'pool-crates',
    inputName: 'Reinforced Heavy-Duty Plastic Harvest Crates (25kg)',
    category: 'Packaging',
    unit: 'crates',
    retailMarketPrice: 7500,
    coopBulkPrice: 5800,
    discountPercent: 23,
    targetQuantity: 800,
    pledgedQuantity: 620,
    userPledgedQuantity: 25,
    deadlineDate: '2026-10-10',
    status: 'open',
    supplierName: 'Polystar Plastics Manufacturing Kano',
  },
];

export const defaultAggregationPools: ProduceAggregationPool[] = [
  {
    id: 'agg-tomato-jos',
    cropName: 'Tomato',
    offtakerName: 'Tomato Jos Paste Factory & Processing Ltd',
    contractType: 'Processing',
    unit: 'crates',
    agreedFloorPricePerUnit: 10500,
    minimumVolumeRequired: 1200, // 30-tonne trailer
    currentAggregatedVolume: 940,
    userCommittedVolume: 60,
    deliveryHub: 'Kadawa Cooperative Collection Center Hub A',
    cutoffDate: '2026-09-22',
    status: 'collecting',
    termsNote: 'Guaranteed off-take with ₦10,500/crate floor price or market spot +5%. Payment in 48 hours direct to Jaiz Bank.',
  },
  {
    id: 'agg-mile12-express',
    cropName: 'Tomato',
    offtakerName: 'Mile 12 Perishable Traders Apex Association',
    contractType: 'Wholesale Aggregation',
    unit: 'crates',
    agreedFloorPricePerUnit: 12500,
    minimumVolumeRequired: 1500,
    currentAggregatedVolume: 1500,
    userCommittedVolume: 40,
    deliveryHub: 'Kano Dawanau Central Loading Depot',
    cutoffDate: '2026-09-18',
    status: 'full',
    termsNote: 'Direct articulated truck dispatch to Lagos Mile 12. Transit loss insurance pooled at 1.5%.',
  },
  {
    id: 'agg-cucumber-shoprite',
    cropName: 'Cucumber',
    offtakerName: 'Retail Supermarket Produce Hub (Shoprite / SPAR)',
    contractType: 'Supermarket Chain',
    unit: 'bags',
    agreedFloorPricePerUnit: 8500,
    minimumVolumeRequired: 400,
    currentAggregatedVolume: 280,
    userCommittedVolume: 35,
    deliveryHub: 'Kano Cold Chain Consolidation Center',
    cutoffDate: '2026-09-26',
    status: 'collecting',
    termsNote: 'Grade A crisp straight cucumbers only. Premium price ₦8,500 per 40kg bag with same-day electronic transfer.',
  },
];

// ==================== 2. AGRI-CREDIT SCORING & LOAN QUALIFICATION ====================

export function calculateAgriCreditScore(
  crops: Crop[],
  expenses: Expense[],
  sales: SaleRecord[],
  farmSummary: FarmSummary,
  debtorSummary: DebtorSummary | null
): AgriCreditScore {
  // Base score 400 (scale: 300 to 850)
  let score = 420;

  // 1. Profit Margin & Cash Generation (Max 150 pts)
  const margin = farmSummary.totalEarned > 0
    ? (farmSummary.netProfit / farmSummary.totalEarned) * 100
    : 0;
  let marginPts = 0;
  if (margin >= 40) marginPts = 150;
  else if (margin >= 25) marginPts = 120;
  else if (margin >= 10) marginPts = 80;
  else if (margin > 0) marginPts = 50;
  else marginPts = 20;

  // 2. Financial Discipline & Bookkeeping Quality (Max 120 pts)
  // Evaluates regularity and depth of expense & harvest records
  let bookScore = 40;
  if (expenses.length >= 10) bookScore += 40;
  if (sales.length >= 5) bookScore += 25;
  const hasMultipleCrops = crops.length >= 2;
  if (hasMultipleCrops) bookScore += 15;

  // 3. Debtor & Credit Recovery Track Record (Max 100 pts)
  let creditRecoveryScore = 70;
  if (debtorSummary) {
    if (debtorSummary.totalCreditExtended > 0) {
      const recoveryRate = debtorSummary.totalCollected / debtorSummary.totalCreditExtended;
      if (recoveryRate >= 0.8) creditRecoveryScore = 100;
      else if (recoveryRate >= 0.5) creditRecoveryScore = 75;
      else creditRecoveryScore = 40;
    } else {
      creditRecoveryScore = 85; // All cash sales
    }
  }

  // 4. Operational Scale & Asset Backing (Max 80 pts)
  const totalAcres = crops.reduce((sum, c) => sum + (c.farmSizeAcres || 1), 0);
  let scaleScore = 40;
  if (totalAcres >= 5) scaleScore = 80;
  else if (totalAcres >= 3) scaleScore = 65;
  else if (totalAcres >= 1) scaleScore = 50;

  score = Math.min(850, Math.max(300, 300 + marginPts + bookScore + creditRecoveryScore + scaleScore));

  let ratingTier: 'AAA Prime' | 'AA Strong' | 'A Good' | 'B Moderate' | 'C Developing' = 'A Good';
  let approvalProbabilityPercent = 75;
  let maxBorrowing = 1200000;

  if (score >= 780) {
    ratingTier = 'AAA Prime';
    approvalProbabilityPercent = 96;
    maxBorrowing = 3500000;
  } else if (score >= 720) {
    ratingTier = 'AA Strong';
    approvalProbabilityPercent = 88;
    maxBorrowing = 2500000;
  } else if (score >= 650) {
    ratingTier = 'A Good';
    approvalProbabilityPercent = 78;
    maxBorrowing = 1800000;
  } else if (score >= 580) {
    ratingTier = 'B Moderate';
    approvalProbabilityPercent = 60;
    maxBorrowing = 900000;
  } else {
    ratingTier = 'C Developing';
    approvalProbabilityPercent = 40;
    maxBorrowing = 400000;
  }

  const pillars = [
    {
      name: 'Cashflow Margin & Profitability',
      score: marginPts,
      maxScore: 150,
      status: (marginPts >= 120 ? 'strong' : marginPts >= 80 ? 'good' : 'needs_attention') as 'strong' | 'good' | 'needs_attention',
      note: `Operational net margin of ${margin.toFixed(1)}% shows strong crop profitability.`,
    },
    {
      name: 'Farm Ledger Documentation',
      score: bookScore,
      maxScore: 120,
      status: (bookScore >= 100 ? 'strong' : bookScore >= 70 ? 'good' : 'needs_attention') as 'strong' | 'good' | 'needs_attention',
      note: `${expenses.length} dated input entries and ${sales.length} verified sales records.`,
    },
    {
      name: 'Credit Recovery & Buyer Discipline',
      score: creditRecoveryScore,
      maxScore: 100,
      status: (creditRecoveryScore >= 80 ? 'strong' : creditRecoveryScore >= 60 ? 'good' : 'needs_attention') as 'strong' | 'good' | 'needs_attention',
      note: debtorSummary && debtorSummary.totalOutstanding > 0
        ? `₦${debtorSummary.totalOutstanding.toLocaleString('en-NG')} in active receivables with verified buyer contact histories.`
        : 'Zero uncollected customer debt.',
    },
    {
      name: 'Hectare Capacity & Crop Diversification',
      score: scaleScore,
      maxScore: 80,
      status: (scaleScore >= 65 ? 'strong' : scaleScore >= 45 ? 'good' : 'needs_attention') as 'strong' | 'good' | 'needs_attention',
      note: `${totalAcres} total cultivated acres across ${crops.length} seasonal crops.`,
    },
  ];

  const availableLoanProducts = [
    {
      id: 'loan-nirsal-input',
      institutionName: 'NIRSAL / Anchor Borrowers Scheme',
      productTitle: 'Seasonal Input & Fertilizer Credit Facility',
      maxAmount: Math.min(maxBorrowing, 1500000),
      interestRatePerAnnum: 9.0, // Subsidized single-digit rate
      tenorMonths: 6,
      moratoriumMonths: 4, // Grace period until harvest
      repaymentStructure: 'Harvest Bullet' as const,
      status: score >= 650 ? ('pre_qualified' as const) : ('eligible' as const),
      features: [
        'Single-digit concessionary interest rate (9% p.a.)',
        'Direct input voucher disbursal for certified seeds & fertilizer',
        '0% monthly debt service during vegetative growth phase',
        'Lump sum balloon settlement after harvest off-take',
      ],
    },
    {
      id: 'loan-boa-working-cap',
      institutionName: 'Bank of Agriculture (BOA)',
      productTitle: 'Smallholder Irrigation & Working Capital Loan',
      maxAmount: Math.min(maxBorrowing, 2200000),
      interestRatePerAnnum: 12.5,
      tenorMonths: 9,
      moratoriumMonths: 3,
      repaymentStructure: 'Monthly Post-Grace' as const,
      status: score >= 700 ? ('pre_qualified' as const) : ('eligible' as const),
      features: [
        'Covers fuel, drip irrigation repairs, and labour wages',
        'Cooperative group guarantee accepted in lieu of landed collateral',
        'Dedicated agricultural relationship officer assignment',
      ],
    },
    {
      id: 'loan-lapo-micro-agri',
      institutionName: 'LAPO Microfinance Agri-Desk',
      productTitle: 'Quick Season Crop Turnaround Credit',
      maxAmount: Math.min(maxBorrowing, 800000),
      interestRatePerAnnum: 18.0,
      tenorMonths: 4,
      moratoriumMonths: 2,
      repaymentStructure: 'Tranche Disbursal' as const,
      status: 'pre_qualified' as const,
      features: [
        'Instant disbursal within 48 hours to Jaiz or commercial bank',
        'Ideal for emergency harvest packaging, crates & transport haulage',
        'No physical collateral; qualified by FarmPal ledger history',
      ],
    },
  ];

  return {
    score,
    maxScore: 850,
    ratingTier,
    approvalProbabilityPercent,
    maxEligibleBorrowing: maxBorrowing,
    pillars,
    availableLoanProducts,
    creditSummary: `Based on your ${crops.length} crops and ₦${farmSummary.totalEarned.toLocaleString('en-NG')} verified revenue, your farm qualifies for ${ratingTier} status with up to ₦${maxBorrowing.toLocaleString('en-NG')} pre-qualified seasonal credit.`,
  };
}

// ==================== 3. HYPERLOCAL AGRO-WEATHER TELEMETRY ====================

export function generateAgroWeatherReport(location = 'Kano, Nigeria', activeCrops: Crop[]): AgroWeatherReport {
  const dailyForecast = [
    {
      day: 'Today',
      date: 'Sep 11',
      tempMin: 23,
      tempMax: 33,
      condition: 'Partly Cloudy & Dry',
      rainProb: 15,
      icon: 'cloud-sun' as const,
    },
    {
      day: 'Saturday',
      date: 'Sep 12',
      tempMin: 22,
      tempMax: 32,
      condition: 'Scattered Showers',
      rainProb: 45,
      icon: 'cloud-rain' as const,
    },
    {
      day: 'Sunday',
      date: 'Sep 13',
      tempMin: 21,
      tempMax: 30,
      condition: 'Thunderstorms & Heavy Rain',
      rainProb: 80,
      icon: 'cloud-lightning' as const,
    },
    {
      day: 'Monday',
      date: 'Sep 14',
      tempMin: 22,
      tempMax: 31,
      condition: 'Overcast & High Humidity',
      rainProb: 60,
      icon: 'cloud-rain' as const,
    },
    {
      day: 'Tuesday',
      date: 'Sep 15',
      tempMin: 24,
      tempMax: 34,
      condition: 'Sunny & Breezy',
      rainProb: 20,
      icon: 'sun' as const,
    },
  ];

  const hasTomato = activeCrops.some((c) => c.name.toLowerCase().includes('tomato'));
  const hasCucumber = activeCrops.some((c) => c.name.toLowerCase().includes('cucumber'));

  const cropThreatAlerts = [
    {
      id: 'threat-blight',
      cropName: 'Tomato',
      threatType: 'Early & Late Blight (Fungal)',
      severity: 'high' as const,
      description: 'Sunday’s forecasted heavy thunderstorms (80% probability) combined with 78% relative humidity create high risk of Phytophthora / Alternaria fungal spore spread.',
      preventativeAction: 'Apply preventive contact fungicide (Mancozeb or Copper Oxychloride) before Saturday afternoon. Ensure farm drainage ditches are cleared to prevent waterlogging.',
    },
    {
      id: 'threat-mildew',
      cropName: 'Cucumber',
      threatType: 'Downy Mildew Risk',
      severity: 'medium' as const,
      description: 'Overcast skies and sustained moisture on cucumber canopy Sunday and Monday elevate downy mildew probability.',
      preventativeAction: 'Ensure trellis staking is taut to maximize air circulation. Avoid overhead sprinkler irrigation; irrigate strictly at the furrow root zone.',
    },
    {
      id: 'threat-leaching',
      cropName: 'All Active Crops',
      threatType: 'Fertilizer Nutrient Leaching',
      severity: 'medium' as const,
      description: 'Heavy precipitation Sunday may wash away surface-applied Urea or NPK granules.',
      preventativeAction: 'Postpone any planned top-dressing broadcast until Tuesday morning when dry weather returns.',
    },
  ];

  return {
    location,
    temperatureC: 32,
    condition: 'Warm & Partly Cloudy',
    rainfallProbability: 15,
    humidityPercent: 62,
    windSpeedKmh: 14,
    solarRadiation: 'Moderate (7.2 kWh/m²)',
    dailyForecast,
    spraySuitability: 'Optimal' as const,
    sprayAdvisory: 'Optimal spraying window today through Saturday 11:00 AM. Winds are calm (14 km/h) and rain probability is low. Do not spray Sunday due to incoming heavy storms.',
    irrigationRecommendation: 'Normal furrow irrigation today. Reduce or pause irrigation Sunday through Monday as soil saturation will be met by natural precipitation.',
    cropThreatAlerts,
  };
}

// ==================== 4. FARM STORE INVENTORY ====================

export const defaultInventoryItems: FarmInventoryItem[] = [
  {
    id: 'inv-npk',
    userId: 'farmer-1',
    name: 'NPK 15-15-15 Fertilizer (Golden Fertilizer)',
    category: 'Fertilizer',
    currentQuantity: 8,
    unit: 'bags (50kg)',
    reorderThreshold: 5,
    estimatedUnitValue: 38000,
    storageLocation: 'Main Farm Storehouse (Dry Bay 1)',
    lastRestocked: '2026-08-15',
    status: 'sufficient',
  },
  {
    id: 'inv-urea',
    userId: 'farmer-1',
    name: 'Indorama Granular Urea 46%',
    category: 'Fertilizer',
    currentQuantity: 3,
    unit: 'bags (50kg)',
    reorderThreshold: 4,
    estimatedUnitValue: 36000,
    storageLocation: 'Main Farm Storehouse (Dry Bay 1)',
    lastRestocked: '2026-08-10',
    status: 'low_stock',
  },
  {
    id: 'inv-fungicide-mancozeb',
    userId: 'farmer-1',
    name: 'Mancozeb 80% WP Fungicide',
    category: 'Chemicals',
    currentQuantity: 6,
    unit: 'kg packs',
    reorderThreshold: 3,
    estimatedUnitValue: 6500,
    storageLocation: 'Secure Chemical Locker',
    lastRestocked: '2026-08-20',
    status: 'sufficient',
  },
  {
    id: 'inv-insecticide-ampligo',
    userId: 'farmer-1',
    name: 'Ampligo 150 ZC Insecticide (Tuta Absoluta control)',
    category: 'Chemicals',
    currentQuantity: 1,
    unit: 'litres',
    reorderThreshold: 2,
    estimatedUnitValue: 24000,
    storageLocation: 'Secure Chemical Locker',
    lastRestocked: '2026-07-28',
    status: 'low_stock',
  },
  {
    id: 'inv-diesel-fuel',
    userId: 'farmer-1',
    name: 'Pumping Machine Diesel Fuel',
    category: 'Fuel',
    currentQuantity: 45,
    unit: 'litres',
    reorderThreshold: 20,
    estimatedUnitValue: 1250,
    storageLocation: 'Fuel Shed (Ventilated Drums)',
    lastRestocked: '2026-09-02',
    status: 'sufficient',
  },
  {
    id: 'inv-crates',
    userId: 'farmer-1',
    name: 'Standard Plastic Harvest Crates',
    category: 'Packaging',
    currentQuantity: 42,
    unit: 'crates',
    reorderThreshold: 30,
    estimatedUnitValue: 6500,
    storageLocation: 'Shaded Equipment Carport',
    lastRestocked: '2026-06-15',
    status: 'sufficient',
  },
];
