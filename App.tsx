import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import InvoiceProcessor from './components/InvoiceProcessor';
import AIConsultant from './components/AIConsultant';
import BankReconciliation from './components/BankReconciliation';
import TourExpenseChecker from './components/TourExpenseChecker';
import InvoiceReconciliation from './components/InvoiceReconciliation';
import { AccountingProvider } from './contexts/AccountingContext';

import TetTheme from './components/TetTheme';

const App: React.FC = () => {
  return (
    <AccountingProvider>
      <TetTheme />
      <Router>
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
          <Sidebar />
          
          <main className="flex-1 md:ml-64 p-6 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionManager />} />
                <Route path="/invoices" element={<InvoiceProcessor />} />
                <Route path="/bank" element={<BankReconciliation />} />
                <Route path="/tour-audit" element={<TourExpenseChecker />} />
                <Route path="/reconcile" element={<InvoiceReconciliation />} />
                <Route path="/ai-assistant" element={<AIConsultant />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AccountingProvider>
  );
};

export default App;
