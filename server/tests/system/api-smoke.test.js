const assert = require('node:assert/strict');
const test = require('node:test');

const { loginAdmin, request, setupTestEnv, startTestServer } = require('../helpers/http');

setupTestEnv('api-system');

test('system: public learning API, protected admin API, and 404 behavior work together', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const health = await request(server.baseUrl, '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);

  const listening = await request(server.baseUrl, '/api/learning/listening?level=A2&topic=travel');
  assert.equal(listening.status, 200);
  assert.ok(listening.data.lessons.length > 0);
  listening.data.lessons.forEach((lesson) => {
    assert.equal(lesson.level, 'A2');
    assert.equal(lesson.topicSlug, 'travel');
  });

  const reading = await request(server.baseUrl, '/api/learning/reading');
  assert.equal(reading.status, 200);
  assert.equal(reading.data.lessons.length, 50);

  const blockedAdmin = await request(server.baseUrl, '/api/admin/quality-dashboard');
  assert.equal(blockedAdmin.status, 401);

  const admin = await loginAdmin(server.baseUrl);
  const quality = await request(server.baseUrl, '/api/admin/quality-dashboard', { token: admin.token });
  assert.equal(quality.status, 200);
  assert.equal(typeof quality.data.dashboard.summary.trackedAbandonment, 'boolean');

  const notFound = await request(server.baseUrl, '/api/not-real');
  assert.equal(notFound.status, 404);
});
