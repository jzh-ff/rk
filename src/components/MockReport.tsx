import { useMemo, useState } from 'react'
import type { MockResult } from '../store/useAppStore'
import { useAppStore, findQuestion } from '../store/useAppStore'
import { MODULE_MAP } from '../data/modules'
import Markdown from './Markdown'

const LETTERS = ['A', 'B', 'C', 'D']

export default function MockReport({ result }: { result: MockResult }) {
  const [filter, setFilter] = useState<'wrong' | 'all'>('wrong')
  const aiQuestions = useAppStore((s) => s.aiQuestions)

  const moduleStats = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>()
    for (const d of result.morningDetail) {
      const mid = d.questionId.split('-')[0]
      const stat = map.get(mid) ?? { total: 0, correct: 0 }
      stat.total++
      if (d.correct) stat.correct++
      map.set(mid, stat)
    }
    return [...map.entries()]
      .map(([id, s]) => ({ id, ...s, rate: Math.round((s.correct / s.total) * 100) }))
      .sort((a, b) => a.rate - b.rate)
  }, [result])

  const details = useMemo(() => {
    return result.morningDetail
      .map((d) => ({ ...d, q: findQuestion(d.questionId, aiQuestions) }))
      .filter((d) => d.q && (filter === 'all' || !d.correct))
  }, [result, filter, aiQuestions])

  const pass = result.morningScore >= 45
  const totalDetail = result.morningDetail.length || 1

  return (
    <div className="space-y-5">
      {/* 总分卡 */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`rounded-xl p-5 border-2 ${pass ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'border-rose-300 bg-rose-50 dark:bg-rose-900/20'}`}>
          <div className="text-xs text-slate-500">上午 · 基础知识（及格线 45）</div>
          <div className={`text-3xl font-extrabold tabular-nums mt-1 ${pass ? 'text-emerald-600' : 'text-rose-500'}`}>
            {result.morningScore} <span className="text-base font-normal text-slate-400">/ {result.morningTotal}</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            用时 {Math.floor(result.morningDurationMin / 60)} 时 {result.morningDurationMin % 60} 分 · 正确率{' '}
            {Math.round((result.morningScore / totalDetail) * 100)}%
          </div>
        </div>
        <div
          className={`rounded-xl p-5 border-2 ${
            result.afternoonSelfScore == null
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
              : result.afternoonSelfScore >= 45
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-rose-300 bg-rose-50 dark:bg-rose-900/20'
          }`}
        >
          <div className="text-xs text-slate-500">下午 · 应用技术（自评，及格线 45）</div>
          <div
            className={`text-3xl font-extrabold tabular-nums mt-1 ${
              result.afternoonSelfScore == null ? 'text-slate-400' : result.afternoonSelfScore >= 45 ? 'text-emerald-600' : 'text-rose-500'
            }`}
          >
            {result.afternoonSelfScore ?? '—'} <span className="text-base font-normal text-slate-400">/ 75</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {result.afternoonSelfScore == null ? '未自评（完成考试前请在下午环节打分）' : '两科均达 45 分即通过'}
          </div>
        </div>
      </div>

      {/* 模块得分 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="font-semibold mb-3">各模块得分率（从弱到强，优先补最短板）</div>
        <div className="space-y-2">
          {moduleStats.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="text-xs w-40 shrink-0 truncate text-slate-500 dark:text-slate-400">
                {MODULE_MAP[m.id]?.icon} {MODULE_MAP[m.id]?.name ?? m.id}
              </span>
              <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                <div
                  className={`h-full rounded ${m.rate >= 80 ? 'bg-emerald-500' : m.rate >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${m.rate}%` }}
                />
              </div>
              <span className="text-xs w-24 text-right tabular-nums text-slate-400">
                {m.correct}/{m.total} · {m.rate}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 逐题解析 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="font-semibold">逐题解析</div>
          <div className="flex gap-1 ml-auto text-xs">
            <button
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1.5 rounded-full ${filter === 'wrong' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
            >
              仅看错题
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
            >
              全部 {result.morningDetail.length}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {details.map((d, i) => (
            <details key={d.questionId} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <summary className="px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 list-none text-sm">
                {d.correct && <span className="text-emerald-500 font-bold mr-2">✓</span>}
                {!d.correct && <span className="text-rose-500 font-bold mr-2">✗</span>}
                <span className="text-slate-600 dark:text-slate-300 line-clamp-1 inline">
                  {d.q!.stem.replace(/\n/g, ' ').slice(0, 60)}…
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1 text-sm">
                <Markdown>{d.q!.stem}</Markdown>
                <div className="mt-2 space-y-1">
                  <div>
                    你的答案：
                    <b className={d.correct ? 'text-emerald-600' : 'text-rose-500'}>
                      {d.selected != null && d.selected >= 0 ? LETTERS[d.selected] : '未作答'}
                    </b>
                  </div>
                  <div>
                    正确答案：<b className="text-emerald-600">{LETTERS[d.q!.answer]}</b>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3">
                  <Markdown>{d.q!.explanation}</Markdown>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {MODULE_MAP[d.q!.moduleId]?.name} · {d.q!.chapter ?? '综合'}
                </div>
              </div>
            </details>
          ))}
          {details.length === 0 && (
            <div className="text-center text-slate-400 py-4 text-sm">
              {filter === 'wrong' ? '🎉 全对，没有错题！' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
