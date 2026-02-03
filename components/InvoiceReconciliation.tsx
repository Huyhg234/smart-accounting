import React, { useState } from 'react';
import { BankTransaction, Contract, ReconciliationResult } from '../types';
import { matchBankToInvoice } from '../services/geminiService';
import { Calculator, FilePlus, RefreshCw, Wand2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

// Mock Data
const MOCK_CONTRACTS: Contract[] = [
  { id: 'c1', customerName: 'Công Ty TNHH Du Lịch Việt', contractValue: 50000000, invoicedAmount: 30000000, status: 'OPEN' },
  { id: 'c2', customerName: 'Anh Nguyễn Văn An', contractValue: 12000000, invoicedAmount: 0, status: 'OPEN' },
  { id: 'c3', customerName: 'Tập Đoàn ABC', contractValue: 100000000, invoicedAmount: 100000000, status: 'CLOSED' },
];

const MOCK_BANK_IN: BankTransaction[] = [
  { id: 'b1', date: '2023-11-05', description: 'DL VIET TT DOT 2 HOP DONG 001', amount: 25000000, type: 'CREDIT', status: 'NEW' },
  { id: 'b2', date: '2023-11-06', description: 'NGUYEN VAN AN CHUYEN KHOAN', amount: 12000000, type: 'CREDIT', status: 'NEW' },
  { id: 'b3', date: '2023-11-07', description: 'CTY XYZ TAM UNG', amount: 5000000, type: 'CREDIT', status: 'NEW' },
];

const InvoiceReconciliation: React.FC = () => {
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const handleAIMatch = async () => {
    setIsMatching(true);
    // Simulate delay for effect
    await new Promise(r => setTimeout(r, 800));
    const matches = await matchBankToInvoice(MOCK_BANK_IN, MOCK_CONTRACTS);
    setResults(matches);
    setIsMatching(false);
  };

  const handleAction = (res: ReconciliationResult) => {
    alert(`Thực hiện hành động: ${res.suggestion} cho HĐ ${res.contractId}\nSố tiền: ${res.difference.toLocaleString('vi-VN')}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đối Soát & Xuất Hóa Đơn Tự Động</h1>
          <p className="text-slate-500">Sử dụng AI để khớp lệnh tiền về từ ngân hàng với hợp đồng/hóa đơn.</p>
        </div>
        <button 
          onClick={handleAIMatch}
          disabled={isMatching}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-purple-200 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100"
        >
          {isMatching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          AI Tự Động Khớp Lệnh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Data Visualization */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-green-100 p-1 rounded text-green-700 text-xs">NGÂN HÀNG</span>
              Giao dịch tiền về (Chưa xử lý)
            </h3>
            <div className="space-y-2">
              {MOCK_BANK_IN.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded border border-slate-100 text-sm">
                  <div className="font-semibold text-slate-800">{t.description}</div>
                  <div className="text-green-600 font-mono">+{t.amount.toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-orange-100 p-1 rounded text-orange-700 text-xs">HỢP ĐỒNG</span>
              Danh sách chờ thanh toán
            </h3>
            <div className="space-y-2">
              {MOCK_CONTRACTS.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded border border-slate-100 text-sm flex justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{c.customerName}</div>
                    <div className="text-xs text-slate-500">Đã xuất HĐ: {c.invoicedAmount.toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="text-orange-600 font-mono">{c.contractValue.toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Results */}
        <div className="bg-white p-6 rounded-xl border-2 border-purple-100 shadow-md h-full">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
             <Wand2 className="w-5 h-5 text-purple-600" />
             Kết Quả Đối Soát AI
           </h3>

           {results.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
               <Calculator className="w-12 h-12 mb-3 opacity-20" />
               <p>Nhấn nút "AI Tự Động Khớp Lệnh" để bắt đầu.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {results.map((res, idx) => (
                 <div key={idx} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matched</span>
                       <span className={`text-xs px-2 py-1 rounded-full font-bold ${res.difference > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                         {res.difference > 0 ? 'LỆCH DƯƠNG (Cần Xuất HĐ)' : 'KHỚP'}
                       </span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-600 italic mb-3">"{res.reason}"</p>
                      
                      <div className="flex items-center justify-between text-sm mb-4 bg-slate-50 p-3 rounded-lg">
                        <div className="text-center">
                           <div className="text-xs text-slate-400">Tiền về</div>
                           <div className="font-bold text-green-600">{res.receivedAmount.toLocaleString('vi-VN')}</div>
                        </div>
                        <div className="text-slate-300">-</div>
                        <div className="text-center">
                           <div className="text-xs text-slate-400">Đã xuất</div>
                           <div className="font-bold text-orange-600">{res.invoicedAmount.toLocaleString('vi-VN')}</div>
                        </div>
                        <div className="text-slate-300">=</div>
                         <div className="text-center">
                           <div className="text-xs text-slate-400">Chênh lệch</div>
                           <div className={`font-bold ${res.difference > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                             {res.difference.toLocaleString('vi-VN')}
                           </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleAction(res)}
                        className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                          res.difference > 0 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-md' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {res.difference > 0 ? <FilePlus className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {res.suggestion}
                      </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceReconciliation;
