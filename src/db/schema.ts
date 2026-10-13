import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ======================== USERS TABLE ========================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email'),
  name: text('name').notNull(),
  phone: text('phone'),
  location: text('location'),
  preferredLanguage: text('preferred_language').default('en'),
  theme: text('theme').default('system'),
  dailyReminderEnabled: boolean('daily_reminder_enabled').default(true),
  dailyReminderTime: text('daily_reminder_time').default('19:00'),
  reminderChannel: text('reminder_channel').default('both'),
  tier: text('tier').default('free'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== CROPS TABLE ========================
export const crops = pgTable('crops', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  variety: text('variety'),
  plantingDate: text('planting_date').notNull(), // YYYY-MM-DD
  farmSizeAcres: doublePrecision('farm_size_acres').notNull().default(1.0),
  status: text('status').notNull().default('active'), // 'active' | 'finished'
  finishedDate: text('finished_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== CATEGORIES TABLE ========================
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isDefault: boolean('is_default').default(true),
});

// ======================== EXPENSES TABLE ========================
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  categoryId: text('category_id').notNull(),
  categoryName: text('category_name').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  expenseDate: text('expense_date').notNull(), // YYYY-MM-DD
  description: text('description'),
  isShared: boolean('is_shared').default(false),
  allocations: jsonb('allocations'), // Array of { cropId, cropName, percentage, allocatedAmount }
  source: text('source').default('web'), // 'web' | 'whatsapp' | 'ussd' | 'voice'
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== SALES TABLE ========================
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cropId: text('crop_id').notNull(),
  cropName: text('crop_name').notNull(),
  saleDate: text('sale_date').notNull(), // YYYY-MM-DD
  quantitySold: doublePrecision('quantity_sold').notNull(),
  unit: text('unit').notNull(), // 'crates' | 'bags' | 'kg'
  pricePerUnit: doublePrecision('price_per_unit').notNull(),
  totalRevenue: doublePrecision('total_revenue').notNull(),
  buyerName: text('buyer_name'),
  paymentStatus: text('payment_status').notNull().default('paid'), // 'paid' | 'credit' | 'partial'
  amountPaid: doublePrecision('amount_paid').notNull().default(0),
  amountDue: doublePrecision('amount_due').notNull().default(0),
  dueDate: text('due_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== DEBTOR PAYMENTS TABLE ========================
export const debtorPayments = pgTable('debtor_payments', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull(),
  paymentDate: text('payment_date').notNull(),
  amount: doublePrecision('amount').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== HARVESTS TABLE ========================
export const harvests = pgTable('harvests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cropId: text('crop_id').notNull(),
  cropName: text('crop_name').notNull(),
  harvestDate: text('harvest_date').notNull(),
  quantityHarvested: doublePrecision('quantity_harvested').notNull(),
  unit: text('unit').notNull(),
  qualityGrade: text('quality_grade'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== LABOUR RECORDS TABLE ========================
export const labourRecords = pgTable('labour_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cropId: text('crop_id'),
  cropName: text('crop_name'),
  workDate: text('work_date').notNull(),
  taskType: text('task_type').notNull(),
  workerCount: integer('worker_count').notNull().default(1),
  dailyRatePerWorker: doublePrecision('daily_rate_per_worker').notNull(),
  totalPaid: doublePrecision('total_paid').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ======================== FARM INVENTORY TABLE ========================
export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  currentQuantity: doublePrecision('current_quantity').notNull().default(0),
  unit: text('unit').notNull(),
  reorderThreshold: doublePrecision('reorder_threshold').notNull().default(0),
  estimatedUnitValue: doublePrecision('estimated_unit_value').notNull().default(0),
  storageLocation: text('storage_location').notNull().default('Main Farm Storehouse'),
  lastRestocked: text('last_restocked').notNull(),
  status: text('status').notNull().default('sufficient'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ======================== PLANNING TASKS TABLE ========================
export const planningTasks = pgTable('planning_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cropId: text('crop_id').notNull(),
  cropName: text('crop_name').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull().default('Labour'),
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  completed: boolean('completed').notNull().default(false),
  completedDate: text('completed_date'),
  estimatedCost: doublePrecision('estimated_cost'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ======================== CROP PRODUCTION BUDGETS TABLE ========================
export const cropBudgets = pgTable(
  'crop_budgets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    cropId: text('crop_id').notNull(),
    targetYieldQuantity: doublePrecision('target_yield_quantity').notNull().default(100),
    targetYieldUnit: text('target_yield_unit').notNull().default('units'),
    targetSellingPricePerUnit: doublePrecision('target_selling_price_per_unit').notNull().default(5000),
    categoryAllocations: jsonb('category_allocations').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    userCropIdx: uniqueIndex('crop_budgets_user_crop_idx').on(t.userId, t.cropId),
  })
);

// ======================== FARMER FEEDBACKS TABLE ========================
export const feedbacks = pgTable(
  'feedbacks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    farmerName: text('farmer_name').notNull(),
    phoneOrEmail: text('phone_or_email'),
    farmLocation: text('farm_location').notNull(),
    primaryCrops: text('primary_crops'),
    rating: integer('rating').notNull(),
    testedFeatures: jsonb('tested_features'),
    easeOfUseRating: text('ease_of_use_rating'),
    clarityOfLanguage: text('clarity_of_language'),
    nairaAndUnitsMatch: text('naira_and_units_match'),
    whatWorkedWell: text('what_worked_well'),
    whatWasConfusing: text('what_was_confusing'),
    desiredNextFeature: text('desired_next_feature'),
    deviceType: text('device_type'),
    audioNoteTranscript: text('audio_note_transcript'),
    status: text('status').notNull().default('new'),
    message: text('message'),
    category: text('category').notNull().default('general'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('feedbacks_user_id_idx').on(t.userId),
    createdAtIdx: index('feedbacks_created_at_idx').on(t.createdAt),
  })
);

// ======================== COOPERATIVES TABLES ========================

export const cooperatives = pgTable(
  'cooperatives',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    societyNumber: text('society_number'),
    zone: text('zone'),
    totalMembers: integer('total_members').default(1),
    chairperson: text('chairperson'),
    phone: text('phone'),
    bankAccount: text('bank_account'),
    creatorId: text('creator_id').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    creatorIdIdx: index('cooperatives_creator_id_idx').on(t.creatorId),
  })
);

export const cooperativeMembers = pgTable(
  'cooperative_members',
  {
    id: text('id').primaryKey(),
    cooperativeId: text('cooperative_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'member'
    status: text('status').notNull().default('active'),
    joinedAt: timestamp('joined_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    coopUserUniqueIdx: uniqueIndex('cooperative_members_coop_user_idx').on(t.cooperativeId, t.userId),
    coopIdIdx: index('cooperative_members_coop_id_idx').on(t.cooperativeId),
    userIdIdx: index('cooperative_members_user_id_idx').on(t.userId),
  })
);

export const bulkInputPools = pgTable(
  'bulk_input_pools',
  {
    id: text('id').primaryKey(),
    cooperativeId: text('cooperative_id').notNull(),
    creatorId: text('creator_id').notNull(),
    inputName: text('input_name').notNull(),
    category: text('category').notNull().default('Fertilizer'),
    unit: text('unit').notNull().default('bags'),
    retailMarketPrice: doublePrecision('retail_market_price').notNull().default(0),
    coopBulkPrice: doublePrecision('coop_bulk_price').notNull().default(0),
    discountPercent: doublePrecision('discount_percent').notNull().default(0),
    targetQuantity: doublePrecision('target_quantity').notNull().default(0),
    deadlineDate: text('deadline_date').notNull(),
    status: text('status').notNull().default('open'),
    supplierName: text('supplier_name'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    coopIdIdx: index('bulk_input_pools_coop_id_idx').on(t.cooperativeId),
  })
);

export const bulkInputContributions = pgTable(
  'bulk_input_contributions',
  {
    id: text('id').primaryKey(),
    poolId: text('pool_id').notNull(),
    cooperativeId: text('cooperative_id').notNull(),
    userId: text('user_id').notNull(),
    quantity: doublePrecision('quantity').notNull().default(0),
    status: text('status').notNull().default('pledged'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    poolUserUniqueIdx: uniqueIndex('bulk_input_contrib_pool_user_idx').on(t.poolId, t.userId),
    poolIdIdx: index('bulk_input_contrib_pool_id_idx').on(t.poolId),
    userIdIdx: index('bulk_input_contrib_user_id_idx').on(t.userId),
  })
);

export const produceAggregationPools = pgTable(
  'produce_aggregation_pools',
  {
    id: text('id').primaryKey(),
    cooperativeId: text('cooperative_id').notNull(),
    creatorId: text('creator_id').notNull(),
    cropName: text('crop_name').notNull(),
    offtakerName: text('offtaker_name').notNull(),
    contractType: text('contract_type').notNull().default('Wholesale Aggregation'),
    unit: text('unit').notNull().default('crates'),
    agreedFloorPricePerUnit: doublePrecision('agreed_floor_price_per_unit').notNull().default(0),
    minimumVolumeRequired: doublePrecision('minimum_volume_required').notNull().default(0),
    deliveryHub: text('delivery_hub').notNull(),
    cutoffDate: text('cutoff_date').notNull(),
    status: text('status').notNull().default('collecting'),
    termsNote: text('terms_note'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    coopIdIdx: index('produce_agg_pools_coop_id_idx').on(t.cooperativeId),
  })
);

export const producePledges = pgTable(
  'produce_pledges',
  {
    id: text('id').primaryKey(),
    poolId: text('pool_id').notNull(),
    cooperativeId: text('cooperative_id').notNull(),
    userId: text('user_id').notNull(),
    cropName: text('crop_name').notNull(),
    pledgedVolume: doublePrecision('pledged_volume').notNull().default(0),
    unit: text('unit').notNull().default('crates'),
    status: text('status').notNull().default('committed'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    poolUserUniqueIdx: uniqueIndex('produce_pledges_pool_user_idx').on(t.poolId, t.userId),
    poolIdIdx: index('produce_pledges_pool_id_idx').on(t.poolId),
    userIdIdx: index('produce_pledges_user_id_idx').on(t.userId),
  })
);

// ======================== RELATIONS ========================
export const usersRelations = relations(users, ({ many }) => ({
  crops: many(crops),
  expenses: many(expenses),
  sales: many(sales),
  harvests: many(harvests),
  labourRecords: many(labourRecords),
  inventoryItems: many(inventoryItems),
  planningTasks: many(planningTasks),
  cropBudgets: many(cropBudgets),
  feedbacks: many(feedbacks),
  cooperativeMembers: many(cooperativeMembers),
  bulkInputContributions: many(bulkInputContributions),
  producePledges: many(producePledges),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  user: one(users, {
    fields: [inventoryItems.userId],
    references: [users.uid],
  }),
}));

export const planningTasksRelations = relations(planningTasks, ({ one }) => ({
  user: one(users, {
    fields: [planningTasks.userId],
    references: [users.uid],
  }),
  crop: one(crops, {
    fields: [planningTasks.cropId],
    references: [crops.id],
  }),
}));

export const cropBudgetsRelations = relations(cropBudgets, ({ one }) => ({
  user: one(users, {
    fields: [cropBudgets.userId],
    references: [users.uid],
  }),
  crop: one(crops, {
    fields: [cropBudgets.cropId],
    references: [crops.id],
  }),
}));

export const cropsRelations = relations(crops, ({ one, many }) => ({
  user: one(users, {
    fields: [crops.userId],
    references: [users.uid],
  }),
  sales: many(sales),
  harvests: many(harvests),
  planningTasks: many(planningTasks),
  cropBudgets: many(cropBudgets),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  crop: one(crops, {
    fields: [sales.cropId],
    references: [crops.id],
  }),
  payments: many(debtorPayments),
}));

export const debtorPaymentsRelations = relations(debtorPayments, ({ one }) => ({
  sale: one(sales, {
    fields: [debtorPayments.saleId],
    references: [sales.id],
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.uid],
  }),
}));

export const cooperativesRelations = relations(cooperatives, ({ one, many }) => ({
  creator: one(users, {
    fields: [cooperatives.creatorId],
    references: [users.uid],
  }),
  members: many(cooperativeMembers),
  bulkInputPools: many(bulkInputPools),
  produceAggregationPools: many(produceAggregationPools),
}));

export const cooperativeMembersRelations = relations(cooperativeMembers, ({ one }) => ({
  cooperative: one(cooperatives, {
    fields: [cooperativeMembers.cooperativeId],
    references: [cooperatives.id],
  }),
  user: one(users, {
    fields: [cooperativeMembers.userId],
    references: [users.uid],
  }),
}));

export const bulkInputPoolsRelations = relations(bulkInputPools, ({ one, many }) => ({
  cooperative: one(cooperatives, {
    fields: [bulkInputPools.cooperativeId],
    references: [cooperatives.id],
  }),
  creator: one(users, {
    fields: [bulkInputPools.creatorId],
    references: [users.uid],
  }),
  contributions: many(bulkInputContributions),
}));

export const bulkInputContributionsRelations = relations(bulkInputContributions, ({ one }) => ({
  pool: one(bulkInputPools, {
    fields: [bulkInputContributions.poolId],
    references: [bulkInputPools.id],
  }),
  cooperative: one(cooperatives, {
    fields: [bulkInputContributions.cooperativeId],
    references: [cooperatives.id],
  }),
  user: one(users, {
    fields: [bulkInputContributions.userId],
    references: [users.uid],
  }),
}));

export const produceAggregationPoolsRelations = relations(produceAggregationPools, ({ one, many }) => ({
  cooperative: one(cooperatives, {
    fields: [produceAggregationPools.cooperativeId],
    references: [cooperatives.id],
  }),
  creator: one(users, {
    fields: [produceAggregationPools.creatorId],
    references: [users.uid],
  }),
  pledges: many(producePledges),
}));

export const producePledgesRelations = relations(producePledges, ({ one }) => ({
  pool: one(produceAggregationPools, {
    fields: [producePledges.poolId],
    references: [produceAggregationPools.id],
  }),
  cooperative: one(cooperatives, {
    fields: [producePledges.cooperativeId],
    references: [cooperatives.id],
  }),
  user: one(users, {
    fields: [producePledges.userId],
    references: [users.uid],
  }),
}));


