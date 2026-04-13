const assert = require('node:assert/strict');
const test = require('node:test');

const { loginAdmin, request, setupTestEnv, startTestServer } = require('../helpers/http');

setupTestEnv('progress-integration');

test('integration: progress API stores word, quiz, and practice signals per account', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const admin = await loginAdmin(server.baseUrl);
  assert.ok(admin.token);

  const initial = await request(server.baseUrl, '/api/progress', { token: admin.token });
  assert.equal(initial.status, 200);
  assert.equal(initial.data.progress.stats.learnedWords, 0);
  assert.equal(initial.data.progress.stats.reviewWords, 0);

  const wordResult = await request(server.baseUrl, '/api/progress/words/travel-reservation', {
    method: 'POST',
    token: admin.token,
    body: { action: 'difficult' },
  });
  assert.equal(wordResult.status, 200);
  assert.ok(wordResult.data.progress.reviewQueue.includes('travel-reservation'));

  const quizResult = await request(server.baseUrl, '/api/progress/quiz-attempts', {
    method: 'POST',
    token: admin.token,
    body: {
      answers: { 0: 'hạn chót' },
      correctCount: 0,
      quizId: 'quiz-travel-a2',
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
  assert.equal(quizResult.status, 201);
  assert.equal(quizResult.data.progress.stats.quizCompleted, 1);

  const practiceResult = await request(server.baseUrl, '/api/progress/practice-attempts', {
    method: 'POST',
    token: admin.token,
    body: {
      answers: { 0: 'A return ticket' },
      correctCount: 1,
      lessonId: 'listen-travel-ticket',
      score: 100,
      totalQuestions: 1,
      type: 'listening',
    },
  });
  assert.equal(practiceResult.status, 201);
  assert.equal(practiceResult.data.progress.stats.listeningCompleted, 1);
  assert.ok(practiceResult.data.progress.stats.recommendations.nextAction.title);
  assert.equal(practiceResult.data.progress.stats.dailyChallenge.words.length, 5);
});
