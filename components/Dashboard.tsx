
import React from 'react';
import { DashboardStats, Account, Transaction, TransactionType } from '../types';
import { TrendingUp, TrendingDown, HandCoins, Landmark, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  stats: DashboardStats;
  accounts: Account[];
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<Props> = ({ stats, accounts, transactions, setActiveTab }) => {
  // Chart data: Last 7 days
  const chartData = React.useMemo(() => {
    const data: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const sales = transactions
        .filter(t => t.date === dateStr && t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter(t => t.date === dateStr && t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: dateStr.split('-').slice(1).reverse().join('/'),
        আয়: sales,
        ব্যয়: expenses
      });
    }
    return data;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">ড্যাশবোর্ড ওভারভিউ</h1>
          <p className="text-slate-500">স্বাগতম! আপনার দোকানের হিসাব একনজরে দেখুন।</p>
        </div>
        <button 
          onClick={() => setActiveTab('sales')}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          নতুন বিক্রয় এন্ট্রি
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="মোট ক্যাশ (নগদ)" 
          value={stats.totalCash} 
          icon={<Landmark className="text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard 
          title="আজকের বিক্রয়" 
          value={stats.todaySales} 
          icon={<TrendingUp className="text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard 
          title="পাওনা (পাওয়া যাবে)" 
          value={stats.totalReceivable} 
          icon={<HandCoins className="text-orange-600" />}
          bgColor="bg-orange-50"
        />
        <StatCard 
          title="দেনা (দিতে হবে)" 
          value={stats.totalPayable} 
          icon={<TrendingDown className="text-red-600" />}
          bgColor="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">সাপ্তাহিক আয়-ব্যয় গ্রাফ</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="আয়" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ব্যয়" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mobile Accounts View */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">মোবাইল ব্যাংকিং হিসাব</h3>
          <div className="space-y-4">
            {accounts.filter(a => a.type === 'MOBILE').map(acc => (
              <div key={acc.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">{acc.name}</span>
                <span className={`font-bold ${acc.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                   ৳ {acc.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <button 
             onClick={() => setActiveTab('mobile')}
             className="w-full mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 text-center"
          >
            বিস্তারিত দেখুন →
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }: { title: string, value: number, icon: React.ReactNode, bgColor: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`p-3 rounded-xl ${bgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-slate-900">৳ {value.toLocaleString()}</p>
    </div>
  </div>
);

export default Dashboard;
