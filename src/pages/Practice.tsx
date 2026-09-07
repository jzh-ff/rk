import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MODULES, MODULE_MAP } from '../data/modules'
import { questionsOfModule, chaptersOfModule } from '../data/questions'
import { useAppStore } from '../store/useAppStore'
import QuestionCard from '../components/QuestionCard'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Practice() {
  const [params, setParams] = useSearchParams()
  const moduleId = params.get('module')
  const chapter = params.get('chapter') ?? 'all'
  const [random, setRandom] = useState(false)
  const [index, setIndex] = useState(0)
  const records = useAppStore((s) => s.records)

  const mod = moduleId ? MODULE_MAP[moduleId] : null

  useEffect(() => {
    setIndex(0)
  }, [moduleId, chapter, random])

  const questions = useMemo(() => {
    if (!moduleId) return []
    let qs = questionsOfModule(moduleId)
    if (chapter !== 'all') qs = qs.filter((q) => q.chapter === chapter)
    return random ? shuffle(qs) : qs
  }, [moduleId, chapter, random])

  /* 模块选择视图 */
  if (!mod) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-1">✏️ 章节练习</h1>
        <p className="text-sm text-slate-400 mb-5">选择模块开始刷题，即时判分、自动收录错题</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {MODULES.map((m) => {
            const qs = questionsOfModule(m.id)
            const recs = records.filter((r) => r.questionId.startsWith(m.id + '-'))
            const acc = recs.length ? Math.round((recs.filter((r) => r.correct).length / recs.length) * 100) : -1
            return (
              <button
                key={m.id}
                onClick={() => setParams({ module: m.id })}
                className="text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{m.description}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>📝 {qs.length} 题</span>
                      {acc >= 0 && (
                        <span className={acc >= 80 ? 'text-emerald-600' : acc >= 60 ? 'text-amber-600' : 'text-rose-500'}>
                          正确率 {acc}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* 刷题视图 */
  const chapters = chaptersOfModule(mod.id)
  const current = questions[index]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setParams({})}
          className="text-sm text-slate-400 hover:text-primary-500"
        >
          ← 返回模块
        </button>
        <span className="font-semibold">
          {mod.icon} {mod.name}
        </span>
        {chapters.length > 1 && (
          <select
            value={chapter}
            onChange={(e) => setParams(chapter === 'all' && e.target.value === 'all' ? {} : e.target.value === 'all' ? { module: mod.id } : { module: mod.id, chapter: e.target.value })}
            className="text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
          >
            <option value="all">全部章节</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setRandom(!random)}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            random
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300'
              : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'
          }`}
        >
          🔀 {random ? '随机已开' : '随机刷题'}
        </button>
        <span className="ml-auto text-sm text-slate-400 tabular-nums">
          {questions.length} 题 · 第 {Math.min(index + 1, questions.length)} 题
        </span>
      </div>

      {!current ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400">
          该筛选条件下暂无题目
        </div>
      ) : (
        <>
          <QuestionCard key={current.id} question={current} index={index} total={questions.length} />
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="px-5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:border-primary-400"
            >
              ← 上一题
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index >= questions.length - 1}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-40 hover:bg-primary-700"
            >
              下一题 →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
