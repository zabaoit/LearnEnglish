const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { listeningLessons, quizzes, readingLessons, topics, vocabulary } = require('../data/learningData');
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

function topicName(topicSlug) {
  const topic = topics.find((item) => item.slug === topicSlug);
  return topic?.nameVi || topic?.name || topicSlug || 'chủ đề hiện tại';
}

function wordFor(wordId) {
  return vocabulary.find((word) => word.id === wordId) || null;
}

function quizFor(quizId) {
  return quizzes.find((quiz) => quiz.id === quizId) || null;
}

function lessonFor(type, lessonId) {
  const lessons = type === 'reading' ? readingLessons : listeningLessons;
  return lessons.find((lesson) => lesson.id === lessonId) || null;
}

function addTopicWeight(scores, topicSlug, amount) {
  if (!topicSlug) return;
  scores.set(topicSlug, (scores.get(topicSlug) || 0) + amount);
}

function weakTopicFor(progress) {
  const scores = new Map();

  progress.reviewQueue.forEach((wordId) => {
    addTopicWeight(scores, wordFor(wordId)?.topicSlug, 4);
  });
  progress.difficult.forEach((wordId) => {
    addTopicWeight(scores, wordFor(wordId)?.topicSlug, 3);
  });
  progress.quizHistory.forEach((attempt) => {
    const quiz = quizFor(attempt.quizId);
    addTopicWeight(scores, quiz?.topicSlug, Number(attempt.score || 0) < 70 ? 3 : 1);
    (attempt.wrongWordIds || []).forEach((wordId) => {
      addTopicWeight(scores, wordFor(wordId)?.topicSlug, 5);
    });
    (attempt.wrongItems || []).forEach((item) => {
      addTopicWeight(scores, wordFor(item.wordId)?.topicSlug, 4);
    });
  });
  progress.practiceHistory.forEach((attempt) => {
    if (Number(attempt.score || 0) >= 70) return;
    addTopicWeight(scores, lessonFor(attempt.type, attempt.lessonId)?.topicSlug, 3);
  });

  const [topicSlug] = [...scores.entries()].sort((left, right) => right[1] - left[1])[0] || [];
  if (topicSlug) return topicSlug;

  return vocabulary.find((word) => !progress.remembered.has(word.id))?.topicSlug || vocabulary[0]?.topicSlug || 'travel';
}

function skillAverage(progress, type) {
  const attempts = progress.practiceHistory.filter((attempt) => attempt.type === type);
  if (!attempts.length) return 0;
  return Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts.length);
}

function weakSkillFor(progress, skillProgress) {
  const candidates = [
    {
      skill: 'vocabulary',
      score: skillProgress.vocabulary,
      reason: progress.reviewQueue.size
        ? `${progress.reviewQueue.size} từ đang đến hạn ôn.`
        : 'Tăng vốn từ trước khi chuyển sang bài kỹ năng dài hơn.',
      targetTab: 'vocabulary',
    },
    {
      skill: 'listening',
      score: skillAverage(progress, 'listening') || skillProgress.listening,
      reason: progress.practiceHistory.some((attempt) => attempt.type === 'listening')
        ? 'Điểm hoặc số bài nghe hoàn thành còn thấp hơn các kỹ năng khác.'
        : 'Chưa có bài nghe hoàn thành trong tài khoản này.',
      targetTab: 'listening',
    },
    {
      skill: 'reading',
      score: skillAverage(progress, 'reading') || skillProgress.reading,
      reason: progress.practiceHistory.some((attempt) => attempt.type === 'reading')
        ? 'Điểm hoặc số bài đọc hoàn thành còn thấp hơn các kỹ năng khác.'
        : 'Chưa có bài đọc hoàn thành trong tài khoản này.',
      targetTab: 'reading',
    },
    {
      skill: 'quiz',
      score: progress.quizHistory.length ? averageQuizScore(progress) : 0,
      reason: progress.quizHistory.length
        ? 'Quiz là nơi tổng hợp lỗi sai và kéo từ vào lịch ôn.'
        : 'Chưa có quiz nào được lưu vào tài khoản này.',
      targetTab: 'quiz',
    },
  ];

  return candidates.sort((left, right) => left.score - right.score)[0];
}

function firstUncompletedLesson(type, topicSlug, completedIds) {
  const lessons = type === 'reading' ? readingLessons : listeningLessons;
  return lessons.find((lesson) => lesson.topicSlug === topicSlug && !completedIds.has(lesson.id))
    || lessons.find((lesson) => !completedIds.has(lesson.id))
    || lessons[0]
    || null;
}

function quizForTopic(topicSlug) {
  return quizzes.find((quiz) => quiz.topicSlug === topicSlug)
    || quizzes.find((quiz) => Array.isArray(quiz.questions) && quiz.questions.length)
    || quizzes[0]
    || null;
}

function reviewWordNames(progress) {
  return [...progress.reviewQueue]
    .slice(0, 3)
    .map((wordId) => wordFor(wordId)?.term)
    .filter(Boolean);
}

function recommendationFor(progress, stats) {
  const weakTopic = weakTopicFor(progress);
  const weakSkill = weakSkillFor(progress, stats.skillProgress);
  const listeningCompleted = completedLessonIds(progress, 'listening');
  const readingCompleted = completedLessonIds(progress, 'reading');
  const listeningLesson = firstUncompletedLesson('listening', weakTopic, listeningCompleted);
  const readingLesson = firstUncompletedLesson('reading', weakTopic, readingCompleted);
  const quiz = quizForTopic(weakTopic);
  const reviewWords = reviewWordNames(progress);
  const nextVocabulary = vocabulary.find((word) => word.topicSlug === weakTopic && !progress.remembered.has(word.id))
    || vocabulary.find((word) => !progress.remembered.has(word.id))
    || vocabulary[0]
    || null;

  const actions = [];

  if (progress.reviewQueue.size) {
    actions.push({
      title: `Ôn ${Math.min(progress.reviewQueue.size, 5)} từ đến hạn`,
      detail: reviewWords.length ? `Ưu tiên: ${reviewWords.join(', ')}.` : 'Mở sổ tay để xử lý reviewQueue của tài khoản này.',
      targetTab: 'saved',
      type: 'review',
    });
  }

  if (weakSkill.skill === 'listening' && listeningLesson) {
    actions.push({
      title: `Nghe: ${listeningLesson.titleVi || listeningLesson.title}`,
      detail: `Tập trung ${topicName(listeningLesson.topicSlug)} ở mức ${listeningLesson.level}.`,
      targetTab: 'listening',
      type: 'listening',
    });
  } else if (weakSkill.skill === 'reading' && readingLesson) {
    actions.push({
      title: `Đọc: ${readingLesson.titleVi || readingLesson.title}`,
      detail: `Tập trung ${topicName(readingLesson.topicSlug)} ở mức ${readingLesson.level}.`,
      targetTab: 'reading',
      type: 'reading',
    });
  } else if (weakSkill.skill === 'quiz' && quiz) {
    actions.push({
      title: `Làm quiz: ${quiz.titleVi || quiz.title}`,
      detail: `Kiểm tra lại ${topicName(quiz.topicSlug)} và đưa lỗi sai vào lịch ôn.`,
      targetTab: 'quiz',
      type: 'quiz',
    });
  } else if (nextVocabulary) {
    actions.push({
      title: `Học từ: ${nextVocabulary.term}`,
      detail: `${topicName(nextVocabulary.topicSlug)} · ${nextVocabulary.level} · ${nextVocabulary.meaningVi}`,
      targetTab: 'vocabulary',
      type: 'vocabulary',
    });
  }

  if (actions.length < 2 && listeningLesson) {
    actions.push({
      title: `Nghe ngữ cảnh: ${listeningLesson.titleVi || listeningLesson.title}`,
      detail: 'Dùng lại từ vựng trong bài nghe ngắn.',
      targetTab: 'listening',
      type: 'listening',
    });
  }

  if (actions.length < 3 && readingLesson) {
    actions.push({
      title: `Đọc ngữ cảnh: ${readingLesson.titleVi || readingLesson.title}`,
      detail: 'Đọc đoạn ngắn có highlight từ vựng.',
      targetTab: 'reading',
      type: 'reading',
    });
  }

  return {
    weakSkill,
    weakTopic: {
      topicSlug: weakTopic,
      label: topicName(weakTopic),
      reason: progress.reviewQueue.size
        ? 'Chủ đề này xuất hiện nhiều trong từ cần ôn hoặc lỗi sai.'
        : 'Đây là chủ đề phù hợp để mở vòng học tiếp theo.',
    },
    nextAction: actions[0] || {
      title: 'Bắt đầu học từ mới',
      detail: 'Chọn một chủ đề và hoàn thành vòng học vocabulary -> listening -> reading -> quiz.',
      targetTab: 'vocabulary',
      type: 'vocabulary',
    },
    actions: actions.slice(0, 3),
    learningLoop: [
      { step: 'Ôn từ đến hạn', targetTab: 'saved', done: progress.reviewQueue.size === 0 },
      { step: 'Học từ mới', targetTab: 'vocabulary', done: stats.learnedWords > 0 },
      { step: 'Nghe trong ngữ cảnh', targetTab: 'listening', done: stats.listeningCompleted > 0 },
      { step: 'Đọc trong ngữ cảnh', targetTab: 'reading', done: stats.readingCompleted > 0 },
      { step: 'Quiz tổng hợp', targetTab: 'quiz', done: stats.quizCompleted > 0 },
    ],
  };
}

function dailyChallengeFor(progress, recommendations) {
  const topicSlug = recommendations.weakTopic?.topicSlug || vocabulary[0]?.topicSlug || 'travel';
  const reviewIds = [...progress.reviewQueue];
  const challengeWords = [
    ...reviewIds
      .map((wordId) => wordFor(wordId))
      .filter(Boolean),
    ...vocabulary.filter((word) => word.topicSlug === topicSlug && !progress.remembered.has(word.id)),
    ...vocabulary.filter((word) => !progress.remembered.has(word.id)),
  ];
  const words = [...new Map(challengeWords.map((word) => [word.id, word])).values()].slice(0, 5);
  const listeningLesson = firstUncompletedLesson('listening', topicSlug, completedLessonIds(progress, 'listening'));
  const readingLesson = firstUncompletedLesson('reading', topicSlug, completedLessonIds(progress, 'reading'));
  const readingQuestion = readingLesson?.questions?.[0] || null;
  const quiz = quizForTopic(topicSlug);
  const quizQuestions = Array.isArray(quiz?.questions) ? quiz.questions.slice(0, 3) : [];

  return {
    date: todayKey(),
    topic: {
      topicSlug,
      label: topicName(topicSlug),
    },
    words: words.map((word) => ({
      id: word.id,
      term: word.term,
      meaningVi: word.meaningVi,
      level: word.level,
    })),
    listening: listeningLesson
      ? {
        id: listeningLesson.id,
        title: listeningLesson.titleVi || listeningLesson.title,
        duration: listeningLesson.duration || '',
        level: listeningLesson.level,
      }
      : null,
    reading: readingLesson
      ? {
        id: readingLesson.id,
        title: readingLesson.titleVi || readingLesson.title,
        level: readingLesson.level,
        question: readingQuestion?.prompt || 'Đọc đoạn ngắn và chọn ý đúng.',
      }
      : null,
    miniQuiz: quiz
      ? {
        id: quiz.id,
        title: quiz.titleVi || quiz.title,
        level: quiz.level,
        questionCount: quizQuestions.length || quiz.questionCount || 0,
      }
      : null,
  };
}

function statsFor(progress) {
  const learnedWordIds = touchedWordIds(progress);
  const listeningCompleted = completedLessonIds(progress, 'listening');
  const readingCompleted = completedLessonIds(progress, 'reading');
  const quizCorrect = progress.quizHistory.reduce((sum, attempt) => sum + Number(attempt.correctCount || 0), 0);
  const studyMinutes = learnedWordIds.size + listeningCompleted.size * 3 + readingCompleted.size * 5 + progress.quizHistory.length * 4;

  const stats = {
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

  const recommendations = recommendationFor(progress, stats);

  return {
    ...stats,
    dailyChallenge: dailyChallengeFor(progress, recommendations),
    recommendations,
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
