import type { ModuleConfig } from './types'

/**
 * 12 大知识模块（与官方考纲对应）。
 * examCount 为上午《基础知识》75 题中的典型题量（近年真题均值），
 * 同时作为整卷模考智能组卷的抽题配额。
 */
export const MODULES: ModuleConfig[] = [
  {
    id: 'co',
    name: '计算机组成与体系结构',
    icon: '🖥️',
    description: '数据表示与运算、存储体系、指令系统、总线与 I/O、体系结构分类与可靠性',
    examCount: 6,
    order: 1,
  },
  {
    id: 'os',
    name: '操作系统',
    icon: '⚙️',
    description: '进程管理（PV 操作、死锁）、存储管理（页式/段式）、文件管理、设备管理',
    examCount: 6,
    order: 2,
  },
  {
    id: 'db',
    name: '数据库系统',
    icon: '🗄️',
    description: '关系代数、SQL 语言、规范化理论（范式）、并发控制、分布式数据库',
    examCount: 6,
    order: 3,
  },
  {
    id: 'nw',
    name: '计算机网络',
    icon: '🌐',
    description: 'OSI/TCP-IP 体系、IP 地址与子网划分、常用协议、传输介质与网络设备',
    examCount: 5,
    order: 4,
  },
  {
    id: 'sec',
    name: '信息安全',
    icon: '🔐',
    description: '对称/非对称加密、数字签名与证书、报文摘要、防火墙与常见攻击',
    examCount: 4,
    order: 5,
  },
  {
    id: 'se',
    name: '软件工程',
    icon: '🧪',
    description: '开发模型、需求分析、系统设计、软件测试、质量管理、项目管理（关键路径/挣值）',
    examCount: 9,
    order: 6,
  },
  {
    id: 'oo',
    name: '面向对象与设计模式',
    icon: '🧩',
    description: '面向对象基本概念、UML 图、设计原则、23 种设计模式（下午 5/6 题核心）',
    examCount: 11,
    order: 7,
  },
  {
    id: 'ds',
    name: '数据结构与算法',
    icon: '🌳',
    description: '线性表、树与二叉树、图、查找与排序、算法设计与分析（下午第 4 题核心）',
    examCount: 9,
    order: 8,
  },
  {
    id: 'pl',
    name: '程序语言与编译基础',
    icon: '📜',
    description: '编译与解释、文法与语言、有限自动机、表达式（前中后缀）、函数调用',
    examCount: 4,
    order: 9,
  },
  {
    id: 'math',
    name: '数学与经济管理',
    icon: '📐',
    description: '矩阵运算、概率、图论应用、运算逻辑、预测与决策、线性规划',
    examCount: 3,
    order: 10,
  },
  {
    id: 'law',
    name: '知识产权与标准化',
    icon: '⚖️',
    description: '著作权、专利权、商标权、保护期限、标准分级（送分题，务必拿满）',
    examCount: 2,
    order: 11,
  },
  {
    id: 'en',
    name: '专业英语',
    icon: '🔤',
    description: '技术短文完形填空（固定 5 题），软件工程/网络/数据库主题高频词汇',
    examCount: 5,
    order: 12,
  },
  {
    id: 'mm',
    name: '多媒体基础',
    icon: '🎬',
    description: '图像容量计算、音频采样定理、视频编码、有损/无损压缩（近年稳定送分题）',
    examCount: 3,
    order: 13,
  },
  {
    id: 'arch',
    name: '软件架构与新技术',
    icon: '🏛️',
    description: '架构风格（分层/管道/事件驱动/MVC）、中间件、SOA/微服务、数据仓库、云计算',
    examCount: 2,
    order: 14,
  },
]

/** 模块 id → 配置 */
export const MODULE_MAP: Record<string, ModuleConfig> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
)
