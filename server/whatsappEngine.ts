import { GoogleGenAI } from '@google/genai';
import { db } from './store';
import { Crop, Expense, SaleRecord, HarvestRecord } from '../src/types';

interface ParsedExpenseItem {
  category: string;
  amount: number;
  description?: string;
  cropName?: string;
}

interface ParsedNLUResult {
  intent: 'expense' | 'sale' | 'harvest' | 'labour' | 'debt_payment' | 'market_price' | 'budget' | 'calendar' | 'weather' | 'loan' | 'inventory' | 'cooperative' | 'reminder_ack' | 'query' | 'help' | 'unknown';
  confidence: number;
  cropQuery?: string;
  marketQuery?: string;
  expenses?: ParsedExpenseItem[];
  sale?: {
    cropName?: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalAmount?: number;
    buyer?: string;
    isCredit?: boolean;
  };
  debtPayment?: {
    buyerName: string;
    amountPaid: number;
  };
  harvest?: {
    cropName?: string;
    quantity: number;
    unit: string;
  };
  sharedCropNames?: string[];
  date?: string; // YYYY-MM-DD
  rawSummary?: string;
  clarificationPrompt?: string;
}

// Heuristic fallback parser that parses typical Nigerian farmer phrases:
// "20k", "15 thousand", "₦40,000", "5k on fuel", "sold 15 crates of tomato at 8k"
export function fallbackRuleParser(text: string, activeCrops: Crop[]): ParsedNLUResult {
  const lower = text.toLowerCase().trim();

  // 0a. Check for Market Price inquiries: e.g. "what is market price of tomato", "price of pepper in lagos", "horti nigeria prices"
  if (
    lower.includes('market price') ||
    lower.includes('price of') ||
    lower.includes('how much is tomato') ||
    lower.includes('how much is cucumber') ||
    lower.includes('how much is sweetcorn') ||
    lower.includes('how much is pepper') ||
    lower.includes('how much is onion') ||
    lower.includes('how much is cabbage') ||
    lower.includes('how much are they buying') ||
    lower.includes('selling price in') ||
    lower.includes('market benchmark') ||
    lower.includes('horti') ||
    lower.includes('ola of north') ||
    lower.includes('olaofnorth') ||
    (lower.startsWith('price') && lower.length < 35)
  ) {
    let cropName = 'Tomato';
    if (lower.includes('pepper') || lower.includes('rodo') || lower.includes('shambo') || lower.includes('tatase')) {
      cropName = 'Pepper (Ata Rodo)';
    } else if (lower.includes('onion')) {
      cropName = 'Onions';
    } else if (lower.includes('cabbage')) {
      cropName = 'Cabbage';
    } else if (lower.includes('cucumber')) {
      cropName = 'Cucumber';
    } else if (lower.includes('corn') || lower.includes('maize')) {
      cropName = 'Sweetcorn';
    } else if (lower.includes('tomato')) {
      cropName = 'Tomato';
    }

    let market = 'all';
    if (lower.includes('lagos') || lower.includes('mile 12')) market = 'Lagos (Mile 12)';
    else if (lower.includes('kano') || lower.includes('dawanau')) market = 'Kano (Dawanau)';
    else if (lower.includes('kaduna') || lower.includes('makarfi')) market = 'Kaduna (Makarfi)';
    else if (lower.includes('ibadan') || lower.includes('bodija')) market = 'Ibadan (Bodija)';
    else if (lower.includes('jos')) market = 'Jos (Farin Gada)';
    else if (lower.includes('onitsha')) market = 'Onitsha (Ogbaru)';

    return {
      intent: 'market_price',
      confidence: 0.95,
      cropQuery: cropName,
      marketQuery: market,
    };
  }

  // 0b. Check for Budget / Cost Target inquiries: e.g. "am I on budget for tomato", "how much budget left", "burn rate"
  if (
    lower.includes('on budget') ||
    lower.includes('budget left') ||
    lower.includes('my budget') ||
    lower.includes('budget for') ||
    lower.includes('burn rate') ||
    lower.includes('cost limit')
  ) {
    let cropName = activeCrops[0]?.name || 'Tomato';
    for (const c of activeCrops) {
      if (lower.includes(c.name.toLowerCase())) {
        cropName = c.name;
        break;
      }
    }
    return {
      intent: 'budget',
      confidence: 0.93,
      cropQuery: cropName,
    };
  }

  // 0c. Check for Agronomic Calendar & Task inquiries: e.g. "what is next task", "growth stage of tomato", "crop calendar"
  if (
    lower.includes('next task') ||
    lower.includes('growth stage') ||
    lower.includes('calendar') ||
    lower.includes('milestone') ||
    lower.includes('what should i do on') ||
    lower.includes('when to apply fertilizer') ||
    lower.includes('when to harvest')
  ) {
    let cropName = activeCrops[0]?.name || 'Tomato';
    for (const c of activeCrops) {
      if (lower.includes(c.name.toLowerCase())) {
        cropName = c.name;
        break;
      }
    }
    return {
      intent: 'calendar',
      confidence: 0.9,
      cropQuery: cropName,
    };
  }

  // 0d. Check for Weather & Spray advisory inquiries: e.g. "weather forecast", "will it rain", "can i spray tomato"
  if (
    lower.includes('weather') ||
    lower.includes('forecast') ||
    lower.includes('will it rain') ||
    lower.includes('can i spray') ||
    lower.includes('rain today') ||
    lower.includes('climate') ||
    lower.includes('temperature today')
  ) {
    return {
      intent: 'weather',
      confidence: 0.92,
    };
  }

  // 0e. Check for Agri-Credit & Loan inquiries: e.g. "am i eligible for loan", "my credit score", "qualify for loan"
  if (
    lower.includes('loan') ||
    lower.includes('credit score') ||
    lower.includes('credit rating') ||
    lower.includes('borrow money') ||
    lower.includes('bank finance') ||
    lower.includes('nirsal') ||
    lower.includes('boa loan')
  ) {
    return {
      intent: 'loan',
      confidence: 0.94,
    };
  }

  // 0f. Check for Farm Store Inventory: e.g. "how many bags of fertilizer", "check inventory", "store stock"
  if (
    lower.includes('in store') ||
    lower.includes('in stock') ||
    lower.includes('inventory') ||
    lower.includes('bags of fertilizer left') ||
    lower.includes('how much fuel do i have') ||
    lower.includes('crates left') ||
    lower.includes('stock level')
  ) {
    return {
      intent: 'inventory',
      confidence: 0.91,
    };
  }

  // 0g. Check for Cooperative & Group Aggregation: e.g. "cooperative bulk price", "group order", "off-taker pool"
  if (
    lower.includes('cooperative') ||
    lower.includes('coop') ||
    lower.includes('bulk order') ||
    lower.includes('aggregation pool') ||
    lower.includes('group buying') ||
    lower.includes('tomato jos contract')
  ) {
    return {
      intent: 'cooperative',
      confidence: 0.92,
    };
  }

  // 0h. Check for Daily Reminder Acknowledgement: e.g. "nothing today", "no expenses today", "quiet day"
  if (
    lower === 'nothing' ||
    lower.includes('nothing today') ||
    lower.includes('nothing spent') ||
    lower.includes('no expense') ||
    lower.includes('no expenses') ||
    lower.includes('no sale') ||
    lower.includes('no sales') ||
    lower.includes('did not spend') ||
    lower.includes("didn't spend") ||
    lower.includes("didn't sell") ||
    lower.includes('no money spent') ||
    lower.includes('quiet day') ||
    lower.includes('all quiet') ||
    lower.includes('rested today') ||
    lower.includes('resting today') ||
    lower.includes('we rested') ||
    lower.includes("didn't work today") ||
    lower.includes('no work today') ||
    lower.includes('ba komai yau') ||
    lower.includes('kosi nkankan') ||
    lower.includes('onwebehe ihe mere') ||
    lower.includes('nothing to record') ||
    lower.includes('done for today') ||
    lower.includes('no records today') ||
    lower.includes('all good today')
  ) {
    return {
      intent: 'reminder_ack',
      confidence: 0.96,
    };
  }

  // 0. Check for Debtor payment receipt: e.g. "Mama Chidi paid 160k", "Received 40k from Mallam Garba"
  if (
    (lower.includes('paid') || lower.includes('received')) &&
    !lower.startsWith('i paid') &&
    !lower.startsWith('i have paid') &&
    !lower.includes('for labour') &&
    !lower.includes('for fuel') &&
    !lower.includes('for fertilizer') &&
    !lower.includes('for seed') &&
    !lower.includes('on labour') &&
    !lower.includes('on fuel') &&
    !lower.includes('on fertilizer')
  ) {
    // Pattern: "[Buyer] paid 160k" or "Received 40k from [Buyer]"
    const receivedFromMatch = lower.match(/received\s+(?:₦|n)?\s*(\d+)(k|thousand)?\s+from\s+([a-zA-Z\s]+)/i);
    const buyerPaidMatch = lower.match(/([a-zA-Z\s]+)\s+paid\s+(?:₦|n)?\s*(\d+)(k|thousand)?/i);

    if (receivedFromMatch) {
      const num = parseInt(receivedFromMatch[1], 10);
      const mult = receivedFromMatch[2]?.toLowerCase() === 'k' || receivedFromMatch[2]?.toLowerCase() === 'thousand' ? 1000 : 1;
      const buyerName = receivedFromMatch[3].trim();
      return {
        intent: 'debt_payment',
        confidence: 0.92,
        debtPayment: {
          buyerName,
          amountPaid: num * mult,
        },
      };
    } else if (buyerPaidMatch) {
      const buyerName = buyerPaidMatch[1].trim();
      const num = parseInt(buyerPaidMatch[2], 10);
      const mult = buyerPaidMatch[3]?.toLowerCase() === 'k' || buyerPaidMatch[3]?.toLowerCase() === 'thousand' ? 1000 : 1;
      return {
        intent: 'debt_payment',
        confidence: 0.92,
        debtPayment: {
          buyerName,
          amountPaid: num * mult,
        },
      };
    }
  }

  // 1. Check for sales
  if (lower.includes('sold') || lower.includes('sale') || lower.includes('sell')) {
    // Look for quantity and unit: e.g. "15 crates", "40 bags"
    const qtyMatch = lower.match(/(\d+)\s*(crates?|bags?|kg|tonnes?|baskets?|pieces?)/i);
    // Look for price: "at 8k", "@ 8000", "for 8k each", or "8k each", "₦8,000 each"
    const priceMatch =
      lower.match(/(?:at|@|for)\s*(?:₦|n)?\s*(\d+)(k|thousand)?/i) ||
      lower.match(/(?:₦|n)\s*(\d+)(k|thousand)?/i) ||
      lower.match(/(\d+)\s*(?:k|thousand)(?:\s*each|\s*per)?/i);

    // Look for credit indicator
    const isCredit = lower.includes('credit') || lower.includes('on trust') || lower.includes('unpaid');

    // Look for buyer name: e.g. "to Mama Chidi", "to Alhaji Danladi"
    let buyerName: string | undefined;
    const buyerMatch = lower.match(/(?:to|buyer)\s+([a-zA-Z\s]+?)(?:\s+(?:on credit|at|for|yesterday|today)|$)/i);
    if (buyerMatch) {
      buyerName = buyerMatch[1].trim();
    }

    // Look for crop
    let matchedCrop = activeCrops.find((c) => lower.includes(c.name.toLowerCase()));

    let quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 0;
    let unit = qtyMatch ? qtyMatch[2] : 'crates';

    let price = 0;
    if (priceMatch) {
      const num = parseInt(priceMatch[1], 10);
      const mult = priceMatch[2]?.toLowerCase() === 'k' || priceMatch[2]?.toLowerCase() === 'thousand' ? 1000 : 1;
      price = num * mult;
    }

    if (quantity > 0 && price > 0) {
      return {
        intent: 'sale',
        confidence: 0.9,
        sale: {
          cropName: matchedCrop?.name,
          quantity,
          unit,
          pricePerUnit: price,
          totalAmount: quantity * price,
          buyer: buyerName,
          isCredit,
        },
      };
    }
  }

  // 2. Check for harvest
  if (lower.includes('harvest') || lower.includes('harvested') || lower.includes('picked')) {
    const qtyMatch = lower.match(/(\d+)\s*(crates?|bags?|kg|tonnes?|baskets?|pieces?)/i);
    let matchedCrop = activeCrops.find((c) => lower.includes(c.name.toLowerCase()));
    if (qtyMatch) {
      return {
        intent: 'harvest',
        confidence: 0.9,
        harvest: {
          cropName: matchedCrop?.name,
          quantity: parseInt(qtyMatch[1], 10),
          unit: qtyMatch[2],
        },
      };
    }
  }

  // 3. Check for multiple or single expenses
  // e.g., "I spent 20k on labour, 15k on fertilizer and 5k on fuel today"
  // e.g., "spent 40k on fertilizer for tomato", "spent 15000 on weeding"
  const categoryKeywords: { category: string; keywords: string[] }[] = [
    { category: 'Fertilizer', keywords: ['fertilizer', 'fertiliser', 'urea', 'npk', 'dap', 'manure', 'compost', 'foliar', 'potash'] },
    { category: 'Labour', keywords: ['labour', 'labor', 'weeding', 'clearing', 'workers', 'harvesters', 'planting', 'spraying', 'labourers', 'laborers', 'tillage', 'ridging', 'harvesting', 'harvest'] },
    { category: 'Fuel', keywords: ['fuel', 'diesel', 'petrol', 'generator', 'gasoline', 'oil'] },
    { category: 'Seeds', keywords: ['seeds', 'seedlings', 'seedling', 'hybrid', 'cobra', 'f1', 'cuttings', 'suckers'] },
    { category: 'Chemicals', keywords: ['chemical', 'chemicals', 'pesticide', 'pesticides', 'insecticide', 'insecticides', 'fungicide', 'fungicides', 'herbicide', 'herbicides', 'weedicide', 'spray', 'spraying', 'gamalin', 'sniper', 'karate', 'ddforce'] },
    { category: 'Transport', keywords: ['transport', 'freight', 'haulage', 'logistics', 'waybill', 'delivery', 'driver', 'carriage', 'transit'] },
    { category: 'Irrigation', keywords: ['irrigation', 'watering', 'water', 'pump', 'drip', 'hose', 'pipe', 'pipes', 'sprinkler', 'borehole'] },
    { category: 'Machinery/equipment', keywords: ['machinery', 'tractor', 'ploughing', 'plowing', 'harrowing', 'rotavator', 'thresher', 'equipment', 'tools', 'knapsack', 'repairs'] },
    { category: 'Packaging', keywords: ['packaging', 'crates', 'crate', 'sacks', 'sack', 'bags', 'bag', 'cartons', 'carton', 'ropes', 'baskets', 'basket'] },
    { category: 'Land', keywords: ['land', 'rent', 'lease', 'survey'] },
  ];

  const expensesFound: ParsedExpenseItem[] = [];

  // Match items like "20k on labour", "15k on fertilizer", "bought fertilizer for 35k"
  // Split on comma, "and", "&"
  const segments = lower.split(/,|and|&|\n/).map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    let matchedCat: string | undefined;
    for (const group of categoryKeywords) {
      if (group.keywords.some((kw) => seg.includes(kw))) {
        matchedCat = group.category;
        break;
      }
    }

    // Check if a specific crop was mentioned in this segment or overall text
    let targetCropName: string | undefined;
    for (const c of activeCrops) {
      if (seg.includes(c.name.toLowerCase()) || lower.includes(`for ${c.name.toLowerCase()}`) || lower.includes(`on ${c.name.toLowerCase()}`)) {
        targetCropName = c.name;
        break;
      }
    }

    // Extract amount: e.g. "20k", "20,000", "20000", "20 thousand", "₦15,000"
    const amtMatch = seg.match(/(?:₦|n|ngn)?\s*(\d+(?:,\d{3})*|\d+)\s*(k|thousand)?/i);
    if (amtMatch) {
      let rawNum = parseInt(amtMatch[1].replace(/,/g, ''), 10);
      let multiplier = 1;
      if (amtMatch[2]?.toLowerCase() === 'k' || amtMatch[2]?.toLowerCase() === 'thousand') {
        multiplier = 1000;
      }
      const amount = rawNum * multiplier;

      if (amount > 0 && amount < 100000000) {
        expensesFound.push({
          category: matchedCat || 'Other',
          amount,
          description: seg,
          cropName: targetCropName,
        });
      }
    }
  }

  // Check if multiple crops mentioned (shared expense)
  const mentionedCrops = activeCrops.filter((c) => lower.includes(c.name.toLowerCase()));

  if (expensesFound.length > 0) {
    return {
      intent: 'expense',
      confidence: 0.88,
      expenses: expensesFound,
      sharedCropNames: mentionedCrops.length > 1 ? mentionedCrops.map((c) => c.name) : undefined,
    };
  }

  // Check for simple amount with missing category
  const simpleAmt = lower.match(/(?:spent|paid)\s*(?:₦|n)?\s*(\d+)(k|thousand)?/i);
  if (simpleAmt) {
    const rawNum = parseInt(simpleAmt[1], 10);
    const mult = simpleAmt[2]?.toLowerCase() === 'k' ? 1000 : 1;
    return {
      intent: 'expense',
      confidence: 0.5,
      expenses: [{ category: 'Unknown', amount: rawNum * mult }],
      clarificationPrompt: `I understood the amount as ₦${(rawNum * mult).toLocaleString('en-NG')}, but I'm not sure what you spent it on.\n\nWas it:\n1. Labour\n2. Fertilizer\n3. Fuel\n4. Seeds\n5. Something else?`,
    };
  }

  return {
    intent: 'unknown',
    confidence: 0.2,
    clarificationPrompt: `I didn't quite catch that. You can tell me things like:\n• "I spent 20k on labour today"\n• "I spent 15k on fertilizer and 5k on fuel"\n• "Sold 20 crates of tomato at 8k each"\n• "Harvested 40 bags of cucumber"`,
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let lastGeminiNluErrorTime = 0;
const NLU_COOLDOWN_MS = 60 * 1000;

// Parse using Gemini if GEMINI_API_KEY is available, otherwise seamless rule-based fallback
export async function parseFarmerMessage(text: string, activeCrops: Crop[]): Promise<ParsedNLUResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isCoolingDown = (Date.now() - lastGeminiNluErrorTime) < NLU_COOLDOWN_MS;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || isCoolingDown) {
    return fallbackRuleParser(text, activeCrops);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const cropNames = activeCrops.map((c) => c.name).join(', ');
    const systemPrompt = `You are FarmPal's NLU engine. Your job is to extract structured farm data from natural language messages by Nigerian farmers.
Active crops on this farm: [${cropNames}].
Today's date is: ${new Date().toISOString().split('T')[0]}.

Categories: Seeds, Seedlings, Land, Labour, Fertilizer, Chemicals, Irrigation, Fuel, Transport, Machinery/equipment, Packaging, Harvesting, Other.
Note: "k" means thousands (e.g. 20k = 20000). Currency is Nigerian Naira (₦).

Output ONLY JSON matching this format:
{
  "intent": "expense" | "sale" | "harvest" | "labour" | "help" | "unknown",
  "confidence": 0.0 to 1.0,
  "expenses": [
    { "category": "Labour", "amount": 20000, "description": "labour today", "cropName": "Tomato" }
  ],
  "sale": {
    "cropName": "Tomato",
    "quantity": 15,
    "unit": "crates",
    "pricePerUnit": 8000,
    "totalAmount": 120000,
    "buyer": "optional"
  },
  "harvest": {
    "cropName": "Cucumber",
    "quantity": 40,
    "unit": "bags"
  },
  "sharedCropNames": ["Tomato", "Cucumber"], // if an expense applies to multiple crops
  "clarificationPrompt": "string if confidence is low or missing info"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nFarmer message: "${text}"` }] },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim();
    if (jsonText) {
      const parsed = JSON.parse(jsonText) as ParsedNLUResult;
      return parsed;
    }
  } catch {
    lastGeminiNluErrorTime = Date.now();
  }

  return fallbackRuleParser(text, activeCrops);
}

// Check for duplicates recorded today
export function checkDuplicateExpense(categoryName: string, amount: number): Expense | undefined {
  const today = new Date().toISOString().split('T')[0];
  return db.expenses.find(
    (e) =>
      e.categoryName.toLowerCase() === categoryName.toLowerCase() &&
      Math.abs(e.totalAmount - amount) < 1 &&
      e.expenseDate === today
  );
}

export function formatNairaNumber(num: number): string {
  return '₦' + Math.round(num).toLocaleString('en-NG');
}
