import { useEffect, useMemo, useState } from 'react'
import { buildMockPaper, QUESTION_MAP } from '../data/questions'
import { CASES } from '../data/cases'
import { useAppStore } from '../store/useAppStore'
import Markdown from '../components/Markdown'
import CaseQuestionCard from '../components/CaseQuestionCard'
import MockReport from '../components/MockReport'

const LETTERS = ['A', 'B', 'C', 'D']
const TOTAL_MS = 240 * 60 * 1000 // 两科连考总时长
const MORNING_MAX_MS = 120 * 60 * 1000 // 上午卷最长
const MORNING_MIN_MS = 90 * 60 * 1000 // 上午卷最短（提前交卷下限）

const EXAM_RULES = [
  '按近年真题各模块题量分布智能抽题，组成 75 题整卷',
  '两科连考总时长 240 分钟，与真实机考一致',
  '上午《基础知识》最长 120 分钟、最短 90 分钟，可提前交卷',
  '上午交卷后直接进入下午《应用技术》，节余时间自动带入',
  '下午 4 道必答案例 + C++/Java 二选一，作答后对照参考答案自评',
  '进行中刷新页面不丢进度，计时以开考时刻为准',
]

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function MockExam() {
  const activeMock = useAppStore((s) => s.activeMock)
  const mockHistory = useAppStore((s) => s.mockHistory)
  const startMock = useAppStore((s) => s.startMock)

  /* ---------- 入口视图 ---------- */
  if (!activeMock) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold mb-1">⏱️ 整卷模考</h1>
        <p className="text-sm text-slate-400 mb-5">全真模拟机考流程与连考计时规则</p>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-5">
          <div className="font-semibold mb-3">考试规则</div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {EXAM_RULES.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary-500 shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
          <button
            onClick={() => startMock(buildMockPaper(75))}
            className="mt-5 w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            🚀 开始模考（75 题 · 240 分钟）
          </button>
        </div>

        {mockHistory.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="font-semibold mb-3">模考历史（{mockHistory.length}）</div>
            <div className="space-y-2">
              {mockHistory.map((m) => (
                <details key={m.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                  <summary className="flex cursor-pointer items-center justify-between text-sm py-2.5 px-3 list-none hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="text-slate-400">
                      {new Date(m.date).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      <span className="ml-2 text-xs">{m.finished ? '已完成' : '未完成'}</span>
                    </span>
                    <span className="flex gap-4 tabular-nums">
                      <span className={m.morningScore >= 45 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                        上午 {m.morningScore}/{m.morningTotal}
                      </span>
                      <span className={m.afternoonSelfScore == null ? 'text-slate-400' : m.afternoonSelfScore >= 45 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                        {m.afternoonSelfScore == null ? '下午 —' : `下午自评 ${m.afternoonSelfScore}/75`}
                      </span>
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <MockReport result={m} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return activeMock.morningSubmitted ? <AfternoonSection /> : <MorningSection />
}

/* ================= 上午卷 ================= */
function MorningSection() {
  const activeMock = useAppStore((s) => s.activeMock)!
  const setMorningSelection = useAppStore((s) => s.setMorningSelection)
  const toggleMorningFlag = useAppStore((s) => s.toggleMorningFlag)
  const submitMorning = useAppStore((s) => s.submitMorning)
  const cancelMock = useAppStore((s) => s.cancelMock)
  const [index, setIndex] = useState(0)
  const [showSheet, setShowSheet] = useState(false)
  const now = useNow(true)

  const elapsed = now - activeMock.startTime
  const totalLeft = TOTAL_MS - elapsed
  const morningLeft = MORNING_MAX_MS - elapsed
  const answered = activeMock.morningSelections.filter((s) => s !== null).length
  const unanswered = activeMock.morningQuestionIds.length - answered
  const tooEarly = elapsed < MORNING_MIN_MS

  /* 到点自动交卷 */
  useEffect(() => {
    if (morningLeft <= 0) {
      submitMorning()
    } else if (totalLeft <= 0) {
      submitMorning()
    }
  }, [morningLeft, totalLeft, submitMorning])

  const q = QUESTION_MAP[activeMock.morningQuestionIds[index]]

  const sheetClass = (i: number) => {
    const sel = activeMock.morningSelections[i]
    const flag = activeMock.morningFlags[i]
    if (i === index) return 'bg-primary-600 text-white ring-2 ring-primary-300'
    if (flag) return 'bg-amber-400 text-white'
    if (sel !== null) return 'bg-emerald-500 text-white'
    return 'bg-slate-100 dark:bg-slate-700 text-slate-500'
  }

  return (
    <div className="pb-24">
      {/* 顶部状态栏 */}
      <div className="sticky top-14 md:top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-sm font-semibold">📘 上午 · 基础知识</span>
          <span className="text-sm tabular-nums">
            总剩余 <b className={totalLeft < 30 * 60000 ? 'text-rose-500' : ''}>{fmt(totalLeft)}</b>
          </span>
          <span className="text-sm tabular-nums text-slate-400">
            上午剩余 {fmt(morningLeft)}（最短还需 {fmt(MORNING_MIN_MS - elapsed)}）
          </span>
          <span className="text-sm text-slate-400 ml-auto">
            已答 {answered}/{activeMock.morningQuestionIds.length}
          </span>
        </div>
      </div>

      {/* 题目 */}
      {q && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-slate-400">
              {index + 1}. <span className="text-slate-300">/ {activeMock.morningQuestionIds.length}</span>
            </span>
            <button
              onClick={() => toggleMorningFlag(index)}
              className={`ml-auto text-xs px-2.5 py-1 rounded-full transition-colors ${
                activeMock.morningFlags[index]
                  ? 'bg-amber-400 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-amber-500'
              }`}
            >
              🚩 {activeMock.morningFlags[index] ? '已标记' : '标记疑问'}
            </button>
          </div>
          <Markdown>{q.stem}</Markdown>
          <div className="mt-4 space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setMorningSelection(index, i)}
                className={`w-full text-left flex items-start gap-3 px-4 py-2.5 rounded-lg border transition-all ${
                  activeMock.morningSelections[index] === i
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-400'
                    : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="font-semibold shrink-0 w-5">{LETTERS[i]}.</span>
                <span className="text-[15px] whitespace-pre-wrap">{opt}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm disabled:opacity-40"
            >
              ← 上一题
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(activeMock.morningQuestionIds.length - 1, i + 1))}
              disabled={index === activeMock.morningQuestionIds.length - 1}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-40"
            >
              下一题 →
            </button>
          </div>
        </div>
      )}

      {/* 底部答题卡抽屉 */}
      <div className="fixed bottom-0 left-0 right-0 md:left-56 z-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
        <button
          onClick={() => setShowSheet(!showSheet)}
          className="w-full py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400"
        >
          {showSheet ? '收起答题卡 ▾' : `展开答题卡（未答 ${unanswered}）▲`}
        </button>
        {showSheet && (
          <div className="max-h-64 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-10 sm:grid-cols-15 gap-2">
              {activeMock.morningQuestionIds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIndex(i)
                    setShowSheet(false)
                  }}
                  className={`h-9 rounded-lg text-sm font-medium tabular-nums transition-transform hover:scale-105 ${sheetClass(i)}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 px-4 pb-4">
          <button
            onClick={() => {
              if (confirm('确定放弃本次模考吗？（将不保存成绩）')) cancelMock()
            }}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-400 hover:text-rose-500"
          >
            放弃考试
          </button>
          <button
            onClick={() => {
              if (unanswered > 0 && !confirm(`还有 ${unanswered} 题未作答，确定交卷？`)) return
              submitMorning()
            }}
            disabled={tooEarly}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tooEarly
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            title={tooEarly ? '真实考试上午卷最短需作答 90 分钟' : ''}
          >
            {tooEarly ? `交卷（需满 90 分钟，还差 ${fmt(MORNING_MIN_MS - elapsed)}）` : '交卷并进入下午案例 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================= 下午案例卷 ================= */
function AfternoonSection() {
  const activeMock = useAppStore((s) => s.activeMock)!
  const setOopChoice = useAppStore((s) => s.setOopChoice)
  const setCaseAnswer = useAppStore((s) => s.setCaseAnswer)
  const setCaseSelfScore = useAppStore((s) => s.setCaseSelfScore)
  const finishMock = useAppStore((s) => s.finishMock)
  const cancelMock = useAppStore((s) => s.cancelMock)
  const now = useNow(true)

  const elapsed = now - activeMock.startTime
  const totalLeft = TOTAL_MS - elapsed

  useEffect(() => {
    if (totalLeft <= 0) finishMock()
  }, [totalLeft, finishMock])

  /* 5/6 选一 */
  if (!activeMock.oopChoice) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="text-sm text-slate-400 mb-1">上午已交卷 · 剩余时间 {fmt(totalLeft)}</div>
          <h2 className="text-xl font-bold mb-1">下午 · 应用技术</h2>
          <p className="text-sm text-slate-400 mb-6">试题五（C++）与试题六（Java）为同一设计模式实例的两种实现，请选择作答其一（与真实考试一致）</p>
          <div className="grid grid-cols-2 gap-4">
            {(['cpp', 'java'] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  const ids = ['dfd', 'db', 'uml', 'algo'].map((cat) => CASES.find((x) => x.category === cat)?.id)
                  const oopId = c === 'cpp' ? 'oop1' : 'oop2'
                  setOopChoice(c, [...ids.filter(Boolean), oopId] as string[])
                }}
                className="py-5 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-2">{c === 'cpp' ? '🅒' : '☕'}</div>
                <div className="font-semibold">{c === 'cpp' ? 'C++ 版' : 'Java 版'}</div>
                <div className="text-xs text-slate-400 mt-1">试题{c === 'cpp' ? '五' : '六'} · 面向对象设计</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const caseList = activeMock.caseIds.map((id) => CASES.find((c) => c.id === id)!).filter(Boolean)
  let selfTotal = 0
  let hasScore = false
  for (const c of caseList) {
    for (const sub of c.subQuestions) {
      const v = activeMock.caseSelfScores[c.id]?.[sub.id]
      if (v != null) {
        selfTotal += v
        hasScore = true
      }
    }
  }

  return (
    <div className="pb-8">
      <div className="sticky top-14 md:top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-sm font-semibold">📙 下午 · 应用技术（{activeMock.oopChoice === 'cpp' ? 'C++' : 'Java'}）</span>
          <span className="text-sm tabular-nums">
            总剩余 <b className={totalLeft < 30 * 60000 ? 'text-rose-500' : ''}>{fmt(totalLeft)}</b>
          </span>
          {hasScore && (
            <span className="text-sm text-slate-400 ml-auto tabular-nums">
              自评累计 {selfTotal}/75
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {caseList.map((c, i) => (
          <div key={c.id}>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
              试题{['一', '二', '三', '四', '五'][i]}（{c.subQuestions.reduce((a, s) => a + s.points, 0)} 分）
            </div>
            <CaseQuestionCard
              cq={c}
              answers={activeMock.caseAnswers[c.id] ?? {}}
              scores={activeMock.caseSelfScores[c.id] ?? {}}
              onAnswer={(subId, text) => setCaseAnswer(c.id, subId, text)}
              onScore={(subId, score) => setCaseSelfScore(c.id, subId, score)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6 sticky bottom-0 py-4 bg-slate-50 dark:bg-slate-900">
        <button
          onClick={() => {
            if (confirm('确定放弃本次模考吗？')) cancelMock()
          }}
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-400 hover:text-rose-500"
        >
          放弃
        </button>
        <button
          onClick={() => {
            if (!hasScore && !confirm('尚未自评打分，确定完成考试？')) return
            finishMock()
          }}
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
        >
          ✓ 完成考试，查看成绩报告
        </button>
      </div>

      {activeMock.morningQuestionIds.length > 0 && <MorningReportInline />}
    </div>
  )
}

/** 下午页内嵌的上午成绩速览 */
function MorningReportInline() {
  const activeMock = useAppStore((s) => s.activeMock)!
  const history = useAppStore((s) => s.mockHistory)
  const rec = history.find((m) => m.id === `mock-${activeMock.createdAt}`)
  if (!rec) return null
  return (
    <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="font-semibold mb-2">上午卷成绩</div>
      <div className={`text-2xl font-bold ${rec.morningScore >= 45 ? 'text-emerald-600' : 'text-rose-500'}`}>
        {rec.morningScore} / {rec.morningTotal}
        <span className="text-sm font-normal text-slate-400 ml-2">
          （用时 {Math.floor(rec.morningDurationMin / 60)}小时{rec.morningDurationMin % 60}分钟 · 及格线 45）
        </span>
      </div>
    </div>
  )
}
