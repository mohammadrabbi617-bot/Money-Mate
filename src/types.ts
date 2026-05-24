export type TransactionType = 'income' | 'expense';
export type LoanType = 'given' | 'taken';
export type CustomerType = 'customer' | 'borrower' | 'lender';
export type CreditTransactionType = 'sale' | 'purchase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  language: 'en' | 'bn';
  theme: 'light' | 'dark';
  createdAt: any;
  appLockPin?: string;
  biometricsEnabled?: boolean;
}

export interface Income {
  id: string;
  amount: number;
  category: string;
  source: string;
  date: any;
  note: string;
  userId: string;
  createdAt: any;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  purpose: string;
  date: any;
  note: string;
  userId: string;
  createdAt: any;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName?: string;
  currentBalance: number;
  userId: string;
  createdAt: any;
}

export interface Loan {
  id: string;
  personName: string;
  personId?: string;
  phoneNumber?: string;
  type: LoanType;
  principalAmount: number;
  profitAmount: number;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  paidAmount: number;
  remainingDue: number;
  startDate: any;
  endDate: any;
  status: 'active' | 'paid' | 'settled';
  notes: string;
  userId: string;
  createdAt: any;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
  notes: string;
  userId: string;
  createdAt: any;
}

export interface CreditTransaction {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  paidAmount: number;
  dueAmount: number;
  customerName: string;
  customerId?: string;
  type: CreditTransactionType;
  date: any;
  notes: string;
  method?: string;
  accountId?: string;
  userId: string;
  createdAt: any;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  userId: string;
  createdAt: any;
}
