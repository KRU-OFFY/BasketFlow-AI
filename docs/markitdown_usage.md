# MarkItDown Document Converter

เครื่องมือสำหรับแปลงไฟล์ต้นฉบับเป็น Markdown เพื่อเตรียมข้อมูลสำหรับการวิเคราะห์ สรุป สังเคราะห์ และสร้างเอกสารด้วย AI

## Supported files

- PDF
- DOCX / Word
- PPTX / PowerPoint
- XLSX / Excel
- HTML
- CSV, JSON, XML
- Images
- ZIP files

## Install

```bash
pip install -r requirements.txt
```

For full optional support:

```bash
python -m pip install "markitdown[all]"
```

## Console usage

```bash
python examples/convert_with_markitdown.py lesson_plan.pdf lesson_plan.md
```

## Python usage

```python
from tools.markitdown_tool import convert_to_markdown

markdown = convert_to_markdown(
    input_path="lesson_plan.pdf",
    output_path="lesson_plan.md",
)

print(markdown)
```

## Workflow

1. Upload a source file such as PDF, DOCX, PPTX, or XLSX.
2. Convert the file to Markdown.
3. Review headings, tables, lists, and text structure.
4. Use the Markdown with Gemini, NotebookLM, ChatGPT, or another AI tool.
5. Generate a lesson plan, worksheet, rubric, SAR report, or PA/DPA document.
