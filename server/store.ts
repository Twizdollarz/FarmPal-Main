import {
  Crop,
  Expense,
  ExpenseCategory,
  FarmerProfile,
  HarvestRecord,
  LabourRecord,
  SaleRecord,
  AgronomicTask,
  CooperativeGroup,
  CooperativeMember,
  BulkInputPool,
  BulkInputContribution,
  ProduceAggregationPool,
  ProducePledge,
  FarmInventoryItem,
  FarmerFeedback,
  DebtorPaymentRecord,
  AdminBroadcastMessage,
} from '../src/types';
import {
  defaultBudgetConfigs,
  defaultAgronomicTasks,
  RawCropBudgetConfig,
} from './planningEngine';
import {
  defaultCooperative,
  defaultBulkInputPools,
  defaultAggregationPools,
  defaultInventoryItems,
} from './phase4Engine';

export const defaultCategories: ExpenseCategory[] = [
  { id: 'cat-seeds', name: 'Seeds', isDefault: true },
  { id: 'cat-seedlings', name: 'Seedlings', isDefault: true },
  { id: 'cat-land', name: 'Land', isDefault: true },
  { id: 'cat-labour', name: 'Labour', isDefault: true },
  { id: 'cat-fertilizer', name: 'Fertilizer', isDefault: true },
  { id: 'cat-chemicals', name: 'Chemicals', isDefault: true },
  { id: 'cat-irrigation', name: 'Irrigation', isDefault: true },
  { id: 'cat-fuel', name: 'Fuel', isDefault: true },
  { id: 'cat-transport', name: 'Transport', isDefault: true },
  { id: 'cat-machinery', name: 'Machinery/equipment', isDefault: true },
  { id: 'cat-packaging', name: 'Packaging', isDefault: true },
  { id: 'cat-harvesting', name: 'Harvesting', isDefault: true },
  { id: 'cat-other', name: 'Other', isDefault: true },
];

let _sqlModulePromise: Promise<{ sqlDb: any; schema: any; drizzle: any }> | null = null;
export async function getSqlModule() {
  if (!_sqlModulePromise) {
    _sqlModulePromise = Promise.all([
      import('../src/db/index.ts'),
      import('../src/db/schema.ts'),
      import('drizzle-orm'),
    ]).then(([idx, sch, drz]) => ({
      sqlDb: idx.db,
      schema: sch,
      drizzle: drz,
    }));
  }
  return _sqlModulePromise;
}

export class FarmPalDatabase {
  profile: FarmerProfile;
  profiles: Record<string, FarmerProfile>;
  crops: Crop[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  labourRecords: LabourRecord[];
  harvests: HarvestRecord[];
  sales: SaleRecord[];
  budgetConfigs: Record<string, RawCropBudgetConfig>;
  tasks: AgronomicTask[];
  cooperatives: CooperativeGroup[];
  cooperativeMembers: CooperativeMember[];
  bulkInputPools: BulkInputPool[];
  bulkInputContributions: BulkInputContribution[];
  aggregationPools: ProduceAggregationPool[];
  producePledges: ProducePledge[];
  inventoryItems: FarmInventoryItem[];
  feedbacks: FarmerFeedback[];
  debtorPayments: DebtorPaymentRecord[];
  broadcasts: AdminBroadcastMessage[];

  get cooperative(): CooperativeGroup {
    return this.cooperatives[0] || defaultCooperative;
  }

  set cooperative(coop: CooperativeGroup) {
    if (this.cooperatives.length > 0) {
      this.cooperatives[0] = coop;
    } else {
      this.cooperatives.push(coop);
    }
  }

  constructor() {
    this.profiles = {};
    this.debtorPayments = [];
    this.budgetConfigs = JSON.parse(JSON.stringify(defaultBudgetConfigs));
    this.tasks = JSON.parse(JSON.stringify(defaultAgronomicTasks));
    const defaultCoopCopy: CooperativeGroup = JSON.parse(JSON.stringify(defaultCooperative));
    defaultCoopCopy.creatorId = 'farmer-1';
    this.cooperatives = [defaultCoopCopy];
    this.cooperativeMembers = [
      {
        id: 'member-farmer-1-coop-kano-veg',
        cooperativeId: 'coop-kano-veg',
        userId: 'farmer-1',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-01-01T08:00:00.000Z',
      },
    ];
    this.bulkInputPools = JSON.parse(JSON.stringify(defaultBulkInputPools)).map((p: any) => ({
      ...p,
      cooperativeId: 'coop-kano-veg',
      creatorId: 'farmer-1',
    }));
    this.bulkInputContributions = [];
    for (const p of defaultBulkInputPools) {
      if (p.userPledgedQuantity > 0) {
        this.bulkInputContributions.push({
          id: `contrib-${p.id}-farmer-1`,
          poolId: p.id,
          cooperativeId: 'coop-kano-veg',
          userId: 'farmer-1',
          quantity: p.userPledgedQuantity,
          status: 'pledged',
          createdAt: '2026-01-01T08:00:00.000Z',
        });
      }
    }
    this.aggregationPools = JSON.parse(JSON.stringify(defaultAggregationPools)).map((p: any) => ({
      ...p,
      cooperativeId: 'coop-kano-veg',
      creatorId: 'farmer-1',
    }));
    this.producePledges = [];
    for (const p of defaultAggregationPools) {
      if (p.userCommittedVolume > 0) {
        this.producePledges.push({
          id: `pledge-${p.id}-farmer-1`,
          poolId: p.id,
          cooperativeId: 'coop-kano-veg',
          userId: 'farmer-1',
          cropName: p.cropName,
          pledgedVolume: p.userCommittedVolume,
          unit: p.unit,
          status: 'committed',
          createdAt: '2026-01-01T08:00:00.000Z',
        });
      }
    }
    this.inventoryItems = [];
    this.broadcasts = [
      {
        id: 'bcast-1',
        title: 'Tomato Harvest Market Price Surge (Mile 12 Lagos)',
        message: 'Tomato wholesale clearing rates at Mile 12 Lagos surged to ₦52,000/crate today. Northern growers in Kano/Kaduna with ready harvest are advised to aggregate truckloads for interstate off-take dispatch.',
        category: 'market_alert',
        targetAudience: 'specific_crop',
        targetCrop: 'Tomato',
        senderName: 'Federal Commodity Bureau (Admin)',
        createdAt: '2026-02-10T08:30:00.000Z',
        sentCount: 384,
      },
      {
        id: 'bcast-2',
        title: 'Subsidized NPK 15:15:15 Fertilizer Distribution',
        message: 'Grain farmers in Kaduna and Kano can now register at primary assembly hubs for certified government-subsidized NPK fertilizer at ₦26,500/bag with farm biometric verification.',
        category: 'subsidy',
        targetAudience: 'north',
        senderName: 'Agricultural Inputs Desk (Admin)',
        createdAt: '2026-02-05T10:00:00.000Z',
        sentCount: 520,
      },
      {
        id: 'bcast-3',
        title: 'Fall Armyworm Early Warning & Spray Windows',
        message: 'Extension agents report early Fall Armyworm presence in early-planted sweetcorn in Middle Belt areas. Inspect leaf whorls and spray Emamectin benzoate during morning calm windows.',
        category: 'advisory',
        targetAudience: 'all',
        senderName: 'Crop Protection Unit (Admin)',
        createdAt: '2026-01-28T07:15:00.000Z',
        sentCount: 1140,
      },
    ];

    this.profile = {
      id: 'farmer-1',
      name: 'Musa Ibrahim',
      phone: '+234 803 123 4567',
      location: 'Kano, Nigeria',
      preferredLanguage: 'en',
      dailyReminderEnabled: true,
      dailyReminderTime: '19:00',
      tier: 'pro',
      role: 'admin',
      isAdmin: true,
      createdAt: '2026-01-01T08:00:00.000Z',
    };
    this.profiles['farmer-1'] = { ...this.profile };

    // Additional registered ecosystem farmers for platform-wide admin monitoring
    this.profiles['farmer-2'] = {
      id: 'farmer-2',
      name: 'Folake Adeleke',
      phone: '+234 802 987 6543',
      location: 'Ibadan, Oyo State',
      preferredLanguage: 'yo',
      dailyReminderEnabled: true,
      dailyReminderTime: '18:30',
      tier: 'pro',
      role: 'farmer',
      isAdmin: false,
      createdAt: '2026-01-10T09:00:00.000Z',
    };
    this.profiles['farmer-3'] = {
      id: 'farmer-3',
      name: 'Emeka Okafor',
      phone: '+234 814 555 1212',
      location: 'Makurdi, Benue State',
      preferredLanguage: 'ig',
      dailyReminderEnabled: true,
      dailyReminderTime: '20:00',
      tier: 'institutional',
      role: 'farmer',
      isAdmin: false,
      createdAt: '2026-01-14T11:00:00.000Z',
    };
    this.profiles['farmer-4'] = {
      id: 'farmer-4',
      name: 'Amina Bello',
      phone: '+234 809 333 4455',
      location: 'Zaria, Kaduna State',
      preferredLanguage: 'ha',
      dailyReminderEnabled: false,
      dailyReminderTime: '19:00',
      tier: 'free',
      role: 'farmer',
      isAdmin: false,
      createdAt: '2026-01-20T14:30:00.000Z',
    };
    this.profiles['farmer-5'] = {
      id: 'farmer-5',
      name: 'Haruna Danladi',
      phone: '+234 805 777 8899',
      location: 'Jos, Plateau State',
      preferredLanguage: 'en',
      dailyReminderEnabled: true,
      dailyReminderTime: '19:30',
      tier: 'pro',
      role: 'extension_worker',
      isAdmin: false,
      createdAt: '2026-01-25T16:00:00.000Z',
    };
    this.profiles['admin-nwobodo'] = {
      id: 'admin-nwobodo',
      name: 'Nwobodo Temple',
      phone: '+234 901 234 5678',
      location: 'Abuja FCT / Enugu',
      preferredLanguage: 'en',
      dailyReminderEnabled: true,
      dailyReminderTime: '19:00',
      tier: 'institutional',
      role: 'admin',
      isAdmin: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    this.crops = [
      {
        id: 'crop-tomato',
        userId: 'farmer-1',
        name: 'Tomato',
        variety: 'Cobra F1',
        plantingDate: '2026-01-05',
        farmSizeAcres: 2.0,
        status: 'active',
        createdAt: '2026-01-05T08:00:00.000Z',
      },
      {
        id: 'crop-cucumber',
        userId: 'farmer-1',
        name: 'Cucumber',
        variety: 'Darina F1',
        plantingDate: '2026-01-15',
        farmSizeAcres: 1.0,
        status: 'active',
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'crop-sweetcorn',
        userId: 'farmer-1',
        name: 'Sweetcorn',
        variety: 'Golden Bantam',
        plantingDate: '2026-02-01',
        farmSizeAcres: 1.5,
        status: 'active',
        createdAt: '2026-02-01T08:00:00.000Z',
      },
    ];

    this.categories = [...defaultCategories];

    // Initialize with realistic dated data matching the specification
    this.expenses = [
      {
        id: 'exp-1',
        userId: 'farmer-1',
        categoryId: 'cat-seeds',
        categoryName: 'Seeds',
        totalAmount: 50000,
        expenseDate: '2026-01-05',
        description: 'Tomato Cobra F1 seed tins',
        isShared: false,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 100, allocatedAmount: 50000 },
        ],
        source: 'web',
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        id: 'exp-2',
        userId: 'farmer-1',
        categoryId: 'cat-labour',
        categoryName: 'Labour',
        totalAmount: 60000,
        expenseDate: '2026-01-07',
        description: '12 workers cleared the tomato field',
        isShared: false,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 100, allocatedAmount: 60000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-07T14:30:00.000Z',
      },
      {
        id: 'exp-3',
        userId: 'farmer-1',
        categoryId: 'cat-fertilizer',
        categoryName: 'Fertilizer',
        totalAmount: 70000,
        expenseDate: '2026-01-10',
        description: 'NPK 15-15-15 2 bags',
        isShared: false,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 100, allocatedAmount: 70000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-10T09:15:00.000Z',
      },
      // Shared expense specification example: ₦30,000 on Fuel split 60% Tomato (₦18,000) and 40% Cucumber (₦12,000)
      {
        id: 'exp-4',
        userId: 'farmer-1',
        categoryId: 'cat-fuel',
        categoryName: 'Fuel',
        totalAmount: 30000,
        expenseDate: '2026-01-20',
        description: 'Water pumping generator fuel for irrigation',
        isShared: true,
        allocations: [
          { cropId: 'crop-tomato', cropName: 'Tomato', percentage: 60, allocatedAmount: 18000 },
          { cropId: 'crop-cucumber', cropName: 'Cucumber', percentage: 40, allocatedAmount: 12000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-20T11:00:00.000Z',
      },
      {
        id: 'exp-5',
        userId: 'farmer-1',
        categoryId: 'cat-seeds',
        categoryName: 'Seeds',
        totalAmount: 35000,
        expenseDate: '2026-01-15',
        description: 'Cucumber Darina seeds',
        isShared: false,
        allocations: [
          { cropId: 'crop-cucumber', cropName: 'Cucumber', percentage: 100, allocatedAmount: 35000 },
        ],
        source: 'web',
        createdAt: '2026-01-15T09:00:00.000Z',
      },
      {
        id: 'exp-6',
        userId: 'farmer-1',
        categoryId: 'cat-labour',
        categoryName: 'Labour',
        totalAmount: 25000,
        expenseDate: '2026-01-18',
        description: 'Weeding cucumber plots',
        isShared: false,
        allocations: [
          { cropId: 'crop-cucumber', cropName: 'Cucumber', percentage: 100, allocatedAmount: 25000 },
        ],
        source: 'whatsapp',
        createdAt: '2026-01-18T16:00:00.000Z',
      },
    ];

    this.labourRecords = [
      {
        id: 'lab-1',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        labourDate: '2026-01-07',
        workType: 'Land clearing & ridging',
        workerCount: 12,
        amountPaid: 60000,
        description: '12 workers cleared the tomato field for ₦60,000',
        linkedExpenseId: 'exp-2',
        createdAt: '2026-01-07T14:30:00.000Z',
      },
      {
        id: 'lab-2',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        labourDate: '2026-01-18',
        workType: 'Manual weeding & trellising',
        workerCount: 5,
        amountPaid: 25000,
        description: '5 workers weeded cucumber section',
        linkedExpenseId: 'exp-6',
        createdAt: '2026-01-18T16:00:00.000Z',
      },
    ];

    this.harvests = [
      {
        id: 'harv-1',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        harvestDate: '2026-02-18',
        quantity: 50,
        unit: 'crates',
        qualityGrade: 'Grade A',
        notes: 'First major harvest flush, firm fruit',
        createdAt: '2026-02-18T11:00:00.000Z',
      },
      {
        id: 'harv-2',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        harvestDate: '2026-02-24',
        quantity: 65,
        unit: 'crates',
        qualityGrade: 'Standard',
        notes: 'Mid harvest flush',
        createdAt: '2026-02-24T10:00:00.000Z',
      },
      {
        id: 'harv-3',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        harvestDate: '2026-02-20',
        quantity: 40,
        unit: 'bags',
        qualityGrade: 'Grade A',
        notes: 'Green, crisp cucumbers',
        createdAt: '2026-02-20T08:30:00.000Z',
      },
    ];

    // Sales demonstrating variable selling prices and weighted average computation:
    // Sale 1: 50 crates @ ₦28,000 = ₦1,400,000
    // Sale 2: 40 crates @ ₦29,000 = ₦1,160,000
    // Total sold: 90 crates, Total revenue: ₦2,560,000
    // Weighted average price: ₦2,560,000 / 90 = ₦28,444.44
    this.sales = [
      {
        id: 'sale-1',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        saleDate: '2026-02-20',
        quantitySold: 50,
        unit: 'crates',
        pricePerUnit: 28000,
        totalRevenue: 1400000,
        amountPaid: 1400000,
        amountDue: 0,
        buyerName: 'Alhaji Danladi (Mile 12 Market)',
        paymentStatus: 'paid',
        notes: 'Direct cash bank transfer',
        createdAt: '2026-02-20T15:00:00.000Z',
      },
      {
        id: 'sale-2',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        saleDate: '2026-02-25',
        quantitySold: 40,
        unit: 'crates',
        pricePerUnit: 29000,
        totalRevenue: 1160000,
        amountPaid: 1160000,
        amountDue: 0,
        buyerName: 'Madam Grace',
        paymentStatus: 'paid',
        notes: 'Premium grade price',
        createdAt: '2026-02-25T14:00:00.000Z',
      },
      {
        id: 'sale-3',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        saleDate: '2026-02-21',
        quantitySold: 35,
        unit: 'bags',
        pricePerUnit: 19500,
        totalRevenue: 682500,
        amountPaid: 682500,
        amountDue: 0,
        buyerName: 'Kano Central Market Traders',
        paymentStatus: 'paid',
        notes: 'Wholesale batch',
        createdAt: '2026-02-21T12:00:00.000Z',
      },
      {
        id: 'sale-4',
        userId: 'farmer-1',
        cropId: 'crop-tomato',
        cropName: 'Tomato',
        saleDate: '2026-02-26',
        quantitySold: 20,
        unit: 'crates',
        pricePerUnit: 27500,
        totalRevenue: 550000,
        amountPaid: 0,
        amountDue: 550000,
        buyerName: 'Mama Chidi (Yankaba Market)',
        paymentStatus: 'credit',
        dueDate: '2026-03-05',
        notes: 'Taken on credit; promise to pay next market day',
        createdAt: '2026-02-26T16:30:00.000Z',
      },
      {
        id: 'sale-5',
        userId: 'farmer-1',
        cropId: 'crop-cucumber',
        cropName: 'Cucumber',
        saleDate: '2026-02-27',
        quantitySold: 15,
        unit: 'bags',
        pricePerUnit: 19000,
        totalRevenue: 285000,
        amountPaid: 185000,
        amountDue: 100000,
        buyerName: 'Mallam Garba',
        paymentStatus: 'partial',
        dueDate: '2026-03-03',
        notes: 'Paid ₦185,000 cash advance, balance ₦100,000 outstanding',
        createdAt: '2026-02-27T10:15:00.000Z',
      },
    ];

    this.feedbacks = [
      {
        id: 'fb-1',
        userId: 'farmer-1',
        farmerName: 'Mallam Garba Sanusi',
        phoneOrEmail: '+234 802 334 8812',
        farmLocation: 'Kano (Bunkure LGA)',
        primaryCrops: 'Tomato & Pepper',
        rating: 5,
        testedFeatures: ['whatsapp', 'market', 'reminders'],
        easeOfUseRating: 'very_easy',
        clarityOfLanguage: 'clear',
        nairaAndUnitsMatch: 'yes',
        whatWorkedWell: 'The WhatsApp bot understands Nigerian Pidgin and agricultural terms like poultry manure and crates without any struggle.',
        whatWasConfusing: 'Ensure crate pricing notes differentiate plastic standard crates from woven palm raffia baskets.',
        desiredNextFeature: 'Audio voice note recording in Hausa so I can talk while walking on my farm.',
        deviceType: 'Android Phone',
        status: 'reviewed',
        category: 'whatsapp',
        createdAt: '2026-03-01T14:20:00.000Z',
      },
      {
        id: 'fb-2',
        userId: 'farmer-1',
        farmerName: 'Folashade Adeyemi',
        phoneOrEmail: '+234 803 912 4471',
        farmLocation: 'Ogun State (Sagamu)',
        primaryCrops: 'Cucumber & Sweetcorn',
        rating: 5,
        testedFeatures: ['cooperative', 'credit', 'planning'],
        easeOfUseRating: 'easy',
        clarityOfLanguage: 'clear',
        nairaAndUnitsMatch: 'yes',
        whatWorkedWell: 'Comparing our local farmgate prices with Mile 12 wholesale prices opened my eyes to how much margin we lose to middlemen.',
        whatWasConfusing: 'Clarify whether the generated Agri-Credit report can be submitted directly to Sterling Bank or Bank of Agriculture.',
        desiredNextFeature: 'Direct SMS alert whenever a cooperative truck aggregation pool is 80% filled.',
        deviceType: 'Android Phone',
        status: 'new',
        category: 'market',
        createdAt: '2026-03-03T18:45:00.000Z',
      },
      {
        id: 'fb-3',
        userId: 'farmer-1',
        farmerName: 'Emeka Okonkwo',
        phoneOrEmail: '+234 818 765 2209',
        farmLocation: 'Plateau State (Mangu)',
        primaryCrops: 'Irish Potato & Maize',
        rating: 4,
        testedFeatures: ['ussd', 'planning'],
        easeOfUseRating: 'moderate',
        clarityOfLanguage: 'clear',
        nairaAndUnitsMatch: 'yes',
        whatWorkedWell: 'USSD code *384*24# is very good when out in rural fields where Airtel 4G network drops.',
        whatWasConfusing: 'The prompt format for quantity vs price was slightly fast on the 2nd screen.',
        desiredNextFeature: 'SMS receipt sent immediately after logging via USSD.',
        deviceType: 'Feature Phone (USSD)',
        status: 'addressed',
        category: 'ussd',
        createdAt: '2026-03-05T09:10:00.000Z',
      },
    ];
  }

  getProfile(userId: string): FarmerProfile {
    if (!this.profiles[userId]) {
      this.profiles[userId] = {
        id: userId,
        name: userId === 'farmer-1' ? 'Musa Ibrahim' : `Farmer ${userId.substring(0, 8)}`,
        phone: userId === 'farmer-1' ? '+234 803 123 4567' : undefined,
        location: userId === 'farmer-1' ? 'Kano, Nigeria' : undefined,
        preferredLanguage: 'en',
        dailyReminderEnabled: true,
        dailyReminderTime: '19:00',
        tier: 'pro',
        createdAt: new Date().toISOString(),
      };
    }
    return this.profiles[userId];
  }

  async getProfileAsync(userId: string): Promise<FarmerProfile> {
    if (this.profiles[userId]) {
      return this.profiles[userId];
    }
    if (process.env.SQL_HOST && process.env.SQL_USER) {
      try {
        const { sqlDb, schema: { users }, drizzle: { eq } } = await getSqlModule();
        const [userRow] = await sqlDb.select().from(users).where(eq(users.uid, userId));
        if (userRow) {
          const profile: FarmerProfile = {
            id: userRow.uid,
            name: userRow.name,
            phone: userRow.phone || undefined,
            location: userRow.location || undefined,
            preferredLanguage: (userRow.preferredLanguage as any) || 'en',
            theme: (userRow.theme as any) || 'system',
            dailyReminderEnabled: userRow.dailyReminderEnabled ?? true,
            dailyReminderTime: userRow.dailyReminderTime || '19:00',
            reminderChannel: (userRow.reminderChannel as any) || 'both',
            tier: (userRow.tier as any) || 'pro',
            createdAt: userRow.createdAt ? userRow.createdAt.toISOString() : new Date().toISOString(),
          };
          this.profiles[userId] = profile;
          if (userId === 'farmer-1') this.profile = profile;
          return profile;
        }
      } catch (err) {
        console.warn('[Cloud SQL] Failed to fetch profile from PostgreSQL:', err);
      }
    }
    return this.getProfile(userId);
  }

  saveProfile(userId: string, data: Partial<FarmerProfile>): FarmerProfile {
    const existing = this.profiles[userId] || this.getProfile(userId);
    const updated: FarmerProfile = {
      ...existing,
      ...data,
      id: userId, // client cannot change their id
    };
    this.profiles[userId] = updated;
    if (userId === 'farmer-1') {
      this.profile = updated;
    }
    return updated;
  }

  // ======================== CLOUD SQL PERSISTENCE ========================
  async syncFromCloudSql() {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const {
        users,
        crops: sqlCrops,
        expenses: sqlExpenses,
        sales: sqlSales,
        labourRecords: sqlLabour,
        harvests: sqlHarvests,
        debtorPayments: sqlDebtors,
        inventoryItems: sqlInventory,
        planningTasks: sqlPlanningTasks,
        cropBudgets: sqlCropBudgets,
        feedbacks: sqlFeedbacks,
        cooperatives: sqlCooperatives,
        cooperativeMembers: sqlCooperativeMembers,
        bulkInputPools: sqlBulkInputPools,
        bulkInputContributions: sqlBulkInputContributions,
        produceAggregationPools: sqlProduceAggregationPools,
        producePledges: sqlProducePledges,
      } = await import('../src/db/schema.ts');

      // 1. Multi-User Profiles (Hydrate ALL users, never use .limit(1))
      const dbUsers = await sqlDb.select().from(users);
      for (const u of dbUsers) {
        this.profiles[u.uid] = {
          id: u.uid,
          name: u.name,
          phone: u.phone || undefined,
          location: u.location || undefined,
          preferredLanguage: (u.preferredLanguage as any) || 'en',
          theme: (u.theme as any) || 'system',
          dailyReminderEnabled: u.dailyReminderEnabled ?? true,
          dailyReminderTime: u.dailyReminderTime || '19:00',
          reminderChannel: (u.reminderChannel as any) || 'both',
          tier: (u.tier as any) || 'pro',
          createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
        };
      }
      if (this.profiles['farmer-1']) {
        this.profile = this.profiles['farmer-1'];
      }

      // 2. Crops
      const dbCrops = await sqlDb.select().from(sqlCrops);

      // 3. Expenses
      const dbExpenses = await sqlDb.select().from(sqlExpenses);

      // 4. Sales
      const dbSales = await sqlDb.select().from(sqlSales);

      // 5. Labour Records
      const dbLabour = await sqlDb.select().from(sqlLabour);

      // 6. Harvest Records
      const dbHarvests = await sqlDb.select().from(sqlHarvests);

      // 7. Debtor Payments
      const dbDebtors = await sqlDb.select().from(sqlDebtors);

      // 8. Inventory Items
      const dbInventory = await sqlDb.select().from(sqlInventory);

      // 9. Planning Tasks
      const dbTasks = await sqlDb.select().from(sqlPlanningTasks);

      // 10. Crop Budgets
      const dbBudgets = await sqlDb.select().from(sqlCropBudgets);

      // 11. Feedbacks
      const dbFeedbacks = await sqlDb.select().from(sqlFeedbacks);

      // 12. Cooperatives & Memberships
      const dbCoops = await sqlDb.select().from(sqlCooperatives);
      const dbCoopMembers = await sqlDb.select().from(sqlCooperativeMembers);
      const dbBulkPools = await sqlDb.select().from(sqlBulkInputPools);
      const dbBulkContribs = await sqlDb.select().from(sqlBulkInputContributions);
      const dbAggPools = await sqlDb.select().from(sqlProduceAggregationPools);
      const dbProducePledges = await sqlDb.select().from(sqlProducePledges);

      if (dbCoops.length === 0) {
        await this.seedDefaultCooperatives();
      } else {
        this.cooperatives = dbCoops.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || undefined,
          societyNumber: c.societyNumber || '',
          zone: c.zone || '',
          totalMembers: c.totalMembers || 1,
          chairperson: c.chairperson || '',
          phone: c.phone || '',
          bankAccount: c.bankAccount || '',
          creatorId: c.creatorId,
          status: c.status,
          createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
        }));
        this.cooperativeMembers = dbCoopMembers.map((m) => ({
          id: m.id,
          cooperativeId: m.cooperativeId,
          userId: m.userId,
          role: m.role as any,
          status: m.status as any,
          joinedAt: m.joinedAt ? m.joinedAt.toISOString() : new Date().toISOString(),
          updatedAt: m.updatedAt ? m.updatedAt.toISOString() : new Date().toISOString(),
        }));
        this.bulkInputPools = dbBulkPools.map((p) => ({
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
          pledgedQuantity: 0,
          userPledgedQuantity: 0,
          deadlineDate: p.deadlineDate,
          status: p.status as any,
          supplierName: p.supplierName || '',
          createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
        }));
        this.bulkInputContributions = dbBulkContribs.map((bc) => ({
          id: bc.id,
          poolId: bc.poolId,
          cooperativeId: bc.cooperativeId,
          userId: bc.userId,
          quantity: bc.quantity,
          status: bc.status as any,
          createdAt: bc.createdAt ? bc.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: bc.updatedAt ? bc.updatedAt.toISOString() : new Date().toISOString(),
        }));
        this.aggregationPools = dbAggPools.map((ap) => ({
          id: ap.id,
          cooperativeId: ap.cooperativeId,
          creatorId: ap.creatorId,
          cropName: ap.cropName,
          offtakerName: ap.offtakerName,
          contractType: ap.contractType as any,
          unit: ap.unit,
          agreedFloorPricePerUnit: ap.agreedFloorPricePerUnit,
          minimumVolumeRequired: ap.minimumVolumeRequired,
          currentAggregatedVolume: 0,
          userCommittedVolume: 0,
          deliveryHub: ap.deliveryHub,
          cutoffDate: ap.cutoffDate,
          status: ap.status as any,
          termsNote: ap.termsNote || '',
          createdAt: ap.createdAt ? ap.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: ap.updatedAt ? ap.updatedAt.toISOString() : new Date().toISOString(),
        }));
        this.producePledges = dbProducePledges.map((pp) => ({
          id: pp.id,
          poolId: pp.poolId,
          cooperativeId: pp.cooperativeId,
          userId: pp.userId,
          cropName: pp.cropName,
          pledgedVolume: pp.pledgedVolume,
          unit: pp.unit,
          status: pp.status as any,
          createdAt: pp.createdAt ? pp.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: pp.updatedAt ? pp.updatedAt.toISOString() : new Date().toISOString(),
        }));
      }

      if (dbUsers.length === 0) {
        // First-time DB initialization only
        for (const c of this.crops) await this.persistCrop(c);
        for (const e of this.expenses) await this.persistExpense(e);
        for (const s of this.sales) await this.persistSale(s);
        for (const l of this.labourRecords) await this.persistLabour(l);
        for (const h of this.harvests) await this.persistHarvest(h);
        for (const i of defaultInventoryItems) await this.persistInventoryItem(i);
        for (const f of this.feedbacks) await this.persistFeedback(f);
      } else {
        // Cloud SQL PostgreSQL is the true source of truth
        this.crops = dbCrops.map((c) => ({
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

        this.expenses = dbExpenses.map((e) => ({
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

        this.sales = dbSales.map((s) => ({
          id: s.id,
          userId: s.userId,
          cropId: s.cropId,
          cropName: s.cropName,
          saleDate: s.saleDate,
          quantitySold: s.quantitySold,
          unit: s.unit,
          pricePerUnit: s.pricePerUnit,
          totalRevenue: s.totalRevenue,
          buyerName: s.buyerName || undefined,
          paymentStatus: s.paymentStatus as any,
          amountPaid: s.amountPaid,
          amountDue: s.amountDue,
          dueDate: s.dueDate || undefined,
          notes: s.notes || undefined,
          createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
        }));

        this.labourRecords = dbLabour.map((l) => ({
          id: l.id,
          userId: l.userId,
          cropId: l.cropId || undefined,
          cropName: l.cropName || 'Farm Plot',
          labourDate: l.workDate,
          workType: l.taskType,
          workerCount: l.workerCount,
          amountPaid: l.totalPaid,
          description: l.notes || undefined,
          createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
        }));

        this.harvests = dbHarvests.map((h) => ({
          id: h.id,
          userId: h.userId,
          cropId: h.cropId,
          cropName: h.cropName,
          harvestDate: h.harvestDate,
          quantity: h.quantityHarvested,
          unit: h.unit,
          qualityGrade: h.qualityGrade || undefined,
          notes: h.notes || undefined,
          createdAt: h.createdAt ? h.createdAt.toISOString() : new Date().toISOString(),
        }));

        this.debtorPayments = dbDebtors.map((d) => ({
          id: d.id,
          saleId: d.saleId,
          paymentDate: d.paymentDate,
          amount: d.amount,
          note: d.note || undefined,
          createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
        }));

        this.inventoryItems = dbInventory.map((i) => ({
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

        this.tasks = dbTasks.map((t) => ({
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

        this.budgetConfigs = {};
        for (const b of dbBudgets) {
          const cfg: RawCropBudgetConfig = {
            cropId: b.cropId,
            targetYieldQuantity: b.targetYieldQuantity,
            targetYieldUnit: b.targetYieldUnit,
            targetSellingPricePerUnit: b.targetSellingPricePerUnit,
            categoryAllocations: b.categoryAllocations as Record<string, number>,
          };
          this.budgetConfigs[`${b.userId}:${b.cropId}`] = cfg;
          if (b.userId === 'farmer-1') {
            this.budgetConfigs[b.cropId] = cfg;
          }
        }

        this.feedbacks = dbFeedbacks.map((f) => ({
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
      }
    } catch (err) {
      console.warn('[Cloud SQL] Sync from database skipped or failed (falling back to memory store):', err);
    }
  }

  async persistCrop(crop: Crop) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { crops: sqlCrops } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlCrops)
        .values({
          id: crop.id,
          userId: crop.userId,
          name: crop.name,
          variety: crop.variety,
          plantingDate: crop.plantingDate,
          farmSizeAcres: crop.farmSizeAcres,
          status: crop.status,
          finishedDate: crop.finishedDate,
          notes: crop.notes,
        })
        .onConflictDoUpdate({
          target: sqlCrops.id,
          set: {
            name: crop.name,
            variety: crop.variety,
            farmSizeAcres: crop.farmSizeAcres,
            status: crop.status,
            finishedDate: crop.finishedDate,
            notes: crop.notes,
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist crop:', err);
    }
  }

  async persistExpense(expense: Expense) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { expenses: sqlExpenses } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlExpenses)
        .values({
          id: expense.id,
          userId: expense.userId,
          categoryId: expense.categoryId,
          categoryName: expense.categoryName,
          totalAmount: expense.totalAmount,
          expenseDate: expense.expenseDate,
          description: expense.description,
          isShared: expense.isShared,
          allocations: expense.allocations as any,
          source: expense.source,
        })
        .onConflictDoUpdate({
          target: sqlExpenses.id,
          set: {
            categoryId: expense.categoryId,
            categoryName: expense.categoryName,
            totalAmount: expense.totalAmount,
            expenseDate: expense.expenseDate,
            description: expense.description,
            isShared: expense.isShared,
            allocations: expense.allocations as any,
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist expense:', err);
    }
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    let dbDeleted = false;
    if (process.env.SQL_HOST && process.env.SQL_USER) {
      try {
        const { db: sqlDb } = await import('../src/db/index.ts');
        const { expenses: sqlExpenses } = await import('../src/db/schema.ts');
        const { and, eq } = await import('drizzle-orm');
        const deletedRows = await sqlDb
          .delete(sqlExpenses)
          .where(and(eq(sqlExpenses.id, id), eq(sqlExpenses.userId, userId)))
          .returning();
        dbDeleted = deletedRows.length > 0;
      } catch (err) {
        console.warn('[Cloud SQL] Failed to delete expense from PostgreSQL:', err);
        return false;
      }
    }

    const idx = this.expenses.findIndex((e) => e.id === id && e.userId === userId);
    if (idx !== -1) {
      this.expenses.splice(idx, 1);
      return true;
    }
    return dbDeleted;
  }

  async persistLabour(labour: LabourRecord) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { labourRecords: sqlLabour } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlLabour)
        .values({
          id: labour.id,
          userId: labour.userId,
          cropId: labour.cropId || null,
          cropName: labour.cropName || 'Farm Plot',
          workDate: labour.labourDate,
          taskType: labour.workType,
          workerCount: labour.workerCount || 1,
          dailyRatePerWorker: (labour.amountPaid || 0) / (labour.workerCount || 1),
          totalPaid: labour.amountPaid || 0,
          notes: labour.description || null,
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist labour record:', err);
    }
  }

  async persistHarvest(harvest: HarvestRecord) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { harvests: sqlHarvests } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlHarvests)
        .values({
          id: harvest.id,
          userId: harvest.userId,
          cropId: harvest.cropId,
          cropName: harvest.cropName,
          harvestDate: harvest.harvestDate,
          quantityHarvested: harvest.quantity,
          unit: harvest.unit,
          qualityGrade: harvest.qualityGrade || null,
          notes: harvest.notes || null,
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist harvest record:', err);
    }
  }

  async persistSale(sale: SaleRecord) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { sales: sqlSales } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlSales)
        .values({
          id: sale.id,
          userId: sale.userId,
          cropId: sale.cropId,
          cropName: sale.cropName,
          saleDate: sale.saleDate,
          quantitySold: sale.quantitySold,
          unit: sale.unit,
          pricePerUnit: sale.pricePerUnit,
          totalRevenue: sale.totalRevenue,
          buyerName: sale.buyerName,
          paymentStatus: sale.paymentStatus,
          amountPaid: sale.amountPaid,
          amountDue: sale.amountDue,
          dueDate: sale.dueDate,
          notes: sale.notes,
        })
        .onConflictDoUpdate({
          target: sqlSales.id,
          set: {
            paymentStatus: sale.paymentStatus,
            amountPaid: sale.amountPaid,
            amountDue: sale.amountDue,
            dueDate: sale.dueDate,
            notes: sale.notes,
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist sale:', err);
    }
  }

  async persistDebtorPayment(payment: DebtorPaymentRecord) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { debtorPayments: sqlDebtors } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlDebtors)
        .values({
          id: payment.id,
          saleId: payment.saleId,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          note: payment.note || null,
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist debtor payment:', err);
    }
  }

  async persistProfile(profile: Partial<FarmerProfile>, userId: string) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { users } = await import('../src/db/schema.ts');
      const targetUid = userId || profile.id;
      if (!targetUid) return;

      const current: Partial<FarmerProfile> = this.profiles[targetUid] || {};
      const name = profile.name || current.name || `Farmer ${targetUid.substring(0, 8)}`;
      const phone = profile.phone !== undefined ? profile.phone : (current.phone || null);
      const location = profile.location !== undefined ? profile.location : (current.location || null);
      const preferredLanguage = profile.preferredLanguage || current.preferredLanguage || 'en';
      const theme = profile.theme || current.theme || 'system';
      const dailyReminderEnabled = profile.dailyReminderEnabled !== undefined
        ? profile.dailyReminderEnabled
        : (current.dailyReminderEnabled ?? true);
      const dailyReminderTime = profile.dailyReminderTime || current.dailyReminderTime || '19:00';
      const reminderChannel = profile.reminderChannel || current.reminderChannel || 'both';
      const tier = profile.tier || current.tier || 'pro';

      await sqlDb
        .insert(users)
        .values({
          uid: targetUid,
          name,
          phone,
          location,
          preferredLanguage,
          theme,
          dailyReminderEnabled,
          dailyReminderTime,
          reminderChannel,
          tier,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            name,
            phone,
            location,
            preferredLanguage,
            theme,
            dailyReminderEnabled,
            dailyReminderTime,
            reminderChannel,
            tier,
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist profile:', err);
    }
  }

  async persistInventoryItem(item: FarmInventoryItem) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { inventoryItems: sqlInventory } = await import('../src/db/schema.ts');
      const targetUserId = item.userId;
      if (!targetUserId) {
        throw new Error('item.userId is required for inventory persistence');
      }
      await sqlDb
        .insert(sqlInventory)
        .values({
          id: item.id,
          userId: targetUserId,
          name: item.name,
          category: item.category,
          currentQuantity: item.currentQuantity,
          unit: item.unit,
          reorderThreshold: item.reorderThreshold,
          estimatedUnitValue: item.estimatedUnitValue,
          storageLocation: item.storageLocation,
          lastRestocked: item.lastRestocked,
          status: item.status,
        })
        .onConflictDoUpdate({
          target: sqlInventory.id,
          set: {
            name: item.name,
            category: item.category,
            currentQuantity: item.currentQuantity,
            unit: item.unit,
            reorderThreshold: item.reorderThreshold,
            estimatedUnitValue: item.estimatedUnitValue,
            storageLocation: item.storageLocation,
            lastRestocked: item.lastRestocked,
            status: item.status,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist inventory item:', err);
      throw err;
    }
  }

  async deleteInventoryItem(id: string, userId: string): Promise<boolean> {
    if (process.env.SQL_HOST && process.env.SQL_USER) {
      try {
        const { db: sqlDb } = await import('../src/db/index.ts');
        const { inventoryItems: sqlInventory } = await import('../src/db/schema.ts');
        const { and, eq } = await import('drizzle-orm');
        const deletedRows = await sqlDb
          .delete(sqlInventory)
          .where(and(eq(sqlInventory.id, id), eq(sqlInventory.userId, userId)))
          .returning();
        
        if (deletedRows.length === 0) {
          return false;
        }

        const idx = this.inventoryItems.findIndex((i) => i.id === id && i.userId === userId);
        if (idx !== -1) {
          this.inventoryItems.splice(idx, 1);
        }
        return true;
      } catch (err) {
        console.warn('[Cloud SQL] Failed to delete inventory item from PostgreSQL:', err);
        return false;
      }
    }

    const idx = this.inventoryItems.findIndex((i) => i.id === id && i.userId === userId);
    if (idx !== -1) {
      this.inventoryItems.splice(idx, 1);
      return true;
    }
    return false;
  }

  async persistTask(task: AgronomicTask) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { planningTasks: sqlPlanningTasks } = await import('../src/db/schema.ts');
      const targetUserId = task.userId;
      if (!targetUserId) throw new Error('task.userId is required for persistence');
      await sqlDb
        .insert(sqlPlanningTasks)
        .values({
          id: task.id,
          userId: targetUserId,
          cropId: task.cropId,
          cropName: task.cropName,
          title: task.title,
          category: task.category || 'Labour',
          dueDate: task.dueDate,
          completed: task.completed,
          completedDate: task.completedDate || null,
          estimatedCost: task.estimatedCost ?? null,
          notes: task.notes || null,
        })
        .onConflictDoUpdate({
          target: sqlPlanningTasks.id,
          set: {
            cropId: task.cropId,
            cropName: task.cropName,
            title: task.title,
            category: task.category || 'Labour',
            dueDate: task.dueDate,
            completed: task.completed,
            completedDate: task.completedDate || null,
            estimatedCost: task.estimatedCost ?? null,
            notes: task.notes || null,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist planning task:', err);
      throw err;
    }
  }

  async toggleTask(id: string, userId: string): Promise<AgronomicTask | null> {
    if (process.env.SQL_HOST && process.env.SQL_USER) {
      try {
        const { db: sqlDb } = await import('../src/db/index.ts');
        const { planningTasks: sqlPlanningTasks } = await import('../src/db/schema.ts');
        const { and, eq, sql } = await import('drizzle-orm');
        const today = new Date().toISOString().split('T')[0];

        const updatedRows = await sqlDb
          .update(sqlPlanningTasks)
          .set({
            completed: sql`NOT ${sqlPlanningTasks.completed}`,
            completedDate: sql`CASE WHEN NOT ${sqlPlanningTasks.completed} THEN ${today} ELSE NULL END`,
            updatedAt: sql`NOW()`,
          })
          .where(and(eq(sqlPlanningTasks.id, id), eq(sqlPlanningTasks.userId, userId)))
          .returning();

        if (updatedRows.length === 0) {
          return null;
        }

        const t = updatedRows[0];
        const formatted: AgronomicTask = {
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

        const idx = this.tasks.findIndex((item) => item.id === id && item.userId === userId);
        if (idx !== -1) {
          this.tasks[idx] = formatted;
        } else {
          this.tasks.unshift(formatted);
        }
        return formatted;
      } catch (err) {
        console.warn('[Cloud SQL] Failed to toggle task in PostgreSQL:', err);
        throw err;
      }
    }

    const task = this.tasks.find((t) => t.id === id && (t.userId === userId || (!t.userId && userId === 'farmer-1')));
    if (!task) return null;
    task.completed = !task.completed;
    task.completedDate = task.completed ? new Date().toISOString().split('T')[0] : undefined;
    return task;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    if (process.env.SQL_HOST && process.env.SQL_USER) {
      try {
        const { db: sqlDb } = await import('../src/db/index.ts');
        const { planningTasks: sqlPlanningTasks } = await import('../src/db/schema.ts');
        const { and, eq } = await import('drizzle-orm');
        const deletedRows = await sqlDb
          .delete(sqlPlanningTasks)
          .where(and(eq(sqlPlanningTasks.id, id), eq(sqlPlanningTasks.userId, userId)))
          .returning();

        if (deletedRows.length === 0) {
          return false;
        }

        const idx = this.tasks.findIndex((t) => t.id === id && t.userId === userId);
        if (idx !== -1) {
          this.tasks.splice(idx, 1);
        }
        return true;
      } catch (err) {
        console.warn('[Cloud SQL] Failed to delete planning task from PostgreSQL:', err);
        return false;
      }
    }

    const idx = this.tasks.findIndex((t) => t.id === id && (t.userId === userId || (!t.userId && userId === 'farmer-1')));
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  async persistBudget(
    userId: string,
    cropId: string,
    data: {
      targetYieldQuantity?: number;
      targetYieldUnit?: string;
      targetSellingPricePerUnit?: number;
      categoryAllocations?: Record<string, number>;
    }
  ) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { cropBudgets: sqlCropBudgets } = await import('../src/db/schema.ts');
      const { and, eq } = await import('drizzle-orm');

      const budgetId = `budget-${userId}-${cropId}`;
      const [existing] = await sqlDb
        .select()
        .from(sqlCropBudgets)
        .where(and(eq(sqlCropBudgets.userId, userId), eq(sqlCropBudgets.cropId, cropId)));

      const finalYieldQty = data.targetYieldQuantity !== undefined ? Number(data.targetYieldQuantity) : (existing?.targetYieldQuantity ?? 100);
      const finalYieldUnit = data.targetYieldUnit !== undefined ? String(data.targetYieldUnit).trim() : (existing?.targetYieldUnit ?? 'units');
      const finalPrice = data.targetSellingPricePerUnit !== undefined ? Number(data.targetSellingPricePerUnit) : (existing?.targetSellingPricePerUnit ?? 5000);
      const finalAllocations = data.categoryAllocations !== undefined ? data.categoryAllocations : (existing?.categoryAllocations ?? {});

      await sqlDb
        .insert(sqlCropBudgets)
        .values({
          id: budgetId,
          userId,
          cropId,
          targetYieldQuantity: finalYieldQty,
          targetYieldUnit: finalYieldUnit,
          targetSellingPricePerUnit: finalPrice,
          categoryAllocations: finalAllocations,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: sqlCropBudgets.id,
          set: {
            targetYieldQuantity: finalYieldQty,
            targetYieldUnit: finalYieldUnit,
            targetSellingPricePerUnit: finalPrice,
            categoryAllocations: finalAllocations,
            updatedAt: new Date(),
          },
        });

      // Update in-memory cache
      this.budgetConfigs[`${userId}:${cropId}`] = {
        cropId,
        targetYieldQuantity: finalYieldQty,
        targetYieldUnit: finalYieldUnit,
        targetSellingPricePerUnit: finalPrice,
        categoryAllocations: finalAllocations as Record<string, number>,
      };
      if (userId === 'farmer-1') {
        this.budgetConfigs[cropId] = this.budgetConfigs[`${userId}:${cropId}`];
      }
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist budget in PostgreSQL:', err);
      throw err;
    }
  }

  async persistFeedback(feedback: FarmerFeedback) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { feedbacks: sqlFeedbacks } = await import('../src/db/schema.ts');
      const targetUserId = feedback.userId;
      if (!targetUserId) throw new Error('feedback.userId is required for persistence');

      await sqlDb
        .insert(sqlFeedbacks)
        .values({
          id: feedback.id,
          userId: targetUserId,
          farmerName: feedback.farmerName,
          phoneOrEmail: feedback.phoneOrEmail || null,
          farmLocation: feedback.farmLocation,
          primaryCrops: feedback.primaryCrops || null,
          rating: feedback.rating,
          testedFeatures: feedback.testedFeatures || [],
          easeOfUseRating: feedback.easeOfUseRating || 'very_easy',
          clarityOfLanguage: feedback.clarityOfLanguage || 'clear',
          nairaAndUnitsMatch: feedback.nairaAndUnitsMatch || 'yes',
          whatWorkedWell: feedback.whatWorkedWell || null,
          whatWasConfusing: feedback.whatWasConfusing || null,
          desiredNextFeature: feedback.desiredNextFeature || null,
          deviceType: feedback.deviceType || 'Android Phone',
          audioNoteTranscript: feedback.audioNoteTranscript || null,
          status: feedback.status || 'new',
          message: feedback.message || null,
          category: feedback.category || 'general',
          createdAt: feedback.createdAt ? new Date(feedback.createdAt) : new Date(),
          updatedAt: feedback.updatedAt ? new Date(feedback.updatedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: sqlFeedbacks.id,
          set: {
            farmerName: feedback.farmerName,
            phoneOrEmail: feedback.phoneOrEmail || null,
            farmLocation: feedback.farmLocation,
            primaryCrops: feedback.primaryCrops || null,
            rating: feedback.rating,
            testedFeatures: feedback.testedFeatures || [],
            easeOfUseRating: feedback.easeOfUseRating || 'very_easy',
            clarityOfLanguage: feedback.clarityOfLanguage || 'clear',
            nairaAndUnitsMatch: feedback.nairaAndUnitsMatch || 'yes',
            whatWorkedWell: feedback.whatWorkedWell || null,
            whatWasConfusing: feedback.whatWasConfusing || null,
            desiredNextFeature: feedback.desiredNextFeature || null,
            deviceType: feedback.deviceType || 'Android Phone',
            audioNoteTranscript: feedback.audioNoteTranscript || null,
            status: feedback.status || 'new',
            message: feedback.message || null,
            category: feedback.category || 'general',
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist feedback in PostgreSQL:', err);
      throw err;
    }
  }

  async deleteFeedback(id: string, userId: string): Promise<boolean> {
    if (process.env.SQL_HOST && process.env.SQL_USER) {
      try {
        const { db: sqlDb } = await import('../src/db/index.ts');
        const { feedbacks: sqlFeedbacks } = await import('../src/db/schema.ts');
        const { and, eq } = await import('drizzle-orm');

        const deletedRows = await sqlDb
          .delete(sqlFeedbacks)
          .where(and(eq(sqlFeedbacks.id, id), eq(sqlFeedbacks.userId, userId)))
          .returning();

        if (deletedRows.length === 0) {
          return false;
        }

        const idx = this.feedbacks.findIndex((f) => f.id === id && f.userId === userId);
        if (idx !== -1) {
          this.feedbacks.splice(idx, 1);
        }
        return true;
      } catch (err) {
        console.warn('[Cloud SQL] Failed to delete feedback from PostgreSQL:', err);
        throw err;
      }
    }

    const idx = this.feedbacks.findIndex((f) => f.id === id && (f.userId === userId || (!f.userId && userId === 'farmer-1')));
    if (idx !== -1) {
      this.feedbacks.splice(idx, 1);
      return true;
    }
    return false;
  }

  async seedDefaultCooperatives() {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const {
        users,
        cooperatives: sqlCoops,
        cooperativeMembers: sqlCoopMembers,
        bulkInputPools: sqlBulkPools,
        bulkInputContributions: sqlBulkContribs,
        produceAggregationPools: sqlAggPools,
        producePledges: sqlProducePledges,
      } = await import('../src/db/schema.ts');

      // Ensure farmer-1 user exists
      await sqlDb.insert(users).values({
        uid: 'farmer-1',
        name: 'Musa Ibrahim',
        phone: '+234 803 123 4567',
        location: 'Kano, Nigeria',
        preferredLanguage: 'en',
        tier: 'pro',
      }).onConflictDoNothing();

      // Seed default cooperative
      await sqlDb.insert(sqlCoops).values({
        id: 'coop-kano-veg',
        name: defaultCooperative.name,
        description: 'Premier Northern vegetable aggregation & wholesale input procurement society.',
        societyNumber: defaultCooperative.societyNumber,
        zone: defaultCooperative.zone,
        totalMembers: defaultCooperative.totalMembers,
        chairperson: defaultCooperative.chairperson,
        phone: defaultCooperative.phone,
        bankAccount: defaultCooperative.bankAccount,
        creatorId: 'farmer-1',
        status: 'active',
      }).onConflictDoNothing();

      // Seed farmer-1 membership as owner
      await sqlDb.insert(sqlCoopMembers).values({
        id: 'member-farmer-1-coop-kano-veg',
        cooperativeId: 'coop-kano-veg',
        userId: 'farmer-1',
        role: 'owner',
        status: 'active',
      }).onConflictDoNothing();

      // Seed default bulk pools and farmer-1 contributions
      for (const pool of defaultBulkInputPools) {
        await sqlDb.insert(sqlBulkPools).values({
          id: pool.id,
          cooperativeId: 'coop-kano-veg',
          creatorId: 'farmer-1',
          inputName: pool.inputName,
          category: pool.category,
          unit: pool.unit,
          retailMarketPrice: pool.retailMarketPrice,
          coopBulkPrice: pool.coopBulkPrice,
          discountPercent: pool.discountPercent,
          targetQuantity: pool.targetQuantity,
          deadlineDate: pool.deadlineDate,
          status: pool.status,
          supplierName: pool.supplierName,
        }).onConflictDoNothing();

        if (pool.userPledgedQuantity > 0) {
          await sqlDb.insert(sqlBulkContribs).values({
            id: `contrib-${pool.id}-farmer-1`,
            poolId: pool.id,
            cooperativeId: 'coop-kano-veg',
            userId: 'farmer-1',
            quantity: pool.userPledgedQuantity,
            status: 'pledged',
          }).onConflictDoNothing();
        }
      }

      // Seed default aggregation pools and farmer-1 pledges
      for (const pool of defaultAggregationPools) {
        await sqlDb.insert(sqlAggPools).values({
          id: pool.id,
          cooperativeId: 'coop-kano-veg',
          creatorId: 'farmer-1',
          cropName: pool.cropName,
          offtakerName: pool.offtakerName,
          contractType: pool.contractType,
          unit: pool.unit,
          agreedFloorPricePerUnit: pool.agreedFloorPricePerUnit,
          minimumVolumeRequired: pool.minimumVolumeRequired,
          deliveryHub: pool.deliveryHub,
          cutoffDate: pool.cutoffDate,
          status: pool.status,
          termsNote: pool.termsNote,
        }).onConflictDoNothing();

        if (pool.userCommittedVolume > 0) {
          await sqlDb.insert(sqlProducePledges).values({
            id: `pledge-${pool.id}-farmer-1`,
            poolId: pool.id,
            cooperativeId: 'coop-kano-veg',
            userId: 'farmer-1',
            cropName: pool.cropName,
            pledgedVolume: pool.userCommittedVolume,
            unit: pool.unit,
            status: 'committed',
          }).onConflictDoNothing();
        }
      }
    } catch (err) {
      console.warn('[Cloud SQL] Failed to seed default cooperative data:', err);
    }
  }

  async persistCooperative(coop: CooperativeGroup) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { cooperatives: sqlCoops } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlCoops)
        .values({
          id: coop.id,
          name: coop.name,
          description: coop.description || null,
          societyNumber: coop.societyNumber || null,
          zone: coop.zone || null,
          totalMembers: coop.totalMembers || 1,
          chairperson: coop.chairperson || null,
          phone: coop.phone || null,
          bankAccount: coop.bankAccount || null,
          creatorId: coop.creatorId || 'farmer-1',
          status: coop.status || 'active',
        })
        .onConflictDoUpdate({
          target: sqlCoops.id,
          set: {
            name: coop.name,
            description: coop.description || null,
            societyNumber: coop.societyNumber || null,
            zone: coop.zone || null,
            totalMembers: coop.totalMembers || 1,
            chairperson: coop.chairperson || null,
            phone: coop.phone || null,
            bankAccount: coop.bankAccount || null,
            status: coop.status || 'active',
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist cooperative:', err);
      throw err;
    }
  }

  async persistCooperativeMember(member: CooperativeMember) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { cooperativeMembers: sqlMembers } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlMembers)
        .values({
          id: member.id,
          cooperativeId: member.cooperativeId,
          userId: member.userId,
          role: member.role || 'member',
          status: member.status || 'active',
        })
        .onConflictDoUpdate({
          target: [sqlMembers.cooperativeId, sqlMembers.userId],
          set: {
            role: member.role || 'member',
            status: member.status || 'active',
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist cooperative member:', err);
      throw err;
    }
  }

  async persistBulkInputContribution(contrib: BulkInputContribution) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { bulkInputContributions: sqlContribs } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlContribs)
        .values({
          id: contrib.id,
          poolId: contrib.poolId,
          cooperativeId: contrib.cooperativeId,
          userId: contrib.userId,
          quantity: contrib.quantity,
          status: contrib.status || 'pledged',
        })
        .onConflictDoUpdate({
          target: [sqlContribs.poolId, sqlContribs.userId],
          set: {
            quantity: contrib.quantity,
            status: contrib.status || 'pledged',
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist bulk input contribution:', err);
      throw err;
    }
  }

  async persistProducePledge(pledge: ProducePledge) {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) return;
    try {
      const { db: sqlDb } = await import('../src/db/index.ts');
      const { producePledges: sqlPledges } = await import('../src/db/schema.ts');
      await sqlDb
        .insert(sqlPledges)
        .values({
          id: pledge.id,
          poolId: pledge.poolId,
          cooperativeId: pledge.cooperativeId,
          userId: pledge.userId,
          cropName: pledge.cropName,
          pledgedVolume: pledge.pledgedVolume,
          unit: pledge.unit || 'crates',
          status: pledge.status || 'committed',
        })
        .onConflictDoUpdate({
          target: [sqlPledges.poolId, sqlPledges.userId],
          set: {
            pledgedVolume: pledge.pledgedVolume,
            status: pledge.status || 'committed',
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn('[Cloud SQL] Failed to persist produce pledge:', err);
      throw err;
    }
  }
}

export const db = new FarmPalDatabase();

