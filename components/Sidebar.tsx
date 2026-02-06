import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, MessageSquareText, WalletCards, FileSpreadsheet, Building2, ScanSearch, Calculator } from 'lucide-react';

import { useAccounting } from '../contexts/AccountingContext'; // Import hook

const Sidebar: React.FC = () => {
  const { resetData } = useAccounting(); // Get reset function

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-full fixed left-0 top-0 overflow-y-auto z-10">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-2xl text-blue-700">
          <WalletCards className="w-8 h-8" />
          <span>KếToánPro</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" className={navClass}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Tổng Quan</span>
        </NavLink>
        <NavLink to="/transactions" className={navClass}>
          <Receipt className="w-5 h-5" />
          <span>Sổ Thu Chi</span>
        </NavLink>
        <NavLink to="/invoices" className={navClass}>
          <FileSpreadsheet className="w-5 h-5" />
          <span>Quản lý Hóa đơn</span>
        </NavLink>
        
        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Nghiệp Vụ
        </div>
        
        <NavLink to="/bank" className={navClass}>
          <Building2 className="w-5 h-5" />
          <span>Ngân Hàng (Link)</span>
        </NavLink>
        <NavLink to="/tour-audit" className={navClass}>
          <ScanSearch className="w-5 h-5" />
          <span>Duyệt Chi Phí Tour</span>
        </NavLink>
        <NavLink to="/reconcile" className={navClass}>
          <Calculator className="w-5 h-5" />
          <span>Đối Soát Hóa Đơn</span>
        </NavLink>

        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tiện Ích
        </div>

        <NavLink to="/ai-assistant" className={navClass}>
          <MessageSquareText className="w-5 h-5" />
          <span>Trợ Lý AI</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <button 
           onClick={resetData}
           className="w-full py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
           🗑️ Xóa Dữ Liệu
        </button>

        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-500">
          <p>© 2024 KếToánPro</p>
          <p className="text-xs mt-1">Version 2.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
