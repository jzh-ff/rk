import { useState } from 'react'
import type { Question } from '../data/types'
import { MODULE_MAP } from '../data/modules'
import { useAppStore } from '../store/useAppStore'
import { chatWithAi, TUTOR_SYSTEM_PROMPT } from '../services/ai'
import Markdown from './Markdown'

const LETTERS = ['A', 'B', 'C', 'D']

interface Props {
  question: Question
  index: number
  total: number
  /** 判分后自动进入下一题的回调（可选） */
  onAnswered?: (correct: boolean) => void
  /** 错题重练模式下答对自动移出 */
  wrongMode?: boolean
}

export default function QuestionCard({ question, index, total, onAnswered, wrongMode }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [aiExplain, setAiExplain] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const favorites = useAppStore((s) => s.favorites)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const addRecord = useAppStore((s) => s.addRecord)
  const removeWrong = useAppStore((s) => s.removeWrong)
  const aiConfig = useAppStore((s) => s.aiConfig)
  const isFav = favorites.includes(question.id)
  const mod = MODULE_MAP[question.moduleId]

  const askAi = async () => {
    setAiLoading(true)
    setAiError('')
    setAiExplain('')
    try {
      const reply = await chatWithAi(aiConfig, [
        { role: 'system', content: TUTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `请深度讲解这道软考题（模块：${mod?.name}，章节：${question.chapter ?? '综合'}）：\n\n` +
            `【题干】${question.stem}\n` +
            `【选项】${question.options.map((o, i) => `${LETTERS[i]}. ${o}`).join('  ')}\n` +
            `【正确答案】${LETTERS[question.answer]}\n\n` +
            '请给出：1）这道题考的核心知识点（一句话）；2）比题库解析更通俗的讲解（可打比方）；3）每个错误选项错在哪；4）举一反三：同考点还会怎么考、给一个同类变式题（附答案）。',
        },
      ])
      setAiExplain(reply)
    } catch (e) {
      setAiError((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  const submit = () => {
    if (selected === null || submitted) return
    const correct = selected === question.answer
    setSubmitted(true)
    addRecord({ questionId: question.id, selected, correct, time: Date.now(), mode: wrongMode ? 'wrong' : 'practice' })
    if (wrongMode && correct) removeWrong(question.id)
    onAnswered?.(correct)
  }

  const optionClass = (i: number) => {
    if (!submitted) {
      return selected === i
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-400'
        : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-800'
    }
    if (i === question.answer) return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
    if (i === selected) return 'border-rose-400 bg-rose-50 dark:bg-rose-900/30'
    return 'border-slate-200 dark:border-slate-600 opacity-60'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-sm font-semibold text-slate-400">
          {index + 1} / {total}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
          {mod?.icon} {mod?.name}
        </span>
        {question.chapter && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
            {question.chapter}
          </span>
        )}
        {question.hot && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            🔥 高频
          </span>
        )}
        <span className="text-xs text-slate-400">难度 {'★'.repeat(question.difficulty)}</span>
        <button
          onClick={() => toggleFavorite(question.id)}
          className={`ml-auto text-sm px-2 py-1 rounded-lg transition-colors ${
            isFav
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/40'
              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title={isFav ? '取消收藏' : '收藏'}
        >
          {isFav ? '★ 已收藏' : '☆ 收藏'}
        </button>
      </div>

      <Markdown>{question.stem}</Markdown>

      <div className="mt-4 space-y-2.5">
        {question.options.map((opt, i) => (
          <button
            key={i}
            disabled={submitted}
            onClick={() => !submitted && setSelected(i)}
            className={`w-full text-left flex items-start gap-3 px-4 py-2.5 rounded-lg border transition-all ${optionClass(i)}`}
          >
            <span className="font-semibold shrink-0 w-5">{LETTERS[i]}.</span>
            <span className="text-[15px] whitespace-pre-wrap">{opt}</span>
            {submitted && i === question.answer && <span className="ml-auto text-emerald-500 shrink-0">✓</span>}
            {submitted && i === selected && i !== question.answer && (
              <span className="ml-auto text-rose-500 shrink-0">✗</span>
            )}
          </button>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={selected === null}
          className="mt-4 px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-primary-700 transition-colors"
        >
          提交答案
        </button>
      ) : (
        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className={`font-semibold mb-2 ${selected === question.answer ? 'text-emerald-600' : 'text-rose-500'}`}>
            {selected === question.answer ? '✓ 回答正确' : `✗ 回答错误，正确答案：${LETTERS[question.answer]}`}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">📖 解析</div>
          <Markdown>{question.explanation}</Markdown>
          <div className="mt-3">
            {!aiExplain && !aiLoading && (
              <button
                onClick={askAi}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-primary-600 text-white hover:opacity-90"
              >
                🤖 AI 深度讲解（通俗版 + 错项分析 + 举一反三）
              </button>
            )}
            {aiLoading && <span className="text-xs text-slate-400">🤖 AI 讲解生成中<span className="animate-pulse">…</span></span>}
            {aiError && <div className="text-xs text-rose-500 mt-1">{aiError}</div>}
            {aiExplain && (
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-primary-50 dark:from-slate-800 dark:to-slate-800 border border-violet-200 dark:border-violet-900 p-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">🤖 AI 深度讲解</span>
                  <button onClick={askAi} className="ml-auto text-[11px] text-slate-400 hover:text-violet-500">
                    重新生成
                  </button>
                </div>
                <Markdown>{aiExplain}</Markdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
