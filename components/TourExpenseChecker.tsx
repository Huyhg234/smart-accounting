import React, { useState } from 'react';
import { AuditReport, TourDiscrepancy } from '../types';
import { compareTourExpenses } from '../services/geminiService';
import { Upload, AlertTriangle, CheckCircle, ArrowRight, FileText, ScanSearch, FileWarning } from 'lucide-react';

const TourExpenseChecker: React.FC = () => {
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [auditResult, setAuditResult] = useState<AuditReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'PLAN' | 'REPORT') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'PLAN') setPlanFile(e.target.files[0]);
      else setReportFile(e.target.files[0]);
    }
  };

  // Helper đọc file
  const readFileContent = (file: File): Promise<{ type: 'text' | 'image', content: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      // 1. New Feature: Support Excel Files directly using xlsx library
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
           import('xlsx').then(XLSX => {
              const reader = new FileReader();
              reader.readAsArrayBuffer(file);
              reader.onload = (e) => {
                  try {
                      const data = new Uint8Array(e.target?.result as ArrayBuffer);
                      const workbook = XLSX.read(data, { type: 'array' });
                      const firstSheetName = workbook.SheetNames[0];
                      const worksheet = workbook.Sheets[firstSheetName];
                      // Convert to CSV for AI to read easily
                      const csv = XLSX.utils.sheet_to_csv(worksheet);
                      resolve({ type: 'text', content: csv, mimeType: 'text/csv' });
                  } catch (err) {
                      reject("Lỗi đọc file Excel: " + err);
                  }
              };
              reader.onerror = reject;
           }).catch(err => {
               alert("Chưa tải được thư viện đọc Excel. Vui lòng check mạng!");
               reject(err);
           });
          return;
      }

      // 2. Nếu là Text hoặc CSV -> Đọc dạng Text
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.readAsText(file);
          reader.onload = () => resolve({ type: 'text', content: reader.result as string, mimeType: 'text/plain' });
          reader.onerror = reject;
      } 
      // 3. Nếu là Ảnh/PDF -> Đọc Base64
      else {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({ type: 'image', content: base64, mimeType: file.type });
          };
          reader.onerror = reject;
      }
    });
  };

  const handleAudit = async () => {
    if (!planFile || !reportFile) return;
    setIsProcessing(true);
    setIsDone(false);

    try {
      const planData = await readFileContent(planFile);
      const reportData = await readFileContent(reportFile);
      
      const result = await compareTourExpenses(planData, reportData);
      setAuditResult(result);
      setIsDone(true);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper Export Excel (HTML Table trick)
  const exportToCSV = () => {
    if (!auditResult) return;
    
    // HTML Table Format
    const tableContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Kết Quả Kiểm Toán</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          td, th { border: 0.5pt solid #000000; padding: 5px; vertical-align: middle; }
          th { background-color: #dbeafe; font-weight: bold; text-align: center; color: #1e3a8a; }
          .num { mso-number-format:"#,##0"; text-align: right; }
          .text { mso-number-format:"\@"; }
          .error { background-color: #fee2e2; color: #b91c1c; font-weight: bold; }
          .warning { background-color: #ffedd5; color: #c2410c; }
          .ok { color: #15803d; }
          .title { font-size: 16pt; font-weight: bold; text-align: center; border: none; }
          .summary { font-weight: bold; border: none; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="5" class="title">BÁO CÁO KIỂM TOÁN TOUR TỰ ĐỘNG</td></tr>
          <tr><td colspan="5" style="border:none">Thời gian xuất: ${new Date().toLocaleString('vi-VN')}</td></tr>
          <tr><td colspan="5" style="border:none"></td></tr>
          
          <!-- Summary Section -->
          <tr>
             <td colspan="2" class="summary">Tổng chi thực tế:</td>
             <td colspan="3" class="num summary" style="color: #1e293b">${auditResult.summary.totalActual}</td>
          </tr>
          <tr>
             <td colspan="2" class="summary">Chi sai phạm/Nghi ngờ:</td>
             <td colspan="3" class="num summary" style="color: #dc2626">${auditResult.summary.totalIllegal}</td>
          </tr>
          <tr>
             <td colspan="2" class="summary">Tỷ lệ tuân thủ:</td>
             <td colspan="3" class="summary" style="text-align: right; color: ${auditResult.summary.complianceRate >= 90 ? 'green' : 'orange'}">${auditResult.summary.complianceRate}%</td>
          </tr>
          <tr><td colspan="5" style="border:none"></td></tr>

          <thead>
            <tr>
              <th>Hạng mục</th>
              <th>Thực chi (VNĐ)</th>
              <th>Định mức Plan</th>
              <th>Trạng thái</th>
              <th>Chi tiết vấn đề (AI)</th>
            </tr>
          </thead>
          <tbody>
            ${auditResult.items.map(item => `
              <tr>
                <td class="text">${item.item}</td>
                <td class="num">${item.actualAmount}</td>
                <td class="text" style="text-align:right">${item.planAmount}</td>
                <td class="${item.status === 'ERROR' ? 'error' : item.status === 'WARNING' ? 'warning' : 'ok'}">
                    ${item.status === 'OK' ? 'Hợp lệ' : item.status === 'WARNING' ? 'Cảnh báo' : 'Vi phạm'}
                </td>
                <td class="text">${item.issue}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create Blob & Download
    const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bao_Cao_Kiem_Toan_${new Date().toISOString().slice(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Kiểm Toán Chi Phí Tour (AI Audit)</h1>
                <p className="text-slate-500">Hệ thống AI tự động đối chiếu hình ảnh "Chương trình tour" và "Bảng kê chi tiêu".</p>
            </div>
            {isDone && auditResult && (
                <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all"
                >
                    <FileText className="w-4 h-4" /> Xuất Báo Cáo Excel
                </button>
            )}
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           {/* Plan */}
           <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all bg-white ${planFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="p-4 bg-white shadow-sm text-blue-600 rounded-full mb-4"><FileText className="w-8 h-8" /></div>
            <h3 className="font-semibold text-slate-800 mb-1">1. Chương Trình Tour (Plan)</h3>
            <p className="text-xs text-slate-400 mb-4">File Word, PDF, Ảnh chương trình</p>
            <input type="file" onChange={(e) => handleFileChange(e, 'PLAN')} className="hidden" id="plan-upload" />
            <label htmlFor="plan-upload" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-500 cursor-pointer shadow-sm min-w-[120px]">
              {planFile ? "Đã chọn file" : "Chọn file"}
            </label>
            {planFile && <p className="text-xs text-blue-600 mt-2 font-medium">{planFile.name}</p>}
           </div>

           {/* Report */}
           <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all bg-white ${reportFile ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="p-4 bg-white shadow-sm text-green-600 rounded-full mb-4"><FileText className="w-8 h-8" /></div>
            <h3 className="font-semibold text-slate-800 mb-1">2. Bảng Kê Thực Tế (Actual)</h3>
            <p className="text-xs text-slate-400 mb-4">File CSV, Ảnh chụp hóa đơn/bảng kê</p>
            <input type="file" onChange={(e) => handleFileChange(e, 'REPORT')} className="hidden" id="report-upload" />
            <label htmlFor="report-upload" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-green-500 cursor-pointer shadow-sm min-w-[120px]">
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
            {isProcessing ? <ScanSearch className="w-5 h-5 animate-spin" /> : <ScanSearch className="w-5 h-5" />}
            {isProcessing ? "AI đang đọc chi tiết từng dòng hóa đơn..." : "Bắt Đầu Kiểm Tra"}
          </button>
        </div>

        {/* Results Section */}
        {isDone && auditResult && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm font-medium">Tổng Chi Thực Tế</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{auditResult.summary.totalActual.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm font-medium">Chi Sai Phạm / Ngoài Luồng</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">{auditResult.summary.totalIllegal.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm font-medium">Điểm Tuân Thủ</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-2xl font-bold ${auditResult.summary.complianceRate >= 90 ? 'text-green-600' : 'text-orange-500'}`}>
                            {auditResult.summary.complianceRate}%
                        </span>
                        {auditResult.summary.complianceRate === 100 && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Chi Tiết Kiểm Toán</div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-12 bg-slate-100 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4 pl-3">Hạng mục</div>
                    <div className="col-span-2 text-right pr-4">Thực chi</div>
                    <div className="col-span-2 text-right pr-4">Định mức</div>
                    <div className="col-span-4 pl-4">Đánh giá AI</div>
                  </div>
                  
                  {auditResult.items.map((item, idx) => (
                    <div key={idx} className={`grid grid-cols-1 md:grid-cols-12 p-4 gap-4 md:gap-0 items-center hover:bg-slate-50 transition-colors ${item.status === 'ERROR' ? 'bg-red-50/50' : ''}`}>
                      
                      <div className="md:col-span-4 pl-2 font-medium text-slate-800">
                         {item.item}
                      </div>

                      <div className="md:col-span-2 text-right pr-4 font-mono font-bold text-slate-700">
                        {item.actualAmount}
                      </div>

                      <div className="md:col-span-2 text-right pr-4 font-mono text-slate-400 text-sm">
                        {item.planAmount}
                      </div>

                      <div className="md:col-span-4 pl-4 flex items-start gap-2">
                        {item.status === 'OK' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 shrink-0">HỢP LỆ</span>}
                        {item.status === 'WARNING' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 shrink-0">CẢNH BÁO</span>}
                        {item.status === 'ERROR' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">VI PHẠM</span>}
                        <p className="text-sm text-slate-600">{item.issue}</p>
                      </div>

                    </div>
                  ))}
                </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TourExpenseChecker;
