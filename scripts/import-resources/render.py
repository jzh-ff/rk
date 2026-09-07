import pymupdf, os, sys

BASE = r'E:\BaiduNetdiskDownload\软考中级设计师\中级 软件设计师(软设)'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages')
os.makedirs(OUT, exist_ok=True)

exams = {
    '2022-05': os.path.join(BASE, '希赛李阿妹', '03 2009-2024年真题及答案解析', '2009-2023年真题答案解析', '2022年05月软件设计师上午真题及答案解析---闲鱼卖家云晨之行.pdf'),
    '2022-11': os.path.join(BASE, '希赛李阿妹', '03 2009-2024年真题及答案解析', '2009-2023年真题答案解析', '2022年11月软件设计师上午真题及答案解析---闲鱼卖家云晨之行.pdf'),
    '2024-05': os.path.join(BASE, '其他资料', '02.历年真题+解析', '2020-2024年真题＋解析', '2024年上半年软件设计师上午真题及答案.pdf'),
}
for name, path in exams.items():
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    doc = pymupdf.open(path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=130)
        pix.save(os.path.join(d, f'p{i+1:02d}.png'))
    doc.close()
    print(name, len(os.listdir(d)), '页已渲染')
