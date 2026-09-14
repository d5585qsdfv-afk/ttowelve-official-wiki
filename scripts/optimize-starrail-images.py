from pathlib import Path

from PIL import Image


ASSET_DIR = Path(__file__).resolve().parent.parent / "public" / "assets"
MAX_EDGE = 768


def optimize(path: Path) -> None:
    with Image.open(path) as source:
        if max(source.size) <= MAX_EDGE:
            return

        image = source.copy()
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        temporary = path.with_name(path.stem + ".optimized" + path.suffix)
        suffix = path.suffix.lower()

        if suffix == ".webp":
            image.save(temporary, "WEBP", quality=82, method=4)
        elif suffix in {".jpg", ".jpeg"}:
            image.convert("RGB").save(
                temporary,
                "JPEG",
                quality=86,
                optimize=True,
                progressive=True,
            )
        elif suffix == ".png":
            image.save(temporary, "PNG", optimize=True)
        else:
            return

        temporary.replace(path)


for asset in sorted(ASSET_DIR.glob("starrail-*")):
    optimize(asset)
