"""Genera miniature statiche WebP da immagini già pubbliche su Supabase.
Conserva intatti tutti gli originali. Non richiede credenziali né scrive su Supabase.
"""
import io
import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageOps

BASE = "https://hheemlsfyxnhtigwewwv.supabase.co/storage/v1/object/public/product-images/"
ROOT = Path("thumbs")
PATHS = json.loads(Path("thumb-manifest.json").read_text(encoding="utf-8"))

def generate(path):
    if not isinstance(path, str) or not path or len(path) > 320:
        return None
    if path.startswith("/") or any(part in ("", ".", "..") for part in path.split("/")):
        return None
    if not re.fullmatch(r"[A-Za-z0-9_./ -]+", path):
        return None
    target = ROOT / (path + ".webp")
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_file() and target.stat().st_size > 300:
        return (path, target.as_posix())
    url = BASE + urllib.parse.quote(path, safe="/")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CarteDiemThumbnailBuilder/1.0"})
        with urllib.request.urlopen(req, timeout=25) as response:
            data = response.read(13 * 1024 * 1024)
        if len(data) > 12 * 1024 * 1024:
            raise ValueError("Immagine oltre limite")
        with Image.open(io.BytesIO(data)) as image:
            image = ImageOps.exif_transpose(image)
            image.thumbnail((480, 480), Image.Resampling.LANCZOS)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            image.save(target, "WEBP", quality=74, method=5)
        return (path, target.as_posix())
    except Exception as exc:
        print("SKIP", path, str(exc)[:160], flush=True)
        try:
            target.unlink(missing_ok=True)
        except OSError:
            pass
        return None

def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    results = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(generate, path) for path in sorted(set(PATHS))]
        for future in as_completed(futures):
            result = future.result()
            if result:
                original, thumb = result
                results[original] = thumb
    (ROOT / "index.json").write_text(
        json.dumps(dict(sorted(results.items())), ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8"
    )
    # La mappa JS consente alle pagine di scegliere soltanto miniature realmente presenti.
    # Nessuna dipendenza da Supabase Pro o trasformazioni esterne.
    index_js = "window.CD_STATIC_THUMBS=" + json.dumps(
        dict(sorted(results.items())), ensure_ascii=True, separators=(",", ":")
    ) + ";\n"
    (ROOT / "index.js").write_text(index_js, encoding="utf-8")
    print(f"Miniature generate: {len(results)} / {len(set(PATHS))}", flush=True)
    if len(results) < max(1, len(set(PATHS)) // 2):
        raise SystemExit("Troppe immagini non scaricabili: non pubblicare miniature parziali")

if __name__ == "__main__":
    main()
