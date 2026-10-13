import { GoogleGenAI } from '@google/genai';
import { Crop, FarmerProfile } from '../src/types';

export interface FriendlyReminderTemplate {
  id: string;
  theme: 'evening_winddown' | 'harvest_market' | 'encouragement' | 'sunset_input' | 'dinner_check' | 'shoulder_tap' | 'pocket_check' | 'peace_of_mind' | 'trader_check' | 'wisdom' | 'fuel_pump' | 'credit_debt' | 'small_expenses' | 'weekend_rest' | 'pidgin_warmth' | 'hausa_warmth' | 'yoruba_warmth' | 'igbo_warmth';
  greetingTemplate: string;
  messageTemplate: string;
  suggestedQuickReplies: string[];
}

export interface GeneratedReminder {
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

// 25+ culturally authentic, warm, and highly relatable templates for Nigerian farmers
export const FRIENDLY_REMINDER_TEMPLATES: FriendlyReminderTemplate[] = [
  {
    id: 'rem-1',
    theme: 'evening_winddown',
    greetingTemplate: 'Sanu {name}! 🌾',
    messageTemplate:
      'Hope farm work went smoothly today? Just checking in before you relax: did you buy fuel, pay any labourers, or sell any crates or bags today? Even small ₦500 counts o! Drop it here make I note am.',
    suggestedQuickReplies: ['💸 Paid Labour/Fuel', '🧺 Sold Some Crates', '😴 Nothing Spent Today'],
  },
  {
    id: 'rem-2',
    theme: 'shoulder_tap',
    greetingTemplate: 'Good evening Chief {name}! 🚜',
    messageTemplate:
      'How was harvest and irrigation today? Hope your {crops} are smiling in the field! If money entered your hand or left your pocket today, don\'t let it escape memory—let\'s write it down quick quick.',
    suggestedQuickReplies: ['💸 Spent on Inputs', '🧺 Sold Harvest Today', '👍 All Quiet Today'],
  },
  {
    id: 'rem-3',
    theme: 'encouragement',
    greetingTemplate: 'Well done on today\'s hard work, {name}! 🌱',
    messageTemplate:
      'Farming under the Nigerian sun is not a joke, but your profit will show! Did you spend any kobo on seeds, fertilizer, chemicals, or transport today? Tell me, let\'s update your ledger.',
    suggestedQuickReplies: ['💸 Spent Money Today', '🧺 Made Sales Today', '🌙 Resting Tonight'],
  },
  {
    id: 'rem-4',
    theme: 'hausa_warmth',
    greetingTemplate: 'Sannu da aiki {name}! 🌿',
    messageTemplate:
      'Sunset is here and the day is done! Before farm matters fade from your head, did you pay for weeding, buy spray chemicals, or sell any produce today? Let me help you lock in your numbers.',
    suggestedQuickReplies: ['💸 Paid Workers/Transport', '🧺 Sold Produce Today', '😴 Ba komai yau (Nothing today)'],
  },
  {
    id: 'rem-5',
    theme: 'dinner_check',
    greetingTemplate: 'E kaasan Baba {name}! ☀️',
    messageTemplate:
      'Hope the afternoon heat wasn\'t too harsh on the fields. Before you sit down for evening dinner, quick 1-minute check: did you buy fuel, pay transport, or make any sales today? Let\'s keep your profit clear!',
    suggestedQuickReplies: ['💸 Paid for Fuel/Transport', '🧺 Collected Sale Cash', '✨ No Records Today'],
  },
  {
    id: 'rem-6',
    theme: 'pocket_check',
    greetingTemplate: 'Pocket check, Baba {name}! 🌾',
    messageTemplate:
      'You know how money easily disappears after a busy day on the farm. Did you pay driver transport or buy packaging crates/bags today? Let\'s write it down now so you can sleep with total peace of mind.',
    suggestedQuickReplies: ['💸 Bought Bags/Crates', '💸 Paid Driver/Labour', '😴 Nothing Spent Today'],
  },
  {
    id: 'rem-7',
    theme: 'peace_of_mind',
    greetingTemplate: 'Salama alaikum {name}! 🌙',
    messageTemplate:
      'Before you lay your head to sleep tonight, let\'s clear your mind: did you pay for pumping diesel, buy agrochemicals, or collect debt from any buyer today? Let\'s balance your farm book.',
    suggestedQuickReplies: ['💸 Paid Pumping Diesel', '💰 Collected Buyer Debt', '✨ Done for Today'],
  },
  {
    id: 'rem-8',
    theme: 'trader_check',
    greetingTemplate: 'Oga {name}! Hope market was sweet today! 🧺',
    messageTemplate:
      'Did traders or middlemen pay good prices for your {crops} today, or did you buy any farm inputs? Let\'s jot it down in 10 seconds before you forget the exact figures!',
    suggestedQuickReplies: ['🧺 Sold to Traders', '💸 Bought Farm Inputs', '👍 No Sales Today'],
  },
  {
    id: 'rem-9',
    theme: 'igbo_warmth',
    greetingTemplate: 'Nnoo farmer {name}! Daalu for today\'s hustle. 👨‍🌾',
    messageTemplate:
      'Before you rest your legs for the day, did any customer pay you or did you buy fuel for the generator? Tell me, let me balance your notebook for you!',
    suggestedQuickReplies: ['💸 Bought Fuel/Supplies', '🧺 Received Customer Payment', '😴 All Good Today'],
  },
  {
    id: 'rem-10',
    theme: 'wisdom',
    greetingTemplate: 'Evening check-in, {name}! 🚜',
    messageTemplate:
      'Remember: a farmer who writes down every kobo always knows their true profit at harvest time. Did any cash move in or out of your farm pocket today? Just one short text is all we need!',
    suggestedQuickReplies: ['💸 Recorded an Expense', '🧺 Recorded a Sale', '🌙 No Transactions Today'],
  },
  {
    id: 'rem-11',
    theme: 'fuel_pump',
    greetingTemplate: 'Sanu {name}! ⛽',
    messageTemplate:
      'Hope the irrigation pump and generator ran smoothly today without trouble! Did you buy fuel, engine oil, or pay any daily workers on the {crops} plot? Drop the amount here!',
    suggestedQuickReplies: ['💸 Bought Fuel/Oil', '💸 Paid Daily Labour', '😴 Did Not Pump Today'],
  },
  {
    id: 'rem-12',
    theme: 'credit_debt',
    greetingTemplate: 'Greetings Chief {name}! 🍅',
    messageTemplate:
      'Did any buyer take {crops} on credit today, or did someone come to settle their old balance? Or did you settle any input supplier? Let FarmPal keep your ledger 100% clean.',
    suggestedQuickReplies: ['💰 Buyer Paid Debt', '🧺 Sold on Credit', '✨ No Credit Today'],
  },
  {
    id: 'rem-13',
    theme: 'small_expenses',
    greetingTemplate: 'Hello {name}! 🌾',
    messageTemplate:
      'They say small leaks can sink a big ship—and small unrecorded ₦1,000s can eat deep into farm profits! Did you buy pure water/food for labourers, transport, or twine today? Drop it here!',
    suggestedQuickReplies: ['💸 Small Labour/Food Cost', '💸 Transport Fee', '👍 No Small Expenses'],
  },
  {
    id: 'rem-14',
    theme: 'pidgin_warmth',
    greetingTemplate: 'How body Chief {name}! 🌾',
    messageTemplate:
      'Hope body no dey pain you too much from today\'s farm work! Quick question before evening news: did you give any worker cash, or sell any farm goods today? Even 2 lines is enough, I dey here!',
    suggestedQuickReplies: ['💸 Gave Workers Cash', '🧺 Sold Some Produce', '😴 We didn\'t work today'],
  },
  {
    id: 'rem-15',
    theme: 'yoruba_warmth',
    greetingTemplate: 'E ku ise oni o, {name}! 🌿',
    messageTemplate:
      'Farming is real wealth when records are straight! Settle today\'s farm expenses or sales in your notebook before you enjoy your evening rest with family.',
    suggestedQuickReplies: ['💸 Spent on Farm Today', '🧺 Sold Produce Today', '🌙 Resting Tonight'],
  },
  {
    id: 'rem-16',
    theme: 'peace_of_mind',
    greetingTemplate: 'Peace and blessings on your household tonight, {name}! 🌟',
    messageTemplate:
      'Did you invest anything in the {crops} plot today, or did any cash come in from buyers? Tell FarmPal, your silent bookkeeper that never sleeps!',
    suggestedQuickReplies: ['💸 Invested in Plot', '🧺 Cash from Buyers', '😴 Nothing Spent Today'],
  },
  {
    id: 'rem-17',
    theme: 'sunset_input',
    greetingTemplate: 'Quick 30-second check-in, {name}! ⏱️',
    messageTemplate:
      'Did money enter or leave your hands on the farm today? Speak a voice note or type it quickly, let\'s keep your farm records ahead of the curve.',
    suggestedQuickReplies: ['🎙️ Voice Note / Text Entry', '🧺 Sold Harvest', '✨ All Done for Today'],
  },
  {
    id: 'rem-18',
    theme: 'harvest_market',
    greetingTemplate: 'Good evening {name}! 🧺',
    messageTemplate:
      'How was the harvest yield today? Did you load any truck or bus heading to market, or pay loaders/haulage? Drop the figures so your transportation margin stays accurate!',
    suggestedQuickReplies: ['💸 Paid Loaders/Haulage', '🧺 Dispatched to Market', '😴 No Dispatch Today'],
  },
  {
    id: 'rem-19',
    theme: 'evening_winddown',
    greetingTemplate: 'Evening, my hardworking farmer {name}! 👨‍🌾',
    messageTemplate:
      'When the sun goes down, FarmPal comes in to help you rest easy. Did you buy any agro-inputs, seeds, or make sales today? Let\'s balance the book in one tap!',
    suggestedQuickReplies: ['💸 Bought Inputs', '🧺 Made Sales', '👍 Nothing to Record'],
  },
  {
    id: 'rem-20',
    theme: 'wisdom',
    greetingTemplate: 'Salama {name}! 🌽',
    messageTemplate:
      'A true commercial farmer doesn\'t guess their profit—they track it daily! Did you pay any weeding boys or buy fuel for your generator today? Tell me now before you sleep.',
    suggestedQuickReplies: ['💸 Paid Weeding Boys', '💸 Bought Fuel', '🌙 No Expenses Today'],
  },
  {
    id: 'rem-21',
    theme: 'hausa_warmth',
    greetingTemplate: 'Barka da yamma {name}! 🌅',
    messageTemplate:
      'Another productive day on the soil! Did you buy any bags of NPK/Urea, or sell any harvested baskets today? Let FarmPal write it down for you.',
    suggestedQuickReplies: ['💸 Bought Fertilizer', '🧺 Sold Baskets/Crates', '😴 Ba komai yau'],
  },
  {
    id: 'rem-22',
    theme: 'encouragement',
    greetingTemplate: 'Chief {name}, salute on today\'s hustle! 🌾',
    messageTemplate:
      'Farming takes heart and grit! Before today\'s activities slip away, did you spend on repairs, fuel, or receive payment from any market women? Drop it here!',
    suggestedQuickReplies: ['💸 Repairs or Fuel', '🧺 Payment from Buyers', '✨ All Quiet Today'],
  },
  {
    id: 'rem-23',
    theme: 'dinner_check',
    greetingTemplate: 'Good day {name}! 🍽️',
    messageTemplate:
      'Dinner is almost ready! Before you drop your phone, did you spend any cash on your {crops} today, or sell any portion of your harvest? Let\'s keep your farm accounts spotless!',
    suggestedQuickReplies: ['💸 Spent on Crops', '🧺 Sold Portion of Harvest', '🌙 Rest Time'],
  },
  {
    id: 'rem-24',
    theme: 'small_expenses',
    greetingTemplate: 'Evening Musa! 💰',
    messageTemplate:
      'Did you pay any dispatch riders, loading boys, or gate fees at the market today? Every small payment matters for your real profit! Tell FarmPal now.',
    suggestedQuickReplies: ['💸 Paid Loading/Gate Fee', '💸 Paid Dispatch/Transport', '👍 No Fees Today'],
  },
  {
    id: 'rem-25',
    theme: 'shoulder_tap',
    greetingTemplate: 'Hello {name}! 🌿',
    messageTemplate:
      'Your farm notebook is checking in! Did you spray any insect protection, apply fertilizer, or sell produce today? Type or speak it here in 5 seconds!',
    suggestedQuickReplies: ['💸 Sprayed / Applied Inputs', '🧺 Sold Produce Today', '😴 Resting Today'],
  },
];

// In-memory tracker for recently served reminder IDs to guarantee rotation
const recentReminderIds: string[] = [];
const MAX_RECENT_TRACKED = 8;

export function getNextReminderTemplate(farmerName: string, recentList?: string[]): FriendlyReminderTemplate {
  const tracker = recentList && recentList.length > 0 ? recentList : recentReminderIds;

  // Filter out recently used templates so it's always different every other time
  const eligible = FRIENDLY_REMINDER_TEMPLATES.filter((t) => !tracker.includes(t.id));
  const pool = eligible.length > 0 ? eligible : FRIENDLY_REMINDER_TEMPLATES;

  // Pick random from eligible pool
  const chosenIndex = Math.floor(Math.random() * pool.length);
  const chosen = pool[chosenIndex];

  // Update recent tracker
  recentReminderIds.push(chosen.id);
  if (recentReminderIds.length > MAX_RECENT_TRACKED) {
    recentReminderIds.shift();
  }

  return chosen;
}

export function formatFarmerFirstName(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'Farmer';
  const parts = fullName.trim().split(/\s+/);
  return parts[0];
}

export function formatCropsList(crops: Crop[]): string {
  const active = crops.filter((c) => c.status === 'active');
  if (active.length === 0) return 'crops';
  if (active.length === 1) return active[0].name;
  if (active.length === 2) return `${active[0].name} and ${active[1].name}`;
  return `${active[0].name}, ${active[1].name} and ${active[2].name}`;
}

let lastGeminiReminderErrorTime = 0;
const GEMINI_COOLDOWN_MS = 60 * 1000; // 60s cooldown on temporary high demand / quota spike

export async function generateFriendlyDailyReminder(
  profile: FarmerProfile,
  crops: Crop[],
  options?: {
    forceNew?: boolean;
    channel?: 'whatsapp' | 'in_app' | 'both';
    customHour?: string;
  }
): Promise<GeneratedReminder> {
  const firstName = formatFarmerFirstName(profile.name);
  const cropsText = formatCropsList(crops);
  const activeCropNames = crops.filter((c) => c.status === 'active').map((c) => c.name);

  // Check if Gemini API can create an ultra-dynamic contextual reminder
  const nowMs = Date.now();
  const isCoolingDown = (nowMs - lastGeminiReminderErrorTime) < GEMINI_COOLDOWN_MS;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !isCoolingDown && Math.random() > 0.4) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const prompt = `You are FarmPal, an empathetic, warm, and friendly Nigerian farm notebook assistant.
Generate a DAILY EVENING REMINDER for a farmer named "${firstName}" who grows: [${cropsText}].
Location: ${profile.location || 'Kano, Nigeria'}.
Goal: Remind the farmer to record today's expenses (e.g. fuel, labour, fertilizer, chemicals, transport) or sales (crates/bags sold, cash collected, credit to buyers).

Rules:
1. Tone must be exceptionally friendly, warm, respectful, culturally relatable to a Nigerian farmer (e.g., using natural greetings like "Sanu", "E kaasan", "Well done on today's hustle", "Pocket check Chief", "Hope the sun wasn't too harsh").
2. DO NOT sound like a corporate robot or dry accounting software. Sound like a caring farm friend.
3. Keep the body text between 30 and 45 words.
4. Output ONLY JSON:
{
  "greeting": "string (e.g. 'Sanu Musa! 🌾' or 'Good evening Chief Musa! 🚜')",
  "headline": "string (e.g. 'Evening Farm Check-in 🌾')",
  "message": "string (the friendly prompt text)",
  "quickReplies": ["3 short pill strings for 1-tap quick replies, e.g. ['💸 Spent on Labour/Fuel', '🧺 Sold Harvest Today', '😴 Nothing Spent Today']"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.message && parsed.greeting) {
          const now = new Date();
          return {
            id: `ai-rem-${Date.now()}`,
            theme: 'ai_custom',
            headline: parsed.headline || 'Daily Farm Check-in 🌾',
            greeting: parsed.greeting,
            message: parsed.message,
            time: options?.customHour || profile.dailyReminderTime || '19:00',
            timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: parsed.quickReplies || ['💸 Spent on Labour/Fuel', '🧺 Sold Some Crates', '😴 Nothing Spent Today'],
            farmerName: firstName,
            cropsMentioned: activeCropNames,
            source: 'ai',
          };
        }
      }
    } catch {
      // Record backoff timestamp and seamlessly fall through to the curated template
      lastGeminiReminderErrorTime = Date.now();
    }
  }

  // Pick from our rich, curated, non-repeating rotating pool
  const template = getNextReminderTemplate(firstName);

  const greeting = template.greetingTemplate.replace('{name}', firstName);
  const message = template.messageTemplate
    .replace('{name}', firstName)
    .replace('{crops}', cropsText);

  const now = new Date();
  const timeStr = options?.customHour || profile.dailyReminderTime || '19:00';

  return {
    id: `${template.id}-${Date.now()}`,
    theme: template.theme,
    headline: 'Daily Farm Check-in 🌾',
    greeting,
    message,
    time: timeStr,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickReplies: template.suggestedQuickReplies,
    farmerName: firstName,
    cropsMentioned: activeCropNames,
    source: 'curated_pool',
  };
}
