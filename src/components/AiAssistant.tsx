import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { chatWithAi, TUTOR_SYSTEM_PROMPT, type ChatMessage } from '../services/ai'
import Markdown from './Markdown'
import { MODULE_MAP } from '../data/modules'

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const aiConfig = useAppStore((s) => s.aiConfig)
  const listRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setError('')
    setInput('')
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setLoading(true)
    try {
      const reply = await chatWithAi(aiConfig, [
        { role: 'system', content: TUTOR_SYSTEM_PROMPT },
        ...next.slice(-12),
      ])
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-5 bottom-5 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-primary-600 text-2xl text-white shadow-lg hover:scale-105 transition-transform"
        title="AI 答疑助手"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* 抽屉 */}
      {open && (
        <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">AI 答疑助手</div>
              <div className="text-[11px] text-slate-400">
                {aiConfig.model ? `模型：${aiConfig.model}` : '未配置，点右上设置'}
              </div>
            </div>
            <button
              onClick={() => setMessages([])}
              className="text-xs text-slate-400 hover:text-rose-500"
              title="清空对话"
            >
              🧹 清空
            </button>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center text-sm text-slate-400 mt-10 space-y-3">
                <div className="text-4xl">🎓</div>
                <p>问我任何软考知识点，例如：</p>
                <div className="text-left space-y-2">
                  {['PV 操作的生产者消费者怎么设置信号量？', '哈夫曼树的 WPL 怎么算？', '观察者和发布订阅模式的区别？', `${MODULE_MAP['se']?.name}里关键路径怎么求？`].map(
                    (q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q)
                        }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        💬 {q}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 rounded-bl-sm'
                  }`}
                >
                  {m.role === 'user' ? m.content : <Markdown>{m.content}</Markdown>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-2 text-sm text-slate-400">
                  思考中<span className="animate-pulse">…</span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded-lg p-3">
                {error}
                {error.includes('未配置') && (
                  <button onClick={() => (location.hash = '', setOpen(false))} className="block mt-1 underline">
                    前往「设置」页配置 → 可从左侧导航「设置」进入
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="输入问题，回车发送…"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-40 hover:bg-primary-700"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  )
}
