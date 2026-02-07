
import React, { useState } from 'react';
import { Account, TransactionType } from '../types';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

interface Props {
  accounts: Account[];
  onAdd: (acc: Omit<Account, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
  onDelete: (id: string) => void;
  onAdjust: (accountId: string, newAmount: number) => void;
}

const AccountManager: React.FC<Props> = ({ accounts, onAdd, onUpdate, onDelete, onAdjust }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'MOBILE' | 'CASH'>('MOBILE');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  const handleAdd = () => {
    if (!newAccName) return;
    onAdd({ name: newAccName, balance: 0, type: newAccType });
    setNewAccName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">হিসাব ব্যবস্থাপনা (Settings)</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
        >
          <Plus size={18} /> নতুন হিসাব যোগ
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-blue-600 mb-1">হিসাবের নাম (যেমন: বিকাশ এজেন্ট ০১৭...)</label>
            <input 
              type="text" 
              value={newAccName}
              onChange={e => setNewAccName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="নাম লিখুন"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-600 mb-1">ধরণ</label>
            <select 
              value={newAccType}
              onChange={e => setNewAccType(e.target.value as any)}
              className="px-3 py-2 rounded border border-blue-200 outline-none bg-white"
            >
              <option value="MOBILE">মোবাইল ব্যাংকিং</option>
              <option value="CASH">নগদ (Cash)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">যোগ করুন</button>
            <button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded font-bold">বাতিল</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">{acc.name}</h3>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {acc.type === 'CASH' ? 'নগদ হিসাব' : 'মোবাইল ব্যাংকিং'}
                </span>
              </div>
              {acc.id !== 'acc_cash' && (
                <button 
                  onClick={() => { if(confirm('এই হিসাবটি মুছতে চান?')) onDelete(acc.id); }}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">বর্তমান ব্যালেন্স</p>
                <p className="text-xl font-black text-blue-600">৳ {acc.balance.toLocaleString()}</p>
              </div>
              
              {adjustingId === acc.id ? (
                <div className="flex flex-col gap-2 items-end">
                  <input 
                    type="number" 
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-blue-500 rounded outline-none"
                    placeholder="সঠিক টাকা"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        onAdjust(acc.id, parseFloat(adjustAmount));
                        setAdjustingId(null);
                        setAdjustAmount('');
                      }}
                      className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => setAdjustingId(null)}
                      className="p-1 bg-slate-400 text-white rounded hover:bg-slate-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setAdjustingId(acc.id);
                    setAdjustAmount(acc.balance.toString());
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 border border-slate-200 px-2 py-1 rounded"
                >
                  <Edit2 size={12} /> ব্যালেন্স আপডেট
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountManager;
