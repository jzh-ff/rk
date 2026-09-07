import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import AiAssistant from './AiAssistant'

const NAV = [
  { to: '/', label: '仪表盘', icon: '📊', end: true },
  { to: '/knowledge', label: '知识点', icon: '📚' },
  { to: '/formulas', label: '公式速查', icon: '📐' },
  { to: '/practice', label: '章节练习', icon: '✏️' },
  { to: '/mock', label: '整卷模考', icon: '⏱️' },
  { to: '/case', label: '案例分析', icon: '📝' },
  { to: '/ai-quiz', label: 'AI 出题', icon: '🤖' },
  { to: '/wrong', label: '错题本', icon: '📕' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export default function Layout() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const wrongCount = Object.keys(useAppStore((s) => s.wrongBook)).length

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 dark:border-slate-700">
          <span className="text-2xl">🎓</span>
          <div>
            <div className="font-bold text-sm">软件设计师</div>
            <div className="text-[11px] text-slate-400">软考中级 · 2026 下半年</div>
          </div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.to === '/wrong' && wrongCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] rounded-full px-1.5 py-0.5 min-w-5 text-center">
                  {wrongCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleTheme}
          className="m-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'light' ? '🌙 深色模式' : '☀️ 浅色模式'}
        </button>
      </aside>

      {/* 移动端顶栏 */}
      <div className="fixed top-0 left-0 right-0 z-20 md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex overflow-x-auto px-2 py-2 gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`
              }
            >
              {item.icon} {item.label}
              {item.to === '/wrong' && wrongCount > 0 ? ` (${wrongCount})` : ''}
            </NavLink>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* 全局 AI 助手 */}
      <AiAssistant />
    </div>
  )
}
