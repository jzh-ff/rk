# -*- coding: utf-8 -*-
"""合并 4 套真题：分类 → 去重 → 输出标准化 JSON（供生成 TS）。

数据源：
  morning_v2.json      正则提取（文字层，可靠）：2020-11/2022-05(30题)/2022-11/2024-05
  transcribed.json     2022-05 视觉转录（仅补 18/19/24/25 四题，答案人工复核）
"""
import json
import os
import re
from difflib import SequenceMatcher

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(HERE, '..', '..'))

# ---------- 1. 载入 ----------

def load_reg():
    reg = json.load(open(os.path.join(HERE, 'morning_v2.json'), encoding='utf-8'))
    out = {}
    for exam, qs in reg.items():
        keep = [q for q in qs if q['answer'] is not None]
        out[exam] = keep
    return out

def load_vis_4():
    vis = json.load(open(os.path.join(HERE, 'pages', '2022-05', 'transcribed.json'), encoding='utf-8'))
    return {q['no']: q for q in vis}

reg = load_reg()
vis = load_vis_4()

# 2022-05: 正则 30 题 + 视觉补 4 题（答案人工复核：18C 19C 24C 25D）
manual_answers = {18: 'C', 19: 'C', 24: 'C', 25: 'D'}
q2205 = {q['no']: q for q in reg['2022-05']}
for n, letter in manual_answers.items():
    v = vis.get(n)
    if v:
        v['answer'] = letter
        v['answer_confirmed'] = 'manual'
        q2205[n] = v
reg['2022-05'] = [q2205[k] for k in sorted(q2205)]

# 2020-11 补充：题干里 “（ ）” 规范化
def normalize(q, exam):
    stem = q['stem'].strip()
    # 题干规范化：______ → （  ）
    stem = re.sub(r'_{2,}', '（  ）', stem)
    stem = re.sub(r'\(\s*\)', '（  ）', stem)
    options = []
    for o in q['options']:
        o = o.strip()
        o = re.sub(r'（\s*）', '（  ）', o)
        options.append(o)
    exp = (q.get('explanation') or '').strip()
    exp = re.sub(r'\s*\n\s*', ' ', exp)
    return {
        'exam': exam,
        'no': q['no'],
        'stem': stem,
        'options': options,
        'answer': 'ABCD'.index(q['answer']) if isinstance(q['answer'], str) else q['answer'],
        'explanation': exp,
    }

ALL = []
for exam in ['2020-11', '2022-05', '2022-11', '2024-05']:
    for q in reg[exam]:
        ALL.append(normalize(q, exam))

# 2022-11 题71 超长英语题干截取（保留完整段落没问题，但检查选项）
for q in ALL:
    if q['exam'] == '2022-11' and q['no'] == 71 and len(q['stem']) > 900:
        q['stem'] = q['stem'][:900]  # 保底截断，导入时人工看

# ---------- 2. 分类 ----------

RULES = {
    'co': ['cache', '流水线', '补码', '原码', '反码', '移码', '浮点', '寄存器', '中断', 'dma', '总线', '可靠度', 'cisc', 'risc', '寻址', '海明', '校验', '磁盘', '存储器', 'raid', 'mips', 'cpi', '主频', '字长', '编址', '运算器', '控制器', '指令', '机器周期', '时钟', '计算机系统', '吞吐', '定 点', '定点', '码', '存储单元', 'cpu', '内存', '地址映像', '微程序'],
    'os': ['进程', '线程', '死锁', 'pv操作', '信号量', '页式', '段式', '页框', '置换算法', '缺页', '作业调度', '银行家', '文件系统', '索引结点', '缓冲区', 'spooling', '管程', '临界区', '互斥', '前驱图', '存储管理', '操作系统', '抖动', 'belady', 'lru', '先来先服务', '调度算法', 'fork', '进程控制块', 'pcb', '逻辑地址', '物理地址'],
    'db': ['sql', '范式', '候选键', '主键', '外键', '函数依赖', '事务', '封锁', '两段锁', '并发控制', 'e-r', 'er图', '实体', '关系模式', '投影', '笛卡尔', '视图', '触发器', '数据库', '关系代数', '索引', '数据字典', '模式分解', '无损分解', '脏数据', '丢失修改', '不可重复读', '存取方法', '数据流图', '数据挖掘', '数据仓库', '联机分析', 'olap'],
    'nw': ['ip地址', '子网', '掩码', 'tcp', 'udp', 'osi', '路由', '以太网', 'dns', 'dhcp', 'ftp', 'http', 'smtp', 'telnet', 'arp', '端口', '协议', '局域网', 'ipv6', 'ipv4', '交换机', '路由器', '网关', '网络', '网桥', '集线器', 'mac地址', '带宽', '报文', '分组', 'icmp', 'pop3', 'imap', '网络层', '传输层', '数据链路'],
    'sec': ['加密', '解密', '密钥', '数字签名', '摘要', 'sha', 'md5', 'rsa', 'des', 'aes', '3des', 'rc4', 'idea', '证书', '防火墙', '入侵检测', '漏洞', '攻击', '病毒', '木马', '蠕虫', '安全', '认证', '身份验证', '数字证书', 'pkI', 'pki', '对称加密', '公钥', '私钥', '报文摘要', '拒绝服务', 'ddos', 'sql注入', 'xss', 'https', 'ssl'],
    'se': ['需求分析', '需求获取', '概要设计', '详细设计', '软件测试', '白盒', '黑盒', '边界值', '判定表', '因果图', '环路复杂度', 'mccabe', '内聚', '耦合', '瀑布', '原型', '增量模型', '螺旋', '敏捷', '里程碑', '甘特', '关键路径', '挣值', '风险管理', '软件质量', '软件维护', '改正性', '适应性', '完善性', '预防性', 'cmm', 'cmmi', 'iso', '软件工程', '结构化', '数据字典', '模块', '扇入', '扇出', '程序流程图', '盒图', 'pad图', '判定覆盖', '语句覆盖', '条件覆盖', '路径覆盖', '系统测试', '确认测试', '集成测试', '单元测试', 'alpha', 'beta', '回归测试', '软件配置', '基线', '版本控制', '软件复用', '逆向工程', '重构', '净室软件', '形式化', '面向数据流', '变换流', '事务流', '界面设计', '人机交互', '软件过程', '能力成熟度', '需求规格', '规格说明书', '可行性', '成本估算', 'cocomo', '功能点', '代码行', '人员分配', '沟通路径', '进度管理', '挣值分析', 'pv ', 'ev ', 'ac ', '项目管理', '软件危机', '软件生命周期', '生存周期'],
    'oo': ['对象', '类', '继承', '封装', '多态', '重载', '重写', '覆盖', 'uml', '用例', '顺序图', '类图', '状态图', '活动图', '通信图', '构件图', '部署图', '设计模式', '单例', '工厂', '观察者', '策略', '适配器', '装饰', '代理', '桥接', '外观', '组合', '享元', '命令', '备忘录', '迭代器', '中介者', '职责链', '模板方法', '访问者', '状态模式', '解释器', '面向对象', 'ooa', 'ood', '消息', '接口', '抽象类', '静态成员', '动态绑定', '泛化', '关联', '依赖', '聚合', '组合关系', '参与者', 'actor'],
    'ds': ['二叉树', '链表', '栈', '队列', '数组', '广义表', '串', '邻接', '拓扑排序', '遍历', '排序', '查找', '哈希', '散列', '递归', '时间复杂度', '空间复杂度', '后缀', '中缀', '前缀', 'kmp', '模式匹配', '哈夫曼', '最优二叉树', '满二叉树', '完全二叉树', '线索', '森林', '堆', '快速排序', '冒泡', '插入排序', '选择排序', '归并', '基数排序', '希尔', '二分查找', '顺序查找', '分块', '平衡树', 'avl', 'b树', 'b-树', 'b+树', '图', '有向图', '无向图', '最小生成树', ' prim', 'kruskal', 'dijkstra', 'floyd', '哈密尔顿', '欧拉', '折半', '判定树', '数据结构', '线性表', '循环队列', '循环链表', '双向链表', '空串', '子串', '邻接矩阵', '邻接表', '强连通', '连通分量'],
    'pl': ['编译', '解释程序', '文法', '语法分析', '词法分析', '语义分析', '有限自动机', '正规式', '正则表达式', '传值', '传址', '函数调用', '程序设计语言', '作用域', '生存期', '编译器', '解释器', '目标代码', '中间代码', '四元式', '三地址', '逆波兰', '算符优先', 'lr分析', 'll(1)', '移进', '归约', '推导', '句柄', '短语', '巴科斯', 'bnf', '动态语义', '静态语义', '运行时', '绑定', '脚本语言', '汇编'],
    'math': ['矩阵', '概率', '期望', '线性规划', '图论', '最短路径问题', '运筹', '决策', '预测', '回归', '数学', '方差', '排列组合', '组合数学', '命题逻辑', '谓词逻辑', '主析取', '主合取', '真值表', '等价', '蕴含', '偏序', '等价关系', '闭包', '哈斯图', '函数', '集合', '自反', '对称', '传递', '欧拉图', '汉密尔顿'],
    'law': ['著作权', '专利', '商标', '知识产权', '保护期', '标准化', '许可', '侵权', '版权', '署名权', '发表权', '商业秘密', '不正当竞争', '商标权', '作品的', '软件版权', '注册商标', '国家标准', '行业标准', '国际标准', '地方标准', '企业标准', 'gb', 'iso 9000', '强制标准', '推荐性标准'],
    'en': [],
    'mm': ['图像', '像素', '分辨率', '音频', '采样', '量化', '视频', '压缩', '多媒体', '颜色', 'rgb', 'jpeg', 'mpeg', '动画', '位图', '矢量图', '显示深度', '颜色深度', 'dpi', 'ccd', '合成', '格式', '流媒体', '波形声音', 'midi'],
    'arch': ['架构', '中间件', 'soa', '微服务', '云计算', '大数据', '数据仓库', '管道', '事件驱动', '分层架构', 'mvc', 'rest', '软件体系结构', '客户机/服务器', 'browser', '表示层', '业务逻辑层', '持久层', 'orm', 'ejb', 'com', 'corba', 'web服务', 'web service', '网格计算', '虚拟化', '容器', 'docker', 'kubernetes', 'k8s', '物联网', '边缘计算', '区块链', '服务器集群', '负载均衡', '反向代理', '消息队列', '面向服务'],
}

def classify(q):
    # 英语题：71-75 或题干以英文为主
    if q['no'] in (71, 72, 73, 74, 75):
        return 'en'
    text = (q['stem'] + ' ' + ' '.join(q['options'])).lower()
    cn_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    if q['no'] >= 71 and cn_chars < len(text) * 0.3:
        return 'en'
    scores = {}
    for mod, kws in RULES.items():
        if mod == 'en':
            continue
        s = 0
        for kw in kws:
            if kw in text:
                s += 2 if len(kw) >= 3 else 1
        scores[mod] = s
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else 'unknown'

for q in ALL:
    q['moduleId'] = classify(q)

# ---- 人工修正 ----
# 破碎题（表格数据丢失/连号错位）直接丢弃
DROP = [('2020-11', 54), ('2022-11', 54)]
ALL = [q for q in ALL if (q['exam'], q['no']) not in DROP]

# 2024-05 第9题是 9.10. 双空题错位：拆成两题
fix9 = [q for q in ALL if q['exam'] == '2024-05' and q['no'] == 9]
if fix9:
    q9 = fix9[0]
    q9['stem'] = '正规集 (ab|c)(1|2|3) 可以识别的字符种类有（  ）个。'
    q9['options'] = ['1', '2', '3', '6']
    q9['answer'] = 3
    q9['explanation'] = '正规集 (ab|c)(1|2|3) 由两个符号位组成：第一位取 a、b 或 c，第二位取 1、2 或 3，共可识别 3+3=6 种字符组合。'
    q10 = {
        'exam': '2024-05', 'no': 10, 'moduleId': 'pl',
        'stem': '下列字符串中，能够被正规集 (ab|c)(1|2|3) 匹配的是（  ）。',
        'options': ['ab2', 'abc', 'a2', '123'],
        'answer': 0,
        'explanation': '正规集 (ab|c)(1|2|3)：第一段 (ab|c) 可匹配 "ab" 或 "c"，第二段 (1|2|3) 匹配一个数字。ab2 = "ab"+"2" ✓；abc 第二段是字母 ✗；a2 第一段不能只匹配 "a" ✗；123 第一段不匹配数字 ✗。',
    }
    ALL.append(q10)

# 未分类题人工指定
MANUAL_MODULE = {
    ('2020-11', 10): 'sec',   # 信息安全特性（完整性）
    ('2022-05', 2): 'co',     # SRAM/DRAM
    ('2022-05', 21): 'pl',    # Python 列表
    ('2022-05', 28): 'ds',    # 树的度
    ('2022-05', 33): 'nw',    # 无痕浏览
    ('2022-11', 32): 'se',    # 软件质量
    ('2022-11', 48): 'pl',    # Python 异常
    ('2022-11', 49): 'pl',    # Python range
    ('2024-05', 3): 'ds',     # 树的度
    ('2024-05', 63): 'se',    # 软件文档
    # 关键词误分修正
    ('2020-11', 1): 'co',     # Cache 地址映射（"存储管理软件"误触 os）
    ('2020-11', 8): 'sec',    # 访问控制
    ('2020-11', 33): 'pl',    # 程序执行效率（程序设计语言）
    ('2024-05', 17): 'os',    # FAT 文件系统
    ('2024-05', 64): 'se',    # 商业风险
}
for q in ALL:
    mk = MANUAL_MODULE.get((q['exam'], q['no']))
    if mk:
        q['moduleId'] = mk

# 规则性误分修正：cache/流水线相关归 co，逻辑地址类归 os
for q in ALL:
    text = (q['stem'] + ' ' + ' '.join(q['options'])).lower()
    if 'cache' in text and q['moduleId'] == 'os':
        q['moduleId'] = 'co'

unknown = [q for q in ALL if q['moduleId'] == 'unknown']
print(f'共 {len(ALL)} 题，自动分类未知 {len(unknown)} 题')
from collections import Counter
print(Counter(q['moduleId'] for q in ALL))

# ---------- 3. 与现有题库去重 ----------

def load_existing_stems():
    stems = []
    qdir = os.path.join(PROJ, 'src', 'data', 'questions')
    for fn in os.listdir(qdir):
        if not fn.endswith('.ts') or fn in ('index.ts', 'exam.ts'):
            continue
        src = open(os.path.join(qdir, fn), encoding='utf-8').read()
        for m in re.finditer(r"stem:\s*'((?:[^'\\]|\\.)*)'", src):
            s = m.group(1).replace("\\'", "'").replace('\\n', ' ')
            stems.append(s)
    return stems

existing = load_existing_stems()

def sim(a, b):
    return SequenceMatcher(None, a, b).ratio()

def norm_key(s):
    return re.sub(r'[\s（）()。，、；：""''？?]', '', s)

existing_keys = [norm_key(s) for s in existing]

kept, dropped = [], []
for q in ALL:
    k = norm_key(q['stem'])
    dup = False
    for ek in existing_keys:
        if len(k) > 12 and len(ek) > 12 and (k in ek or ek in k or sim(k, ek) > 0.8):
            dup = True
            break
    (dropped if dup else kept).append(q)

# 新题之间互重（同题不同年份出现的情况：保留第一次）
seen = {}
final = []
for q in kept:
    k = norm_key(q['stem'])
    if k in seen:
        continue
    seen[k] = True
    final.append(q)

print(f'去重：丢 {len(dropped)} 题与现有重复；新增题间重复 {len(kept) - len(final)} 题；最终 {len(final)} 题')

out = os.path.join(HERE, 'merged.json')
json.dump(final, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('输出:', out)
for q in dropped[:5]:
    print('  重复示例:', q['exam'], q['no'], q['stem'][:40])
if unknown:
    print('未分类题号:')
    for q in unknown:
        print(f"  {q['exam']} #{q['no']}: {q['stem'][:50]}")
