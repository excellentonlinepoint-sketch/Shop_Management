
import React from 'react';
import { Account } from '../types';

interface Props {
  accounts: Account[];
}

const AccountBalances: React.FC<Props> = ({ accounts }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">সকল হিসাব</h3>
      <div className="space-y-1">
        {accounts.map(acc => (
          <div key={acc.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="text-sm font-medium text-slate-700">{acc.name}</span>
            <span className={`text-sm font-bold ${acc.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
               ৳{acc.balance.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountBalances;
