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

`https://mail-auto-ai.vercel.app/`

---

## Hướng dẫn chạy ứng dụng cục bộ

Ứng dụng hiện được build bằng **Vite** và nằm trong thư mục `mail-ai/`.

### Yêu cầu

- Node.js (khuyến nghị bản LTS).
- npm (đi kèm Node.js).

### Cài đặt

```bash
git clone https://github.com/<your-username>/mail-auto-ai.git
cd mail-auto-ai/mail-ai
npm install
```

### Cấu hình biến môi trường (API Key)

Tạo file `.env` trong thư mục `mail-ai/`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Lấy Key tại: [Google AI Studio](https://aistudio.google.com/apikey).

### Chạy dev

```bash
npm run dev
```

Mở `http://localhost:5173` (Vite sẽ in URL chính xác trong terminal nếu port khác).

### Build production

```bash
npm run build
```

Output nằm ở `mail-ai/dist/`.

### Xem thử bản build

```bash
npm run preview
```

---

## API Key – Google AI Studio (Gemini)

Ứng dụng dùng **Google AI Studio (Gemini)** để tạo nội dung email.

- **Mục đích sử dụng:** **Chỉ cho thực hành / demo**, không dùng cho môi trường production.
- **Lý do:** Key gọi từ trình duyệt (frontend) **dễ bị lộ**; production nên gọi Gemini qua backend và bảo vệ Key trên server.

Ứng dụng đọc API key từ biến môi trường `VITE_GEMINI_API_KEY` (file `mail-ai/.env`).

---

## Cấu trúc thư mục

```
mail-auto-ai/
├── README.md
└── mail-ai/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── script.js
    ├── style.css
    └── .gitignore
```

---

## Công nghệ

- Frontend: HTML, CSS, JavaScript (Vite).
- AI: Google Generative AI (Gemini) qua API REST.
- Deploy: Vercel.

---

