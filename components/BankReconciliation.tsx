import React, { useState, useEffect } from 'react';
import { useAccounting } from '../contexts/AccountingContext';
import { BankTransaction } from '../types';
import { analyzeBankTransaction } from '../services/geminiService';
import { ArrowDownLeft, ArrowUpRight, Check, X, FileText, RefreshCw, Wand2, Settings, Smartphone, ExternalLink, PlayCircle } from 'lucide-react';

// Mock Data representing a Bank Statement
const MOCK_BANK_DATA: BankTransaction[] = [];

const BankReconciliation: React.FC = () => {
  const { addTransaction } = useAccounting();
  
  // Load data từ LocalStorage (nếu có), nếu không thì dùng MOCK mới nhất
  const [transactions, setTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('BANK_HUB_DATA');
    return saved ? JSON.parse(saved) : MOCK_BANK_DATA;
  });

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Settings State (Restored)
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState('casso'); 
  const [apiKey, setApiKey] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Simulation State (Restored)
  const [simAmount, setSimAmount] = useState(5000000);
  const [simDesc, setSimDesc] = useState('KH TRAN VAN B CK TIEN TOUR SAPA');

  // Tự động lưu vào LocalStorage mỗi khi transactions thay đổi
  useEffect(() => {
    localStorage.setItem('BANK_HUB_DATA', JSON.stringify(transactions));
  }, [transactions]);

  // Bỏ hàm handleAnalyze và simulation AI phức tạp
  // Thay vào đó là hàm Duyệt đơn giản
  // AI Analysis Function
  const handleAnalyze = async (trans: BankTransaction) => {
    setAnalyzingId(trans.id);
    const result = await analyzeBankTransaction(trans.description, trans.amount, trans.type);
    
    setTransactions(prev => prev.map(t => 
      t.id === trans.id ? { ...t, aiSuggestion: result } : t
    ));
    setAnalyzingId(null);
  };

  const handleApprove = async (trans: BankTransaction) => {
    // Ưu tiên dùng dữ liệu AI nếu có
    const category = trans.aiSuggestion?.category || (trans.type === 'CREDIT' ? 'Doanh thu khác' : 'Chi phí khác');
    const note = trans.aiSuggestion?.note || trans.description;

    const newTransaction = {
        id: Date.now().toString(),
        date: trans.date,
        description: note,
        amount: trans.amount,
        type: trans.type === 'CREDIT' ? 'INCOME' : 'EXPENSE',
        category: category,
    };

    try {
        await addTransaction(newTransaction as any);
        setTransactions(prev => prev.map(t => 
            t.id === trans.id ? { ...t, status: 'MATCHED' } : t
        ));
        console.log("Đã hạch toán:", newTransaction);
    } catch (e) {
        alert("Lỗi khi lưu vào CSDL: " + e);
    }
  };

  const simulateWebhook = () => {
    const newTrans: BankTransaction = {
      id: `sim_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: simDesc,
      amount: simAmount,
      type: 'CREDIT',
      status: 'NEW'
    };
    // Add to top
    setTransactions(prev => [newTrans, ...prev]);
    
    // Auto analyze for "Wow" effect (Chạy ngầm AI ngay lập tức)
    setTimeout(() => handleAnalyze(newTrans), 500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            Bank Hub (Kết nối Ngân hàng)
          </h1>
          <p className="text-slate-500 mt-1">Đồng bộ giao dịch tự động. Duyệt dể cập nhật vào Sổ cái.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border transition-colors ${showSettings ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Settings className="w-4 h-4" /> Cấu hình Kết nối
        </button>
      </div>

      {/* Configuration Panel */}
      {/* Configuration Panel */}
      {showSettings && (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-inner animate-fade-in-up">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Thiết lập kết nối (Dành cho Khách hàng)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp dịch vụ trung gian</label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                >
                  <option value="casso">Casso.vn (Khuyên dùng)</option>
                  <option value="sepay">SePay.vn</option>
                  <option value="vietqr">VietQR Pro</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Khách hàng cần đăng ký tài khoản tại <a href="https://casso.vn" target="_blank" className="text-blue-600 hover:underline">casso.vn</a> hoặc tương tự để lấy API Key.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản ngân hàng</label>
                <input 
                  type="text" 
                  value={bankAccount} 
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Ví dụ: 99998888xxx - MB Bank"
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key / Token (Từ nhà cung cấp Bank)</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập API Key Bank..."
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

               {/* AI Settings Section */}
               <div className="pt-4 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-600" />
                    API Key Gemini (Cho Báo cáo Tổng quan)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder="Nhập Google Gemini API Key..."
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                      defaultValue={localStorage.getItem('GEMINI_API_KEY') || ''}
                      onChange={(e) => localStorage.setItem('GEMINI_API_KEY', e.target.value)}
                    />
                     <button 
                        onClick={() => alert("Đã lưu Key thành công!")}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200"
                      >
                        Lưu
                      </button>
                  </div>
               </div>

              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                 <p className="text-xs font-semibold text-blue-800 mb-1">Webhook URL (Copy link này dán vào cấu hình Casso/SePay):</p>
                 <code className="block bg-white p-2 rounded border border-blue-200 text-xs break-all text-slate-600">
                   https://us-central1-smartaccounting-saas.cloudfunctions.net/bankWebhook/receive
                 </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Tools */}
      <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 flex flex-wrap items-center gap-4">
        <label className="font-semibold text-sm text-slate-700">Test Webhook:</label>
        <input 
          type="text" 
          value={simDesc}
          onChange={(e) => setSimDesc(e.target.value)}
          className="flex-1 rounded-md border-slate-300 text-sm shadow-sm border p-2 min-w-[200px]"
          placeholder="Nội dung ck..."
        />
        <input 
          type="number" 
          value={simAmount}
          onChange={(e) => setSimAmount(Number(e.target.value))}
          className="w-32 rounded-md border-slate-300 text-sm shadow-sm border p-2"
        />
        <button 
          onClick={simulateWebhook}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm"
        >
          + Giả lập Tiền về
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-4">Ngày</th>
              <th className="px-4 py-4">Diễn giải giao dịch</th>
              <th className="px-4 py-4 text-right">Số tiền</th>
              <th className="px-4 py-4 w-1/3">AI Gợi ý (Auto)</th>
              <th className="px-4 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'MATCHED' ? 'bg-green-50' : ''}`}>
                <td className="px-4 py-4 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-800">{t.description}</div>
                  <div className="text-xs mt-1 text-slate-500">{t.type === 'CREDIT' ? 'Tiền vào' : 'Tiền ra'}</div>
                </td>
                <td className={`px-4 py-4 text-right font-mono font-medium text-base ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'CREDIT' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}
                </td>
                
                <td className="px-4 py-4">
                  {analyzingId === t.id ? (
                      <span className="flex items-center text-xs text-blue-600 animate-pulse">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Đang phân tích...
                      </span>
                  ) : t.aiSuggestion ? (
                    <div className="bg-purple-50 p-2 rounded border border-purple-100">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-purple-700">{t.aiSuggestion?.category || 'Khác'}</span>
                            {t.aiSuggestion?.confidence && t.aiSuggestion.confidence > 0.8 && (
                                <span className="text-[10px] bg-purple-200 text-purple-800 px-1 rounded">Tin cậy cao</span>
                            )}
                        </div>
                        <div className="mt-1 border-t border-purple-200 pt-1">
                           <span className="text-[10px] text-slate-400 uppercase font-semibold">Diễn giải mới:</span>
                           <p className="text-xs text-slate-800 font-medium italic">"{t.aiSuggestion?.note || ''}"</p>
                        </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">- Chưa phân tích -</span>
                  )}
                </td>

                <td className="px-4 py-4 text-center">
                   {t.status === 'MATCHED' ? (
                      <button 
                        disabled
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-400 cursor-not-allowed"
                      >
                         <Check className="w-3 h-3 mr-1" /> Đã duyệt
                      </button>
                   ) : (
                      <button 
                        onClick={() => handleApprove(t)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                         <Check className="w-3 h-3 mr-1" /> Duyệt
                      </button>
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
