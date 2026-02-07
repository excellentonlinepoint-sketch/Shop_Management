
import React, { useState, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Account, TransactionType, DashboardStats } from './types';
import { INITIAL_ACCOUNTS, NAV_ITEMS } from './constants';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import HistoryView from './components/HistoryView';
import AccountBalances from './components/AccountBalances';
import AccountManager from './components/AccountManager';
import { Menu, X, Wallet, ShieldCheck, LogOut, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';

// Supabase Configuration
const SUPABASE_URL = 'https://iijxekrqibhehagssxqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpanhla3JxaWJoZWhhZ3NzeHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjEwNTIsImV4cCI6MjA4NTkzNzA1Mn0.PLvD5uTNsudMd2KoBtFJ_P6XSSzSLJLvhiQnY7Mia9o';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data when session exists
  useEffect(() => {
    if (session) {
      fetchInitialData();
    }
  }, [session]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch Accounts
      const { data: accData, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (accError) throw accError;
      
      if (accData && accData.length > 0) {
        setAccounts(accData);
      } else {
        // Create initial cash account if none exists for new user
        const { data: newAcc, error: createError } = await supabase
          .from('accounts')
          .insert([{ 
            user_id: session.user.id, 
            name: 'নগদ টাকা (Cash)', 
            balance: 0, 
            type: 'CASH' 
          }])
          .select();
        if (newAcc) setAccounts(newAcc);
      }

      // Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (err: any) {
      console.error('Data Fetch Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('আপনার ইমেইলে কনফার্মেশন লিঙ্ক পাঠানো হয়েছে।');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          ...newTx, 
          user_id: session.user.id,
          account_id: newTx.accountId // DB column is account_id
        }])
        .select();

      if (error) throw error;
      
      // Update local state (Optimistic or Refresh)
      // Since we have DB triggers for balance, we should re-fetch accounts to be accurate
      setTransactions(prev => [data[0], ...prev]);
      refreshAccounts();
    } catch (err: any) {
      alert('এন্ট্রি সেভ করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      refreshAccounts();
    } catch (err: any) {
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const editTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    try {
      const { error } = await supabase.from('transactions').update(updatedData).eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
      refreshAccounts();
    } catch (err: any) {
      alert('আপডেট করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const refreshAccounts = async () => {
    const { data } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (data) setAccounts(data);
  };

  const addAccount = async (accData: Omit<Account, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...accData, user_id: session.user.id }])
        .select();
      if (error) throw error;
      setAccounts(prev => [...prev, data[0]]);
    } catch (err: any) {
      alert('অ্যাকাউন্ট যোগ করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const adjustBalance = async (accountId: string, newAmount: number) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    const difference = newAmount - acc.balance;
    if (difference === 0) return;

    await addTransaction({
      date: new Date().toISOString().split('T')[0],
      amount: Math.abs(difference),
      type: TransactionType.ADJUSTMENT,
      accountId: accountId,
      category: 'ব্যালেন্স সমন্বয়',
      note: `সরাসরি ব্যালেন্স আপডেট। পার্থক্য: ${difference > 0 ? '+' : ''}${difference}`,
    });
  };

  const stats: DashboardStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.filter(t => t.date.startsWith(today));
    let receivables = 0, payables = 0;

    transactions.forEach(t => {
      if (t.type === TransactionType.LOAN_GIVEN) receivables += t.amount;
      if (t.type === TransactionType.LOAN_COLLECTED) receivables -= t.amount;
      if (t.type === TransactionType.LOAN_TAKEN) payables += t.amount;
      if (t.type === TransactionType.LOAN_REPAID) payables -= t.amount;
    });

    return {
      totalCash: accounts.find(a => a.type === 'CASH')?.balance || 0,
      totalReceivable: receivables,
      totalPayable: payables,
      todaySales: todayTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
      todayExpense: todayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions, accounts]);

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-blue-600 mb-2">হিসাব খাতা</h1>
            <p className="text-slate-500 text-sm">আপনার ডিজিটাল ক্যাশবুক - লগইন করুন</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Mail size={14} /> ইমেইল এড্রেস
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="example@mail.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Lock size={14} /> পাসওয়ার্ড
              </label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {authError && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg">{authError}</p>}

            <button 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'লগইন করুন' : 'সাইন আপ করুন')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-blue-600 text-sm font-bold hover:underline"
            >
              {authMode === 'login' ? 'নতুন একাউন্ট খুলুন' : 'পুরানো একাউন্ট আছে? লগইন করুন'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-blue-600 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <Menu className="cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
          <h1 className="text-xl font-bold tracking-tight">হিসাব খাতা</h1>
        </div>
        <div className="text-sm font-bold bg-blue-700 px-3 py-1 rounded-full border border-blue-500/50">
          ৳ {stats.totalCash.toLocaleString()}
        </div>
      </div>

      <aside className={`fixed inset-0 z-40 bg-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:relative md:translate-x-0 md:w-64 border-r border-slate-200 shadow-sm flex flex-col`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 md:bg-white">
          <h1 className="text-2xl font-black text-white md:text-blue-600 tracking-tight">হিসাব খাতা</h1>
          <X className="md:hidden text-white cursor-pointer" onClick={() => setIsSidebarOpen(false)} />
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
           <AccountBalances accounts={accounts} />
        </div>
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest justify-center">
             <ShieldCheck size={14} className="text-green-500" /> Supabase ক্লাউডে সিঙ্কড
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={14} /> লগ আউট
          </button>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {loading && (
          <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full px-4 py-2 border border-blue-100 flex items-center gap-2 text-xs font-bold text-blue-600">
            <Loader2 className="animate-spin" size={14} /> ডাটা লোড হচ্ছে...
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard stats={stats} accounts={accounts} transactions={transactions} setActiveTab={setActiveTab} />}
        
        {activeTab === 'sales' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-6">নতুন বিক্রয় / আয় এন্ট্রি</h2>
            <TransactionForm type={TransactionType.INCOME} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'CASH')} />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-6">নতুন খরচ / ব্যয় এন্ট্রি</h2>
            <TransactionForm type={TransactionType.EXPENSE} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'CASH')} />
          </div>
        )}

        {activeTab === 'mobile' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-6">মোবাইল ব্যাংকিং লেনদেন</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm ring-1 ring-blue-50">
                  <h3 className="text-blue-600 font-bold mb-1">কাস্টমার থেকে গ্রহণ</h3>
                  <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase">ক্যাশ ইন (বিকাশ/নগদ/রকেট)</p>
                  <TransactionForm type={TransactionType.MOBILE_BANKING_RECEIVED} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'MOBILE')} />
               </div>
               <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
                  <h3 className="text-indigo-600 font-bold mb-1">কাস্টমারকে পাঠানো</h3>
                  <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase">ক্যাশ আউট / সেন্ড মানি</p>
                  <TransactionForm type={TransactionType.MOBILE_BANKING_SENT} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'MOBILE')} />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'loan' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-800">পাওনা / বাকি (Receivables)</h2>
              <TransactionForm type={TransactionType.LOAN_GIVEN} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'CASH')} />
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-600 mb-4 uppercase tracking-wider">পাওনা টাকা আদায়</h3>
                <TransactionForm type={TransactionType.LOAN_COLLECTED} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'CASH')} />
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-800">দেনা / ধার (Payables)</h2>
              <TransactionForm type={TransactionType.LOAN_TAKEN} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'CASH')} />
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-600 mb-4 uppercase tracking-wider">দেনা পরিশোধ</h3>
                <TransactionForm type={TransactionType.LOAN_REPAID} onSubmit={addTransaction} accounts={accounts.filter(a => a.type === 'CASH')} />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView 
            transactions={transactions} 
            onDelete={deleteTransaction} 
            onEdit={editTransaction}
            accounts={accounts} 
          />
        )}
        
        {activeTab === 'accounts' && (
          <AccountManager 
            accounts={accounts} 
            onAdd={addAccount} 
            onUpdate={async (id, up) => {
              await supabase.from('accounts').update(up).eq('id', id);
              refreshAccounts();
            }} 
            onDelete={async id => {
               await supabase.from('accounts').delete().eq('id', id);
               refreshAccounts();
            }} 
            onAdjust={adjustBalance}
          />
        )}
      </main>
    </div>
  );
};

export default App;
