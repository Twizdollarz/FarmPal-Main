import { Language } from '../types';

export interface Translations {
  moneySpent: string;
  moneyEarned: string;
  profit: string;
  loss: string;
  crops: string;
  myCrops: string;
  activeCrops: string;
  finishedCrops: string;
  harvest: string;
  labour: string;
  sales: string;
  expenses: string;
  sharedExpense: string;
  addExpense: string;
  addSale: string;
  addHarvest: string;
  addLabour: string;
  newCrop: string;
  amount: string;
  date: string;
  category: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  buyer: string;
  workType: string;
  workerCount: string;
  dailyReminder: string;
  smartInsights: string;
  save: string;
  cancel: string;
  confirm: string;
  today: string;
  currencySymbol: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    moneySpent: 'Money Spent',
    moneyEarned: 'Money Earned',
    profit: 'Profit',
    loss: 'Loss',
    crops: 'Crops',
    myCrops: 'My Crops',
    activeCrops: 'Active Crops',
    finishedCrops: 'Finished Crops',
    harvest: 'Harvest',
    labour: 'Labour',
    sales: 'Sales',
    expenses: 'Expenses',
    sharedExpense: 'Shared Expense',
    addExpense: 'Add Expense',
    addSale: 'Record Sale',
    addHarvest: 'Record Harvest',
    addLabour: 'Record Labour',
    newCrop: 'Start New Crop',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    pricePerUnit: 'Price per unit',
    buyer: 'Buyer (optional)',
    workType: 'Work done',
    workerCount: 'Number of workers',
    dailyReminder: 'Daily 7:00 PM Check-in',
    smartInsights: 'Farm Assistant Insights',
    save: 'Save Record',
    cancel: 'Cancel',
    confirm: 'Confirm & Save',
    today: 'Today',
    currencySymbol: '₦',
  },
  ig: {
    moneySpent: 'Ego Eji Rụọ Ọrụ',
    moneyEarned: 'Ego Batara',
    profit: 'Uru E nwetara',
    loss: 'Mfu',
    crops: 'Ihe Ubi',
    myCrops: 'Ihe Ubi M',
    activeCrops: 'Ihe Ubi Dị Ugbu A',
    finishedCrops: 'Ihe Ubi E Mechara',
    harvest: 'Owuwe Ihe Ubi',
    labour: 'Ọrụ Aka',
    sales: 'Ahịa E Rere',
    expenses: 'Mmefu Ego',
    sharedExpense: 'Mmefu Kekọrọ Ihe Ubi',
    addExpense: 'Tinye Mmefu',
    addSale: 'Dee Ahịa E Rere',
    addHarvest: 'Dee Owuwe Ihe',
    addLabour: 'Dee Ọrụ Aka',
    newCrop: 'Kụọ Ihe Ubi Ọhụrụ',
    amount: 'Ego Ole',
    date: 'Ụbọchị',
    category: 'Ụdị Mmefu',
    quantity: 'Ọnụọgụgụ',
    unit: 'Ihe Eji Atụ Ya',
    pricePerUnit: 'Ọnụahịa Otu',
    buyer: 'Onye Zụrụ',
    workType: 'Ụdị Ọrụ',
    workerCount: 'Ndị Rụrụ Ọrụ',
    dailyReminder: 'Ncheta Kwa Anyasị 7:00 PM',
    smartInsights: 'Anya Ubi FarmPal',
    save: 'Chekwaa',
    cancel: 'Kagbuo',
    confirm: 'Kwenye ma Chekwaa',
    today: 'Taa',
    currencySymbol: '₦',
  },
  yo: {
    moneySpent: 'Owo Ti A Na',
    moneyEarned: 'Owo Ti A Ri',
    profit: 'Èrè',
    loss: 'Àdánù',
    crops: 'Àwọn Ohun Ọ̀gbìn',
    myCrops: 'Àwọn Ohun Ọ̀gbìn Mi',
    activeCrops: 'Ohun Ọ̀gbìn Lọ́wọ́',
    finishedCrops: 'Ohun Ọ̀gbìn Ti Pari',
    harvest: 'Ìkórè',
    labour: 'Iṣẹ́ Oojọ́',
    sales: 'Títà',
    expenses: 'Ìnáwó',
    sharedExpense: 'Ìnáwó Àjọpín',
    addExpense: 'Kọ Ìnáwó Sínú Ìwé',
    addSale: 'Kọ Títà Sínú Ìwé',
    addHarvest: 'Kọ Ìkórè Sínú Ìwé',
    addLabour: 'Kọ Iṣẹ́ Oojọ́',
    newCrop: 'Bẹ̀rẹ̀ Ohun Ọ̀gbìn Titun',
    amount: 'Iye Owo',
    date: 'Ọjọ́',
    category: 'Irú Ìnáwó',
    quantity: 'Iye',
    unit: 'Ìwọ̀n',
    pricePerUnit: 'Iye Owo Kọ̀ọ̀kan',
    buyer: 'Olura',
    workType: 'Iṣẹ́ Ti A Ṣe',
    workerCount: 'Iye Àwọn Oṣiṣẹ́',
    dailyReminder: 'Ìránlétí Alẹ́ 7:00 PM',
    smartInsights: 'Ìmọ̀ràn FarmPal',
    save: 'Fi Pamọ́',
    cancel: 'Fagilee',
    confirm: 'Fọwọ́sí & Fi Pamọ́',
    today: 'Lónìí',
    currencySymbol: '₦',
  },
  ha: {
    moneySpent: 'Kudin Da Aka Kashe',
    moneyEarned: 'Kudin Da Aka Samu',
    profit: 'Riba',
    loss: 'Asara',
    crops: 'Amfanin Gona',
    myCrops: 'Amfanin Gonata',
    activeCrops: 'Amfanin Gona Na Yanzu',
    finishedCrops: 'Wanda Aka Kammala',
    harvest: 'Girbi',
    labour: 'Aikin Kwadago',
    sales: 'Ciniki / Sayarwa',
    expenses: 'Kudaden Kashewa',
    sharedExpense: 'Kudin Da Ya Shafi Amfani Da Yawa',
    addExpense: 'Rubuta Kudin Da Aka Kashe',
    addSale: 'Rubuta Ciniki',
    addHarvest: 'Rubuta Girbi',
    addLabour: 'Rubuta Aikin Kwadago',
    newCrop: 'Fara Sabon Shuka',
    amount: 'Adadin Kudi',
    date: 'Rana',
    category: 'Nau\'in Kashewa',
    quantity: 'Adadi',
    unit: 'Ma\'auni',
    pricePerUnit: 'Farashin Daya',
    buyer: 'Mai Saye',
    workType: 'Aikin Da Aka Yi',
    workerCount: 'Yawan Ma\'aikata',
    dailyReminder: 'Tunatarwa Da Yamma 7:00 PM',
    smartInsights: 'Hikimar FarmPal',
    save: 'Ajiye',
    cancel: 'Soke',
    confirm: 'Tabbatar & Ajiye',
    today: 'Yau',
    currencySymbol: '₦',
  },
};

export function formatNaira(amount: number): string {
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}
