# Hướng Dẫn Deploy SaaS Lên Cloud (Vercel)

Bạn muốn biến ứng dụng Local này thành **SaaS (Software as a Service)** thương mại để khách hàng truy cập từ mọi nơi?
Hãy làm theo các bước sau để deploy lên **Vercel** - Nền tảng Cloud tốt nhất cho React/Vite App.

## 1. Chuẩn Bị Code

Mọi cấu hình đã được chuyển sang biến môi trường (`.env`) để bảo mật.
Đảm bảo bạn đã có tài khoản [GitHub](https://github.com/) và [Vercel](https://vercel.com/signup).

## 2. Đẩy Code Lên GitHub

Nếu bạn chưa có repo, hãy tạo mới một repository trên GitHub và đẩy code lên:

```bash
git init
git add .
git commit -m "Initial commit for SaaS"
# Thay URL_REPO_CUA_BAN bằng link repo github của bạn
git remote add origin URL_REPO_CUA_BAN
git push -u origin main
```

## 3. Deploy Lên Vercel

1. Truy cập [Dashboard Vercel](https://vercel.com/dashboard).
2. Bấm **"Add New..."** button > **Project**.
3. Chọn Repository GitHub bạn vừa đẩy lên -> Bấm **Import**.

## 4. Cấu Hình Biến Môi Trường (Quan Trọng)

Trong màn hình "Configure Project", tìm mục **Environment Variables**.
Bạn cần copy các giá trị từ file `.env` trong máy của bạn và dán vào đây (Vercel sẽ bảo mật chúng, không lộ ra ngoài).

Thêm lần lượt các biến sau:

| Key (Tên biến)                      | Value (Giá trị - Lấy từ file .env)         |
| :---------------------------------- | :----------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | `AIzaSy...`                                |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `smartaccounting-saas.firebaseapp.com`     |
| `VITE_FIREBASE_PROJECT_ID`          | `smartaccounting-saas`                     |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `smartaccounting-saas.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `41111074288`                              |
| `VITE_FIREBASE_APP_ID`              | `1:41111074288...`                         |
| `VITE_FIREBASE_MEASUREMENT_ID`      | `G-LL9YG9HYPQ`                             |

> **Lưu ý:** Đừng quên thêm cả biến `GEMINI_API_KEY` nếu bạn muốn config cứng trên server (hoặc để người dùng tự nhập trong app như hiện tại).

## 5. Bấm "Deploy"

Chờ khoảng 1-2 phút. Vercel sẽ build và cung cấp cho bạn một đường link `https://smart-accounting-saas.vercel.app`.

## 6. Kết Nối Domain Riêng (Tuỳ Chọn)

Vào phần **Settings > Domains** trên Vercel để trỏ tên miền riêng của bạn (ví dụ: `ketoanthongminh.com`) về ứng dụng.

---

**Chúc mừng!** Bạn đã có một hệ thống SaaS Kế toán AI chạy trên Cloud. 🚀
