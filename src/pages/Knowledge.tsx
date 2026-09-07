import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { MODULES, MODULE_MAP } from '../data/modules'
import { KNOWLEDGE } from '../data/knowledge'
import { useAppStore } from '../store/useAppStore'
import Markdown from '../components/Markdown'

const HOT_LABELS: Record<number, string> = { 3: '必考', 2: '常考', 1: '了解' }
const HOT_STYLES: Record<number, string> = {
  3: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
  2: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  1: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
}

export default function Knowledge() {
  const { moduleId, chapterId } = useParams()
  const navigate = useNavigate()
  const mastered = useAppStore((s) => s.masteredChapters)
  const toggleMastered = useAppStore((s) => s.toggleMastered)

  /* 模块列表 */
  if (!moduleId) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-1">📚 知识点学习</h1>
        <p className="text-sm text-slate-400 mb-5">按考纲组织的 12 大模块精讲，掌握后标记 ✔ 计入进度</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {MODULES.map((m) => {
            const k = KNOWLEDGE[m.id]
            const chapterCount = k?.chapters.length ?? 0
            const masteredCount = k?.chapters.filter((c) => mastered.includes(c.id)).length ?? 0
            return (
              <Link
                key={m.id}
                to={`/knowledge/${m.id}`}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold group-hover:text-primary-600">{m.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{m.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${chapterCount ? (masteredCount / chapterCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {masteredCount}/{chapterCount} 章
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const mod = MODULE_MAP[moduleId]
  const knowledge = KNOWLEDGE[moduleId]
  if (!mod || !knowledge) {
    return <div className="text-slate-400">模块不存在</div>
  }

  /* 章节阅读 */
  if (chapterId) {
    const chapter = knowledge.chapters.find((c) => c.id === chapterId)
    if (!chapter) return <div className="text-slate-400">章节不存在</div>
    const idx = knowledge.chapters.findIndex((c) => c.id === chapterId)
    const prev = knowledge.chapters[idx - 1]
    const next = knowledge.chapters[idx + 1]
    const isMastered = mastered.includes(chapter.id)

    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link to="/knowledge" className="hover:text-primary-500">知识点</Link>
          <span>/</span>
          <Link to={`/knowledge/${moduleId}`} className="hover:text-primary-500">
            {mod.icon} {mod.name}
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-xl font-bold">{chapter.title}</h1>
            <button
              onClick={() => toggleMastered(chapter.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isMastered
                  ? 'bg-emerald-500 text-white'
                  : 'border border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              {isMastered ? '✔ 已掌握' : '标记掌握'}
            </button>
          </div>
          <Markdown>{chapter.content}</Markdown>
        </div>
        <div className="flex justify-between mt-4">
          {prev ? (
            <button
              onClick={() => navigate(`/knowledge/${moduleId}/${prev.id}`)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm hover:border-primary-400"
            >
              ← {prev.title}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              onClick={() => navigate(`/knowledge/${moduleId}/${next.id}`)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm hover:border-primary-400"
            >
              {next.title} →
            </button>
          ) : (
            <Link
              to={`/practice?module=${moduleId}`}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
            >
              去刷本模块题目 →
            </Link>
          )}
        </div>
      </div>
    )
  }

  /* 模块章节列表 */
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
        <Link to="/knowledge" className="hover:text-primary-500">知识点</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">{mod.name}</span>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">{mod.icon}</span>
        <div>
          <h1 className="text-xl font-bold">{mod.name}</h1>
          <p className="text-sm text-slate-400">{mod.description}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {knowledge.chapters.map((c, i) => (
          <Link
            key={c.id}
            to={`/knowledge/${moduleId}/${c.id}`}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-primary-400 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 text-sm font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="font-medium flex-1">{c.title}</span>
            {c.hot && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${HOT_STYLES[c.hot]}`}>{HOT_LABELS[c.hot]}</span>
            )}
            {mastered.includes(c.id) && <span className="text-emerald-500 text-sm">✔ 已掌握</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
