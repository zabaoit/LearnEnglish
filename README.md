# LearnFlow English MVP

Ứng dụng học tiếng Anh theo flow:

Chủ đề -> Học từ vựng -> Luyện nhanh -> Listening liên quan -> Reading liên quan -> Quiz tổng hợp -> Ôn tập.

## Công nghệ

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MySQL schema sẵn trong `server/database/schema.sql`
- Authentication: JWT, bcrypt, Google OAuth hook

## Chạy local

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

Frontend chạy ở `http://localhost:5173`, backend chạy ở `http://localhost:5000`.

## Cấu hình backend

Sao chép `server/.env.example` thành `server/.env`.

Nếu chưa cấu hình MySQL, backend tự chạy demo mode bằng dữ liệu mẫu trong bộ nhớ. Khi dùng MySQL thật, tạo database và chạy:

```bash
mysql -u root -p english_learning < server/database/schema.sql
```

Sau đó điền `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` trong `server/.env`.

## Tính năng đã dựng

- Đăng ký, đăng nhập, quên mật khẩu, hồ sơ, placement test endpoint
- JWT và bcrypt cho backend auth
- Google OAuth route, bật bằng `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`
- Facebook OAuth placeholder route cho bước tích hợp tiếp theo
- Tách role `student` và `admin`, tab Admin dùng chung frontend nhưng cần tài khoản admin
- Admin CRUD cho chủ đề, từ vựng, cấp độ, bài nghe, bài đọc, quiz, câu hỏi quiz, người dùng và file lưu trữ
- Nhập từ vựng hàng loạt bằng textarea hoặc `.txt/.csv`, hỗ trợ `hello - xin chào`, `hello | xin chào`, mẫu mở rộng có phiên âm/ví dụ, preview từng dòng, báo lỗi/trùng, chọn bỏ qua/cập nhật/ghi đè
- Từ import được gắn chủ đề/trình độ, hiển thị ngay trong flashcard và tạo câu quiz tự động cho chủ đề đó
- Cloudinary signed upload cho ảnh từ vựng/avatar; audio listening và tài liệu học có metadata để dùng Cloudinary raw/video hoặc storage riêng
- Từ vựng theo chủ đề và trình độ A1/A2/B1/B2
- Flashcard, nghe phát âm bằng Web Speech API, lưu từ, đánh dấu từ khó
- Listening có transcript, tốc độ audio, phát từng câu
- Reading có highlight từ mới và câu hỏi
- Quiz có chấm đáp án và đưa lỗi sai vào ôn tập
- Dashboard, lộ trình học, thống kê kỹ năng, CMS admin workspace

## Admin demo

Trong demo mode, đăng nhập ở tab `Admin` bằng:

```text
admin@learnflow.local
admin123
```

Với MySQL thật, email nằm trong `ADMIN_EMAILS` sẽ được gán role `admin` khi đăng ký.

## Cloudinary

Điền các biến này trong `server/.env` để bật upload có ký:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Ảnh từ vựng và avatar nên dùng Cloudinary `image`. Audio listening có thể upload dạng Cloudinary `video`, tài liệu học dạng `raw`, hoặc thay bằng object storage riêng nếu dung lượng lớn.

## Nhập từ vựng hàng loạt

Trong tab `Admin`, chọn `Nhập từ hàng loạt`.

Định dạng đơn giản:

```text
hello - xin chào
one | số một
book, quyển sách
```

Định dạng mở rộng:

```text
hello - xin chào - /həˈləʊ/ - Hello, how are you?
book - quyển sách - /bʊk/ - This is my book.
```

Trước khi lưu, hệ thống hiển thị preview theo từng dòng với trạng thái hợp lệ, lỗi, dòng rỗng hoặc trùng từ. Khi lưu, admin chọn cách xử lý từ trùng: bỏ qua, cập nhật hoặc ghi đè.

Excel chưa được bật trong MVP này vì package đọc Excel phổ biến vừa kiểm tra có cảnh báo bảo mật npm audit; hiện dùng `.txt/.csv` an toàn hơn.
