import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from './services/api'
import { goals, levels, topics } from './data/learningData'

const adminResources = [
  {
    id: 'topics',
    label: 'Chủ đề',
    titleField: 'nameVi',
    subtitleField: 'slug',
    fields: [
      { name: 'slug', label: 'Slug' },
      { name: 'name', label: 'Tên tiếng Anh' },
      { name: 'nameVi', label: 'Tên tiếng Việt' },
      { name: 'level', label: 'Trình độ', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1'] },
      { name: 'wordCount', label: 'Số từ', type: 'number' },
      { name: 'imageUrl', label: 'Ảnh chủ đề' },
    ],
  },
  {
    id: 'vocabulary',
    label: 'Từ vựng',
    titleField: 'term',
    subtitleField: 'meaningVi',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'term', label: 'Từ vựng' },
      { name: 'phonetic', label: 'Phiên âm' },
      { name: 'meaningVi', label: 'Nghĩa tiếng Việt' },
      { name: 'meaningEn', label: 'Nghĩa tiếng Anh', type: 'textarea' },
      { name: 'partOfSpeech', label: 'Từ loại' },
      { name: 'level', label: 'Trình độ', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1'] },
      { name: 'topicSlug', label: 'Chủ đề' },
      { name: 'imageUrl', label: 'Ảnh từ vựng Cloudinary' },
      { name: 'audioText', label: 'Text phát âm' },
      { name: 'example', label: 'Câu ví dụ', type: 'textarea' },
    ],
  },
  {
    id: 'bulk-vocabulary',
    label: 'Nhập từ hàng loạt',
    custom: true,
  },
  {
    id: 'levels',
    label: 'Cấp độ',
    titleField: 'code',
    subtitleField: 'name',
    fields: [
      { name: 'code', label: 'Mã cấp độ' },
      { name: 'name', label: 'Tên' },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
      { name: 'order', label: 'Thứ tự', type: 'number' },
    ],
  },
  {
    id: 'listening',
    label: 'Bài nghe',
    titleField: 'titleVi',
    subtitleField: 'title',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'title', label: 'Tiêu đề tiếng Anh' },
      { name: 'titleVi', label: 'Tiêu đề tiếng Việt' },
      { name: 'level', label: 'Trình độ', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1'] },
      { name: 'topicSlug', label: 'Chủ đề' },
      { name: 'duration', label: 'Thời lượng' },
      { name: 'audioUrl', label: 'File audio listening' },
      { name: 'audioText', label: 'Transcript/audio text', type: 'textarea' },
    ],
  },
  {
    id: 'reading',
    label: 'Bài đọc',
    titleField: 'titleVi',
    subtitleField: 'title',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'title', label: 'Tiêu đề tiếng Anh' },
      { name: 'titleVi', label: 'Tiêu đề tiếng Việt' },
      { name: 'level', label: 'Trình độ', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1'] },
      { name: 'topicSlug', label: 'Chủ đề' },
      { name: 'estimatedMinutes', label: 'Số phút', type: 'number' },
      { name: 'content', label: 'Nội dung', type: 'textarea' },
    ],
  },
  {
    id: 'quizzes',
    label: 'Quiz',
    titleField: 'titleVi',
    subtitleField: 'title',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'title', label: 'Tiêu đề tiếng Anh' },
      { name: 'titleVi', label: 'Tiêu đề tiếng Việt' },
      { name: 'level', label: 'Trình độ', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1'] },
      { name: 'topicSlug', label: 'Chủ đề' },
    ],
  },
  {
    id: 'quiz-questions',
    label: 'Câu hỏi quiz',
    titleField: 'prompt',
    subtitleField: 'quizTitle',
    fields: [
      { name: 'quizId', label: 'Quiz ID' },
      { name: 'prompt', label: 'Câu hỏi', type: 'textarea' },
      { name: 'answer', label: 'Đáp án đúng' },
      { name: 'optionsText', label: 'Các lựa chọn, mỗi dòng một đáp án', type: 'textarea' },
      { name: 'explanation', label: 'Giải thích đáp án', type: 'textarea' },
      { name: 'relatedWordId', label: 'Từ vựng liên quan' },
      { name: 'reviewTarget', label: 'Mục cần ôn' },
      { name: 'reviewType', label: 'Loại mục ôn' },
      { name: 'skill', label: 'Kỹ năng' },
    ],
  },
  {
    id: 'users',
    label: 'Người dùng',
    titleField: 'name',
    subtitleField: 'email',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'name', label: 'Họ tên' },
      { name: 'email', label: 'Email' },
      { name: 'role', label: 'Role', type: 'select', options: ['student', 'admin'] },
      { name: 'goal', label: 'Mục tiêu' },
      { name: 'level', label: 'Trình độ', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1'] },
      { name: 'status', label: 'Trạng thái', type: 'select', options: ['active', 'locked'] },
      { name: 'avatarUrl', label: 'Avatar Cloudinary' },
    ],
  },
  {
    id: 'assets',
    label: 'File lưu trữ',
    titleField: 'category',
    subtitleField: 'url',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'category', label: 'Loại file', type: 'select', options: ['vocabulary_image', 'avatar', 'listening_audio', 'learning_document'] },
      { name: 'provider', label: 'Provider', type: 'select', options: ['cloudinary', 'external'] },
      { name: 'resourceType', label: 'Resource type', type: 'select', options: ['image', 'audio', 'raw'] },
      { name: 'url', label: 'URL' },
      { name: 'ownerType', label: 'Gắn với' },
      { name: 'ownerId', label: 'Owner ID' },
    ],
  },
  {
    id: 'import-logs',
    label: 'Nhật ký import',
    titleField: 'createdAt',
    subtitleField: 'actor',
    fields: [
      { name: 'id', label: 'ID' },
      { name: 'actor', label: 'Người import' },
      { name: 'createdAt', label: 'Thời gian' },
      { name: 'sourceType', label: 'Nguồn' },
      { name: 'fileName', label: 'Tên file' },
      { name: 'topicSlug', label: 'Chủ đề' },
      { name: 'level', label: 'Trình độ' },
      { name: 'duplicateStrategy', label: 'Xử lý trùng' },
      { name: 'createdCount', label: 'Đã thêm', type: 'number' },
      { name: 'updatedCount', label: 'Đã cập nhật', type: 'number' },
      { name: 'skippedCount', label: 'Đã bỏ qua', type: 'number' },
      { name: 'errorCount', label: 'Số lỗi', type: 'number' },
      { name: 'autoQuizId', label: 'Quiz tự động' },
      { name: 'autoQuizQuestionCount', label: 'Số câu quiz tự tạo', type: 'number' },
    ],
  },
]

const uploadCategories = [
  { id: 'vocabulary_image', label: 'Ảnh từ vựng' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'listening_audio', label: 'Audio listening' },
  { id: 'learning_document', label: 'Tài liệu học' },
]

const learningContentResources = new Set(['vocabulary', 'topics', 'levels', 'listening', 'reading', 'quizzes', 'quiz-questions'])

function AdminPanel({ authForm, authMessage, authMode, onLearningContentUpdated, setAuthMode, submitAuth, updateAuthForm, user }) {
  const [activeResource, setActiveResource] = useState('bulk-vocabulary')
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadCategory, setUploadCategory] = useState('vocabulary_image')
  const [publicId, setPublicId] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [bulkText, setBulkText] = useState('hello - xin chào\none - số một\nbook - quyển sách\napple - quả táo')
  const [bulkTopic, setBulkTopic] = useState('travel')
  const [bulkLevel, setBulkLevel] = useState('A1')
  const [bulkDuplicateStrategy, setBulkDuplicateStrategy] = useState('skip')
  const [bulkFileName, setBulkFileName] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkMessage, setBulkMessage] = useState('')
  const [adminTopics, setAdminTopics] = useState(topics)
  const [adminLevels, setAdminLevels] = useState(levels)

  const resource = useMemo(
    () => adminResources.find((item) => item.id === activeResource) || adminResources[0],
    [activeResource],
  )

  const isAdmin = user?.role === 'admin'

  const refreshSummary = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/summary')
      setSummary(data.summary)
    } catch (error) {
      setMessage(error.message)
    }
  }, [])

  const refreshItems = useCallback(async (resourceId = activeResource) => {
    try {
      const data = await apiRequest(`/admin/${resourceId}`)
      setItems(data.items || [])
    } catch (error) {
      setMessage(error.message)
    }
  }, [activeResource])

  const refreshBulkTaxonomy = useCallback(async () => {
    try {
      const [topicData, levelData] = await Promise.all([
        apiRequest('/learning/topics'),
        apiRequest('/learning/levels'),
      ])
      if (topicData.topics?.length) setAdminTopics(topicData.topics)
      if (levelData.levels?.length) setAdminLevels(levelData.levels)
    } catch {
      setAdminTopics(topics)
      setAdminLevels(levels)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    refreshSummary()
    refreshBulkTaxonomy()
  }, [isAdmin, refreshSummary, refreshBulkTaxonomy])

  useEffect(() => {
    if (adminTopics.length && !adminTopics.some((topic) => topic.slug === bulkTopic)) {
      setBulkTopic(adminTopics[0].slug)
    }
  }, [adminTopics, bulkTopic])

  useEffect(() => {
    if (adminLevels.length && !adminLevels.some((level) => level.code === bulkLevel)) {
      setBulkLevel(adminLevels[0].code)
    }
  }, [adminLevels, bulkLevel])

  useEffect(() => {
    setForm(emptyForm(resource))
    setEditingId('')
    if (resource.custom) {
      setItems([])
      return
    }
    if (!isAdmin) return
    refreshItems(resource.id)
  }, [isAdmin, refreshItems, resource])

  async function previewBulkVocabulary() {
    try {
      const data = await apiRequest('/admin/vocabulary/bulk/preview', {
        method: 'POST',
        body: JSON.stringify({ text: bulkText, topicSlug: bulkTopic }),
      })
      setBulkResult(data.result)
      setBulkMessage('Đã kiểm tra dữ liệu.')
    } catch (error) {
      setBulkMessage(error.message)
      if (error.result) setBulkResult(error.result)
    }
  }

  async function importBulkVocabulary() {
    try {
      const data = await apiRequest('/admin/vocabulary/bulk/import', {
        method: 'POST',
        body: JSON.stringify({
          text: bulkText,
          topicSlug: bulkTopic,
          level: bulkLevel,
          duplicateStrategy: bulkDuplicateStrategy,
          sourceType: bulkFileName ? 'file' : 'textarea',
          fileName: bulkFileName,
        }),
      })
      setBulkResult(data.result)
      setBulkMessage(`Đã thêm ${data.created.length} từ, cập nhật ${data.updated.length} từ, bỏ qua ${data.skipped.length} từ trùng. Tạo ${data.autoQuiz?.added || 0} câu quiz tự động.`)
      await refreshSummary()
      await onLearningContentUpdated?.({ topicSlug: bulkTopic, level: bulkLevel, quizId: data.autoQuiz?.quizId, openVocabulary: true })
    } catch (error) {
      setBulkMessage(error.message)
    }
  }

  async function saveItem(event) {
    event.preventDefault()
    const payload = normalizeForm(resource, form)
    const path = editingId ? `/admin/${resource.id}/${encodeURIComponent(editingId)}` : `/admin/${resource.id}`

    try {
      await apiRequest(path, {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      })
      setMessage(editingId ? 'Đã cập nhật nội dung.' : 'Đã thêm nội dung.')
      setEditingId('')
      setForm(emptyForm(resource))
      await refreshItems(resource.id)
      await refreshSummary()
      if (['topics', 'levels'].includes(resource.id)) await refreshBulkTaxonomy()
      if (learningContentResources.has(resource.id)) {
        await onLearningContentUpdated?.({
          level: payload.level,
          quizId: payload.quizId || (resource.id === 'quizzes' ? payload.id : ''),
          topicSlug: payload.topicSlug,
        })
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function deleteItem(item) {
    const id = itemIdentity(resource, item)

    try {
      await apiRequest(`/admin/${resource.id}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setMessage('Đã xóa nội dung.')
      await refreshItems(resource.id)
      await refreshSummary()
      if (['topics', 'levels'].includes(resource.id)) await refreshBulkTaxonomy()
      if (learningContentResources.has(resource.id)) await onLearningContentUpdated?.()
    } catch (error) {
      setMessage(error.message)
    }
  }

  function editItem(item) {
    setEditingId(itemIdentity(resource, item))
    setForm(formFromItem(resource, item))
  }

  async function uploadFile(event) {
    event.preventDefault()
    if (!selectedFile) {
      setUploadMessage('Chọn file trước khi upload.')
      return
    }

    try {
      const data = await apiRequest('/admin/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({ category: uploadCategory, publicId: publicId || undefined }),
      })
      const signature = data.signature
      const uploadForm = new FormData()
      uploadForm.append('file', selectedFile)
      uploadForm.append('api_key', signature.apiKey)
      uploadForm.append('timestamp', signature.timestamp)
      uploadForm.append('signature', signature.signature)
      uploadForm.append('folder', signature.folder)
      if (signature.publicId) uploadForm.append('public_id', signature.publicId)

      const uploadResponse = await fetch(signature.uploadUrl, {
        method: 'POST',
        body: uploadForm,
      })
      const uploadResult = await uploadResponse.json()
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error?.message || 'Upload Cloudinary chưa thành công.')
      }

      await apiRequest('/admin/assets', {
        method: 'POST',
        body: JSON.stringify({
          category: uploadCategory,
          provider: 'cloudinary',
          resourceType: signature.resourceType === 'video' ? 'audio' : signature.resourceType,
          url: uploadResult.secure_url,
          ownerType: uploadCategory === 'avatar' ? 'user' : uploadCategory === 'vocabulary_image' ? 'vocabulary' : 'lesson',
          ownerId: publicId || uploadResult.public_id,
        }),
      })

      setUploadMessage('Upload xong và đã lưu metadata file.')
      setSelectedFile(null)
      setPublicId('')
      if (activeResource === 'assets') await refreshItems('assets')
      await refreshSummary()
    } catch (error) {
      setUploadMessage(error.message)
    }
  }

  if (!isAdmin) {
    return (
      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <AdminGate
          authForm={authForm}
          authMessage={authMessage}
          authMode={authMode}
          setAuthMode={setAuthMode}
          submitAuth={submitAuth}
          updateAuthForm={updateAuthForm}
        />
        <AdminOverview locked />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Admin workspace</p>
        <h2 className="mt-2 text-2xl font-bold">Quản lý nội dung học tập</h2>
        <p className="mt-2 text-zinc-700">Đang đăng nhập bằng role {user.role}: {user.email}</p>
      </div>

      <AdminOverview summary={summary} />

      <div className="grid gap-6 lg:grid-cols-[0.3fr_0.7fr]">
        <aside className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-600">Danh mục quản lý</p>
          <div className="mt-4 space-y-2">
            {adminResources.map((item) => (
              <button
                className={`w-full rounded-md border px-3 py-2 text-left font-semibold ${activeResource === item.id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 hover:border-emerald-500'}`}
                key={item.id}
                onClick={() => setActiveResource(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          {resource.id === 'bulk-vocabulary' ? (
            <BulkVocabularyImport
              bulkLevel={bulkLevel}
              bulkMessage={bulkMessage}
              bulkResult={bulkResult}
              bulkText={bulkText}
              bulkTopic={bulkTopic}
              levels={adminLevels}
              topics={adminTopics}
              bulkDuplicateStrategy={bulkDuplicateStrategy}
              bulkFileName={bulkFileName}
              importBulkVocabulary={importBulkVocabulary}
              previewBulkVocabulary={previewBulkVocabulary}
              setBulkDuplicateStrategy={setBulkDuplicateStrategy}
              setBulkFileName={setBulkFileName}
              setBulkLevel={setBulkLevel}
              setBulkResult={setBulkResult}
              setBulkText={setBulkText}
              setBulkTopic={setBulkTopic}
            />
          ) : (
            <>
              <ResourceEditor
                editingId={editingId}
                form={form}
                message={message}
                resource={resource}
                saveItem={saveItem}
                setEditingId={setEditingId}
                setForm={setForm}
              />
              <ResourceList
                editItem={editItem}
                deleteItem={deleteItem}
                items={items}
                resource={resource}
              />
              <UploadManager
                publicId={publicId}
                selectedFile={selectedFile}
                setPublicId={setPublicId}
                setSelectedFile={setSelectedFile}
                setUploadCategory={setUploadCategory}
                uploadCategory={uploadCategory}
                uploadFile={uploadFile}
                uploadMessage={uploadMessage}
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function BulkVocabularyImport({
  bulkLevel,
  bulkMessage,
  bulkResult,
  bulkText,
  bulkTopic,
  levels,
  topics,
  bulkDuplicateStrategy,
  bulkFileName,
  importBulkVocabulary,
  previewBulkVocabulary,
  setBulkDuplicateStrategy,
  setBulkFileName,
  setBulkLevel,
  setBulkResult,
  setBulkText,
  setBulkTopic,
}) {
  const canSave = bulkResult?.errorCount === 0 && bulkResult?.validCount > 0
  const selectedTopic = topics.find((topic) => topic.slug === bulkTopic)
  const selectedLevel = levels.find((level) => level.code === bulkLevel)

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Import Vocabulary</p>
        <h2 className="mt-2 text-2xl font-bold">Nhập từ vựng hàng loạt</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Hỗ trợ dấu -, dấu |, CSV đơn giản, và mẫu mở rộng: từ - nghĩa - phiên âm - ví dụ.
        </p>
        <ImportGuideNotice />
        <div className="mt-4 rounded-md border border-zinc-200 bg-[#FBFDFC] p-3 text-sm text-zinc-700">
          hello - xin chào<br />
          one | số một<br />
          book - quyển sách - /bʊk/ - This is my book.
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <label>
            <span className="mb-1 block text-sm font-semibold text-zinc-600">Chủ đề</span>
            <select className="w-full rounded-md border border-zinc-300 px-3 py-2" value={bulkTopic} onChange={(event) => setBulkTopic(event.target.value)}>
              {topics.map((topic) => <option key={topic.slug} value={topic.slug}>{topic.nameVi || topic.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-zinc-600">Trình độ</span>
            <select className="w-full rounded-md border border-zinc-300 px-3 py-2" value={bulkLevel} onChange={(event) => setBulkLevel(event.target.value)}>
              {levels.map((level) => <option key={level.code} value={level.code}>{level.code}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-zinc-600">Nếu từ bị trùng</span>
            <select className="w-full rounded-md border border-zinc-300 px-3 py-2" value={bulkDuplicateStrategy} onChange={(event) => setBulkDuplicateStrategy(event.target.value)}>
              <option value="skip">Bỏ qua</option>
              <option value="update">Cập nhật</option>
              <option value="overwrite">Ghi đè</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-zinc-600">Nhập file .txt/.csv</span>
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2" accept=".txt,.csv,text/plain,text/csv" onChange={(event) => readBulkFile(event, setBulkText, setBulkFileName, setBulkResult)} type="file" />
          </label>
        </div>
        <p className="mt-3 rounded-md bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900">
          Từ hợp lệ sẽ được gắn vào chủ đề {selectedTopic?.nameVi || selectedTopic?.name || bulkTopic} và trình độ {selectedLevel?.code || bulkLevel}.
        </p>
        {bulkFileName && <p className="mt-3 text-sm font-semibold text-zinc-600">File đang dùng: {bulkFileName}</p>}

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-zinc-600">Danh sách từ vựng</span>
          <textarea
            className="min-h-72 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
            onChange={(event) => {
              setBulkText(event.target.value)
              setBulkResult(null)
            }}
            placeholder={'hello - xin chào\none - số một'}
            value={bulkText}
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-md border border-zinc-300 px-4 py-2 font-semibold" onClick={previewBulkVocabulary} type="button">
            Kiểm tra dữ liệu
          </button>
          <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300" disabled={!canSave} onClick={importBulkVocabulary} type="button">
            Lưu danh sách
          </button>
        </div>
        {bulkMessage && <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{bulkMessage}</p>}
      </div>

      <BulkVocabularyPreview result={bulkResult} />
    </section>
  )
}

function ImportGuideNotice() {
  return (
    <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
      <p className="font-bold">Cách import file để người học học được ngay</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="font-semibold">File cần có</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Định dạng `.txt` hoặc `.csv`.</li>
            <li>Mỗi dòng là một từ vựng.</li>
            <li>Bắt buộc có: từ tiếng Anh và nghĩa tiếng Việt.</li>
            <li>Có thể thêm: phiên âm và câu ví dụ.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Các bước import</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Chọn chủ đề và trình độ CEFR.</li>
            <li>Chọn cách xử lý từ trùng.</li>
            <li>Dán nội dung hoặc chọn file.</li>
            <li>Bấm `Kiểm tra dữ liệu`, sửa các dòng lỗi.</li>
            <li>Bấm `Lưu danh sách` để đưa từ vào flashcard và quiz.</li>
          </ol>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-white/80 p-3 font-mono text-xs text-zinc-800">
        hello - xin chào<br />
        book - quyển sách - /bʊk/ - This is my book.<br />
        apple | quả táo
      </div>
    </div>
  )
}

function BulkVocabularyPreview({ result }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-600">Preview</p>
        <h2 className="mt-2 text-2xl font-bold">Chưa có dữ liệu kiểm tra</h2>
      </div>
    )
  }

  const rows = result.rows || result.parsed || []

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-emerald-700">Preview kết quả tách dòng</p>
      <h2 className="mt-2 text-2xl font-bold">{result.validCount} dòng hợp lệ · {result.errorCount} lỗi · {result.duplicateCount} trùng · {result.ignoredCount || 0} dòng rỗng</h2>

      {result.errors.length > 0 && (
        <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4">
          <p className="font-bold text-rose-800">Dòng sai định dạng</p>
          <div className="mt-3 space-y-2">
            {result.errors.map((error) => (
              <p className="text-sm text-rose-800" key={`${error.line}-${error.message}`}>
                Dòng {error.line}: {error.message} {error.raw ? `(${error.raw})` : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {result.duplicates.length > 0 && (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900">Từ đã tồn tại</p>
          <div className="mt-3 space-y-2">
            {result.duplicates.map((item) => (
              <p className="text-sm text-amber-900" key={`${item.line}-${item.term}`}>
                Dòng {item.line}: {item.term} - {item.meaningVi}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-md border border-zinc-200">
        <div className="grid min-w-[760px] grid-cols-[70px_1fr_1fr_1fr_1fr] bg-zinc-100 px-3 py-2 text-sm font-bold">
          <span>Dòng</span>
          <span>Từ tiếng Anh</span>
          <span>Nghĩa</span>
          <span>Phiên âm / ví dụ</span>
          <span>Trạng thái</span>
        </div>
        {rows.map((item) => (
          <div className="grid min-w-[760px] grid-cols-[70px_1fr_1fr_1fr_1fr] border-t border-zinc-200 px-3 py-2 text-sm" key={`${item.line}-${item.raw || item.term || item.message}`}>
            <span>{item.line}</span>
            <span className="font-semibold">{item.term || '-'}</span>
            <span>{item.meaningVi || '-'}</span>
            <span>{[item.phonetic, item.example].filter(Boolean).join(' · ') || '-'}</span>
            <span className={statusClassName(item.status)}>{statusLabel(item.status)}: {item.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminGate({ authForm, authMessage, authMode, setAuthMode, submitAuth, updateAuthForm }) {
  function useDemoAdmin() {
    setAuthMode('login')
    updateAuthForm('email', 'admin@learnenglish.local')
    updateAuthForm('password', 'admin123')
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-emerald-700">Role admin</p>
      <h2 className="mt-2 text-2xl font-bold">Đăng nhập để quản lý</h2>
      <p className="mt-2 text-sm text-zinc-600">Đăng nhập admin để mở màn Nhập từ vựng hàng loạt. Tài khoản demo: admin@learnenglish.local / admin123</p>
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
        <button className="w-full rounded-md border border-zinc-300 px-4 py-2 font-semibold" type="button" onClick={useDemoAdmin}>
          Điền tài khoản admin demo
        </button>
        {authMessage && <p className="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{authMessage}</p>}
      </form>
    </div>
  )
}

function AdminOverview({ locked, summary }) {
  const cards = [
    ['levels', 'Cấp độ'],
    ['topics', 'Chủ đề'],
    ['vocabulary', 'Từ vựng'],
    ['listening', 'Bài nghe'],
    ['reading', 'Bài đọc'],
    ['quizzes', 'Quiz'],
    ['quizQuestions', 'Câu hỏi'],
    ['users', 'Người dùng'],
    ['assets', 'File'],
    ['importLogs', 'Lịch sử import'],
  ]

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-emerald-700">CMS</p>
      <h2 className="mt-2 text-2xl font-bold">{locked ? 'Các phần sẽ mở khi có role admin' : 'Tổng quan nội dung'}</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map(([key, label]) => (
          <div className="rounded-md border border-zinc-200 bg-[#FBFDFC] p-3" key={key}>
            <p className="text-sm font-semibold text-zinc-600">{label}</p>
            <p className="mt-1 text-2xl font-bold">{locked ? '-' : summary?.[key] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResourceEditor({ editingId, form, message, resource, saveItem, setEditingId, setForm }) {
  return (
    <form className="rounded-lg border border-zinc-200 bg-white p-5" onSubmit={saveItem}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">{editingId ? 'Cập nhật' : 'Thêm mới'}</p>
          <h2 className="mt-1 text-2xl font-bold">{resource.label}</h2>
        </div>
        {editingId && (
          <button className="rounded-md border border-zinc-300 px-3 py-2 font-semibold" type="button" onClick={() => {
            setEditingId('')
            setForm(emptyForm(resource))
          }}>
            Hủy sửa
          </button>
        )}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {resource.fields.map((field) => (
          <FieldInput field={field} form={form} key={field.name} setForm={setForm} />
        ))}
      </div>
      <button className="mt-5 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">
        {editingId ? 'Lưu thay đổi' : 'Thêm nội dung'}
      </button>
      {message && <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{message}</p>}
    </form>
  )
}

function FieldInput({ field, form, setForm }) {
  const value = form[field.name] ?? ''
  const commonProps = {
    className: 'w-full rounded-md border border-zinc-300 px-3 py-2',
    value,
    onChange: (event) => setForm((current) => ({ ...current, [field.name]: event.target.value })),
  }

  return (
    <label className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
      <span className="mb-1 block text-sm font-semibold text-zinc-600">{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea {...commonProps} rows={4} />
      ) : field.type === 'select' ? (
        <select {...commonProps}>
          <option value="">Chọn</option>
          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input {...commonProps} type={field.type || 'text'} />
      )}
    </label>
  )
}

function ResourceList({ deleteItem, editItem, items, resource }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Danh sách</p>
          <h2 className="mt-1 text-2xl font-bold">{resource.label}</h2>
        </div>
        <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold">{items.length} mục</span>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div className="rounded-md border border-zinc-200 bg-[#FBFDFC] p-3" key={itemIdentity(resource, item)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="break-words font-bold">{displayField(item, resource.titleField)}</p>
                <p className="mt-1 break-words text-sm text-zinc-600">{displayField(item, resource.subtitleField)}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold" type="button" onClick={() => editItem(item)}>
                  Sửa
                </button>
                <button className="rounded-md border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700" type="button" onClick={() => deleteItem(item)}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UploadManager({ publicId, selectedFile, setPublicId, setSelectedFile, setUploadCategory, uploadCategory, uploadFile, uploadMessage }) {
  return (
    <form className="rounded-lg border border-zinc-200 bg-white p-5" onSubmit={uploadFile}>
      <p className="text-sm font-semibold text-emerald-700">Lưu trữ file</p>
      <h2 className="mt-1 text-2xl font-bold">Cloudinary cho ảnh, metadata cho audio và tài liệu</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Ảnh từ vựng và avatar dùng Cloudinary image. Audio listening và tài liệu học có thể dùng Cloudinary video/raw hoặc storage riêng, nhưng vẫn quản lý metadata trong CMS.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label>
          <span className="mb-1 block text-sm font-semibold text-zinc-600">Loại file</span>
          <select className="w-full rounded-md border border-zinc-300 px-3 py-2" value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)}>
            {uploadCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold text-zinc-600">Public ID tùy chọn</span>
          <input className="w-full rounded-md border border-zinc-300 px-3 py-2" value={publicId} onChange={(event) => setPublicId(event.target.value)} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold text-zinc-600">File</span>
          <input className="w-full rounded-md border border-zinc-300 px-3 py-2" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} type="file" />
        </label>
      </div>
      <button className="mt-5 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" disabled={!selectedFile}>
        Upload
      </button>
      {uploadMessage && <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">{uploadMessage}</p>}
    </form>
  )
}

async function readBulkFile(event, setBulkText, setBulkFileName, setBulkResult) {
  const file = event.target.files?.[0]
  if (!file) return

  const text = await file.text()
  setBulkFileName(file.name)
  setBulkText(text)
  setBulkResult(null)
}

function statusLabel(status) {
  const labels = {
    valid: 'Hợp lệ',
    error: 'Lỗi',
    ignored: 'Dòng rỗng',
    'duplicate-input': 'Trùng trong nội dung nhập',
    'duplicate-existing': 'Trùng trong kho từ vựng',
  }

  return labels[status] || status || 'Chưa rõ'
}

function statusClassName(status) {
  if (status === 'valid') return 'font-semibold text-emerald-700'
  if (status === 'duplicate-existing' || status === 'duplicate-input') return 'font-semibold text-amber-800'
  if (status === 'ignored') return 'font-semibold text-zinc-500'
  return 'font-semibold text-rose-700'
}

function emptyForm(resource) {
  return (resource.fields || []).reduce((values, field) => ({ ...values, [field.name]: '' }), {})
}

function formFromItem(resource, item) {
  return resource.fields.reduce((values, field) => {
    const value = field.name === 'optionsText' ? (item.options || []).join('\n') : item[field.name]
    return { ...values, [field.name]: Array.isArray(value) ? value.join('\n') : value ?? '' }
  }, {})
}

function normalizeForm(resource, form) {
  const payload = { ...form }

  resource.fields.forEach((field) => {
    if (field.type === 'number' && payload[field.name] !== '') {
      payload[field.name] = Number(payload[field.name])
    }
  })

  if (resource.id === 'quiz-questions') {
    payload.options = String(payload.optionsText || '')
      .split('\n')
      .map((option) => option.trim())
      .filter(Boolean)
    delete payload.optionsText
  }

  return payload
}

function itemIdentity(resource, item) {
  if (resource.id === 'levels') return item.code
  if (resource.id === 'topics') return item.slug
  return item.id
}

function displayField(item, field) {
  const value = item?.[field]
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value || 'Chưa có dữ liệu'
}

export default AdminPanel
