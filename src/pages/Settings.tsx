import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export default function Settings() {
  const examDate = useAppStore((s) => s.examDate)
  const setExamDate = useAppStore((s) => s.setExamDate)
  const dailyGoal = useAppStore((s) => s.dailyGoal)
  const setDailyGoal = useAppStore((s) => s.setDailyGoal)
  const importData = useAppStore((s) => s.importData)
  const clearAllData = useAppStore((s) => s.clearAllData)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportData = () => {
    const s = useAppStore.getState()
    const payload = {
      exportedAt: new Date().toISOString(),
      records: s.records,
      wrongBook: s.wrongBook,
      favorites: s.favorites,
      masteredChapters: s.masteredChapters,
      mockHistory: s.mockHistory,
      examDate: s.examDate,
      dailyGoal: s.dailyGoal,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `软考学习数据备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('✅ 数据已导出')
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const ok = importData(JSON.parse(text))
      setMsg(ok ? '✅ 数据导入成功' : '❌ 文件格式不正确')
    } catch {
      setMsg('❌ 无法解析该文件')
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold">⚙️ 设置</h1>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold mb-4">考试与目标</h2>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm">考试日期（用于首页倒计时）</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </label>
        <label className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700">
          <span className="text-sm">每日刷题目标</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={500}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value) || 1)}
              className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-right"
            />
            <span className="text-sm text-slate-400">题/天</span>
          </div>
        </label>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold mb-2">数据备份</h2>
        <p className="text-xs text-slate-400 mb-4">
          学习进度保存在浏览器本地（localStorage）。换电脑或换浏览器时，先导出、再导入即可迁移。
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
          >
            导出数据
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:border-primary-400"
          >
            导入数据
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {msg && <div className="mt-3 text-sm text-slate-500">{msg}</div>}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900 p-5">
        <h2 className="font-semibold mb-2 text-rose-500">危险操作</h2>
        <p className="text-xs text-slate-400 mb-4">清空全部学习记录（刷题记录、错题本、收藏、模考历史），不可恢复。</p>
        <button
          onClick={() => {
            if (confirm('确定清空全部学习数据吗？此操作不可恢复！')) {
              clearAllData()
              setMsg('✅ 已清空')
            }
          }}
          className="px-4 py-2 rounded-lg border border-rose-300 text-rose-500 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30"
        >
          清空全部数据
        </button>
      </section>
    </div>
  )
}
