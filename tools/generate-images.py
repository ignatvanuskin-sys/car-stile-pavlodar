# -*- coding: utf-8 -*-
"""Car Stile — адаптивные WebP ровно под слоты вёрстки.

Набор вариантов намеренно узкий: генерируется только то, что реально
запрашивают вызовы art() в Home.tsx. Проверка соответствия —
check_assets.py; лишние файлы в сборку не попадают.
"""
import os
import sys

from PIL import Image

# Корень проекта — считается от самого файла, поэтому генератор не привязан
# к машине, на которой его запускают.
PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Исходники заказчика (фото из карточки 2ГИС). Путь можно переопределить первым
# аргументом: python tools/generate-images.py "D:\photos".
SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\ЗА БАБКИ\детейлинг ПОД КЛЮЧ\car stile 7\assets"
OUT = os.path.join(PROJ, "client", "public", "img")


def source_path(name):
    """Имена, начинающиеся с «_», лежат в репозитории (_stock, _brand)."""
    if name.startswith("_"):
        return os.path.join(PROJ, name)
    return os.path.join(SRC, name)

R_CARD = 4 / 3
R_TALL = 3 / 4
R_PORT = 420 / 545
R_WIDE = 16 / 9
R_MOB = 3 / 4

# база -> (исходник, [(суффикс, ширина, соотношение), ...], точка внимания)
# суффикс None = имя без суффикса (базы «до/после» уже сами по себе полные).
PLAN = {
    # Hero: стоковое фото с Pexels вместо своих кадров — по просьбе заказчика.
    # Фото 29755711, лицензия Pexels (свободно, в том числе коммерчески, без
    # обязательной атрибуции): https://www.pexels.com/photo/29755711/
    # Выбрано из шести вариантов: глянцевый кузов подходит под заголовок
    # «Глянец, чистота и тишина», а людей и крупных чужих логотипов в кадре нет —
    # лицензия прямо запрещает намекать на одобрение со стороны брендов и людей.
    # Портретный исходник 2560x3837, из него набираются и широкий, и мобильный кадры.
    "hero": ("_stock/hero-gloss-black.jpg",
             [("wide", 1280, R_WIDE), ("wide", 1920, R_WIDE),
              ("mobile", 480, R_MOB), ("mobile", 800, R_MOB), ("mobile", 1200, R_MOB)], 0.52),
    # Полировка: крупный глянцевый капот — ровно то, что продаёт услугу.
    # «big» — кадр для просмотра фото на весь экран (нажатие на плитку работ).
    "polish": ("02-polish-hood.jpg",
               [("card", 480, R_CARD), ("card", 800, R_CARD),
                ("tall", 480, R_TALL), ("tall", 800, R_TALL),
                ("portrait", 420, R_PORT), ("portrait", 760, R_PORT),
                ("big", 1200, R_TALL)], 0.5),
    "interior": ("09-clean-salon-toyota.jpg",
                 [("card", 480, R_CARD), ("card", 800, R_CARD),
                  ("portrait", 420, R_PORT), ("portrait", 760, R_PORT)], 0.5),
    "sound": ("07-salon-disassembly.jpg",
              [("card", 480, R_CARD), ("card", 800, R_CARD),
               ("tall", 480, R_TALL), ("tall", 800, R_TALL),
               ("portrait", 420, R_PORT), ("portrait", 760, R_PORT),
               ("big", 1200, R_TALL)], 0.5),
    "fara": ("04-fara-process.jpg",
             [("card", 480, R_CARD), ("card", 800, R_CARD),
              ("portrait", 420, R_PORT), ("portrait", 760, R_PORT),
              ("big", 1200, R_TALL)], 0.5),
    # 08-clean-salon — портретный исходник 1440x1824, поэтому и portrait-, и
    # tall-кропы набираются без апскейла и плитка остаётся резкой.
    "salon": ("08-clean-salon.jpg",
              [("card", 480, R_CARD), ("card", 800, R_CARD),
               ("tall", 480, R_TALL), ("tall", 800, R_TALL),
               ("portrait", 420, R_PORT), ("portrait", 760, R_PORT),
               ("big", 1200, R_TALL)], 0.5),
    "seats": ("10-clean-rear-seats.jpg",
              [("mobile", 480, R_MOB), ("mobile", 800, R_MOB), ("mobile", 1200, R_MOB),
               ("wide", 1280, R_WIDE), ("wide", 1920, R_WIDE)], 0.5),
    # Кадры «до/после» сняты сверху вниз, поэтому кроп смещён ниже центра:
    # разница видна именно на полу багажника.
    "ba-before": ("12-before-trunk.jpg", [(None, 480, 4 / 5), (None, 800, 4 / 5)], 0.62),
    "ba-after": ("11-after-trunk.jpg", [(None, 480, 4 / 5), (None, 800, 4 / 5)], 0.62),
    "ba-before-wide": ("12-before-trunk.jpg", [(None, 1280, R_WIDE), (None, 1920, R_WIDE)], 0.62),
    "ba-after-wide": ("11-after-trunk.jpg", [(None, 1280, R_WIDE), (None, 1920, R_WIDE)], 0.62),
}


def crop_to(im, ratio, focus):
    """Центрированный кроп под нужное соотношение, точка внимания по вертикали."""
    w, h = im.size
    if w / h > ratio:
        nw = int(round(h * ratio))
        x = (w - nw) // 2
        box = (x, 0, x + nw, h)
    else:
        nh = int(round(w / ratio))
        y = max(0, min(h - nh, int(round((h - nh) * focus))))
        box = (0, y, w, y + nh)
    out = im.crop(box)
    out.load()
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    for n in os.listdir(OUT):
        if n.lower().endswith(".webp"):
            os.remove(os.path.join(OUT, n))

    for base, (srcname, variants, focus) in PLAN.items():
        with Image.open(source_path(srcname)) as raw:
            src = raw.convert("RGB")
        for suffix, width, ratio in variants:
            im = crop_to(src, ratio, focus)
            # только уменьшение: апскейл не улучшает картинку, а srcset начинает врать
            if im.width > width:
                im = im.resize((width, max(1, int(round(width / ratio)))), Image.LANCZOS)
            name = "%s-%d.webp" % (base, width) if suffix is None else "%s-%s-%d.webp" % (base, suffix, width)
            im.save(os.path.join(OUT, name), "WEBP", quality=80, method=5)
            print("%-30s %dx%d" % (name, im.width, im.height))
        src.close()

    files = [f for f in os.listdir(OUT) if f.endswith(".webp")]
    size = sum(os.path.getsize(os.path.join(OUT, f)) for f in files)
    print("\nfiles=%d  total=%.2f MB" % (len(files), size / 1024 / 1024))


if __name__ == "__main__":
    main()
