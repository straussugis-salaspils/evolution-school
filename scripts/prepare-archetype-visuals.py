from pathlib import Path
from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(
    r"C:\Users\Ugis\.codex\generated_images\019f5731-0799-7ee1-a29c-bf7e0026cc4e"
)
OUTPUT_ROOT = ROOT / "assets" / "archetype-articles"

SOURCES = {
    "L01": "exec-8f42c442-b539-4272-9638-df8da5ff3fdd.png",
    "R01": "exec-dcd2594f-4062-4108-980a-bb3a3d4dd878.png",
    "R02": "exec-c06c63ce-8457-45de-abf2-0a93356d84a7.png",
    "R03": "exec-745a6c6b-b960-4855-91ec-4666fd727f89.png",
    "R04": "exec-fecc495d-7f8e-4624-ad21-e26085b44ada.png",
    "R05": "exec-b67b9474-c876-4056-8165-d856119b7705.png",
    "L03": "exec-1ca5f3ba-7c38-4051-b55f-104baef023d6.png",
    "L05": "exec-3f0b6a5d-e53d-41ac-ac7e-31fbe87831b6.png",
    "L04": "exec-42632aa5-f78c-4ee8-bef8-39a03905e409.png",
    "L06": "exec-1dc5b5c0-f7f9-42b5-9a78-037c54b1c910.png",
    "S05": "call_10py6NsBHEual27QblXk8AuP.png",
    "R06": "exec-bbd3455f-9674-4bb8-b88b-395d87915d3f.png",
    "R07": "exec-9be2f338-27b1-4687-bdaf-71ae51eda37d.png",
    "R08": "exec-a6521059-69ac-4a46-8364-c380c5a40da9.png",
    "L07": "exec-c8b9cf2c-2a1c-490b-9e4d-57cf6ae2ffd6.png",
    "L08": "exec-ab262c85-3a40-440b-acba-82aeb984c2f4.png",
    "L09": "exec-5a99a707-d417-49f0-8fdf-316335a0b09e.png",
    "S06": "exec-e01cd273-6c25-406f-9d29-2855dc510b4d.png",
    "S04": "exec-5b53c329-7ae5-4118-9bd2-9b5bf3b3c920.png",
    "L10": "exec-3a573b92-a868-4b6a-9afb-3464c239e624.png",
    "L12": "exec-0a01edc0-4384-4db2-92ee-207ca13bd055.png",
    "L13": "exec-90b4b34b-a036-4160-9ef5-f3d86fd487fc.png",
    "L15": "exec-e2629f27-b42a-4f61-992a-bbef5887b6b2.png",
    "L16": "exec-0c4557bd-2fd1-48e6-b648-8fb950579ef2.png",
}


def crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(
        image,
        size,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )


def save_webp(image: Image.Image, destination: Path, quality: int = 76) -> None:
    image.save(destination, "WEBP", quality=quality, method=6)


def save_jpeg(image: Image.Image, destination: Path, quality: int = 80) -> None:
    image.convert("RGB").save(
        destination,
        "JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
    )


def main() -> None:
    missing = [name for name in SOURCES.values() if not (SOURCE_ROOT / name).exists()]
    if missing:
        raise SystemExit(f"Missing generated images: {', '.join(missing)}")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for route_id, filename in SOURCES.items():
        source = SOURCE_ROOT / filename
        destination = OUTPUT_ROOT / route_id.lower()
        destination.mkdir(parents=True, exist_ok=True)

        with Image.open(source) as original:
            image = original.convert("RGB")
            image.save(destination / "source.jpg", "JPEG", quality=92, optimize=True)

            for width in (480, 768, 1200, 1600):
                hero = crop(image, (width, round(width * 0.75)))
                save_webp(hero, destination / f"hero-{width}.webp")
            save_jpeg(crop(image, (1200, 900)), destination / "hero-1200.jpg")

            for width in (480, 800, 1200):
                card = crop(image, (width, round(width * 10 / 16)))
                save_webp(card, destination / f"card-{width}.webp")
            save_jpeg(crop(image, (800, 500)), destination / "card-800.jpg")
            save_jpeg(crop(image, (1200, 630)), destination / "og-1200.jpg")

    contact_columns = 6
    cell_width, image_height, label_height = 300, 188, 34
    contact_rows = (len(SOURCES) + contact_columns - 1) // contact_columns
    sheet = Image.new(
        "RGB",
        (contact_columns * cell_width, contact_rows * (image_height + label_height)),
        "#35131d",
    )
    draw = ImageDraw.Draw(sheet)
    for index, route_id in enumerate(SOURCES):
        x = (index % contact_columns) * cell_width
        y = (index // contact_columns) * (image_height + label_height)
        with Image.open(OUTPUT_ROOT / route_id.lower() / "card-800.jpg") as card:
            sheet.paste(card.resize((cell_width, image_height), Image.Resampling.LANCZOS), (x, y))
        draw.text((x + 10, y + image_height + 9), route_id, fill="#fffaf2")
    artifact_root = ROOT / "artifacts" / "archetype-articles"
    artifact_root.mkdir(parents=True, exist_ok=True)
    save_jpeg(sheet, artifact_root / "hero-contact-sheet.jpg", quality=88)

    print(f"Prepared {len(SOURCES)} archetype visual families in {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
