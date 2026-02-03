
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface CategoryPrediction {
  category: string;
  type: TransactionType;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface InvoiceData {
  fileName: string;
  invoiceNumber: string;
  date: string;
  vendorName: string;
  vendorTaxCode?: string; // MST người bán
  vendorAddress?: string;
  buyerName?: string;
  items?: InvoiceItem[]; // Danh sách hàng hóa/dịch vụ
  subTotal?: number;
  taxAmount: number;
  taxRate?: string; // Thuế suất (VD: 8%, 10%)
  totalAmount: number;
  paymentMethod?: string;
  description: string; // Mô tả chung
  category: string;
  status: 'pending' | 'processing' | 'success' | 'error';
}

// New Types for Bank & Tour Features
export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT'; // Credit = Tiền vào, Debit = Tiền ra
  status: 'NEW' | 'MATCHED' | 'INVOICED'; // Trạng thái xử lý
  aiSuggestion?: {
    action: 'CREATE_TRANSACTION' | 'CREATE_INVOICE' | 'IGNORE';
    category?: string;
    explanation?: string;
  };
}

export interface TourDiscrepancy {
  item: string;
  planAmount: string;
  actualAmount: string;
  issue: string; // Lý do sai lệch (Vượt mức, Không có trong plan...)
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Contract {
  id: string;
  customerName: string;
  contractValue: number;
  invoicedAmount: number;
  status: 'OPEN' | 'CLOSED';
}

export interface ReconciliationResult {
  bankTxId: string;
  contractId: string;
  receivedAmount: number;
  contractValue: number;
  invoicedAmount: number;
  difference: number;
  reason: string;
  suggestion: string; // "Xuất hóa đơn chênh lệch", "Hoàn tiền", "Khớp lệnh"
}
