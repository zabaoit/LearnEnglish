CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  avatar_url TEXT,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(40) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_user (provider, provider_user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  goal ENUM('Giao tiếp', 'Thi cử', 'Đi làm', 'Du học') NOT NULL DEFAULT 'Giao tiếp',
  current_level VARCHAR(8) NOT NULL DEFAULT 'A1',
  daily_word_target INT NOT NULL DEFAULT 10,
  weekly_listening_target INT NOT NULL DEFAULT 3,
  weekly_reading_target INT NOT NULL DEFAULT 3,
  streak_days INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cefr_levels (
  code VARCHAR(8) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  name_vi VARCHAR(120) NOT NULL,
  default_level VARCHAR(8) NOT NULL,
  image_url TEXT,
  CONSTRAINT fk_topic_level FOREIGN KEY (default_level) REFERENCES cefr_levels(code)
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  level_code VARCHAR(8) NOT NULL,
  term VARCHAR(160) NOT NULL,
  phonetic VARCHAR(160),
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  part_of_speech VARCHAR(40),
  audio_url TEXT,
  image_url TEXT,
  example_sentence TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vocab_term (term),
  INDEX idx_vocab_level_topic (level_code, topic_id),
  CONSTRAINT fk_vocab_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_vocab_level FOREIGN KEY (level_code) REFERENCES cefr_levels(code)
);

CREATE TABLE IF NOT EXISTS word_relations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word_id BIGINT UNSIGNED NOT NULL,
  related_term VARCHAR(160) NOT NULL,
  relation_type ENUM('synonym', 'antonym', 'collocation') NOT NULL,
  CONSTRAINT fk_relation_word FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listening_lessons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  level_code VARCHAR(8) NOT NULL,
  title VARCHAR(180) NOT NULL,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  duration_seconds INT,
  CONSTRAINT fk_listening_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_listening_level FOREIGN KEY (level_code) REFERENCES cefr_levels(code)
);

CREATE TABLE IF NOT EXISTS reading_lessons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  level_code VARCHAR(8) NOT NULL,
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  estimated_minutes INT NOT NULL DEFAULT 5,
  CONSTRAINT fk_reading_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_level FOREIGN KEY (level_code) REFERENCES cefr_levels(code)
);

CREATE TABLE IF NOT EXISTS learning_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  level_code VARCHAR(8) NULL,
  topic_id BIGINT UNSIGNED NULL,
  file_url TEXT NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'external',
  resource_type VARCHAR(40) NOT NULL DEFAULT 'raw',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_level FOREIGN KEY (level_code) REFERENCES cefr_levels(code),
  CONSTRAINT fk_document_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category ENUM('vocabulary_image', 'avatar', 'listening_audio', 'learning_document') NOT NULL,
  provider ENUM('cloudinary', 'external') NOT NULL DEFAULT 'cloudinary',
  resource_type VARCHAR(40) NOT NULL,
  public_id VARCHAR(255),
  url TEXT NOT NULL,
  owner_type VARCHAR(80),
  owner_id VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_asset_owner (owner_type, owner_id),
  INDEX idx_asset_category (category)
);

CREATE TABLE IF NOT EXISTS vocabulary_import_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  source_type ENUM('textarea', 'file') NOT NULL DEFAULT 'textarea',
  file_name VARCHAR(255),
  topic_id BIGINT UNSIGNED NULL,
  level_code VARCHAR(8) NULL,
  duplicate_strategy ENUM('skip', 'update', 'overwrite') NOT NULL DEFAULT 'skip',
  total_lines INT NOT NULL DEFAULT 0,
  valid_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  created_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  auto_quiz_id BIGINT UNSIGNED NULL,
  auto_quiz_question_count INT NOT NULL DEFAULT 0,
  error_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_import_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_import_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_import_level FOREIGN KEY (level_code) REFERENCES cefr_levels(code),
  CONSTRAINT fk_import_quiz FOREIGN KEY (auto_quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NULL,
  level_code VARCHAR(8) NOT NULL,
  title VARCHAR(180) NOT NULL,
  quiz_type ENUM('vocabulary', 'listening', 'reading', 'mixed') NOT NULL DEFAULT 'mixed',
  CONSTRAINT fk_quiz_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_quiz_level FOREIGN KEY (level_code) REFERENCES cefr_levels(code)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  prompt TEXT NOT NULL,
  question_type ENUM('single-choice', 'fill-blank', 'true-false', 'matching') NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_options (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_word_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  word_id BIGINT UNSIGNED NOT NULL,
  status ENUM('new', 'learning', 'remembered', 'difficult') NOT NULL DEFAULT 'new',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  review_due_at DATETIME NULL,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  repetition_count INT NOT NULL DEFAULT 0,
  last_reviewed_at DATETIME NULL,
  PRIMARY KEY (user_id, word_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_word FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  quiz_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  wrong_items_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

INSERT IGNORE INTO cefr_levels (code, name, sort_order, description) VALUES
  ('A1', 'Beginner', 1, 'Từ cơ bản và câu ngắn hằng ngày'),
  ('A2', 'Elementary', 2, 'Chủ đề quen thuộc và hội thoại đơn giản'),
  ('B1', 'Intermediate', 3, 'Hiểu ý chính và trao đổi công việc/học tập'),
  ('B2', 'Upper Intermediate', 4, 'Nội dung dài hơn, quan điểm và phân tích');
