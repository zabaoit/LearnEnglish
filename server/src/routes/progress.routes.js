const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { dashboard, vocabulary } = require('../data/learningData');

const router = express.Router();
const progressByUser = new Map();

function getProgress(userId) {
  if (!progressByUser.has(userId)) {
    progressByUser.set(userId, {
      favorites: new Set(),
      difficult: new Set(dashboard.difficultWordIds),
      remembered: new Set(),
      reviewQueue: new Set(dashboard.difficultWordIds),
      quizHistory: [],
    });
  }
  return progressByUser.get(userId);
}

function serialize(progress) {
  return {
    favorites: [...progress.favorites],
    difficult: [...progress.difficult],
    remembered: [...progress.remembered],
    reviewQueue: [...progress.reviewQueue],
    quizHistory: progress.quizHistory,
  };
}

router.get('/', requireAuth, (req, res) => {
  return res.json({ progress: serialize(getProgress(req.user.sub)) });
});

router.post('/words/:wordId', requireAuth, (req, res) => {
  const word = vocabulary.find((item) => item.id === req.params.wordId);
  if (!word) return res.status(404).json({ message: 'Không tìm thấy từ vựng.' });

  const progress = getProgress(req.user.sub);
  const action = req.body.action;

  if (action === 'favorite') progress.favorites.add(word.id);
  if (action === 'unfavorite') progress.favorites.delete(word.id);
  if (action === 'difficult') {
    progress.difficult.add(word.id);
    progress.reviewQueue.add(word.id);
  }
  if (action === 'remembered') {
    progress.remembered.add(word.id);
    progress.reviewQueue.delete(word.id);
  }
  if (action === 'review') progress.reviewQueue.add(word.id);

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

  return res.status(201).json({ attempt, progress: serialize(progress) });
});

module.exports = router;
