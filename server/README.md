# Backend API

Express API cho ứng dụng học từ vựng, listening, reading và quiz.

## Chạy local

1. Sao chép `.env.example` thành `.env`.
2. Nếu muốn dùng MySQL thật, tạo database `english_learning` và chạy `database/schema.sql`.
3. Chạy `npm run dev`.

Khi chưa cấu hình MySQL, API tự chạy ở demo mode với dữ liệu mẫu trong bộ nhớ.
Các thay đổi admin/import trong demo mode được lưu ở `storage/demo-data.json`, nên restart backend vẫn giữ dữ liệu. Xóa file này nếu muốn reset demo data.

## Endpoint chính

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/placement-test`
- `GET /api/learning/topics`
- `GET /api/learning/vocabulary?topic=travel&level=A2`
- `GET /api/learning/listening`
- `GET /api/learning/reading`
- `GET /api/learning/quizzes`
- `GET /api/learning/dashboard`
- `GET /api/admin/summary`
- `GET/POST/PATCH/DELETE /api/admin/topics`
- `GET/POST/PATCH/DELETE /api/admin/vocabulary`
- `POST /api/admin/vocabulary/bulk/preview`
- `POST /api/admin/vocabulary/bulk/import`
- `GET /api/admin/import-logs`
- `GET/POST/PATCH/DELETE /api/admin/levels`
- `GET/POST/PATCH/DELETE /api/admin/listening`
- `GET/POST/PATCH/DELETE /api/admin/reading`
- `GET/POST/PATCH/DELETE /api/admin/quizzes`
- `GET/POST/PATCH/DELETE /api/admin/quiz-questions`
- `POST /api/admin/uploads/signature`

## Admin demo và Cloudinary

Demo mode có sẵn `admin@learnenglish.local / admin123`.

Để bật Cloudinary signed upload, thêm vào `.env`:

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
