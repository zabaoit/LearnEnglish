const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { listeningLessons, quizzes, readingLessons, vocabulary } = require('../data/learningData');
const { readDemoStore, saveDemoCollections } = require('../services/demoStore');

const router = express.Router();
const progressByUser = new Map();

function toSet(value) {
  if (value instanceof Set) return value;
  return new Set(Array.isArray(value) ? value.filter(Boolean) : []);
}

function normalizeProgress(item = {}) {
  return {
    favorites: toSet(item.favorites),
    difficult: toSet(item.difficult),
    remembered: toSet(item.remembered),
    reviewQueue: toSet(item.reviewQueue),
    quizHistory: Array.isArray(item.quizHistory) ? item.quizHistory : [],
    practiceHistory: Array.isArray(item.practiceHistory) ? item.practiceHistory : [],
    activityDates: toSet(item.activityDates),
  };
}

function hydrateProgress() {
  const stored = readDemoStore().collections?.progress;
  if (!Array.isArray(stored)) return;

  stored.forEach((item) => {
    if (!item?.userId) return;
    progressByUser.set(String(item.userId), normalizeProgress(item));
  });
}

function progressSnapshot(progress) {
  return {
    favorites: [...progress.favorites],
    difficult: [...progress.difficult],
    remembered: [...progress.remembered],
    reviewQueue: [...progress.reviewQueue],
    quizHistory: progress.quizHistory,
    practiceHistory: progress.practiceHistory,
    activityDates: [...progress.activityDates],
  };
}

function persistProgress() {
  const progress = [...progressByUser.entries()].map(([userId, item]) => ({
    userId,
    ...progressSnapshot(item),
  }));
  saveDemoCollections({ progress });
}

function getProgress(userId) {
  const key = String(userId);
  if (!progressByUser.has(key)) {
    progressByUser.set(key, normalizeProgress());
  }
  return progressByUser.get(key);
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function recordActivity(progress) {
  progress.activityDates.add(todayKey());
}

function percent(count, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((count / total) * 100));
}

function completedLessonIds(progress, type) {
  return new Set(
    progress.practiceHistory
      .filter((attempt) => attempt.type === type && attempt.lessonId)
      .map((attempt) => attempt.lessonId),
  );
}

function touchedWordIds(progress) {
  const ids = new Set([
    ...progress.favorites,
    ...progress.difficult,
    ...progress.remembered,
    ...progress.reviewQueue,
  ]);

  progress.quizHistory.forEach((attempt) => {
    (attempt.wrongWordIds || []).forEach((wordId) => ids.add(wordId));
    (attempt.wrongItems || []).forEach((item) => {
      if (item.wordId) ids.add(item.wordId);
    });
  });

  return ids;
}

function levelProgressFor(wordIds) {
  const totals = new Map();
  const completed = new Map();

  vocabulary.forEach((word) => {
    const level = word.level || 'A1';
    totals.set(level, (totals.get(level) || 0) + 1);
    if (wordIds.has(word.id)) completed.set(level, (completed.get(level) || 0) + 1);
  });

  return ['A1', 'A2', 'B1', 'B2'].reduce((values, level) => ({
    ...values,
    [level]: percent(completed.get(level) || 0, totals.get(level) || 0),
  }), {});
}

function streakDays(activityDates) {
  const days = new Set([...activityDates]);
  let cursor = new Date();
  let streak = 0;

  while (days.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function averageQuizScore(progress) {
  if (!progress.quizHistory.length) return 0;
  const sum = progress.quizHistory.reduce((total, attempt) => total + Number(attempt.score || 0), 0);
  return Math.round(sum / progress.quizHistory.length);
}

function statsFor(progress) {
  const learnedWordIds = touchedWordIds(progress);
  const listeningCompleted = completedLessonIds(progress, 'listening');
  const readingCompleted = completedLessonIds(progress, 'reading');
  const quizCorrect = progress.quizHistory.reduce((sum, attempt) => sum + Number(attempt.correctCount || 0), 0);
  const studyMinutes = learnedWordIds.size + listeningCompleted.size * 3 + readingCompleted.size * 5 + progress.quizHistory.length * 4;

  return {
    difficultWords: progress.difficult.size,
    learnedWords: learnedWordIds.size,
    listeningCompleted: listeningCompleted.size,
    quizAverageScore: averageQuizScore(progress),
    quizCompleted: progress.quizHistory.length,
    readingCompleted: readingCompleted.size,
    recentQuizScore: Number(progress.quizHistory[0]?.score || 0),
    reviewWords: progress.reviewQueue.size,
    savedWords: progress.favorites.size,
    skillProgress: {
      vocabulary: percent(learnedWordIds.size, vocabulary.length),
      listening: percent(listeningCompleted.size, listeningLessons.length),
      reading: percent(readingCompleted.size, readingLessons.length),
      quiz: progress.quizHistory.length ? averageQuizScore(progress) : 0,
    },
    levelProgress: levelProgressFor(learnedWordIds),
    streakDays: streakDays(progress.activityDates),
    studyMinutes,
    xp: learnedWordIds.size * 10 + listeningCompleted.size * 25 + readingCompleted.size * 25 + quizCorrect * 5,
  };
}

function serialize(progress) {
  return {
    ...progressSnapshot(progress),
    stats: statsFor(progress),
  };
}

hydrateProgress();

router.get('/', requireAuth, (req, res) => {
  return res.json({ progress: serialize(getProgress(req.user.sub)) });
});

router.post('/words/:wordId', requireAuth, (req, res) => {
  const word = vocabulary.find((item) => item.id === req.params.wordId);
  if (!word) return res.status(404).json({ message: 'Không tìm thấy từ vựng.' });

  const progress = getProgress(req.user.sub);
  const action = req.body.action;
  const knownActions = new Set(['favorite', 'unfavorite', 'difficult', 'not-difficult', 'remembered', 'review']);

  if (!knownActions.has(action)) {
    return res.status(422).json({ message: 'Hành động tiến độ chưa hợp lệ.' });
  }

  if (action === 'favorite') progress.favorites.add(word.id);
  if (action === 'unfavorite') progress.favorites.delete(word.id);
  if (action === 'difficult') {
    progress.difficult.add(word.id);
    progress.reviewQueue.add(word.id);
  }
  if (action === 'not-difficult') {
    progress.remembered.add(word.id);
    progress.difficult.delete(word.id);
    progress.reviewQueue.delete(word.id);
  }
  if (action === 'remembered') {
    progress.remembered.add(word.id);
    progress.difficult.delete(word.id);
    progress.reviewQueue.delete(word.id);
  }
  if (action === 'review') progress.reviewQueue.add(word.id);

  recordActivity(progress);
  persistProgress();

  return res.json({ word, progress: serialize(progress) });
});

router.post('/quiz-attempts', requireAuth, (req, res) => {
  const progress = getProgress(req.user.sub);
  const attempt = {
    quizId: req.body.quizId,
    score: Number(req.body.score || 0),
    correctCount: Number(req.body.correctCount || 0),
    totalQuestions: Number(req.body.totalQuestions || 0),
    createdAt: new Date().toISOString(),
    wrongWordIds: Array.isArray(req.body.wrongWordIds) ? req.body.wrongWordIds : [],
    wrongItems: Array.isArray(req.body.wrongItems) ? req.body.wrongItems : [],
    answers: req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {},
  };

  attempt.wrongWordIds.forEach((wordId) => {
    progress.difficult.add(wordId);
    progress.reviewQueue.add(wordId);
  });
  progress.quizHistory.unshift(attempt);
  progress.quizHistory = progress.quizHistory.slice(0, 100);
  recordActivity(progress);
  persistProgress();

  return res.status(201).json({ attempt, progress: serialize(progress) });
});

router.post('/practice-attempts', requireAuth, (req, res) => {
  const progress = getProgress(req.user.sub);
  const type = req.body.type === 'reading' ? 'reading' : req.body.type === 'listening' ? 'listening' : '';

  if (!type || !req.body.lessonId) {
    return res.status(422).json({ message: 'Thiếu loại bài luyện hoặc lessonId.' });
  }

  const attempt = {
    type,
    lessonId: String(req.body.lessonId),
    correctCount: Number(req.body.correctCount || 0),
    totalQuestions: Number(req.body.totalQuestions || 0),
    score: Number(req.body.score || 0),
    createdAt: new Date().toISOString(),
    answers: req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {},
  };

  progress.practiceHistory = progress.practiceHistory.filter((item) => !(item.type === type && item.lessonId === attempt.lessonId));
  progress.practiceHistory.unshift(attempt);
  progress.practiceHistory = progress.practiceHistory.slice(0, 200);
  recordActivity(progress);
  persistProgress();

  return res.status(201).json({ attempt, progress: serialize(progress) });
});

module.exports = router;
