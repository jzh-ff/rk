# -*- coding: utf-8 -*-
"""多格式适配的上午真题提取器。

支持三种卷面：
  A. 希赛逐题版（2020-11）：题号`1.`，块内含 参考答案：X + 解析：
  B. 富国逐题版（2022-05）：题号`1.`，块内含 答案：X，其后正文即解析
  C. 官方卷/顿号版（2022-11、2021-11、2024-05）：文末集中答案表
"""
import json
import os
import re

import pymupdf

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

AD = [
    r'富国老师\S*',
    r'软件设计师QQ\s*群[：:]\S*',
    r'软设\S*群[：:]\S*',
    r'软设学习QQ群[：:]\S*',
    r'全国计算机技术与软件专业技术资格[^\n]*',
    r'内部资料，禁止传播',
    r'更多软件设计师资料放在QQ[^\n]*',
    r'请按下述要求正确填写答题卡[^\n]*(?:\n[^\n]*){0,8}',
    r'在答题卡的指定位置上[^\n]*',
    r'本试卷的试题中共有75[^\n]*(?:\n[^\n]*){0,3}',
    r'每个空格对应一个序号[^\n]*(?:\n[^\n]*){0,3}',
    r'解答前务必阅读例题[^\n]*(?:\n[^\n]*){0,3}',
    r'因为考试日期是[^\n]*(?:\n[^\n]*){0,3}',
    r'（考试时间[^\n]*',
    r'\d+\s*/\s*\d*\s*\n?',
    r'加QQ\S*',
    r'https?://\S+',
    r'\u200b',
]

def clean(text: str) -> str:
    for pat in AD:
        text = re.sub(pat, '', text)
    text = re.sub(r'[\s　]+', ' ', text)
    return text.strip(' |.')

def split_blocks(text: str, q_pat: str):
    """按题号切块，返回 [(题号, 块文本)]"""
    marks = [(int(m.group(1)), m.start(), m.end()) for m in re.finditer(q_pat, text, re.M)]
    out = []
    for i, (num, s, e) in enumerate(marks):
        nxt = marks[i + 1][1] if i + 1 < len(marks) else len(text)
        out.append((num, text[e:nxt]))
    return out

def find_options(chunk: str):
    """返回 [(字母, 起点, 终点)]，需恰好4个且按 ABCD 顺序，集满即停。"""
    ms = list(re.finditer(r'([ABCD])\s*[.、．]\s*', chunk))
    seq = []
    for m in ms:
        if not seq:
            if m.group(1) == 'A':
                seq.append((m.group(1), m.start(), m.end()))
        elif ord(m.group(1)) == ord(seq[-1][0]) + 1:
            seq.append((m.group(1), m.start(), m.end()))
            if len(seq) == 4:
                break
        elif m.group(1) == 'A':
            seq = [(m.group(1), m.start(), m.end())]
    if len(seq) == 4 and [x[0] for x in seq] == list('ABCD'):
        return seq
    return None

def parse_mcq(chunk: str, ans_in_block: bool, ans_pats, stem_override: str = None):
    """从块中解析选项与答案，返回 (stem, options, answer, explanation) 或 None"""
    opts = find_options(chunk)
    if not opts:
        return None
    stem_raw = chunk[:opts[0][1]] if stem_override is None else stem_override
    stem = clean(re.sub(r'\s*\n\s*', '', stem_raw))
    answer, explanation = None, ''
    rest = chunk[opts[3][2]:]
    d_end = len(chunk)
    if ans_in_block:
        for pat in ans_pats:
            m = re.search(pat, rest)
            if m:
                answer = 'ABCD'.index(m.group(1))
                d_end = opts[3][2] + m.start()
                explanation = clean(re.sub(r'\s*\n\s*', ' ', rest[m.end():]))
                break
    o = []
    for i in range(4):
        end = opts[i + 1][1] if i < 3 else d_end
        o.append(clean(re.sub(r'\s*\n\s*', '', chunk[opts[i][2]:end])))
    if not stem or any(not x for x in o):
        return None
    return stem, o, answer, explanation

def parse_answer_table(text: str, pats):
    """文末答案表 -> {题号: 字母}"""
    table = {}
    for pat in pats:
        for m in re.finditer(pat, text):
            n, letter = int(m.group(1)), m.group(2).upper()
            if 1 <= n <= 75 and letter in 'ABCD':
                table[n] = letter
    return table

def extract_A(pdf, q_pat=r'(?m)(?:^|\n)\s*(\d{1,2})\s*[.、．]'):
    """2020-11 希赛逐题版：含 4.5. 多空题"""
    text = pdf_text(pdf)
    blocks = split_blocks(text, q_pat)
    qs = []
    pending_stem = None  # 多空题共享题干
    for num, chunk in blocks:
        r = parse_mcq(chunk, True, [r'参\s*考\s*答\s*案\s*[:：]?\s*([ABCD])'])
        if not r:
            continue
        # 多空题：题干在 chunk 里以文字开头
        stem, o, ans, exp = r
        qs.append({'no': num, 'stem': stem, 'options': o, 'answer': ans, 'explanation': exp})
    return qs

def pdf_text(pdf):
    doc = pymupdf.open(pdf)
    t = '\n'.join(p.get_text() for p in doc)
    doc.close()
    return t.replace('\u00a0', ' ')

def extract_B(pdf):
    """2022-05 富国逐题版：答案：X，其后到块尾为解析"""
    text = pdf_text(pdf)
    blocks = split_blocks(text, r'(?m)(?:^|\n)\s*(\d{1,2})\s*[.、．]')
    qs = []
    for num, chunk in blocks:
        opts = find_options(chunk)
        if not opts:
            continue
        stem = clean(re.sub(r'\s*\n\s*', '', chunk[:opts[0][1]]))
        rest = chunk[opts[3][2]:]
        m = re.search(r'答\s*案\s*[:：]\s*([ABCD])', rest)
        if not m:
            continue
        ans = 'ABCD'.index(m.group(1))
        exp = clean(re.sub(r'\s*\n\s*', ' ', rest[m.end():]))
        o = []
        for i in range(4):
            end = opts[i + 1][1] if i < 3 else opts[3][2] + m.start()
            o.append(clean(re.sub(r'\s*\n\s*', '', chunk[opts[i][2]:end])))
        qs.append({'no': num, 'stem': stem, 'options': o, 'answer': ans, 'explanation': exp})
    return qs

def extract_C_official(pdf, table_pats, one_line=True):
    """官方卷格式：题干内（N）为空号，随后（N）行引导选项。文末答案表。

    结构：`...题干（N）。\n（N）\nA...\nB...\nC...\nD...\n<题干N+1>...（N+1）。\n（N+1）\n...`
    切片 i = 选项组 i + 题干 i+1；题干 i+1 = 片 i 中最后一行 `D.` 选项之后的文本。
    """
    text = pdf_text(pdf)
    groups = [(int(m.group(1)), m.start(), m.end())
              for m in re.finditer(r'（\s*(\d{1,2})\s*）\s*(?:\n\s*)?(?=[ABCD]\s*[.、．])', text)]
    qs = []
    segs = []  # 每题对应片（含选项组+下一题题干）
    for i, (num, gstart, gend) in enumerate(groups):
        nxt_start = groups[i + 1][1] if i + 1 < len(groups) else len(text)
        seg = text[gend:nxt_start]  # 选项组 + 下一题题干
        opts = find_options(seg)
        if not opts:
            continue
        o = []
        for j in range(4):
            end = opts[j + 1][1] if j < 3 else len(seg)
            o.append(clean(re.sub(r'\s*\n\s*', '', seg[opts[j][2]:end])))
        qs.append({'no': num, 'stem': '', 'options': o, 'answer': None, 'explanation': ''})
        segs.append((seg, opts))
    # 题干归属：题号 N 的题干在片 N-1 尾部（最后一个 D 选项行之后）
    for idx, q in enumerate(qs):
        if idx == 0:
            continue
        seg, opts = segs[idx - 1]
        # 片中最后一个 "D." 选项行的结束位置
        d_ends = [m for m in re.finditer(r'(?m)^D\s*[.、．][^\n]*$', seg)]
        if d_ends:
            tail = seg[d_ends[-1].end():]
            # 去掉尾部对本题空号的引用 “（N）。”
            tail = re.sub(r'（\s*%d\s*）\s*[。.]?\s*$' % q['no'], '', tail)
            q['stem'] = clean(re.sub(r'\s*\n\s*', '', tail))
    qs = [q for q in qs if q['stem'] and all(q['options'])]
    table = parse_answer_table(text, table_pats)
    for q in qs:
        q['answer'] = 'ABCD'.index(table[q['no']]) if q['no'] in table else None
    return qs, table

def extract_C_dunhao(pdf):
    """2021-11 顿号版：题号 1、选项 A、；文末 答案解析 1.A ... 部分带解析"""
    text = pdf_text(pdf)
    # 题目部分到 答案解析 为止
    cut = text.find('答案解析')
    qtext, atext = (text, text) if cut < 0 else (text[:cut], text[cut:])
    blocks = split_blocks(qtext, r'(?m)(?:^|\n)\s*(\d{1,2})\s*[、]\s*')
    qs = []
    for num, chunk in blocks:
        r = parse_mcq(chunk, False, [])
        if not r:
            continue
        stem, o, _, _ = r
        qs.append({'no': num, 'stem': stem, 'options': o, 'answer': None, 'explanation': ''})
    # 答案表: 1.A
    table = parse_answer_table(atext, [r'(?m)(?:^|\n)\s*(\d{1,2})\s*[.、．]\s*([ABCD])\s*(?:\n|$)'])
    # 解析: "N.X" 后跟 解析：... 到下一个 N.X
    ans_marks = [(int(m.group(1)), m.start(), m.end()) for m in re.finditer(r'(?m)(?:^|\n)\s*(\d{1,2})\s*[.、．]\s*[ABCD]\s*(?:\n|$)', atext)]
    for i, (n, s, e) in enumerate(ans_marks):
        nxt = ans_marks[i + 1][1] if i + 1 < len(ans_marks) else len(atext)
        seg = atext[e:nxt]
        mexp = re.search(r'解\s*析\s*[:：]?', seg)
        if mexp:
            exp = clean(re.sub(r'\s*\n\s*', ' ', seg[mexp.end():]))
            for q in qs:
                if q['no'] == n:
                    q['explanation'] = exp
    for q in qs:
        q['answer'] = 'ABCD'.index(table[q['no']]) if q['no'] in table else None
    return qs, table

def extract_2024(pdf):
    """2024-05：普通 1. 格式，文末 答案： 1:C 2:C 表（含 71~75:BACDA 压缩格式）"""
    text = pdf_text(pdf)
    cut = text.rfind('答案：')
    qtext, atext = text, ''
    if cut >= 0:
        qtext, atext = text[:cut], text[cut:]
    blocks = split_blocks(qtext, r'(?m)(?:^|\n)\s*(\d{1,2})\s*[.、．]\s*')
    qs = []
    for num, chunk in blocks:
        r = parse_mcq(chunk, False, [])
        if not r:
            continue
        stem, o, _, _ = r
        qs.append({'no': num, 'stem': stem, 'options': o, 'answer': None, 'explanation': ''})
    table = parse_answer_table(atext, [r'(\d{1,2})\s*[:：]\s*([ABCD])'])
    m = re.search(r'(\d{1,2})\s*~\s*(\d{1,2})\s*[:：]\s*([ABCD]{2,5})', atext)
    if m:
        a, b, letters = int(m.group(1)), int(m.group(2)), m.group(3)
        for i, n in enumerate(range(a, b + 1)):
            table[n] = letters[i]
    for q in qs:
        q['answer'] = 'ABCD'.index(table[q['no']]) if q['no'] in table else None
    return qs, table, atext

def main():
    BASE = r'E:\BaiduNetdiskDownload\软考中级设计师\中级 软件设计师(软设)\希赛李阿妹\03 2009-2024年真题及答案解析\2009-2023年真题答案解析'
    results = {}

    q = extract_A(os.path.join(BASE, '2020年11月软件设计师上午真题及答案解析(1)---闲鱼卖家云晨之行.pdf'))
    table = {x['no']: 'ABCD'[x['answer']] for x in q if x['answer'] is not None}
    results['2020-11'] = (q, table)

    q = extract_B(os.path.join(BASE, '2022年05月软件设计师上午真题及答案解析---闲鱼卖家云晨之行.pdf'))
    table = {x['no']: 'ABCD'[x['answer']] for x in q if x['answer'] is not None}
    results['2022-05'] = (q, table)

    q, table = extract_C_dunhao(os.path.join(BASE, '2021年11月软件设计师上午真题+答案解析---闲鱼卖家云晨之行.pdf'))
    results['2021-11'] = (q, table)

    q, table = extract_C_official(
        os.path.join(BASE, '2022年11月软件设计师上午真题及答案解析---闲鱼卖家云晨之行.pdf'),
        [r'(?m)(?:^|\n)\s*(\d{1,2})\s*[.、．]\s*([ABCD])\s*(?:\n|$)'])
    results['2022-11'] = (q, table)

    pdf24 = r'E:\BaiduNetdiskDownload\软考中级设计师\中级 软件设计师(软设)\其他资料\02.历年真题+解析\2020-2024年真题＋解析\2024年上半年软件设计师上午真题及答案.pdf'
    q, table, atext = extract_2024(pdf24)
    results['2024-05'] = (q, table)

    out = {}
    for exam, (qs, table) in results.items():
        with_ans = sum(1 for x in qs if x['answer'] is not None)
        with_exp = sum(1 for x in qs if len(x['explanation']) >= 20)
        missing = [n for n in range(1, 76) if n not in {x['no'] for x in qs}]
        print(f'{exam}: {len(qs)}题 | 有答案{with_ans} | 有解析{with_exp} | 缺题号{missing}')
        out[exam] = qs
    path = os.path.join(OUT_DIR, 'morning_v2.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print('输出:', path)

if __name__ == '__main__':
    main()
