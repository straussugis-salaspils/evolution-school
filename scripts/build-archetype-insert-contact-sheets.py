from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "archetype-article-inserts"
CHARACTERS = ROOT / "assets" / "archetype-articles" / "inserts" / "characters"


def contact_sheet(items, output, columns, cell_size, background=(248, 243, 247)):
    cell_width, cell_height = cell_size
    rows = (len(items) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), background)
    draw = ImageDraw.Draw(sheet)
    for index, (label, source) in enumerate(items):
        row, column = divmod(index, columns)
        x, y = column * cell_width, row * cell_height
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            fitted = ImageOps.contain(
                image,
                (cell_width - 24, cell_height - 48),
                Image.Resampling.LANCZOS,
            )
        paste_x = x + (cell_width - fitted.width) // 2
        paste_y = y + 12 + (cell_height - 48 - fitted.height) // 2
        sheet.paste(fitted, (paste_x, paste_y))
        draw.text((x + 14, y + cell_height - 29), label, fill=(50, 23, 59))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "JPEG", quality=88, optimize=True, progressive=True)


character_items = [
    (folder.name, folder / "portrait-560.webp")
    for folder in sorted(CHARACTERS.iterdir())
    if folder.is_dir() and (folder / "portrait-560.webp").exists()
]
contact_sheet(
    character_items,
    ARTIFACTS / "characters-contact-sheet.jpg",
    columns=5,
    cell_size=(210, 310),
)

diagram_items = []
for screenshot in sorted(ARTIFACTS.glob("*-1440.png")):
    diagram_items.append((screenshot.stem.removesuffix("-1440").upper(), screenshot))
contact_sheet(
    diagram_items,
    ARTIFACTS / "diagrams-contact-sheet.jpg",
    columns=3,
    cell_size=(360, 280),
)

print(f"Built contact sheets for {len(character_items)} characters and {len(diagram_items)} diagrams.")
