# -*- coding: utf-8 -*-
"""Проверяет, что каждый файл изображения, который запрашивает вёрстка, есть на диске.

Имена собираются из вызовов art("<base>", [ширины]) в Home.tsx, включая
динамические базы из массивов services / portfolio / cases, а также из ссылок
просмотра на весь экран (поле big). Молчаливый 404 здесь опаснее всего:
SPA-фоллбэк отдаёт index.html со статусом 200, поэтому битая картинка выглядит
просто пустым прямоугольником, а в консоли тихо.
"""
import io
import os
import re

ROOT = r"C:\ЗА БАБКИ\центр\car-stile"
HOME = os.path.join(ROOT, "client", "src", "pages", "Home.tsx")
PUB = os.path.join(ROOT, "client", "public", "img")

src = io.open(HOME, encoding="utf-8").read()
needed = set()


def add(base, widths):
    for w in widths:
        needed.add("%s-%d.webp" % (base, int(w)))


# 1. литеральные вызовы art("base", [..])
for m in re.finditer(r'art\(\s*"([^"]+)"\s*,\s*\[([0-9,\s]+)\]', src):
    add(m.group(1), [x.strip() for x in m.group(2).split(",") if x.strip()])

# 2. сервисы: art(`${media}-card`, [480, 800]) и art(`${media}-portrait`, [420, 760])
media = re.findall(r'media:\s*"([^"]+)"', src)
svc = re.search(r'const services = \[(.*?)\n\];', src, re.S)
if svc:
    for name in re.findall(r'media:\s*"([^"]+)"', svc.group(1)):
        add(name + "-card", [480, 800])
        add(name + "-portrait", [420, 760])

# 3. портфолио: mobile -> [480,800], desktop -> [420,760]
port = re.search(r'const portfolio = \[(.*?)\n\];', src, re.S)
if port:
    for mob, desk in zip(re.findall(r'mobile:\s*"([^"]+)"', port.group(1)),
                         re.findall(r'desktop:\s*"([^"]+)"', port.group(1))):
        add(mob, [480, 800])
        add(desk, [420, 760])

# 5. просмотр фотографии на весь экран: big -> [1200]
if port:
    for b in re.findall(r'big:\s*"([^"]+)"', port.group(1)):
        add(b, [1200])

# 4. до/после
case = re.search(r'const cases = \[(.*?)\n\];', src, re.S)
if case:
    for f in ("beforeMobile", "afterMobile"):
        for b in re.findall(f + r':\s*"([^"]+)"', case.group(1)):
            add(b, [480, 800])
    for f in ("beforeDesktop", "afterDesktop"):
        for b in re.findall(f + r':\s*"([^"]+)"', case.group(1)):
            add(b, [1280, 1920])

on_disk = set(n for n in os.listdir(PUB) if n.endswith(".webp"))
missing = sorted(needed - on_disk)
unused = sorted(on_disk - needed)

print("нужно файлов: %d | на диске: %d" % (len(needed), len(on_disk)))
print("ОТСУТСТВУЮТ: %s" % (missing if missing else "нет"))
print("не используются вёрсткой: %s" % (unused if unused else "нет"))
