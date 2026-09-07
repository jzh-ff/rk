import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MODULES } from '../data/modules'
import { KNOWLEDGE } from '../data/knowledge'
import { useAppStore } from '../store/useAppStore'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

export default function Dashboard() {
  const examDate = useAppStore((s) => s.examDate)
  const dailyGoal = useAppStore((s) => s.dailyGoal)
  const records = useAppStore((s) => s.records)
  const wrongBook = useAppStore((s) => s.wrongBook)
  const masteredChapters = useAppStore((s) => s.masteredChapters)
  const mockHistory = useAppStore((s) => s.mockHistory)

  const days = daysUntil(examDate)

  const stats = useMemo(() => {
    const total = records.length
    const correct = records.filter((r) => r.correct).length
    const today = new Date().toDateString()
    const todayCount = records.filter((r) => new Date(r.time).toDateString() === today).length
    const byModule = new Map<string, { total: number; correct: number }>()
    for (const m of MODULES) byModule.set(m.id, { total: 0, correct: 0 })
    // records 只存 moduleId 可从题号前缀推断
    for (const r of records) {
      const mid = r.questionId.split('-')[0]
      const stat = byModule.get(mid)
      if (stat) {
        stat.total++
        if (r.correct) stat.correct++
      }
    }
    return {
      total,
      correct,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      todayCount,
      byModule: [...byModule.entries()].map(([id, s]) => ({
        id,
        ...s,
        rate: s.total ? Math.round((s.correct / s.total) * 100) : -1,
      })),
    }
  }, [records])

  const totalChapters = useMemo(
    () => Object.values(KNOWLEDGE).reduce((acc, k) => acc + k.chapters.length, 0),
    [],
  )

  return (
    <div className="space-y-6">
      {/* 倒计时横幅 */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-violet-600 text-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-6 justify-between">
          <div>
            <div className="text-sm opacity-80">距离 2026 下半年软考（{examDate}）还有</div>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-5xl font-extrabold tabular-nums">{days > 0 ? days : 0}</span>
              <span className="text-lg mb-1.5">天</span>
            </div>
            <div className="text-xs opacity-75 mt-1">软件设计师（中级）· 机考 · 两科连考 240 分钟 · 45 分及格</div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/practice"
              className="px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur hover:bg-white/25 text-sm font-medium transition-colors"
            >
              ✏️ 开始刷题
            </Link>
            <Link
              to="/mock"
              className="px-4 py-2.5 rounded-xl bg-white text-primary-700 hover:bg-primary-50 text-sm font-medium transition-colors"
            >
              ⏱️ 整卷模考
            </Link>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-400">累计刷题</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-400">总正确率</div>
          <div className={`text-2xl font-bold mt-1 tabular-nums ${stats.accuracy >= 60 ? 'text-emerald-600' : stats.accuracy > 0 ? 'text-amber-600' : ''}`}>
            {stats.total ? `${stats.accuracy}%` : '—'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-400">
            今日刷题 <span className="text-slate-300">/ 目标 {dailyGoal}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold tabular-nums">{stats.todayCount}</span>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (stats.todayCount / dailyGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-400">待消灭错题</div>
          <Link to="/wrong" className="block mt-1 group">
            <span className="text-2xl font-bold tabular-nums text-rose-500 group-hover:underline">
              {Object.keys(wrongBook).length}
            </span>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 模块正确率 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="font-semibold mb-4">各模块正确率（刷题 10 题后显示）</div>
          <div className="space-y-2.5">
            {stats.byModule.map((m) => {
              const mod = MODULES.find((x) => x.id === m.id)!
              const show = m.total >= 10
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-xs w-40 shrink-0 truncate text-slate-500 dark:text-slate-400">
                    {mod.icon} {mod.name}
                  </span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden relative">
                    {show && (
                      <div
                        className={`h-full rounded-md transition-all ${
                          m.rate >= 80 ? 'bg-emerald-500' : m.rate >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${m.rate}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs w-20 text-right tabular-nums text-slate-400">
                    {show ? `${m.rate}%（${m.total}题）` : m.total > 0 ? `${m.total}题` : '未刷'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 学习进度 & 模考历史 */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="font-semibold mb-3">知识点掌握进度</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-primary-600 tabular-nums">
                {masteredChapters.length}
                <span className="text-base text-slate-400 font-normal"> / {totalChapters}</span>
              </div>
            </div>
            <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${totalChapters ? (masteredChapters.length / totalChapters) * 100 : 0}%` }}
              />
            </div>
            <Link to="/knowledge" className="inline-block mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline">
              继续学习 →
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="font-semibold mb-3">最近模考</div>
            {mockHistory.length === 0 ? (
              <div className="text-sm text-slate-400">还没有模考记录，来一次全真模拟吧</div>
            ) : (
              <div className="space-y-2">
                {mockHistory.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{new Date(m.date).toLocaleDateString('zh-CN')}</span>
                    <span className={`font-semibold tabular-nums ${m.morningScore >= 45 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      上午 {m.morningScore}/{m.morningTotal}
                      {m.afternoonSelfScore != null && ` · 下午自评 ${m.afternoonSelfScore}/75`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
