# -*- coding: utf-8 -*-
"""v2 补充测试：新模块、AI 功能界面、题库规模"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173'
SHOT = 'D:/CursorWP/rk/scripts/shots'
import os
os.makedirs(SHOT, exist_ok=True)

ok = 0
fails = []

def check(name, cond):
    global ok
    if cond:
        ok += 1
        print(f'  PASS {name}')
    else:
        fails.append(name)
        print(f'  FAIL {name}')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1360, 'height': 900})
    page.set_default_timeout(10000)
    page.on('dialog', lambda d: d.accept())

    print('[1] 题库规模与新模块')
    page.goto(f'{BASE}/practice')
    page.wait_for_load_state('networkidle')
    body = page.locator('main').inner_text()
    check('多媒体模块出现在练习页', '多媒体基础' in body)
    check('软件架构与新技术模块出现', '软件架构与新技术' in body)
    # 进 oo 模块验证 50 题
    page.click('button:has-text("面向对象与设计模式")')
    page.wait_for_load_state('networkidle')
    t = page.locator('main').inner_text()
    check('面向对象题库达 50 题', '50 题' in t)
    page.screenshot(path=f'{SHOT}/20-oo-50.png')

    print('[2] 新模块知识点')
    page.goto(f'{BASE}/knowledge/mm')
    page.wait_for_load_state('networkidle')
    check('多媒体知识点章节渲染', page.locator('text=图像与音频').count() > 0)
    page.goto(f'{BASE}/knowledge/arch/arch-c1')
    page.wait_for_load_state('networkidle')
    check('架构风格章节正文渲染', page.locator('.md-content').count() > 0)

    print('[3] 案例题扩充（10 道）')
    page.goto(f'{BASE}/case')
    page.wait_for_load_state('networkidle')
    body = page.locator('main').inner_text()
    check('数据流图 3 道', '数据流图（3）' in body)
    check('UML 2 道', 'UML 建模（2）' in body)
    check('算法 2 道', '算法分析（C）（2）' in body)

    print('[4] AI 功能界面')
    check('AI 助手悬浮按钮', page.locator('button[title="AI 答疑助手"]').count() == 1)
    page.locator('button[title="AI 答疑助手"]').click()
    page.wait_for_timeout(400)
    check('AI 抽屉打开（含示例问题）', page.locator('text=AI 答疑助手').count() >= 1 and page.locator('text=问我任何软考知识点').count() == 1)
    page.screenshot(path=f'{SHOT}/21-ai-assistant.png')
    # 用抽屉头部 ✕ 关闭
    page.locator('div.fixed button:has-text("✕")').last.click()
    page.wait_for_timeout(300)
    check('抽屉可关闭', page.locator('text=问我任何软考知识点').count() == 0)

    page.goto(f'{BASE}/ai-quiz')
    page.wait_for_load_state('networkidle')
    check('AI 出题页渲染', page.locator('text=AI 智能出题').count() >= 1)
    check('未配置提示可见', page.locator('text=设置').count() >= 1)
    page.screenshot(path=f'{SHOT}/22-ai-quiz.png')

    page.goto(f'{BASE}/settings')
    page.wait_for_load_state('networkidle')
    check('AI 配置区渲染', page.locator('text=AI 功能接口').count() == 1)
    check('三个预设按钮', page.locator('button:has-text("智谱 GLM")').count() == 1 and page.locator('button:has-text("DeepSeek")').count() == 1 and page.locator('button:has-text("Ollama 本地")').count() == 1)
    # 点预设自动填充
    page.click('button:has-text("智谱 GLM")')
    page.wait_for_timeout(300)
    url_val = page.locator('input[placeholder*="bigmodel"]').input_value()
    check('预设自动填充 Base URL', 'bigmodel' in url_val)
    page.screenshot(path=f'{SHOT}/23-settings-ai.png')

    print('[5] AI 讲解/评分按钮（未配置/不可达时给出友好提示）')
    page.goto(f'{BASE}/practice?module=co')
    page.wait_for_load_state('networkidle')
    page.locator('button:has-text("A.")').first.click()
    page.click('text=提交答案')
    page.wait_for_timeout(300)
    check('AI 深度讲解按钮出现', page.locator('button:has-text("AI 深度讲解")').count() == 1)
    page.click('button:has-text("AI 深度讲解")')
    page.wait_for_timeout(2500)
    body = page.locator('main').inner_text()
    check('AI 失败时给出友好提示（未配置/网络/接口错误指引）', any(k in body for k in ('未配置', '网络请求失败', '接口返回', 'AI 讲解生成中')))
    page.screenshot(path=f'{SHOT}/24-ai-explain-hint.png')

    page.goto(f'{BASE}/case')
    page.click('button:has-text("数据库设计")')
    page.wait_for_timeout(300)
    page.click('button:has-text("电商订单")')
    page.wait_for_load_state('networkidle')
    check('AI 评分按钮出现', page.locator('button:has-text("AI 评分本题")').count() == 1)

    print('[6] 组卷配额验证（75 题含新模块）')
    page.goto(f'{BASE}/mock')
    page.click('text=开始模考')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(600)
    page.click('text=展开答题卡')
    page.wait_for_timeout(400)
    sheet = page.locator('.grid.grid-cols-10 button').count()
    check(f'答题卡仍为 75 格（实际 {sheet}）', sheet == 75)
    page.click('text=放弃考试')
    page.wait_for_timeout(400)

    browser.close()

print(f'\n========== 结果: {ok} 通过, {len(fails)} 失败 ==========')
if fails:
    print('失败项:', fails)
    exit(1)
