
import React, { useState } from 'react';
import { Transaction, TransactionType, Account } from '../types';
import { Trash2, Search, Edit2, X, Check, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updated: Partial<Transaction>) => void;
}

const HistoryView: React.FC<Props> = ({ transactions, onDelete, onEdit, accounts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (t.relatedLoanPerson || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeText = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME: return 'আয়';
      case TransactionType.EXPENSE: return 'ব্যয়';
      case TransactionType.LOAN_GIVEN: return 'পাওনা (বাকি)';
      case TransactionType.LOAN_TAKEN: return 'দেনা (ধার)';
      case TransactionType.LOAN_COLLECTED: return 'পাওনা আদায়';
      case TransactionType.LOAN_REPAID: return 'দেনা পরিশোধ';
      case TransactionType.MOBILE_BANKING_RECEIVED: return 'মোবাইল ব্যাংকিং (প্রাপ্ত)';
      case TransactionType.MOBILE_BANKING_SENT: return 'মোবাইল ব্যাংকিং (প্রেরিত)';
      case TransactionType.ADJUSTMENT: return 'সমন্বয়';
      default: return type;
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME: return <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold">আয়</span>;
      case TransactionType.EXPENSE: return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold">ব্যয়</span>;
      case TransactionType.LOAN_GIVEN: return <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold">পাওনা</span>;
      case TransactionType.LOAN_TAKEN: return <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold">দেনা</span>;
      case TransactionType.MOBILE_BANKING_RECEIVED: return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">এমবি ইন</span>;
      case TransactionType.MOBILE_BANKING_SENT: return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">এমবি আউট</span>;
      case TransactionType.ADJUSTMENT: return <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">সমন্বয়</span>;
      default: return <span className="text-slate-400 text-[10px]">{type}</span>;
    }
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({ ...tx });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.amount) {
      onEdit(editingId, editForm);
      setEditingId(null);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredTransactions.map(tx => ({
      'তারিখ': tx.date.split('-').reverse().join('/'),
      'লেনদেনের ধরণ': getTypeText(tx.type),
      'বিবরণ/ক্যাটাগরি': tx.category,
      'হিসাব মাধ্যম': accounts.find(a => a.id === tx.accountId)?.name || 'অজানা',
      'পরিমাণ (৳)': tx.amount,
      'সংশ্লিষ্ট ব্যক্তি': tx.relatedLoanPerson || '-',
      'মন্তব্য': tx.note || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    // Download the file
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Hishab_Khata_Backup_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">লেনদেন ইতিহাস</h2>
          <p className="text-xs text-slate-500">আপনার সকল লেনদেনের তালিকা এখানে পাবেন</p>
        </div>
        <div className="flex w-full md:w-auto gap-2 flex-wrap">
           <button 
             onClick={exportToExcel}
             className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 transition-all"
           >
             <Download size={18} /> এক্সেল ডাউনলোড
           </button>
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="খুঁজুন..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
             />
           </div>
           <select 
             className="px-3 py-2 rounded-lg border border-slate-300 outline-none bg-white text-sm shadow-sm"
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
           >
             <option value="ALL">সব ধরণ</option>
             <option value={TransactionType.INCOME}>আয়</option>
             <option value={TransactionType.EXPENSE}>ব্যয়</option>
             <option value={TransactionType.MOBILE_BANKING_RECEIVED}>মোবাইল ব্যাংকিং</option>
             <option value={TransactionType.LOAN_GIVEN}>পাওনা/বাকি</option>
           </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">তারিখ</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ধরণ</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">বিবরণ</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">হিসাব</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">পরিমাণ</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">কোন লেনদেন খুঁজে পাওয়া যায়নি</td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${editingId === tx.id ? 'bg-blue-50' : ''}`}>
                    {editingId === tx.id ? (
                      <React.Fragment>
                        <td className="px-4 py-2">
                          <input 
                            type="date" 
                            className="w-full p-1 text-sm border rounded focus:ring-1 focus:ring-blue-400 outline-none" 
                            value={editForm.date} 
                            onChange={e => setEditForm({...editForm, date: e.target.value})}
                          />
                        </td>
                        <td className="px-4 py-2">{getTypeLabel(tx.type)}</td>
                        <td className="px-4 py-2 space-y-1">
                          <input 
                            type="text" 
                            className="w-full p-1 text-sm border rounded mb-1 focus:ring-1 focus:ring-blue-400 outline-none" 
                            value={editForm.category} 
                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                          />
                          <input 
                            type="text" 
                            className="w-full p-1 text-[10px] border rounded focus:ring-1 focus:ring-blue-400 outline-none" 
                            placeholder="মন্তব্য লিখুন"
                            value={editForm.note} 
                            onChange={e => setEditForm({...editForm, note: e.target.value})}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-500">
                           {accounts.find(a => a.id === tx.accountId)?.name}
                        </td>
                        <td className="px-4 py-2">
                           <input 
                            type="number" 
                            className="w-full p-1 text-sm border rounded text-right font-bold focus:ring-1 focus:ring-blue-400 outline-none" 
                            value={editForm.amount} 
                            onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={handleSaveEdit} className="p-1.5 bg-green-500 text-white rounded-md shadow hover:bg-green-600 transition-colors">
                               <Check size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-400 text-white rounded-md shadow hover:bg-slate-500 transition-colors">
                               <X size={14} />
                            </button>
                          </div>
                        </td>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <td className="px-4 py-4 text-[12px] text-slate-600 whitespace-nowrap">
                          {tx.date.split('-').reverse().join('/')}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getTypeLabel(tx.type)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="font-semibold text-slate-800 text-[13px]">{tx.category}</div>
                          {tx.relatedLoanPerson && <div className="text-[10px] text-blue-600 font-bold">ব্যক্তি: {tx.relatedLoanPerson}</div>}
                          {tx.note && <div className="text-[10px] text-slate-400 italic leading-tight mt-0.5">{tx.note}</div>}
                        </td>
                        <td className="px-4 py-4 text-[12px] text-slate-500">
                          {accounts.find(a => a.id === tx.accountId)?.name || 'অজানা'}
                        </td>
                        <td className={`px-4 py-4 text-sm font-bold text-right whitespace-nowrap ${
                          [TransactionType.INCOME, TransactionType.CAPITAL_IN, TransactionType.LOAN_TAKEN, TransactionType.LOAN_COLLECTED].includes(tx.type) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ৳ {tx.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-3">
                            <button 
                              type="button"
                              onClick={() => handleStartEdit(tx)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                              title="সম্পাদনা"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('আপনি কি নিশ্চিতভাবে এই এন্ট্রিটি মুছতে চান?')) {
                                  onDelete(tx.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </React.Fragment>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
