/**
 * 导出 Obsidian 软考复习知识图谱
 * 用法：npx esbuild scripts/export-obsidian.ts --bundle --platform=node --format=esm --outfile=/tmp/eo.mjs && node /tmp/eo.mjs
 * 输出：D:\OrangeMemory\橘子记忆\软考软件设计师\（可在下方 VAULT_DIR 覆盖）
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { MODULES } from '../src/data/modules'
import { KNOWLEDGE } from '../src/data/knowledge'
import { CASES } from '../src/data/cases'
import type { Chapter, CaseQuestion } from '../src/data/types'

const VAULT_DIR = process.argv[2] ?? 'D:/OrangeMemory/橘子记忆/软考软件设计师'

/** Windows 文件名非法字符清洗 */
function safeName(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim()
}

/* ---------- 文件名注册表（先建后用，保证链接一致） ---------- */
const MOD_SHORT: Record<string, string> = {
  co: 'CO', os: 'OS', db: 'DB', nw: 'NW', sec: 'SEC', se: 'SE',
  oo: 'OO', ds: 'DS', pl: 'PL', math: 'MA', law: 'LAW', en: 'EN',
  mm: 'MM', arch: 'ARCH',
}

const chapterFile = new Map<string, string>() // chapterId -> 文件名（不含扩展名）
const caseFile = new Map<string, string>() // caseId -> 文件名
const mocFile = new Map<string, string>() // moduleId -> MOC 文件名

for (const m of MODULES) {
  const kn = KNOWLEDGE[m.id]
  if (!kn) continue
  mocFile.set(m.id, `MOC-${safeName(m.name)}`)
  kn.chapters.forEach((c, i) => chapterFile.set(c.id, `${MOD_SHORT[m.id]}-${String(i + 1).padStart(2, '0')} ${safeName(c.title)}`))
}
for (const c of CASES) {
  const label = { dfd: 'DFD', db: 'DB', uml: 'UML', algo: '算法', oop: 'OOP' }[c.category]
  caseFile.set(c.id, `案例-${label}-${safeName(c.title)}`)
}

const wikilink = (id: string): string => {
  const f = chapterFile.get(id) ?? caseFile.get(id)
  return f ? `[[${f}]]` : ''
}

/* ---------- 学科关联边（知识图谱的核心：章节 ↔ 章节） ---------- */
const EDGES: Record<string, string[]> = {
  'co-c1': ['mm-c1', 'co-c2', 'pl-c3'],
  'co-c2': ['co-c1', 'co-c4', 'os-c3'],
  'co-c3': ['co-c5', 'ds-c4'],
  'co-c4': ['co-c2'],
  'co-c5': ['co-c3'],
  'os-c1': ['os-c2', 'ds-c1'],
  'os-c2': ['os-c1', 'db-c4'],
  'os-c3': ['co-c2'],
  'os-c4': ['co-c2'],
  'db-c1': ['db-c2', 'db1'],
  'db-c2': ['db-c3', 'db-c1', 'db1', 'arch-c3'],
  'db-c3': ['db-c2'],
  'db-c4': ['os-c2'],
  'nw-c1': ['nw-c3', 'nw-c4', 'sec-c3'],
  'nw-c2': ['math-c1'],
  'nw-c3': ['nw-c1', 'sec-c2'],
  'nw-c4': ['nw-c1'],
  'sec-c1': ['sec-c2'],
  'sec-c2': ['sec-c1', 'nw-c3'],
  'sec-c3': ['nw-c1'],
  'se-c1': ['se-c5', 'arch-c2'],
  'se-c2': ['se-c3', 'dfd1', 'dfd2', 'dfd3'],
  'se-c3': ['se-c2', 'se-c5'],
  'se-c4': ['ds-c3'],
  'se-c5': ['se-c1', 'se-c3'],
  'oo-c1': ['oo-c2'],
  'oo-c2': ['oo-c1', 'oo-c4', 'uml1', 'uml2'],
  'oo-c3': ['oo-c4'],
  'oo-c4': ['oo-c2', 'oo-c3', 'oop1', 'oop2'],
  'ds-c1': ['ds-c2'],
  'ds-c2': ['ds-c1', 'algo2'],
  'ds-c3': ['se-c4', 'math-c1', 'algo1'],
  'ds-c4': ['ds-c5'],
  'ds-c5': ['ds-c4', 'algo1', 'algo2'],
  'pl-c1': ['pl-c2'],
  'pl-c2': ['pl-c1', 'en-c1'],
  'pl-c3': ['co-c1'],
  'math-c1': ['nw-c2', 'ds-c3'],
  'math-c2': ['math-c1'],
  'law-c1': ['law-c2'],
  'law-c2': [],
  'en-c1': ['pl-c2'],
  'mm-c1': ['mm-c2', 'co-c1'],
  'mm-c2': ['mm-c1'],
  'arch-c1': ['arch-c2', 'se-c2'],
  'arch-c2': ['arch-c1', 'se-c1', 'arch-c3'],
  'arch-c3': ['db-c2', 'arch-c2'],
}

/* ---------- 案例 → 知识点关联 ---------- */
const CASE_EDGES: Record<string, string[]> = {
  dfd1: ['se-c2', 'se-c1'],
  dfd2: ['se-c2', 'se-c1'],
  dfd3: ['se-c2', 'se-c1'],
  db1: ['db-c1', 'db-c2', 'db-c3'],
  uml1: ['oo-c2', 'oo-c1'],
  uml2: ['oo-c2', 'oo-c1'],
  algo1: ['ds-c5', 'ds-c4'],
  algo2: ['ds-c5', 'ds-c2'],
  oop1: ['oo-c4', 'oo-c3'],
  oop2: ['oo-c4', 'oo-c3'],
}

const HOT_TEXT: Record<number, string> = { 3: '必考', 2: '常考', 1: '了解' }

function frontmatter(pairs: Record<string, string>): string {
  const lines = Object.entries(pairs).map(([k, v]) => `${k}: ${v}`)
  return `---\n${lines.join('\n')}\n---\n`
}

function writeChapter(modId: string, modName: string, ch: Chapter, idx: number, total: number): string {
  const kn = KNOWLEDGE[modId]
  const prev = kn.chapters[idx - 1]
  const next = kn.chapters[idx + 1]
  const relIds = EDGES[ch.id] ?? []
  const relLinks = relIds.map(wikilink).filter(Boolean)

  const caseLinks = relIds
    .filter((id) => caseFile.has(id))
    .map(wikilink)
    .filter(Boolean)
  const knowLinks = relIds
    .filter((id) => chapterFile.has(id))
    .map(wikilink)
    .filter(Boolean)

  const body = [
    frontmatter({
      tags: `软考, ${safeName(modName)}, ${HOT_TEXT[ch.hot ?? 2]}`,
      模块: safeName(modName),
      考频: HOT_TEXT[ch.hot ?? 2],
    }),
    `> [!info] 导航\n> [[${mocFile.get(modId)}]]${prev ? ` · 上一节 ${wikilink(prev.id)}` : ''}${next ? ` · 下一节 ${wikilink(next.id)}` : ''}\n`,
    `# ${ch.title}\n`,
    ch.content,
    knowLinks.length > 0 ? `\n## 🔗 关联知识点\n\n${knowLinks.map((l) => `- ${l}`).join('\n')}\n` : '',
    caseLinks.length > 0 ? `\n## 📝 对应下午案例题\n\n${caseLinks.map((l) => `- ${l}`).join('\n')}\n` : '',
    `\n---\n*复习完成后回到 [[${mocFile.get(modId)}]] 勾选 ✅，配合网站刷题：https://jzhm.fun/ruankao/*`,
  ]
  return body.filter((s) => s !== '').join('\n')
}

function writeMoc(modId: string, modName: string, icon: string, desc: string, examCount: number, chapters: Chapter[]): string {
  const kn = KNOWLEDGE[modId]
  const others = MODULES.filter((m) => m.id !== modId)
    .map((m) => `[[${mocFile.get(m.id)}|${m.icon} ${m.name}]]`)
    .join(' · ')
  return [
    frontmatter({ tags: `软考, MOC, ${safeName(modName)}`, 类型: '模块导航' }),
    `# ${icon} ${modName}\n`,
    `> [!tip] 上午题典型题量：**${examCount} 题**\n> ${desc}\n`,
    `## 章节清单\n`,
    chapters.map((c, i) => `- [${i === 0 ? ' ' : ' '}] [[${chapterFile.get(c.id)}]] ${c.hot === 3 ? '🔴必考' : c.hot === 2 ? '🟡常考' : '⚪了解'}`).join('\n'),
    `\n## 全部模块\n\n${others}\n`,
    `\n---\n*返回 [[00 · 开始这里]]*`,
  ].join('\n')
}

function writeCase(c: CaseQuestion): string {
  const catLabel = { dfd: '数据流图（下午第 1 题）', db: '数据库设计（下午第 2 题）', uml: 'UML 建模（下午第 3 题）', algo: '算法分析（下午第 4 题）', oop: '面向对象（下午第 5/6 题，二选一）' }[c.category]
  const relLinks = (CASE_EDGES[c.id] ?? []).map(wikilink).filter(Boolean)
  const parts = [
    frontmatter({ tags: `软考, 案例分析, ${catLabel.includes('数据流') ? 'DFD' : c.category.toUpperCase()}`, 题型: catLabel }),
    `# ${c.title}\n`,
    `> [!note] ${catLabel} · 共 ${c.subQuestions.reduce((a, s) => a + s.points, 0)} 分\n`,
    `## 📄 背景材料\n\n${c.material}\n`,
    `## 问题与参考答案\n`,
    ...c.subQuestions.flatMap((s, i) => [
      `### 问题 ${i + 1}（${s.points} 分）\n`,
      `${s.stem}\n`,
      `> [!success] 参考答案\n> ${s.referenceAnswer.replace(/\n/g, '\n> ')}\n`,
      s.scoringPoints?.length ? `**评分要点：** ${s.scoringPoints.join('；')}\n` : '',
    ]),
    c.techniques ? `\n## 💡 解题套路\n\n${c.techniques}\n` : '',
    relLinks.length > 0 ? `\n## 🔗 前置知识点\n\n${relLinks.map((l) => `- ${l}`).join('\n')}\n` : '',
    `\n---\n*在网站作答练习：https://jzhm.fun/ruankao/*`,
  ]
  return parts.filter((s) => s !== '' && s !== undefined).join('\n')
}

function writeHome(): string {
  const total = Object.values(KNOWLEDGE).reduce((a, k) => a + k.chapters.length, 0)
  const modRows = MODULES.map((m) => {
    const kn = KNOWLEDGE[m.id]
    const n = kn?.chapters.length ?? 0
    const hot3 = kn?.chapters.filter((c) => c.hot === 3).length ?? 0
    return `| ${m.icon} | [[${mocFile.get(m.id)}\\|${m.name}]] | ${n} | ${hot3} | ${m.examCount} |`
  }).join('\n')
  return `---
tags: [软考, MOC, 主页]
---

# 🎓 软考软件设计师 · 复习知识图谱

> [!important] 考试信息
> **考试日期：2026-10-24 ~ 10-27（机考）**
> 上午《基础知识》75 选择题 + 下午《应用技术》案例分析（4 必答 + C++/Java 二选一）
> **两科均需 ≥ 45/75 分，单科不保留**
> 学习与刷题网站：https://jzhm.fun/ruankao/

## 📚 模块导航（${MODULES.length} 模块 · ${total} 章）

| | 模块 | 章节数 | 必考章节 | 上午题量 |
| --- | --- | --- | --- | --- |
${modRows}

## 🗺️ 知识图谱怎么用

- 左侧边栏点开 **关系图谱（Graph View）**：节点是笔记、连线是笔记间的双向链接——**连线密集的节点就是核心考点**（如 UML、设计模式、规范化理论、关键路径）
- 图谱搜索框输入标签 \`#必考\` 可只看必考考点子图
- 笔记顶部的 🔗关联知识点 / 📝下午案例题 是跨模块的知识关联，顺着链接复习效果最好
- 每章复习完，回到模块 MOC 勾选 checkbox 记录进度

## 📅 建议节奏（约 7 周）

- [ ] 第 1~4 周：过完 47 章知识点（每天 1~2 章），网站对应模块刷 15~20 题
- [ ] 第 5~6 周：每周 2~3 次整卷模考，重点看成绩报告的薄弱模块，回炉本图谱
- [ ] 最后 1 周：案例题专项（[[案例-DFD-校园图书借阅系统数据流图设计|数据流图]]、[[案例-DB-电商订单管理数据库设计|数据库]]、[[案例-UML-在线购票系统 UML 建模|UML]] 是拿分主力）

## ✍️ 下午题案例（10 道）

${[...CASES].map((c) => `- [[${caseFile.get(c.id)}]]`).join('\n')}
`
}

/* ---------- 写盘 ---------- */
let fileCount = 0
function put(sub: string, name: string, content: string) {
  const dir = join(VAULT_DIR, sub)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name + '.md'), content, 'utf-8')
  fileCount++
}

if (existsSync(VAULT_DIR)) {
  console.log(`目标目录已存在，将写入/覆盖笔记文件：${VAULT_DIR}`)
}

put('', '00 · 开始这里', writeHome())
for (const m of MODULES) {
  const kn = KNOWLEDGE[m.id]
  if (!kn) continue
  put('模块', mocFile.get(m.id)!, writeMoc(m.id, m.name, m.icon, m.description, m.examCount, kn.chapters))
  kn.chapters.forEach((c, i) => put('知识点', chapterFile.get(c.id)!, writeChapter(m.id, m.name, c, i, kn.chapters.length)))
}
for (const c of CASES) put('案例分析', caseFile.get(c.id)!, writeCase(c))

console.log(`✓ 导出完成：${fileCount} 个笔记 → ${VAULT_DIR}`)
console.log('  在 Obsidian 中打开该文件夹即可看到知识图谱')
