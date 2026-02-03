import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, CategoryPrediction, InvoiceData, BankTransaction, TourDiscrepancy, ReconciliationResult, Contract } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model configuration
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Predicts the category and type of a transaction based on its description.
 */
export const predictCategory = async (description: string): Promise<CategoryPrediction | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: "The predicted category name in Vietnamese (e.g., Ăn uống, Di chuyển, Lương, Bán hàng, Tiện ích)." },
      type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"], description: "Whether it is income or expense." },
      confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." }
    },
    required: ["category", "type", "confidence"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Phân loại giao dịch tài chính này dựa trên mô tả: "${description}". Trả về định dạng JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Bạn là một trợ lý kế toán chuyên nghiệp. Hãy phân loại ngắn gọn bằng tiếng Việt."
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as CategoryPrediction;
  } catch (error) {
    console.error("Error predicting category:", error);
    return null;
  }
};

/**
 * Generates a financial insight/advice based on recent transactions.
 */
export const getFinancialAdvice = async (transactions: Transaction[], userQuery: string): Promise<string> => {
  // Simplify data for token efficiency
  const summaryData = transactions.slice(0, 50).map(t => 
    `${t.date}: ${t.description} - ${t.amount.toLocaleString('vi-VN')} VND (${t.type})`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using Pro for better reasoning on financial data
      contents: `Dữ liệu giao dịch gần đây:\n${summaryData}\n\nCâu hỏi của người dùng: ${userQuery}`,
      config: {
        systemInstruction: "Bạn là chuyên gia kế toán cao cấp (CPA). Hãy trả lời câu hỏi dựa trên dữ liệu được cung cấp. Câu trả lời cần ngắn gọn, chuyên nghiệp, hữu ích và bằng tiếng Việt. Nếu không có dữ liệu liên quan, hãy đưa ra lời khuyên chung về kế toán."
      }
    });

    return response.text || "Xin lỗi, tôi không thể tạo câu trả lời lúc này.";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Đã xảy ra lỗi khi kết nối với AI.";
  }
};

/**
 * Generates a comprehensive financial report and risk assessment.
 */
export const generateFinancialReport = async (transactions: Transaction[]): Promise<string> => {
  // 1. Prepare Data Summary for AI
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  // Group by category for context
  const expensesByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });

  const transactionList = transactions.slice(0, 100).map(t => 
    `- ${t.date} | ${t.type} | ${t.category} | ${t.amount} | ${t.description}`
  ).join('\n');

  const prompt = `
    Dựa trên dữ liệu tài chính sau:
    - Tổng thu: ${totalIncome}
    - Tổng chi: ${totalExpense}
    - Số dư: ${balance}
    - Chi tiết chi phí theo danh mục: ${JSON.stringify(expensesByCategory)}
    - Danh sách 100 giao dịch gần nhất:
    ${transactionList}

    Hãy đóng vai là một Kế Toán Trưởng (CFO) có 20 năm kinh nghiệm. Viết một báo cáo phân tích tài chính chuyên sâu. 
    Báo cáo cần có cấu trúc sau (sử dụng Markdown để trình bày đẹp):

    ### 1. Tổng Quan Sức Khỏe Tài Chính
    (Đánh giá chung về tình hình lãi/lỗ, tỷ lệ thu/chi)

    ### 2. Phân Tích Xu Hướng & Bất Thường
    (Chỉ ra các khoản chi tiêu lớn, các xu hướng tăng giảm đáng chú ý, hoặc các giao dịch bất thường nếu có)

    ### 3. Đánh Giá Rủi Ro (Quan trọng)
    (Dự báo các rủi ro tiềm ẩn như: mất cân đối dòng tiền, phụ thuộc vào một nguồn thu, lãng phí chi phí...)

    ### 4. Khuyến Nghị Chiến Lược
    (Đưa ra 3-4 lời khuyên cụ thể để tối ưu hóa lợi nhuận và cắt giảm chi phí không cần thiết)

    Giọng văn: Chuyên nghiệp, khách quan, sắc sảo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Use Pro model for complex reasoning
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for deeper analysis
      }
    });

    return response.text || "Không thể tạo báo cáo.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Đã xảy ra lỗi khi tạo báo cáo. Vui lòng thử lại sau.";
  }
};

/**
 * Extracts structured data from an invoice image.
 */
export const extractInvoiceDetails = async (base64Image: string, mimeType: string): Promise<Partial<InvoiceData> | null> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      invoiceNumber: { type: Type.STRING, description: "Số hóa đơn/biên lai" },
      date: { type: Type.STRING, description: "Ngày hóa đơn định dạng YYYY-MM-DD. Nếu không tìm thấy, lấy ngày hiện tại." },
      vendorName: { type: Type.STRING, description: "Tên đơn vị bán hàng/nhà cung cấp" },
      vendorTaxCode: { type: Type.STRING, description: "Mã số thuế (MST) của người bán" },
      vendorAddress: { type: Type.STRING, description: "Địa chỉ chi tiết của đơn vị bán hàng/nhà cung cấp" },
      buyerName: { type: Type.STRING, description: "Tên đơn vị mua hàng hoặc tên người mua" },
      items: {
        type: Type.ARRAY,
        description: "Danh sách chi tiết hàng hóa, dịch vụ trong hóa đơn",
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Tên hàng hóa/dịch vụ" },
            quantity: { type: Type.NUMBER, description: "Số lượng" },
            unitPrice: { type: Type.NUMBER, description: "Đơn giá" },
            totalAmount: { type: Type.NUMBER, description: "Thành tiền" }
          }
        }
      },
      subTotal: { type: Type.NUMBER, description: "Tổng tiền hàng trước thuế (VND)" },
      taxAmount: { type: Type.NUMBER, description: "Tổng tiền thuế (VND)" },
      taxRate: { type: Type.STRING, description: "Thuế suất GTGT (VD: 8%, 10%, KCT...)" },
      totalAmount: { type: Type.NUMBER, description: "Tổng tiền thanh toán sau thuế (VND)" },
      paymentMethod: { type: Type.STRING, description: "Hình thức thanh toán (VD: Tiền mặt, CK, Thẻ...)" },
      description: { type: Type.STRING, description: "Mô tả chung ngắn gọn về nội dung hóa đơn" },
      category: { type: Type.STRING, description: "Dự đoán danh mục chi tiêu (VD: Tiếp khách, Văn phòng phẩm, Ăn uống...)" }
    },
    required: ["date", "vendorName", "totalAmount", "description", "category"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME, // gemini-3-flash-preview supports multimodal input
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: "Trích xuất toàn bộ thông tin chi tiết từ hóa đơn này, bao gồm cả danh sách hàng hóa và thuế suất. Trả về JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as Partial<InvoiceData>;
  } catch (error) {
    console.error("Error extracting invoice:", error);
    return null;
  }
};

/**
 * Analyzes a bank transaction and suggests an accounting action.
 */
export const analyzeBankTransaction = async (description: string, amount: number, type: 'CREDIT' | 'DEBIT'): Promise<any> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["CREATE_TRANSACTION", "CREATE_INVOICE", "IGNORE"], description: "Recommended action." },
      category: { type: Type.STRING, description: "Predicted accounting category." },
      explanation: { type: Type.STRING, description: "Reason for the suggestion." }
    },
    required: ["action", "category", "explanation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Phân tích giao dịch ngân hàng sau: "${description}", Số tiền: ${amount}, Loại: ${type} (CREDIT=Vào, DEBIT=Ra).
      - Nếu là CREDIT (Tiền vào): Có thể là thanh toán từ khách hàng -> Gợi ý 'CREATE_INVOICE' hoặc 'CREATE_TRANSACTION' (Doanh thu).
      - Nếu là DEBIT (Tiền ra): Là chi phí -> Gợi ý 'CREATE_TRANSACTION' và phân loại chi phí.
      Trả về JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { action: 'IGNORE', explanation: 'AI Error' };
  }
};

/**
 * Compares Tour Plan (Image A) vs Guide Expense Report (Image B).
 */
export const compareTourExpenses = async (planImage: string, planMime: string, reportImage: string, reportMime: string): Promise<TourDiscrepancy[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING, description: "Tên mục chi phí (VD: Vé tham quan, Ăn trưa)" },
        planAmount: { type: Type.STRING, description: "Số tiền/Định mức trong kế hoạch (VD: 150k/pax)" },
        actualAmount: { type: Type.STRING, description: "Số tiền thực tế HDV chi" },
        issue: { type: Type.STRING, description: "Mô tả vấn đề (Vượt chi, Không có trong plan, Thiếu hóa đơn...)" },
        severity: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"], description: "Mức độ nghiêm trọng của sai lệch." }
      },
      required: ["item", "planAmount", "actualAmount", "issue", "severity"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Use vision model
      contents: {
        parts: [
          { text: "Đây là File 1: Chương trình Tour & Dự toán (Plan)." },
          { inlineData: { data: planImage, mimeType: planMime } },
          { text: "Đây là File 2: Bảng kê chi phí thực tế hoặc hóa đơn của Hướng dẫn viên (Actual)." },
          { inlineData: { data: reportImage, mimeType: reportMime } },
          { text: "Hãy đóng vai Kế toán kiểm soát tour (Tour Auditor). So sánh 2 file này. Tìm kiếm kỹ các mục chi phí BẤT THƯỜNG. Hãy chú ý đến: 1. Chi quá định mức. 2. Các khoản chi lạ không có trong chương trình. 3. Sai số học. Chỉ liệt kê các mục SAI LỆCH. Trả về JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error comparing tour expenses:", error);
    return [];
  }
};

/**
 * Matches Bank Transactions to Contracts/Invoices using AI
 */
export const matchBankToInvoice = async (bankTransactions: BankTransaction[], contracts: Contract[]): Promise<ReconciliationResult[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        bankTxId: { type: Type.STRING, description: "ID of the bank transaction matched." },
        contractId: { type: Type.STRING, description: "ID of the contract matched." },
        receivedAmount: { type: Type.NUMBER, description: "Amount received from bank." },
        contractValue: { type: Type.NUMBER, description: "Original contract value." },
        invoicedAmount: { type: Type.NUMBER, description: "Amount already invoiced." },
        difference: { type: Type.NUMBER, description: "Calculated difference (Received - Invoiced)." },
        reason: { type: Type.STRING, description: "Explanation of why AI matched these two." },
        suggestion: { type: Type.STRING, description: "Suggested action (e.g., 'Xuất hóa đơn chênh lệch', 'Đủ điều kiện')." }
      },
      required: ["bankTxId", "contractId", "difference", "suggestion"]
    }
  };

  // Convert objects to simplified strings for prompt context
  const bankStr = bankTransactions.filter(t => t.type === 'CREDIT').map(t => `ID: ${t.id}, Desc: "${t.description}", Amount: ${t.amount}`).join('\n');
  const contractStr = contracts.map(c => `ID: ${c.id}, Customer: "${c.customerName}", Value: ${c.contractValue}, Invoiced: ${c.invoicedAmount}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dữ liệu Ngân hàng (Tiền về):\n${bankStr}\n\nDữ liệu Hợp đồng:\n${contractStr}\n\nNhiệm vụ: Hãy khớp lệnh (match) các giao dịch ngân hàng với hợp đồng tương ứng dựa trên Tên khách hàng, Số tiền, hoặc Nội dung chuyển khoản (có thể viết tắt, không dấu). Tính toán chênh lệch (Tiền về - Đã xuất hóa đơn). Nếu Tiền về > Đã xuất hóa đơn, gợi ý "Xuất hóa đơn chênh lệch". Trả về JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error matching transactions:", error);
    return [];
  }
};
