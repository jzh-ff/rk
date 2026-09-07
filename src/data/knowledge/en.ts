import type { ModuleKnowledge } from '../types'

export const enKnowledge: ModuleKnowledge = {
  moduleId: 'en',
  chapters: [
    {
      id: 'en-c1',
      title: '专业英语高频词汇与解题技巧',
      hot: 3,
      content: '## 核心概念\n\n下午第一题为专业英语：一篇约 200~300 词的技术短文挖 5 个空，四选一。题材集中在**软件工程、面向对象、设计模式、网络、数据库**，词汇量决定得分下限，语法与上下文决定上限。\n\n## 考点清单：真题高频技术词汇表\n\n| 英文 | 中文 | 英文 | 中文 |\n| --- | --- | --- | --- |\n| algorithm | 算法 | encapsulation | 封装 |\n| inheritance | 继承 | polymorphism | 多态 |\n| abstraction | 抽象 | interface | 接口 |\n| component | 组件 | framework | 框架 |\n| requirement | 需求 | specification | 规格说明 |\n| verification | 验证 | validation | 确认 |\n| maintainability | 可维护性 | portability | 可移植性 |\n| reliability | 可靠性 | availability | 可用性 |\n| redundancy | 冗余 | consistency | 一致性 |\n| transaction | 事务 | concurrency | 并发 |\n| protocol | 协议 | bandwidth | 带宽 |\n| firewall | 防火墙 | encryption | 加密 |\n| metadata | 元数据 | schema | 模式 |\n| invocation | 调用 | iteration | 迭代 |\n| coupling | 耦合 | cohesion | 内聚 |\n\n## 解题三步法\n\n1. **通读首句定主题**：首句无空格，常概括全文，据此激活背景知识（判断讲的是模式、网络还是数据库）；\n2. **分析空格前后语法与搭配**：看词性（缺动词/名词/形容词）、单复数、时态语态、固定搭配（如 depend on、be responsible for）；\n3. **代入验证全文逻辑**：四个选项代入后重读上下文，选语义最连贯者；近义辨析看上下文复现词。\n\n## 易混淆对比\n\n- verification（验证：是否符合作的过程/规格）vs validation（确认：是否满足用户需求）。\n- class（类）vs object（对象）、attribute（属性）vs method（方法）常在同一篇中同时出现。\n\n## 记忆口诀\n\n> 首句定主题，空格看搭配，代回验逻辑；背熟高频词，五分稳到手。',
    },
  ],
}
