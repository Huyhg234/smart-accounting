# HƯỚNG DẪN SỬ DỤNG - KẾ TOÁN THÔNG MINH (SMART ACCOUNTING AI)

Chào mừng bạn đến với **Smart Accounting AI** - Giải pháp kế toán quản trị thế hệ mới, nơi AI tự động hóa 90% các tác vụ thủ công.

---

## 1. Mức Độ Sẵn Sàng Của Ứng Dụng (App Readiness)

### ✅ Đã Dùng Được Ngay (Ready to Use)
Phần mềm hiện tại là một phiên bản **SaaS MVP** hoàn chỉnh cho nhu cầu **Quản trị Kế toán & Tài chính**, với các điểm mạnh:
*   **Bank Hub (Casso Integration):** Đã tích hợp sẵn API **Casso.vn** để đồng bộ giao dịch ngân hàng thực tế (MB Bank, Techcombank, Vietinbank...).
*   **AI Audit (Kiểm toán Tour):** Tự động phát hiện gian lận chi tiêu tour du lịch thông qua phân tích hóa đơn/bảng kê.
*   **AI Consultant:** Trợ lý ảo tư vấn tài chính thông minh.

---

## 2. Hướng Dẫn Chi Tiết Các Tính Năng

### A. BANK HUB - Trung Tâm Đối Soát Ngân Hàng
*Tự động đồng bộ giao dịch ngân hàng qua Casso API.*

1.  **Cấu hình kết nối (Làm 1 lần đầu):**
    *   Bấm nút **"Cấu hình Kết nối"** (góc phải).
    *   Chọn nhà cung cấp: **Casso.vn**.
    *   Nhập **API Key** (Lấy từ tài khoản Casso của doanh nghiệp).
    *   Copy **Webhook URL** hiển thị trên phần mềm và dán vào mục "Webhook" trên trang quản trị Casso.
    *   *Lưu ý:* Khi có biến động số dư thực tế, dữ liệu sẽ tự động "đổ" về màn hình này sau 1-2 giây.

2.  **Quy trình Đối soát hàng ngày:**
    *   Hệ thống hiển thị danh sách giao dịch mới nhất (Realtime).
    *   **AI Gợi ý:** Tự động phân tích nội dung (VD: "Nguyen Van A ck tien tour") để gợi ý hạch toán.
    *   **Duyệt:** Bấm **"Duyệt"** (Màu xanh) để xác nhận và ghi vào Sổ cái.


### B. QUẢN LÝ HÓA ĐƠN (E-INVOICE)
*Quản lý danh sách hóa đơn bán ra và mua vào.*

1.  **Truy cập:** Menu bên trái -> chọn **"Hóa đơn & Chứng từ"**.
2.  **Tổng quan:** Xem biểu đồ Doanh thu, Thuế phải đóng, và các hóa đơn quá hạn.
3.  **Tạo Hóa Đơn:**
    *   Có thể tạo thủ công bằng nút **"Tạo mới"**.
    *   **Khuyên dùng:** Sử dụng tính năng **tự động tạo từ giao dịch Ngân hàng** ở mục Bank Hub để tiết kiệm thời gian.

### C. AI AUDIT - Kiểm Toán Chi Phí Tour (🔥 Tính Năng Cao Cấp)
*Công cụ "sát thủ" giúp phát hiện gian lận chi tiêu trong tích tắc.*

1.  **Truy cập:** Menu bên trái -> chọn **"Kiểm toán Tour (AI)"**.
2.  **Bước 1 - Upload Plan:** Tải lên file **Chương trình tour** (Quy định ăn uống bao nhiêu, vé thắng cảnh bao nhiêu...). Hỗ trợ file `.txt`, `.pdf` (text), hoặc ảnh chụp.
3.  **Bước 2 - Upload Actual:** Tải lên file **Bảng kê thực chi** từ Hướng dẫn viên (file `.csv` hoặc Ảnh chụp bảng kê viết tay/excel).
    *   *Lưu ý:* Nếu có file Excel `.xlsx`, hãy Save As sang `.csv` hoặc gọi `Save as Picture` rồi up ảnh lên.
4.  **Bước 3:** Bấm **"Bắt đầu Kiểm tra"**.
5.  **Xem Kết Quả:**
    *   AI sẽ soi từng dòng chi tiêu.
    *   **Mục đỏ (Vi phạm):** Chi sai mục đích (Massage, Karaoke, Rượu bia quá mức...) hoặc Vượt định mức >50%.
    *   **Mục cam (Cảnh báo):** Vượt nhẹ định mức.
    *   **Mục xanh (Hợp lệ):** Chi đúng kế hoạch.
6.  **Xuất Báo Cáo:** Bấm nút **"Xuất Báo Cáo Excel"** để tải về file kết quả chi tiết gửi cho Sếp hoặc Hướng dẫn viên giải trình.

### D. TRỢ LÝ AI (AI CONSUMTANT)
*Hỏi đáp mọi lúc mọi nơi.*

*   Bấm vào biểu tượng Chat ở góc dưới màn hình để hỏi về tình hình tài chính, quy định thuế, hoặc tra cứu nhanh số liệu.

---

**Chúc bạn quản lý tài chính hiệu quả với Smart Accounting AI!**
