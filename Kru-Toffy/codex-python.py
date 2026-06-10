#!/usr/bin/env python3
"""Build Thai post-lesson learning records from lesson-plan evidence files.

This command-line helper was created for workflows that compare a teacher's
sample report/record DOCX with a target lesson-plan DOCX, then draft a Thai
"บันทึกผลการจัดการเรียนรู้" (post-lesson learning record).  It intentionally
uses only Python's standard library so it can run in restricted school or
assessment environments without installing extra packages.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import textwrap
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

DOCX_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
XLSX_NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

SECTION_HINTS = {
    "ผลการจัดการเรียนรู้": ("ผลการจัดการเรียนรู้", "ผลลัพธ์ทางการเรียน", "ผลการเรียนรู้"),
    "ปัญหาและอุปสรรค": ("ปัญหา", "อุปสรรค", "ข้อจำกัด"),
    "แนวทางแก้ไข": ("แนวทางแก้ไข", "ปรับปรุง", "พัฒนา", "ข้อเสนอแนะ"),
    "ความคิดเห็นผู้บริหาร": ("ความคิดเห็น", "ข้อเสนอแนะของผู้บริหาร", "ผู้บริหาร"),
}


@dataclass
class ExtractedDocument:
    """Text and table content extracted from a DOCX file."""

    path: Path
    paragraphs: list[str]
    tables: list[list[list[str]]]

    @property
    def text(self) -> str:
        return "\n".join(self.paragraphs)


@dataclass
class EvidenceSummary:
    """Summarized score/evidence information used in the final draft."""

    files: list[str] = field(default_factory=list)
    row_count: int = 0
    numeric_values: list[float] = field(default_factory=list)
    video_links: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    @property
    def average(self) -> float | None:
        if not self.numeric_values:
            return None
        return sum(self.numeric_values) / len(self.numeric_values)

    @property
    def maximum(self) -> float | None:
        return max(self.numeric_values) if self.numeric_values else None

    @property
    def minimum(self) -> float | None:
        return min(self.numeric_values) if self.numeric_values else None


def _read_docx_xml(path: Path) -> ET.Element:
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml")
    return ET.fromstring(xml)


def _paragraph_text(paragraph: ET.Element) -> str:
    parts = [node.text or "" for node in paragraph.findall(".//w:t", DOCX_NS)]
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def extract_docx(path: Path) -> ExtractedDocument:
    """Extract paragraphs and tables from a DOCX file."""
    root = _read_docx_xml(path)
    paragraphs = [
        text
        for text in (_paragraph_text(node) for node in root.findall(".//w:p", DOCX_NS))
        if text
    ]
    tables: list[list[list[str]]] = []
    for table in root.findall(".//w:tbl", DOCX_NS):
        rows: list[list[str]] = []
        for row in table.findall(".//w:tr", DOCX_NS):
            cells = [_paragraph_text(cell) for cell in row.findall(".//w:tc", DOCX_NS)]
            if any(cells):
                rows.append(cells)
        if rows:
            tables.append(rows)
    return ExtractedDocument(path=path, paragraphs=paragraphs, tables=tables)


def detect_sections(document: ExtractedDocument) -> dict[str, list[str]]:
    """Group nearby paragraphs under common post-lesson record headings."""
    sections: dict[str, list[str]] = {name: [] for name in SECTION_HINTS}
    active: str | None = None
    for paragraph in document.paragraphs:
        compact = paragraph.replace(" ", "")
        matched = next(
            (
                name
                for name, hints in SECTION_HINTS.items()
                if any(hint.replace(" ", "") in compact for hint in hints)
            ),
            None,
        )
        if matched:
            active = matched
            sections[active].append(paragraph)
        elif active and len(sections[active]) < 8:
            sections[active].append(paragraph)
    return {name: values for name, values in sections.items() if values}


def extract_lesson_metadata(document: ExtractedDocument) -> dict[str, str]:
    """Find likely lesson metadata values from the lesson plan text."""
    patterns = {
        "กลุ่มสาระ/รายวิชา": r"(?:กลุ่มสาระ|รายวิชา)\s*[:：]?\s*([^\n]{3,80})",
        "ระดับชั้น": r"(?:ชั้น|ระดับชั้น)\s*[:：]?\s*([^\n]{2,40})",
        "หน่วยการเรียนรู้": r"(?:หน่วยการเรียนรู้|หน่วยที่)\s*[:：]?\s*([^\n]{3,100})",
        "เรื่อง": r"(?:เรื่อง)\s*[:：]?\s*([^\n]{3,100})",
        "เวลา": r"(?:เวลา|จำนวนเวลา)\s*[:：]?\s*([^\n]{2,40})",
    }
    text = document.text
    metadata: dict[str, str] = {}
    for label, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            value = re.sub(r"\s+", " ", match.group(1)).strip(" :-")
            metadata[label] = value
    return metadata


def _numbers_from_text(text: str) -> list[float]:
    return [float(value) for value in re.findall(r"(?<!\d)(?:100|\d{1,2})(?:\.\d+)?(?!\d)", text)]


def _video_links_from_text(text: str) -> list[str]:
    return re.findall(r"https?://\S*(?:youtube|youtu\.be|drive\.google|facebook|tiktok|vimeo)\S*", text, re.I)


def summarize_csv(path: Path, summary: EvidenceSummary) -> None:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not any(cell.strip() for cell in row):
                continue
            summary.row_count += 1
            joined = " ".join(row)
            summary.numeric_values.extend(_numbers_from_text(joined))
            summary.video_links.extend(_video_links_from_text(joined))


def _xlsx_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    strings: list[str] = []
    for item in root.findall("main:si", XLSX_NS):
        strings.append("".join(node.text or "" for node in item.findall(".//main:t", XLSX_NS)))
    return strings


def summarize_xlsx(path: Path, summary: EvidenceSummary) -> None:
    with zipfile.ZipFile(path) as archive:
        shared = _xlsx_shared_strings(archive)
        sheets = [name for name in archive.namelist() if name.startswith("xl/worksheets/sheet") and name.endswith(".xml")]
        for sheet in sheets:
            root = ET.fromstring(archive.read(sheet))
            for row in root.findall(".//main:row", XLSX_NS):
                values: list[str] = []
                for cell in row.findall("main:c", XLSX_NS):
                    node = cell.find("main:v", XLSX_NS)
                    if node is None or node.text is None:
                        continue
                    value = node.text
                    if cell.attrib.get("t") == "s" and value.isdigit() and int(value) < len(shared):
                        value = shared[int(value)]
                    values.append(value)
                if values:
                    summary.row_count += 1
                    joined = " ".join(values)
                    summary.numeric_values.extend(_numbers_from_text(joined))
                    summary.video_links.extend(_video_links_from_text(joined))


def summarize_evidence(paths: Iterable[Path]) -> EvidenceSummary:
    summary = EvidenceSummary()
    for path in paths:
        summary.files.append(str(path))
        suffix = path.suffix.lower()
        try:
            if suffix == ".csv":
                summarize_csv(path, summary)
            elif suffix == ".xlsx":
                summarize_xlsx(path, summary)
            elif suffix == ".docx":
                doc = extract_docx(path)
                summary.numeric_values.extend(_numbers_from_text(doc.text))
                summary.video_links.extend(_video_links_from_text(doc.text))
                summary.row_count += len(doc.tables)
            else:
                text = path.read_text(encoding="utf-8", errors="ignore")
                summary.numeric_values.extend(_numbers_from_text(text))
                summary.video_links.extend(_video_links_from_text(text))
        except Exception as exc:  # noqa: BLE001 - continue processing other evidence files.
            summary.notes.append(f"อ่านไฟล์ {path} ไม่สำเร็จ: {exc}")
    summary.video_links = sorted(set(summary.video_links))
    return summary


def _bulletize(values: list[str], limit: int = 4) -> str:
    cleaned = [re.sub(r"\s+", " ", value).strip() for value in values if value.strip()]
    return "\n".join(f"- {value}" for value in cleaned[:limit]) or "- (เติมข้อมูลตามหลักฐานจริง)"


def build_record(sample: ExtractedDocument, lesson: ExtractedDocument, evidence: EvidenceSummary) -> str:
    sample_sections = detect_sections(sample)
    metadata = extract_lesson_metadata(lesson)
    meta_lines = "\n".join(f"- **{key}:** {value}" for key, value in metadata.items())
    if not meta_lines:
        meta_lines = "- **ข้อมูลแผน:** (ตรวจสอบชื่อหน่วย เรื่อง ชั้น และเวลาเรียนจากไฟล์แผนการจัดการเรียนรู้)"

    score_line = "ยังไม่พบคะแนนเชิงตัวเลขจากไฟล์หลักฐาน"
    if evidence.average is not None:
        score_line = (
            f"พบข้อมูลคะแนน/ตัวเลข {len(evidence.numeric_values)} ค่า "
            f"ค่าเฉลี่ยประมาณ {evidence.average:.2f} คะแนน "
            f"(ต่ำสุด {evidence.minimum:.2f}, สูงสุด {evidence.maximum:.2f})"
        )
    video_line = "ไม่พบลิงก์คลิปวิดีโอในไฟล์หลักฐาน"
    if evidence.video_links:
        video_line = "พบลิงก์วิดีโอประกอบการสอน: " + ", ".join(evidence.video_links[:5])

    style_reference = []
    for heading in ("ผลการจัดการเรียนรู้", "ปัญหาและอุปสรรค", "แนวทางแก้ไข"):
        if heading in sample_sections:
            style_reference.append(f"### ตัวอย่างรูปแบบ: {heading}\n{_bulletize(sample_sections[heading], 3)}")
    style_block = "\n\n".join(style_reference) or "- ไม่พบหัวข้อบันทึกหลังแผนที่ชัดเจนในไฟล์ตัวอย่าง"

    evidence_files = "\n".join(f"- {path}" for path in evidence.files) or "- (ยังไม่ได้แนบไฟล์หลักฐานเพิ่มเติม)"
    notes = "\n".join(f"- {note}" for note in evidence.notes) or "- ไม่มีข้อผิดพลาดจากการอ่านไฟล์หลักฐาน"

    return textwrap.dedent(
        f"""
        # บันทึกผลการจัดการเรียนรู้

        ## 1. ข้อมูลจากแผนการจัดการเรียนรู้
        {meta_lines}

        ## 2. หลักฐานที่ใช้ประกอบการเขียนบันทึก
        {evidence_files}

        ## 3. สรุปผลจากคะแนน ชิ้นงาน ใบงาน และวิดีโอการสอน
        - {score_line}
        - {video_line}
        - จำนวนแถว/ตารางข้อมูลที่ตรวจพบจากหลักฐาน: {evidence.row_count}

        ## 4. บันทึกผลการจัดการเรียนรู้ (ฉบับร่าง)
        ### ผลการจัดการเรียนรู้
        จากการจัดกิจกรรมการเรียนรู้ตามแผนการจัดการเรียนรู้ พบว่าผู้เรียนได้ฝึกคิด วิเคราะห์ และลงมือปฏิบัติกิจกรรมตามภาระงานที่กำหนด ผู้เรียนส่วนใหญ่สามารถอธิบายขั้นตอนการทำงาน แลกเปลี่ยนความคิดเห็น และสร้างชิ้นงาน/ใบงานได้สอดคล้องกับจุดประสงค์การเรียนรู้ โดยพิจารณาจากหลักฐานคะแนน ชิ้นงาน ใบงาน และคลิปวิดีโอการสอนที่แนบประกอบ

        ### ปัญหาและอุปสรรค
        ผู้เรียนบางส่วนยังต้องได้รับการช่วยเหลือในการอ่านคำสั่ง วิเคราะห์โจทย์ หรือวางแผนลำดับขั้นตอนการทำงาน ครูจึงควรใช้คำถามชี้นำ ตัวอย่างชิ้นงาน และการสาธิตซ้ำเป็นรายกลุ่ม/รายบุคคล เพื่อให้ผู้เรียนสามารถทำงานได้ครบถ้วนมากขึ้น

        ### แนวทางแก้ไขและพัฒนา
        ในครั้งต่อไปควรจัดเตรียมใบงานที่มีลำดับขั้นตอนชัดเจน เพิ่มเกณฑ์การประเมินแบบตรวจสอบรายการ ใช้ตัวอย่างจากคลิปวิดีโอการสอนประกอบการทบทวน และจัดกิจกรรมช่วยเหลือผู้เรียนที่ยังไม่ผ่านเกณฑ์ด้วยการฝึกซ้ำหรือทำชิ้นงานปรับปรุง

        ### ข้อเสนอแนะเพื่อใช้ในแผนถัดไป
        ควรนำผลคะแนนและข้อสังเกตจากชิ้นงานมาแบ่งกลุ่มผู้เรียนตามระดับความพร้อม เพื่อออกแบบกิจกรรมเสริมสำหรับผู้เรียนที่ต้องการความช่วยเหลือ และกิจกรรมท้าทายสำหรับผู้เรียนที่ทำได้ตามเกณฑ์แล้ว

        ## 5. รูปแบบ/ภาษาที่วิเคราะห์จากไฟล์ตัวอย่าง
        {style_block}

        ## 6. หมายเหตุจากการประมวลผลไฟล์
        {notes}
        """
    ).strip() + "\n"


def write_analysis_json(path: Path, sample: ExtractedDocument, lesson: ExtractedDocument, evidence: EvidenceSummary) -> None:
    data = {
        "sample_file": str(sample.path),
        "lesson_plan_file": str(lesson.path),
        "sample_sections": detect_sections(sample),
        "lesson_metadata": extract_lesson_metadata(lesson),
        "evidence": {
            "files": evidence.files,
            "row_count": evidence.row_count,
            "numeric_value_count": len(evidence.numeric_values),
            "average": evidence.average,
            "minimum": evidence.minimum,
            "maximum": evidence.maximum,
            "video_links": evidence.video_links,
            "notes": evidence.notes,
        },
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="วิเคราะห์ไฟล์ DOCX ตัวอย่างและแผนการจัดการเรียนรู้เพื่อร่างบันทึกผลการจัดการเรียนรู้",
    )
    parser.add_argument("--sample", required=True, type=Path, help="ไฟล์ DOCX ตัวอย่าง/รายงานของครู")
    parser.add_argument("--lesson-plan", required=True, type=Path, help="ไฟล์ DOCX แผนการจัดการเรียนรู้ที่ต้องการเขียนบันทึก")
    parser.add_argument("--evidence", nargs="*", default=[], type=Path, help="ไฟล์คะแนน ใบงาน ชิ้นงาน ลิงก์วิดีโอ หรือหลักฐานเพิ่มเติม (.csv/.xlsx/.docx/.txt)")
    parser.add_argument("--output", default=Path("บันทึกผลการจัดการเรียนรู้.md"), type=Path, help="ไฟล์ Markdown ผลลัพธ์")
    parser.add_argument("--analysis-json", type=Path, help="บันทึกผลวิเคราะห์เป็น JSON เพิ่มเติม")
    return parser.parse_args(argv)


def validate_inputs(paths: Iterable[Path]) -> None:
    missing = [str(path) for path in paths if not path.exists()]
    if missing:
        raise FileNotFoundError("ไม่พบไฟล์: " + ", ".join(missing))


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    validate_inputs([args.sample, args.lesson_plan, *args.evidence])

    sample = extract_docx(args.sample)
    lesson = extract_docx(args.lesson_plan)
    evidence = summarize_evidence(args.evidence)
    draft = build_record(sample, lesson, evidence)

    args.output.write_text(draft, encoding="utf-8")
    if args.analysis_json:
        write_analysis_json(args.analysis_json, sample, lesson, evidence)

    print(f"เขียนไฟล์ผลลัพธ์แล้ว: {args.output}")
    if args.analysis_json:
        print(f"เขียนไฟล์วิเคราะห์แล้ว: {args.analysis_json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
