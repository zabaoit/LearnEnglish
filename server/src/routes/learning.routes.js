const express = require('express');

const { requireAdmin, requireAuth } = require('../middleware/auth');
const {
  adminModules,
  dashboard,
  goals,
  levels,
  listeningLessons,
  quizzes,
  readingLessons,
  roadmap,
  topics,
  vocabulary,
} = require('../data/learningData');

const router = express.Router();
const cefrLevelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function sortLevelCodes(values) {
  return [...new Set((values || []).filter(Boolean))].sort((left, right) => {
    const leftIndex = cefrLevelOrder.indexOf(left);
    const rightIndex = cefrLevelOrder.indexOf(right);

    if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
    if (leftIndex !== -1) return -1;
    if (rightIndex !== -1) return 1;
    return String(left).localeCompare(String(right));
  });
}

function byFilters(items, query) {
  return items.filter((item) => {
    const matchesLevel = !query.level || item.level === query.level || (Array.isArray(item.availableLevels) && item.availableLevels.includes(query.level));
    const matchesTopic = !query.topic || item.topicSlug === query.topic || item.slug === query.topic;
    const searchable = [item.term, item.meaningVi, item.meaningEn, item.title, item.titleVi, item.name, item.nameVi]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = !query.search || searchable.includes(String(query.search).toLowerCase());
    return matchesLevel && matchesTopic && matchesSearch;
  });
}

function topicsWithVocabularyStats() {
  return topics.map((topic) => {
    const topicWords = vocabulary.filter((word) => word.topicSlug === topic.slug);
    const availableLevels = sortLevelCodes(topicWords.map((word) => word.level));

    return {
      ...topic,
      wordCount: topicWords.length || topic.wordCount || 0,
      availableLevels: availableLevels.length ? availableLevels : topic.level ? [topic.level] : [],
    };
  });
}

router.get('/goals', (_req, res) => res.json({ goals }));
router.get('/levels', (_req, res) => res.json({ levels }));
router.get('/topics', (req, res) => res.json({ topics: byFilters(topicsWithVocabularyStats(), req.query) }));
router.get('/vocabulary', (req, res) => res.json({ words: byFilters(vocabulary, req.query) }));
router.get('/listening', (req, res) => res.json({ lessons: byFilters(listeningLessons, req.query) }));
router.get('/reading', (req, res) => res.json({ lessons: byFilters(readingLessons, req.query) }));
router.get('/quizzes', (req, res) => res.json({ quizzes: byFilters(quizzes, req.query) }));
router.get('/roadmap', (_req, res) => res.json({ roadmap }));

router.get('/vocabulary/:id', (req, res) => {
  const word = vocabulary.find((item) => item.id === req.params.id);
  if (!word) return res.status(404).json({ message: 'Không tìm thấy từ vựng.' });
  return res.json({ word });
});

router.get('/dashboard', (_req, res) => {
  const difficultWords = vocabulary.filter((word) => dashboard.difficultWordIds.includes(word.id));
  return res.json({ dashboard: { ...dashboard, difficultWords } });
});

router.get('/admin/modules', requireAuth, requireAdmin, (_req, res) => {
  return res.json({ modules: adminModules });
});

router.post('/ai/suggest-words', (req, res) => {
  const level = req.body.level || 'A2';
  const weakTopics = Array.isArray(req.body.weakTopics) ? req.body.weakTopics : ['travel'];
  const words = vocabulary
    .filter((word) => word.level === level || weakTopics.includes(word.topicSlug))
    .slice(0, 8);

  return res.json({
    words,
    note: 'Đây là rule-based suggestion cho MVP; có thể nối AI service ở bước sau.',
  });
});

module.exports = router;
