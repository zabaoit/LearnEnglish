const assert = require('node:assert/strict');
const test = require('node:test');

const {
  listeningLessons,
  quizzes,
  readingLessons,
  topics,
  vocabulary,
} = require('../../src/data/learningData');

test('unit: learning data exposes enough lessons for listening and reading practice', () => {
  assert.equal(listeningLessons.length, 50);
  assert.equal(readingLessons.length, 50);
  assert.ok(vocabulary.length >= 8);
  assert.ok(topics.length >= 5);
});

test('unit: generated listening and reading questions are varied', () => {
  const listeningPrompts = new Set(listeningLessons.flatMap((lesson) => lesson.questions.map((question) => question.prompt)));
  const readingPrompts = new Set(readingLessons.flatMap((lesson) => lesson.questions.map((question) => question.prompt)));

  assert.ok(listeningPrompts.size >= 8);
  assert.ok(readingPrompts.size >= 8);
});

test('unit: quiz questions include the correct answer among options', () => {
  const questions = quizzes.flatMap((quiz) => quiz.questions);

  assert.ok(questions.length > 0);
  questions.forEach((question) => {
    assert.ok(Array.isArray(question.options), question.prompt);
    assert.ok(question.options.includes(question.answer), question.prompt);
  });
});
