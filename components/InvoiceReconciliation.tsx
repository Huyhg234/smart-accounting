import React, { useState } from 'react';
import { useAccounting } from '../contexts/AccountingContext'; // Import Context
import { BankTransaction, Contract, ReconciliationResult } from '../types';
import { matchBankToInvoice } from '../services/geminiService';
import { Calculator, FilePlus, RefreshCw, Wand2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const InvoiceReconciliation: React.FC = () => {
    const { transactions, addInvoice } = useAccounting(); 
    const [results, setResults] = useState<ReconciliationResult[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    
    // State quản lý danh sách Hợp đồng (Thay thế Mock cứng)
    const [contracts, setContracts] = useState<Contract[]>([
        { id: 'c1', customerName: 'Khách hàng Trần Văn B', contractValue: 5000000, invoicedAmount: 0, status: 'OPEN' },
        { id: 'c2', customerName: 'Công Ty Du Lịch Việt', contractValue: 50000000, invoicedAmount: 30000000, status: 'OPEN' }
    ]);
    const [newContract, setNewContract] = useState({ name: '', value: 0 });

    const addContract = () => {
        if(!newContract.name || newContract.value <= 0) return;
        setContracts([...contracts, {
            id: `c_${Date.now()}`,
            customerName: newContract.name,
            contractValue: newContract.value,
            invoicedAmount: 0,
            status: 'OPEN'
        }]);
        setNewContract({ name: '', value: 0 });
    };

    // ... (rest of filtering logic)

  // Lọc lấy các khoản THU nhập thực tế từ Bank Hub đã duyệt
  const realIncomeData = transactions.filter(t => t.type === 'INCOME').map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: 'CREDIT',
      status: 'MATCHED'
  } as BankTransaction));

  const handleAIMatch = async () => {
    if (realIncomeData.length === 0) {
        alert("Chưa có dữ liệu thu nhập nào để đối soát. Vui lòng vào Bank Hub duyệt giao dịch trước!");
        return;
    }
    setIsMatching(true);
    // Gọi AI so khớp Dữ liệu thật vs Hợp đồng mẫu
    const matches = await matchBankToInvoice(realIncomeData, contracts);
    setResults(matches);
    setIsMatching(false);
  };

  const handleAction = async (res: ReconciliationResult) => {
    const confirmation = confirm(`Xác nhận tạo DRAFT hóa đơn cho HĐ ${res.contractId} với số tiền ${res.difference.toLocaleString('vi-VN')}?`);
    if (!confirmation) return;

    // Tạo hóa đơn mới
    const newInvoice = {
        fileName: `DRAFT_INV_${res.contractId}_${Date.now()}`,
        invoiceNumber: `DRAFT-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        vendorName: "Công Ty Của Bạn",
        vendorTaxCode: "",
        vendorAddress: "",
        buyerName: contracts.find(c => c.id === res.contractId)?.customerName || "Khách lẻ",
        taxAmount: Math.round(res.difference * 0.08), // Giả sử thuế 8%
        taxRate: "8%",
        totalAmount: res.difference,
        subTotal: Math.round(res.difference / 1.08),
        description: `Thu tiền theo HĐ ${res.contractId} - ${res.reason}`,
        category: "Doanh thu dịch vụ",
        status: 'success', // Changed to success so it can be saved to ledger immediately
        items: [], 
        paymentMethod: "Chuyển khoản"
    };

    await addInvoice(newInvoice as any);
    alert("✅ Đã tạo Hóa đơn nháp thành công! Vui lòng kiểm tra trong mục 'Quản lý Hóa đơn'.");
  };
    
  return (
    <div className="space-y-6 animate-fade-in">
       {/* ... Header ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đối Soát Công Nợ Tự Động</h1>
          <p className="text-slate-500">So khớp <b className="text-green-600">Tiền đã thu (Sổ cái)</b> với <b className="text-orange-600">Hợp đồng cần thu</b>.</p>
        </div>
        <button 
          onClick={handleAIMatch}
          disabled={isMatching}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-purple-200 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100"
        >
          {isMatching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          AI Quét & Khớp Lệnh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Data Visualization */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-green-100 p-1 rounded text-green-700 text-xs">SỔ CÁI (REALTIME)</span>
              Tiền đã thu về (Đã duyệt từ Bank)
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {realIncomeData.length === 0 ? (
                  <p className="text-sm text-slate-400 italic p-4 text-center">Chưa có giao dịch thu nào.</p>
              ) : realIncomeData.map(t => (
                <div key={t.id} className="p-3 bg-green-50 rounded border border-green-100 text-sm">
                  <div className="font-semibold text-slate-800">{t.description}</div>
                  <div className="text-green-600 font-mono font-bold">+{t.amount.toLocaleString('vi-VN')}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{t.date}</div>
                </div>
              ))}
            </div>
          </div>
          {/* ... Contract List ... */}

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="bg-orange-100 p-1 rounded text-orange-700 text-xs">HỢP ĐỒNG</span>
                Danh sách chờ thanh toán
                </h3>
            </div>
            
            {/* Input Form */}
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="Tên Khách Hàng (VD: Trần Văn B)" 
                    className="flex-1 text-xs border rounded px-2 py-1"
                    value={newContract.name}
                    onChange={e => setNewContract({...newContract, name: e.target.value})}
                />
                <input 
                    type="number" 
                    placeholder="Giá trị HĐ" 
                    className="w-24 text-xs border rounded px-2 py-1"
                    value={newContract.value || ''}
                    onChange={e => setNewContract({...newContract, value: Number(e.target.value)})}
                />
                <button onClick={addContract} className="bg-orange-500 text-white text-xs px-3 rounded hover:bg-orange-600">Thêm</button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {contracts.map(c => (
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
