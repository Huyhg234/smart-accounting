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
  isLoading: boolean;
  isOfflineMode: boolean;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

// Mock data for offline mode
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-11-20', description: 'Thiết kế website', amount: 15000000, type: 'INCOME', category: 'Bán hàng' },
  { id: '2', date: '2023-11-18', description: 'Thuê văn phòng tháng 11', amount: 5000000, type: 'EXPENSE', category: 'Văn phòng' },
  { id: '3', date: '2023-11-15', description: 'Mua văn phòng phẩm', amount: 500000, type: 'EXPENSE', category: 'Văn phòng phẩm' },
];

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
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

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      // OFFLINE MODE
      setTransactions(MOCK_TRANSACTIONS);
      setInvoices([]);
      calculateSummary(MOCK_TRANSACTIONS);
      setIsLoading(false);
      return;
    }

    // FIREBASE MODE
    try {
      // 1. Transactions
      const q = query(collection(db, "transactions"), orderBy("date", "desc"));
      const unsubTrans = onSnapshot(q, (snapshot) => {
        const fetchedTransactions: Transaction[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));

        setTransactions(fetchedTransactions);
        calculateSummary(fetchedTransactions);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        setIsLoading(false);
      });

      // 2. Invoices
      const qInv = query(collection(db, "invoices"), orderBy("date", "desc"));
      const unsubInv = onSnapshot(qInv, (snapshot) => {
        const fetchedInvoices: InvoiceData[] = snapshot.docs.map(doc => ({
            ...doc.data()
        } as InvoiceData));
        setInvoices(fetchedInvoices);
      }, (error) => console.error("Error fetching invoices:", error));

      return () => {
          unsubTrans();
          unsubInv();
      };
    } catch (error) {
      console.error("Firebase connection error:", error);
      setIsLoading(false);
    }
  }, []);

  const addTransaction = async (transaction: Transaction) => {
    if (!isFirebaseConfigured || !db) {
      const newTx = { ...transaction, id: Date.now().toString() };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      calculateSummary(updated);
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
      alert("Lỗi khi lưu dữ liệu lên Cloud. Đang chạy ở chế độ Offline?");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!isFirebaseConfigured || !db) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      calculateSummary(updated);
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

  return (
    <AccountingContext.Provider value={{ 
      transactions, 
      invoices,
      summary, 
      addTransaction, 
      deleteTransaction,
      addInvoice,
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


