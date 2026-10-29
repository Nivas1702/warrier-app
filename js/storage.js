/**
 * WARRIER - Storage & State Management Layer
 * Handles LocalStorage data persistence, initial demo seed data,
 * and high-resolution bill receipts.
 */

const STORAGE_KEYS = {
  WARRANTIES: 'warrier_warranties_v1',
  PAYMENTS: 'warrier_payments_v1',
  CURRENCY: 'warrier_currency_v1',
  THEME: 'warrier_theme_v1'
};

// Realistic Seed Data
const DEFAULT_WARRANTIES = [
  {
    id: 'warr_1',
    productName: 'Apple MacBook Pro 14-inch (M3)',
    storeName: 'Apex Electronics',
    purchaseDate: '15/04/2026', // DD/MM/YYYY
    warrantyValue: 24,
    warrantyUnit: 'months', // 'months' or 'years'
    price: 1999,
    billPhotoUrl: 'assets/receipt_macbook.jpg',
    category: 'Computers & Laptops',
    notes: 'Registered under AppleCare. Trans ID: 87654. Reg 03.',
    paymentModeUsed: 'credit_debit_card',
    createdAt: new Date().toISOString()
  },
  {
    id: 'warr_2',
    productName: 'Samsung 65" OLED 4K Smart TV',
    storeName: 'Metro Home Appliances',
    purchaseDate: '10/11/2025', // DD/MM/YYYY
    warrantyValue: 12,
    warrantyUnit: 'months',
    price: 1250,
    billPhotoUrl: 'assets/receipt_tv.jpg',
    category: 'Home Appliances',
    notes: 'Limited 1-year panel warranty. Receipt #MH100456.',
    paymentModeUsed: 'direct_cash',
    createdAt: new Date().toISOString()
  },
  {
    id: 'warr_3',
    productName: 'Sony WH-1000XM5 Noise-Cancelling Headphones',
    storeName: 'AudioTech Store',
    purchaseDate: '01/01/2026', // DD/MM/YYYY
    warrantyValue: 11, // ~11 months from Jan 2026 -> expires Dec 2026 (Expiring Soon ~1-2 months alert!)
    warrantyUnit: 'months',
    price: 399,
    billPhotoUrl: 'assets/receipt_macbook.jpg',
    category: 'Audio & Wearables',
    notes: 'Serial #SN-9948271. Keep invoice for battery replacement.',
    paymentModeUsed: 'credit_card_emi',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PAYMENTS = [
  {
    id: 'pay_1',
    title: 'Apartment Monthly Rent (Nov 2026)',
    category: 'Rent',
    paymentMode: 'direct_cash', // direct cash
    amount: 1200,
    dueDate: '01/11/2026', // DD/MM/YYYY
    isRecurring: true,
    frequency: 'Monthly',
    isEmi: false,
    status: 'pending', // 'pending' or 'paid'
    lateFeePolicy: '$50 late fee if paid after the 5th',
    notes: 'Pay to building manager in direct cash'
  },
  {
    id: 'pay_2',
    title: 'City Power & Electricity Bill',
    category: 'Electricity',
    paymentMode: 'credit_debit_card', // credit card/debit card
    amount: 142.50,
    dueDate: '03/11/2026',
    isRecurring: true,
    frequency: 'Monthly',
    isEmi: false,
    status: 'pending',
    lateFeePolicy: '5% penalty for delayed settlement',
    notes: 'Auto-debit failed, manual card payment required'
  },
  {
    id: 'pay_3',
    title: 'HDFC Regalia - MacBook Pro EMI (Month 6/12)',
    category: 'Credit Card EMI',
    paymentMode: 'credit_card_emi', // credit card emi
    amount: 175.00,
    totalAmount: 2100,
    dueDate: '05/11/2026',
    isRecurring: true,
    frequency: 'Monthly',
    isEmi: true,
    currentInstallment: 6,
    totalTenureMonths: 12,
    status: 'pending',
    lateFeePolicy: 'Standard bank finance late charge $35',
    notes: 'No cost EMI scheme on credit card'
  },
  {
    id: 'pay_4',
    title: 'SBI Car Loan - Honda City (Month 22/36)',
    category: 'Loan EMI',
    paymentMode: 'loan_emi', // loan/emi
    amount: 430.00,
    totalAmount: 15480,
    dueDate: '10/11/2026',
    isRecurring: true,
    frequency: 'Monthly',
    isEmi: true,
    currentInstallment: 22,
    totalTenureMonths: 36,
    status: 'pending',
    lateFeePolicy: '2% per month default interest penalty',
    notes: 'Direct loan account auto-transfer'
  },
  {
    id: 'pay_5',
    title: 'Dyson V12 Cordless Vacuum Purchase',
    category: 'Product Purchases',
    paymentMode: 'credit_debit_card',
    amount: 620.00,
    dueDate: '29/10/2026', // Due in 2 days! Urgent!
    isRecurring: false,
    frequency: 'One-Time',
    isEmi: false,
    status: 'pending',
    lateFeePolicy: 'Payment confirmation due',
    notes: 'Ordered online via card'
  }
];

class StorageService {
  static getWarranties() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
      if (!data) {
        this.saveWarranties(DEFAULT_WARRANTIES);
        return DEFAULT_WARRANTIES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading warranties:', e);
      return DEFAULT_WARRANTIES;
    }
  }

  static saveWarranties(warranties) {
    try {
      localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(warranties));
    } catch (e) {
      console.error('Error saving warranties:', e);
    }
  }

  static addWarranty(warranty) {
    const list = this.getWarranties();
    list.unshift(warranty);
    this.saveWarranties(list);
    return list;
  }

  static deleteWarranty(id) {
    const list = this.getWarranties().filter(item => item.id !== id);
    this.saveWarranties(list);
    return list;
  }

  static getPayments() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (!data) {
        this.savePayments(DEFAULT_PAYMENTS);
        return DEFAULT_PAYMENTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading payments:', e);
      return DEFAULT_PAYMENTS;
    }
  }

  static savePayments(payments) {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error('Error saving payments:', e);
    }
  }

  static addPayment(payment) {
    const list = this.getPayments();
    list.unshift(payment);
    this.savePayments(list);
    return list;
  }

  static togglePaymentStatus(id) {
    const list = this.getPayments();
    const item = list.find(p => p.id === id);
    if (item) {
      item.status = item.status === 'paid' ? 'pending' : 'paid';
      item.paidAt = item.status === 'paid' ? new Date().toISOString() : null;
      this.savePayments(list);
    }
    return list;
  }

  static deletePayment(id) {
    const list = this.getPayments().filter(item => item.id !== id);
    this.savePayments(list);
    return list;
  }

  static getCurrency() {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || '$';
  }

  static setCurrency(symbol) {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, symbol);
  }

  static resetDemoData() {
    this.saveWarranties(DEFAULT_WARRANTIES);
    this.savePayments(DEFAULT_PAYMENTS);
    window.location.reload();
  }
}

// Make accessible globally
window.StorageService = StorageService;
