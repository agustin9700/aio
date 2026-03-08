"""
process-skill-icons.py
- Elimina fondo exterior (flood fill BFS desde las 4 esquinas)
- Recorta al bounding box del contenido real
- Estira a 512x512 exacto
- Exporta como .webp, borra el .png original
- Corre en paralelo con N workers
"""

from PIL import Image
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

# ── CONFIG ────────────────────────────────────────────────────────────────────
INPUT_DIR    = Path("public/assets/skills/icons")
OUTPUT_DIR   = Path("public/assets/skills/icons")
TARGET_SIZE  = 512
WEBP_QUALITY = 90
BG_TOLERANCE = 30
WORKERS      = 4

def flood_fill_transparent(img, tolerance):
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    corners = [pixels[0,0], pixels[w-1,0], pixels[0,h-1], pixels[w-1,h-1]]
    bg = max(corners, key=lambda c: corners.count(c))
    bg_rgb = bg[:3]

    def is_bg(p):
        return all(abs(int(p[i]) - int(bg_rgb[i])) < tolerance for i in range(3))

    visited = set()
    queue = []
    for sx, sy in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]:
        if (sx,sy) not in visited and is_bg(pixels[sx,sy]):
            queue.append((sx,sy))
            visited.add((sx,sy))

    while queue:
        x, y = queue.pop()
        pixels[x,y] = (pixels[x,y][0], pixels[x,y][1], pixels[x,y][2], 0)
        for nx, ny in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
            if 0 <= nx < w and 0 <= ny < h and (nx,ny) not in visited:
                if is_bg(pixels[nx,ny]):
                    visited.add((nx,ny))
                    queue.append((nx,ny))
    return img


def fit_to_canvas(img, size):
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img.resize((size, size), Image.LANCZOS)


def process_file(src, output_dir):
    stem = src.stem
    dest = output_dir / f"{stem}.webp"
    try:
        img = Image.open(src).convert("RGBA")
        img = flood_fill_transparent(img, BG_TOLERANCE)
        img = fit_to_canvas(img, TARGET_SIZE)
        img.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
        if src.suffix.lower() == ".png":
            src.unlink()
        return ("ok", stem)
    except Exception as e:
        return ("err", f"{stem}  ({e})")


def process(input_dir, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(input_dir.glob("*.png")) + sorted(input_dir.glob("*.webp"))
    if not files:
        print(f"No images found in {input_dir.resolve()}")
        sys.exit(1)

    print(f"Processing {len(files)} files with {WORKERS} workers...\n")

    ok = fail = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(process_file, f, output_dir): f for f in files}
        for future in as_completed(futures):
            status, msg = future.result()
            if status == "ok":
                print(f"  OK  {msg}")
                ok += 1
            else:
                print(f"  ERR {msg}")
                fail += 1

    print(f"\n-------------------------")
    print(f"OK:      {ok}")
    print(f"Errores: {fail}")
    print(f"-------------------------")
    print(f"Output: {output_dir.resolve()}")


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        INPUT_DIR  = Path(sys.argv[1])
        OUTPUT_DIR = Path(sys.argv[2])
    elif len(sys.argv) == 2:
        INPUT_DIR  = Path(sys.argv[1])
        OUTPUT_DIR = INPUT_DIR

    process(INPUT_DIR, OUTPUT_DIR)