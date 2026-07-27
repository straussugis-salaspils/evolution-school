from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets" / "archetype-articles" / "inserts" / "characters"

SOURCES = {
    "persephone": ("source.webp", 0.50, 0.48),
    "aphrodite": ("master.png", 0.44, 0.46),
    "artemis": ("master.png", 0.50, 0.46),
    "athena": ("master.png", 0.50, 0.46),
    "hera": ("master.png", 0.50, 0.46),
    "hestia": ("master.png", 0.48, 0.46),
    "demeter": ("master.png", 0.42, 0.47),
    "hecate": ("master.png", 0.48, 0.47),
    "zeus": ("source.webp", 0.20, 0.44),
    "hades": ("source.webp", 0.62, 0.50),
}

WIDTHS = (360, 560, 760)
TARGET_RATIO = 4 / 5


def crop_around_focal(image: Image.Image, focal_x: float, focal_y: float) -> Image.Image:
    width, height = image.size
    source_ratio = width / height

    if source_ratio > TARGET_RATIO:
        crop_height = height
        crop_width = round(height * TARGET_RATIO)
    else:
        crop_width = width
        crop_height = round(width / TARGET_RATIO)

    center_x = round(width * focal_x)
    center_y = round(height * focal_y)
    left = min(max(center_x - crop_width // 2, 0), width - crop_width)
    top = min(max(center_y - crop_height // 2, 0), height - crop_height)
    return image.crop((left, top, left + crop_width, top + crop_height))


for slug, (filename, focal_x, focal_y) in SOURCES.items():
    folder = ASSET_ROOT / slug
    source_path = folder / filename
    if not source_path.exists():
        raise FileNotFoundError(source_path)

    with Image.open(source_path) as source:
        image = source.convert("RGB")
        crop = crop_around_focal(image, focal_x, focal_y)
        for width in WIDTHS:
            resized = crop.resize((width, round(width / TARGET_RATIO)), Image.Resampling.LANCZOS)
            resized.save(folder / f"portrait-{width}.webp", "WEBP", quality=84, method=6)
            resized.save(
                folder / f"portrait-{width}.jpg",
                "JPEG",
                quality=86,
                optimize=True,
                progressive=True,
            )

print(f"Prepared {len(SOURCES)} archetype character portraits.")
