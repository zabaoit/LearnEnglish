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
  dailyPlans,
  goals,
  levels,
  listeningLessons,
  placementQuestions,
  quizzes,
  readingLessons,
  roadmap,
  topics,
  vocabulary,
} from './data/learningData'
import AdminPanel from './AdminPanel'
import { apiRequest, authRequest, clearAuthToken, getAuthToken, setAuthToken, markWord, savePracticeAttempt, saveQuizAttempt } from './services/api'

const tabs = [
  { id: 'dashboard', label: 'Trang chủ', icon: Home },
  { id: 'placement', label: 'Xếp trình độ', icon: Brain },
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
const initialSavedIds = []
const initialDifficultIds = []

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [search, setSearch] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [mode, setMode] = useState(studyModes[0])
  const [saved, setSaved] = useState(new Set(initialSavedIds))
  const [difficult, setDifficult] = useState(new Set(initialDifficultIds))
  const [recentWordIds, setRecentWordIds] = useState(initialSavedIds)
  const [userProgress, setUserProgress] = useState({
    favorites: initialSavedIds,
    difficult: initialDifficultIds,
    remembered: [],
    reviewQueue: initialDifficultIds,
    quizHistory: [],
    practiceHistory: [],
    stats: null,
  })
  const [quizAnswers, setQuizAnswers] = useState({})
  const [readingAnswers, setReadingAnswers] = useState({})
  const [listeningAnswers, setListeningAnswers] = useState({})
  const [listeningLevelFilter, setListeningLevelFilter] = useState('all')
  const [readingLevelFilter, setReadingLevelFilter] = useState('all')
  const [quizLevelFilter, setQuizLevelFilter] = useState('all')
  const [selectedListeningId, setSelectedListeningId] = useState('')
  const [selectedReadingId, setSelectedReadingId] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const reportedPracticeAttemptsRef = useRef(new Set())
  const [placementAnswers, setPlacementAnswers] = useState({})
  const [savedFilter, setSavedFilter] = useState('all')
  const [speechRate, setSpeechRate] = useState(1)
  const [speechVoice, setSpeechVoice] = useState('en-US')
  const [showTranscript, setShowTranscript] = useState(false)
  const [selectedWord, setSelectedWord] = useState(vocabulary[1])
  const [learningVocabulary, setLearningVocabulary] = useState(vocabulary)
  const [learningTopics, setLearningTopics] = useState(topics)
  const [learningLevels, setLearningLevels] = useState(levels)
  const [learningListeningLessons, setLearningListeningLessons] = useState(listeningLessons)
  const [learningQuizzes, setLearningQuizzes] = useState(quizzes)
  const [learningReadingLessons, setLearningReadingLessons] = useState(readingLessons)
  const [learningDailyPlans, setLearningDailyPlans] = useState(dailyPlans)
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

  const applyProgress = useCallback((progress) => {
    setUserProgress(progress)
    if (Array.isArray(progress.favorites)) setSaved(new Set(progress.favorites))
    if (Array.isArray(progress.difficult)) setDifficult(new Set(progress.difficult))
  }, [])

  const fetchLearningData = useCallback(async () => {
    const [wordsData, topicsData, levelsData, listeningData, readingData, quizzesData, dailyPlanData] = await Promise.all([
      apiRequest('/learning/vocabulary').catch(() => null),
      apiRequest('/learning/topics').catch(() => null),
      apiRequest('/learning/levels').catch(() => null),
      apiRequest('/learning/listening').catch(() => null),
      apiRequest('/learning/reading').catch(() => null),
      apiRequest('/learning/quizzes').catch(() => null),
      apiRequest('/learning/daily-plan').catch(() => null),
    ])

    return { dailyPlanData, levelsData, listeningData, quizzesData, readingData, topicsData, wordsData }
  }, [])

  useEffect(() => {
    let active = true

    fetchLearningData().then(({ dailyPlanData, levelsData, listeningData, quizzesData, readingData, topicsData, wordsData }) => {
      if (!active) return
      if (Array.isArray(wordsData?.words)) setLearningVocabulary(wordsData.words)
      if (Array.isArray(topicsData?.topics) && topicsData.topics.length) setLearningTopics(topicsData.topics)
      if (Array.isArray(levelsData?.levels) && levelsData.levels.length) setLearningLevels(levelsData.levels)
      if (Array.isArray(listeningData?.lessons)) setLearningListeningLessons(listeningData.lessons)
      if (Array.isArray(quizzesData?.quizzes)) setLearningQuizzes(quizzesData.quizzes)
      if (Array.isArray(readingData?.lessons)) setLearningReadingLessons(readingData.lessons)
      if (Array.isArray(dailyPlanData?.plans)) setLearningDailyPlans(dailyPlanData.plans)
    })

    return () => {
      active = false
    }
  }, [activeTab, fetchLearningData])

  useEffect(() => {
    if (!user) return undefined
    let active = true

    apiRequest('/progress')
      .then((data) => {
        if (active && data?.progress) applyProgress(data.progress)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [applyProgress, user])

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
        reportedPracticeAttemptsRef.current = new Set()
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
    const { dailyPlanData, levelsData, listeningData, quizzesData, readingData, topicsData, wordsData } = await fetchLearningData()
    if (Array.isArray(wordsData?.words)) setLearningVocabulary(wordsData.words)
    if (Array.isArray(topicsData?.topics) && topicsData.topics.length) setLearningTopics(topicsData.topics)
    if (Array.isArray(levelsData?.levels) && levelsData.levels.length) setLearningLevels(levelsData.levels)
    if (Array.isArray(listeningData?.lessons)) setLearningListeningLessons(listeningData.lessons)
    if (Array.isArray(quizzesData?.quizzes)) setLearningQuizzes(quizzesData.quizzes)
    if (Array.isArray(readingData?.lessons)) setLearningReadingLessons(readingData.lessons)
    if (Array.isArray(dailyPlanData?.plans)) setLearningDailyPlans(dailyPlanData.plans)
    if (detail.topicSlug) setSelectedTopic(detail.topicSlug)
    if (detail.level) {
      setSelectedLevel(detail.level)
      setQuizLevelFilter(detail.level)
    }
    if (detail.quizId) setSelectedQuizId(detail.quizId)
    else if (detail.topicSlug || detail.level) setSelectedQuizId('')
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
  const visibleListeningLessons = useMemo(
    () =>
      learningListeningLessons.filter((lesson) => {
        const matchesTopic = selectedTopic === 'all' || lesson.topicSlug === selectedTopic
        const matchesLevel = listeningLevelFilter === 'all' || lesson.level === listeningLevelFilter
        return matchesTopic && matchesLevel
      }),
    [learningListeningLessons, listeningLevelFilter, selectedTopic],
  )
  const visibleReadingLessons = useMemo(
    () =>
      learningReadingLessons.filter((lesson) => {
        const matchesTopic = selectedTopic === 'all' || lesson.topicSlug === selectedTopic
        const matchesLevel = readingLevelFilter === 'all' || lesson.level === readingLevelFilter
        return matchesTopic && matchesLevel
      }),
    [learningReadingLessons, readingLevelFilter, selectedTopic],
  )
  const visibleQuizzes = useMemo(
    () =>
      learningQuizzes.filter((quiz) => {
        const matchesTopic = selectedTopic === 'all' || quiz.topicSlug === selectedTopic
        const matchesLevel = quizLevelFilter === 'all' || quiz.level === quizLevelFilter
        return matchesTopic && matchesLevel
      }),
    [learningQuizzes, quizLevelFilter, selectedTopic],
  )
  const activeListening = visibleListeningLessons.find((lesson) => lesson.id === selectedListeningId) || visibleListeningLessons[0] || learningListeningLessons[0] || listeningLessons[0]
  const activeReading = visibleReadingLessons.find((lesson) => lesson.id === selectedReadingId) || visibleReadingLessons[0] || learningReadingLessons[0] || readingLessons[0]
  const activeQuiz = useMemo(() => {
    const fallbackLevel = quizLevelFilter === 'all' ? selectedLevel : quizLevelFilter
    return visibleQuizzes.find((quiz) => quiz.id === selectedQuizId) || visibleQuizzes[0] || buildAutoQuizFromWords(learningVocabulary, selectedTopic, fallbackLevel, topicBySlug)
  }, [learningVocabulary, quizLevelFilter, selectedLevel, selectedQuizId, selectedTopic, topicBySlug, visibleQuizzes])
  const savedWords = learningVocabulary.filter((word) => saved.has(word.id))
  const difficultWords = learningVocabulary.filter((word) => difficult.has(word.id))
  const recentWords = recentWordIds.map((wordId) => learningVocabulary.find((word) => word.id === wordId)).filter(Boolean)
  const reviewQueueWords = (userProgress.reviewQueue || []).map((wordId) => learningVocabulary.find((word) => word.id === wordId)).filter(Boolean)
  const smartReviewWords = useMemo(() => buildAccountReviewWords(userProgress, learningVocabulary, difficult), [difficult, learningVocabulary, userProgress])
  const placementResult = useMemo(() => getPlacementResult(placementAnswers), [placementAnswers])
  const listeningCompletedCount = isPracticeComplete(activeListening?.questions, listeningAnswers) ? 1 : 0
  const readingCompletedCount = isPracticeComplete(activeReading?.questions, readingAnswers) ? 1 : 0
  const homeData = useMemo(
    () =>
      buildHomeData({
        activeQuiz,
        activeListening,
        difficultWords,
        listeningCompletedCount,
        placementResult,
        plans: learningDailyPlans,
        readingCompletedCount,
        savedWords,
        selectedLevel,
        selectedTopic,
        topics: displayTopics,
        userProgress,
        words: learningVocabulary,
      }),
    [activeListening, activeQuiz, difficultWords, displayTopics, learningDailyPlans, learningVocabulary, listeningCompletedCount, placementResult, readingCompletedCount, savedWords, selectedLevel, selectedTopic, userProgress],
  )
  const quizScore = (activeQuiz.questions || []).reduce(
    (score, question, index) => score + (quizAnswers[index] === question.answer ? 1 : 0),
    0,
  )
  const recordPracticeAttempt = useCallback((type, lesson, answers) => {
    const questions = lesson?.questions || []
    if (!user || !lesson?.id || !isPracticeComplete(questions, answers)) return

    const practiceKey = `${type}:${lesson.id}`
    if (reportedPracticeAttemptsRef.current.has(practiceKey)) return

    const correctCount = practiceScore(questions, answers)
    const totalQuestions = questions.length
    reportedPracticeAttemptsRef.current.add(practiceKey)

    savePracticeAttempt({
      type,
      lessonId: lesson.id,
      correctCount,
      totalQuestions,
      score: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
      answers,
    })
      .then((data) => {
        if (data?.progress) applyProgress(data.progress)
      })
      .catch(() => {})
  }, [applyProgress, user])

  useEffect(() => {
    recordPracticeAttempt('listening', activeListening, listeningAnswers)
  }, [activeListening, listeningAnswers, recordPracticeAttempt])

  useEffect(() => {
    recordPracticeAttempt('reading', activeReading, readingAnswers)
  }, [activeReading, readingAnswers, recordPracticeAttempt])

  const visibleTabs = useMemo(() => tabs.filter((tab) => tab.id !== 'admin' || user?.role === 'admin'), [user?.role])
  const currentTab = activeTab === 'admin' && user?.role !== 'admin' ? 'dashboard' : activeTab

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechVoice
    utterance.rate = speechRate
    window.speechSynthesis.speak(utterance)
  }

  function rememberRecentWord(word) {
    if (!word?.id) return
    setRecentWordIds((items) => [word.id, ...items.filter((item) => item !== word.id)].slice(0, 12))
  }

  function selectWord(word, index) {
    setWordIndex(index)
    setShowMeaning(false)
    rememberRecentWord(word)
  }

  function nextWord() {
    if (!filteredWords.length) return
    const nextIndex = wordIndex + 1
    const next = filteredWords[nextIndex % filteredWords.length]
    setWordIndex(nextIndex)
    setShowMeaning(false)
    rememberRecentWord(next)
  }

  async function toggleWord(word, type) {
    const setter = type === 'saved' ? setSaved : setDifficult
    const currentSet = type === 'saved' ? saved : difficult
    const shouldRemove = currentSet.has(word.id)
    const action = type === 'saved'
      ? shouldRemove ? 'unfavorite' : 'favorite'
      : shouldRemove ? 'not-difficult' : 'difficult'
    setter((items) => {
      const next = new Set(items)
      if (next.has(word.id)) next.delete(word.id)
      else next.add(word.id)
      return next
    })
    try {
      const data = await markWord(word.id, action)
      if (data?.progress) applyProgress(data.progress)
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
      reportedPracticeAttemptsRef.current = new Set()
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
    reportedPracticeAttemptsRef.current = new Set()
  }

  function updateAuthForm(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }))
  }

  function selectTopic(slug) {
    setSelectedTopic(slug)
    setWordIndex(0)
    setShowMeaning(false)
    setQuizAnswers({})
    setListeningAnswers({})
    setReadingAnswers({})
    setSelectedListeningId('')
    setSelectedReadingId('')
    setSelectedQuizId('')
    setShowTranscript(false)
  }

  function selectLevel(level) {
    setSelectedLevel(level)
    setWordIndex(0)
    setShowMeaning(false)
    setQuizAnswers({})
    setListeningAnswers({})
    setReadingAnswers({})
    setSelectedQuizId('')
  }

  if (checkingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7FAF8] px-4 text-zinc-900">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-emerald-700">EnglishHub</p>
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
              <p className="text-sm font-semibold text-emerald-700">EnglishHub</p>
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
        {currentTab === 'dashboard' && <Dashboard data={homeData} difficultWords={difficultWords} setActiveTab={setActiveTab} user={user} />}
        {currentTab === 'placement' && (
          <PlacementTest
            answers={placementAnswers}
            onApplyLevel={(level) => {
              selectLevel(level)
              setActiveTab('roadmap')
            }}
            result={placementResult}
            setAnswers={setPlacementAnswers}
          />
        )}
        {currentTab === 'vocabulary' && (
          <Vocabulary
            currentWord={currentWord}
            difficult={difficult}
            filteredWords={filteredWords}
            levels={learningLevels}
            mode={mode}
            openListening={() => setActiveTab('listening')}
            saved={saved}
            search={search}
            selectedLevel={selectedLevel}
            selectedTopic={selectedTopic}
            activeListening={activeListening}
            nextWord={nextWord}
            selectWord={selectWord}
            selectTopic={selectTopic}
            setMode={setMode}
            setSearch={setSearch}
            setSelectedLevel={selectLevel}
            setShowMeaning={setShowMeaning}
            setSpeechVoice={setSpeechVoice}
            showMeaning={showMeaning}
            speak={speak}
            speechVoice={speechVoice}
            topicBySlug={topicBySlug}
            topics={displayTopics}
            toggleWord={toggleWord}
          />
        )}
        {currentTab === 'listening' && (
          <Listening
            activeListening={activeListening}
            answers={listeningAnswers}
            levelFilter={listeningLevelFilter}
            lessons={visibleListeningLessons}
            selectLesson={(lesson) => {
              setSelectedListeningId(lesson.id)
              setListeningAnswers({})
              setShowTranscript(false)
            }}
            setAnswers={setListeningAnswers}
            setLevelFilter={(level) => {
              setListeningLevelFilter(level)
              setSelectedListeningId('')
              setListeningAnswers({})
              setShowTranscript(false)
            }}
            showTranscript={showTranscript}
            speak={speak}
            speechRate={speechRate}
            speechVoice={speechVoice}
            setShowTranscript={setShowTranscript}
            setSpeechRate={setSpeechRate}
            setSpeechVoice={setSpeechVoice}
          />
        )}
        {currentTab === 'reading' && (
          <Reading
            activeReading={activeReading}
            answers={readingAnswers}
            levelFilter={readingLevelFilter}
            lessons={visibleReadingLessons}
            selectedWord={selectedWord}
            selectLesson={(lesson) => {
              setSelectedReadingId(lesson.id)
              setReadingAnswers({})
            }}
            setAnswers={setReadingAnswers}
            setLevelFilter={(level) => {
              setReadingLevelFilter(level)
              setSelectedReadingId('')
              setReadingAnswers({})
            }}
            setSelectedWord={setSelectedWord}
            words={learningVocabulary}
          />
        )}
        {currentTab === 'quiz' && (
          <Quiz
            activeQuiz={activeQuiz}
            difficultWords={difficultWords}
            key={activeQuiz.id}
            levelFilter={quizLevelFilter}
            onProgressUpdated={applyProgress}
            quizAnswers={quizAnswers}
            quizzes={visibleQuizzes}
            quizScore={quizScore}
            selectQuiz={(quiz) => {
              setSelectedQuizId(quiz.id)
              setQuizAnswers({})
            }}
            setDifficult={setDifficult}
            setLevelFilter={(level) => {
              setQuizLevelFilter(level)
              setSelectedQuizId('')
              setQuizAnswers({})
            }}
            setQuizAnswers={setQuizAnswers}
            words={learningVocabulary}
          />
        )}
        {currentTab === 'roadmap' && <Roadmap placementLevel={placementResult.level} plans={learningDailyPlans} setActiveTab={setActiveTab} />}
        {currentTab === 'saved' && <Saved difficultWords={difficultWords} filter={savedFilter} recentWords={recentWords} reviewQueueWords={reviewQueueWords} savedWords={savedWords} setFilter={setSavedFilter} speak={speak} toggleWord={toggleWord} />}
        {currentTab === 'stats' && <Stats accountStats={userProgress.stats} reviewWords={smartReviewWords} speak={speak} toggleWord={toggleWord} user={user} />}
        {currentTab === 'admin' && <Admin authForm={authForm} authMessage={authMessage} authMode={authMode} onLearningContentUpdated={handleLearningContentUpdated} setAuthMode={setAuthMode} submitAuth={submitAuth} updateAuthForm={updateAuthForm} user={user} />}
      </main>
    </div>
  )
}

const cefrLevelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const defaultSkillProgress = { vocabulary: 0, listening: 0, reading: 0, quiz: 0 }

function emptySkillProgress() {
  return { ...defaultSkillProgress }
}

function fallbackRecommendation() {
  return {
    actions: [],
    learningLoop: [],
    nextAction: {
      detail: 'Bắt đầu bằng một vòng học từ vựng, nghe, đọc và quiz để EnglishHub có dữ liệu cá nhân hóa.',
      targetTab: 'vocabulary',
      title: 'Bắt đầu học từ mới',
      type: 'vocabulary',
    },
    weakSkill: {
      reason: 'Chưa có đủ dữ liệu trong tài khoản này.',
      score: 0,
      skill: 'vocabulary',
      targetTab: 'vocabulary',
    },
    weakTopic: {
      label: 'Chưa đủ dữ liệu',
      reason: 'Hoàn thành vài bài học để hệ thống nhận diện chủ đề yếu.',
      topicSlug: '',
    },
  }
}

function fallbackDailyChallenge() {
  return {
    date: '',
    listening: null,
    miniQuiz: null,
    reading: null,
    topic: { label: 'Chưa đủ dữ liệu', topicSlug: '' },
    words: [],
  }
}

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

function buildHomeData({ activeListening, activeQuiz, difficultWords, listeningCompletedCount, placementResult, plans, readingCompletedCount, savedWords, selectedLevel, selectedTopic, topics, userProgress, words }) {
  const accountStats = userProgress.stats || {}
  const recommendations = accountStats.recommendations || fallbackRecommendation()
  const scopedWords = words.filter((word) => {
    const matchesTopic = selectedTopic === 'all' || word.topicSlug === selectedTopic
    const matchesLevel = selectedLevel === 'all' || word.level === selectedLevel
    return matchesTopic && matchesLevel
  })
  const topic = selectedTopic === 'all'
    ? topics.find((item) => item.wordCount > 0) || topics[0]
    : topics.find((item) => item.slug === selectedTopic)
  const topicLabel = selectedTopic === 'all' ? topicName(topic, 'Tất cả chủ đề') : topicName(topic, selectedTopic)
  const levelLabel = selectedLevel === 'all' ? topic?.level || placementResult.level : selectedLevel
  const sourceWords = scopedWords.length ? scopedWords : words
  const learnedIds = new Set([
    ...(Array.isArray(userProgress.remembered) ? userProgress.remembered : []),
    ...savedWords.map((word) => word.id),
  ])
  const recentQuiz = userProgress.quizHistory?.[0]
  const planSeed = plans.find((plan) => plan.level === levelLabel) || plans[0] || {}
  const newWords = Math.min(10, Math.max(sourceWords.length - difficultWords.length, sourceWords.length ? 1 : 0))
  const reviewWords = difficultWords.length
  const firstWords = sourceWords.slice(0, 3).map((word) => word.term).join(', ')
  const planTitle = `${topicLabel} ${levelLabel}`.trim()
  const listeningWordNames = (activeListening?.newWordIds || [])
    .map((wordId) => words.find((word) => word.id === wordId)?.term)
    .filter(Boolean)

  return {
    metrics: {
      listeningCompleted: Number(accountStats.listeningCompleted ?? listeningCompletedCount),
      learnedWords: Number(accountStats.learnedWords ?? learnedIds.size),
      readingCompleted: Number(accountStats.readingCompleted ?? readingCompletedCount),
      recentQuizScore: Number(accountStats.recentQuizScore ?? (Number.isFinite(Number(recentQuiz?.score)) ? Number(recentQuiz.score) : 0)),
      reviewWords: Number(accountStats.reviewWords ?? reviewWords),
      suggestedLevel: placementResult.level,
    },
    planCards: [
      {
        day: 'Hôm nay',
        level: levelLabel,
        title: planTitle,
        action: `Học ${newWords} từ mới, ôn ${reviewWords} từ khó, làm ${activeQuiz.titleVi}.`,
      },
      {
        day: 'Ngày mai',
        level: levelLabel,
        title: planSeed.title || planTitle,
        action: planSeed.action || `Ôn lại ${Math.max(reviewWords, 5)} từ và thêm 5 từ mới.`,
      },
      {
        day: 'Tuần này',
        level: levelLabel,
        title: topicLabel,
        action: `Hoàn thành chủ đề ${topicLabel} với flashcard, listening, reading và quiz.`,
      },
    ],
    levelProgress: accountStats.levelProgress || { A1: 0, A2: 0, B1: 0, B2: 0 },
    dailyChallenge: accountStats.dailyChallenge || fallbackDailyChallenge(),
    recommendations,
    recommendedListening: {
      duration: activeListening?.duration || '',
      level: activeListening?.level || levelLabel,
      title: activeListening?.titleVi || 'Chưa có bài nghe phù hợp',
      words: listeningWordNames.length ? listeningWordNames.join(', ') : firstWords || topicLabel,
    },
    skillProgress: accountStats.skillProgress || emptySkillProgress(),
    studyMinutes: Number(accountStats.studyMinutes || 0),
    streakDays: Number(accountStats.streakDays || 0),
    title: `${planTitle} · ${newWords} từ mới · ${reviewWords} từ ôn`,
    topicFocus: firstWords || 'Chọn chủ đề để bắt đầu',
    xp: Number(accountStats.xp || 0),
  }
}

function buildAutoQuizFromWords(words, selectedTopic, selectedLevel, topicBySlug) {
  const topicWords = words
    .filter((word) => (selectedTopic === 'all' || word.topicSlug === selectedTopic) && (selectedLevel === 'all' || word.level === selectedLevel))
    .slice(0, 4)
  const fallbackTitle = selectedTopic === 'all' ? 'Quiz tự động từ từ vựng' : `Quiz tự động ${topicName(topicBySlug.get(selectedTopic), selectedTopic)}`

  if (!topicWords.length) {
    return {
      id: `quiz-empty-${selectedTopic}-${selectedLevel}`,
      title: 'No quiz available',
      titleVi: 'Chưa có từ vựng để tạo quiz',
      level: selectedLevel === 'all' ? 'Chưa chọn' : selectedLevel,
      topicSlug: selectedTopic,
      questionCount: 0,
      questions: [],
    }
  }

  const questions = topicWords.map((word, index) => {
    const meaningOptions = buildOptionSet(word.meaningVi, words.filter((item) => item.id !== word.id).map((item) => item.meaningVi))
    const termOptions = buildOptionSet(word.term, words.filter((item) => item.id !== word.id).map((item) => item.term))
    const patterns = [
      {
        prompt: `Choose the Vietnamese meaning of "${word.term}".`,
        answer: word.meaningVi,
        options: meaningOptions,
        reviewType: 'Vocabulary',
        skill: 'Vocabulary',
      },
      {
        prompt: `Match "${word.term}" with the closest meaning.`,
        answer: word.meaningVi,
        options: meaningOptions,
        reviewType: 'Matching',
        skill: 'Matching',
      },
      {
        prompt: `Complete: ${word.example?.replace(new RegExp(escapeRegExp(word.term), 'i'), '___') || `The word is ___.`}`,
        answer: word.term,
        options: termOptions,
        reviewType: 'Fill blank',
        skill: 'Fill blank',
      },
      {
        prompt: `Listen and choose the word: "${word.meaningVi}".`,
        answer: word.term,
        options: termOptions,
        reviewType: 'Listening',
        skill: 'Listening',
      },
    ]
    const question = patterns[index % patterns.length]

    return {
      ...question,
      explanation: `"${word.term}" nghĩa là "${word.meaningVi}". ${word.example || ''}`.trim(),
      relatedWordId: word.id,
      reviewTarget: question.reviewType === 'Matching' && word.collocations?.[0] ? word.collocations[0] : word.term,
    }
  })

  return {
    id: `quiz-auto-${selectedTopic}-${selectedLevel}-${topicWords.length}`,
    title: 'Auto generated vocabulary quiz',
    titleVi: fallbackTitle,
    level: selectedLevel === 'all' ? topicWords[0].level || 'A2' : selectedLevel,
    topicSlug: selectedTopic,
    questionCount: questions.length,
    questions,
  }
}

function buildOptionSet(answer, distractors) {
  return Array.from(new Set([answer, ...distractors.filter(Boolean).filter((item) => item !== answer)])).slice(0, 4)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function topicName(topic, fallback = 'Chưa gắn chủ đề') {
  return topic?.nameVi || topic?.name || topic?.slug || fallback
}

function getPlacementResult(answers) {
  const levelScores = { A1: 1, A2: 2, B1: 3, B2: 4 }
  const scoreLevels = ['A1', 'A2', 'B1', 'B2']
  const values = Object.values(answers || {}).filter((level) => levelScores[level])
  const answered = values.length

  if (!answered) {
    return {
      answered: 0,
      level: 'A2',
      summary: 'Chưa làm test. A2 đang là mức mặc định để bạn bắt đầu nhanh.',
    }
  }

  const average = values.reduce((sum, level) => sum + levelScores[level], 0) / answered
  const level = scoreLevels[Math.min(scoreLevels.length - 1, Math.max(0, Math.round(average) - 1))]

  return {
    answered,
    level,
    summary: answered === placementQuestions.length
      ? `Bạn đang phù hợp nhất với ${level}. Lộ trình sẽ ưu tiên nội dung quanh mức này.`
      : `Tạm tính ${level}. Trả lời đủ câu để gợi ý chắc hơn.`,
  }
}

function buildAccountReviewWords(progress, words, difficultSet) {
  const items = []
  const seen = new Set()

  ;(progress.quizHistory || []).forEach((attempt) => {
    ;(attempt.wrongItems || []).forEach((wrongItem) => {
      if (!wrongItem.wordId || seen.has(wrongItem.wordId)) return
      const word = words.find((candidate) => candidate.id === wrongItem.wordId)
      if (!word) return
      seen.add(word.id)
      items.push({
        due: 'Hôm nay',
        nextAction: `Ôn lại ${wrongItem.reviewTarget || word.term}, nghe phát âm rồi làm lại câu quiz.`,
        reason: `Sai trong quiz: ${wrongItem.prompt || attempt.quizId}`,
        strength: 'weak',
        word,
        wordId: word.id,
      })
    })
  })

  ;[...(progress.reviewQueue || []), ...difficultSet].forEach((wordId) => {
    if (seen.has(wordId)) return
    const word = words.find((candidate) => candidate.id === wordId)
    if (!word) return
    seen.add(word.id)
    items.push({
      due: 'Hôm nay',
      nextAction: `Lật thẻ ${word.term}, nghe phát âm rồi tự nói 1 câu.`,
      reason: difficultSet.has(wordId) ? 'Được đánh dấu là từ khó trong tài khoản này' : 'Đang nằm trong lịch ôn của tài khoản này',
      strength: difficultSet.has(wordId) ? 'weak' : 'medium',
      word,
      wordId,
    })
  })

  return items
}

function isPracticeComplete(questions = [], answers = {}) {
  return questions.length > 0 && questions.every((_question, index) => Boolean(answers[index]))
}

function practiceScore(questions = [], answers = {}) {
  return questions.reduce((score, question, index) => score + (answers[index] === question.answer ? 1 : 0), 0)
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
          <p className="text-sm font-semibold text-emerald-700">EnglishHub</p>
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

function Dashboard({ data, difficultWords, setActiveTab, user }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Từ đã học" value={data.metrics.learnedWords} tone="emerald" />
        <Metric label="Cần ôn" value={data.metrics.reviewWords} tone="rose" />
        <Metric label="Quiz gần đây" value={`${data.metrics.recentQuizScore}%`} tone="amber" />
        <Metric label="Trình độ gợi ý" value={data.metrics.suggestedLevel} tone="cyan" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">Flow học hôm nay</p>
          <h2 className="mt-2 text-2xl font-bold">{data.title}</h2>
          <p className="mt-2 text-zinc-700">Trọng tâm: {data.topicFocus}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {flow.map((step, index) => (
              <div className={`rounded-md border p-3 ${index < 3 ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-[#FBFDFC]'}`} key={step}>
                <p className="text-xs font-semibold text-zinc-500">Bước {index + 1}</p>
                <p className="mt-1 text-sm font-bold">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {data.planCards.map((plan) => (
              <div className="rounded-md border border-zinc-200 bg-[#FBFDFC] p-3" key={plan.day}>
                <p className="text-sm font-semibold text-emerald-700">{plan.day} · {plan.level}</p>
                <p className="mt-1 font-bold">{plan.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{plan.action}</p>
              </div>
            ))}
          </div>
          <SmartRecommendation data={data.recommendations} setActiveTab={setActiveTab} />
          <DailyChallenge challenge={data.dailyChallenge} setActiveTab={setActiveTab} />
          <div className="mt-5 rounded-md border border-zinc-200 bg-[#FBFDFC] p-4">
            <p className="text-sm font-semibold text-emerald-700">Bài nghe theo từ vừa học</p>
            <h3 className="mt-1 text-xl font-bold">{data.recommendedListening.title}</h3>
            <p className="mt-2 text-sm text-zinc-600">
              {data.recommendedListening.level} · {data.recommendedListening.duration || 'Chưa có thời lượng'} · Từ trong ngữ cảnh: {data.recommendedListening.words}
            </p>
            <button className="mt-3 rounded-md border border-zinc-300 px-3 py-2 font-semibold" onClick={() => setActiveTab('listening')} type="button">
              Nghe bài liên quan
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={() => setActiveTab('vocabulary')}>
              Bắt đầu học từ
            </button>
            <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-800" onClick={() => setActiveTab('quiz')}>
              Làm quiz nhanh
            </button>
            <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-800" onClick={() => setActiveTab('placement')}>
              Làm test xếp trình độ
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-rose-700">Từ khó quay lại nhiều hơn</p>
          <h2 className="mt-2 text-2xl font-bold">{data.metrics.reviewWords} từ cần ôn hôm nay</h2>
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

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">Theo dõi tiến độ học</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="Số từ đã học" value={data.metrics.learnedWords} />
            <Info label="Bài nghe hoàn thành" value={data.metrics.listeningCompleted} />
            <Info label="Bài đọc đã làm" value={data.metrics.readingCompleted} />
            <Info label="Chuỗi ngày học" value={`${data.streakDays} ngày`} />
          </div>
        </div>
        <LevelProgress levelProgress={data.levelProgress} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SkillProgress skillProgress={data.skillProgress} />
        <ProfileSummary dashboardData={data} user={user} />
      </section>
    </>
  )
}

function SmartRecommendation({ data, setActiveTab }) {
  const recommendation = data || fallbackRecommendation()
  const actions = recommendation.actions?.length ? recommendation.actions : [recommendation.nextAction]

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-800">Gợi ý thông minh</p>
      <div className="mt-2 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h3 className="text-2xl font-bold text-zinc-950">{recommendation.nextAction?.title || 'Bắt đầu học từ mới'}</h3>
          <p className="mt-2 text-sm text-zinc-700">{recommendation.nextAction?.detail || 'Hoàn thành một vòng học để hệ thống có thêm dữ liệu.'}</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Info label="Kỹ năng cần ưu tiên" value={`${recommendation.weakSkill?.skill || 'vocabulary'} · ${recommendation.weakSkill?.score || 0}%`} />
            <Info label="Chủ đề cần chú ý" value={recommendation.weakTopic?.label || 'Chưa đủ dữ liệu'} />
          </div>
          <button className="mt-4 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={() => setActiveTab(recommendation.nextAction?.targetTab || 'vocabulary')} type="button">
            Học mục này
          </button>
        </div>
        <div className="grid gap-2">
          {actions.map((action, index) => (
            <button className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-left hover:border-emerald-600" key={`${action.title}-${index}`} onClick={() => setActiveTab(action.targetTab || 'vocabulary')} type="button">
              <span className="text-xs font-semibold uppercase text-emerald-700">Ưu tiên {index + 1}</span>
              <span className="mt-1 block font-bold">{action.title}</span>
              <span className="mt-1 block text-sm text-zinc-600">{action.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DailyChallenge({ challenge, setActiveTab }) {
  const data = challenge || fallbackDailyChallenge()

  return (
    <div className="mt-5 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
      <p className="text-sm font-semibold text-cyan-800">Daily Challenge</p>
      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-zinc-950">Thử thách hôm nay · {data.topic?.label || 'Chưa đủ dữ liệu'}</h3>
          <p className="mt-1 text-sm text-zinc-700">5 từ, 1 bài nghe ngắn, 1 câu đọc hiểu và 1 mini quiz.</p>
        </div>
        <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-900">{data.date || 'Hôm nay'}</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <div className="rounded-md border border-cyan-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-cyan-700">5 từ</p>
          <div className="mt-2 space-y-1">
            {(data.words || []).length === 0 && <p className="text-sm text-zinc-600">Hoàn thành vài bài để có từ gợi ý.</p>}
            {(data.words || []).map((word) => (
              <p className="text-sm font-semibold" key={word.id}>{word.term} <span className="font-normal text-zinc-500">· {word.meaningVi}</span></p>
            ))}
          </div>
          <button className="mt-3 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold" onClick={() => setActiveTab('vocabulary')} type="button">
            Học từ
          </button>
        </div>
        <ChallengeCard action="Nghe bài" detail={data.listening ? `${data.listening.level} · ${data.listening.duration || 'ngắn'}` : 'Chưa có bài nghe'} onClick={() => setActiveTab('listening')} title={data.listening?.title || 'Listening ngắn'} />
        <ChallengeCard action="Đọc bài" detail={data.reading?.question || 'Đọc đoạn ngắn và chọn ý đúng.'} onClick={() => setActiveTab('reading')} title={data.reading?.title || 'Reading ngắn'} />
        <ChallengeCard action="Làm quiz" detail={data.miniQuiz ? `${data.miniQuiz.level} · ${data.miniQuiz.questionCount} câu` : 'Mini quiz theo chủ đề'} onClick={() => setActiveTab('quiz')} title={data.miniQuiz?.title || 'Mini quiz'} />
      </div>
    </div>
  )
}

function ChallengeCard({ action, detail, onClick, title }) {
  return (
    <div className="rounded-md border border-cyan-100 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-cyan-700">{action}</p>
      <h4 className="mt-2 font-bold">{title}</h4>
      <p className="mt-1 text-sm text-zinc-600">{detail}</p>
      <button className="mt-3 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold" onClick={onClick} type="button">
        Bắt đầu
      </button>
    </div>
  )
}

function PlacementTest({ answers, onApplyLevel, result, setAnswers }) {
  const completed = result.answered === placementQuestions.length

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-start">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Placement test</p>
        <h2 className="mt-2 text-3xl font-bold">Xếp trình độ A1-B2</h2>
        <p className="mt-3 text-zinc-700">Chọn phương án gần nhất với khả năng hiện tại. Kết quả sẽ gợi ý lộ trình học phù hợp hơn.</p>
        <div className="mt-6 space-y-5">
          {placementQuestions.map((question, index) => (
            <div className="border-b border-zinc-100 pb-5" key={question.prompt}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold">{index + 1}. {question.prompt}</p>
                <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800">{question.skill}</span>
              </div>
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => {
                  const selected = answers[index] === option.level
                  return (
                    <button
                      className={`rounded-md border px-3 py-2 text-left font-semibold ${selected ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-zinc-200 hover:border-emerald-500'}`}
                      key={option.label}
                      onClick={() => setAnswers((current) => ({ ...current, [index]: option.level }))}
                      type="button"
                    >
                      <span className="mr-2 rounded-md bg-[#FBFDFC] px-2 py-1 text-xs text-zinc-600">{option.level}</span>
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 lg:sticky lg:top-4">
        <p className="text-sm font-semibold text-amber-700">Gợi ý trình độ</p>
        <h2 className="mt-2 text-5xl font-bold">{result.level}</h2>
        <p className="mt-3 text-zinc-700">{result.summary}</p>
        <div className="mt-5 h-3 rounded-md bg-zinc-100">
          <div className="h-3 rounded-md bg-emerald-600" style={{ width: `${(result.answered / placementQuestions.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold text-zinc-600">{result.answered}/{placementQuestions.length} câu đã trả lời</p>
        <div className="mt-5 grid gap-2">
          <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={!completed} onClick={() => onApplyLevel(result.level)} type="button">
            Áp dụng vào lộ trình
          </button>
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={() => setAnswers({})} type="button">
            Làm lại test
          </button>
        </div>
      </div>
    </section>
  )
}

function Vocabulary(props) {
  const {
    activeListening,
    currentWord,
    difficult,
    filteredWords,
    levels,
    mode,
    nextWord,
    openListening,
    saved,
    search,
    selectedLevel,
    selectedTopic,
    selectWord,
    selectTopic,
    setMode,
    setSearch,
    setSelectedLevel,
    setShowMeaning,
    setSpeechVoice,
    showMeaning,
    speak,
    speechVoice,
    topicBySlug,
    topics,
    toggleWord,
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
                onClick={() => selectWord(word, index)}
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
          activeListening={activeListening}
          currentWord={currentWord}
          difficult={difficult}
          mode={mode}
          nextWord={nextWord}
          openListening={openListening}
          saved={saved}
          selectedLevelLabel={selectedLevelLabel}
          selectedTopicLabel={selectedTopicLabel}
          setShowMeaning={setShowMeaning}
          setSpeechVoice={setSpeechVoice}
          showMeaning={showMeaning}
          speak={speak}
          speechVoice={speechVoice}
          topicBySlug={topicBySlug}
          toggleWord={toggleWord}
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
  activeListening,
  currentWord,
  difficult,
  mode,
  nextWord,
  openListening,
  saved,
  selectedLevelLabel,
  selectedTopicLabel,
  setShowMeaning,
  setSpeechVoice,
  showMeaning,
  speak,
  speechVoice,
  topicBySlug,
  toggleWord,
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
  const listeningWords = (activeListening?.newWordIds || [])
    .map((wordId) => wordId === currentWord.id ? currentWord.term : '')
    .filter(Boolean)
    .join(', ')

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
            <p className="text-sm font-semibold text-emerald-700">{mode} · {showMeaning ? 'Mặt sau' : 'Mặt trước'}</p>
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
        {activeListening && (
          <div className="mt-4 rounded-md border border-zinc-200 bg-[#FBFDFC] p-4">
            <p className="text-sm font-semibold text-emerald-700">Bài nghe theo từ vừa học</p>
            <h3 className="mt-1 text-xl font-bold">{activeListening.titleVi}</h3>
            <p className="mt-2 text-sm text-zinc-600">
              {listeningWords ? `Có ngữ cảnh cho: ${listeningWords}.` : `Cùng chủ đề ${topicName(topic, currentWord.topicSlug)}.`}
            </p>
            <button className="mt-3 rounded-md border border-zinc-300 px-3 py-2 font-semibold" onClick={openListening} type="button">
              Luyện listening liên quan
            </button>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={() => setShowMeaning(!showMeaning)}>
            {showMeaning ? 'Ẩn nghĩa' : 'Lật thẻ'}
          </button>
          <select className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-semibold" value={speechVoice} onChange={(event) => setSpeechVoice(event.target.value)}>
            <option value="en-US">Giọng Anh-Mỹ</option>
            <option value="en-GB">Giọng Anh-Anh</option>
          </select>
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={nextWord}>
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

function LessonList({ activeId, emptyMessage, items, levelFilter, onLevelFilterChange, onSelect, title }) {
  const levelOptions = ['all', 'A1', 'A2', 'B1', 'B2']

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="text-sm font-semibold text-emerald-700">{title}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{items.length} bài</h2>
        <div className="flex flex-wrap gap-1">
          {levelOptions.map((level) => (
            <button
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${levelFilter === level ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 text-zinc-700 hover:border-emerald-500'}`}
              key={level}
              onClick={() => onLevelFilterChange(level)}
              type="button"
            >
              {level === 'all' ? 'Tất cả' : level}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {items.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-300 bg-[#FBFDFC] p-3 text-sm text-zinc-600">{emptyMessage}</p>
        )}
        {items.map((lesson, index) => (
          <button
            className={`w-full rounded-md border p-3 text-left ${lesson.id === activeId ? 'border-emerald-700 bg-emerald-50' : 'border-zinc-200 hover:border-emerald-500'}`}
            key={lesson.id}
            onClick={() => onSelect(lesson)}
            type="button"
          >
            <span className="block text-xs font-semibold text-zinc-500">Bài {index + 1} · {lesson.level}</span>
            <span className="mt-1 block font-bold">{lesson.titleVi}</span>
            <span className="mt-1 block text-sm text-zinc-600">{lesson.topicSlug} · {lesson.duration || `${lesson.estimatedMinutes} phút`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Listening({ activeListening, answers, levelFilter, lessons, selectLesson, setAnswers, setLevelFilter, showTranscript, speak, speechRate, speechVoice, setShowTranscript, setSpeechRate, setSpeechVoice }) {
  if (!activeListening) {
    return (
      <LessonList activeId="" emptyMessage="Chưa có bài nghe cho bộ lọc hiện tại." items={lessons} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} onSelect={selectLesson} title="Danh sách listening" />
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <LessonList activeId={activeListening.id} emptyMessage="Chưa có bài nghe cho bộ lọc hiện tại." items={lessons} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} onSelect={selectLesson} title="Danh sách listening" />

      <div className="space-y-6">
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
          <select className="rounded-md border border-zinc-300 bg-white px-3 py-2" value={speechVoice} onChange={(event) => setSpeechVoice(event.target.value)}>
            <option value="en-US">Anh-Mỹ</option>
            <option value="en-GB">Anh-Anh</option>
          </select>
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={() => setShowTranscript(!showTranscript)}>
            {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
          </button>
        </div>
        {showTranscript && (
          <div className="mt-5 space-y-3">
            {(activeListening.transcript || []).map((line, index) => (
              <button className="block w-full rounded-md border border-zinc-200 bg-[#FBFDFC] p-3 text-left hover:border-emerald-500" key={line} onClick={() => speak(line)}>
                <span className="text-sm font-semibold text-zinc-500">Câu {index + 1}</span>
                <span className="mt-1 block text-zinc-800">{line}</span>
              </button>
            ))}
          </div>
        )}
      </div>

        <PracticeBlock answers={answers} questions={activeListening.questions || []} setAnswers={setAnswers} title="Bài tập listening" />
      </div>
    </section>
  )
}

function Reading({ activeReading, answers, levelFilter, lessons, selectedWord, selectLesson, setAnswers, setLevelFilter, setSelectedWord, words }) {
  if (!activeReading) {
    return (
      <LessonList activeId="" emptyMessage="Chưa có bài đọc cho bộ lọc hiện tại." items={lessons} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} onSelect={selectLesson} title="Danh sách reading" />
    )
  }

  const highlightedWords = words.filter((word) => (activeReading.highlightedWordIds || []).includes(word.id))
  const displayWord = highlightedWords.find((word) => word.id === selectedWord?.id) || highlightedWords[0] || selectedWord || words[0]

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <LessonList activeId={activeReading.id} emptyMessage="Chưa có bài đọc cho bộ lọc hiện tại." items={lessons} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} onSelect={selectLesson} title="Danh sách reading" />

      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">{activeReading.level} · {activeReading.estimatedMinutes} phút</p>
          <h2 className="mt-2 text-3xl font-bold">{activeReading.titleVi}</h2>
          <div className="mt-5 rounded-md border border-zinc-200 bg-[#FBFDFC] p-4 text-lg leading-8">
            {(activeReading.content || '').split(/(\b[\w'-]+\b)/g).map((token, index) => {
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

        <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-sm font-semibold text-amber-700">Từ trong bài đọc</p>
            <h3 className="mt-2 text-2xl font-bold">{displayWord?.term || 'Chưa có từ'}</h3>
            <p className="mt-2 text-zinc-700">{displayWord?.meaningVi || 'Chưa có nghĩa'}</p>
            <p className="mt-3 text-sm text-zinc-600">{displayWord?.example || 'Chọn từ được highlight trong bài đọc.'}</p>
          </div>
          <PracticeBlock answers={answers} questions={activeReading.questions || []} setAnswers={setAnswers} title="Câu hỏi reading" />
        </div>
      </div>
    </section>
  )
}

function QuizList({ activeId, emptyMessage, items, levelFilter, onLevelFilterChange, onSelect }) {
  const levelOptions = ['all', 'A1', 'A2', 'B1', 'B2']

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="text-sm font-semibold text-emerald-700">Danh sách quiz</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{items.length} bài</h2>
        <div className="flex flex-wrap gap-1">
          {levelOptions.map((level) => (
            <button
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${levelFilter === level ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 text-zinc-700 hover:border-emerald-500'}`}
              key={level}
              onClick={() => onLevelFilterChange(level)}
              type="button"
            >
              {level === 'all' ? 'Tất cả' : level}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {items.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-300 bg-[#FBFDFC] p-3 text-sm text-zinc-600">{emptyMessage}</p>
        )}
        {items.map((quiz, index) => {
          const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : quiz.questionCount || 0
          return (
            <button
              className={`w-full rounded-md border p-3 text-left ${quiz.id === activeId ? 'border-emerald-700 bg-emerald-50' : 'border-zinc-200 hover:border-emerald-500'}`}
              key={quiz.id}
              onClick={() => onSelect(quiz)}
              type="button"
            >
              <span className="block text-xs font-semibold text-zinc-500">Quiz {index + 1} · {quiz.level}</span>
              <span className="mt-1 block font-bold">{quiz.titleVi || quiz.title || quiz.id}</span>
              <span className="mt-1 block text-sm text-zinc-600">{quiz.topicSlug || 'general'} · {questionCount} câu</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Quiz({ activeQuiz, difficultWords, levelFilter, onProgressUpdated, quizAnswers, quizzes, quizScore, selectQuiz, setDifficult, setLevelFilter, setQuizAnswers, words }) {
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
      const data = await saveQuizAttempt({
        quizId: activeQuiz.id,
        score: accuracy,
        correctCount: quizScore,
        totalQuestions,
        wrongWordIds: uniqueWrongWordIds,
        wrongItems,
        answers: quizAnswers,
      })
      if (data?.progress) onProgressUpdated(data.progress)
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
    <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
      <QuizList activeId={activeQuiz.id} emptyMessage="Chưa có quiz cho bộ lọc hiện tại." items={quizzes} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} onSelect={selectQuiz} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr] xl:items-start">
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-700">Quiz tổng hợp</p>
            <span className="rounded-md bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800">{activeQuiz.level}</span>
          </div>
          <h2 className="mt-2 text-3xl font-bold">{activeQuiz.titleVi || activeQuiz.title || activeQuiz.id}</h2>
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

function Roadmap({ placementLevel, plans, setActiveTab }) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Lộ trình theo ngày</p>
        <h2 className="mt-2 text-2xl font-bold">Gợi ý hiện tại: {placementLevel}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div className="rounded-md border border-zinc-200 bg-[#FBFDFC] p-4" key={plan.day}>
              <p className="text-sm font-semibold text-emerald-700">{plan.day} · {plan.level}</p>
              <h3 className="mt-2 text-xl font-bold">{plan.title}</h3>
              <p className="mt-2 text-sm text-zinc-700">{plan.focus}</p>
              <p className="mt-3 text-sm font-semibold text-zinc-800">{plan.reviewWords} từ ôn · {plan.newWords} từ mới</p>
            </div>
          ))}
        </div>
        <button className="mt-5 rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={() => setActiveTab('placement')} type="button">
          Cập nhật bằng test đầu vào
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {roadmap.map((item) => (
          <div className={`rounded-lg border p-5 ${item.level === placementLevel ? 'border-emerald-700 bg-emerald-50' : item.unlocked ? 'border-emerald-300 bg-white' : 'border-zinc-200 bg-zinc-100'}`} key={item.level}>
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
      </div>
    </section>
  )
}

function Saved({ savedWords, difficultWords, filter, recentWords, reviewQueueWords, setFilter, speak, toggleWord }) {
  const allWords = [...savedWords, ...difficultWords.filter((word) => !savedWords.some((savedWord) => savedWord.id === word.id))]
  const words = filter === 'saved'
    ? savedWords
    : filter === 'difficult'
      ? difficultWords
      : filter === 'recent'
        ? recentWords
        : filter === 'review'
          ? reviewQueueWords
          : allWords
  const filters = [
    { id: 'all', label: `Tất cả (${allWords.length})` },
    { id: 'saved', label: `Yêu thích (${savedWords.length})` },
    { id: 'difficult', label: `Từ khó (${difficultWords.length})` },
    { id: 'recent', label: `Học gần đây (${recentWords.length})` },
    { id: 'review', label: `Cần ôn (${reviewQueueWords.length})` },
  ]

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Ôn lại riêng</p>
        <h2 className="mt-2 text-2xl font-bold">Sổ tay từ vựng cá nhân</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              className={`rounded-md border px-3 py-2 font-semibold ${filter === item.id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 text-zinc-700'}`}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {words.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-zinc-600">
          Chưa có từ nào trong nhóm này. Khi học flashcard, bấm Lưu hoặc Khó để đưa từ vào đây.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {words.map((word) => (
          <div className="rounded-lg border border-zinc-200 bg-white p-4" key={word.id}>
            <img alt={word.term} className="mb-4 h-36 w-full rounded-md object-cover" src={word.imageUrl} />
            <p className="text-sm font-semibold text-emerald-700">{word.level} · {word.partOfSpeech}</p>
            <h2 className="mt-1 text-2xl font-bold">{word.term}</h2>
            <p className="mt-2 text-zinc-700">{word.meaningVi}</p>
            <p className="mt-2 text-sm text-zinc-600">{word.example}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md border border-zinc-300 px-3 py-2 font-semibold" onClick={() => speak(word.audioText || word.term)} type="button">
                Nghe phát âm
              </button>
              <button className="rounded-md border border-zinc-300 px-3 py-2 font-semibold" onClick={() => toggleWord(word, 'saved')} type="button">
                {savedWords.some((item) => item.id === word.id) ? 'Bỏ yêu thích' : 'Yêu thích'}
              </button>
              <button className="rounded-md border border-zinc-300 px-3 py-2 font-semibold" onClick={() => toggleWord(word, 'difficult')} type="button">
                {difficultWords.some((item) => item.id === word.id) ? 'Đã nhớ' : 'Từ khó'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Stats({ accountStats, reviewWords, speak, toggleWord, user }) {
  const stats = accountStats || {}
  const skillProgress = stats.skillProgress || emptySkillProgress()
  const recommendations = stats.recommendations || fallbackRecommendation()

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">Thống kê tài khoản</p>
          <h2 className="mt-2 text-2xl font-bold">{user?.name || user?.email || 'Học viên'}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Từ đã học" value={stats.learnedWords || 0} />
            <Info label="Từ cần ôn" value={stats.reviewWords || 0} />
            <Info label="Quiz đã làm" value={stats.quizCompleted || 0} />
            <Info label="Điểm quiz gần nhất" value={`${stats.recentQuizScore || 0}%`} />
            <Info label="Bài nghe hoàn thành" value={stats.listeningCompleted || 0} />
            <Info label="Bài đọc hoàn thành" value={stats.readingCompleted || 0} />
            <Info label="Chuỗi ngày học" value={`${stats.streakDays || 0} ngày`} />
            <Info label="XP" value={(stats.xp || 0).toLocaleString('vi-VN')} />
          </div>
        </div>
        <SkillProgress skillProgress={skillProgress} />
        <LevelProgress levelProgress={stats.levelProgress || { A1: 0, A2: 0, B1: 0, B2: 0 }} />
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-emerald-700">Quyết định học tập</p>
          <h2 className="mt-2 text-2xl font-bold">{recommendations.nextAction?.title || 'Bắt đầu học từ mới'}</h2>
          <p className="mt-2 text-zinc-700">{recommendations.nextAction?.detail || 'Hoàn thành vài hoạt động để hệ thống cá nhân hóa tốt hơn.'}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Kỹ năng yếu nhất" value={`${recommendations.weakSkill?.skill || 'vocabulary'} · ${recommendations.weakSkill?.score || 0}%`} />
            <Info label="Lý do" value={recommendations.weakSkill?.reason || 'Chưa đủ dữ liệu.'} />
            <Info label="Chủ đề yếu nhất" value={recommendations.weakTopic?.label || 'Chưa đủ dữ liệu'} />
            <Info label="Tín hiệu" value={recommendations.weakTopic?.reason || 'Cần thêm dữ liệu học tập.'} />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-cyan-700">Vòng học cá nhân hóa</p>
          <div className="mt-5 grid gap-2">
            {(recommendations.learningLoop || []).map((step, index) => (
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-[#FBFDFC] px-3 py-2" key={step.step}>
                <span>
                  <span className="text-xs font-semibold text-zinc-500">Bước {index + 1}</span>
                  <span className="block font-bold">{step.step}</span>
                </span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${step.done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                  {step.done ? 'Đã có dữ liệu' : 'Nên làm'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-rose-700">Lịch ôn thông minh</p>
        <h2 className="mt-2 text-2xl font-bold">{reviewWords.length} mục cần quay lại</h2>
        <div className="mt-5 space-y-3">
          {reviewWords.map((item, index) => (
            <div className="border-b border-zinc-100 pb-3" key={`${item.word.id}-${index}`}>
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-bold">{item.word.term}</span>
                  <span className="text-sm text-zinc-600">{item.reason}</span>
                </span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${item.strength === 'weak' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>{item.due}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{item.nextAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold" onClick={() => speak(item.word.audioText || item.word.term)} type="button">
                  Nghe
                </button>
                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold" onClick={() => toggleWord(item.word, 'difficult')} type="button">
                  Đánh dấu đã nhớ
                </button>
              </div>
            </div>
          ))}
          {reviewWords.length === 0 && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Hôm nay chưa có mục ôn khẩn cấp.</p>
          )}
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

function SkillProgress({ skillProgress = emptySkillProgress() }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-emerald-700">Tiến độ kỹ năng</p>
      <div className="mt-5 space-y-4">
        {Object.entries(skillProgress).map(([skill, value]) => (
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

function LevelProgress({ levelProgress = {} }) {
  const entries = ['A1', 'A2', 'B1', 'B2'].map((level) => [level, Number(levelProgress[level] || 0)])

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-cyan-700">Tiến độ A1 → A2 → B1</p>
      <div className="mt-5 space-y-4">
        {entries.map(([level, value]) => (
          <div key={level}>
            <div className="flex justify-between text-sm font-semibold">
              <span>{level}</span>
              <span>{value}%</span>
            </div>
            <div className="mt-2 h-3 rounded-md bg-zinc-100">
              <div className="h-3 rounded-md bg-cyan-600" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileSummary({ dashboardData, user }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-cyan-700">Hồ sơ học viên</p>
      <h2 className="mt-2 text-2xl font-bold">{user.name}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Mục tiêu" value={user.goal} />
        <Info label="Trình độ gợi ý" value={user.level} />
        <Info label="XP" value={(dashboardData?.xp || 0).toLocaleString('vi-VN')} />
        <Info label="Thời gian học" value={`${dashboardData?.studyMinutes || 0} phút`} />
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
