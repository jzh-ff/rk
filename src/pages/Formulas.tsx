import { useMemo, useState } from 'react'
import { FORMULA_GROUPS } from '../data/formulas'

export default function Formulas() {
  const [query, setQuery] = useState('')
  const [onlyHot, setOnlyHot] = useState(false)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FORMULA_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (onlyHot && !it.hot) return false
        if (!q) return true
        const hay = (it.name + ' ' + it.formula + ' ' + (it.note ?? '')).toLowerCase()
        return hay.includes(q)
      }),
    })).filter((g) => g.items.length > 0)
  }, [query, onlyHot])

  const total = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">📐 考前公式速查</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          整理自资源包《软件设计师考试常用公式》《软件设计师笔记》，覆盖上午计算题全部高频公式。
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索公式，如：流水线 / 子网 / 环路复杂度…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
        />
        <button
          onClick={() => setOnlyHot((v) => !v)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
            onlyHot
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
          }`}
        >
          🔥 只看高频
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-4">共 {total} 条公式</p>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.id}>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
              <span>{g.icon}</span>
              {g.title}
              <span className="text-xs font-normal text-slate-400">{g.items.length} 条</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((it) => (
                <div
                  key={it.name}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{it.name}</h3>
                    {it.hot && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">高频</span>}
                  </div>
                  <pre className="text-[13px] leading-relaxed font-mono whitespace-pre-wrap text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-2.5 mb-2">
{it.formula}
                  </pre>
                  {it.note && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">💡 {it.note}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <div className="text-center text-slate-400 py-16">没有匹配的公式，换个关键词试试</div>
        )}
      </div>
    </div>
  )
}
