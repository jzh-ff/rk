# -*- coding: utf-8 -*-
"""检查 Obsidian 导出笔记的 wiki 链接完整性"""
import os, re, glob, sys

root = sys.argv[1] if len(sys.argv) > 1 else r'D:\OrangeMemory\橘子记忆\软考软件设计师'
files = {os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(root, '**', '*.md'), recursive=True)}
broken = set()
total = 0
for f in glob.glob(os.path.join(root, '**', '*.md'), recursive=True):
    for m in re.findall(r'\[\[([^\]|#\\]+)', open(f, encoding='utf-8').read()):
        total += 1
        if m.strip() not in files:
            broken.add(m.strip())
print(f'笔记数: {len(files)}  wiki链接总数: {total}  断链数: {len(broken)}')
for b in sorted(broken):
    print(' -', b)
