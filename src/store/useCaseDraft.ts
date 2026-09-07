import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 案例分析专项练习的作答草稿（持久化） */
interface CaseDraftState {
  drafts: Record<string, Record<string, string>>
  selfScores: Record<string, Record<string, number>>
  setDraft: (caseId: string, subId: string, text: string) => void
  setScore: (caseId: string, subId: string, score: number) => void
  clearCase: (caseId: string) => void
}

export const useCaseDraft = create<CaseDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      selfScores: {},
      setDraft: (caseId, subId, text) =>
        set((s) => ({
          drafts: { ...s.drafts, [caseId]: { ...(s.drafts[caseId] ?? {}), [subId]: text } },
        })),
      setScore: (caseId, subId, score) =>
        set((s) => ({
          selfScores: { ...s.selfScores, [caseId]: { ...(s.selfScores[caseId] ?? {}), [subId]: score } },
        })),
      clearCase: (caseId) =>
        set((s) => {
          const drafts = { ...s.drafts }
          const selfScores = { ...s.selfScores }
          delete drafts[caseId]
          delete selfScores[caseId]
          return { drafts, selfScores }
        }),
    }),
    { name: 'rk-case-draft' },
  ),
)
