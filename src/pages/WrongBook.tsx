import { useMemo, useState } from 'react'
import { MODULES, MODULE_MAP } from '../data/modules'
import { QUESTION_MAP } from '../data/questions'
import type { Question } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import QuestionCard from '../components/QuestionCard'
import Markdown from '../components/Markdown'

const LETTERS = ['A', 'B', 'C', 'D']

export default function WrongBook() {
  const wrongBook = useAppStore((s) => s.wrongBook)
  const clearWrongBook = useAppStore((s) => s.clearWrongBook)
  const [filter, setFilter] = useState<string>('all')
  const [mode, setMode] = useState<'list' | 'retry'>('list')
  const [retryIndex, setRetryIndex] = useState(0)
  const [retryCorrectCount, setRetryCorrectCount] = useState(0)

  const wrongQuestions = useMemo(() => {
    const list: { q: Question; wrongCount: number; lastWrongAt: number }[] = []
    for (const item of Object.values(wrongBook)) {
      const q = QUESTION_MAP[item.questionId]
      if (q && (filter === 'all' || q.moduleId === filter)) {
        list.push({ q, wrongCount: item.wrongCount, lastWrongAt: item.lastWrongAt })
      }
    }
    return list.sort((a, b) => b.lastWrongAt - a.lastWrongAt)
  }, [wrongBook, filter])

  const moduleCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of Object.values(wrongBook)) {
      const mid = item.questionId.split('-')[0]
      counts.set(mid, (counts.get(mid) ?? 0) + 1)
    }
    return counts
  }, [wrongBook])

  const startRetry = () => {
    setMode('retry')
    setRetryIndex(0)
    setRetryCorrectCount(0)
  }

  if (Object.keys(wrongBook).length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <div className="text-lg font-semibold">错题本是空的</div>
        <div className="text-sm text-slate-400 mt-1">去刷题吧，答错的题会自动收录到这里</div>
      </div>
    )
  }

  /* 重练模式 */
  if (mode === 'retry') {
    if (retryIndex >= wrongQuestions.length) {
      return (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <div className="text-lg font-semibold">本轮重练完成</div>
          <div className="text-sm text-slate-400 mt-1">
            共 {wrongQuestions.length + retryCorrectCount} 题 · 答对 {retryCorrectCount} 题（已自动移出错题本）
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setMode('list')}
              className="px-5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm hover:border-primary-400"
            >
              返回列表
            </button>
            <button
              onClick={startRetry}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
            >
              再来一轮
            </button>
          </div>
        </div>
      )
    }
    const current = wrongQuestions[retryIndex].q
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMode('list')} className="text-sm text-slate-400 hover:text-primary-500">
            ← 退出重练
          </button>
          <span className="text-sm text-slate-400">
            重练进度 {retryIndex + 1}/{wrongQuestions.length} · 已答对 {retryCorrectCount}
          </span>
        </div>
        <QuestionCard
          key={current.id + '-retry'}
          question={current}
          index={retryIndex}
          total={wrongQuestions.length}
          wrongMode
          onAnswered={(correct) => {
            if (correct) setRetryCorrectCount((c) => c + 1)
            setTimeout(() => setRetryIndex((i) => i + 1), correct ? 800 : 2500)
          }}
        />
      </div>
    )
  }

  /* 列表模式 */
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <h1 className="text-xl font-bold">📕 错题本（{wrongQuestions.length}）</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={startRetry}
            disabled={wrongQuestions.length === 0}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-40"
          >
            🔄 重练错题
          </button>
          <button
            onClick={() => {
              if (confirm('确定清空全部错题吗？此操作不可恢复。')) clearWrongBook()
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-500 hover:text-rose-500 hover:border-rose-300"
          >
            清空
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
          }`}
        >
          全部 {wrongQuestions.length}
        </button>
        {[...moduleCounts.entries()].map(([mid, count]) => (
          <button
            key={mid}
            onClick={() => setFilter(mid)}
            className={`text-xs px-3 py-1.5 rounded-full ${
              filter === mid ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            {MODULE_MAP[mid]?.icon} {MODULE_MAP[mid]?.name ?? mid} {count}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {wrongQuestions.map(({ q, wrongCount, lastWrongAt }) => (
          <details
            key={q.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <summary className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 list-none">
              <div className="flex items-start gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5">
                  错 {wrongCount} 次
                </span>
                <span className="text-sm flex-1 line-clamp-2">{q.stem.replace(/\n/g, ' ')}</span>
                <span className="text-xs text-slate-400 shrink-0">{new Date(lastWrongAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </summary>
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
              <Markdown>{q.stem}</Markdown>
              <div className="mt-2 text-sm">
                <span className="text-emerald-600 font-medium">✓ {LETTERS[q.answer]}. {q.options[q.answer]}</span>
                {wrongBook[q.id] && (
                  <span className="text-rose-400 ml-4">
                    你的最后选择：{LETTERS[wrongBook[q.id].lastSelection]}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3">
                <div className="font-medium mb-1">📖 解析</div>
                <Markdown>{q.explanation}</Markdown>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                {MODULE_MAP[q.moduleId]?.name} · {q.chapter ?? '综合'} · 难度 {'★'.repeat(q.difficulty)}
                {MODULES.length ? '' : ''}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
