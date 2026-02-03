import React, { useState } from 'react';
import { TourDiscrepancy } from '../types';
import { compareTourExpenses } from '../services/geminiService';
import { Upload, AlertTriangle, CheckCircle, ArrowRight, FileText, ScanSearch, FileWarning } from 'lucide-react';

const TourExpenseChecker: React.FC = () => {
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [discrepancies, setDiscrepancies] = useState<TourDiscrepancy[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'PLAN' | 'REPORT') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'PLAN') setPlanFile(e.target.files[0]);
      else setReportFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleAudit = async () => {
    if (!planFile || !reportFile) return;
    setIsProcessing(true);
    setIsDone(false);

    try {
      const planB64 = await fileToBase64(planFile);
      const reportB64 = await fileToBase64(reportFile);
      
      const result = await compareTourExpenses(planB64, planFile.type, reportB64, reportFile.type);
      setDiscrepancies(result);
      setIsDone(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Kiểm Toán Chi Phí Tour (AI Audit)</h1>
        <p className="text-slate-500 mb-6">Hệ thống AI tự động đối chiếu hình ảnh "Chương trình tour" và "Bảng kê chi tiêu" để tìm gian lận hoặc sai sót.</p>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Plan Upload */}
          <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all bg-white ${planFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="p-4 bg-white shadow-sm text-blue-600 rounded-full mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">1. Chương Trình Tour (Plan)</h3>
            <p className="text-xs text-slate-400 mb-4">File Word, PDF, Ảnh chương trình</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'PLAN')} 
              className="hidden" 
              id="plan-upload" 
            />
            <label 
              htmlFor="plan-upload"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-500 cursor-pointer shadow-sm min-w-[120px]"
            >
              {planFile ? "Đã chọn file" : "Chọn file"}
            </label>
            {planFile && <p className="text-xs text-blue-600 mt-2 font-medium">{planFile.name}</p>}
          </div>

          {/* Report Upload */}
          <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all bg-white ${reportFile ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="p-4 bg-white shadow-sm text-green-600 rounded-full mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">2. Bảng Kê Thực Tế (Actual)</h3>
            <p className="text-xs text-slate-400 mb-4">File Excel, Ảnh chụp hóa đơn/bảng kê</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'REPORT')} 
              className="hidden" 
              id="report-upload" 
            />
            <label 
              htmlFor="report-upload"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-green-500 cursor-pointer shadow-sm min-w-[120px]"
            >
               {reportFile ? "Đã chọn file" : "Chọn file"}
            </label>
            {reportFile && <p className="text-xs text-green-600 mt-2 font-medium">{reportFile.name}</p>}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleAudit}
            disabled={!planFile || !reportFile || isProcessing}
            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all transform hover:scale-105"
          >
            {isProcessing ? (
               <ScanSearch className="w-5 h-5 animate-spin" />
            ) : (
               <ScanSearch className="w-5 h-5" />
            )}
            {isProcessing ? "AI Đang Phân Tích & Đối Chiếu..." : "Bắt Đầu Kiểm Tra"}
          </button>
        </div>

        {/* Results Section */}
        {isDone && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Kết Quả Kiểm Toán
                {discrepancies.length > 0 ? (
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full animate-pulse">
                    {discrepancies.length} CẢNH BÁO
                  </span>
                ) : (
                  <span className="text-xs font-bold text-white bg-green-500 px-2 py-1 rounded-full">
                    HỢP LỆ
                  </span>
                )}
              </h3>
            </div>
            
            {discrepancies.length === 0 ? (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Không tìm thấy sai lệch</h4>
                <p className="text-slate-500 mt-2 max-w-md">Tuyệt vời! Dữ liệu chi tiêu thực tế khớp hoàn toàn với định mức trong chương trình tour.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-12 bg-slate-50 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4 pl-3">Hạng mục</div>
                  <div className="col-span-2 text-center">Kế hoạch (Plan)</div>
                  <div className="col-span-2 text-center">Thực tế (Actual)</div>
                  <div className="col-span-4">Vấn đề</div>
                </div>
                {discrepancies.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 p-4 hover:bg-red-50/30 transition-colors gap-4 md:gap-0 items-center">
                    
                    <div className="md:col-span-4 flex items-start gap-3 pl-2">
                       {item.severity === 'HIGH' ? (
                          <FileWarning className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                       ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                       )}
                       <div>
                         <span className="font-bold text-slate-800 block">{item.item}</span>
                         {item.severity === 'HIGH' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">Nghiêm trọng</span>}
                       </div>
                    </div>

                    <div className="md:col-span-2 text-center">
                      <div className="md:hidden text-xs text-slate-400 mb-1">Plan</div>
                      <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{item.planAmount}</span>
                    </div>

                    <div className="md:col-span-2 text-center">
                      <div className="md:hidden text-xs text-slate-400 mb-1">Actual</div>
                      <span className="font-mono font-bold text-red-600 bg-white border border-red-200 px-2 py-1 rounded shadow-sm">{item.actualAmount}</span>
                    </div>

                    <div className="md:col-span-4 md:pl-4">
                      <p className="text-sm text-red-700 leading-snug">{item.issue}</p>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourExpenseChecker;
