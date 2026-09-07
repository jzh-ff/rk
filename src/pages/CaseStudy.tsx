import { useMemo, useState } from 'react'
import { CASES } from '../data/cases'
import type { CaseCategory } from '../data/types'
import { CASE_CATEGORY_LABELS } from '../data/types'
import CaseQuestionCard from '../components/CaseQuestionCard'
import { useCaseDraft } from '../store/useCaseDraft'

const CAT_ORDER: CaseCategory[] = ['dfd', 'db', 'uml', 'algo', 'oop']
const CAT_DESC: Record<CaseCategory, string> = {
  dfd: '下午第 1 题 · 补外部实体/数据存储/数据流，父子图平衡',
  db: '下午第 2 题 · ER 建模、关系模式转换、SQL 编写',
  uml: '下午第 3 题 · 用例图/类图/序列图补充与分析',
  algo: '下午第 4 题 · C 语言算法填空、思想与复杂度',
  oop: '下午第 5/6 题 · C++/Java 设计模式代码补全（二选一）',
}

export default function CaseStudy() {
  const [cat, setCat] = useState<CaseCategory>('dfd')
  const [caseId, setCaseId] = useState<string | null>(null)
  const drafts = useCaseDraft((s) => s.drafts)
  const selfScores = useCaseDraft((s) => s.selfScores)
  const setDraft = useCaseDraft((s) => s.setDraft)
  const setScore = useCaseDraft((s) => s.setScore)
  const clearCase = useCaseDraft((s) => s.clearCase)

  const list = useMemo(() => CASES.filter((c) => c.category === cat), [cat])
  const current = caseId ? CASES.find((c) => c.id === caseId) : null

  if (current) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setCaseId(null)}
            className="text-sm text-slate-400 hover:text-primary-500"
          >
            ← 返回列表
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm">{CASE_CATEGORY_LABELS[current.category]}</span>
        </div>
        <CaseQuestionCard
          cq={current}
          answers={drafts[current.id] ?? {}}
          scores={selfScores[current.id] ?? {}}
          onAnswer={(subId, text) => setDraft(current.id, subId, text)}
          onScore={(subId, score) => setScore(current.id, subId, score)}
          showTechniques
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={() => {
              if (confirm('清空本题的作答草稿？')) clearCase(current.id)
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-500 hover:text-rose-500"
          >
            清空草稿
          </button>
          <button
            onClick={() => setCaseId(null)}
            className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
          >
            完成学习，返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">📝 案例分析专项</h1>
      <p className="text-sm text-slate-400 mb-5">
        下午《应用技术》· 6 道大题（1~4 必答 + 5/6 二选一）· 每题 15 分 · 作答后对照参考答案自评
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {CAT_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              cat === c
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            {CASE_CATEGORY_LABELS[c]}（{CASES.filter((x) => x.category === c).length}）
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-3">{CAT_DESC[cat]}</p>

      <div className="space-y-3">
        {list.map((c, i) => {
          const hasDraft = Object.keys(drafts[c.id] ?? {}).length > 0
          const scored = Object.keys(selfScores[c.id] ?? {}).length
          return (
            <button
              key={c.id}
              onClick={() => setCaseId(c.id)}
              className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-violet-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 text-sm font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {c.subQuestions.length} 个小题 · 共 {c.subQuestions.reduce((a, s) => a + s.points, 0)} 分
                    {c.techniques ? ' · 附解题套路' : ''}
                  </div>
                </div>
                {hasDraft && (
                  <span className="text-xs px-2 py-1 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300">
                    有草稿{scored > 0 ? ` · 已自评 ${scored} 小题` : ''}
                  </span>
                )}
              </div>
            </button>
          )
        })}
        {list.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400">
            该题型暂无题目，敬请期待
          </div>
        )}
      </div>
    </div>
  )
}
