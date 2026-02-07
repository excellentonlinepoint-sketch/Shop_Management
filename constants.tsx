
import React from 'react';
import { 
  PlusCircle, 
  MinusCircle, 
  Smartphone, 
  TrendingUp, 
  Wallet, 
  UserPlus, 
  HandCoins,
  LayoutDashboard,
  History,
  Settings
} from 'lucide-react';
// Import Account interface to correctly type the INITIAL_ACCOUNTS constant
import { Account } from './types';

// Explicitly type INITIAL_ACCOUNTS as Account[] to ensure the 'type' property matches the expected union type ('CASH' | 'MOBILE' | 'LOAN')
export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'নগদ টাকা (Cash)', balance: 0, type: 'CASH' },
];

export const SALES_CATEGORIES = [
  'কম্পিউটার কাজ',
  'প্রিন্টিং',
  'ফটোকপি',
  'লেমিনেটিং',
  'স্টেশনারি বিক্রয়',
  'অন্যান্য আয়'
];

export const EXPENSE_CATEGORIES = [
  'পণ্য ক্রয়',
  'দোকান ভাড়া',
  'বিদ্যুৎ বিল',
  'যাতায়াত',
  'নাস্তা/খাওয়া',
  'অন্যান্য খরচ'
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={20} /> },
  { id: 'sales', label: 'বিক্রয়/আয়', icon: <TrendingUp size={20} /> },
  { id: 'expenses', label: 'খরচ/ব্যয়', icon: <MinusCircle size={20} /> },
  { id: 'mobile', label: 'মোবাইল ব্যাংকিং', icon: <Smartphone size={20} /> },
  { id: 'loan', label: 'ধার/বাকি', icon: <HandCoins size={20} /> },
  { id: 'history', label: 'ইতিহাস', icon: <History size={20} /> },
  { id: 'accounts', label: 'হিসাব সেটিংস', icon: <Settings size={20} /> },
];
