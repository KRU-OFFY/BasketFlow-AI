"""
Standalone MarkItDown Document Converter.

Use this file when your runtime cannot import tools.markitdown_tool.

Install:
    python -m pip install "markitdown[all]"

Usage:
    python convert_markitdown_standalone.py input.pdf output.md

Examples:
    python convert_markitdown_standalone.py lesson_plan.pdf lesson_plan.md
    python convert_markitdown_standalone.py worksheet.docx worksheet.md
    python convert_markitdown_standalone.py slides.pptx slides.md
"""

from __future__ import annotations

import argparse
from pathlib import Path
from markitdown import MarkItDown


def convert_to_markdown(input_path: str, output_path: str | None = None) -> str:
    """
    Convert a source document file to Markdown text using MarkItDown.
    """
    file_path = Path(input_path)

    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {input_path}")

    md_converter = MarkItDown(enable_plugins=False)
    result = md_converter.convert(str(file_path))

    markdown_text = result.text_content

    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(markdown_text, encoding="utf-8")

    return markdown_text


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, XML, image, or ZIP files to Markdown."
    )
    parser.add_argument("input_path", help="Path to the source file, e.g. lesson_plan.pdf")
    parser.add_argument(
        "output_path",
        nargs="?",
        default=None,
        help="Optional path to save Markdown output, e.g. lesson_plan.md",
    )

    args = parser.parse_args()

    markdown = convert_to_markdown(
        input_path=args.input_path,
        output_path=args.output_path,
    )

    if args.output_path:
        print(f"Markdown saved to: {args.output_path}")
    else:
        print(markdown)


if __name__ == "__main__":
    main()
