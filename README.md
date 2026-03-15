# Mail AI – Trợ lý viết email thông minh

**Đề bài:** Ứng dụng tạo email cho Sales & Chăm sóc khách hàng (CRM, Marketing).

---

## Mô tả ứng dụng

**Mail AI** là ứng dụng web dùng AI (Google AI Studio / Gemini) để tạo nhanh các bản nháp email chuyên nghiệp phục vụ:

- **Sales:** giới thiệu sản phẩm mới, chào hàng/upsell, follow-up sau cuộc họp.
- **Chăm sóc khách hàng:** cảm ơn khách hàng, nhắc nhở thanh toán, giải quyết khiếu nại, gia hạn hợp đồng.
- **Marketing:** chương trình khuyến mãi, khảo sát phản hồi.

Người dùng nhập mục tiêu email, tên khách hàng, sản phẩm/dịch vụ, thông tin cần truyền tải và chọn giọng điệu; AI tạo email hoàn chỉnh gồm **tiêu đề (Subject)**, **nội dung** và **Call To Action (CTA)**. Kết quả có thể sao chép từng phần (tiêu đề / nội dung) hoặc toàn bộ email.

---

## Link ứng dụng (Vercel)

**https://mail-auto-ai.vercel.app/**

---

## Hướng dẫn chạy ứng dụng cục bộ

### Yêu cầu

- Trình duyệt web (Chrome, Edge, Firefox…).
- (Tùy chọn) Node.js nếu dùng server local hoặc Docker.

### Cách 1: Mở trực tiếp file (nhanh)

1. Clone repo:
   ```bash
   git clone https://github.com/<your-username>/mail-auto-ai.git
   cd mail-auto-ai
   ```
2. Mở file `mail-ai/index.html` bằng trình duyệt (double-click hoặc kéo vào cửa sổ trình duyệt).

**Lưu ý:** Ứng dụng gọi trực tiếp API Gemini từ trình duyệt. API Key hiện được cấu hình trong `mail-ai/script.js` (xem mục API Key bên dưới). Nếu bạn dùng Key riêng, sửa biến `GEMINI_API_KEY` trong file đó.

### Cách 2: Chạy bằng server local (tránh lỗi CORS)

1. Vào thư mục giao diện:
   ```bash
   cd mail-auto-ai/mail-ai
   ```
2. Chạy server đơn giản (cần Node.js):
   ```bash
   npx serve -l 3000
   ```
   Hoặc với Python:
   ```bash
   python -m http.server 3000
   ```
3. Mở trình duyệt: **http://localhost:3000**.

### Cách 3: Dùng Docker (với .env cho API Key)

Nếu bạn muốn ẩn API Key bằng biến môi trường (ví dụ khi chạy trong Docker), có thể dùng build step thay thế Key vào file JS trước khi serve.

1. Tạo file `.env` trong thư mục gốc repo (cùng cấp với `README.md`):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Hoặc nếu dùng tên khác, nhất quán với script build.

2. **Quan trọng:** File `.env` **không** được commit lên Git. Thêm vào `.gitignore`:
   ```
   .env
   .env.local
   ```

3. Ví dụ `Dockerfile` (dùng Node + `serve`, Key đưa vào lúc build):
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY mail-ai/ ./mail-ai/
   # Thay thế placeholder trong script bằng ARG/ENV (tùy cách bạn build)
   ARG GEMINI_API_KEY
   RUN sed -i "s/const GEMINI_API_KEY = .*;/const GEMINI_API_KEY = '\${GEMINI_API_KEY}';/" mail-ai/script.js || true
   EXPOSE 3000
   CMD ["npx", "serve", "mail-ai", "-l", "3000"]
   ```
   Chạy build với Key từ .env (không lưu Key vào image trong production):
   ```bash
   docker build --build-arg GEMINI_API_KEY="$(cat .env | grep VITE_GEMINI_API_KEY | cut -d= -f2)" -t mail-ai .
   docker run -p 3000:3000 mail-ai
   ```

4. **Lưu ý bảo mật:** Cách trên vẫn có thể lộ Key trong image nếu dùng `--build-arg` với Key thật. Mục đích ở đây là **minh họa cách dùng .env/Docker**; trong môi trường production nên gọi Gemini qua backend (server của bạn) thay vì để Key ở frontend.

---

## API Key – Google AI Studio (Gemini)

Ứng dụng dùng **Google AI Studio (Gemini)** để tạo nội dung email.

- **Mục đích sử dụng:** **Chỉ cho thực hành / demo**, không dùng cho môi trường production.
- **Lý do:** Key gọi từ trình duyệt (frontend) dễ bị lộ; production nên gọi AI qua backend và bảo vệ Key trên server.

API Key mẫu (thực hành) có thể được cấu hình trong `mail-ai/script.js`:

```js
const GEMINI_API_KEY = 'AIzaSy...'; // Thay bằng key của bạn nếu cần
```

Lấy Key tại: [Google AI Studio](https://aistudio.google.com/apikey).

- Khi chạy **cục bộ** (mở file hoặc server đơn giản): sửa trực tiếp `GEMINI_API_KEY` trong `mail-ai/script.js` nếu dùng key riêng.
- Khi dùng **.env / Docker**: không commit Key lên Git; dùng `.env` và hướng dẫn ở mục “Cách 3” trên để truyền Key vào lúc build/run.

---

## Cấu trúc thư mục

```
mail-auto-ai/
├── README.md
└── mail-ai/
    ├── index.html   # Giao diện chính
    ├── style.css    # Giao diện
    └── script.js    # Logic form, gọi Gemini, copy tiêu đề/nội dung
```

---

## Công nghệ

- Frontend: HTML, CSS, JavaScript.
- AI: Google Generative AI (Gemini) qua API REST.
- Deploy: Vercel (static).

---

