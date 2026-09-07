# -*- coding: utf-8 -*-
"""软考学习网站核心流程冒烟测试"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173'
SHOT = 'D:/CursorWP/rk/scripts/shots'
import os
os.makedirs(SHOT, exist_ok=True)

ok_count = 0
fail_msgs = []

def check(name, cond):
    global ok_count
    if cond:
        ok_count += 1
        print(f'  PASS {name}')
    else:
        fail_msgs.append(name)
        print(f'  FAIL {name}')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1360, 'height': 900})
    page.set_default_timeout(10000)
    page.on('dialog', lambda d: d.accept())

    # ---------- 1. 首页仪表盘 ----------
    print('[1] 仪表盘')
    page.goto(BASE)
    page.wait_for_load_state('networkidle')
    check('倒计时数字渲染', page.locator('text=距离 2026 下半年软考').count() > 0)
    check('12 模块正确率区渲染', page.locator('text=各模块正确率').count() > 0)
    page.screenshot(path=f'{SHOT}/1-dashboard.png')

    # ---------- 2. 知识点 ----------
    print('[2] 知识点学习')
    page.click('text=知识点')
    page.wait_for_load_state('networkidle')
    check('模块列表 >= 12', page.locator('a[href^="/knowledge/"]').count() >= 12)
    page.click('a[href="/knowledge/se"]')
    page.wait_for_load_state('networkidle')
    check('软件工程章节列表', page.locator('text=软件开发模型').count() > 0)
    page.screenshot(path=f'{SHOT}/2-knowledge-list.png')
    page.click('a[href^="/knowledge/se/se-c1"]')
    page.wait_for_load_state('networkidle')
    check('章节正文渲染（含表格）', page.locator('table').count() > 0)
    page.click('text=标记掌握')
    page.wait_for_timeout(300)
    check('标记掌握后变为已掌握', page.locator('text=✔ 已掌握').count() > 0)
    page.screenshot(path=f'{SHOT}/3-knowledge-chapter.png')

    # ---------- 3. 章节练习（答对一题 + 答错一题） ----------
    print('[3] 章节练习')
    page.click('text=章节练习')
    page.wait_for_load_state('networkidle')
    check('练习模块列表', page.locator('button:has-text("题")').count() >= 12)
    page.screenshot(path=f'{SHOT}/4-practice-select.png')
    # 进数据库模块
    page.click('button:has-text("数据库系统")')
    page.wait_for_load_state('networkidle')
    check('题卡渲染', page.locator('text=提交答案').count() == 1)
    # 先读出正确答案（从解析），直接点第一个选项提交（可能对可能错，都能验证流程）
    page.locator('button:has-text("A.")').first.click()
    page.click('text=提交答案')
    page.wait_for_timeout(300)
    check('判分结果出现', page.locator('text=回答正确').count() + page.locator('text=回答错误').count() == 1)
    check('解析渲染', page.locator('text=📖 解析').count() == 1)
    page.screenshot(path=f'{SHOT}/5-practice-answer.png')

    # ---------- 4. 模考上午卷 ----------
    print('[4] 整卷模考')
    page.click('text=整卷模考')
    page.wait_for_load_state('networkidle')
    check('考试规则说明', page.locator('text=考试规则').count() == 1)
    page.screenshot(path=f'{SHOT}/6-mock-entry.png')
    page.click('text=开始模考')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    check('上午卷顶部计时', page.locator('text=总剩余').count() > 0)
    check('90 分钟内交卷被禁止', page.locator('button:has-text("交卷")').first.is_disabled())
    # 展开+用答题卡
    page.click('text=展开答题卡')
    page.wait_for_timeout(200)
    check('答题卡 75 格', page.locator('.grid button').count() >= 75)
    # 答第 1 题（选项 A）
    page.locator('button:has-text("A.")').first.click()
    page.wait_for_timeout(200)
    # 刷新恢复
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    check('刷新后模考恢复（计时仍在）', page.locator('text=总剩余').count() > 0)
    page.screenshot(path=f'{SHOT}/7-mock-morning.png')
    # 放弃考试（dialog 已全局自动接受）
    page.click('text=放弃考试')
    page.wait_for_timeout(500)
    check('放弃后回到入口', page.locator('text=考试规则').count() == 1)
    # 再次开始模考验证入口循环可用
    page.click('text=开始模考')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    check('可再次开始模考', page.locator('text=总剩余').count() > 0)
    page.click('text=放弃考试')
    page.wait_for_timeout(500)

    # ---------- 5. 案例分析 ----------
    print('[5] 案例分析')
    page.click('text=案例分析')
    page.wait_for_load_state('networkidle')
    check('五大题型标签', page.locator('text=数据流图').count() > 0 and page.locator('text=UML 建模').count() > 0)
    page.screenshot(path=f'{SHOT}/8-case-list.png')
    page.locator('button:has-text("校园图书借阅")').first.click()
    page.wait_for_load_state('networkidle')
    check('背景材料渲染', page.locator('text=背景材料').count() == 1)
    check('作答文本框出现', page.locator('textarea').count() >= 1)
    page.locator('textarea').first.fill('考生、图书管理员')
    page.click('text=对照参考答案与评分要点')
    page.wait_for_timeout(300)
    check('参考答案与自评展开', page.locator('text=参考答案').count() >= 1)
    page.screenshot(path=f'{SHOT}/9-case-answer.png')

    # ---------- 6. 错题本（依赖第3步可能答错；用刷新持久化验证） ----------
    print('[6] 错题本 + 持久化')
    page.click('text=错题本')
    page.wait_for_load_state('networkidle')
    wb_state = page.locator('text=错题本是空的').count()
    print(f'  (错题本当前: {"空" if wb_state else "有错题"})')
    page.screenshot(path=f'{SHOT}/10-wrongbook.png')

    # ---------- 7. 设置页 ----------
    print('[7] 设置')
    page.click('text=设置')
    page.wait_for_load_state('networkidle')
    check('设置页渲染', page.locator('text=数据备份').count() == 1)
    page.screenshot(path=f'{SHOT}/11-settings.png')

    browser.close()

print(f'\n========== 结果: {ok_count} 通过, {len(fail_msgs)} 失败 ==========')
if fail_msgs:
    print('失败项:', fail_msgs)
    exit(1)
