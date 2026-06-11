"""
Example: Convert a source document to Markdown using MarkItDown Document Converter.

Usage:
    python examples/convert_with_markitdown.py lesson_plan.pdf lesson_plan.md

If output_path is omitted, the converted Markdown will be printed to the console.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow running this example from the project root without installing the package.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tools.markitdown_tool import convert_to_markdown


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
