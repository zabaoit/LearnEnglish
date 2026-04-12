const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { body, validationResult } = require('express-validator');

const { getPool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { hydrateDemoCollections, saveDemoCollections } = require('../services/demoStore');

const router = express.Router();
const memoryUsers = new Map();
const defaultAdminEmails = (process.env.ADMIN_EMAILS || 'admin@learnenglish.local')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const authUsers = [
  {
  id: 'admin-demo',
  email: 'admin@learnenglish.local',
  name: 'Admin LearnEnglish',
  password_hash: bcrypt.hashSync(process.env.ADMIN_DEMO_PASSWORD || 'admin123', 12),
  role: 'admin',
  goal: 'Quản trị',
  level: 'B2',
  },
];

hydrateDemoCollections({ authUsers });

authUsers.forEach((user) => {
  memoryUsers.set(user.email.toLowerCase(), user);
});

function persistAuthUsers() {
  saveDemoCollections({ authUsers: [...memoryUsers.values()] });
}

function roleForEmail(email) {
  return defaultAdminEmails.includes(email.toLowerCase()) ? 'admin' : 'student';
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'student',
    goal: user.goal || 'Giao tiếp',
    level: user.level || 'A1',
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role || 'student', email: user.email },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  const pool = getPool();

  if (!pool) {
    return memoryUsers.get(normalizedEmail) || null;
  }

  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.full_name AS name, u.password_hash, u.role,
      p.goal, p.current_level AS level
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.email = :email
     LIMIT 1`,
    { email: normalizedEmail },
  );

  return rows[0] || null;
}

async function findUserById(id) {
  const pool = getPool();

  if (!pool) {
    return [...memoryUsers.values()].find((user) => String(user.id) === String(id)) || null;
  }

  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.full_name AS name, u.password_hash, u.role,
      p.goal, p.current_level AS level
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = :id
     LIMIT 1`,
    { id },
  );

  return rows[0] || null;
}

async function createUser({ email, name, password, goal, level, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase();
  const userRole = role || roleForEmail(normalizedEmail);
  const pool = getPool();

  if (!pool) {
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name,
      password_hash: passwordHash,
      role: userRole,
      goal,
      level,
    };
    memoryUsers.set(normalizedEmail, user);
    persistAuthUsers();
    return user;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO users (email, full_name, password_hash, role)
       VALUES (:email, :name, :passwordHash, :role)`,
      { email: normalizedEmail, name, passwordHash, role: userRole },
    );
    await connection.execute(
      `INSERT INTO user_profiles (user_id, goal, current_level)
       VALUES (:userId, :goal, :level)`,
      { userId: result.insertId, goal, level },
    );
    await connection.commit();
    return { id: result.insertId, email: normalizedEmail, name, password_hash: passwordHash, role: userRole, goal, level };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateProfile(userId, payload) {
  const pool = getPool();

  if (!pool) {
    const user = [...memoryUsers.values()].find((item) => String(item.id) === String(userId));
    if (!user) return null;
    Object.assign(user, payload);
    persistAuthUsers();
    return user;
  }

  if (payload.name) {
    await pool.execute('UPDATE users SET full_name = :name WHERE id = :userId', {
      name: payload.name,
      userId,
    });
  }

  if (payload.goal || payload.level) {
    await pool.execute(
      `UPDATE user_profiles
       SET goal = COALESCE(:goal, goal), current_level = COALESCE(:level, current_level)
       WHERE user_id = :userId`,
      { goal: payload.goal || null, level: payload.level || null, userId },
    );
  }

  return findUserById(userId);
}

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Dữ liệu chưa hợp lệ.', errors: errors.array() });
  }
  return next();
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google account does not expose an email'));

          let user = await findUserByEmail(email);
          if (!user) {
            user = await createUser({
              email,
              name: profile.displayName || 'Google learner',
              password: crypto.randomUUID(),
              goal: 'Giao tiếp',
              level: 'A1',
            });
          }

          return done(null, publicUser(user));
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Tên cần ít nhất 2 ký tự.'),
    body('email').isEmail().withMessage('Email chưa hợp lệ.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu cần ít nhất 6 ký tự.'),
    body('goal').optional().isString(),
    body('level').optional().isIn(['A1', 'A2', 'B1', 'B2', 'C1']),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const existing = await findUserByEmail(req.body.email);
      if (existing) return res.status(409).json({ message: 'Email này đã được đăng ký.' });

      const user = await createUser({
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        goal: req.body.goal || 'Giao tiếp',
        level: req.body.level || 'A1',
      });

      return res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email chưa hợp lệ.').normalizeEmail(),
    body('password').notEmpty().withMessage('Bạn cần nhập mật khẩu.'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await findUserByEmail(req.body.email);
      const matches = user ? await bcrypt.compare(req.body.password, user.password_hash) : false;
      if (!matches) return res.status(401).json({ message: 'Email hoặc mật khẩu chưa đúng.' });
      return res.json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email chưa hợp lệ.').normalizeEmail()],
  validateRequest,
  (_req, res) => {
    return res.json({ message: 'Nếu email tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.' });
  },
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await updateProfile(req.user.sub, req.body);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/placement-test', requireAuth, async (req, res, next) => {
  try {
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const correctCount = answers.filter(Boolean).length;
    const suggestedLevel = correctCount >= 8 ? 'B1' : correctCount >= 5 ? 'A2' : 'A1';
    const user = await updateProfile(req.user.sub, { level: suggestedLevel });

    return res.json({
      suggestedLevel,
      message: `Hệ thống gợi ý bạn bắt đầu ở trình độ ${suggestedLevel}.`,
      user: user ? publicUser(user) : null,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({
      message: 'Điền GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong .env để bật Google OAuth.',
    });
  }

  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?oauth=disabled`);
  }

  return passport.authenticate('google', { session: false }, (error, user) => {
    if (error || !user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?oauth=failed`);
    }
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?token=${signToken(user)}`);
  })(req, res, next);
});

router.get('/facebook', (_req, res) => {
  return res.status(501).json({
    message: 'Facebook OAuth chưa bật trong MVP. Có thể thêm passport-facebook ở bước tích hợp tiếp theo.',
  });
});

module.exports = router;
