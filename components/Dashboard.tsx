import React, { useState, useMemo } from 'react';
import { useAccounting } from '../contexts/AccountingContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Sparkles, FileText, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { generateFinancialReport } from '../services/geminiService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC = () => {
  const { summary, transactions, isOfflineMode } = useAccounting();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Prepare data for Expense by Category Pie Chart
  const expenseByCategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  // Prepare data for Last 5 Days Bar Chart
  const last5Trans = transactions.slice(0, 10).reverse();
  
  // Prepare data for Cash Flow Trend Chart
  const trendData = useMemo(() => {
    const groupedData: Record<string, { name: string; income: number; expense: number; sortDate: string }> = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      let displayName = '';
      let sortDate = '';

      if (timeRange === 'month') {
        // Group by Month (YYYY-MM)
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        displayName = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
        sortDate = t.date.substring(0, 7); // YYYY-MM
      } else {
        // Group by Week (Monday of the week)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(date.setDate(diff));
        key = monday.toISOString().split('T')[0];
        displayName = `Tuần ${monday.getDate()}/${monday.getMonth() + 1}`;
        sortDate = key;
      }

      if (!groupedData[key]) {
        groupedData[key] = { name: displayName, income: 0, expense: 0, sortDate };
      }

      if (t.type === 'INCOME') {
        groupedData[key].income += t.amount;
      } else {
        groupedData[key].expense += t.amount;
      }
    });

    // Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  }, [transactions, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    // Slight scroll to report area
    setTimeout(() => {
      document.getElementById('ai-report-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    const result = await generateFinancialReport(transactions);
    setReport(result);
    setIsGeneratingReport(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Offline Alert */}
      {isOfflineMode && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">Chế độ Offline (Demo)</p>
            <p className="text-xs">Dữ liệu đang được lưu tạm thời trên trình duyệt. Vui lòng cập nhật firebaseConfig.ts để đồng bộ Cloud.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Tổng Quan Tài Chính</h1>
        <button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-purple-200 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100"
        >
          {isGeneratingReport ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          <span>Phân Tích & Báo Cáo AI</span>
        </button>
      </div>

      {/* AI Report Section */}
      {(report || isGeneratingReport) && (
        <div id="ai-report-section" className="bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden animate-fade-in-up">
           <div className="bg-gradient-to-r from-slate-50 to-purple-50 p-4 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Báo Cáo Tài Chính Chuyên Sâu</h3>
                  <p className="text-xs text-slate-500">Được tạo bởi Gemini 3.0 Pro • Kế toán trưởng ảo</p>
                </div>
              </div>
              {report && (
                <button 
                  onClick={handleGenerateReport} 
                  className="text-slate-400 hover:text-purple-600 p-2"
                  title="Phân tích lại"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
           </div>
           
           <div className="p-8">
              {isGeneratingReport ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                   <div className="relative">
                     <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                     <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                       <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                     </div>
                   </div>
                   <p className="text-slate-600 font-medium">Đang tổng hợp số liệu và phân tích rủi ro...</p>
                   <p className="text-slate-400 text-sm">Quá trình này có thể mất vài giây.</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  {/* Simple renderer for markdown-like text since we don't have a markdown library installed */}
                  {report?.split('\n').map((line, index) => {
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-bold text-purple-800 mt-6 mb-3 border-b border-purple-100 pb-2">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={index} className="ml-4 text-slate-700 mb-1 list-disc">{line.replace('- ', '')}</li>;
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    // Bold formatting check (simple regex for **text**)
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={index} className="text-slate-700 leading-relaxed mb-2 text-justify">
                        {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-400 italic">Báo cáo này được tạo tự động dựa trên dữ liệu hiện có. Vui lòng tham khảo ý kiến chuyên gia cho các quyết định quan trọng.</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tổng Thu Nhập</p>
            <h3 className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tổng Chi Phí</p>
            <h3 className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</h3>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Lợi Nhuận Ròng</p>
            <h3 className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expense Composition */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Cơ Cấu Chi Phí</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">Chưa có dữ liệu chi phí</div>
          )}
        </div>

        {/* Recent Flow */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Giao Dịch Gần Đây</h3>
           <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last5Trans}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} hide />
              <YAxis hide />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" name="Giá trị" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {last5Trans.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'INCOME' ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[450px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Xu Hướng Dòng Tiền</h3>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeRange === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeRange === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Theo Tháng
            </button>
          </div>
        </div>
        
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Bar dataKey="income" name="Thu Nhập" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="expense" name="Chi Phí" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 gap-2">
            <Calendar className="w-6 h-6" />
            <span>Chưa có đủ dữ liệu để hiển thị xu hướng</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
