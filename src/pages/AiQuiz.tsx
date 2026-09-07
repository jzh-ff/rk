import { useMemo, useState } from 'react'
import { MODULES, MODULE_MAP } from '../data/modules'
import type { Question } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { chatWithAi, extractJsonArray } from '../services/ai'
import QuestionCard from '../components/QuestionCard'

export default function AiQuiz() {
  const aiConfig = useAppStore((s) => s.aiConfig)
  const addAiQuestions = useAppStore((s) => s.addAiQuestions)
  const aiQuestions = useAppStore((s) => s.aiQuestions)
  const aiCount = useMemo(() => aiQuestions.length, [aiQuestions])

  const [moduleId, setModuleId] = useState('oo')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)

  const generate = async () => {
    setError('')
    setLoading(true)
    setQuestions([])
    setIndex(0)
    const mod = MODULE_MAP[moduleId]
    const diffText = difficulty === 0 ? '难度混合（基础:中等:较难 ≈ 3:5:2）' : `全部难度 ${difficulty}（1 基础 2 中等 3 较难）`
    const topicText = topic.trim() ? `重点围绕考点：${topic.trim()}。` : `均匀覆盖该模块各章节考点。`
    const prompt =
      `你是软考中级软件设计师出题专家。请为「${mod.name}」模块出 ${count} 道单项选择题。${topicText}${diffText}。` +
      '要求：真题风格、题干简洁明确、四个干扰项合理（相近概念或常见误解）、答案分布均匀（A/B/C/D 都有）、解析详细（先给正确项依据，再点易错点）。\n\n' +
      '严格按以下 JSON 数组格式返回，不要输出任何其他文字：\n' +
      '[{"id":"{moduleId占位}-ai-{序号}","moduleId":"' +
      moduleId +
      '","chapter":"章节名","stem":"题干","options":["选项1","选项2","选项3","选项4"],"answer":0,"explanation":"解析","difficulty":1}]\n\n' +
      '注意：answer 为 0~3 的数字；explanation 中可用 **加粗** markdown；换行用 \\n。'
    try {
      const reply = await chatWithAi(aiConfig, [
        { role: 'system', content: '你只输出 JSON 数组，不输出任何解释或代码围栏。' },
        { role: 'user', content: prompt },
      ])
      const arr = extractJsonArray<Question>(reply)
      const valid = arr
        .filter((q) => q && q.stem && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'number' && q.answer >= 0 && q.answer <= 3)
        .map((q, i) => ({
          ...q,
          id: `${moduleId}-ai-${Date.now()}-${i}`,
          moduleId,
          explanation: q.explanation ?? '（本题未返回解析）',
          difficulty: (q.difficulty === 1 || q.difficulty === 2 || q.difficulty === 3 ? q.difficulty : 2) as 1 | 2 | 3,
        }))
      if (valid.length === 0) throw new Error('AI 返回的题目格式不合法，请重试')
      setQuestions(valid)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const saveAll = () => {
    addAiQuestions(questions)
  }

  const current = questions[index]

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">🤖 AI 智能出题</h1>
      <p className="text-sm text-slate-400 mb-5">
        按模块与考点无限生成新题——题库刷穿了也不怕，好题可一键存入题库（进入章节练习反复刷）
      </p>

      {/* 生成表单 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">模块</span>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            >
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">考点（可选，如“设计模式之观察者/策略”）</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="留空则覆盖该模块各章节"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">数量</span>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            >
              {[3, 5, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} 题
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">难度</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as 0 | 1 | 2 | 3)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
            >
              <option value={0}>混合</option>
              <option value={1}>基础</option>
              <option value={2}>中等</option>
              <option value={3}>较难</option>
            </select>
          </label>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-4 px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-primary-600 text-white font-medium text-sm disabled:opacity-50 hover:opacity-95"
        >
          {loading ? '⏳ 生成中，约需 10~30 秒…' : '✨ 生成题目'}
        </button>
        {error && <div className="mt-3 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded-lg p-3">{error}</div>}
      </div>

      {/* 生成结果 */}
      {questions.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-sm text-slate-400">
              本批 {questions.length} 题 · 第 {index + 1} 题
            </span>
            <button
              onClick={saveAll}
              className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
            >
              ⬇ 全部存入题库
            </button>
            <button
              onClick={() => addAiQuestions([current])}
              className="px-4 py-2 rounded-lg border border-emerald-400 text-emerald-600 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              存入本题
            </button>
          </div>
          <QuestionCard key={current.id} question={current} index={index} total={questions.length} />
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm disabled:opacity-40"
            >
              ← 上一题
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index >= questions.length - 1}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-40"
            >
              下一题 →
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-3">
            已入库 AI 题：{aiCount} 道（可在「章节练习」对应模块中刷到）
          </div>
        </div>
      )}
      {questions.length === 0 && !loading && (
        <div className="text-center text-sm text-slate-400 py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          选择模块后点「生成题目」，AI 将按真题风格出题（需先在「设置」页配置 AI 接口）
        </div>
      )}
    </div>
  )
}
