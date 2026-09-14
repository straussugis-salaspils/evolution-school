#!/usr/bin/env python3
"""Create compact WebP copies of PNG assets and update runtime references.

Original PNG files are deliberately kept in the repository as editable source
assets. The Vercel staging build omits them unless a runtime file still refers
to them (for example an Open Graph image).
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".github", ".vercel", "dist", "node_modules"}
RUNTIME_TEXT_EXTENSIONS = {".html", ".css", ".js", ".json", ".xml"}
URL_PATTERN = re.compile(
    r"(?P<url>(?:/|\.\.?/)?[^\s\"'()<>]+?\.png)(?P<suffix>[?#][^\s\"'()<>]*)?",
    re.IGNORECASE,
)
SOCIAL_META_PATTERN = re.compile(
    r"<meta\b[^>]*(?:property|name)\s*=\s*[\"'](?:og:image|twitter:image)[\"'][^>]*>",
    re.IGNORECASE,
)
LINK_TAG_PATTERN = re.compile(r"<link\b[^>]*>", re.IGNORECASE)


def is_skipped(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts)


def webp_path_for(png_path: Path) -> Path:
    normal = png_path.with_suffix(".webp")
    if not normal.exists():
        return normal
    relative = normal.relative_to(ROOT).as_posix()
    tracked = subprocess.run(
        ["git", "ls-files", "--error-unmatch", "--", relative],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    ).returncode == 0
    if tracked:
        return png_path.with_name(f"{png_path.stem}.optimized.webp")
    return normal


def convert_png(png_path: Path, webp_path: Path) -> tuple[int, int]:
    with Image.open(png_path) as image:
        image.seek(0)
        save_kwargs: dict[str, object] = {
            "format": "WEBP",
            "quality": 84,
            "method": 6,
        }
        if "icc_profile" in image.info:
            save_kwargs["icc_profile"] = image.info["icc_profile"]
        if "exif" in image.info:
            save_kwargs["exif"] = image.info["exif"]
        webp_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(webp_path, **save_kwargs)
    return png_path.stat().st_size, webp_path.stat().st_size


def resolve_local_reference(source: Path, url: str) -> Path | None:
    if "://" in url or url.startswith(("data:", "//")):
        return None
    decoded = unquote(url.replace("\\", "/"))
    if decoded.startswith("/"):
        candidate = ROOT / decoded.lstrip("/")
    else:
        candidate = source.parent / decoded
    try:
        resolved = candidate.resolve()
        resolved.relative_to(ROOT)
    except (OSError, ValueError):
        return None
    return resolved


def replacement_url(source: Path, original: str, target: Path) -> str:
    target_relative = target.relative_to(ROOT).as_posix()
    if original.startswith("/"):
        return "/" + target_relative
    relative = Path(os.path.relpath(target, source.parent)).as_posix()
    if original.startswith("./") and not relative.startswith("."):
        return "./" + relative
    return relative


def rewrite_runtime_file(source: Path, mapping: dict[Path, Path]) -> int:
    original_text = source.read_bytes().decode("utf-8")
    protected: list[str] = []

    def protect_social_meta(match: re.Match[str]) -> str:
        protected.append(match.group(0))
        return f"__CODEX_SOCIAL_META_{len(protected) - 1}__"

    working = original_text
    if source.suffix.lower() == ".html":
        working = SOCIAL_META_PATTERN.sub(protect_social_meta, working)

    replacements = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal replacements
        original_url = match.group("url")
        resolved = resolve_local_reference(source, original_url)
        target = mapping.get(resolved) if resolved else None
        if target is None:
            return match.group(0)
        replacements += 1
        return replacement_url(source, original_url, target) + (match.group("suffix") or "")

    working = URL_PATTERN.sub(replace, working)
    for index, meta in enumerate(protected):
        working = working.replace(f"__CODEX_SOCIAL_META_{index}__", meta)

    if working != original_text:
        source.write_bytes(working.encode("utf-8"))
    return replacements


def fix_webp_icon_mime_types() -> tuple[int, int]:
    changed_files = 0
    changed_tags = 0
    for source in ROOT.rglob("*.html"):
        if is_skipped(source):
            continue
        original_text = source.read_bytes().decode("utf-8")

        def replace_link(match: re.Match[str]) -> str:
            nonlocal changed_tags
            tag = match.group(0)
            if not re.search(r"\brel\s*=\s*[\"'][^\"']*icon", tag, re.IGNORECASE):
                return tag
            if not re.search(r"\bhref\s*=\s*[\"'][^\"']+\.webp(?:[?#][^\"']*)?[\"']", tag, re.IGNORECASE):
                return tag
            updated, count = re.subn(
                r"(\btype\s*=\s*[\"'])image/png([\"'])",
                r"\1image/webp\2",
                tag,
                flags=re.IGNORECASE,
            )
            changed_tags += count
            return updated

        updated_text = LINK_TAG_PATTERN.sub(replace_link, original_text)
        if updated_text != original_text:
            source.write_bytes(updated_text.encode("utf-8"))
            changed_files += 1
    return changed_files, changed_tags


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix-mime-only", action="store_true")
    args = parser.parse_args()

    if args.fix_mime_only:
        changed_files, changed_tags = fix_webp_icon_mime_types()
        print(f"Updated icon MIME files: {changed_files}")
        print(f"Updated icon MIME tags: {changed_tags}")
        return

    png_files = sorted(
        path
        for path in ROOT.rglob("*.png")
        if path.is_file() and not is_skipped(path)
    )

    mapping: dict[Path, Path] = {}
    source_bytes = 0
    webp_bytes = 0
    converted = 0
    for png_path in png_files:
        target = webp_path_for(png_path)
        before, after = convert_png(png_path, target)
        mapping[png_path.resolve()] = target.resolve()
        source_bytes += before
        webp_bytes += after
        converted += 1

    rewritten_files = 0
    rewritten_references = 0
    for source in ROOT.rglob("*"):
        if (
            not source.is_file()
            or is_skipped(source)
            or source.suffix.lower() not in RUNTIME_TEXT_EXTENSIONS
            or source.parts[-2:] == ("scripts", "png-webp-map.json")
        ):
            continue
        count = rewrite_runtime_file(source, mapping)
        if count:
            rewritten_files += 1
            rewritten_references += count

    saved = source_bytes - webp_bytes
    print(f"Converted PNG files: {converted}")
    print(f"Updated runtime files: {rewritten_files}")
    print(f"Updated references: {rewritten_references}")
    print(f"PNG source size: {source_bytes / 1024 / 1024:.2f} MiB")
    print(f"WebP output size: {webp_bytes / 1024 / 1024:.2f} MiB")
    print(f"Potential deployment saving: {saved / 1024 / 1024:.2f} MiB")
    changed_files, changed_tags = fix_webp_icon_mime_types()
    print(f"Updated icon MIME files: {changed_files}")
    print(f"Updated icon MIME tags: {changed_tags}")


if __name__ == "__main__":
    main()
