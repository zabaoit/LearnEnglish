import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Headphones,
  Heart,
  Home,
  Layers,
  Play,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Volume2,
} from 'lucide-react'
import {
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
} from './data/learningData'
import AdminPanel from './AdminPanel'
import { apiRequest, authRequest, clearAuthToken, getAuthToken, setAuthToken, markWord, saveQuizAttempt } from './services/api'

const tabs = [
  { id: 'dashboard', label: 'Trang chủ', icon: Home },
  { id: 'vocabulary', label: 'Từ vựng', icon: Layers },
  { id: 'listening', label: 'Listening', icon: Headphones },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
  { id: 'roadmap', label: 'Lộ trình', icon: Brain },
  { id: 'saved', label: 'Từ đã lưu', icon: Star },
  { id: 'stats', label: 'Thống kê', icon: Trophy },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

const studyModes = ['Flashcard', 'Nghe đoán từ', 'Điền từ', 'Chọn nghĩa đúng', 'Ghép từ với nghĩa', 'Chính tả']
const flow = ['Chủ đề', 'Học từ vựng', 'Luyện nhanh', 'Listening', 'Reading', 'Quiz tổng hợp', 'Ôn tập']

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [search, setSearch] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [mode, setMode] = useState(studyModes[0])
  const [saved, setSaved] = useState(new Set(['travel-reservation']))
  const [difficult, setDifficult] = useState(new Set(['travel-itinerary', 'work-deadline']))
  const [quizAnswers, setQuizAnswers] = useState({})
  const [readingAnswers, setReadingAnswers] = useState({})
  const [listeningAnswers, setListeningAnswers] = useState({})
  const [speechRate, setSpeechRate] = useState(1)
  const [showTranscript, setShowTranscript] = useState(true)
  const [selectedWord, setSelectedWord] = useState(vocabulary[1])
  const [learningVocabulary, setLearningVocabulary] = useState(vocabulary)
  const [learningTopics, setLearningTopics] = useState(topics)
  const [learningLevels, setLearningLevels] = useState(levels)
  const [learningQuizzes, setLearningQuizzes] = useState(quizzes)
  const [authMode, setAuthMode] = useState('login')
  const [authMessage, setAuthMessage] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(() => {
    const oauthToken = new URLSearchParams(window.location.search).get('token')
    return Boolean(oauthToken || getAuthToken())
  })
  const [user, setUser] = useState(null)
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    goal: 'Giao tiếp',
    level: 'A2',
  })

  const fetchLearningData = useCallback(async () => {
    const [wordsData, topicsData, levelsData, quizzesData] = await Promise.all([
      apiRequest('/learning/vocabulary').catch(() => null),
      apiRequest('/learning/topics').catch(() => null),
      apiRequest('/learning/levels').catch(() => null),
      apiRequest('/learning/quizzes').catch(() => null),
    ])

    return { levelsData, quizzesData, topicsData, wordsData }
  }, [])

  useEffect(() => {
    let active = true

    fetchLearningData().then(({ levelsData, quizzesData, topicsData, wordsData }) => {
      if (!active) return
      if (Array.isArray(wordsData?.words)) setLearningVocabulary(wordsData.words)
      if (Array.isArray(topicsData?.topics) && topicsData.topics.length) setLearningTopics(topicsData.topics)
      if (Array.isArray(levelsData?.levels) && levelsData.levels.length) setLearningLevels(levelsData.levels)
      if (Array.isArray(quizzesData?.quizzes)) setLearningQuizzes(quizzesData.quizzes)
    })

    return () => {
      active = false
    }
  }, [activeTab, fetchLearningData])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthToken = params.get('token')
    const token = oauthToken || getAuthToken()

    if (oauthToken) {
      setAuthToken(oauthToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (!token) return

    let active = true
    apiRequest('/auth/me')
      .then((data) => {
        if (!active) return
        setUser(data.user)
        setActiveTab(data.user?.role === 'admin' ? 'admin' : 'dashboard')
      })
      .catch(() => {
        clearAuthToken()
      })
      .finally(() => {
        if (active) setCheckingAuth(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLearningContentUpdated(detail = {}) {
    const { levelsData, quizzesData, topicsData, wordsData } = await fetchLearningData()
    if (Array.isArray(wordsData?.words)) setLearningVocabulary(wordsData.words)
    if (Array.isArray(topicsData?.topics) && topicsData.topics.length) setLearningTopics(topicsData.topics)
    if (Array.isArray(levelsData?.levels) && levelsData.levels.length) setLearningLevels(levelsData.levels)
    if (Array.isArray(quizzesData?.quizzes)) setLearningQuizzes(quizzesData.quizzes)
    if (detail.topicSlug) setSelectedTopic(detail.topicSlug)
    if (detail.level) setSelectedLevel(detail.level)
    setWordIndex(0)
    setShowMeaning(false)
    setQuizAnswers({})
    if (detail.openVocabulary) setActiveTab('vocabulary')
  }

  const filteredWords = useMemo(() => {
    const term = search.trim().toLowerCase()
    const words = learningVocabulary.filter((word) => {
      const matchesTopic = selectedTopic === 'all' || word.topicSlug === selectedTopic
      const matchesLevel = selectedLevel === 'all' || word.level === selectedLevel
      const haystack = [word.term, word.meaningVi, word.meaningEn, word.partOfSpeech].join(' ').toLowerCase()
      return matchesTopic && matchesLevel && (!term || haystack.includes(term))
    })
    return words
  }, [learningVocabulary, search, selectedLevel, selectedTopic])

  const displayTopics = useMemo(() => buildDisplayTopics(learningTopics, learningVocabulary), [learningTopics, learningVocabulary])
  const topicBySlug = useMemo(() => new Map(displayTopics.map((topic) => [topic.slug, topic])), [displayTopics])
  const currentWord = filteredWords.length ? filteredWords[wordIndex % filteredWords.length] : null
  const headerTopicLabel = selectedTopic === 'all' ? 'tất cả chủ đề' : topicName(topicBySlug.get(selectedTopic), selectedTopic)
  const headerLevelLabel = selectedLevel === 'all' ? 'mọi trình độ' : selectedLevel
  const activeListening = listeningLessons.find((lesson) => lesson.topicSlug === selectedTopic) || listeningLessons[0]
  const activeReading = readingLessons.find((lesson) => lesson.topicSlug === selectedTopic) || readingLessons[0]
  const activeQuiz = useMemo(() => {
    const topicCandidates = selectedTopic === 'all' ? learningQuizzes : learningQuizzes.filter((quiz) => quiz.topicSlug === selectedTopic)
    const levelCandidates = selectedLevel === 'all' ? topicCandidates : topicCandidates.filter((quiz) => quiz.level === selectedLevel)
    const fallbackTitle = selectedTopic === 'all' ? 'Chưa có quiz phù hợp' : `Chưa có quiz cho ${topicName(topicBySlug.get(selectedTopic), selectedTopic)}`

    return levelCandidates[0] || topicCandidates[0] || {
      id: `quiz-empty-${selectedTopic}-${selectedLevel}`,
      title: 'No quiz available',
      titleVi: fallbackTitle,
      level: selectedLevel === 'all' ? 'Chưa chọn' : selectedLevel,
      topicSlug: selectedTopic,
      questionCount: 0,
      questions: [],
    }
  }, [learningQuizzes, selectedLevel, selectedTopic, topicBySlug])
  const savedWords = learningVocabulary.filter((word) => saved.has(word.id))
  const difficultWords = learningVocabulary.filter((word) => difficult.has(word.id))
  const quizScore = (activeQuiz.questions || []).reduce(
    (score, question, index) => score + (quizAnswers[index] === question.answer ? 1 : 0),
    0,
  )
  const visibleTabs = useMemo(() => tabs.filter((tab) => tab.id !== 'admin' || user?.role === 'admin'), [user?.role])
  const currentTab = activeTab === 'admin' && user?.role !== 'admin' ? 'dashboard' : activeTab

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = speechRate
    window.speechSynthesis.speak(utterance)
  }

  async function toggleWord(word, type) {
    const setter = type === 'saved' ? setSaved : setDifficult
    const action = type === 'saved' ? 'favorite' : 'difficult'
    setter((items) => {
      const next = new Set(items)
      if (next.has(word.id)) next.delete(word.id)
      else next.add(word.id)
      return next
    })
    try {
      await markWord(word.id, action)
    } catch {
      // Demo state remains available when the API is offline.
    }
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthMessage('')
    try {
      const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm
      const data = await authRequest(authMode, payload)
      setAuthToken(data.token)
      setUser(data.user)
      setActiveTab(data.user?.role === 'admin' ? 'admin' : 'dashboard')
      setAuthMessage(data.user?.role === 'admin' ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.')
    } catch (error) {
      clearAuthToken()
      setUser(null)
      setAuthMessage(error.message || 'Đăng nhập chưa thành công.')
    }
  }

  function logout() {
    clearAuthToken()
    setUser(null)
    setActiveTab('dashboard')
    setAuthMode('login')
    setAuthMessage('Bạn đã đăng xuất.')
  }

  function updateAuthForm(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }))
  }

  function selectTopic(slug) {
    setSelectedTopic(slug)
    setWordIndex(0)
    setShowMeaning(false)
    setQuizAnswers({})
  }

  function selectLevel(level) {
    setSelectedLevel(level)
    setWordIndex(0)
    setShowMeaning(false)
    setQuizAnswers({})
  }

  if (checkingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7FAF8] px-4 text-zinc-900">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-emerald-700">LearnEnglish</p>
          <h1 className="mt-2 text-2xl font-bold">Đang kiểm tra phiên đăng nhập</h1>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthScreen
        authForm={authForm}
        authMessage={authMessage}
        authMode={authMode}
        setAuthMode={setAuthMode}
        submitAuth={submitAuth}
        updateAuthForm={updateAuthForm}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">LearnEnglish</p>
              <h1 className="mt-1 text-3xl font-bold text-zinc-950 md:text-4xl">Hôm nay học {headerTopicLabel} · {headerLevelLabel}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-12 w-12 place-items-center rounded-lg bg-emerald-100 text-emerald-800 md:grid">
                <User size={22} />
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-zinc-600">{user.role} · {user.goal} · {user.level}</p>
              </div>
              <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-emerald-600 hover:text-emerald-700" onClick={logout} type="button">
                Đăng xuất
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon
              const active = currentTab === tab.id
              return (
                <button
                  className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    active ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-500 hover:text-emerald-700'
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        {currentTab === 'dashboard' && <Dashboard difficultWords={difficultWords} setActiveTab={setActiveTab} user={user} />}
        {currentTab === 'vocabulary' && (
          <Vocabulary
            currentWord={currentWord}
            difficult={difficult}
            filteredWords={filteredWords}
            levels={learningLevels}
            mode={mode}
            saved={saved}
            search={search}
            selectedLevel={selectedLevel}
            selectedTopic={selectedTopic}
            selectTopic={selectTopic}
            setMode={setMode}
            setSearch={setSearch}
            setSelectedLevel={selectLevel}
            setShowMeaning={setShowMeaning}
            setWordIndex={setWordIndex}
            showMeaning={showMeaning}
            speak={speak}
            topicBySlug={topicBySlug}
            topics={displayTopics}
            toggleWord={toggleWord}
            wordIndex={wordIndex}
          />
        )}
        {currentTab === 'listening' && <Listening activeListening={activeListening} answers={listeningAnswers} setAnswers={setListeningAnswers} showTranscript={showTranscript} speak={speak} speechRate={speechRate} setShowTranscript={setShowTranscript} setSpeechRate={setSpeechRate} />}
        {currentTab === 'reading' && <Reading activeReading={activeReading} answers={readingAnswers} selectedWord={selectedWord} setAnswers={setReadingAnswers} setSelectedWord={setSelectedWord} words={learningVocabulary} />}
        {currentTab === 'quiz' && <Quiz activeQuiz={activeQuiz} difficultWords={difficultWords} key={activeQuiz.id} quizAnswers={quizAnswers} quizScore={quizScore} setDifficult={setDifficult} setQuizAnswers={setQuizAnswers} words={learningVocabulary} />}
        {currentTab === 'roadmap' && <Roadmap />}
        {currentTab === 'saved' && <Saved savedWords={savedWords} difficultWords={difficultWords} speak={speak} />}
        {currentTab === 'stats' && <Stats difficultWords={difficultWords} />}
        {currentTab === 'admin' && <Admin authForm={authForm} authMessage={authMessage} authMode={authMode} onLearningContentUpdated={handleLearningContentUpdated} setAuthMode={setAuthMode} submitAuth={submitAuth} updateAuthForm={updateAuthForm} user={user} />}
      </main>
    </div>
  )
}

const cefrLevelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function sortLevelCodes(values) {
  return Array.from(new Set(Array.from(values || []).filter(Boolean))).sort((left, right) => {
    const leftIndex = cefrLevelOrder.indexOf(left)
    const rightIndex = cefrLevelOrder.indexOf(right)
    if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex
    if (leftIndex !== -1) return -1
    if (rightIndex !== -1) return 1
    return String(left).localeCompare(String(right))
  })
}

function buildDisplayTopics(sourceTopics, words) {
  const counts = new Map()
  const levelsByTopic = new Map()

  words.forEach((word) => {
    const slug = word.topicSlug || 'unassigned'
    counts.set(slug, (counts.get(slug) || 0) + 1)
    if (!levelsByTopic.has(slug)) levelsByTopic.set(slug, new Set())
    if (word.level) levelsByTopic.get(slug).add(word.level)
  })

  const mapped = sourceTopics.map((topic) => ({
    ...topic,
    wordCount: counts.get(topic.slug) ?? topic.wordCount ?? 0,
    availableLevels: sortLevelCodes(levelsByTopic.get(topic.slug) || (topic.level ? [topic.level] : [])),
  }))

  const knownSlugs = new Set(mapped.map((topic) => topic.slug))
  const missingTopics = Array.from(counts.keys())
    .filter((slug) => !knownSlugs.has(slug))
    .map((slug) => {
      const availableLevels = sortLevelCodes(levelsByTopic.get(slug) || [])

      return {
        slug,
        name: slug,
        nameVi: slug === 'unassigned' ? 'Chưa gắn chủ đề' : slug,
        level: availableLevels[0] || '',
        wordCount: counts.get(slug) || 0,
        imageUrl: '',
        nextStep: 'Học từ vừa import',
        availableLevels,
      }
    })

  return [...mapped, ...missingTopics]
}

function topicName(topic, fallback = 'Chưa gắn chủ đề') {
  return topic?.nameVi || topic?.name || topic?.slug || fallback
}

function topicLevels(topic) {
  const levels = topic?.availableLevels?.length ? topic.availableLevels : topic?.level ? [topic.level] : []
  return levels.length ? levels.join(', ') : 'Chưa gắn cấp độ'
}

function wordKind(word) {
  if (!word?.partOfSpeech || word.partOfSpeech === 'unknown') return 'Chưa có từ loại'
  return word.partOfSpeech
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  return value || ''
}

function AuthScreen({ authForm, authMessage, authMode, setAuthMode, submitAuth, updateAuthForm }) {
  return (
    <div className="min-h-screen bg-[#F7FAF8] px-4 py-8 text-zinc-900">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section>
          <p className="text-sm font-semibold text-emerald-700">LearnEnglish</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950 md:text-5xl">Đăng nhập để bắt đầu học</h1>
          <p className="mt-4 max-w-xl text-zinc-700">
            Tài khoản sẽ mở đúng không gian học của bạn. Admin vào thẳng trang quản trị, học viên vào trang học cá nhân.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="font-bold">Từ vựng</p>
              <p className="mt-1 text-sm text-zinc-600">Chủ đề, CEFR, flashcard</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="font-bold">Listening</p>
              <p className="mt-1 text-sm text-zinc-600">Transcript và luyện nghe</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="font-bold">Reading</p>
              <p className="mt-1 text-sm text-zinc-600">Bài đọc và câu hỏi</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">Authentication</p>
          <h2 className="mt-2 text-2xl font-bold">{authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản học viên'}</h2>
          <form className="mt-5 space-y-3" onSubmit={submitAuth}>
            <div className="flex gap-2">
              <button className={`rounded-md px-3 py-2 font-semibold ${authMode === 'login' ? 'bg-emerald-700 text-white' : 'border border-zinc-300'}`} type="button" onClick={() => setAuthMode('login')}>
                Đăng nhập
              </button>
              <button className={`rounded-md px-3 py-2 font-semibold ${authMode === 'register' ? 'bg-emerald-700 text-white' : 'border border-zinc-300'}`} type="button" onClick={() => setAuthMode('register')}>
                Đăng ký
              </button>
            </div>
            {authMode === 'register' && (
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={authForm.name} onChange={(event) => updateAuthForm('name', event.target.value)} placeholder="Họ tên" />
            )}
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={authForm.email} onChange={(event) => updateAuthForm('email', event.target.value)} placeholder="Email" type="email" />
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={authForm.password} onChange={(event) => updateAuthForm('password', event.target.value)} placeholder="Mật khẩu" type="password" />
            {authMode === 'register' && (
              <div className="grid gap-3 md:grid-cols-2">
                <select className="rounded-md border border-zinc-300 px-3 py-2" value={authForm.goal} onChange={(event) => updateAuthForm('goal', event.target.value)}>
                  {goals.map((goal) => <option key={goal}>{goal}</option>)}
                </select>
                <select className="rounded-md border border-zinc-300 px-3 py-2" value={authForm.level} onChange={(event) => updateAuthForm('level', event.target.value)}>
                  {levels.map((level) => <option key={level.code}>{level.code}</option>)}
                </select>
              </div>
            )}
            <button className="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">
              {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
            <a className="block rounded-md border border-zinc-300 px-4 py-2 text-center font-semibold" href="/api/auth/google">
              Đăng nhập bằng Google
            </a>
            {authMessage && <p className="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{authMessage}</p>}
          </form>
        </section>
      </main>
    </div>
  )
}

function Dashboard({ difficultWords, setActiveTab, user }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Từ đã học" value={dashboard.learnedWords} tone="emerald" />
        <Metric label="Cần ôn" value={dashboard.reviewWords} tone="rose" />
        <Metric label="Quiz gần đây" value={`${dashboard.recentQuizScore}%`} tone="amber" />
        <Metric label="Streak" value={`${dashboard.streakDays} ngày`} tone="cyan" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">Flow học hôm nay</p>
          <h2 className="mt-2 text-2xl font-bold">Travel A2 · 20 từ · Listening · Reading · Quiz</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {flow.map((step, index) => (
              <div className="rounded-md border border-zinc-200 bg-[#FBFDFC] p-3" key={step}>
                <p className="text-xs font-semibold text-zinc-500">Bước {index + 1}</p>
                <p className="mt-1 text-sm font-bold">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={() => setActiveTab('vocabulary')}>
              Bắt đầu học từ
            </button>
            <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-800" onClick={() => setActiveTab('quiz')}>
              Làm quiz nhanh
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-rose-700">Từ khó quay lại nhiều hơn</p>
          <div className="mt-4 space-y-3">
            {difficultWords.map((word) => (
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3" key={word.id}>
                <div>
                  <p className="font-bold">{word.term}</p>
                  <p className="text-sm text-zinc-600">{word.meaningVi}</p>
                </div>
                <span className="rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">{word.level}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SkillProgress />
        <ProfileSummary user={user} />
      </section>
    </>
  )
}

function Vocabulary(props) {
  const {
    currentWord,
    difficult,
    filteredWords,
    levels,
    mode,
    saved,
    search,
    selectedLevel,
    selectedTopic,
    selectTopic,
    setMode,
    setSearch,
    setSelectedLevel,
    setShowMeaning,
    setWordIndex,
    showMeaning,
    speak,
    topicBySlug,
    topics,
    toggleWord,
    wordIndex,
  } = props
  const selectedTopicLabel = selectedTopic === 'all' ? 'Tất cả chủ đề' : topicName(topicBySlug.get(selectedTopic), selectedTopic)
  const selectedLevelLabel = selectedLevel === 'all' ? 'tất cả trình độ' : selectedLevel
  const topicOptions = useMemo(
    () => [
      {
        slug: 'all',
        name: 'All topics',
        nameVi: 'Tất cả chủ đề',
        wordCount: topics.length,
        isAll: true,
      },
      ...topics,
    ],
    [topics],
  )
  const selectedTopicIndex = Math.max(0, topicOptions.findIndex((topic) => topic.slug === selectedTopic))

  function moveTopic(offset) {
    const nextIndex = (selectedTopicIndex + offset + topicOptions.length) % topicOptions.length
    selectTopic(topicOptions[nextIndex].slug)
  }

  return (
    <>
      <FilterBar levels={levels} search={search} selectedLevel={selectedLevel} setSearch={setSearch} setSelectedLevel={setSelectedLevel} />
      <TopicCarousel
        moveTopic={moveTopic}
        selectedTopic={selectedTopic}
        selectTopic={selectTopic}
        topicOptions={topicOptions}
      />

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100vh-2rem)] lg:flex-col lg:overflow-hidden">
          <div className="flex flex-wrap gap-2">
            {studyModes.map((item) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${mode === item ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 text-zinc-700'}`}
                key={item}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            {filteredWords.length === 0 && (
              <div className="rounded-md border border-dashed border-zinc-300 bg-[#FBFDFC] p-4 text-sm text-zinc-600">
                Chưa có từ vựng cho {selectedTopicLabel} · {selectedLevelLabel}. Hãy đổi bộ lọc hoặc import đúng chủ đề/trình độ này.
              </div>
            )}
            {filteredWords.map((word, index) => (
              <button
                className={`flex w-full items-center justify-between rounded-md border p-3 text-left ${currentWord?.id === word.id ? 'border-emerald-700 bg-emerald-50' : 'border-zinc-200 bg-white'}`}
                key={word.id}
                onClick={() => {
                  setWordIndex(index)
                  setShowMeaning(false)
                }}
              >
                <span>
                  <span className="block font-bold">{word.term}</span>
                  <span className="text-sm text-zinc-600">{word.level || 'Chưa gắn cấp độ'} · {topicName(topicBySlug.get(word.topicSlug), word.topicSlug)} · {wordKind(word)}</span>
                </span>
                <span className="text-sm text-zinc-500">{index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <VocabularyDetail
          currentWord={currentWord}
          difficult={difficult}
          mode={mode}
          saved={saved}
          selectedLevelLabel={selectedLevelLabel}
          selectedTopicLabel={selectedTopicLabel}
          setShowMeaning={setShowMeaning}
          setWordIndex={setWordIndex}
          showMeaning={showMeaning}
          speak={speak}
          topicBySlug={topicBySlug}
          toggleWord={toggleWord}
          wordIndex={wordIndex}
        />
      </section>
    </>
  )
}

function TopicCarousel({ moveTopic, selectedTopic, selectTopic, topicOptions }) {
  const topicRefs = useRef(new Map())

  useEffect(() => {
    topicRefs.current.get(selectedTopic)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [selectedTopic])

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-stretch gap-3">
        <button
          className="grid w-12 shrink-0 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:border-emerald-600 hover:text-emerald-700"
          onClick={() => moveTopic(-1)}
          type="button"
        >
          <span className="sr-only">Chủ đề trước</span>
          <ChevronLeft size={22} />
        </button>

        <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1">
          {topicOptions.map((topic) => {
            const active = selectedTopic === topic.slug
            const subtitle = topic.isAll ? `${topic.wordCount} chủ đề` : `${topicLevels(topic)} · ${topic.wordCount} từ`

            return (
              <button
                className={`min-h-44 w-60 shrink-0 overflow-hidden rounded-lg border bg-white text-left transition ${
                  active ? 'border-emerald-700 ring-2 ring-emerald-200' : 'border-zinc-200 hover:border-emerald-500'
                }`}
                key={topic.slug}
                onClick={() => selectTopic(topic.slug)}
                ref={(element) => {
                  if (element) topicRefs.current.set(topic.slug, element)
                  else topicRefs.current.delete(topic.slug)
                }}
                type="button"
              >
                {topic.imageUrl ? (
                  <img alt={topicName(topic)} className="h-24 w-full object-cover" src={topic.imageUrl} />
                ) : (
                  <div className="grid h-24 place-items-center bg-[#EEF7F0] px-3 text-center text-sm font-semibold text-emerald-900">{topicName(topic)}</div>
                )}
                <div className="p-3">
                  <p className="font-bold">{topicName(topic)}</p>
                  <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>

        <button
          className="grid w-12 shrink-0 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:border-emerald-600 hover:text-emerald-700"
          onClick={() => moveTopic(1)}
          type="button"
        >
          <span className="sr-only">Chủ đề sau</span>
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  )
}

function VocabularyDetail({
  currentWord,
  difficult,
  mode,
  saved,
  selectedLevelLabel,
  selectedTopicLabel,
  setShowMeaning,
  setWordIndex,
  showMeaning,
  speak,
  topicBySlug,
  toggleWord,
  wordIndex,
}) {
  if (!currentWord) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-5 lg:sticky lg:top-4">
        <p className="text-sm font-semibold text-emerald-700">Flashcard</p>
        <h2 className="mt-2 text-2xl font-bold">Chưa có từ phù hợp</h2>
        <p className="mt-3 text-zinc-700">
          Bộ lọc hiện tại là {selectedTopicLabel} · {selectedLevelLabel}. Khi import, hãy chọn đúng chủ đề và CEFR rồi quay lại bộ lọc này để học.
        </p>
      </div>
    )
  }

  const topic = topicBySlug.get(currentWord.topicSlug)
  const detailImage = currentWord.imageUrl || topic?.imageUrl
  const phonetic = currentWord.phonetic || 'Chưa có phiên âm'
  const example = currentWord.example || 'Chưa có ví dụ. Admin có thể bổ sung sau khi import.'
  const collocations = listValue(currentWord.collocations) || 'Đang cập nhật'
  const synonyms = listValue(currentWord.synonyms) || 'Đang cập nhật'

  return (
    <div className="rounded-lg border border-zinc-200 bg-white lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      {detailImage ? (
        <img alt={currentWord.term} className="h-56 w-full rounded-t-lg object-cover" src={detailImage} />
      ) : (
        <div className="grid h-56 place-items-center rounded-t-lg bg-[#EEF7F0] px-5 text-center text-lg font-bold text-emerald-900">
          {topicName(topic, currentWord.topicSlug)}
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">{mode}</p>
            <h2 className="mt-2 break-words text-3xl font-bold">{showMeaning ? currentWord.meaningVi : currentWord.term}</h2>
            <p className="mt-2 text-zinc-600">{phonetic} · {wordKind(currentWord)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900">{topicName(topic, currentWord.topicSlug)}</span>
              <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-900">{currentWord.level || 'Chưa gắn cấp độ'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton active={saved.has(currentWord.id)} label="Lưu" onClick={() => toggleWord(currentWord, 'saved')}>
              <Heart size={18} />
            </IconButton>
            <IconButton active={difficult.has(currentWord.id)} label="Khó" onClick={() => toggleWord(currentWord, 'difficult')}>
              <Star size={18} />
            </IconButton>
            <IconButton label="Nghe" onClick={() => speak(currentWord.audioText || currentWord.term)}>
              <Volume2 size={18} />
            </IconButton>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-zinc-200 bg-[#FBFDFC] p-4">
          <p className="font-semibold">Ví dụ</p>
          <p className="mt-2 text-zinc-700">{example}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info label="English" value={currentWord.meaningEn || 'Đang cập nhật'} />
          <Info label="Collocations" value={collocations} />
          <Info label="Synonyms" value={synonyms} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={() => setShowMeaning(!showMeaning)}>
            {showMeaning ? 'Ẩn nghĩa' : 'Lật thẻ'}
          </button>
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={() => setWordIndex(wordIndex + 1)}>
            Từ tiếp theo
          </button>
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={() => speak(example)}>
            Nghe câu ví dụ
          </button>
        </div>
      </div>
    </div>
  )
}

function Listening({ activeListening, answers, setAnswers, showTranscript, speak, speechRate, setShowTranscript, setSpeechRate }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">{activeListening.level} · {activeListening.duration}</p>
        <h2 className="mt-2 text-3xl font-bold">{activeListening.titleVi}</h2>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={() => speak(activeListening.audioText)}>
            <Play size={18} /> Phát audio
          </button>
          <select className="rounded-md border border-zinc-300 bg-white px-3 py-2" value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))}>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
          </select>
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={() => setShowTranscript(!showTranscript)}>
            {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
          </button>
        </div>
        {showTranscript && (
          <div className="mt-5 space-y-3">
            {activeListening.transcript.map((line, index) => (
              <button className="block w-full rounded-md border border-zinc-200 bg-[#FBFDFC] p-3 text-left hover:border-emerald-500" key={line} onClick={() => speak(line)}>
                <span className="text-sm font-semibold text-zinc-500">Câu {index + 1}</span>
                <span className="mt-1 block text-zinc-800">{line}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <PracticeBlock answers={answers} questions={activeListening.questions} setAnswers={setAnswers} title="Bài tập listening" />
    </section>
  )
}

function Reading({ activeReading, answers, selectedWord, setAnswers, setSelectedWord, words }) {
  const highlightedWords = words.filter((word) => activeReading.highlightedWordIds.includes(word.id))

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">{activeReading.level} · {activeReading.estimatedMinutes} phút</p>
        <h2 className="mt-2 text-3xl font-bold">{activeReading.titleVi}</h2>
        <div className="mt-5 rounded-md border border-zinc-200 bg-[#FBFDFC] p-4 text-lg leading-8">
          {activeReading.content.split(/(\b[\w'-]+\b)/g).map((token, index) => {
            const match = highlightedWords.find((word) => word.term.toLowerCase() === token.toLowerCase())
            if (!match) return <span key={`${token}-${index}`}>{token}</span>
            return (
              <button className="rounded-md bg-amber-100 px-1 font-semibold text-amber-900" key={`${token}-${index}`} onClick={() => setSelectedWord(match)}>
                {token}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-amber-700">Từ trong bài đọc</p>
          <h3 className="mt-2 text-2xl font-bold">{selectedWord.term}</h3>
          <p className="mt-2 text-zinc-700">{selectedWord.meaningVi}</p>
          <p className="mt-3 text-sm text-zinc-600">{selectedWord.example}</p>
        </div>
        <PracticeBlock answers={answers} questions={activeReading.questions} setAnswers={setAnswers} title="Câu hỏi reading" />
      </div>
    </section>
  )
}

function Quiz({ activeQuiz, difficultWords, quizAnswers, quizScore, setDifficult, setQuizAnswers, words }) {
  const [attemptMessage, setAttemptMessage] = useState('')
  const [reviewMistakesOnly, setReviewMistakesOnly] = useState(false)
  const [savingAttempt, setSavingAttempt] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const quizQuestions = useMemo(() => (Array.isArray(activeQuiz.questions) ? activeQuiz.questions : []), [activeQuiz.questions])
  const totalQuestions = quizQuestions.length
  const answeredCount = quizQuestions.reduce((count, _question, index) => count + (quizAnswers[index] ? 1 : 0), 0)
  const completed = totalQuestions > 0 && answeredCount === totalQuestions
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0)
  const accuracy = totalQuestions ? Math.round((quizScore / totalQuestions) * 100) : 0
  const questionSummaries = useMemo(
    () =>
      quizQuestions.map((question, index) => ({
        index,
        isCorrect: quizAnswers[index] === question.answer,
        linkedWord: findQuestionWord(question, words),
        question,
        selectedAnswer: quizAnswers[index],
      })),
    [quizAnswers, quizQuestions, words],
  )
  const mistakeRows = submitted ? questionSummaries.filter((row) => !row.isCorrect) : []
  const mistakeReviewItems = buildMistakeReviewItems(mistakeRows)

  function answerQuestion(index, option) {
    setQuizAnswers((current) => ({ ...current, [index]: option }))
    if (submitted) {
      setAttemptMessage('Bạn vừa sửa đáp án. Nộp lại để chấm điểm mới.')
      setReviewMistakesOnly(false)
      setSubmitted(false)
    }
  }

  async function submitQuiz() {
    if (!totalQuestions) {
      setAttemptMessage('Quiz này chưa có câu hỏi để làm.')
      return
    }

    if (!completed) {
      setAttemptMessage(`Còn ${remainingQuestions} câu chưa trả lời.`)
      return
    }

    const wrongWordIds = questionSummaries
      .filter((row) => !row.isCorrect && row.linkedWord)
      .map((row) => row.linkedWord.id)
    const uniqueWrongWordIds = Array.from(new Set(wrongWordIds))
    const wrongItems = mistakeReviewItems.map((item) => ({
      prompt: item.prompt,
      reviewTarget: item.label,
      reviewType: item.type,
      selectedAnswer: item.selectedAnswer,
      correctAnswer: item.correctAnswer,
      wordId: item.wordId,
    }))

    setSubmitted(true)
    setReviewMistakesOnly(false)
    if (uniqueWrongWordIds.length) {
      setDifficult((items) => {
        const next = new Set(items)
        uniqueWrongWordIds.forEach((wordId) => next.add(wordId))
        return next
      })
    }

    setSavingAttempt(true)
    try {
      await saveQuizAttempt({
        quizId: activeQuiz.id,
        score: accuracy,
        correctCount: quizScore,
        totalQuestions,
        wrongWordIds: uniqueWrongWordIds,
        wrongItems,
        answers: quizAnswers,
      })
      setAttemptMessage(uniqueWrongWordIds.length ? 'Đã lưu kết quả và đưa từ sai vào ôn tập.' : 'Đã lưu kết quả. Bài này sạch lỗi.')
    } catch {
      setAttemptMessage('Đã chấm bài trên máy. API chưa lưu được lịch sử quiz lúc này.')
    } finally {
      setSavingAttempt(false)
    }
  }

  function resetQuiz() {
    setQuizAnswers({})
    setAttemptMessage('')
    setReviewMistakesOnly(false)
    setSubmitted(false)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-700">Quiz tổng hợp</p>
            <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800">{activeQuiz.level}</span>
          </div>
          <h2 className="mt-2 text-3xl font-bold">{activeQuiz.titleVi}</h2>
          <p className="mt-3 text-zinc-700">Làm đủ câu, nộp bài, xem giải thích rồi đưa lỗi sai vào lịch ôn.</p>
          <div className="mt-5">
            <div className="flex justify-between text-sm font-semibold text-zinc-700">
              <span>{answeredCount}/{totalQuestions} câu đã trả lời</span>
              <span>{submitted ? `${accuracy}% đúng` : `${remainingQuestions} câu còn lại`}</span>
            </div>
            <div className="mt-2 h-3 rounded-md bg-zinc-100">
              <div className="h-3 rounded-md bg-emerald-600" style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <PracticeBlock
          answers={quizAnswers}
          emptyMessage={reviewMistakesOnly ? 'Không còn câu sai để review.' : 'Quiz này chưa có câu hỏi.'}
          onAnswer={answerQuestion}
          questions={quizQuestions}
          reviewOnlyIncorrect={reviewMistakesOnly}
          setAnswers={setQuizAnswers}
          showCorrectAnswer={submitted}
          showExplanations={submitted}
          showFeedback={submitted}
          title={reviewMistakesOnly ? 'Review câu sai' : 'Câu hỏi quiz'}
        />
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-amber-700">{submitted ? 'Kết quả' : 'Tiến độ làm bài'}</p>
          <h2 className="mt-2 text-3xl font-bold">{submitted ? `${quizScore}/${totalQuestions}` : `${answeredCount}/${totalQuestions}`}</h2>
          <p className="mt-3 text-zinc-700">
            {submitted ? `${accuracy}% chính xác · ${mistakeRows.length} câu cần xem lại` : 'Bạn có thể đổi đáp án trước khi nộp.'}
          </p>
          <div className="mt-5 grid gap-2">
            <button
              className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={!completed || savingAttempt}
              onClick={submitQuiz}
            >
              {savingAttempt ? 'Đang lưu...' : submitted ? 'Nộp lại' : 'Nộp bài'}
            </button>
            <button
              className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-400"
              disabled={!submitted || mistakeRows.length === 0}
              onClick={() => setReviewMistakesOnly((current) => !current)}
            >
              {reviewMistakesOnly ? 'Xem tất cả câu' : `Review ${mistakeRows.length} câu sai`}
            </button>
            <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-800" onClick={resetQuiz}>
              Làm lại
            </button>
          </div>
          {attemptMessage && <p className="mt-4 rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{attemptMessage}</p>}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-rose-700">{submitted ? 'Từ cần ôn sau quiz' : 'Từ khó đang theo dõi'}</p>
          <div className="mt-5 space-y-3">
            {(submitted ? mistakeReviewItems : difficultWords.slice(0, 3).map((word) => ({
              key: word.id,
              label: word.term,
              note: word.meaningVi,
            }))).map((item) => (
              <div className="border-b border-zinc-100 pb-3" key={item.key}>
                <p className="font-bold">{item.label}</p>
                <p className="text-sm text-zinc-600">{item.note}</p>
              </div>
            ))}
            {submitted && mistakeReviewItems.length === 0 && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Không có từ mới cần đưa vào ôn tập.</p>
            )}
            {!submitted && difficultWords.length === 0 && (
              <p className="rounded-md bg-[#FBFDFC] px-3 py-2 text-sm text-zinc-600">Chưa có từ khó nào trong lịch ôn.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildMistakeReviewItems(rows) {
  return rows.map((row) => {
    const label = row.question.reviewTarget || row.linkedWord?.term || row.question.answer || 'Mục cần ôn'
    const type = row.question.reviewType || row.question.skill || 'Review'
    const noteParts = [
      type,
      row.linkedWord ? `${row.linkedWord.term}: ${row.linkedWord.meaningVi}` : '',
      row.selectedAnswer ? `Bạn chọn: ${row.selectedAnswer}` : '',
    ].filter(Boolean)

    return {
      correctAnswer: row.question.answer,
      key: `${row.index}-${label}`,
      label,
      note: noteParts.join(' · '),
      prompt: row.question.prompt,
      selectedAnswer: row.selectedAnswer,
      type,
      wordId: row.linkedWord?.id || '',
    }
  })
}

function findQuestionWord(question, words) {
  if (question.relatedWordId) {
    const linked = words.find((word) => word.id === question.relatedWordId)
    if (linked) return linked
  }

  const answer = String(question.answer || '').toLowerCase()
  const prompt = String(question.prompt || '').toLowerCase()
  return words.find((word) => {
    const meaning = String(word.meaningVi || '').toLowerCase()
    const term = String(word.term || '').toLowerCase()
    return (term && (prompt.includes(term) || answer === term)) || (meaning && answer === meaning)
  })
}

function Roadmap() {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      {roadmap.map((item) => (
        <div className={`rounded-lg border p-5 ${item.unlocked ? 'border-emerald-300 bg-white' : 'border-zinc-200 bg-zinc-100'}`} key={item.level}>
          <p className="text-sm font-semibold text-zinc-600">CEFR</p>
          <h2 className="mt-2 text-3xl font-bold">{item.level}</h2>
          <p className="mt-3 text-sm text-zinc-700">{item.target}</p>
          <div className="mt-4 space-y-2">
            {item.lessons.map((lesson) => (
              <p className="rounded-md bg-[#FBFDFC] px-3 py-2 text-sm" key={lesson}>{lesson}</p>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function Saved({ savedWords, difficultWords, speak }) {
  const words = [...savedWords, ...difficultWords.filter((word) => !savedWords.some((savedWord) => savedWord.id === word.id))]

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {words.map((word) => (
        <div className="rounded-lg border border-zinc-200 bg-white p-4" key={word.id}>
          <img alt={word.term} className="mb-4 h-36 w-full rounded-md object-cover" src={word.imageUrl} />
          <p className="text-sm font-semibold text-emerald-700">{word.level} · {word.partOfSpeech}</p>
          <h2 className="mt-1 text-2xl font-bold">{word.term}</h2>
          <p className="mt-2 text-zinc-700">{word.meaningVi}</p>
          <button className="mt-4 rounded-md border border-zinc-300 px-3 py-2 font-semibold" onClick={() => speak(word.audioText)}>
            Nghe phát âm
          </button>
        </div>
      ))}
    </section>
  )
}

function Stats({ difficultWords }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <SkillProgress />
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-rose-700">Lịch ôn thông minh</p>
        <h2 className="mt-2 text-2xl font-bold">{difficultWords.length} từ cần quay lại</h2>
        <div className="mt-5 space-y-3">
          {difficultWords.map((word, index) => (
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3" key={word.id}>
              <span>
                <span className="block font-bold">{word.term}</span>
                <span className="text-sm text-zinc-600">Ôn lần {index + 1} · spaced repetition</span>
              </span>
              <span className="rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">Hôm nay</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Admin({ authForm, authMessage, authMode, onLearningContentUpdated, setAuthMode, submitAuth, updateAuthForm, user }) {
  if (user) {
    return (
      <AdminPanel
        authForm={authForm}
        authMessage={authMessage}
        authMode={authMode}
        onLearningContentUpdated={onLearningContentUpdated}
        setAuthMode={setAuthMode}
        submitAuth={submitAuth}
        updateAuthForm={updateAuthForm}
        user={user}
      />
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Authentication</p>
        <h2 className="mt-2 text-2xl font-bold">Tài khoản học viên</h2>
        <form className="mt-5 space-y-3" onSubmit={submitAuth}>
          <div className="flex gap-2">
            <button className={`rounded-md px-3 py-2 font-semibold ${authMode === 'register' ? 'bg-emerald-700 text-white' : 'border border-zinc-300'}`} type="button" onClick={() => setAuthMode('register')}>
              Đăng ký
            </button>
            <button className={`rounded-md px-3 py-2 font-semibold ${authMode === 'login' ? 'bg-emerald-700 text-white' : 'border border-zinc-300'}`} type="button" onClick={() => setAuthMode('login')}>
              Đăng nhập
            </button>
          </div>
          {authMode === 'register' && (
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={authForm.name} onChange={(event) => updateAuthForm('name', event.target.value)} placeholder="Họ tên" />
          )}
          <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={authForm.email} onChange={(event) => updateAuthForm('email', event.target.value)} placeholder="Email" />
          <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={authForm.password} onChange={(event) => updateAuthForm('password', event.target.value)} placeholder="Mật khẩu" type="password" />
          {authMode === 'register' && (
            <div className="grid gap-3 md:grid-cols-2">
              <select className="rounded-md border border-zinc-300 px-3 py-2" value={authForm.goal} onChange={(event) => updateAuthForm('goal', event.target.value)}>
                {goals.map((goal) => <option key={goal}>{goal}</option>)}
              </select>
              <select className="rounded-md border border-zinc-300 px-3 py-2" value={authForm.level} onChange={(event) => updateAuthForm('level', event.target.value)}>
                {levels.map((level) => <option key={level.code}>{level.code}</option>)}
              </select>
            </div>
          )}
          <button className="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">Tiếp tục</button>
          <a className="block rounded-md border border-zinc-300 px-4 py-2 text-center font-semibold" href="/api/auth/google">
            Đăng nhập bằng Google
          </a>
          <a className="block rounded-md border border-zinc-300 px-4 py-2 text-center font-semibold" href="/api/auth/facebook">
            Đăng nhập bằng Facebook
          </a>
          <button className="w-full rounded-md border border-zinc-300 px-4 py-2 font-semibold" type="button">
            Quên mật khẩu
          </button>
          {authMessage && <p className="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{authMessage}</p>}
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Quản trị nội dung</p>
        <h2 className="mt-2 text-2xl font-bold">CMS học liệu</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {adminModules.map((module) => (
            <div className="rounded-md border border-zinc-200 bg-[#FBFDFC] p-3 font-semibold" key={module}>
              {module}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FilterBar({ levels, search, selectedLevel, setSearch, setSelectedLevel }) {
  return (
    <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-[1fr_auto]">
      <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2">
        <Search size={18} />
        <input className="w-full bg-transparent outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm từ vựng, nghĩa, từ loại" />
      </label>
      <select className="rounded-md border border-zinc-300 bg-white px-3 py-2" value={selectedLevel} onChange={(event) => setSelectedLevel(event.target.value)}>
        <option value="all">Tất cả trình độ</option>
        {levels.map((level) => <option key={level.code} value={level.code}>{level.code} · {level.name}</option>)}
      </select>
    </section>
  )
}

function PracticeBlock({
  answers,
  emptyMessage = 'Chưa có câu hỏi.',
  onAnswer,
  questions = [],
  reviewOnlyIncorrect = false,
  setAnswers,
  showCorrectAnswer = false,
  showExplanations = false,
  showFeedback = true,
  title,
}) {
  const visibleQuestions = questions
    .map((question, index) => ({ index, question }))
    .filter(({ index, question }) => !reviewOnlyIncorrect || answers[index] !== question.answer)

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-emerald-700">Practice</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <div className="mt-5 space-y-5">
        {visibleQuestions.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-300 bg-[#FBFDFC] px-3 py-2 text-sm text-zinc-600">{emptyMessage}</p>
        )}
        {visibleQuestions.map(({ index, question }) => (
          <div className="border-b border-zinc-100 pb-5" key={`${question.prompt}-${index}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-bold">{index + 1}. {question.prompt}</p>
              {question.skill && <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">{question.skill}</span>}
            </div>
            <div className="mt-3 grid gap-2">
              {(question.options || []).map((option) => {
                const selected = answers[index] === option
                const selectedAnswer = Boolean(answers[index])
                const correct = showFeedback && selectedAnswer && (showCorrectAnswer ? option === question.answer : selected && option === question.answer)
                const wrong = showFeedback && selected && option !== question.answer
                return (
                  <button
                    className={`rounded-md border px-3 py-2 text-left font-semibold ${
                      correct ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : wrong ? 'border-rose-500 bg-rose-50 text-rose-800' : selected ? 'border-amber-500 bg-amber-50' : 'border-zinc-200'
                    }`}
                    key={option}
                    onClick={() => {
                      if (onAnswer) {
                        onAnswer(index, option)
                        return
                      }
                      setAnswers((current) => ({ ...current, [index]: option }))
                    }}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {showExplanations && answers[index] && (
              <p className="mt-3 rounded-md bg-[#FBFDFC] px-3 py-2 text-sm text-zinc-700">
                <span className="font-semibold">{answers[index] === question.answer ? 'Đúng.' : `Đáp án đúng: ${question.answer}.`}</span>
                {question.explanation ? ` ${question.explanation}` : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillProgress() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-emerald-700">Tiến độ kỹ năng</p>
      <div className="mt-5 space-y-4">
        {Object.entries(dashboard.skillProgress).map(([skill, value]) => (
          <div key={skill}>
            <div className="flex justify-between text-sm font-semibold">
              <span>{skill}</span>
              <span>{value}%</span>
            </div>
            <div className="mt-2 h-3 rounded-md bg-zinc-100">
              <div className="h-3 rounded-md bg-emerald-600" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileSummary({ user }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-cyan-700">Hồ sơ học viên</p>
      <h2 className="mt-2 text-2xl font-bold">{user.name}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Mục tiêu" value={user.goal} />
        <Info label="Trình độ gợi ý" value={user.level} />
        <Info label="XP" value={dashboard.xp.toLocaleString('vi-VN')} />
        <Info label="Thời gian học" value={`${dashboard.studyMinutes} phút`} />
      </div>
    </div>
  )
}

function Metric({ label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  }

  return (
    <div className={`rounded-lg border p-5 ${tones[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-zinc-800">{value}</p>
    </div>
  )
}

function IconButton({ active, children, label, onClick }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${active ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-zinc-300 text-zinc-700'}`}
      onClick={onClick}
    >
      {children}
      {label}
    </button>
  )
}

export default App
