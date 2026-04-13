# LearnEnglish

LearnEnglish là web học tiếng Anh theo flow cá nhân hóa: chọn chủ đề, học từ vựng, luyện nghe, luyện đọc, làm quiz, lưu từ khó và xem thống kê theo từng tài khoản.

Ứng dụng hiện là MVP/full demo chạy local với React, Vite, Tailwind CSS, Express, JWT auth và dữ liệu mẫu. Nội dung học, dữ liệu admin và progress tài khoản của MVP được lưu vào demo store JSON để không mất dữ liệu sau khi restart.

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ](#công-nghệ)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Chạy local](#chạy-local)
- [Tài khoản demo](#tài-khoản-demo)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Dữ liệu và lưu trữ](#dữ-liệu-và-lưu-trữ)
- [Luồng học viên](#luồng-học-viên)
- [Trang Admin](#trang-admin)
- [API chính](#api-chính)
- [Scripts](#scripts)
- [Kiểm thử](#kiểm-thử)
- [Ghi chú vận hành](#ghi-chú-vận-hành)

## Tính năng chính

### Học viên

- Đăng ký, đăng nhập, đăng xuất bằng JWT.
- Phân quyền `student` và `admin`.
- Placement test để gợi ý trình độ `A1`, `A2`, `B1`, `B2`.
- Trang chủ load dữ liệu học thật từ API và progress tài khoản.
- Học từ vựng theo chủ đề và trình độ.
- Flashcard học nhanh với mặt trước/mặt sau.
- Nghe phát âm bằng Web Speech API, chọn giọng Anh-Mỹ hoặc Anh-Anh.
- Lưu từ yêu thích, đánh dấu từ khó, đánh dấu đã nhớ.
- Sổ tay từ vựng cá nhân gồm từ đã lưu, từ khó, từ học gần đây, từ cần ôn.
- Listening theo chủ đề/từ vừa học.
- Reading theo chủ đề/từ vừa học.
- Mỗi mục Listening và Reading có danh sách bài, lọc `Tất cả`, `A1`, `A2`, `B1`, `B2`.
- Transcript Listening mặc định ẩn, có nút hiện/ẩn và phát từng câu.
- Dữ liệu mẫu có 50 bài Listening và 50 bài Reading.
- Câu hỏi Listening/Reading được sinh đa dạng theo từ khóa, bối cảnh, nhiệm vụ, topic và cặp từ xuất hiện.
- Quiz có danh sách quiz riêng, lọc theo cấp độ và chọn từng quiz thay vì chỉ làm một bộ câu hỏi cố định.
- Quiz chấm điểm, xem giải thích, review câu sai và đưa từ sai vào lịch ôn.
- Lộ trình học theo ngày.
- Thống kê theo tài khoản: từ đã học, từ cần ôn, quiz đã làm, điểm quiz gần nhất, bài nghe/bài đọc hoàn thành, chuỗi ngày học, XP, tiến độ kỹ năng và tiến độ CEFR.

### Admin

- Workspace quản trị trong cùng frontend, chỉ tài khoản admin mới thấy tab `Admin`.
- CRUD chủ đề, cấp độ, từ vựng, bài nghe, bài đọc, quiz, câu hỏi quiz, người dùng và file lưu trữ.
- Nhập từ vựng hàng loạt bằng textarea hoặc file text/csv.
- Preview dữ liệu import theo từng dòng, báo lỗi, báo trùng và chọn chiến lược xử lý trùng.
- Tự tạo/cập nhật quiz theo từ vựng import.
- Quản lý câu hỏi quiz với đáp án, lựa chọn, giải thích, từ liên quan, mục cần ôn và kỹ năng.
- Cloudinary signed upload cho ảnh từ vựng/avatar và metadata cho audio/tài liệu.
- Nội dung admin trong demo mode được lưu vào `server/storage/demo-data.json`.

## Công nghệ

- Frontend: React 19, Vite 8, Tailwind CSS 4, Lucide React.
- Backend: Node.js, Express 5, Morgan, CORS.
- Auth: JWT, bcryptjs, Passport Google OAuth hook.
- Database tùy chọn: MySQL với `mysql2` cho auth/profile.
- Demo persistence: JSON store tại `server/storage/demo-data.json`.
- Upload: Cloudinary signed upload.

## Cấu trúc thư mục

```text
.
├── client/
│   ├── src/
│   │   ├── AdminPanel.jsx
│   │   ├── App.jsx
│   │   ├── data/learningData.js
│   │   └── services/api.js
│   └── package.json
├── server/
│   ├── database/schema.sql
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── data/learningData.js
│   │   ├── middleware/auth.js
│   │   ├── routes/
│   │   └── services/demoStore.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Chạy local

### 1. Cài dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Tạo file môi trường backend

```bash
copy server\.env.example server\.env
```

Trên macOS/Linux:

```bash
cp server/.env.example server/.env
```

Nếu chỉ chạy demo mode, có thể giữ trống cấu hình MySQL.

### 3. Chạy app

```bash
npm run dev
```

Mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API base khi chạy Vite proxy/local: `/api`

Nếu cần chạy riêng:

```bash
npm run dev:client
npm run dev:server
```

## Tài khoản demo

Trong demo mode có sẵn tài khoản admin:

```text
Email: admin@learnenglish.local
Password: admin123
```

Tài khoản đăng ký mới mặc định là `student`, trừ khi email nằm trong `ADMIN_EMAILS`.

## Cấu hình môi trường

File mẫu: `server/.env.example`

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
ADMIN_EMAILS=admin@learnenglish.local
ADMIN_DEMO_PASSWORD=admin123

DB_HOST=
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### MySQL tùy chọn

Nếu muốn dùng MySQL thật:

```bash
mysql -u root -p english_learning < server/database/schema.sql
```

Sau đó điền:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=english_learning
```

Nếu không có `DB_HOST`/pool MySQL, auth cũng chạy bằng demo store JSON. Trong MVP hiện tại, nội dung học, dữ liệu admin và progress tài khoản vẫn dùng `server/storage/demo-data.json` ngay cả khi bật MySQL.

### Cloudinary tùy chọn

Điền các biến này để bật signed upload:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Ảnh từ vựng/avatar dùng Cloudinary `image`. Audio Listening có thể lưu dạng `video` hoặc metadata external. Tài liệu học có thể dùng `raw` hoặc object storage riêng.

## Dữ liệu và lưu trữ

### Demo data

Dữ liệu seed nằm trong:

- `client/src/data/learningData.js`
- `server/src/data/learningData.js`

Server trả dữ liệu học qua `/api/learning/*`. Frontend dùng seed local làm fallback khi API chưa sẵn sàng.

### Demo persistence

Khi chạy demo mode, server lưu các thay đổi vào:

```text
server/storage/demo-data.json
```

File này bị ignore trong git vì là dữ liệu local. Nó lưu các nhóm như:

- `authUsers`
- `progress`
- `vocabulary`
- `topics`
- `listening`
- `reading`
- `quizzes`
- `users`
- `assets`
- `importLogs`

Muốn reset dữ liệu demo:

```bash
Remove-Item -Recurse -Force server/storage
```

Trên macOS/Linux:

```bash
rm -rf server/storage
```

### Progress theo tài khoản

Progress được lưu theo `userId`, gồm:

- `favorites`: từ yêu thích.
- `difficult`: từ khó.
- `remembered`: từ đã nhớ.
- `reviewQueue`: từ cần ôn.
- `quizHistory`: lịch sử làm quiz.
- `practiceHistory`: lịch sử hoàn thành Listening/Reading.
- `activityDates`: ngày có hoạt động học.
- `stats`: số liệu được tính từ progress của chính tài khoản đó.

Các chỉ số thống kê không còn dùng số demo chung ở tab `Thống kê`.

## Luồng học viên

Flow chính:

```text
Trang chủ -> Xếp trình độ -> Từ vựng -> Listening -> Reading -> Quiz -> Lộ trình -> Sổ tay từ vựng -> Thống kê
```

### Từ vựng

- Lọc theo chủ đề.
- Lọc theo trình độ.
- Flashcard với lật thẻ.
- Phát âm từ và câu ví dụ.
- Lưu từ yêu thích.
- Đánh dấu từ khó/đã nhớ.
- Gợi ý bài Listening liên quan đến từ/chủ đề vừa học.

### Listening

- Có danh sách bài bên trái.
- Lọc bài theo `Tất cả`, `A1`, `A2`, `B1`, `B2`.
- Chọn bài để làm câu hỏi.
- Transcript mặc định ẩn.
- Có nút phát audio, chọn tốc độ và chọn giọng.
- Khi trả lời đủ câu, app lưu `practice-attempt` vào progress tài khoản.

### Reading

- Có danh sách bài bên trái.
- Lọc bài theo `Tất cả`, `A1`, `A2`, `B1`, `B2`.
- Highlight từ trong bài đọc.
- Có khung giải nghĩa từ đang chọn.
- Khi trả lời đủ câu, app lưu `practice-attempt` vào progress tài khoản.

### Quiz

- Có danh sách quiz bên trái.
- Lọc quiz theo `Tất cả`, `A1`, `A2`, `B1`, `B2`.
- Chọn quiz bất kỳ từ dữ liệu admin/import.
- Làm bài, nộp, xem điểm, xem giải thích.
- Review riêng câu sai.
- Tự đưa từ sai vào `reviewQueue` và `difficult`.

### Thống kê

Tab `Thống kê` hiển thị theo tài khoản đang đăng nhập:

- Từ đã học.
- Từ cần ôn.
- Quiz đã làm.
- Điểm quiz gần nhất.
- Bài nghe hoàn thành.
- Bài đọc hoàn thành.
- Chuỗi ngày học.
- XP.
- Tiến độ kỹ năng: vocabulary, listening, reading, quiz.
- Tiến độ CEFR: A1, A2, B1, B2.
- Lịch ôn thông minh từ lỗi quiz và từ khó của tài khoản.

## Trang Admin

Tab `Admin` chỉ hiển thị với user có role `admin`.

Các module chính:

- `Chủ đề`
- `Từ vựng`
- `Nhập từ hàng loạt`
- `Cấp độ`
- `Bài nghe`
- `Bài đọc`
- `Quiz`
- `Câu hỏi quiz`
- `Người dùng`
- `File lưu trữ`
- `Nhật ký import`

### Nhập từ hàng loạt

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

Luồng import:

1. Chọn chủ đề và trình độ.
2. Dán nội dung hoặc chọn file.
3. Preview để xem dòng hợp lệ, lỗi, dòng rỗng hoặc trùng.
4. Chọn chiến lược trùng: bỏ qua, cập nhật hoặc ghi đè.
5. Import.
6. Hệ thống tạo/cập nhật từ vựng và thêm câu hỏi vào quiz tự động của chủ đề/trình độ.

## API chính

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/placement-test`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/facebook` placeholder

### Learning

- `GET /api/learning/goals`
- `GET /api/learning/levels`
- `GET /api/learning/topics`
- `GET /api/learning/vocabulary`
- `GET /api/learning/vocabulary/:id`
- `GET /api/learning/listening`
- `GET /api/learning/reading`
- `GET /api/learning/quizzes`
- `GET /api/learning/roadmap`
- `GET /api/learning/placement`
- `GET /api/learning/daily-plan`
- `GET /api/learning/review-signals`
- `GET /api/learning/dashboard`
- `POST /api/learning/ai/suggest-words`

Các endpoint list hỗ trợ filter qua query như:

```text
?topic=travel&level=A2&search=reservation
```

### Progress

Yêu cầu JWT:

- `GET /api/progress`
- `POST /api/progress/words/:wordId`
- `POST /api/progress/quiz-attempts`
- `POST /api/progress/practice-attempts`

Ví dụ action từ vựng:

```json
{
  "action": "favorite"
}
```

Các action hỗ trợ:

- `favorite`
- `unfavorite`
- `difficult`
- `not-difficult`
- `remembered`
- `review`

### Admin

Yêu cầu JWT admin:

- `GET /api/admin/summary`
- `GET /api/admin/uploads/policy`
- `POST /api/admin/uploads/signature`
- `GET /api/admin/quiz-questions`
- `POST /api/admin/quiz-questions`
- `PATCH /api/admin/quiz-questions/:id`
- `DELETE /api/admin/quiz-questions/:id`
- `POST /api/admin/vocabulary/bulk/preview`
- `POST /api/admin/vocabulary/bulk/import`
- `GET/POST/PATCH/DELETE /api/admin/topics`
- `GET/POST/PATCH/DELETE /api/admin/vocabulary`
- `GET/POST/PATCH/DELETE /api/admin/levels`
- `GET/POST/PATCH/DELETE /api/admin/listening`
- `GET/POST/PATCH/DELETE /api/admin/reading`
- `GET/POST/PATCH/DELETE /api/admin/quizzes`
- `GET/POST/PATCH/DELETE /api/admin/users`
- `GET/POST/PATCH/DELETE /api/admin/assets`
- `GET/POST/PATCH/DELETE /api/admin/import-logs`

## Scripts

Root:

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm test
```

Client:

```bash
npm run dev --prefix client
npm run build --prefix client
npm run lint --prefix client
npm run preview --prefix client
```

Server:

```bash
npm run dev --prefix server
npm start --prefix server
npm test --prefix server
```

## Kiểm thử

Các lệnh đã dùng để kiểm tra:

```bash
npm run lint --prefix client
npm run build --prefix client
npm test --prefix server
```

Hiện backend test vẫn là placeholder:

```text
No backend tests configured yet
```

## Ghi chú vận hành

- `server/storage/` bị ignore vì chứa dữ liệu demo local và có thể chứa thông tin tài khoản/progress.
- Không commit `.env`, `node_modules`, `client/dist` hoặc log/cache.
- Nếu server đang chạy bằng `node src/server.js`, cần restart server sau khi sửa backend.
- Nếu server chạy bằng `npm run dev --prefix server`, `nodemon` tự reload khi file đổi.
- Nếu app đang dùng demo store cũ, server vẫn hydrate dữ liệu từ `server/storage/demo-data.json`. Xóa file này khi muốn quay về seed mới hoàn toàn.
- Google OAuth chỉ hoạt động khi cấu hình đủ `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.
- Facebook OAuth hiện là placeholder endpoint.
- Excel import chưa bật; MVP đang dùng textarea/text/csv để tránh thêm dependency đọc Excel khi chưa cần.
