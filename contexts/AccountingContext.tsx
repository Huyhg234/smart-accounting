import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, FinancialSummary, InvoiceData } from '../types';
import { db, isFirebaseConfigured } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';

interface AccountingContextType {
  transactions: Transaction[];
  invoices: InvoiceData[];
  summary: FinancialSummary;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addInvoice: (invoice: InvoiceData) => Promise<void>;
  resetData: () => void;
  isLoading: boolean;
  isOfflineMode: boolean;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial data from LocalStorage if available (Offline)
  // Default to empty array, NO MOCK DATA
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (!isFirebaseConfigured) {
       const saved = localStorage.getItem('SAAS_TRANSACTIONS_V1');
       return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    if (!isFirebaseConfigured) {
       const saved = localStorage.getItem('SAAS_INVOICES_V1');
       return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [summary, setSummary] = useState<FinancialSummary>({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Helper to calculate summary from a list of transactions
  const calculateSummary = (data: Transaction[]) => {
    const income = data
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = data
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setSummary({
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense
    });
  };

  // Persist to LocalStorage whenever data changes in Offline Mode
  useEffect(() => {
    if (!isFirebaseConfigured) {
        localStorage.setItem('SAAS_TRANSACTIONS_V1', JSON.stringify(transactions));
        calculateSummary(transactions);
    }
  }, [transactions]);

  useEffect(() => {
     if (!isFirebaseConfigured) {
        localStorage.setItem('SAAS_INVOICES_V1', JSON.stringify(invoices));
    }
  }, [invoices]);

  // Load data from Firebase or finalize offline loading
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      // OFFLINE MODE: Data already loaded from useState initializer
      setIsLoading(false);
      calculateSummary(transactions); // Ensure summary is calculated on initial load
      return;
    }

    // FIREBASE MODE
    try {
      setIsLoading(true);
      // 1. Transactions
      const q = query(collection(db, "transactions"), orderBy("date", "desc"));
      const unsubTrans = onSnapshot(q, (snapshot) => {
        const fetchedTransactions: Transaction[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));

        setTransactions(fetchedTransactions);
        calculateSummary(fetchedTransactions);
      }, (error) => {
        console.error("Error fetching transactions:", error);
      });

      // 2. Invoices
      const qInv = query(collection(db, "invoices"), orderBy("date", "desc"));
      const unsubInv = onSnapshot(qInv, (snapshot) => {
        const fetchedInvoices: InvoiceData[] = snapshot.docs.map(doc => ({
            ...doc.data()
        } as InvoiceData));
        setInvoices(fetchedInvoices);
        setIsLoading(false); // Set loading false after both are potentially loaded
      }, (error) => {
          console.error("Error fetching invoices:", error);
          setIsLoading(false);
      });

      return () => {
          unsubTrans();
          unsubInv();
      };
    } catch (error) {
      console.error("Firebase connection error:", error);
      setIsLoading(false);
    }
  }, []); // Run once on mount

  const addTransaction = async (transaction: Transaction) => {
    if (!isFirebaseConfigured || !db) {
      // OFFLINE: Update state -> useEffect will save to LS
      const newTx = { ...transaction, id: Date.now().toString() };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      return;
    }

    try {
      const { id, ...data } = transaction; 
      await addDoc(collection(db, "transactions"), {
        ...data,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Lỗi khi lưu dữ liệu lên Cloud.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!isFirebaseConfigured || !db) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      return;
    }
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const addInvoice = async (invoice: InvoiceData) => {
     if (!isFirebaseConfigured || !db) {
        setInvoices([invoice, ...invoices]);
        return;
     }
     try {
        await addDoc(collection(db, "invoices"), {
            ...invoice,
            createdAt: Timestamp.now()
        });
     } catch (e) {
         console.error("Add Invoice Error:", e);
         alert("Lỗi lưu hóa đơn!");
     }
  };

  const resetData = () => {
    if (confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu?\n\nHành động này sẽ xóa sạch Sổ Thu Chi, Hóa Đơn và đưa ứng dụng về trạng thái trắng ban đầu.\nDữ liệu không thể khôi phục!")) {
       try {
           console.log("Reseting data...");
           localStorage.removeItem('OFFLINE_TRANSACTIONS');
           localStorage.removeItem('OFFLINE_INVOICES');
           
           // Clear state
           setTransactions([]);
           setInvoices([]);
           setSummary({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
           
           alert("✅ Đã xóa sạch dữ liệu! Ứng dụng sẽ tải lại.");
           
           // Force reload to clear any memory cache
           setTimeout(() => {
               window.location.reload();
           }, 500);
       } catch (e) {
           console.error("Reset Error:", e);
           alert("Có lỗi xảy ra khi xóa dữ liệu.");
       }
    }
  };

  return (
    <AccountingContext.Provider value={{ 
      transactions, 
      invoices,
      summary, 
      addTransaction, 
      deleteTransaction,
      addInvoice,
      resetData,
      isLoading,
      isOfflineMode: !isFirebaseConfigured 
    }}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
