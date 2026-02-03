import React, { useState } from 'react';
import { useAccounting } from '../contexts/AccountingContext';
import { BankTransaction } from '../types';
import { analyzeBankTransaction } from '../services/geminiService';
import { ArrowDownLeft, ArrowUpRight, Check, X, FileText, RefreshCw, Wand2, Plus } from 'lucide-react';

// Mock Data representing a Bank Statement
const MOCK_BANK_DATA: BankTransaction[] = [
  { id: 'b1', date: '2023-11-01', description: 'KHACH HANG NGUYEN VAN A TT TIEN TOUR DA NANG', amount: 15000000, type: 'CREDIT', status: 'NEW' },
  { id: 'b2', date: '2023-11-02', description: 'THANH TOAN TIEN DIEN THANG 10', amount: 2500000, type: 'DEBIT', status: 'NEW' },
  { id: 'b3', date: '2023-11-03', description: 'CK TIEN VE THAM QUAN BA NA', amount: 5600000, type: 'DEBIT', status: 'NEW' },
  { id: 'b4', date: '2023-11-04', description: 'Cty ABC chuyen khoan tien coc HD 001', amount: 30000000, type: 'CREDIT', status: 'NEW' },
];

const BankReconciliation: React.FC = () => {
  const { addTransaction } = useAccounting();
  const [transactions, setTransactions] = useState<BankTransaction[]>(MOCK_BANK_DATA);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyze = async (trans: BankTransaction) => {
    setAnalyzingId(trans.id);
    const result = await analyzeBankTransaction(trans.description, trans.amount, trans.type);
    
    setTransactions(prev => prev.map(t => 
      t.id === trans.id ? { ...t, aiSuggestion: result } : t
    ));
    setAnalyzingId(null);
  };

  const handleApprove = (trans: BankTransaction) => {
    if (!trans.aiSuggestion) return;

    if (trans.aiSuggestion.action === 'CREATE_TRANSACTION' || trans.aiSuggestion.action === 'CREATE_INVOICE') {
      // Auto add to accounting book
      addTransaction({
        id: Date.now().toString(),
        date: trans.date,
        description: trans.description,
        amount: trans.amount,
        type: trans.type === 'CREDIT' ? 'INCOME' : 'EXPENSE',
        category: trans.aiSuggestion.category || 'Khác'
      });
      
      // If CREATE_INVOICE, we would ideally trigger an Invoice Generator here.
      // For now, we simulate marking it as processed and adding to book.
    }

    setTransactions(prev => prev.map(t => 
      t.id === trans.id ? { ...t, status: 'MATCHED' } : t
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kết Nối Ngân Hàng (Demo)</h1>
          <p className="text-slate-500">Tự động đối soát giao dịch và gợi ý hạch toán/xuất hóa đơn</p>
        </div>
        <button 
          onClick={() => setTransactions(MOCK_BANK_DATA)}
          className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Reset Demo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-4">Ngày</th>
              <th className="px-4 py-4">Diễn giải giao dịch (Ngân hàng)</th>
              <th className="px-4 py-4 text-right">Số tiền</th>
              <th className="px-4 py-4 w-1/3">Đề xuất của AI</th>
              <th className="px-4 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'MATCHED' ? 'bg-slate-50 opacity-60' : ''}`}>
                <td className="px-4 py-4 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-800">{t.description}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {t.type === 'CREDIT' ? (
                      <span className="text-green-600 flex items-center gap-1 font-semibold"><ArrowDownLeft className="w-3 h-3" /> Tiền vào</span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1 font-semibold"><ArrowUpRight className="w-3 h-3" /> Tiền ra</span>
                    )}
                  </div>
                </td>
                <td className={`px-4 py-4 text-right font-mono font-medium text-base ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'CREDIT' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}
                </td>
                
                {/* AI Analysis Column */}
                <td className="px-4 py-4">
                  {t.status === 'MATCHED' ? (
                    <span className="text-green-600 flex items-center gap-1 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded">
                      <Check className="w-3 h-3" /> Đã hạch toán
                    </span>
                  ) : t.aiSuggestion ? (
                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                      <div className="font-bold text-purple-700 text-xs mb-1 flex items-center gap-1">
                        <Wand2 className="w-3 h-3" />
                        {t.aiSuggestion.action === 'CREATE_INVOICE' ? 'GỢI Ý: XUẤT HÓA ĐƠN' : 'GỢI Ý: HẠCH TOÁN'}
                      </div>
                      <p className="text-xs text-purple-600 mb-1">{t.aiSuggestion.explanation}</p>
                      {t.aiSuggestion.category && (
                        <span className="text-[10px] bg-white border border-purple-200 px-1.5 py-0.5 rounded text-purple-500">
                          Mục: {t.aiSuggestion.category}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAnalyze(t)}
                      disabled={analyzingId === t.id}
                      className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {analyzingId === t.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      Phân tích
                    </button>
                  )}
                </td>

                <td className="px-4 py-4 text-center">
                  {t.status === 'NEW' && t.aiSuggestion && (
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleApprove(t)}
                        title="Duyệt & Hạch toán"
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                      >
                         <Check className="w-4 h-4" />
                      </button>
                      {t.aiSuggestion.action === 'CREATE_INVOICE' && (
                        <button 
                          title="Tạo hóa đơn nháp"
                          className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm"
                        >
                           <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankReconciliation;
