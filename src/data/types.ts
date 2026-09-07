/** 12 大知识模块配置 */
export interface ModuleConfig {
  id: string
  name: string
  icon: string
  description: string
  /** 上午题典型考题数量（智能组卷权重依据） */
  examCount: number
  order: number
}

/** 选择题 */
export interface Question {
  id: string
  moduleId: string
  /** 所属章节名（与知识点章节对应，用于章节细分练习） */
  chapter?: string
  /** 题干（Markdown） */
  stem: string
  /** 四个选项（不含 A. 前缀） */
  options: string[]
  /** 正确答案索引 0~3 */
  answer: number
  /** 解析（Markdown） */
  explanation: string
  /** 难度：1 基础 / 2 中等 / 3 较难 */
  difficulty: 1 | 2 | 3
  /** 高频常考标记 */
  hot?: boolean
}

/** 案例分析题型 */
export type CaseCategory = 'dfd' | 'db' | 'uml' | 'algo' | 'oop'

export interface CaseSubQuestion {
  id: string
  stem: string
  /** 分值 */
  points: number
  /** 参考答案（Markdown） */
  referenceAnswer: string
  /** 评分要点 */
  scoringPoints?: string[]
}

/** 下午案例分析大题 */
export interface CaseQuestion {
  id: string
  category: CaseCategory
  title: string
  /** 背景材料（Markdown） */
  material: string
  subQuestions: CaseSubQuestion[]
  /** 解题套路总结（Markdown） */
  techniques?: string
}

/** 知识点章节 */
export interface Chapter {
  id: string
  title: string
  /** 章节内容（Markdown） */
  content: string
  /** 常考程度：3 必考 / 2 常考 / 1 了解 */
  hot?: 1 | 2 | 3
}

/** 模块知识包 */
export interface ModuleKnowledge {
  moduleId: string
  chapters: Chapter[]
}

export const CASE_CATEGORY_LABELS: Record<CaseCategory, string> = {
  dfd: '数据流图',
  db: '数据库设计',
  uml: 'UML 建模',
  algo: '算法分析（C）',
  oop: '面向对象（C++/Java）',
}
