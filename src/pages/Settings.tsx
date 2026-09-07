import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { AI_PRESETS, chatWithAi } from '../services/ai'

export default function Settings() {
  const examDate = useAppStore((s) => s.examDate)
  const setExamDate = useAppStore((s) => s.setExamDate)
  const dailyGoal = useAppStore((s) => s.dailyGoal)
  const setDailyGoal = useAppStore((s) => s.setDailyGoal)
  const aiConfig = useAppStore((s) => s.aiConfig)
  const setAiConfig = useAppStore((s) => s.setAiConfig)
  const aiQuestions = useAppStore((s) => s.aiQuestions)
  const removeAiQuestion = useAppStore((s) => s.removeAiQuestion)
  const importData = useAppStore((s) => s.importData)
  const clearAllData = useAppStore((s) => s.clearAllData)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')

  const testConnection = async () => {
    setTesting(true)
    setTestResult('')
    try {
      const reply = await chatWithAi(aiConfig, [{ role: 'user', content: '请只回复两个字：连接成功' }], 30000)
      setTestResult(`✅ 连接成功，模型回复：${reply.slice(0, 30)}`)
    } catch (e) {
      setTestResult(`❌ ${(e as Error).message}`)
    } finally {
      setTesting(false)
    }
  }

  const applyPreset = (name: string) => {
    const p = AI_PRESETS.find((x) => x.name === name)
    if (p) setAiConfig({ baseUrl: p.baseUrl, model: p.model })
  }

  const exportData = () => {
    const s = useAppStore.getState()
    const payload = {
      exportedAt: new Date().toISOString(),
      records: s.records,
      wrongBook: s.wrongBook,
      favorites: s.favorites,
      masteredChapters: s.masteredChapters,
      mockHistory: s.mockHistory,
      examDate: s.examDate,
      dailyGoal: s.dailyGoal,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `软考学习数据备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('✅ 数据已导出')
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const ok = importData(JSON.parse(text))
      setMsg(ok ? '✅ 数据导入成功' : '❌ 文件格式不正确')
    } catch {
      setMsg('❌ 无法解析该文件')
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold">⚙️ 设置</h1>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold mb-4">考试与目标</h2>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm">考试日期（用于首页倒计时）</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </label>
        <label className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700">
          <span className="text-sm">每日刷题目标</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={500}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value) || 1)}
              className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-right"
            />
            <span className="text-sm text-slate-400">题/天</span>
          </div>
        </label>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold mb-2">🤖 AI 功能接口（OpenAI 兼容协议）</h2>
        <p className="text-xs text-slate-400 mb-4">
          配置后可使用 AI 答疑、AI 深度讲解、AI 智能出题、案例题 AI 评分。Key 仅保存在本机浏览器，不会上传到任何第三方。
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {AI_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.name)}
                title={p.note}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  aiConfig.baseUrl === p.baseUrl
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-primary-400'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="text-slate-500 dark:text-slate-400">接口地址 Base URL</span>
            <input
              value={aiConfig.baseUrl}
              onChange={(e) => setAiConfig({ baseUrl: e.target.value })}
              placeholder="https://open.bigmodel.cn/api/paas/v4"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500 dark:text-slate-400">模型名称</span>
            <input
              value={aiConfig.model}
              onChange={(e) => setAiConfig({ model: e.target.value })}
              placeholder="glm-4-flash / deepseek-chat / qwen2.5:7b"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500 dark:text-slate-400">API Key（Ollama 本地可留空）</span>
            <input
              value={aiConfig.apiKey}
              onChange={(e) => setAiConfig({ apiKey: e.target.value })}
              type="password"
              placeholder="sk-…"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={testing || !aiConfig.baseUrl || !aiConfig.model}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-40 hover:bg-primary-700"
            >
              {testing ? '测试中…' : '测试连接'}
            </button>
            {testResult && <span className={`text-xs ${testResult.startsWith('✅') ? 'text-emerald-600' : 'text-rose-500'}`}>{testResult}</span>}
          </div>
        </div>
        {aiQuestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              已入库 AI 题：{aiQuestions.length} 道（在「章节练习」对应模块中可刷到）
            </div>
            <button
              onClick={() => {
                if (confirm(`清空全部 ${aiQuestions.length} 道 AI 题？`)) aiQuestions.forEach((q) => removeAiQuestion(q.id))
              }}
              className="text-xs text-slate-400 hover:text-rose-500"
            >
              清空 AI 题库
            </button>
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold mb-2">数据备份</h2>
        <p className="text-xs text-slate-400 mb-4">
          学习进度保存在浏览器本地（localStorage）。换电脑或换浏览器时，先导出、再导入即可迁移。
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
          >
            导出数据
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:border-primary-400"
          >
            导入数据
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {msg && <div className="mt-3 text-sm text-slate-500">{msg}</div>}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900 p-5">
        <h2 className="font-semibold mb-2 text-rose-500">危险操作</h2>
        <p className="text-xs text-slate-400 mb-4">清空全部学习记录（刷题记录、错题本、收藏、模考历史），不可恢复。</p>
        <button
          onClick={() => {
            if (confirm('确定清空全部学习数据吗？此操作不可恢复！')) {
              clearAllData()
              setMsg('✅ 已清空')
            }
          }}
          className="px-4 py-2 rounded-lg border border-rose-300 text-rose-500 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30"
        >
          清空全部数据
        </button>
      </section>
    </div>
  )
}
