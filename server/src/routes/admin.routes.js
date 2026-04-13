const crypto = require('crypto');
const express = require('express');

const { createUploadSignature } = require('../config/cloudinary');
const { hydrateDemoCollections, readDemoStore, saveDemoCollections } = require('../services/demoStore');
const {
  levels,
  listeningLessons,
  quizzes,
  readingLessons,
  topics,
  vocabulary,
} = require('../data/learningData');

const router = express.Router();

const users = [
  {
    id: 'admin-demo',
    email: 'admin@learnenglish.local',
    name: 'Admin LearnEnglish',
    role: 'admin',
    level: 'B2',
    goal: 'Quản trị',
    status: 'active',
  },
  {
    id: 'student-demo',
    email: 'student@example.com',
    name: 'Demo Student',
    role: 'student',
    level: 'A2',
    goal: 'Giao tiếp',
    status: 'active',
  },
];

const assets = [
  {
    id: 'asset-vocab-image-demo',
    category: 'vocabulary_image',
    provider: 'cloudinary',
    resourceType: 'image',
    url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
    ownerType: 'vocabulary',
    ownerId: 'travel-boarding-pass',
  },
  {
    id: 'asset-listening-audio-demo',
    category: 'listening_audio',
    provider: 'external',
    resourceType: 'audio',
    url: '',
    ownerType: 'listening',
    ownerId: 'listen-travel-ticket',
  },
];

const importLogs = [];

const persistedCollections = {
  levels,
  topics,
  vocabulary,
  listening: listeningLessons,
  reading: readingLessons,
  quizzes,
  users,
  assets,
  importLogs,
};

const listeningLessonDefaults = listeningLessons.map((lesson) => ({ ...lesson }));
const readingLessonDefaults = readingLessons.map((lesson) => ({ ...lesson }));
const quizQuestionDefaults = new Map(
  quizzes.flatMap((quiz) =>
    quiz.questions.map((question) => [
      `${quiz.id}::${question.prompt}`,
      {
        explanation: question.explanation,
        relatedWordId: question.relatedWordId,
        reviewTarget: question.reviewTarget,
        reviewType: question.reviewType,
        skill: question.skill,
      },
    ]),
  ),
);

function restoreMissingLessons(collection, defaults) {
  const ids = new Set(collection.map((item) => item.id));
  defaults.forEach((lesson) => {
    if (!ids.has(lesson.id)) {
      collection.push(lesson);
      ids.add(lesson.id);
    }
  });
}

function applyQuizQuestionDefaults() {
  quizzes.forEach((quiz) => {
    (quiz.questions || []).forEach((question) => {
      const defaults = quizQuestionDefaults.get(`${quiz.id}::${question.prompt}`);
      if (!defaults) return;
      if (!question.explanation && defaults.explanation) question.explanation = defaults.explanation;
      if (!question.relatedWordId && defaults.relatedWordId) question.relatedWordId = defaults.relatedWordId;
      if (!question.reviewTarget && defaults.reviewTarget) question.reviewTarget = defaults.reviewTarget;
      if (!question.reviewType && defaults.reviewType) question.reviewType = defaults.reviewType;
      if (!question.skill && defaults.skill) question.skill = defaults.skill;
    });
  });
}

function normalizeQuizCollections() {
  quizzes.forEach((quiz) => {
    quiz.questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    quiz.questionCount = quiz.questions.length;
  });
}

hydrateDemoCollections(persistedCollections);
restoreMissingLessons(listeningLessons, listeningLessonDefaults);
restoreMissingLessons(readingLessons, readingLessonDefaults);
normalizeQuizCollections();
applyQuizQuestionDefaults();

const collections = {
  levels,
  topics,
  vocabulary,
  listening: listeningLessons,
  reading: readingLessons,
  quizzes,
  users,
  assets,
  'import-logs': importLogs,
};

function persistDemoContent() {
  saveDemoCollections(persistedCollections);
}

function publicAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email,
    role: user.role || 'student',
    level: user.level || 'A1',
    goal: user.goal || 'Giao tiếp',
    status: user.status || 'active',
  };
}

function syncUsersFromAuthStore() {
  const authUsers = readDemoStore().collections?.authUsers;
  if (!Array.isArray(authUsers)) return;

  authUsers.forEach((authUser) => {
    const publicUser = publicAdminUser(authUser);
    const index = users.findIndex((item) => String(item.id) === String(publicUser.id) || item.email === publicUser.email);

    if (index >= 0) {
      users[index] = { ...users[index], ...publicUser };
      return;
    }

    users.push(publicUser);
  });
}

const idKeys = {
  levels: 'code',
  topics: 'slug',
  vocabulary: 'id',
  listening: 'id',
  reading: 'id',
  quizzes: 'id',
  users: 'id',
  assets: 'id',
  'import-logs': 'id',
};

function slugify(value) {
  return String(value || crypto.randomUUID())
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getCollection(resource) {
  return collections[resource];
}

function getIdKey(resource) {
  return idKeys[resource] || 'id';
}

function ensureIdentity(resource, item) {
  const idKey = getIdKey(resource);

  if (!item[idKey] && resource === 'levels') {
    item.code = String(item.name || `L${levels.length + 1}`).toUpperCase();
  } else if (!item[idKey] && resource === 'topics') {
    item.slug = slugify(item.name || item.nameVi);
  } else if (!item[idKey]) {
    item[idKey] = slugify(item.term || item.title || item.email || item.category || crypto.randomUUID());
  }

  if (resource === 'quizzes') {
    item.questions = Array.isArray(item.questions) ? item.questions : [];
    item.questionCount = item.questions.length || Number(item.questionCount) || 0;
  }

  return item;
}

function questionRows() {
  return quizzes.flatMap((quiz) =>
    (quiz.questions || []).map((question, index) => ({
      ...question,
      id: `${quiz.id}::${index}`,
      quizId: quiz.id,
      quizTitle: quiz.titleVi || quiz.title,
    })),
  );
}

function parseQuestionId(id) {
  const separator = id.lastIndexOf('::');
  if (separator === -1) return null;
  return {
    quizId: id.slice(0, separator),
    index: Number(id.slice(separator + 2)),
  };
}

function normalizeTerm(term) {
  return String(term || '').trim().toLowerCase();
}

function normalizeCell(value) {
  return String(value || '')
    .trim()
    .replace(/^[\s\-|,;]+|[\s\-|,;]+$/g, '')
    .replace(/\s+/g, ' ');
}

function detectDelimiter(line) {
  if (line.includes('|')) return '|';
  if (line.includes('-')) return '-';
  if (line.includes(',')) return ',';
  return '';
}

function splitBulkLine(line) {
  const delimiter = detectDelimiter(line);

  if (!delimiter) {
    return { delimiter: '', parts: [] };
  }

  return {
    delimiter,
    parts: line
      .split(delimiter)
      .map(normalizeCell),
  };
}

function existingWordFor(term, topicSlug) {
  return vocabulary.find((word) => normalizeTerm(word.term) === normalizeTerm(term) && (!topicSlug || word.topicSlug === topicSlug));
}

function parseBulkVocabularyText(text, topicSlug = '') {
  const lines = String(text || '').split(/\r?\n/);
  const parsed = [];
  const errors = [];
  const rows = [];
  const seen = new Set();

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = normalizeCell(rawLine);

    if (!line) {
      rows.push({
        line: lineNumber,
        raw: rawLine,
        status: 'ignored',
        message: 'Bỏ qua dòng rỗng.',
      });
      return;
    }

    const { delimiter, parts } = splitBulkLine(line);

    if (!delimiter) {
      const error = { line: lineNumber, raw: rawLine, status: 'error', message: 'Thiếu dấu -, | hoặc , giữa từ tiếng Anh và nghĩa tiếng Việt.' };
      errors.push(error);
      rows.push(error);
      return;
    }

    const [rawTerm, rawMeaningVi, rawPhonetic = '', ...exampleParts] = parts;
    const term = normalizeCell(rawTerm).toLowerCase();
    const meaningVi = normalizeCell(rawMeaningVi);
    const phonetic = normalizeCell(rawPhonetic);
    const example = normalizeCell(exampleParts.join(` ${delimiter} `));

    if (!term || !meaningVi) {
      const error = { line: lineNumber, raw: rawLine, status: 'error', term, meaningVi, phonetic, example, message: 'Từ tiếng Anh hoặc nghĩa tiếng Việt đang trống.' };
      errors.push(error);
      rows.push(error);
      return;
    }

    const normalized = normalizeTerm(term);

    if (seen.has(normalized)) {
      const duplicateInInput = { line: lineNumber, raw: rawLine, status: 'duplicate-input', term, meaningVi, phonetic, example, message: `Từ "${term}" bị trùng trong nội dung nhập.` };
      errors.push(duplicateInInput);
      rows.push(duplicateInInput);
      return;
    }

    seen.add(normalized);
    const existing = existingWordFor(term, topicSlug);
    const item = {
      line: lineNumber,
      raw: rawLine,
      status: existing ? 'duplicate-existing' : 'valid',
      term,
      meaningVi,
      phonetic,
      example,
      existingId: existing?.id,
      message: existing ? `Từ "${term}" đã tồn tại.` : 'Hợp lệ.',
    };
    parsed.push(item);
    rows.push(item);
  });

  const duplicates = parsed.filter((item) => item.status === 'duplicate-existing');

  return {
    parsed,
    errors,
    duplicates,
    rows,
    validCount: parsed.length,
    errorCount: errors.length,
    duplicateCount: duplicates.length,
    ignoredCount: rows.filter((row) => row.status === 'ignored').length,
  };
}

function createBulkWord(item, defaults) {
  return {
    id: slugify(`${defaults.topicSlug || 'bulk'}-${item.term}`),
    term: item.term,
    phonetic: item.phonetic || defaults.phonetic || '',
    meaningVi: item.meaningVi,
    meaningEn: '',
    partOfSpeech: defaults.partOfSpeech || 'unknown',
    level: defaults.level || 'A1',
    topicSlug: defaults.topicSlug || 'general',
    imageUrl: defaults.imageUrl || '',
    example: item.example || defaults.example || '',
    audioText: item.term,
    synonyms: [],
    antonyms: [],
    collocations: [],
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function applyBulkUpdate(existing, item, defaults, strategy) {
  existing.meaningVi = item.meaningVi;
  existing.topicSlug = defaults.topicSlug;
  existing.level = defaults.level;

  if (strategy === 'overwrite' || item.phonetic) {
    existing.phonetic = item.phonetic || '';
  }

  if (strategy === 'overwrite' || item.example) {
    existing.example = item.example || '';
  }

  existing.audioText = item.term;
  existing.updatedAt = new Date().toISOString();

  return existing;
}

function ensureAutoQuiz(topicSlug, level) {
  const quizId = `quiz-${topicSlug}-${level}-imported`;
  let quiz = quizzes.find((item) => item.id === quizId);

  if (!quiz) {
    quiz = {
      id: quizId,
      title: `${topicSlug} ${level} imported vocabulary`,
      titleVi: `Quiz từ mới ${topicSlug} ${level}`,
      level,
      topicSlug,
      questionCount: 0,
      questions: [],
    };
    quizzes.push(quiz);
  }

  return quiz;
}

function createMeaningOptions(answer, term) {
  const distractors = vocabulary
    .filter((word) => normalizeTerm(word.term) !== normalizeTerm(term) && word.meaningVi && word.meaningVi !== answer)
    .map((word) => word.meaningVi)
    .slice(0, 3);

  return [...new Set([answer, ...distractors])];
}

function addAutoQuizQuestions(words, topicSlug, level) {
  const quiz = ensureAutoQuiz(topicSlug, level);
  let added = 0;

  words.forEach((word) => {
    const prompt = `Choose the Vietnamese meaning of "${word.term}".`;
    const exists = quiz.questions.some((question) => question.prompt === prompt);

    if (exists) return;

    quiz.questions.push({
      prompt,
      answer: word.meaningVi,
      options: createMeaningOptions(word.meaningVi, word.term),
      explanation: `"${word.term}" nghĩa là "${word.meaningVi}".`,
      relatedWordId: word.id,
      reviewTarget: word.term,
      reviewType: 'Vocabulary',
      skill: 'Vocabulary',
    });
    added += 1;
  });

  quiz.questionCount = quiz.questions.length;

  return { quizId: quiz.id, added };
}

router.get('/summary', (_req, res) => {
  syncUsersFromAuthStore();

  return res.json({
    summary: {
      levels: levels.length,
      topics: topics.length,
      vocabulary: vocabulary.length,
      listening: listeningLessons.length,
      reading: readingLessons.length,
      quizzes: quizzes.length,
      quizQuestions: questionRows().length,
      users: users.length,
      assets: assets.length,
      importLogs: importLogs.length,
    },
  });
});

router.post('/uploads/signature', (req, res) => {
  const signature = createUploadSignature(req.body.category, req.body.publicId);

  if (!signature) {
    return res.status(501).json({
      message: 'Chưa cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.',
    });
  }

  return res.json({ signature });
});

router.get('/uploads/policy', (_req, res) => {
  return res.json({
    policy: [
      { category: 'vocabulary_image', label: 'Ảnh từ vựng', provider: 'Cloudinary', resourceType: 'image' },
      { category: 'avatar', label: 'Avatar', provider: 'Cloudinary', resourceType: 'image' },
      { category: 'listening_audio', label: 'Audio listening', provider: 'Cloudinary raw/video hoặc storage audio riêng', resourceType: 'audio' },
      { category: 'learning_document', label: 'Tài liệu học', provider: 'Cloudinary raw hoặc object storage', resourceType: 'raw' },
    ],
  });
});

router.get('/quiz-questions', (_req, res) => {
  return res.json({ items: questionRows() });
});

router.post('/vocabulary/bulk/preview', (req, res) => {
  const result = parseBulkVocabularyText(req.body.text, req.body.topicSlug);
  return res.json({ result });
});

router.post('/vocabulary/bulk/import', (req, res) => {
  const topicSlug = req.body.topicSlug || 'general';
  const level = req.body.level || 'A1';
  const result = parseBulkVocabularyText(req.body.text, topicSlug);

  if (result.errors.length > 0) {
    return res.status(422).json({
      message: 'Danh sách còn dòng sai định dạng.',
      result,
    });
  }

  const duplicateStrategy = ['skip', 'update', 'overwrite'].includes(req.body.duplicateStrategy)
    ? req.body.duplicateStrategy
    : Boolean(req.body.updateExisting)
      ? 'update'
      : 'skip';
  const created = [];
  const updated = [];
  const skipped = [];

  result.parsed.forEach((item) => {
    const existing = existingWordFor(item.term, topicSlug);

    if (existing && ['update', 'overwrite'].includes(duplicateStrategy)) {
      updated.push(applyBulkUpdate(existing, item, { topicSlug, level }, duplicateStrategy));
      return;
    }

    if (existing) {
      skipped.push({ ...item, existingId: existing.id });
      return;
    }

    const word = createBulkWord(item, {
      level,
      topicSlug,
      partOfSpeech: req.body.partOfSpeech,
    });
    vocabulary.push(word);
    created.push(word);
  });

  const autoQuiz = addAutoQuizQuestions([...created, ...updated], topicSlug, level);

  const importLog = {
    id: crypto.randomUUID(),
    actor: req.user?.email || req.user?.sub || 'admin',
    createdAt: new Date().toISOString(),
    sourceType: req.body.sourceType || 'textarea',
    fileName: req.body.fileName || '',
    topicSlug,
    level,
    duplicateStrategy,
    totalLines: result.rows.length,
    validCount: result.validCount,
    errorCount: result.errorCount,
    duplicateCount: result.duplicateCount,
    createdCount: created.length,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    autoQuizId: autoQuiz.quizId,
    autoQuizQuestionCount: autoQuiz.added,
  };

  importLogs.unshift(importLog);
  persistDemoContent();

  return res.status(201).json({
    message: 'Đã xử lý danh sách từ vựng.',
    created,
    updated,
    skipped,
    autoQuiz,
    importLog,
    result: {
      ...result,
      createdCount: created.length,
      updatedCount: updated.length,
      skippedCount: skipped.length,
      autoQuizQuestionCount: autoQuiz.added,
      duplicateStrategy,
    },
  });
});

router.post('/quiz-questions', (req, res) => {
  const quiz = quizzes.find((item) => item.id === req.body.quizId) || quizzes[0];
  const question = {
    prompt: req.body.prompt || 'New question',
    answer: req.body.answer || '',
    options: Array.isArray(req.body.options) ? req.body.options : [],
    explanation: req.body.explanation || '',
    relatedWordId: req.body.relatedWordId || '',
    reviewTarget: req.body.reviewTarget || '',
    reviewType: req.body.reviewType || '',
    skill: req.body.skill || 'Vocabulary',
  };
  quiz.questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  quiz.questions.push(question);
  quiz.questionCount = quiz.questions.length;
  persistDemoContent();

  return res.status(201).json({ item: { ...question, id: `${quiz.id}::${quiz.questions.length - 1}`, quizId: quiz.id } });
});

router.patch('/quiz-questions/:id', (req, res) => {
  const parsed = parseQuestionId(req.params.id);
  const quiz = parsed ? quizzes.find((item) => item.id === parsed.quizId) : null;
  const question = quiz?.questions[parsed.index];

  if (!question) {
    return res.status(404).json({ message: 'Không tìm thấy câu hỏi quiz.' });
  }

  Object.assign(question, req.body);
  quiz.questionCount = quiz.questions.length;
  persistDemoContent();
  return res.json({ item: { ...question, id: req.params.id, quizId: quiz.id } });
});

router.delete('/quiz-questions/:id', (req, res) => {
  const parsed = parseQuestionId(req.params.id);
  const quiz = parsed ? quizzes.find((item) => item.id === parsed.quizId) : null;

  if (!quiz?.questions[parsed.index]) {
    return res.status(404).json({ message: 'Không tìm thấy câu hỏi quiz.' });
  }

  const [deleted] = quiz.questions.splice(parsed.index, 1);
  quiz.questionCount = quiz.questions.length;
  persistDemoContent();
  return res.json({ item: deleted });
});

router.get('/:resource', (req, res) => {
  if (req.params.resource === 'users') syncUsersFromAuthStore();

  const collection = getCollection(req.params.resource);

  if (!collection) {
    return res.status(404).json({ message: 'Không tìm thấy nhóm quản trị.' });
  }

  return res.json({ items: collection });
});

router.post('/:resource', (req, res) => {
  const collection = getCollection(req.params.resource);

  if (!collection) {
    return res.status(404).json({ message: 'Không tìm thấy nhóm quản trị.' });
  }

  const item = ensureIdentity(req.params.resource, { ...req.body });
  collection.push(item);
  persistDemoContent();

  return res.status(201).json({ item });
});

router.patch('/:resource/:id', (req, res) => {
  const collection = getCollection(req.params.resource);
  const idKey = getIdKey(req.params.resource);
  const item = collection?.find((entry) => String(entry[idKey]) === String(req.params.id));

  if (!item) {
    return res.status(404).json({ message: 'Không tìm thấy dữ liệu cần cập nhật.' });
  }

  Object.assign(item, req.body);
  persistDemoContent();

  return res.json({ item });
});

router.delete('/:resource/:id', (req, res) => {
  const collection = getCollection(req.params.resource);
  const idKey = getIdKey(req.params.resource);
  const index = collection?.findIndex((entry) => String(entry[idKey]) === String(req.params.id));

  if (!collection || index < 0) {
    return res.status(404).json({ message: 'Không tìm thấy dữ liệu cần xóa.' });
  }

  const [deleted] = collection.splice(index, 1);
  persistDemoContent();

  return res.json({ item: deleted });
});

module.exports = router;
