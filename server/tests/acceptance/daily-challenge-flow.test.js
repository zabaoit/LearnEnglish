const assert = require('node:assert/strict');
const test = require('node:test');

const {
  loginAdmin,
  registerStudent,
  request,
  setupTestEnv,
  startTestServer,
} = require('../helpers/http');

setupTestEnv('daily-challenge-acceptance');

test('acceptance: a learner can complete the daily challenge loop and admin can see quality signals', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const student = await registerStudent(server.baseUrl);
  assert.ok(student.token);
  assert.equal(student.user.role, 'student');

  const progress = await request(server.baseUrl, '/api/progress', { token: student.token });
  assert.equal(progress.status, 200);
  const challenge = progress.data.progress.stats.dailyChallenge;
  assert.equal(challenge.words.length, 5);
  assert.ok(challenge.listening.id);
  assert.ok(challenge.reading.id);
  assert.ok(challenge.miniQuiz.id);

  const favorite = await request(server.baseUrl, `/api/progress/words/${challenge.words[0].id}`, {
    method: 'POST',
    token: student.token,
    body: { action: 'favorite' },
  });
  assert.equal(favorite.status, 200);

  const listeningAttempt = await request(server.baseUrl, '/api/progress/practice-attempts', {
    method: 'POST',
    token: student.token,
    body: {
      answers: { 0: 'book a ticket' },
      correctCount: 1,
      lessonId: challenge.listening.id,
      score: 100,
      totalQuestions: 1,
      type: 'listening',
    },
  });
  assert.equal(listeningAttempt.status, 201);

  const readingAttempt = await request(server.baseUrl, '/api/progress/practice-attempts', {
    method: 'POST',
    token: student.token,
    body: {
      answers: { 0: 'boarding pass' },
      correctCount: 0,
      lessonId: challenge.reading.id,
      score: 0,
      totalQuestions: 1,
      type: 'reading',
    },
  });
  assert.equal(readingAttempt.status, 201);

  const quizAttempt = await request(server.baseUrl, '/api/progress/quiz-attempts', {
    method: 'POST',
    token: student.token,
    body: {
      answers: { 0: 'hạn chót' },
      correctCount: 0,
      quizId: challenge.miniQuiz.id,
      score: 0,
      totalQuestions: 1,
      wrongItems: [
        {
          correctAnswer: 'sự đặt trước',
          prompt: 'Choose the Vietnamese meaning of "reservation".',
          reviewTarget: 'reservation',
          reviewType: 'Vocabulary',
          selectedAnswer: 'hạn chót',
          wordId: 'travel-reservation',
        },
      ],
      wrongWordIds: ['travel-reservation'],
    },
  });
  assert.equal(quizAttempt.status, 201);
  assert.equal(quizAttempt.data.progress.stats.quizCompleted, 1);
  assert.equal(quizAttempt.data.progress.stats.readingCompleted, 1);
  assert.equal(quizAttempt.data.progress.stats.listeningCompleted, 1);
  assert.ok(quizAttempt.data.progress.stats.recommendations.weakSkill.skill);

  const admin = await loginAdmin(server.baseUrl);
  const quality = await request(server.baseUrl, '/api/admin/quality-dashboard', { token: admin.token });
  assert.equal(quality.status, 200);
  assert.ok(quality.data.dashboard.summary.quizAttempts >= 1);
  assert.ok(quality.data.dashboard.summary.practiceAttempts >= 2);
  assert.ok(quality.data.dashboard.difficultWords.some((word) => word.id === 'travel-reservation'));
});
