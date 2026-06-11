from pathlib import Path
from markitdown import MarkItDown


def convert_to_markdown(input_path: str, output_path: str | None = None) -> str:
    """
    Convert a source document file to Markdown text using MarkItDown.

    Supported input examples:
    - PDF
    - DOCX / Word
    - PPTX / PowerPoint
    - XLSX / Excel
    - HTML
    - CSV, JSON, XML
    - Images
    - ZIP files

    Args:
        input_path: Path to the source file.
        output_path: Optional path for saving the converted Markdown file.

    Returns:
        Markdown text extracted from the source file.

    Raises:
        FileNotFoundError: If the input file does not exist.
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


if __name__ == "__main__":
    markdown = convert_to_markdown(
        input_path="lesson_plan.pdf",
        output_path="lesson_plan.md",
    )

    print(markdown)
