
import React, { useState, useEffect } from 'react';
import { TransactionType, Account } from '../types';
import { SALES_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Calendar, Tag, CreditCard, FileText, User, Info } from 'lucide-react';

interface Props {
  type: TransactionType;
  accounts: Account[];
  onSubmit: (data: any) => void;
}

const TransactionForm: React.FC<Props> = ({ type, accounts, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Update default account when accounts list changes
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  const categories = type === TransactionType.INCOME ? SALES_CATEGORIES : 
                    type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;

    onSubmit({
      amount: parseFloat(amount),
      accountId,
      type,
      category: category || getDefaultCategory(),
      note,
      relatedLoanPerson: person,
      date
    });

    // Reset fields
    setAmount('');
    setNote('');
    setPerson('');
  };

  const getDefaultCategory = () => {
    switch(type) {
      case TransactionType.MOBILE_BANKING_RECEIVED: return 'মোবাইল ব্যাংকিং গ্রহণ';
      case TransactionType.MOBILE_BANKING_SENT: return 'মোবাইল ব্যাংকিং প্রদান';
      default: return type.toString();
    }
  };

  const getLabel = () => {
    switch (type) {
      case TransactionType.INCOME: return 'জমা দিন (৳)';
      case TransactionType.EXPENSE: return 'খরচ এন্ট্রি (৳)';
      case TransactionType.MOBILE_BANKING_RECEIVED: return 'অ্যামাউন্ট (৳)';
      case TransactionType.MOBILE_BANKING_SENT: return 'অ্যামাউন্ট (৳)';
      default: return 'অ্যামাউন্ট (৳)';
    }
  };

  const getHelperText = () => {
    if (type === TransactionType.MOBILE_BANKING_RECEIVED) {
      return "কাস্টমার থেকে ক্যাশ আউট করলে: মোবাইল ব্যালেন্স বাড়বে এবং ক্যাশ বক্স থেকে টাকা কমবে।";
    }
    if (type === TransactionType.MOBILE_BANKING_SENT) {
      return "কাস্টমারকে ক্যাশ ইন করে দিলে: মোবাইল ব্যালেন্স কমবে এবং ক্যাশ বক্সে টাকা বাড়বে।";
    }
    return null;
  };

  if (accounts.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
        <p className="text-slate-500 font-medium">লেনদেনের জন্য কোন হিসাব (Account) পাওয়া যায়নি। দয়া করে সেটিংস থেকে একটি হিসাব যোগ করুন।</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {getHelperText() && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2 items-start text-[12px] text-blue-700 leading-tight">
           <Info size={16} className="shrink-0 mt-0.5" />
           <p className="font-medium">{getHelperText()}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <CreditCard size={14} /> {getLabel()}
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="0.00"
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar size={14} /> তারিখ
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Account Selection */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Tag size={14} /> হিসাব মাধ্যম
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Category (Optional for some) */}
        {categories.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Tag size={14} /> ধরণ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">বাছাই করুন</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Related Person for Loans or Mobile Banking details */}
        {([TransactionType.LOAN_GIVEN, TransactionType.LOAN_TAKEN, TransactionType.LOAN_COLLECTED, TransactionType.LOAN_REPAID].includes(type) || 
          [TransactionType.MOBILE_BANKING_RECEIVED, TransactionType.MOBILE_BANKING_SENT].includes(type)) && (
          <div className="space-y-1 col-span-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <User size={14} /> {type.includes('MOBILE') ? 'কাস্টমার নম্বর / নাম' : 'ব্যক্তির নাম / বিবরণ'}
            </label>
            <input
              required
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={type.includes('MOBILE') ? 'যেমন: 01712...' : 'কার সাথে লেনদেন?'}
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1 col-span-1 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <FileText size={14} /> মন্তব্য (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="কিছু লিখতে চাইলে..."
          />
        </div>
      </div>

      <button
        type="submit"
        className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${
          type === TransactionType.INCOME ? 'bg-green-600 hover:bg-green-700' : 
          type === TransactionType.EXPENSE ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        এন্ট্রি নিশ্চিত করুন
      </button>
    </form>
  );
};

export default TransactionForm;
