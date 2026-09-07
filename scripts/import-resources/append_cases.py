# -*- coding: utf-8 -*-
"""向 src/data/cases.ts 追加 2022 上半年下午真题两个案例（试题四算法、试题五备忘录模式）。"""
import io

CASES_PATH = r'D:\CursorWP\rk\src\data\cases.ts'

ALGO = """  },
  {
    id: 'algo-202205',
    category: 'algo',
    title: '2022 上半年下午试题四：矩阵链乘（动态规划）',
    material: '【说明】\\n\\n某工程计算中经常要完成多个矩阵相乘（链乘）的计算任务。\\n\\n(1) 两个矩阵相乘要求第一个矩阵的列数等于第二个矩阵的行数，计算量主要由乘法运算次数决定。采用标准算法，计算 A(m×n)×B(n×p) 需要 m×n×p 次乘法运算，时间复杂度为 O(m×n×p)。\\n\\n(2) 矩阵相乘满足结合律，不同计算顺序产生不同计算量。以 A₁(5×100)、A₂(100×8)、A₃(8×50) 为例：\\n- 按 (A₁×A₂)×A₃ 计算：5×100×8 + 5×8×50 = **6000** 次乘法；\\n- 按 A₁×(A₂×A₃) 计算：100×8×50 + 5×100×50 = **65000** 次乘法。\\n\\n矩阵链乘问题：给定 n 个矩阵，对较大的 n，可能的计算顺序数量非常庞大，蛮力法不实际。经分析，该问题具有**最优子结构**：若 A₁×A₂×⋯×Aₙ 的一个最优计算顺序从第 k 个矩阵处断开，分为 A₁×⋯×Aₖ 和 Aₖ₊₁×⋯×Aₙ 两个子问题，则该最优解应包含两个子问题各自的最优计算顺序。据此构造递归式：\\n\\n```\\ncost[i][j] = 0                                若 i = j\\ncost[i][j] = min(i≤k<j){ cost[i][k] + cost[k+1][j]\\n                    + p[i]*p[k+1]*p[j+1] }   若 i < j\\n```\\n\\n其中 cost[i][j] 表示 Aᵢ₊₁×Aᵢ₊₂×⋯×Aⱼ₊₁ 的最优计算代价，最终求解 cost[0][n−1]。\\n\\n【C 代码】（自底向上：先算 2 个矩阵相乘，再依次算 3 个、4 个……n 个矩阵相乘的最小计算量）\\n\\n```\\n#define N 100\\nint cost[N][N];\\nint trace[N][N];\\nint cmm(int n, int seq[]) {\\n    int tempCost, tempTrace, i, j, k, p, temp;\\n    for (i = 0; i < n; i++)  { cost[i][i] = 0; }\\n    for (p = 1; p < n; p++) {\\n        for (i = 0; i < n - p; i++) {\\n            （1）;\\n            tempCost = -1;\\n            for (k = i; （2）; k++) {\\n                temp = （3）;\\n                if (tempCost == -1 || tempCost > temp) {\\n                    tempCost = temp;\\n                    tempTrace = k;\\n                }\\n            }\\n            cost[i][j] = tempCost;\\n            （4）;\\n        }\\n    }\\n    return cost[0][n-1];\\n}\\n```',
    subQuestions: [
      {
        id: 'algo-202205-s1',
        stem: '问题1（8分）：根据以上说明和 C 代码，填充 C 代码中的空（1）～（4）。',
        points: 8,
        referenceAnswer: '**（1）`j = i + p`**：外层 p 是区间长度，内层 i 是起点，终点 j = i + p。\\n\\n**（2）`k < j`**：划分位置 k 在 [i, j) 内遍历，将链分为 [i,k] 与 [k+1,j] 两段。\\n\\n**（3）`cost[i][k] + cost[k+1][j] + seq[i]*seq[k+1]*seq[j+1]`**：两段子链的最优代价之和，再加上两段结果矩阵相乘的代价（子链 Aᵢ₊₁..Aₖ₊₁ 的结果为 seq[i]×seq[k+1]，Aₖ₊₂..Aⱼ₊₁ 的结果为 seq[k+1]×seq[j+1]，相乘代价为三者乘积）。\\n\\n**（4）`trace[i][j] = tempTrace`**：记录最优划分位置 k，供构造最优计算顺序。',
        scoringPoints: ['（1）（2）各2分：区间端点与划分循环边界', '（3）2分：递归式代入（三项齐全才给分）', '（4）2分：记录划分位置'],
      },
      {
        id: 'algo-202205-s2',
        stem: '问题2（4分）：该问题采用了（5）算法设计策略，时间复杂度为（6）（用 O 符号表示）。',
        points: 4,
        referenceAnswer: '**（5）动态规划算法**（2分）：问题具有最优子结构与重叠子问题性质，自底向上填写 cost 表避免重复计算。\\n\\n**（6）O(n³)**（2分）：三重循环——区间长度 p（O(n)）、起点 i（O(n)）、划分点 k（O(n)）。',
        scoringPoints: ['动态规划（2分）', 'O(n³)（2分）'],
      },
      {
        id: 'algo-202205-s3',
        stem: '问题3（3分）：考虑实例 n=4，各矩阵维数为 A₁(15×5)、A₂(5×10)、A₃(10×20)、A₄(20×25)，即维数序列为 15、5、10、20、25。根据上述 C 代码得到的一个最优计算顺序为（7）（用加括号方式表示），所需乘法运算次数为（8）。',
        points: 3,
        referenceAnswer: '**（7）A₁×((A₂×A₃)×A₄)**（1.5分）\\n\\n**（8）5375 次**（1.5分）\\n\\n计算过程：\\n- A₂×A₃：5×10×20 = 1000，结果矩阵 5×20；\\n- (A₂×A₃)×A₄：5×20×25 = 2500，结果矩阵 5×25；\\n- A₁×((A₂×A₃)×A₄)：15×5×25 = 1875；\\n- 合计 1000 + 2500 + 1875 = **5375**。',
        scoringPoints: ['最优加括号顺序（1.5分）', '乘法次数 5375（1.5分，仅算式正确但结果错给1分）'],
      },
    ],
    techniques: '矩阵链乘是下午算法题的动态规划经典模型，也是"看代码填空"的标准考法：\\n\\n1. **先读递归式再读代码**：空（1）（2）一定对应循环变量的区间关系（j=i+p、k<j 这类边界），空（3）几乎照抄递归式，空（4）是收尾动作（记录回溯信息）。\\n\\n2. **区间 DP 模板**：`for 长度 p → for 起点 i（j=i+p）→ for 划分点 k`，三重循环 O(n³)。\\n\\n3. **代价计算口径**：两段相乘的代价用"左段行数 × 划分点维数 × 右段列数"，即 seq[i]*seq[k+1]*seq[j+1]。\\n\\n4. **小实例手算验证**：给出具体维数时，逐段列表计算各链长（2、3、4）的最优值，最后按 trace 回溯加括号。',
"""

OOP = """  },
  {
    id: 'oop-202205',
    category: 'oop',
    title: '2022 上半年下午试题五：备忘录模式（C++）',
    material: '【说明】\\n\\n在软件系统中，通常都会给用户提供取消、不确定或者错误操作的选择，允许将系统恢复到原先的状态。现使用**备忘录（Memento）模式**实现该要求。Memento 包含了要被恢复的状态；Originator（原发器）创建并在 Memento 中存储状态；Caretaker（管理者）负责从 Memento 中恢复状态。\\n\\n【C++ 代码】\\n\\n```\\n#include <iostream>\\n#include <string>\\n#include <vector>\\nusing namespace std;\\n\\nclass Memento {\\nprivate:\\n    string state;\\npublic:\\n    Memento(string state) { this->state = state; }\\n    string getState() { return state; }\\n};\\n\\nclass Originator {\\nprivate:\\n    string state;\\npublic:\\n    void setState(string state) { this->state = state; }\\n    string getState() { return state; }\\n    Memento saveStateToMemento() {\\n        return （1）;\\n    }\\n    void getStateFromMemento(Memento Memento) {\\n        state = （2）;\\n    }\\n};\\n\\nclass CareTaker {\\nprivate:\\n    vector<Memento> mementoList;\\npublic:\\n    void （3） {\\n        mementoList.push_back(state);\\n    }\\n    Memento （4） {\\n        return mementoList.at(index);\\n    }\\n};\\n\\nint main() {\\n    Originator *originator = new Originator();\\n    CareTaker *careTaker = new CareTaker();\\n    originator->setState("State #1");\\n    originator->setState("State #2");\\n    careTaker->add(（5）);\\n    originator->setState("State #3");\\n    careTaker->add(（6）);\\n    originator->setState("State #4");\\n    cout << "Current State: " << originator->getState() << endl;\\n    originator->getStateFromMemento(careTaker->get(0));\\n    cout << "First saved State: " << originator->getState() << endl;\\n    originator->getStateFromMemento(careTaker->get(1));\\n    cout << "Second saved State: " << originator->getState() << endl;\\n    return 0;\\n}\\n```',
    subQuestions: [
      {
        id: 'oop-202205-s1',
        stem: '问题1（8分）：根据说明与备忘录模式的角色分工，填充 C++ 代码中的空（1）～（4），补全 Memento、Originator 与 CareTaker 三个类的定义。',
        points: 8,
        referenceAnswer: '**（1）`new Memento(state)`**（2分）：Originator 创建备忘录对象，把当前状态封装进 Memento。\\n\\n**（2）`Memento.getState()`**（2分）：从备忘录中取出保存的状态，恢复到 Originator。\\n\\n**（3）`add(Memento state)`**（2分）：管理者把备忘录加入历史列表 mementoList。\\n\\n**（4）`get(int index)`**（2分）：按下标从历史列表取出备忘录，返回类型为 Memento。',
        scoringPoints: ['（1）封装当前状态创建 Memento（2分）', '（2）从 Memento 取状态（2分）', '（3）add 方法签名与 push_back（2分）', '（4）get 方法签名与返回（2分）'],
      },
      {
        id: 'oop-202205-s2',
        stem: '问题2（7分）：填充 main 函数中的空（5）（6），使程序依次保存 State #2 与 State #3 两个历史状态，并说明运行结束后 "First saved State" 与 "Second saved State" 两行分别输出什么。',
        points: 7,
        referenceAnswer: '**（5）（6）均为 `originator->saveStateToMemento()`**（各2分）：保存当前状态时，由 Originator 生成备忘录对象交给 CareTaker 管理。\\n\\n输出分析（3分）：\\n- `First saved State: State #2`（get(0) 取回最早保存的备忘录）；\\n- `Second saved State: State #3`（get(1) 取回第二次保存的备忘录）。\\n\\n体现备忘录模式"保存-恢复"时序：setState 后先保存快照再修改状态，恢复时按保存顺序取回。',
        scoringPoints: ['（5）（6）调用 saveStateToMemento()（各2分）', '两行输出内容正确（3分）'],
      },
    ],
    techniques: '备忘录模式（行为型）下午题套路：\\n\\n1. **三个角色口诀**：Originator 创建/恢复状态（saveStateToMemento、getStateFromMemento），Memento 只存状态（私有 state + 构造器 + getState），Caretaker 只管列表（add 入队、get 取出），**不越权**——Caretaker 不碰状态内容，Memento 不做业务。\\n\\n2. **填空高频位置**：创建备忘录 `new Memento(state)`、恢复状态 `Memento.getState()`、管理者方法签名 add/get。空基本都在"角色交界处"，想清楚每个方法属于哪个类即可。\\n\\n3. **同卷试题六（Java 版）**考点完全相同，只是语法换成 `Memento.getState()`、`void add(Memento state)`、`originator.saveStateToMemento()`，考试时 C++/Java 任选其一作答。\\n\\n4. **状态恢复顺序**：mementoList 按保存顺序排列，get(0) 是最早快照；输出题按 main 的调用时序逐步列表跟踪即可。',
"""

def main():
    src = io.open(CASES_PATH, encoding='utf-8').read()
    if "algo-202205" in src:
        print('已存在，跳过')
        return
    old_tail = "  }\n]"
    assert src.rstrip().endswith(old_tail), 'unexpected tail: %r' % src.rstrip()[-20:]
    body = src.rstrip()[: -len(old_tail)]
    new_src = body + ALGO.rstrip().lstrip() + '\n' + OOP.rstrip().lstrip() + '\n  }\n]\n'
    io.open(CASES_PATH, 'w', encoding='utf-8', newline='\n').write(new_src)
    print('cases.ts 已追加 2 个真题案例')

if __name__ == '__main__':
    main()
