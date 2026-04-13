const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function setupTestEnv(name) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `englishhub-${name}-`));
  process.env.NODE_ENV = 'test';
  process.env.DEMO_STORE_PATH = path.join(directory, 'demo-data.json');
  process.env.JWT_SECRET = `test-secret-${name}`;
  process.env.ADMIN_EMAILS = 'admin@englishhub.local';
  process.env.ADMIN_DEMO_PASSWORD = 'admin123';
  delete process.env.DB_HOST;
  delete process.env.DB_NAME;
  return directory;
}

async function startTestServer() {
  const app = require('../../src/app');
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

async function request(baseUrl, pathName, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => null);

  return {
    data,
    ok: response.ok,
    response,
    status: response.status,
  };
}

async function loginAdmin(baseUrl) {
  const result = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@englishhub.local',
      password: 'admin123',
    },
  });
  return result.data;
}

async function registerStudent(baseUrl, email = `student-${Date.now()}@example.com`) {
  const result = await request(baseUrl, '/api/auth/register', {
    method: 'POST',
    body: {
      email,
      goal: 'Giao tiếp',
      level: 'A2',
      name: 'Test Student',
      password: 'student123',
    },
  });
  return result.data;
}

module.exports = {
  loginAdmin,
  registerStudent,
  request,
  setupTestEnv,
  startTestServer,
};
