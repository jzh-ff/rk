/** AI 服务层：直连 OpenAI 兼容接口（智谱 GLM / DeepSeek / Ollama 等） */

export interface AiConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const AI_PRESETS: { name: string; baseUrl: string; model: string; note: string }[] = [
  {
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    note: 'bigmodel.cn 注册即送额度，glm-4-flash 免费',
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    note: 'platform.deepseek.com 充值使用，价格低',
  },
  {
    name: 'Ollama 本地',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    note: '本机安装 Ollama 后免费离线使用，无需 Key',
  },
]

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI 接口未配置，请先到「设置」页填写 baseUrl / model / API Key')
    this.name = 'AiNotConfiguredError'
  }
}

/** 调用 chat/completions，返回首个回复文本 */
export async function chatWithAi(config: AiConfig, messages: ChatMessage[], timeoutMs = 90000): Promise<string> {
  if (!config.baseUrl || !config.model) throw new AiNotConfiguredError()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
    const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.4,
        stream: false,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`接口返回 ${res.status}：${body.slice(0, 200) || res.statusText}`)
    }
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text) throw new Error('接口返回内容为空，请检查模型名称是否正确')
    return text
  } catch (e: unknown) {
    if (e instanceof AiNotConfiguredError) throw e
    const err = e as Error
    if (err.name === 'AbortError') throw new Error('请求超时，请稍后重试或换用更快的模型')
    if (err.message?.includes('Failed to fetch')) {
      throw new Error('网络请求失败：请检查 baseUrl 是否正确、接口是否允许浏览器直连（CORS）；本地 Ollama 需设置 OLLAMA_ORIGINS=*')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/** 从模型回复中提取 JSON 数组（容错处理 markdown 围栏、前后杂文） */
export function extractJsonArray<T>(text: string): T[] {
  const cleaned = text.replace(/```(?:json)?/g, '')
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) throw new Error('AI 未返回合法的 JSON 数组，请重试')
  const json = cleaned.slice(start, end + 1)
  return JSON.parse(json) as T[]
}

export const TUTOR_SYSTEM_PROMPT =
  '你是一位经验丰富的软考中级软件设计师辅导老师，熟悉考试大纲与历年真题风格。' +
  '回答务必准确、简洁、贴合应试：先给结论，再给要点；涉及计算给出步骤；适当给记忆口诀。' +
  '用户可能在任何学习页面提问，请直接回答问题本身，使用 Markdown 格式。'
