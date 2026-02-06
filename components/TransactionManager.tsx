import React, { useState, useMemo } from 'react';
import { useAccounting } from '../contexts/AccountingContext';
import { Transaction, TransactionType } from '../types';
import { predictCategory } from '../services/geminiService';
import { Plus, Trash2, Wand2, Search, ArrowUpCircle, ArrowDownCircle, Filter, X, Calendar, Loader2, FileSpreadsheet } from 'lucide-react';

const TransactionManager: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, isLoading } = useAccounting();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPredicting, setIsPredicting] = useState(false);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const handlePredict = async () => {
    if (!desc) return;
    setIsPredicting(true);
    const prediction = await predictCategory(desc);
    if (prediction) {
      setCategory(prediction.category);
      setType(prediction.type);
    }
    setIsPredicting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newTransaction: Transaction = {
      id: '', // Firestore will assign ID
      date,
      description: desc,
      amount: parseFloat(amount),
      type,
      category: category || 'Khác',
    };

    addTransaction(newTransaction);
    // Reset form
    setDesc('');
    setAmount('');
    setCategory('');
    setIsFormOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterType('ALL');
    setFilterCategory('ALL');
  };

  const filteredTransactions = transactions.filter(t => {
    // 1. Search Term
    const matchesSearch = searchTerm === '' || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Type Filter
    const matchesType = filterType === 'ALL' || t.type === filterType;

    // 3. Category Filter
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;

    // 4. Date Range Filter
    const matchesDateFrom = !filterDateFrom || t.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || t.date <= filterDateTo;

    return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const totalFilteredAmount = filteredTransactions.reduce((acc, t) => {
    return t.type === 'INCOME' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Sổ Thu Chi</h1>
        <div className="flex gap-2">
           <button 
             onClick={() => {
                // HTML Table Format for better Excel compatibility
                const tableContent = `
                  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                  <head>
                    <meta charset="utf-8" />
                    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sổ Thu Chi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                    <style>
                      td, th { border: 0.5pt solid #000000; padding: 5px; vertical-align: middle; }
                      th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
                      .num { mso-number-format:"#,##0"; text-align: right; }
                      .text { mso-number-format:"\@"; }
                    </style>
                  </head>
                  <body>
                    <table>
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Mô tả</th>
                          <th>Danh mục</th>
                          <th>Loại</th>
                          <th>Số tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredTransactions.map(t => `
                          <tr>
                            <td class="text">${t.date}</td>
                            <td class="text">${t.description}</td>
                            <td class="text">${t.category}</td>
                            <td class="text">${t.type === 'INCOME' ? 'Thu' : 'Chi'}</td>
                            <td class="num">${t.amount}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </body>
                  </html>
                `;
                
                const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `So_Thu_Chi_${new Date().toISOString().slice(0,10)}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
             }}
             className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
           >
             <FileSpreadsheet className="w-5 h-5" />
             Xuất Excel
           </button>
           <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Thêm Giao Dịch
          </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="space-y-4">
        {/* Search Bar & Filter Toggle */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mô tả..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-colors ${
              showFilters || filterType !== 'ALL' || filterCategory !== 'ALL' || filterDateFrom || filterDateTo
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Bộ lọc</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-fade-in space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Date Range */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Từ ngày</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full p-2 pl-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Đến ngày</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full p-2 pl-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Loại giao dịch</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="INCOME">Thu nhập</option>
                  <option value="EXPENSE">Chi phí</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Danh mục</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả danh mục</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
               <div className="text-sm text-slate-500">
                  Hiển thị <b>{filteredTransactions.length}</b> kết quả
               </div>
               <button 
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Xóa bộ lọc
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Ngày</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4 text-right">Số tiền</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-blue-500 gap-2">
                       <Loader2 className="w-8 h-8 animate-spin" />
                       <p className="text-sm text-slate-500">Đang đồng bộ dữ liệu từ đám mây...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                 <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                       <Search className="w-8 h-8 opacity-50" />
                       <p>Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {t.type === 'INCOME' ? 
                              <ArrowUpCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : 
                              <ArrowDownCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                           }
                           <span className="font-medium line-clamp-1">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200 whitespace-nowrap">
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'EXPENSE' ? '-' : '+'}{t.amount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Summary Row for Filtered Results */}
                  <tr className="bg-slate-50 font-semibold text-slate-800">
                    <td colSpan={3} className="px-6 py-4 text-right">Tổng cộng (Đã lọc):</td>
                    <td className={`px-6 py-4 text-right ${totalFilteredAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {totalFilteredAmount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Thêm Giao Dịch Mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="VD: Mua mực in..."
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePredict}
                    disabled={isPredicting || !desc}
                    className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                    title="Tự động điền bằng AI"
                  >
                    <Wand2 className={`w-5 h-5 ${isPredicting ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as TransactionType)}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="EXPENSE">Chi phí</option>
                      <option value="INCOME">Thu nhập</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VND)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="VD: Văn phòng"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
