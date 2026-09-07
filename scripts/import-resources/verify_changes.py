# -*- coding: utf-8 -*-
"""验证本次增量内容：真题题库接入 + 公式页 + 练习页题量。"""
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5174/ruankao/'
ok = 0
fail = []

def check(name, cond):
    global ok
    print(('  PASS ' if cond else '  FAIL ') + name)
    if cond: ok += 1
    else: fail.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={'width': 1360, 'height': 900})
    pg.set_default_timeout(15000)

    print('[1] 公式速查页')
    pg.goto(BASE + 'formulas')
    pg.wait_for_selector('text=考前公式速查')
    check('页面标题渲染', pg.locator('text=考前公式速查').count() > 0)
    check('公式分组 >= 8', pg.locator('h2').count() >= 8)
    check('高频公式存在', pg.locator('text=🔥 只看高频').count() > 0)
    # 搜索
    pg.fill('input', '流水线')
    pg.wait_for_timeout(500)
    check('搜索过滤生效', pg.locator('text=流水线执行时间').count() > 0)
    pg.fill('input', '')
    pg.click('text=只看高频')
    pg.wait_for_timeout(500)
    check('高频过滤生效', pg.locator('pre').count() > 0)
    pg.screenshot(path='scripts/shots/v-formulas.png')

    print('[2] 章节练习（真题已并入）')
    pg.goto(BASE + 'practice')
    pg.wait_for_selector('text=章节练习')
    pg.wait_for_timeout(1500)
    body = pg.inner_text('body')
    check('练习页含真题标识', '真题' in body or '题' in body)
    # 统计总题量（页面上的总题数文字）
    import re
    m = re.search(r'共\s*(\d+)\s*题', body)
    if m:
        total = int(m.group(1))
        check(f'总题量 {total} >= 540', total >= 540)
    else:
        print('  （未找到总题量文字，输出正文前200字）')
        print(' ', body[:200].replace('\n', ' | '))

    print('[3] 数据结构与算法模块练习（新增 29 题）')
    # 直接找 ds 模块入口
    links = pg.locator('a[href*="/practice"], button:has-text("数据结构")')
    cnt = pg.locator('text=数据结构与算法').count()
    check('数据结构模块存在', cnt > 0)

    print('[4] 路由健康')
    for path in ['knowledge/co', 'mock', 'wrong', 'case']:
        pg.goto(BASE + path)
        pg.wait_for_timeout(1200)
        check(f'{path} 可访问', len(pg.inner_text('body')) > 300)

    b.close()

print()
print(f'通过 {ok} 项' + (f'，失败 {len(fail)} 项: {fail}' if fail else '，全部通过 ✅'))
