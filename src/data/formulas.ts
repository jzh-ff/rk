/** 考前公式速查（整理自资源包《软件设计师考试常用公式》与《软件设计师笔记》，
 *  公式经校对后以 Markdown 表达，上下标使用 Unicode/文本写法保证可读性）。 */

export interface FormulaItem {
  name: string
  /** 公式（Markdown，可用行内代码突出） */
  formula: string
  /** 说明与易错点 */
  note?: string
  hot?: boolean
}

export interface FormulaGroup {
  id: string
  title: string
  icon: string
  items: FormulaItem[]
}

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    id: 'co',
    title: '计算机组成与体系结构',
    icon: '🖥️',
    items: [
      {
        name: '存储容量与编址',
        formula: '容量 = 末地址 − 首地址 + 1（再按需除以 1024 换算 K/M）；\n芯片数 = 总容量 ÷ 单片容量',
        note: '十六进制地址先转十进制再相减；"大减小再加 1"是送分套路。',
        hot: true,
      },
      {
        name: '平均 CPI 与 MIPS',
        formula: 'CPI = Σ(CPIᵢ × 比例ᵢ)；\nMIPS = 主频(MHz) ÷ CPI；\n执行时间 = 指令条数 × CPI ÷ 主频',
        note: '主频 2.8GHz = 2800MHz，代入 MIPS 公式时注意单位统一。',
        hot: true,
      },
      {
        name: '流水线执行时间',
        formula: '总时间 = 一条指令完整时间 + (n−1) × 流水线周期；\n流水线周期 = 各阶段中最长段时间',
        note: '若各段时间相等 t，则 T = (k + n − 1) × t（k 为段数）。',
        hot: true,
      },
      {
        name: 'Cache 命中率与平均访问时间',
        formula: '命中率 h = Nc ÷ (Nc + Nw)；\n平均访问时间 = h × tc + (1−h) × tm',
        note: 'tc 为 Cache 存取时间，tm 为主存存取时间。',
      },
      {
        name: '串联/并联系统可靠性',
        formula: '串联：R = R₁×R₂×⋯×Rₙ；\n并联：R = 1−(1−R₁)(1−R₂)⋯(1−Rₙ)',
        note: '混联系统先化简局部并联/串联再整体代入。常与 0.9、0.95 等值组合出题。',
        hot: true,
      },
      {
        name: 'MTBF / MTTR / 可用性',
        formula: 'MTBF = 1/λ（λ 为失效率）；\n可用度 A = MTBF ÷ (MTBF + MTTR)',
      },
      {
        name: '海明码校验位',
        formula: '2ʳ ≥ m + r + 1（m 为数据位，r 为校验位）',
        note: 'm=4 → r=3；m=8 → r=4。海明码可检错且可纠一位错。',
        hot: true,
      },
      {
        name: 'N 模冗余可靠性',
        formula: 'R = Σ⌈(N 取 j) 组合数 × Rⁱ × (1−R)^(N−j)⌉，j 从 ⌈N/2⌉ 到 N',
        note: 'N = 2n+1 个子系统 + 表决器，少数服从多数。',
      },
      {
        name: '磁盘容量 / 传输率',
        formula: '非格式化容量 = w × π × D_min × 位密度 × 磁道数（每面）；\n格式化容量 = 每道扇区数 × 每扇区字节 × 磁道数 × 面数；\n数据传输率 = 转速(转/秒) × 每道字节数',
      },
      {
        name: '中断响应次数（DMA 比较）',
        formula: '程序查询 < 程序中断 < DMA < 通道（CPU 干预程度递减，并行度递增）',
        note: 'DMA 仅在传送前后打扰 CPU；周期挪用发生在存取周期结束时。',
      },
      {
        name: '码距与检错纠错',
        formula: '检错 d 位需码距 ≥ d+1；\n纠错 e 位需码距 ≥ 2e+1',
      },
      {
        name: '补码表示范围',
        formula: 'n 位补码整数：−2ⁿ⁻¹ ~ +(2ⁿ⁻¹−1)；\nn 位定点小数：−1 ~ +(1−2⁻⁽ⁿ⁻¹⁾)',
        note: '补码比原码/反码多表示一个最小负数；0 唯一。',
        hot: true,
      },
      {
        name: '浮点数 IEEE 754（32 位）',
        formula: '值 = (−1)ˢ × 1.M × 2^(E−127)，S 符号 1 位、E 阶码 8 位、M 尾数 23 位（隐含最高位 1）',
        note: '阶码全 0/全 1 有特殊含义（0、非规格化、∞、NaN）。',
      },
    ],
  },
  {
    id: 'os',
    title: '操作系统',
    icon: '⚙️',
    items: [
      {
        name: '页式地址转换',
        formula: '物理地址 = 块号 × 页大小 + 页内偏移；\n逻辑地址 = 页号 × 页大小 + 页内偏移',
        note: '页内偏移位数 = log₂(页大小)。十六进制地址常按位拆分。',
        hot: true,
      },
      {
        name: 'PV 操作语义',
        formula: 'P(S)：S = S−1，S<0 则阻塞；\nV(S)：S = S+1，S≤0 则唤醒一个等待进程',
        note: 'S 的绝对值（当 S<0）= 等待队列中的进程数。互斥 P V 同一信号量夹临界区；同步 P V 配对不同信号量。',
        hot: true,
      },
      {
        name: '进程资源死锁计算',
        formula: 'n 个进程各需 m 个资源，系统至少有 n×(m−1)+1 个资源则必不死锁',
        note: '最坏情况每个进程都拿到 m−1 个，再多给 1 个即可保证有人能完成。',
        hot: true,
      },
      {
        name: '先行图 / 前驱关系',
        formula: '有向边 A→B 表示 A 完成后 B 才能开始；\n拓扑序列不唯一时注意约束传递',
      },
      {
        name: '磁盘调度',
        formula: 'SSTF：每次选距当前磁头最近的请求；\nSCAN（电梯）：沿一个方向扫到头再折返；\nCSCAN：单向扫描到底后回到起点重扫',
        note: '计算题给出当前磁道号+请求序列，逐个累加移动道数。',
      },
      {
        name: '缺页中断次数 / 命中率',
        formula: '命中率 = 命中次数 ÷ 总访问次数；\nFIFO 可能出现 Belady 异常（页框增多缺页反而增多）',
        hot: true,
      },
      {
        name: '位示图',
        formula: '位示图字数 = 磁盘块数 ÷ 机器字长；\n块号 b 对应：字号 i = ⌊b / 字长⌋，位号 j = b mod 字长',
      },
      {
        name: '缓冲区耗时',
        formula: '单缓冲：每块耗时 = max(输入 T, 处理 C) + 传送 M；\n双缓冲：每块耗时 = max(T, C + M)',
        note: '常给 3 块数据求总时间，先算单块再乘。',
      },
    ],
  },
  {
    id: 'db',
    title: '数据库系统',
    icon: '🗄️',
    items: [
      {
        name: '候选键求解（函数依赖）',
        formula: '只在左部出现的属性必入候选键；\n只在右部出现的属性必不入；\n两端都出现的按需试探闭包',
        note: '求属性集闭包 X⁺：反复用依赖集 F 扩充 X，能推出全体属性则为键。',
        hot: true,
      },
      {
        name: '范式判定',
        formula: '1NF：属性原子；\n2NF：消除非主属性对键的**部分**依赖；\n3NF：消除非主属性对键的**传递**依赖；\nBCNF：所有决定因素都包含键',
        note: '判断顺序：先求键 → 看依赖左部 → 逐级判断。',
        hot: true,
      },
      {
        name: '无损连接判定（表格法）',
        formula: 'ρ={R₁,R₂} 二分解无损 ⇔ (R₁∩R₂) → (R₁−R₂) 或 (R₁∩R₂) → (R₂−R₁)',
        note: '分解为两份时用此判定最快；多份用表格（chase）算法。',
      },
      {
        name: '并发丢失修改',
        formula: '两事务写同一数据且后写覆盖先写 → 丢失修改；\n加 X 锁（写锁）到事务结束可避免',
      },
      {
        name: '关系代数元组数估算',
        formula: '笛卡尔积：|R×S| = |R|×|S|；\n选择 σ：|σ| ≤ |R|；\n投影 π：去重后 ≤ |R|；\n连接 ⋈：≤ |R×S|',
        note: '外连接 = 内连接 + 未匹配元组补空值；左外=保留左全部，全外=两边都保留。',
        hot: true,
      },
    ],
  },
  {
    id: 'nw',
    title: '计算机网络',
    icon: '🌐',
    items: [
      {
        name: '子网划分',
        formula: '块大小 = 256 − 掩码最后非 255 字节；\n子网数 = 2^借位数；\n每子网主机数 = 2^(32−前缀) − 2',
        note: '/26 → 块 64 → 每子网 62 台主机。网络地址 = 块的整数倍起点，广播 = 块尾。',
        hot: true,
      },
      {
        name: 'IPv4 特殊地址',
        formula: '127.x 回环；169.254.x 链路本地；10/8、172.16/12、192.168/16 私有；255.255.255.255 受限广播',
      },
      {
        name: 'TCP/UDP 端口',
        formula: 'FTP 20/21、SSH 22、Telnet 23、SMTP 25、DNS 53、HTTP 80、POP3 110、HTTPS 443、SNMP 161',
        note: '上午题 1~2 分送分点，务必背熟。',
        hot: true,
      },
      {
        name: '传输时延',
        formula: '发送时延 = 数据长度 ÷ 带宽；\n传播时延 = 距离 ÷ 传播速率（约 2×10⁸ m/s 铜缆/光纤）；\n总时延 ≈ 发送 + 传播 + 处理 + 排队',
      },
      {
        name: '奈奎斯特与香农',
        formula: '无噪：C = 2W log₂V（V 为电平数）；\n有噪：C = W log₂(1 + S/N)，信噪比 dB = 10 lg(S/N)',
        note: '信噪比 30dB → S/N = 1000。两式常混考，看清是否给噪声。',
        hot: true,
      },
    ],
  },
  {
    id: 'se',
    title: '软件工程与项目管理',
    icon: '🧪',
    items: [
      {
        name: 'McCabe 环路复杂度',
        formula: 'V(G) = E − N + 2 = 判定结点数 P + 1 = 封闭区域数 + 1',
        note: 'if/while/for 各算一个判定结点；case 分支按 n−1 个判定算。',
        hot: true,
      },
      {
        name: '关键路径',
        formula: '总工期 = 源点到汇点最长路径和；\n松弛时间 = 最迟开始 − 最早开始；\n关键活动松弛 = 0',
        note: '最早开始 = 所有前驱最早完成的最大值；最迟开始 = 后继最迟开始的最早值减自身工期。',
        hot: true,
      },
      {
        name: '挣值分析',
        formula: 'CV = EV − AC（成本偏差）；\nSV = EV − PV（进度偏差）；\nCPI = EV/AC；SPI = EV/PV',
        note: 'EV 已完成工作的预算，PV 计划工作的预算，AC 实际花费。大于 0/大于 1 为好。',
        hot: true,
      },
      {
        name: '沟通路径',
        formula: 'n 人全互联沟通路径 = n(n−1)/2',
      },
      {
        name: '测试用例数（多条件组合）',
        formula: '条件组合覆盖用例数 = 各条件取值数乘积',
        note: '如 3 个布尔条件 → 2³ = 8 组合。',
      },
      {
        name: '软件维护占比',
        formula: '维护成本占生命周期总成本约 60%+；\n完善性维护 > 适应性 > 改正性 > 预防性（工作量排序）',
      },
    ],
  },
  {
    id: 'ds',
    title: '数据结构与算法',
    icon: '🌳',
    items: [
      {
        name: '二叉树性质',
        formula: 'n₀ = n₂ + 1（叶子 = 度2结点 + 1）；\n第 i 层最多 2^(i−1) 个结点；\n高 h 的二叉树最多 2ʰ − 1 个结点；\nn 个结点完全二叉树高 h = ⌈log₂(n+1)⌉',
        note: '树的总结点数 = 分支数 + 1：n = n₀+n₁+⋯+nₖ = 0×n₀ + 1×n₁ + ⋯ + k×nₖ + 1。',
        hot: true,
      },
      {
        name: '顺序存储地址计算',
        formula: '行优先：Loc(aᵢⱼ) = 基址 + ((i−i₀)×列数 + (j−j₀)) × 元素大小',
        note: '注意起始下标是 0 还是 1、行优先还是列优先。',
        hot: true,
      },
      {
        name: '散列冲突与装填因子',
        formula: '装填因子 α = 元素数 ÷ 表长；\n线性探测平均查找长度成功 ≈ (1 + 1/(1−α))/2',
        note: 'α 越大冲突越多；链地址法优于开放定址法（同 α 下）。',
      },
      {
        name: '常见排序复杂度',
        formula: 'O(n²)：直接插入/冒泡/简单选择；\nO(nlogn)：快排/归并/堆排序；\nO(d(n+r))：基数；\n稳定：插入、冒泡、归并、基数',
        note: '快排平均最快但最坏 O(n²)；堆排序/归并稳定在 O(nlogn)。',
        hot: true,
      },
      {
        name: '图的关键数字',
        formula: 'n 顶点无向完全图边 = n(n−1)/2；\n有向完全图弧 = n(n−1)；\n连通无向图至少 n−1 条边；\n强连通有向图至少 n 条弧',
        hot: true,
      },
      {
        name: 'AOE / 拓扑排序',
        formula: '拓扑序列数 ≠ 唯一；\n有环则无拓扑序；\n关键路径 = 最长路径（AOE 中）',
      },
    ],
  },
  {
    id: 'pl',
    title: '程序语言基础',
    icon: '📜',
    items: [
      {
        name: '表达式相互转换',
        formula: '中缀→后缀：按优先级出栈运算符；\n后缀求值：操作数栈，遇运算符弹两个计算',
        note: '先后缀转换常考。例：(a+b)*c−d → ab+c*d−。',
        hot: true,
      },
      {
        name: '传值 / 传址',
        formula: '传值：形参是实参副本，不影响实参；\n传址(引用)：形参是实参别名，修改互相可见',
        note: 'C 语言数组参数本质传的是首地址（效果同传址）。',
        hot: true,
      },
    ],
  },
  {
    id: 'mm',
    title: '多媒体',
    icon: '🎬',
    items: [
      {
        name: '图像存储容量',
        formula: '字节 = 分辨率(像素数) × 颜色深度 ÷ 8',
        note: '1024×768×24bit ≈ 2.25MB（未压缩）。',
        hot: true,
      },
      {
        name: '音频容量',
        formula: '字节/秒 = 采样频率(Hz) × 量化位数 × 声道数 ÷ 8',
        note: 'CD 音质 44.1kHz×16bit×2 声道 ≈ 176.4KB/s。',
        hot: true,
      },
      {
        name: '视频容量',
        formula: '字节/秒 = 图像每帧容量 × 帧率（再考虑压缩比）',
      },
      {
        name: '颜色深度与颜色数',
        formula: '颜色数 = 2^颜色深度；8bit=256 色，16bit=65536 色（增强色）',
      },
    ],
  },
  {
    id: 'math',
    title: '数学基础',
    icon: '📐',
    items: [
      {
        name: '最小生成树',
        formula: 'Prim：从任一点逐步长出（适合稠密图 O(n²)）；\nKruskal：边升序加入不构成环（适合稀疏图 O(eloge)）',
      },
      {
        name: '期望与方差',
        formula: 'E(X) = Σxᵢpᵢ；\nD(X) = E(X²) − E²(X)',
      },
      {
        name: '最短路径',
        formula: 'Dijkstra：单源，O(n²)，贪心不处理负权；\nFloyd：多源，O(n³)，三重循环',
      },
    ],
  },
]
