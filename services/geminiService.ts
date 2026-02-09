import { Transaction, CategoryPrediction, InvoiceData, BankTransaction, TourDiscrepancy, ReconciliationResult, Contract, AuditReport } from "../types";

// Helper lấy API Key
const getApiKey = () => {
  const userKey = localStorage.getItem('GEMINI_API_KEY');
  if (userKey) return userKey.trim();
  return ""; 
};

// Hàm tìm Model tự động (Auto-Discovery)
const findBestModel = async (apiKey: string): Promise<string> => {
    try {
        console.log("🔍 Đang dò tìm Model khả dụng...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (!data.models) return "models/gemini-1.5-flash"; // Fallback nếu không dò được

        // Lọc ra các model hỗ trợ generateContent
        const validModels = data.models.filter((m: any) => 
            m.supportedGenerationMethods?.includes("generateContent")
        );

        // Ưu tiên chọn: Flash -> Pro -> 1.0
        const preferred = validModels.find((m: any) => m.name.includes("1.5-flash")) || 
                          validModels.find((m: any) => m.name.includes("1.5-pro")) ||
                          validModels.find((m: any) => m.name.includes("gemini-pro")) ||
                          validModels[0];

        console.log("✅ Đã tìm thấy Model tốt nhất:", preferred?.name);
        return preferred?.name || "models/gemini-1.5-flash";

    } catch (e) {
        console.warn("⚠️ Dò model thất bại, dùng mặc định:", e);
        return "models/gemini-1.5-flash";
    }
}

// Hàm gọi API trực tiếp (Smart Discovery)
const callGeminiDirect = async (prompt: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Chưa nhập API Key. Vui lòng vào Cấu hình nhập Key.");

    // Bước 1: Tìm model xịn nhất mà Key này dùng được
    const modelName = await findBestModel(apiKey);
    
    // Bước 2: Gọi AI với model vừa tìm được
    // Lưu ý: modelName trả về đã có dạng 'models/abc', nên URL không cần thêm 'models/' nữa nếu API v1beta
    // Tuy nhiên API endpoint thường là .../models/{model}:generateContent. Nhưng modelName trong list đã có 'models/' prefix.
    // Xử lý: Nếu modelName có 'models/' ở đầu thì ok.
    
    const cleanModelName = modelName.startsWith('models/') ? modelName.replace('models/', '') : modelName;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`;
    
    console.log(`🚀 Calling: ${url}`);

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("❌ Error Detail:", data);
            throw new Error(data.error?.message || `HTTP ${response.status}`);
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    } catch (error: any) {
        if (error.message.includes("API key not valid")) {
             throw new Error("API Key không đúng. Vui lòng kiểm tra lại.");
        }
        throw new Error(`Google Error: ${error.message}`);
    }
};

/**
 * Analyzes a single bank transaction to predict category and suggest actions
 */
export const analyzeBankTransaction = async (description: string, amount: number, type: 'CREDIT' | 'DEBIT') => {
    try {
        const prompt = `
            Bạn là Kế toán viên AI. Hãy phân tích giao dịch ngân hàng sau:
            - Nội dung: "${description}"
            - Số tiền: ${amount} VND
            - Loại: ${type === 'CREDIT' ? 'TIỀN VÀO (+)' : 'TIỀN RA (-)'}

            Nhiệm vụ:
            1. Dự đoán 'category' (Chọn 1 trong: Bán hàng, Lương, Tiếp khách, Marketing, Điện nước, Thuê nhà, Văn phòng phẩm, Khác).
            2. Trích xuất 'note' (Diễn giải lại nội dung cho rõ nghĩa, ngắn gọn).
            3. Đề xuất 'action' (CREATE_TRANSACTION).

            Trả về JSON duy nhất:
            {
                "category": "...",
                "note": "...",
                "action": "CREATE_TRANSACTION",
                "confidence": 0.9
            }
        `;

        const jsonStr = await callGeminiDirect(prompt);
        
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonStr);

        return parsed;

    } catch (error) {
        console.error("Analyze Transaction Error:", error);
        return {
            category: "Khác",
            note: description,
            action: "CREATE_TRANSACTION",
            confidence: 0
        };
    }
};

/**
 * CONSULTANT FEATURE: Answers user questions about financial data
 */
export const getFinancialAdvice = async (transactions: Transaction[], question: string): Promise<string> => {
    try {
        // Tóm tắt dữ liệu (Giới hạn 50 giao dịch gần nhất để tiết kiệm token)
        const summary = transactions.slice(0, 50).map(t => 
            `- ${t.date}: ${t.description} (${t.amount.toLocaleString()} VND) [${t.type}]`
        ).join('\n');

        const totalIncome = transactions.filter(t => t.type ==='INCOME').reduce((s,t)=>s+t.amount,0);
        const totalExpense = transactions.filter(t => t.type ==='EXPENSE').reduce((s,t)=>s+t.amount,0);

        const prompt = `
            Bạn là một Chuyên gia Kế toán và Tư vấn Tài chính (CFO Assistant).
            
            DỮ LIỆU TÀI CHÍNH HIỆN TẠI CỦA CÔNG TY:
            - Tổng thu: ${totalIncome.toLocaleString()} VND
            - Tổng chi: ${totalExpense.toLocaleString()} VND
            - Lợi nhuận ròng: ${(totalIncome - totalExpense).toLocaleString()} VND
            
            CHI TIẾT 50 GIAO DỊCH GẦN NHẤT:
            ${summary}

            CÂU HỎI CỦA NGƯỜI DÙNG:
            "${question}"

            NHIỆM VỤ:
            Hãy trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn và hữu ích dựa trên dữ liệu trên.
            - Nếu người dùng hỏi về tổng quan, hãy dùng số liệu tổng.
            - Nếu hỏi chi tiết, hãy tra cứu trong danh sách giao dịch.
            - Nếu câu hỏi không liên quan đến tài chính, hãy từ chối lịch sự.
            
            Trả lời bằng Tiếng Việt, định dạng Markdown (có thể dùng bảng hoặc danh sách nếu cần thiết).
        `;

        const response = await callGeminiDirect(prompt);
        return response;

    } catch (error: any) {
        console.error("Financial Advice Error:", error);
        return "Xin lỗi, tôi đang gặp sự cố khi kết nối với máy chủ AI. Vui lòng thử lại sau.";
    }
};
/**
 * Generates financial overview report (CORE FEATURE FOR DASHBOARD)
 */
export const generateFinancialReport = async (transactions: Transaction[]): Promise<string> => {
    try {
        // Tóm tắt dữ liệu để gửi cho AI (Tránh gửi quá nhiều token)
        const summary = transactions.slice(0, 50).map(t => 
            `- ${t.date}: ${t.description} (${t.amount.toLocaleString()} VND) [${t.type}]`
        ).join('\n');

        const totalIncome = transactions.filter(t => t.type ==='INCOME').reduce((s,t)=>s+t.amount,0);
        const totalExpense = transactions.filter(t => t.type ==='EXPENSE').reduce((s,t)=>s+t.amount,0);

        const prompt = `
            Bạn là Kế toán trưởng chuyên nghiệp (CFO). Dựa trên dữ liệu tài chính dưới đây của công ty, hãy viết một báo cáo ngắn gọn (khoảng 100-150 từ) bằng tiếng Việt.
            
            TỔNG QUAN:
            - Tổng thu: ${totalIncome.toLocaleString()} VND
            - Tổng chi: ${totalExpense.toLocaleString()} VND
            - Lợi nhuận: ${(totalIncome - totalExpense).toLocaleString()} VND

            CHI TIẾT GIAO DỊCH (50 giao dịch gần nhất):
            ${summary}

            YÊU CẦU:
            1. Nhận xét về tình hình sức khỏe tài chính (Tốt/Xấu/Cần chú ý).
            2. Chỉ ra các khoản chi tiêu lớn đáng ngờ (nếu có).
            3. Đưa ra 1 lời khuyên cụ thể để tối ưu dòng tiền.
            
            Hãy viết giọng văn chuyên nghiệp, súc tích. Định dạng Markdown (dùng Bullet point).
        `;

        // Gọi AI qua hàm Direct (Siêu ổn định)
        const result = await callGeminiDirect(prompt);
        return result;

    } catch (error: any) {
        console.error("Report Error:", error);
        return "⚠️ Không thể tạo báo cáo lúc này: " + error.message;
    }
};
export const extractInvoiceDetails = async () => null;
// --- 3. Tour Expense Audit (Kiểm toán chi phí Tour) ---
// --- 3. Tour Expense Audit (Kiểm toán chi phí Tour) ---
// --- 3. Tour Expense Audit (Kiểm toán chi phí Tour) ---
interface FileInput {
    type: 'text' | 'image';
    content: string;
    mimeType: string;
}

export const compareTourExpenses = async (plan: FileInput, report: FileInput): Promise<AuditReport> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("Vui lòng nhập API Key Gemini trong cấu hình Bank Hub trước!");
            return { items: [], summary: { totalActual: 0, totalIllegal: 0, complianceRate: 100 } };
        }

        const modelName = await findBestModel(apiKey);
        
        // Helper tạo Part cho Gemini (Text hoặc InlineData)
        const createPart = (file: FileInput) => {
            if (file.type === 'text') {
                return { text: `TÀI LIỆU (Dạng Văn Bản/CSV):\n${file.content}` };
            } else {
                return {
                    inline_data: {
                        mime_type: file.mimeType,
                        data: file.content
                    }
                };
            }
        };

        const parts = [
            { text: `
                VAI TRÒ: KIỂM TOÁN VIÊN DU LỊCH CẤP CAO (STRICT AUDITOR)
                NHIỆM VỤ: Đối chiếu "Chương trình Tour (PLAN)" và "Bảng Kê Chi Tiêu Thực Tế (ACTUAL)".
                
                YÊU CẦU OUTPUT:
                Trả về JSON bao gồm DANH SÁCH CHI TIẾT TẤT CẢ CÁC MỤC CHI TIÊU (Kể cả mục đúng và mục sai).
                
                QUY TẮC PHÂN LOẠI TRẠNG THÁI (STATUS):
                - "OK": Chi đúng mục đích, đúng số tiền định mức (chênh lệch nhỏ < 10% chấp nhận được), có trong plan.
                - "WARNING": Chi vượt định mức nhẹ (10-30%) hoặc thiếu hóa đơn rõ ràng.
                - "ERROR": Chi sai mục đích (Karaoke, Massage, Tip, Mua quà riêng...), hoặc vượt định mức quá lớn (>50%).

                OUTPUT FORMAT (JSON Array):
                [
                    {
                        "item": "Tên khoản chi (VD: Vé cáp treo)",
                        "planAmount": "Định mức Plan (VD: 850.000)",
                        "actualAmount": "Thực chi (VD: 850.000)",
                        "actualAmountNum": 850000,
                        "status": "OK", 
                        "issue": "Hợp lệ"
                    },
                    {
                        "item": "Karaoke",
                        "planAmount": "0",
                        "actualAmount": "3.500.000",
                        "actualAmountNum": 3500000,
                        "status": "ERROR",
                        "issue": "Chi giải trí cá nhân không có trong Plan"
                    }
                ]
                
                LƯU Ý: 
                - Hãy liệt kê HẾT toàn bộ các dòng trong file Actual. 
                - Hãy trích xuất "actualAmountNum" là số nguyên (VNĐ) để tính toán.
            ` },
            createPart(plan),
            createPart(report)
        ];

        const payload = { contents: [{ parts: parts }] };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) { return { items: [], summary: { totalActual: 0, totalIllegal: 0, complianceRate: 0 } }; }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        
        const items: TourDiscrepancy[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // Tính toán Summary
        const totalActual = items.reduce((sum, item) => sum + (item.actualAmountNum || 0), 0);
        const totalIllegal = items.filter(i => i.status === 'ERROR').reduce((sum, item) => sum + (item.actualAmountNum || 0), 0);
        const complianceRate = totalActual > 0 ? Math.round(((totalActual - totalIllegal) / totalActual) * 100) : 100;

        return {
            items,
            summary: {
                totalActual,
                totalIllegal,
                complianceRate
            }
        };

    } catch (error) {
        console.error("AI Audit Error:", error);
        return { items: [], summary: { totalActual: 0, totalIllegal: 0, complianceRate: 0 } };
    }
};
/**
 * RECONCILIATION FEATURE: Matches Bank Transactions with Contracts/Invoices
 */
export const matchBankToInvoice = async (bankTransactions: BankTransaction[], contracts: Contract[]): Promise<ReconciliationResult[]> => {
    try {
        const bankData = bankTransactions.map(b => `${b.id}: ${b.date} - ${b.description} - ${b.amount}`).join('\n');
        const contractData = contracts.map(c => `${c.id}: ${c.customerName} - Value: ${c.contractValue} - Invoiced: ${c.invoicedAmount}`).join('\n');

        const prompt = `
            Bạn là Kế toán trưởng chuyên đối soát công nợ. Hãy đối chiếu 2 danh sách sau:

            DANH SÁCH GIAO DỊCH NGÂN HÀNG (TIỀN VỀ):
            ${bankData}

            DANH SÁCH HỢP ĐỒNG/CÔNG NỢ:
            ${contractData}

            NHIỆM VỤ:
            1. Tìm các cặp khớp nhau dựa trên Tên khách hàng (gần đúng) hoặc Số tiền (chính xác hoặc xấp xỉ).
            2. Tính toán chênh lệch (Difference = Tiền về - Đã xuất HĐ).
            3. Đề xuất xử lý (Nếu Tiền về > Đã xuất HĐ -> "Xuất hóa đơn bổ sung"; Nếu Tiền về < HĐ -> "Thu hồi công nợ"; Nếu khớp -> "Khớp lệnh hoàn tất").

            TRẢ VỀ JSON ARRAY:
            [
                {
                    "bankTxId": "bId",
                    "contractId": "cId",
                    "receivedAmount": 10000000,
                    "contractValue": 10000000,
                    "invoicedAmount": 8000000,
                    "difference": 2000000,
                    "reason": "Khách A chuyển khoản đợt 2, khớp với Hợp đồng C1",
                    "suggestion": "Xuất hóa đơn bổ sung 2tr",
                    "matchScore": 0.95 
                }
            ]
            Chỉ trả về các cặp tìm thấy (MatchScore > 0.7).
        `;

        const jsonStr = await callGeminiDirect(prompt);
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    } catch (error) {
        console.error("Reconciliation Error:", error);
        return [];
    }
};
