export type Language = 'en' | 'ig' | 'yo' | 'ha';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  location: string;
  preferredLanguage: Language;
  theme?: ThemeMode;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "19:00"
  reminderChannel?: 'whatsapp' | 'in_app' | 'both';
  tier: 'free' | 'pro' | 'institutional';
  role?: 'admin' | 'farmer' | 'extension_worker';
  isAdmin?: boolean;
  createdAt: string;
}

export interface DailyReminder {
  id: string;
  theme: string;
  headline: string;
  message: string;
  greeting: string;
  time: string;
  timestamp: string;
  quickReplies: string[];
  farmerName: string;
  cropsMentioned: string[];
  source: 'ai' | 'curated_pool';
}

export type CropStatus = 'active' | 'finished';

export interface Crop {
  id: string;
  userId: string;
  name: string;
  variety?: string;
  plantingDate: string; // ISO date string YYYY-MM-DD
  farmSizeAcres: number;
  status: CropStatus;
  finishedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface ExpenseAllocation {
  cropId: string;
  cropName: string;
  percentage: number; // e.g. 60.0
  allocatedAmount: number; // e.g. 18000
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  expenseDate: string; // YYYY-MM-DD
  description?: string;
  isShared: boolean;
  allocations: ExpenseAllocation[];
  source: 'whatsapp' | 'web';
  createdAt: string;
}

export interface LabourRecord {
  id: string;
  userId: string;
  cropId: string;
  cropName: string;
  labourDate: string; // YYYY-MM-DD
  workType: string; // e.g. "Weeding", "Land clearing", "Spraying"
  workerCount: number;
  amountPaid: number;
  description?: string;
  linkedExpenseId?: string;
  createdAt: string;
}

export interface HarvestRecord {
  id: string;
  userId: string;
  cropId: string;
  cropName: string;
  harvestDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string; // "crates", "bags", "kg", "tonnes", "baskets", "pieces"
  qualityGrade?: string; // "Grade A", "Standard", "Rejects"
  notes?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  userId: string;
  cropId: string;
  cropName: string;
  saleDate: string; // YYYY-MM-DD
  quantitySold: number;
  unit: string;
  pricePerUnit: number;
  totalRevenue: number;
  buyerName?: string;
  paymentStatus: 'paid' | 'credit' | 'partial';
  amountPaid: number; // Cash actually received
  amountDue: number; // Remaining balance owed by buyer
  dueDate?: string; // Promise date
  notes?: string;
  createdAt: string;
}

export interface DebtorPaymentRecord {
  id: string;
  saleId: string;
  paymentDate: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface CropComparison {
  cropId: string;
  cropName: string;
  status: CropStatus;
  farmSizeAcres: number;
  totalSpent: number;
  totalEarned: number;
  netProfit: number;
  profitMarginPercent: number;
  roiPercent: number; // (netProfit / totalSpent) * 100
  costPerAcre: number;
  revenuePerAcre: number;
  profitPerAcre: number;
  weightedAvgSellingPrice: number;
  primaryUnit: string;
}

export interface DebtorRecord {
  buyerName: string;
  totalCreditSales: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  unpaidSalesCount: number;
  sales: SaleRecord[];
  latestSaleDate: string;
}

export interface DebtorSummary {
  totalCreditExtended: number;
  totalCollected: number;
  totalOutstanding: number;
  debtors: DebtorRecord[];
}

export interface CashflowMonth {
  month: string; // "Jan 2026"
  spent: number;
  earned: number;
  net: number;
}

export interface FarmFinancialHealth {
  healthScore: number; // 0-100
  healthRating: 'Excellent' | 'Strong' | 'Moderate' | 'Vulnerable';
  operatingMarginPercent: number;
  outstandingCreditRatio: number; // outstanding credit / total earned
  debtCollectionRate: number; // collected / total credit extended
  repaymentReadiness: string;
  keyRecommendations: string[];
}

export interface CategoryExpenseBreakdown {
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface CropFinancials {
  cropId: string;
  cropName: string;
  plantingDate: string;
  farmSizeAcres: number;
  status: CropStatus;
  totalSpent: number;
  totalEarned: number;
  netProfit: number;
  profitMarginPercent: number;
  totalHarvestedQuantity: number;
  totalSoldQuantity: number;
  primaryUnit: string;
  weightedAvgSellingPrice: number;
  costPerUnit: number;
  breakEvenPrice: number;
  expenseDistribution: CategoryExpenseBreakdown[];
  insights: string[];
}

export interface FarmSummary {
  totalSpent: number;
  totalEarned: number;
  netProfit: number;
  activeCropsCount: number;
  finishedCropsCount: number;
  primaryInsights: string[];
}

export interface WhatsAppMessage {
  id: string;
  sender: 'farmer' | 'farmpal';
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  audioDuration?: string;
  quickReplies?: string[];
  isReminder?: boolean;
  reminderId?: string;
  pendingAction?: {
    type: 'confirm_expenses' | 'confirm_sale' | 'confirm_harvest' | 'confirm_duplicate' | 'disambiguate_crop' | 'split_expense' | 'confirm_debt_payment';
    data: any;
  };
}

// ======================== PHASE 3 TYPES ========================

export interface CategoryBudget {
  categoryName: string;
  allocatedBudget: number;
  spentAmount: number;
  remainingAmount: number;
  burnPercent: number;
  status: 'healthy' | 'warning' | 'exceeded';
}

export interface CropBudget {
  cropId: string;
  cropName: string;
  farmSizeAcres: number;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  overallBurnPercent: number;
  targetYieldQuantity: number;
  targetYieldUnit: string;
  targetSellingPricePerUnit: number;
  projectedRevenue: number;
  projectedNetProfit: number;
  categoryBudgets: CategoryBudget[];
  status: 'under' | 'near_limit' | 'exceeded';
}

export interface WeeklyPricePoint {
  weekKey: string; // e.g. "2026-W37", "2026-W36", "2026-W35", "2026-W34"
  weekLabel: string; // e.g. "Week 4 (Current)", "Week 3", "Week 2", "Week 1"
  dateRange: string; // e.g. "Sep 07 - Sep 13"
  wholesaleMin: number;
  wholesaleMax: number;
  wholesaleAvg: number;
  changeVsPriorWeekPercent: number;
}

export interface MarketPriceBenchmark {
  id: string;
  cropName: string;
  variety?: string;
  unit: string;
  marketName: string;
  state: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Middle Belt';
  wholesaleMin: number;
  wholesaleMax: number;
  wholesaleAvg: number;
  trend: 'rising' | 'falling' | 'stable';
  changePercent7d: number;
  lastUpdated: string;
  source?: string;
  sourceUrl?: string;
  packageType?: string; // e.g. "Standard Crate (25-30kg)", "100kg Jute Bag", "50kg Raffia Basket"
  haulageRateFromNorth?: number; // Estimated freight per unit to this market
  farmerRealizedAvgPrice?: number;
  priceGapVsFarmer?: number; // Realized - Market Avg
  priceGapPercent?: number;
  status?: 'premium' | 'fair' | 'underpriced' | 'no_sales';
  weeklyPrices?: WeeklyPricePoint[];
}

export interface MarketAdvisoryInsight {
  cropName: string;
  headline: string;
  recommendation: string;
  bestMarket: string;
  highestPrice: number;
  unit: string;
  urgency: 'high' | 'medium' | 'info';
  source?: string;
  sourceUrl?: string;
}

export interface VerifiedMarketSource {
  id: string;
  name: string;
  url: string;
  cadence: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  coverage: string;
  focusCommodities: string[];
  description: string;
  verifiedMethod: string;
  isOfficialExchange?: boolean;
}

export interface GrowthStageMilestone {
  id: string;
  cropId: string;
  cropName: string;
  stageName: string;
  startDay: number;
  endDay: number;
  isCurrent: boolean;
  isCompleted: boolean;
  progressPercent: number;
  advisoryNotes: string;
  keyAction: string;
}

export interface CropCalendarSchedule {
  cropId: string;
  cropName: string;
  variety?: string;
  plantingDate: string;
  daysAfterPlanting: number;
  totalDaysToMaturity: number;
  overallProgressPercent: number;
  estimatedHarvestDate: string;
  currentStage: GrowthStageMilestone;
  stages: GrowthStageMilestone[];
  upcomingTasks: AgronomicTask[];
}

export interface AgronomicTask {
  id: string;
  userId?: string;
  cropId: string;
  cropName: string;
  title: string;
  category: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface UssdSessionRequest {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  text: string;
}

export interface UssdSessionResponse {
  message: string;
  action: 'CON' | 'END';
}

// ======================== PHASE 4 TYPES ========================

export interface CooperativeGroup {
  id: string;
  name: string;
  description?: string;
  societyNumber: string;
  zone: string;
  totalMembers: number;
  chairperson: string;
  phone: string;
  bankAccount: string;
  creatorId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CooperativeMember {
  id: string;
  cooperativeId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string;
  updatedAt?: string;
}

export interface BulkInputPool {
  id: string;
  cooperativeId?: string;
  creatorId?: string;
  inputName: string;
  category: 'Fertilizer' | 'Seeds' | 'Chemicals' | 'Equipment' | 'Packaging';
  unit: string;
  retailMarketPrice: number;
  coopBulkPrice: number;
  discountPercent: number;
  targetQuantity: number;
  pledgedQuantity: number;
  userPledgedQuantity: number;
  deadlineDate: string;
  status: 'open' | 'locked' | 'ordered' | 'delivered';
  supplierName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulkInputContribution {
  id: string;
  poolId: string;
  cooperativeId: string;
  userId: string;
  quantity: number;
  status: 'pledged' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface ProduceAggregationPool {
  id: string;
  cooperativeId?: string;
  creatorId?: string;
  cropName: string;
  offtakerName: string;
  contractType: 'Processing' | 'Supermarket Chain' | 'Wholesale Aggregation' | 'Export';
  unit: string;
  agreedFloorPricePerUnit: number;
  minimumVolumeRequired: number;
  currentAggregatedVolume: number;
  userCommittedVolume: number;
  deliveryHub: string;
  cutoffDate: string;
  status: 'collecting' | 'full' | 'in_transit' | 'settled';
  termsNote: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProducePledge {
  id: string;
  poolId: string;
  cooperativeId: string;
  userId: string;
  cropName: string;
  pledgedVolume: number;
  unit: string;
  status: 'committed' | 'delivered' | 'settled' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface AgriCreditPillar {
  name: string;
  score: number;
  maxScore: number;
  status: 'strong' | 'good' | 'needs_attention';
  note: string;
}

export interface AgriLoanProduct {
  id: string;
  institutionName: string;
  productTitle: string;
  maxAmount: number;
  interestRatePerAnnum: number;
  tenorMonths: number;
  moratoriumMonths: number;
  repaymentStructure: 'Harvest Bullet' | 'Monthly Post-Grace' | 'Tranche Disbursal';
  status: 'pre_qualified' | 'eligible' | 'requires_records';
  features: string[];
}

export interface AgriCreditScore {
  score: number;
  maxScore: number;
  ratingTier: 'AAA Prime' | 'AA Strong' | 'A Good' | 'B Moderate' | 'C Developing';
  approvalProbabilityPercent: number;
  maxEligibleBorrowing: number;
  pillars: AgriCreditPillar[];
  availableLoanProducts: AgriLoanProduct[];
  creditSummary: string;
}

export interface DailyWeatherOutlook {
  day: string;
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  rainProb: number;
  icon: 'sun' | 'cloud-rain' | 'cloud-sun' | 'cloud-lightning' | 'wind';
}

export interface CropThreatAlert {
  id: string;
  cropName: string;
  threatType: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  preventativeAction: string;
}

export interface AgroWeatherReport {
  location: string;
  temperatureC: number;
  condition: string;
  rainfallProbability: number;
  humidityPercent: number;
  windSpeedKmh: number;
  solarRadiation: string;
  dailyForecast: DailyWeatherOutlook[];
  spraySuitability: 'Optimal' | 'Caution' | 'Unsuitable';
  sprayAdvisory: string;
  irrigationRecommendation: string;
  cropThreatAlerts: CropThreatAlert[];
}

export interface FarmInventoryItem {
  id: string;
  userId?: string;
  name: string;
  category: 'Fertilizer' | 'Chemicals' | 'Seeds' | 'Packaging' | 'Fuel' | 'Tools';
  currentQuantity: number;
  unit: string;
  reorderThreshold: number;
  estimatedUnitValue: number;
  storageLocation: string;
  lastRestocked: string;
  status: 'sufficient' | 'low_stock' | 'out_of_stock';
}

export interface FarmerFeedback {
  id: string;
  userId?: string;
  farmerName: string;
  phoneOrEmail?: string;
  farmLocation: string;
  primaryCrops?: string;
  rating: number; // 1 to 5 stars
  testedFeatures: string[]; // e.g. ['whatsapp', 'ussd', 'planning', 'market', 'cooperative', 'credit', 'weather', 'general']
  easeOfUseRating: 'very_easy' | 'easy' | 'moderate' | 'difficult';
  clarityOfLanguage: 'clear' | 'needs_pidgin_hausa' | 'too_technical';
  nairaAndUnitsMatch: 'yes' | 'partially' | 'no';
  whatWorkedWell: string;
  whatWasConfusing: string;
  desiredNextFeature: string;
  deviceType?: 'Android Phone' | 'iPhone' | 'Feature Phone (USSD)' | 'Tablet' | 'Computer';
  audioNoteTranscript?: string;
  status?: 'new' | 'reviewed' | 'addressed';
  message?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackSummary {
  totalCount: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  topTestedFeatures: { feature: string; count: number }[];
  easeOfUseBreakdown: Record<string, number>;
}

export interface AdminSystemStats {
  totalFarmers: number;
  totalAcres: number;
  totalExpensesAmount: number;
  totalSalesAmount: number;
  totalDebtorsAmount: number;
  activeCropsCount: number;
  totalTasksCount: number;
  totalInventoryItems: number;
  webhookMessagesCount: number;
  feedbacksCount: number;
  lastUpdated: string;
}

export interface AdminBroadcastMessage {
  id: string;
  title: string;
  message: string;
  category: 'market_alert' | 'advisory' | 'system_notice' | 'subsidy';
  targetAudience: 'all' | 'north' | 'south' | 'west' | 'specific_crop';
  targetCrop?: string;
  senderName: string;
  createdAt: string;
  sentCount: number;
}


