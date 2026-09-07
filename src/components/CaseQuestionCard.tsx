import { useState } from 'react'
import type { CaseQuestion } from '../data/types'
import { CASE_CATEGORY_LABELS } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { chatWithAi, TUTOR_SYSTEM_PROMPT } from '../services/ai'
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
  const [aiReport, setAiReport] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const aiConfig = useAppStore((s) => s.aiConfig)

  const askAiGrade = async () => {
    setAiLoading(true)
    setAiError('')
    setAiReport('')
    const subs = cq.subQuestions
      .map(
        (s, i) =>
          `【问题${i + 1}】（${s.points} 分）\n题干：${s.stem}\n参考答案：${s.referenceAnswer}\n评分要点：${(s.scoringPoints ?? []).join('；')}\n考生作答：${answers[s.id]?.trim() || '（未作答）'}`,
      )
      .join('\n\n')
    try {
      const reply = await chatWithAi(aiConfig, [
        { role: 'system', content: TUTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `请扮演软考软件设计师下午题阅卷老师，为以下「${CASE_CATEGORY_LABELS[cq.category]}」大题评分。\n\n【背景材料】\n${cq.material}\n\n${subs}\n\n` +
            '评分要求：1）按评分要点逐条对照考生作答，每小题给出得分（0 至满分，可给小数）与扣分原因；2）最后给出总分（满分 15）与总评；3）指出考生答案中"答了但不得分"和"漏答"的关键点；4）给一段提分建议。用 Markdown 输出，结构清晰。',
        },
      ])
      setAiReport(reply)
    } catch (e) {
      setAiError((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

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

      {!readOnly && (
        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
          {!aiReport && !aiLoading && (
            <button
              onClick={askAiGrade}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-primary-600 text-white hover:opacity-90"
            >
              🤖 AI 评分本题（按评分要点逐条对照给分）
            </button>
          )}
          {aiLoading && <span className="text-sm text-slate-400">🤖 AI 阅卷中<span className="animate-pulse">…</span>（约 10~30 秒）</span>}
          {aiError && <div className="text-xs text-rose-500 mt-1">{aiError}</div>}
          {aiReport && (
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-primary-50 dark:from-slate-800 dark:to-slate-800 border border-violet-200 dark:border-violet-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">🤖 AI 阅卷报告</span>
                <button onClick={askAiGrade} className="ml-auto text-xs text-slate-400 hover:text-violet-500">
                  重新评分
                </button>
              </div>
              <Markdown>{aiReport}</Markdown>
            </div>
          )}
        </div>
      )}

      {showTechniques && cq.techniques && (
        <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">💡 解题套路</div>
          <Markdown>{cq.techniques}</Markdown>
        </div>
      )}
    </div>
  )
}
