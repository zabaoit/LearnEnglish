export const goals = ['Giao tiếp', 'Thi cử', 'Đi làm', 'Du học']

export const levels = [
  { code: 'A1', name: 'Beginner', progress: 100 },
  { code: 'A2', name: 'Elementary', progress: 58 },
  { code: 'B1', name: 'Intermediate', progress: 12 },
  { code: 'B2', name: 'Upper Intermediate', progress: 0 },
]

export const topics = [
  {
    slug: 'travel',
    name: 'Travel',
    nameVi: 'Du lịch',
    level: 'A2',
    wordCount: 20,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    nextStep: 'Nghe hội thoại đặt vé',
  },
  {
    slug: 'family',
    name: 'Family',
    nameVi: 'Gia đình',
    level: 'A1',
    wordCount: 18,
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
    nextStep: 'Đọc đoạn giới thiệu người thân',
  },
  {
    slug: 'work',
    name: 'Work',
    nameVi: 'Công việc',
    level: 'B1',
    wordCount: 24,
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    nextStep: 'Quiz email công sở',
  },
  {
    slug: 'health',
    name: 'Health',
    nameVi: 'Sức khỏe',
    level: 'A2',
    wordCount: 16,
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80',
    nextStep: 'Nghe hội thoại đặt lịch khám',
  },
  {
    slug: 'school',
    name: 'School',
    nameVi: 'Trường học',
    level: 'A1',
    wordCount: 22,
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    nextStep: 'Bài đọc thông báo lớp học',
  },
  {
    slug: 'shopping',
    name: 'Shopping',
    nameVi: 'Mua sắm',
    level: 'A2',
    wordCount: 19,
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
    nextStep: 'Luyện nghe hỏi giá',
  },
]

export const vocabulary = [
  {
    id: 'travel-boarding-pass',
    term: 'boarding pass',
    phonetic: '/bor-ding pas/',
    meaningVi: 'thẻ lên máy bay',
    meaningEn: 'a document that allows a passenger to board a plane',
    partOfSpeech: 'noun',
    level: 'A2',
    topicSlug: 'travel',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
    example: 'Please show your boarding pass at the gate.',
    audioText: 'boarding pass',
    synonyms: ['ticket'],
    antonyms: [],
    collocations: ['print a boarding pass', 'show a boarding pass'],
  },
  {
    id: 'travel-itinerary',
    term: 'itinerary',
    phonetic: '/ai-ti-nuh-re-ri/',
    meaningVi: 'lịch trình',
    meaningEn: 'a plan of a journey',
    partOfSpeech: 'noun',
    level: 'B1',
    topicSlug: 'travel',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
    example: 'Our itinerary includes two museums and a food tour.',
    audioText: 'itinerary',
    synonyms: ['schedule', 'plan'],
    antonyms: [],
    collocations: ['travel itinerary', 'change the itinerary'],
  },
  {
    id: 'travel-reservation',
    term: 'reservation',
    phonetic: '/rez-er-vay-shun/',
    meaningVi: 'sự đặt trước',
    meaningEn: 'an arrangement to keep something for someone',
    partOfSpeech: 'noun',
    level: 'A2',
    topicSlug: 'travel',
    imageUrl: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=900&q=80',
    example: 'I have a reservation for two nights.',
    audioText: 'reservation',
    synonyms: ['booking'],
    antonyms: ['cancellation'],
    collocations: ['make a reservation', 'confirm a reservation'],
  },
  {
    id: 'family-sibling',
    term: 'sibling',
    phonetic: '/sib-ling/',
    meaningVi: 'anh chị em ruột',
    meaningEn: 'a brother or sister',
    partOfSpeech: 'noun',
    level: 'A2',
    topicSlug: 'family',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    example: 'Do you have any siblings?',
    audioText: 'sibling',
    synonyms: ['brother', 'sister'],
    antonyms: [],
    collocations: ['older sibling', 'younger sibling'],
  },
  {
    id: 'work-deadline',
    term: 'deadline',
    phonetic: '/ded-line/',
    meaningVi: 'hạn chót',
    meaningEn: 'the latest time or date to finish something',
    partOfSpeech: 'noun',
    level: 'B1',
    topicSlug: 'work',
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80',
    example: 'The deadline for the report is Friday.',
    audioText: 'deadline',
    synonyms: ['due date'],
    antonyms: [],
    collocations: ['meet a deadline', 'miss a deadline'],
  },
  {
    id: 'work-colleague',
    term: 'colleague',
    phonetic: '/ka-leeg/',
    meaningVi: 'đồng nghiệp',
    meaningEn: 'a person you work with',
    partOfSpeech: 'noun',
    level: 'A2',
    topicSlug: 'work',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    example: 'My colleague helped me prepare the presentation.',
    audioText: 'colleague',
    synonyms: ['coworker'],
    antonyms: [],
    collocations: ['new colleague', 'helpful colleague'],
  },
  {
    id: 'health-appointment',
    term: 'appointment',
    phonetic: '/uh-point-ment/',
    meaningVi: 'cuộc hẹn',
    meaningEn: 'a planned meeting at a specific time',
    partOfSpeech: 'noun',
    level: 'A2',
    topicSlug: 'health',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    example: 'I have a doctor appointment at 9 a.m.',
    audioText: 'appointment',
    synonyms: ['meeting'],
    antonyms: [],
    collocations: ['make an appointment', 'cancel an appointment'],
  },
  {
    id: 'shopping-receipt',
    term: 'receipt',
    phonetic: '/ri-seet/',
    meaningVi: 'hóa đơn',
    meaningEn: 'a printed record of what you bought',
    partOfSpeech: 'noun',
    level: 'A2',
    topicSlug: 'shopping',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    example: 'Keep the receipt in case you need to return it.',
    audioText: 'receipt',
    synonyms: ['proof of purchase'],
    antonyms: [],
    collocations: ['keep a receipt', 'lost receipt'],
  },
]

function topicWords(topicSlug) {
  const words = vocabulary.filter((word) => word.topicSlug === topicSlug)
  return words.length ? words : vocabulary.slice(0, 2)
}

function durationFor(index) {
  const minutes = 1 + (index % 4)
  const seconds = String(15 + ((index * 7) % 45)).padStart(2, '0')
  return `0${minutes}:${seconds}`
}

function generatedTopicPlans() {
  return [
    { topicSlug: 'travel', level: 'A2', title: 'Travel context', titleVi: 'Ngữ cảnh du lịch', setting: 'at the station', task: 'confirm the trip plan' },
    { topicSlug: 'family', level: 'A1', title: 'Family context', titleVi: 'Ngữ cảnh gia đình', setting: 'at home', task: 'talk about a family photo' },
    { topicSlug: 'work', level: 'B1', title: 'Work context', titleVi: 'Ngữ cảnh công việc', setting: 'in a team meeting', task: 'check the project update' },
    { topicSlug: 'health', level: 'A2', title: 'Health context', titleVi: 'Ngữ cảnh sức khỏe', setting: 'at the clinic', task: 'make a short appointment' },
    { topicSlug: 'shopping', level: 'A2', title: 'Shopping context', titleVi: 'Ngữ cảnh mua sắm', setting: 'at the counter', task: 'ask about a purchase' },
  ]
}

const settingDistractors = ['at the station', 'at home', 'in a team meeting', 'at the clinic', 'at the counter', 'in a museum', 'on a video call', 'at the airport gate']
const taskDistractors = ['confirm the trip plan', 'talk about a family photo', 'check the project update', 'make a short appointment', 'ask about a purchase', 'cancel the plan', 'ignore the message', 'buy a new ticket']
const topicDistractors = ['travel', 'family', 'work', 'health', 'shopping']

function pairLabel(primary, secondary) {
  return primary.term === secondary.term ? primary.term : `${primary.term} and ${secondary.term}`
}

function rotateOptions(options, seed) {
  if (options.length < 2) return options
  const offset = seed % options.length
  return [...options.slice(offset), ...options.slice(0, offset)]
}

function makeOptions(answer, distractors, seed = 0, fallback = vocabulary.map((word) => word.term)) {
  const options = Array.from(new Set([answer, ...distractors, ...fallback].filter(Boolean))).slice(0, 4)
  return rotateOptions(options, seed)
}

function listeningTranscript(plan, primary, secondary, index) {
  const scripts = [
    [
      `We are ${plan.setting} and need to ${plan.task}.`,
      `Please remember the word ${primary.term} because it appears in this situation.`,
      `The speaker also mentions ${secondary.term} to complete the message.`,
      `After listening, choose the detail that matches the context.`,
    ],
    [
      `Listen to a short ${plan.topicSlug} message from ${plan.setting}.`,
      `The main action is to ${plan.task}.`,
      `${primary.term} is the key word in the first detail.`,
      `${secondary.term} gives one more clue for the answer.`,
    ],
    [
      `This audio is about ${plan.topicSlug}.`,
      `The speaker is ${plan.setting}.`,
      `The important phrase includes ${primary.term}.`,
      `A second useful word is ${secondary.term}, so listen for both words.`,
    ],
    [
      `In this situation, someone needs to ${plan.task}.`,
      `The place is ${plan.setting}, not a different location.`,
      `The first vocabulary item is ${primary.term}.`,
      `The final clue is ${secondary.term}.`,
    ],
  ]

  return scripts[index % scripts.length]
}

function listeningQuestions(plan, primary, secondary, index) {
  const questionSets = [
    [
      {
        prompt: 'Which word is the main focus of the audio?',
        answer: primary.term,
        options: makeOptions(primary.term, [secondary.term, 'deadline', 'receipt'], index),
      },
      {
        prompt: 'Where does the listening happen?',
        answer: plan.setting,
        options: makeOptions(plan.setting, settingDistractors, index + 1, settingDistractors),
      },
    ],
    [
      {
        prompt: 'What does the speaker need to do?',
        answer: plan.task,
        options: makeOptions(plan.task, taskDistractors, index, taskDistractors),
      },
      {
        prompt: `Which extra word is mentioned after ${primary.term}?`,
        answer: secondary.term,
        options: makeOptions(secondary.term, [primary.term, 'passport', 'receipt'], index + 1),
      },
    ],
    [
      {
        prompt: 'Which topic best matches this audio?',
        answer: plan.topicSlug,
        options: makeOptions(plan.topicSlug, topicDistractors, index, topicDistractors),
      },
      {
        prompt: 'Which sentence matches the message?',
        answer: `The speaker mentions ${pairLabel(primary, secondary)}.`,
        options: makeOptions(`The speaker mentions ${pairLabel(primary, secondary)}.`, ['The speaker only talks about the weather.', 'The speaker asks to skip the lesson.', 'The speaker gives no vocabulary clue.'], index + 2, []),
      },
    ],
    [
      {
        prompt: 'Which detail should you listen for first?',
        answer: primary.term,
        options: makeOptions(primary.term, [secondary.term, 'clinic', 'counter'], index + 3),
      },
      {
        prompt: 'Which action matches the audio?',
        answer: plan.task,
        options: makeOptions(plan.task, taskDistractors, index + 4, taskDistractors),
      },
    ],
  ]

  return questionSets[index % questionSets.length]
}

function readingContent(plan, primary, secondary, index) {
  const contents = [
    `This short ${plan.topicSlug} note happens ${plan.setting}. The learner needs to ${plan.task}. The key word is ${primary.term}, and the second useful word is ${secondary.term}. Read the note carefully and choose the detail that matches the situation.`,
    `A learner reads a ${plan.topicSlug} note ${plan.setting}. The note says to ${plan.task}. It highlights ${primary.term} first, then adds ${secondary.term} as a supporting word.`,
    `The message is connected to ${plan.topicSlug}. It takes place ${plan.setting}, where someone needs to ${plan.task}. The two words to notice are ${pairLabel(primary, secondary)}.`,
    `In this reading, the situation is ${plan.setting}. The main task is to ${plan.task}. Look for ${primary.term} in the first detail and ${secondary.term} in the next clue.`,
  ]

  return contents[index % contents.length]
}

function readingQuestions(plan, primary, secondary, index) {
  const questionSets = [
    [
      {
        prompt: 'Which word is the key word in the note?',
        answer: primary.term,
        options: makeOptions(primary.term, [secondary.term, 'appointment', 'colleague'], index),
      },
      {
        prompt: 'What should the learner do?',
        answer: plan.task,
        options: makeOptions(plan.task, taskDistractors, index + 1, taskDistractors),
      },
    ],
    [
      {
        prompt: 'Where does the note happen?',
        answer: plan.setting,
        options: makeOptions(plan.setting, settingDistractors, index, settingDistractors),
      },
      {
        prompt: 'Which second useful word appears in the note?',
        answer: secondary.term,
        options: makeOptions(secondary.term, [primary.term, 'reservation', 'receipt'], index + 1),
      },
    ],
    [
      {
        prompt: 'Which topic is the note about?',
        answer: plan.topicSlug,
        options: makeOptions(plan.topicSlug, topicDistractors, index, topicDistractors),
      },
      {
        prompt: 'Which pair of words should the learner notice?',
        answer: pairLabel(primary, secondary),
        options: makeOptions(pairLabel(primary, secondary), [`${primary.term} and weather`, `${secondary.term} and museum`, 'ticket and deadline'], index + 2, []),
      },
    ],
    [
      {
        prompt: 'What is the main task in the reading?',
        answer: plan.task,
        options: makeOptions(plan.task, taskDistractors, index + 3, taskDistractors),
      },
      {
        prompt: 'Which word appears in the first detail?',
        answer: primary.term,
        options: makeOptions(primary.term, [secondary.term, 'clinic', 'counter'], index + 4),
      },
    ],
  ]

  return questionSets[index % questionSets.length]
}

function generateListeningLessons() {
  const plans = generatedTopicPlans()

  return Array.from({ length: 48 }, (_item, index) => {
    const plan = plans[index % plans.length]
    const words = topicWords(plan.topicSlug)
    const primary = words[index % words.length]
    const secondary = words[(index + 1) % words.length] || primary
    const number = index + 1
    const transcript = listeningTranscript(plan, primary, secondary, index)

    return {
      id: `listen-${plan.topicSlug}-context-${number}`,
      title: `${plan.title} ${number}`,
      titleVi: `${plan.titleVi} ${number}`,
      level: primary.level || plan.level,
      topicSlug: plan.topicSlug,
      duration: durationFor(index),
      audioText: transcript.join(' '),
      transcript,
      newWordIds: Array.from(new Set([primary.id, secondary.id])),
      questions: listeningQuestions(plan, primary, secondary, index),
    }
  })
}

function generateReadingLessons() {
  const plans = generatedTopicPlans()

  return Array.from({ length: 48 }, (_item, index) => {
    const plan = plans[index % plans.length]
    const words = topicWords(plan.topicSlug)
    const primary = words[index % words.length]
    const secondary = words[(index + 1) % words.length] || primary
    const number = index + 1
    const content = readingContent(plan, primary, secondary, index)

    return {
      id: `read-${plan.topicSlug}-context-${number}`,
      title: `${plan.title} reading ${number}`,
      titleVi: `${plan.titleVi} bài đọc ${number}`,
      level: primary.level || plan.level,
      topicSlug: plan.topicSlug,
      estimatedMinutes: 4 + (index % 5),
      content,
      highlightedWordIds: Array.from(new Set([primary.id, secondary.id])),
      questions: readingQuestions(plan, primary, secondary, index),
    }
  })
}

export const listeningLessons = [
  {
    id: 'listen-travel-ticket',
    title: 'Booking a train ticket',
    titleVi: 'Đặt vé tàu',
    level: 'A2',
    topicSlug: 'travel',
    duration: '02:10',
    audioText:
      'Hello, I would like to book a ticket to Da Nang. Do you need a one-way ticket or a return ticket? A return ticket, please. Can I see your passport and your travel date?',
    transcript: [
      'Hello, I would like to book a ticket to Da Nang.',
      'Do you need a one-way ticket or a return ticket?',
      'A return ticket, please.',
      'Can I see your passport and your travel date?',
    ],
    newWordIds: ['travel-reservation', 'travel-boarding-pass'],
    questions: [
      {
        prompt: 'What does the customer want to book?',
        answer: 'A train ticket',
        options: ['A hotel room', 'A train ticket', 'A taxi'],
      },
      {
        prompt: 'The customer asks for a return ticket.',
        answer: 'True',
        options: ['True', 'False'],
      },
    ],
  },
  {
    id: 'listen-health-appointment',
    title: 'Making a doctor appointment',
    titleVi: 'Đặt lịch khám',
    level: 'A2',
    topicSlug: 'health',
    duration: '01:45',
    audioText:
      'Good morning. I need to make an appointment. What symptoms do you have? I have a fever and a sore throat.',
    transcript: [
      'Good morning. I need to make an appointment.',
      'What symptoms do you have?',
      'I have a fever and a sore throat.',
    ],
    newWordIds: ['health-appointment'],
    questions: [
      {
        prompt: 'Which symptom is mentioned?',
        answer: 'A fever',
        options: ['A fever', 'A broken arm', 'A headache only'],
      },
    ],
  },
  ...generateListeningLessons(),
]

export const readingLessons = [
  {
    id: 'read-travel-email',
    title: 'A short travel email',
    titleVi: 'Email du lịch ngắn',
    level: 'A2',
    topicSlug: 'travel',
    estimatedMinutes: 6,
    content:
      'Hi Linh, our itinerary is ready. We will arrive at the airport at 8 a.m. Please print your boarding pass before you leave home. The hotel reservation is under my name. See you soon!',
    highlightedWordIds: ['travel-itinerary', 'travel-boarding-pass', 'travel-reservation'],
    questions: [
      {
        prompt: 'What should Linh print before leaving home?',
        answer: 'boarding pass',
        options: ['receipt', 'boarding pass', 'assignment'],
      },
      {
        prompt: 'The hotel reservation is under Linh name.',
        answer: 'False',
        options: ['True', 'False', 'Not given'],
      },
    ],
  },
  {
    id: 'read-work-update',
    title: 'A project update',
    titleVi: 'Cập nhật dự án',
    level: 'B1',
    topicSlug: 'work',
    estimatedMinutes: 8,
    content:
      'The team has a new deadline for the product report. Each colleague will review one section and send comments by Thursday. The manager will submit the final file on Friday morning.',
    highlightedWordIds: ['work-deadline', 'work-colleague'],
    questions: [
      {
        prompt: 'When will the manager submit the final file?',
        answer: 'Friday morning',
        options: ['Thursday night', 'Friday morning', 'Monday afternoon'],
      },
    ],
  },
  ...generateReadingLessons(),
]

export const quizzes = [
  {
    id: 'quiz-travel-a2',
    title: 'Travel A2 mini test',
    titleVi: 'Kiểm tra nhanh Travel A2',
    level: 'A2',
    topicSlug: 'travel',
    questionCount: 4,
    questions: [
      {
        prompt: 'Choose the Vietnamese meaning of "reservation".',
        answer: 'sự đặt trước',
        options: ['hạn chót', 'sự đặt trước', 'triệu chứng', 'hóa đơn'],
        explanation: '"Reservation" là việc giữ chỗ trước, thường dùng khi đặt phòng, đặt bàn hoặc đặt vé.',
        relatedWordId: 'travel-reservation',
        reviewTarget: 'reservation',
        reviewType: 'Vocabulary',
        skill: 'Vocabulary',
      },
      {
        prompt: 'Complete: Please show your ___ at the gate.',
        answer: 'boarding pass',
        options: ['receipt', 'boarding pass', 'colleague', 'assignment'],
        explanation: 'Ở cổng lên máy bay, hành khách cần xuất trình "boarding pass".',
        relatedWordId: 'travel-boarding-pass',
        reviewTarget: 'boarding pass',
        reviewType: 'Context',
        skill: 'Context',
      },
      {
        prompt: 'Which word means "a plan of a journey"?',
        answer: 'itinerary',
        options: ['itinerary', 'discount', 'sibling', 'appointment'],
        explanation: '"Itinerary" là lịch trình hoặc kế hoạch của một chuyến đi.',
        relatedWordId: 'travel-itinerary',
        reviewTarget: 'itinerary',
        reviewType: 'Meaning',
        skill: 'Meaning',
      },
      {
        prompt: 'Match "make a reservation" with the closest meaning.',
        answer: 'book something in advance',
        options: ['arrive late', 'book something in advance', 'miss a deadline'],
        explanation: '"Make a reservation" nghĩa là đặt trước để giữ chỗ hoặc giữ dịch vụ.',
        relatedWordId: 'travel-reservation',
        reviewTarget: 'make a reservation',
        reviewType: 'Collocation',
        skill: 'Collocation',
      },
    ],
  },
  {
    id: 'quiz-work-b1',
    title: 'Work B1 checkpoint',
    titleVi: 'Chặng kiểm tra Work B1',
    level: 'B1',
    topicSlug: 'work',
    questionCount: 3,
    questions: [
      {
        prompt: 'A person you work with is a...',
        answer: 'colleague',
        options: ['receipt', 'colleague', 'appointment'],
        explanation: '"Colleague" là người làm việc cùng bạn trong cùng công ty hoặc nhóm.',
        relatedWordId: 'work-colleague',
        reviewTarget: 'colleague',
        reviewType: 'Vocabulary',
        skill: 'Vocabulary',
      },
      {
        prompt: 'What collocation is natural?',
        answer: 'meet a deadline',
        options: ['eat a deadline', 'meet a deadline', 'sleep a deadline'],
        explanation: 'Cụm tự nhiên là "meet a deadline", nghĩa là hoàn thành đúng hạn.',
        relatedWordId: 'work-deadline',
        reviewTarget: 'meet a deadline',
        reviewType: 'Collocation',
        skill: 'Collocation',
      },
      {
        prompt: '"Deadline" means...',
        answer: 'hạn chót',
        options: ['hạn chót', 'lịch trình', 'cuộc hẹn'],
        explanation: '"Deadline" là thời điểm cuối cùng cần hoàn thành một việc.',
        relatedWordId: 'work-deadline',
        reviewTarget: 'deadline',
        reviewType: 'Meaning',
        skill: 'Meaning',
      },
    ],
  },
]

export const roadmap = [
  {
    level: 'A1',
    unlocked: true,
    lessons: ['Family basics', 'School objects', 'Shopping prices'],
    target: '50 từ nền tảng và 5 bài nghe ngắn.',
  },
  {
    level: 'A2',
    unlocked: true,
    lessons: ['Travel routines', 'Health appointments', 'Daily shopping'],
    target: '120 từ, transcript có highlight, quiz sau mỗi chủ đề.',
  },
  {
    level: 'B1',
    unlocked: false,
    lessons: ['Work updates', 'Simple articles', 'Email reading'],
    target: '250 từ, đọc hiểu ý chính và chi tiết.',
  },
  {
    level: 'B2',
    unlocked: false,
    lessons: ['Opinion listening', 'News reading', 'Integrated mock test'],
    target: '500 từ, làm mock test CEFR theo kỹ năng.',
  },
]

export const placementQuestions = [
  {
    prompt: 'Bạn hiểu câu nào tự nhiên nhất để giới thiệu bản thân?',
    skill: 'Grammar',
    options: [
      { label: 'I am Linh. I am from Da Nang.', level: 'A1' },
      { label: 'I have lived in Da Nang for three years.', level: 'A2' },
      { label: 'I moved to Da Nang because the job market suited my goals.', level: 'B1' },
      { label: 'Having relocated to Da Nang, I found the job market aligned with my long-term goals.', level: 'B2' },
    ],
  },
  {
    prompt: 'Chọn câu thể hiện kế hoạch tương lai rõ nhất.',
    skill: 'Communication',
    options: [
      { label: 'Tomorrow I study English.', level: 'A1' },
      { label: 'I am going to study English tomorrow evening.', level: 'A2' },
      { label: 'I plan to review my notes before joining the speaking class.', level: 'B1' },
      { label: 'I intend to consolidate my notes before participating in the speaking workshop.', level: 'B2' },
    ],
  },
  {
    prompt: 'Khi đọc email công việc, bạn thoải mái nhất với nội dung nào?',
    skill: 'Reading',
    options: [
      { label: 'Tên người gửi, ngày giờ, lời chào ngắn.', level: 'A1' },
      { label: 'Lịch họp, địa điểm, việc cần chuẩn bị.', level: 'A2' },
      { label: 'Cập nhật dự án, hạn chót, phân công nhiệm vụ.', level: 'B1' },
      { label: 'Quan điểm, rủi ro, đề xuất và lý do thay đổi kế hoạch.', level: 'B2' },
    ],
  },
  {
    prompt: 'Bạn nghe hiểu tốt nhất kiểu audio nào?',
    skill: 'Listening',
    options: [
      { label: 'Từ đơn và câu chào hỏi chậm.', level: 'A1' },
      { label: 'Hội thoại ngắn về mua sắm, du lịch, đặt lịch.', level: 'A2' },
      { label: 'Cuộc trao đổi công việc có vài chi tiết và mốc thời gian.', level: 'B1' },
      { label: 'Thảo luận có lập luận, ví dụ và quan điểm trái chiều.', level: 'B2' },
    ],
  },
]

export const dailyPlans = [
  {
    day: 'Hôm nay',
    title: 'Travel A2',
    level: 'A2',
    newWords: 10,
    reviewWords: 10,
    focus: 'boarding pass, reservation, itinerary',
    action: 'Học flashcard rồi làm quiz Travel A2',
  },
  {
    day: 'Ngày mai',
    title: 'Family A1',
    level: 'A1',
    newWords: 5,
    reviewWords: 10,
    focus: 'sibling và các từ đã sai hôm nay',
    action: 'Ôn từ khó trước khi thêm từ mới',
  },
  {
    day: 'Tuần này',
    title: 'Hoàn thành Family',
    level: 'A1',
    newWords: 18,
    reviewWords: 30,
    focus: 'từ gia đình, giới thiệu người thân',
    action: 'Kết thúc bằng mini quiz cuối tuần',
  },
]

export const reviewSignals = [
  {
    wordId: 'travel-itinerary',
    reason: 'Sai câu chọn nghĩa 2 lần',
    due: 'Hôm nay',
    strength: 'weak',
    nextAction: 'Lật thẻ rồi tự đặt 1 câu với itinerary.',
  },
  {
    wordId: 'work-deadline',
    reason: 'Hay nhầm collocation meet/miss a deadline',
    due: 'Hôm nay',
    strength: 'weak',
    nextAction: 'Ôn cặp meet a deadline và miss a deadline.',
  },
  {
    wordId: 'health-appointment',
    reason: 'Chưa nghe lại sau bài listening',
    due: 'Ngày mai',
    strength: 'medium',
    nextAction: 'Nghe phát âm rồi làm câu nghe chọn đáp án.',
  },
]

export const dashboard = {
  learnedWords: 86,
  reviewWords: 14,
  recentQuizScore: 82,
  studyMinutes: 340,
  streakDays: 9,
  xp: 2460,
  skillProgress: {
    vocabulary: 64,
    listening: 48,
    reading: 42,
  },
  levelProgress: {
    A1: 100,
    A2: 58,
    B1: 12,
    B2: 0,
  },
}

export const adminModules = [
  'Quản lý chủ đề',
  'Quản lý từ vựng',
  'Quản lý cấp độ CEFR',
  'Quản lý bài nghe',
  'Quản lý bài đọc',
  'Quản lý câu hỏi quiz',
  'Quản lý người dùng',
  'Thống kê học tập',
  'Quản lý audio, transcript, hình ảnh',
  'Quản lý file lưu trữ',
]
