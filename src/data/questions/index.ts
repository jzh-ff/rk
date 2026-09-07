import type { Question } from '../types'
import { coQuestions } from './co'
import { osQuestions } from './os'
import { dbQuestions } from './db'
import { nwQuestions } from './nw'
import { secQuestions } from './sec'
import { seQuestions } from './se'
import { ooQuestions } from './oo'
import { dsQuestions } from './ds'
import { plQuestions } from './pl'
import { mathQuestions } from './math'
import { lawQuestions } from './law'
import { enQuestions } from './en'

export const ALL_QUESTIONS: Question[] = [
  ...coQuestions,
  ...osQuestions,
  ...dbQuestions,
  ...nwQuestions,
  ...secQuestions,
  ...seQuestions,
  ...ooQuestions,
  ...dsQuestions,
  ...plQuestions,
  ...mathQuestions,
  ...lawQuestions,
  ...enQuestions,
]

export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(
  ALL_QUESTIONS.map((q) => [q.id, q]),
)

/** 按模块取题 */
export function questionsOfModule(moduleId: string): Question[] {
  return ALL_QUESTIONS.filter((q) => q.moduleId === moduleId)
}

/** 模块下的章节列表（按出现顺序去重） */
export function chaptersOfModule(moduleId: string): string[] {
  const seen = new Set<string>()
  for (const q of questionsOfModule(moduleId)) {
    if (q.chapter && !seen.has(q.chapter)) seen.add(q.chapter)
  }
  return [...seen]
}

/** 智能组卷：按模块配额加权抽题，凑满 total 题（配额不足时用其他模块补齐） */
export function buildMockPaper(total = 75): string[] {
  const byModule = new Map<string, Question[]>()
  for (const q of ALL_QUESTIONS) {
    const list = byModule.get(q.moduleId) ?? []
    list.push(q)
    byModule.set(q.moduleId, list)
  }
  const picked: Question[] = []
  const quotas = MOCK_QUOTAS
  for (const [moduleId, quota] of Object.entries(quotas)) {
    const pool = [...(byModule.get(moduleId) ?? [])]
    shuffle(pool)
    picked.push(...pool.slice(0, quota))
  }
  // 题库不足时从剩余题目补齐
  if (picked.length < total) {
    const rest = ALL_QUESTIONS.filter((q) => !picked.includes(q))
    shuffle(rest)
    picked.push(...rest.slice(0, total - picked.length))
  }
  shuffle(picked)
  return picked.slice(0, total).map((q) => q.id)
}

/** 组卷配额：参照近年真题各模块题量分布 */
export const MOCK_QUOTAS: Record<string, number> = {
  oo: 11,
  se: 9,
  ds: 9,
  co: 6,
  os: 6,
  db: 6,
  nw: 5,
  sec: 4,
  pl: 4,
  math: 3,
  law: 2,
  en: 5,
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
