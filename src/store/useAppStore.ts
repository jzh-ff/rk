import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QUESTION_MAP } from '../data/questions'

/** 单次作答记录 */
export interface AnswerRecord {
  questionId: string
  selected: number
  correct: boolean
  time: number
  mode: 'practice' | 'wrong' | 'mock' | 'case'
}

/** 错题条目 */
export interface WrongItem {
  questionId: string
  wrongCount: number
  lastWrongAt: number
  lastSelection: number
}

/** 模考成绩 */
export interface MockResult {
  id: string
  date: number
  morningScore: number
  morningTotal: number
  morningDurationMin: number
  morningDetail: { questionId: string; selected: number | null; correct: boolean }[]
  afternoonSelfScore: number | null
  afternoonTotal: number
  finished: boolean
}

/** 进行中的模考（持久化，刷新可恢复；计时以 startTime 为准） */
export interface ActiveMock {
  createdAt: number
  /** 上午 75 题的 id */
  morningQuestionIds: string[]
  morningSelections: (number | null)[]
  morningFlags: boolean[]
  startTime: number
  morningSubmitted: boolean
  /** 第 5/6 题选择：cpp 或 java */
  oopChoice: 'cpp' | 'java' | null
  /** 下午 5 道案例题 id */
  caseIds: string[]
  /** caseId -> subQuestionId -> 作答文本 */
  caseAnswers: Record<string, Record<string, string>>
  /** caseId -> subQuestionId -> 自评分 */
  caseSelfScores: Record<string, Record<string, number>>
}

interface AppState {
  /* 设置 */
  examDate: string
  dailyGoal: number
  theme: 'light' | 'dark'
  /* 学习数据 */
  records: AnswerRecord[]
  wrongBook: Record<string, WrongItem>
  favorites: string[]
  masteredChapters: string[]
  mockHistory: MockResult[]
  activeMock: ActiveMock | null

  /* actions */
  setExamDate: (d: string) => void
  setDailyGoal: (n: number) => void
  toggleTheme: () => void
  addRecord: (r: AnswerRecord) => void
  toggleFavorite: (id: string) => void
  removeWrong: (id: string) => void
  clearWrongBook: () => void
  toggleMastered: (chapterId: string) => void
  startMock: (questionIds: string[]) => void
  setMorningSelection: (index: number, opt: number | null) => void
  toggleMorningFlag: (index: number) => void
  submitMorning: () => void
  setOopChoice: (choice: 'cpp' | 'java', caseIds: string[]) => void
  setCaseAnswer: (caseId: string, subId: string, text: string) => void
  setCaseSelfScore: (caseId: string, subId: string, score: number) => void
  finishMock: () => void
  cancelMock: () => void
  importData: (payload: unknown) => boolean
  clearAllData: () => void
}

const MAX_RECORDS = 5000

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      examDate: '2026-10-24',
      dailyGoal: 30,
      theme: 'light',
      records: [],
      wrongBook: {},
      favorites: [],
      masteredChapters: [],
      mockHistory: [],
      activeMock: null,

      setExamDate: (d) => set({ examDate: d }),
      setDailyGoal: (n) => set({ dailyGoal: Math.max(1, Math.min(500, n)) }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      addRecord: (r) =>
        set((s) => {
          const records = [r, ...s.records].slice(0, MAX_RECORDS)
          let wrongBook = s.wrongBook
          if (!r.correct && r.mode !== 'case') {
            const prev = s.wrongBook[r.questionId]
            wrongBook = {
              ...s.wrongBook,
              [r.questionId]: {
                questionId: r.questionId,
                wrongCount: (prev?.wrongCount ?? 0) + 1,
                lastWrongAt: r.time,
                lastSelection: r.selected,
              },
            }
          }
          return { records, wrongBook }
        }),

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),

      removeWrong: (id) =>
        set((s) => {
          const next = { ...s.wrongBook }
          delete next[id]
          return { wrongBook: next }
        }),

      clearWrongBook: () => set({ wrongBook: {} }),

      toggleMastered: (chapterId) =>
        set((s) => ({
          masteredChapters: s.masteredChapters.includes(chapterId)
            ? s.masteredChapters.filter((c) => c !== chapterId)
            : [...s.masteredChapters, chapterId],
        })),

      startMock: (questionIds) =>
        set({
          activeMock: {
            createdAt: Date.now(),
            morningQuestionIds: questionIds,
            morningSelections: questionIds.map(() => null),
            morningFlags: questionIds.map(() => false),
            startTime: Date.now(),
            morningSubmitted: false,
            oopChoice: null,
            caseIds: [],
            caseAnswers: {},
            caseSelfScores: {},
          },
        }),

      setMorningSelection: (index, opt) =>
        set((s) => {
          if (!s.activeMock) return {}
          const sel = [...s.activeMock.morningSelections]
          sel[index] = opt
          return { activeMock: { ...s.activeMock, morningSelections: sel } }
        }),

      toggleMorningFlag: (index) =>
        set((s) => {
          if (!s.activeMock) return {}
          const flags = [...s.activeMock.morningFlags]
          flags[index] = !flags[index]
          return { activeMock: { ...s.activeMock, morningFlags: flags } }
        }),

      submitMorning: () => {
        const s = get()
        const active = s.activeMock
        if (!active || active.morningSubmitted) return
        const morningDetail = active.morningQuestionIds.map((qid, i) => {
          const q = QUESTION_MAP[qid]
          const sel = active.morningSelections[i]
          return { questionId: qid, selected: sel, correct: !!q && sel === q.answer }
        })
        const score = morningDetail.filter((d) => d.correct).length
        const durationMin = Math.round((Date.now() - active.startTime) / 60000)
        const mockRecords: AnswerRecord[] = morningDetail.map((d) => ({
          questionId: d.questionId,
          selected: d.selected ?? -1,
          correct: d.correct,
          time: Date.now(),
          mode: 'mock' as const,
        }))
        set({
          activeMock: { ...active, morningSubmitted: true },
          records: [...mockRecords, ...s.records].slice(0, MAX_RECORDS),
          mockHistory: [
            {
              id: `mock-${active.createdAt}`,
              date: active.createdAt,
              morningScore: score,
              morningTotal: morningDetail.length,
              morningDurationMin: durationMin,
              morningDetail,
              afternoonSelfScore: null,
              afternoonTotal: 75,
              finished: false,
            },
            ...s.mockHistory,
          ].slice(0, 100),
        })
      },

      setOopChoice: (choice, caseIds) =>
        set((s) => (s.activeMock ? { activeMock: { ...s.activeMock, oopChoice: choice, caseIds } } : {})),

      setCaseAnswer: (caseId, subId, text) =>
        set((s) => {
          if (!s.activeMock) return {}
          const answers = { ...s.activeMock.caseAnswers }
          answers[caseId] = { ...(answers[caseId] ?? {}), [subId]: text }
          return { activeMock: { ...s.activeMock, caseAnswers: answers } }
        }),

      setCaseSelfScore: (caseId, subId, score) =>
        set((s) => {
          if (!s.activeMock) return {}
          const scores = { ...s.activeMock.caseSelfScores }
          scores[caseId] = { ...(scores[caseId] ?? {}), [subId]: score }
          return { activeMock: { ...s.activeMock, caseSelfScores: scores } }
        }),

      finishMock: () => {
        const s = get()
        if (!s.activeMock) return
        const active = s.activeMock
        // 汇总下午自评总分
        let selfScore = 0
        let hasScore = false
        for (const caseId of Object.keys(active.caseSelfScores)) {
          for (const v of Object.values(active.caseSelfScores[caseId])) {
            if (v != null) {
              selfScore += v
              hasScore = true
            }
          }
        }
        const history = s.mockHistory.map((m) =>
          m.id === `mock-${active.createdAt}`
            ? { ...m, finished: true, afternoonSelfScore: hasScore ? selfScore : null }
            : m,
        )
        set({ activeMock: null, mockHistory: history })
      },

      cancelMock: () => {
        const s = get()
        if (!s.activeMock) return
        // 取消时把未完成的成绩记录移除
        set({
          activeMock: null,
          mockHistory: s.mockHistory.filter((m) => m.id !== `mock-${s.activeMock!.createdAt}`),
        })
      },

      importData: (payload) => {
        try {
          const p = payload as Partial<AppState>
          if (!p || typeof p !== 'object') return false
          const next: Partial<AppState> = {}
          if (Array.isArray(p.records)) next.records = p.records
          if (p.wrongBook && typeof p.wrongBook === 'object') next.wrongBook = p.wrongBook
          if (Array.isArray(p.favorites)) next.favorites = p.favorites
          if (Array.isArray(p.masteredChapters)) next.masteredChapters = p.masteredChapters
          if (Array.isArray(p.mockHistory)) next.mockHistory = p.mockHistory
          if (typeof p.examDate === 'string') next.examDate = p.examDate
          if (typeof p.dailyGoal === 'number') next.dailyGoal = p.dailyGoal
          set(next)
          return true
        } catch {
          return false
        }
      },

      clearAllData: () =>
        set({
          records: [],
          wrongBook: {},
          favorites: [],
          masteredChapters: [],
          mockHistory: [],
          activeMock: null,
        }),
    }),
    { name: 'rk-designer-store' },
  ),
)
