
export enum TransactionType {
  INCOME = 'INCOME', // আয়
  EXPENSE = 'EXPENSE', // ব্যয়
  CAPITAL_IN = 'CAPITAL_IN', // মূলধন বিনিয়োগ
  CAPITAL_OUT = 'CAPITAL_OUT', // মালিকের উত্তোলন
  LOAN_GIVEN = 'LOAN_GIVEN', // ধার প্রদান
  LOAN_TAKEN = 'LOAN_TAKEN', // ধার গ্রহণ
  LOAN_COLLECTED = 'LOAN_COLLECTED', // ধার ফেরত পাওয়া
  LOAN_REPAID = 'LOAN_REPAID', // ধার পরিশোধ
  MOBILE_BANKING_RECEIVED = 'MOBILE_BANKING_RECEIVED', // ক্যাশ ইন (বিকাশ/নগদ)
  MOBILE_BANKING_SENT = 'MOBILE_BANKING_SENT', // ক্যাশ আউট (বিকাশ/নগদ)
  ADJUSTMENT = 'ADJUSTMENT' // ব্যালেন্স সমন্বয়
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'CASH' | 'MOBILE' | 'LOAN';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  accountId: string; 
  category: string;
  note: string;
  relatedLoanPerson?: string; 
}

export interface DashboardStats {
  totalCash: number;
  totalReceivable: number; 
  totalPayable: number;    
  todaySales: number;
  todayExpense: number;
}
