import React, { useState, useRef } from 'react';
import { useAccounting } from '../contexts/AccountingContext';
import { extractInvoiceDetails } from '../services/geminiService';
import { InvoiceData, Transaction } from '../types';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Save, X, FileText } from 'lucide-react';

const InvoiceProcessor: React.FC = () => {
  // 1. Get global invoices from Context
  const { addTransaction, invoices: globalInvoices } = useAccounting();
  
  // 2. Initialize local state with global invoices
  const [invoices, setInvoices] = useState<InvoiceData[]>(globalInvoices);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Sync: When global context changes (e.g. added from Reconciliation), update local state
  // But only if we are NOT currently processing new files to avoid overwriting work in progress
  React.useEffect(() => {
     if (!isProcessing) {
        setInvoices(globalInvoices);
     }
  }, [globalInvoices, isProcessing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        fileObject: file,
        data: {
          fileName: file.name,
          invoiceNumber: '',
          date: '',
          vendorName: 'Đang chờ...',
          vendorTaxCode: '',
          vendorAddress: '',
          buyerName: '',
          items: [],
          subTotal: 0,
          totalAmount: 0,
          taxAmount: 0,
          taxRate: '',
          paymentMethod: '',
          description: '',
          category: '',
          status: 'pending' as const
        }
      }));
      
      // Merge new files being uploaded with existing list
      setInvoices(prev => [...newFiles.map(f => f.data), ...prev]);
      processFiles(e.target.files);
    }
  };

  const processFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const reader = new FileReader();

      reader.onload = async (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const mimeType = file.type;

        setInvoices(prev => prev.map(inv => 
          inv.fileName === file.name ? { ...inv, status: 'processing' } : inv
        ));

        const extractedData = await extractInvoiceDetails(base64String, mimeType);

        setInvoices(prev => prev.map(inv => {
          if (inv.fileName === file.name) {
            if (extractedData) {
              return {
                ...inv,
                ...extractedData,
                status: 'success'
              };
            } else {
              return { ...inv, status: 'error' };
            }
          }
          return inv;
        }));
      };

      reader.readAsDataURL(file);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    if (invoices.length === 0) return;

    // Use semicolon for better compatibility with Vietnamese Excel region settings
    const DELIMITER = ";";
    
    // Header row
    const headers = [
      "Ngày HĐ", 
      "Số Hóa Đơn", 
      "MST Người Bán",
      "Tên Người Bán", 
      "Địa Chỉ NCC", 
      "Tên Người Mua", 
      "Tên Hàng Hóa/Dịch Vụ", // Item level detail
      "ĐVT",
      "Số Lượng",
      "Đơn Giá",
      "Thành Tiền (Item)",
      "Thuế Suất",
      "Tiền Thuế (Tổng)", 
      "Tổng Thanh Toán (Tổng)", 
      "Trạng Thái"
    ];

    const rows: string[] = [];
    rows.push(headers.join(DELIMITER));

    invoices.forEach(inv => {
      // Helper to escape CSV fields
      const esc = (val: string | number | undefined) => {
        if (val === undefined || val === null) return '""';
        const str = String(val);
        // If contains delimiter or quote, wrap in quotes and double escape quotes
        if (str.includes(DELIMITER) || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      // Helper for number formatting (raw number for excel calculation)
      const num = (val: number | undefined) => val || 0;

      if (inv.items && inv.items.length > 0) {
        // Create a row for each item (Master-Detail flattening)
        inv.items.forEach(item => {
          rows.push([
            esc(inv.date),
            esc(inv.invoiceNumber),
            esc(inv.vendorTaxCode),
            esc(inv.vendorName),
            esc(inv.vendorAddress),
            esc(inv.buyerName),
            esc(item.description),
            esc(""), // Unit (not currently extracted)
            num(item.quantity),
            num(item.unitPrice),
            num(item.totalAmount),
            esc(inv.taxRate),
            num(inv.taxAmount), // Repeated for each row or you can leave blank for subsequent rows
            num(inv.totalAmount),
            esc(inv.status === 'success' ? 'Thành công' : 'Thất bại')
          ].join(DELIMITER));
        });
      } else {
        // If no specific items, just output the main description
        rows.push([
          esc(inv.date),
          esc(inv.invoiceNumber),
          esc(inv.vendorTaxCode),
          esc(inv.vendorName),
          esc(inv.vendorAddress),
          esc(inv.buyerName),
          esc(inv.description),
          esc(""),
          0,
          0,
          num(inv.subTotal),
          esc(inv.taxRate),
          num(inv.taxAmount),
          num(inv.totalAmount),
          esc(inv.status === 'success' ? 'Thành công' : 'Thất bại')
        ].join(DELIMITER));
      }
    });

    const csvContent = rows.join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `xuat_hoa_don_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToBook = (invoice: InvoiceData) => {
    if (invoice.status !== 'success') return;
    
    const newTransaction: Transaction = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      date: invoice.date || new Date().toISOString().split('T')[0],
      description: `${invoice.vendorName} - ${invoice.description}`,
      amount: invoice.totalAmount,
      type: 'EXPENSE',
      category: invoice.category || 'Hóa đơn',
    };
    
    addTransaction(newTransaction);
    setInvoices(prev => prev.filter(inv => inv.fileName !== invoice.fileName));
  };

  const handleRemove = (fileName: string) => {
    setInvoices(prev => prev.filter(inv => inv.fileName !== fileName));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Xử Lý Hóa Đơn Chi Tiết</h1>
          <p className="text-slate-500">Tự động trích xuất MST, Hàng hóa, Thuế và xuất Excel chi tiết</p>
        </div>
        <div className="flex gap-2">
           <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Tải Hóa Đơn
          </button>
          <button
            onClick={handleExportExcel}
            disabled={invoices.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Xuất Excel (CSV)
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*"
        />
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 whitespace-nowrap">Ngày / Số HĐ</th>
                <th className="px-4 py-4">Bên Bán (MST)</th>
                <th className="px-4 py-4">Bên Mua</th>
                <th className="px-4 py-4 w-1/3">Danh sách Hàng hóa</th>
                <th className="px-4 py-4 text-right whitespace-nowrap">Thuế (Suất/Tiền)</th>
                <th className="px-4 py-4 text-right whitespace-nowrap">Tổng Thanh Toán</th>
                <th className="px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      <p>Chưa có hóa đơn nào được tải lên.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors align-top">
                    {/* Column 1: Date & Inv No */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">{inv.date}</div>
                      <div className="text-xs text-slate-500 mt-1">Số: {inv.invoiceNumber || '--'}</div>
                    </td>

                    {/* Column 2: Vendor */}
                    <td className="px-4 py-4 max-w-[200px]">
                      <div className="font-medium text-slate-800 line-clamp-2" title={inv.vendorName}>{inv.vendorName}</div>
                      <div className="text-xs text-blue-600 mt-1 font-mono">{inv.vendorTaxCode || 'Chưa có MST'}</div>
                    </td>

                    {/* Column 3: Buyer */}
                    <td className="px-4 py-4 max-w-[150px]">
                      <div className="text-slate-700 line-clamp-2" title={inv.buyerName || ''}>
                        {inv.buyerName || <span className="text-slate-400 italic">Không tìm thấy</span>}
                      </div>
                    </td>

                    {/* Column 4: Items List */}
                    <td className="px-4 py-4">
                      {inv.items && inv.items.length > 0 ? (
                        <div className="space-y-1">
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="text-xs border-b border-dashed border-slate-100 last:border-0 pb-1 last:pb-0">
                              <span className="font-medium text-slate-700">• {item.description}</span>
                              <div className="text-slate-500 pl-2">
                                {item.quantity > 0 && <span>SL: {item.quantity} </span>} 
                                {item.totalAmount > 0 && <span>| TT: {item.totalAmount.toLocaleString('vi-VN')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">{inv.description}</span>
                      )}
                    </td>

                    {/* Column 5: Tax */}
                    <td className="px-4 py-4 text-right">
                       <div className="font-medium text-slate-800">{inv.taxAmount ? inv.taxAmount.toLocaleString('vi-VN') : 0}</div>
                       <div className="text-xs text-slate-500 mt-1">{inv.taxRate ? `VAT: ${inv.taxRate}` : ''}</div>
                    </td>

                    {/* Column 6: Total */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-blue-600 text-base">
                        {inv.totalAmount ? inv.totalAmount.toLocaleString('vi-VN') : 0}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{inv.status === 'success' ? 'Hoàn thành' : 'Đang xử lý...'}</div>
                    </td>

                    {/* Column 7: Actions */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                       {inv.status === 'success' && (
                          <button 
                            onClick={() => handleSaveToBook(inv)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lưu vào sổ cái"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                       )}
                       <button 
                          onClick={() => handleRemove(inv.fileName)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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

export default InvoiceProcessor;
