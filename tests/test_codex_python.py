from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "Kru-Toffy" / "codex-python.py"


def load_tool_module():
    spec = importlib.util.spec_from_file_location("codex_python", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def make_docx(path: Path, paragraphs: list[str]) -> None:
    body = "".join(
        f"<w:p><w:r><w:t>{escape_xml(paragraph)}</w:t></w:r></w:p>"
        for paragraph in paragraphs
    )
    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{body}</w:body>"
        "</w:document>"
    )
    content_types = (
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.'
        'wordprocessingml.document.main+xml"/>'
        "</Types>"
    )
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr(
            "_rels/.rels",
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
        )
        archive.writestr("word/document.xml", document_xml)


def escape_xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


class CodexPythonTests(unittest.TestCase):
    def test_extract_docx_and_detect_sections(self) -> None:
        tool = load_tool_module()
        with tempfile.TemporaryDirectory() as temp_dir:
            docx_path = Path(temp_dir) / "sample.docx"
            make_docx(
                docx_path,
                [
                    "ผลการจัดการเรียนรู้ ผู้เรียนทำงานได้ตามเป้าหมาย",
                    "ปัญหาและอุปสรรค ผู้เรียนบางส่วนยังต้องฝึกเพิ่มเติม",
                ],
            )

            document = tool.extract_docx(docx_path)
            sections = tool.detect_sections(document)

        self.assertIn("ผลการจัดการเรียนรู้", sections)
        self.assertIn("ปัญหาและอุปสรรค", sections)

    def test_cli_generates_markdown_and_json(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            sample = root / "sample.docx"
            lesson = root / "lesson.docx"
            evidence = root / "scores.csv"
            output = root / "out" / "record.md"
            analysis = root / "out" / "analysis.json"
            make_docx(
                sample,
                [
                    "ผลการจัดการเรียนรู้ นักเรียนส่วนใหญ่ทำงานได้",
                    "แนวทางแก้ไข ใช้แบบฝึกเพิ่มเติม",
                ],
            )
            make_docx(
                lesson,
                [
                    "รายวิชา วิทยาการคำนวณ",
                    "ชั้น ป.5",
                    "หน่วยการเรียนรู้ การแก้ปัญหา",
                    "เรื่อง อัลกอริทึม",
                    "เวลา 1 ชั่วโมง",
                ],
            )
            evidence.write_text(
                "name,score,link\nA,80,https://youtu.be/example\nB,90,\n",
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_PATH),
                    "--sample",
                    str(sample),
                    "--lesson-plan",
                    str(lesson),
                    "--evidence",
                    str(evidence),
                    "--output",
                    str(output),
                    "--analysis-json",
                    str(analysis),
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(output.exists())
            self.assertTrue(analysis.exists())
            record = output.read_text(encoding="utf-8")
            self.assertIn("บันทึกผลการจัดการเรียนรู้", record)
            self.assertIn("ค่าเฉลี่ย", record)
            self.assertIn("youtu.be", record)

    def test_cli_reports_missing_file_without_traceback(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_PATH),
                "--sample",
                "missing-sample.docx",
                "--lesson-plan",
                "missing-lesson.docx",
            ],
            check=False,
            text=True,
            capture_output=True,
        )

        self.assertEqual(result.returncode, 1)
        self.assertIn("ข้อผิดพลาด", result.stderr)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
