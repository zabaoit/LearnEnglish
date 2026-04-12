require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const learningRoutes = require('./routes/learning.routes');
const progressRoutes = require('./routes/progress.routes');
const { testConnection } = require('./config/db');
const { requireAdmin, requireAuth } = require('./middleware/auth');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(passport.initialize());

app.get('/api/health', async (_req, res) => {
  const database = await testConnection().catch((error) => ({
    ok: false,
    message: error.message,
  }));
  return res.json({ ok: true, service: 'english-learning-api', database });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/progress', progressRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: `Không tìm thấy endpoint ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = status >= 500 ? 'Có lỗi máy chủ. Vui lòng thử lại sau.' : error.message;

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({ message });
});

module.exports = app;
