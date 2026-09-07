import { useState } from 'react'
import type { CaseQuestion } from '../data/types'
import { CASE_CATEGORY_LABELS } from '../data/types'
import Markdown from './Markdown'

interface Props {
  cq: CaseQuestion
  /** subQuestionId -> 作答文本 */
  answers: Record<string, string>
  /** subQuestionId -> 自评分 */
  scores?: Record<string, number>
  onAnswer?: (subId: string, text: string) => void
  onScore?: (subId: string, score: number) => void
  /** 只读展示（不显示作答框） */
  readOnly?: boolean
  showTechniques?: boolean
}

export default function CaseQuestionCard({ cq, answers, scores, onAnswer, onScore, readOnly, showTechniques }: Props) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())

  const toggleOpen = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalPoints = cq.subQuestions.reduce((a, s) => a + s.points, 0)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 flex-wrap mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium">
          {CASE_CATEGORY_LABELS[cq.category]}
        </span>
        <span className="font-semibold text-sm">{cq.title}</span>
        <span className="text-xs text-slate-400 ml-auto">共 {totalPoints} 分</span>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-slate-400 mb-2">📄 背景材料</div>
        <Markdown>{cq.material}</Markdown>
      </div>

      <div className="space-y-4">
        {cq.subQuestions.map((sub, i) => {
          const key = `${cq.id}-${sub.id}`
          const open = openKeys.has(key)
          return (
            <div key={sub.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <Markdown>{sub.stem}</Markdown>
                </div>
                <span className="text-xs text-slate-400 shrink-0">（{sub.points} 分）</span>
              </div>

              {!readOnly && (
                <textarea
                  value={answers[sub.id] ?? ''}
                  onChange={(e) => onAnswer?.(sub.id, e.target.value)}
                  placeholder="在此作答…（对照参考答案后自评打分）"
                  className="w-full min-h-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 resize-y"
                />
              )}

              <button
                onClick={() => toggleOpen(key)}
                className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {open ? '收起参考答案' : '对照参考答案与评分要点 ▾'}
              </button>

              {open && (
                <div className="mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">✓ 参考答案</div>
                  <Markdown>{sub.referenceAnswer}</Markdown>
                  {sub.scoringPoints && sub.scoringPoints.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">评分要点：</span>
                      {sub.scoringPoints.join('；')}
                    </div>
                  )}
                  {onScore && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500">自评得分：</span>
                      <select
                        value={scores?.[sub.id] ?? ''}
                        onChange={(e) => onScore(sub.id, Number(e.target.value))}
                        className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value="" disabled>
                          选择
                        </option>
                        {Array.from({ length: sub.points + 1 }, (_, n) => (
                          <option key={n} value={n}>
                            {n} 分
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400">/ {sub.points} 分</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showTechniques && cq.techniques && (
        <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">💡 解题套路</div>
          <Markdown>{cq.techniques}</Markdown>
        </div>
      )}
    </div>
  )
}
