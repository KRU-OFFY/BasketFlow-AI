from __future__ import annotations

import math
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

from PIL import Image, ImageDraw, ImageOps
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "output" / "pdf"
TMP_DIR = ROOT / "tmp" / "pdfs"
ASSET_DIR = OUT_DIR / "assets"
PROCESSED_DIR = TMP_DIR / "manual-assets"
PDF_PATH = OUT_DIR / "BasketPilot-AI-คู่มือการใช้งาน-Step-by-Step.pdf"
CONTACT_SHEET = TMP_DIR / "BasketPilot-AI-manual-contact-sheet.png"
RENDER_PREFIX = TMP_DIR / "manual-render"

QA_DIR = Path(r"D:\งาน CODEX AI\BasketPilot-AI\docs\qa\basketpilot-audit-2026-07-02")

W, H = A4
M = 42

NAVY = colors.HexColor("#0B1026")
INDIGO = colors.HexColor("#302B7A")
CORAL = colors.HexColor("#FF6B4A")
PURPLE = colors.HexColor("#5B2EFF")
ROSE = colors.HexColor("#FF4D6D")
MANGO = colors.HexColor("#FFC857")
MINT = colors.HexColor("#2ED8A3")
LIGHT = colors.HexColor("#F6F7FB")
TEXT = colors.HexColor("#172036")
MUTED = colors.HexColor("#5F6B85")
BORDER = colors.HexColor("#D9E0EE")


def register_fonts() -> tuple[str, str, str]:
    candidates = [
        (r"C:\Windows\Fonts\LeelawUI.ttf", r"C:\Windows\Fonts\LeelaUIb.ttf", r"C:\Windows\Fonts\LeelUIsl.ttf"),
        (r"C:\Windows\Fonts\leelawad.ttf", r"C:\Windows\Fonts\leelawdb.ttf", r"C:\Windows\Fonts\LeelUIsl.ttf"),
        (r"C:\Windows\Fonts\NotoSans-Regular.ttf", r"C:\Windows\Fonts\NotoSans-Bold.ttf", r"C:\Windows\Fonts\NotoSans-Italic.ttf"),
    ]
    for regular, bold, italic in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("ThaiRegular", regular))
            pdfmetrics.registerFont(TTFont("ThaiBold", bold))
            if Path(italic).exists():
                pdfmetrics.registerFont(TTFont("ThaiItalic", italic))
            else:
                pdfmetrics.registerFont(TTFont("ThaiItalic", regular))
            return "ThaiRegular", "ThaiBold", "ThaiItalic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


FONT, FONT_BOLD, FONT_ITALIC = register_fonts()


@dataclass(frozen=True)
class Img:
    key: str
    path: Path
    title: str
    caption: str


IMAGES: dict[str, Img] = {
    "shopee_affiliate": Img("shopee_affiliate", ASSET_DIR / "07-shopee-affiliate-login.png", "หน้า Shopee Affiliate Program", "เริ่มจากหน้า Affiliate Program ของ Shopee แล้วเข้าสู่ระบบด้วยบัญชีของผู้ใช้งาน"),
    "shopee_help_link": Img("shopee_help_link", ASSET_DIR / "03-shopee-help-link.png", "คู่มือ Shopee: การสร้างลิงก์แชร์สินค้า", "หน้า Help Center ของ Shopee อธิบายวิธีสร้างลิงก์แชร์สินค้าหรือ Affiliate link"),
    "shopee_help_extra": Img("shopee_help_extra", ASSET_DIR / "04-shopee-help-extra-comm.png", "คู่มือ Shopee: สินค้า Extra Comm", "ตัวอย่างภาพจริงจาก Shopee Help Center สำหรับการแชร์ลิงก์ผ่านแอป"),
    "shopee_help_web": Img("shopee_help_web", ASSET_DIR / "05-shopee-help-web.png", "คู่มือ Shopee: แชร์จากเว็บ/แอป", "ตัวอย่างวิธีเลือกสินค้าและสร้างลิงก์จากหน้าเว็บหรือแอป Shopee"),
    "shopee_convert": Img("shopee_convert", ASSET_DIR / "06-shopee-convert-link.png", "คู่มือ Shopee: แปลงลิงก์", "ใช้เป็นหลักฐานประกอบกรณีต้องแปลงลิงก์ให้พร้อมนำไปใช้ใน BasketPilot AI"),
    "bp_login": Img("bp_login", QA_DIR / "baseline" / "01-login.png", "BasketPilot AI: Login", "เข้าสู่ระบบ BasketPilot AI ด้วยอีเมลและรหัสผ่านที่ลงทะเบียนไว้"),
    "bp_dashboard": Img("bp_dashboard", QA_DIR / "after" / "01-dashboard.png", "Dashboard", "ดูภาพรวมสินค้า โปรเจกต์ งานที่รออนุมัติ และ Safety Gate Summary"),
    "bp_products": Img("bp_products", QA_DIR / "after" / "02-product-discovery.png", "Product Discovery / Import", "นำเข้าสินค้าด้วยลิงก์ Shopee Affiliate และข้อมูลสินค้าเบื้องต้น"),
    "bp_project": Img("bp_project", QA_DIR / "after" / "03-project-overview.png", "Project Overview", "ตรวจสถานะ workflow ของโปรเจกต์และเลือกขั้นตอนถัดไป"),
    "bp_brief": Img("bp_brief", QA_DIR / "after" / "04-brief.png", "AI Brief Studio", "สร้าง brief จากข้อมูลสินค้าด้วย Mock AI เพื่อเตรียมมุมคอนเทนต์"),
    "bp_script": Img("bp_script", QA_DIR / "after" / "05-script.png", "Script Studio", "สร้างสคริปต์พร้อม disclosure และ hook สำหรับวิดีโอรีวิว"),
    "bp_prelim": Img("bp_prelim", QA_DIR / "after" / "06-preliminary-compliance.png", "Preliminary Compliance", "ตรวจสคริปต์เบื้องต้นก่อนสร้างสื่อ เพื่อกันคำเคลมเสี่ยงตั้งแต่ต้น"),
    "bp_media": Img("bp_media", QA_DIR / "after" / "07-media.png", "Media Studio", "สร้าง media placeholder และเปิด AI Content Label เมื่อใช้เสียงหรือภาพจาก AI"),
    "bp_final": Img("bp_final", QA_DIR / "after" / "08-final-compliance.png", "Final Compliance", "ตรวจความปลอดภัยรอบสุดท้ายหลัง Media/AI Label ก่อนส่งอนุมัติ"),
    "bp_approval": Img("bp_approval", QA_DIR / "after" / "09-approval.png", "Human Approval", "ผู้ใช้ตรวจและอนุมัติด้วยตนเองก่อนส่งเข้า Publishing Queue"),
    "bp_queue": Img("bp_queue", QA_DIR / "after" / "10-queue.png", "Publishing Queue", "แสดงรายการที่ผ่าน Safety Gate และพร้อมนำไปเผยแพร่"),
    "bp_logs": Img("bp_logs", QA_DIR / "after" / "11-ai-logs.png", "AI Logs", "ตรวจประวัติการเรียก AI, สถานะ, provider/model และ export CSV"),
    "bp_analytics": Img("bp_analytics", QA_DIR / "after" / "12-analytics.png", "Analytics", "ดูสรุปโปรเจกต์ที่ผ่าน/รอ/ถูกบล็อก และ placeholder affiliate metrics"),
}


def ensure_dirs() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def preprocess_image(src: Path) -> Path | None:
    if not src.exists():
        return None
    dst = PROCESSED_DIR / f"{src.stem}.jpg"
    with Image.open(src) as im:
        im = im.convert("RGB")
        # Normalize occasional dark/transparent captures and keep files compact.
        im = ImageOps.exif_transpose(im)
        max_w = 1800
        if im.width > max_w:
            ratio = max_w / im.width
            im = im.resize((max_w, int(im.height * ratio)), Image.Resampling.LANCZOS)
        im.save(dst, "JPEG", quality=88, optimize=True)
    return dst


def img_path(key: str) -> Path | None:
    return preprocess_image(IMAGES[key].path)


def text_width(text: str, font: str, size: float) -> float:
    return pdfmetrics.stringWidth(text, font, size)


def wrap_text(text: str, font: str, size: float, max_width: float) -> list[str]:
    lines: list[str] = []
    for para in text.split("\n"):
        words = para.split(" ")
        current = ""
        for word in words:
            trial = word if not current else f"{current} {word}"
            if text_width(trial, font, size) <= max_width:
                current = trial
            else:
                if current:
                    lines.append(current)
                    current = word
                else:
                    chunk = ""
                    for ch in word:
                        trial_chunk = chunk + ch
                        if text_width(trial_chunk, font, size) <= max_width:
                            chunk = trial_chunk
                        else:
                            if chunk:
                                lines.append(chunk)
                            chunk = ch
                    current = chunk
        if current:
            lines.append(current)
    return lines or [""]


def draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, max_width: float, *, font: str = FONT, size: float = 11, color=TEXT, leading: float | None = None) -> float:
    leading = leading or size * 1.42
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_text(text, font, size, max_width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_logo(c: canvas.Canvas, x: float, y: float, scale: float = 1.0) -> None:
    c.saveState()
    c.translate(x, y)
    c.scale(scale, scale)
    c.setStrokeColor(colors.white)
    c.setLineWidth(2.2)
    c.setFillColor(CORAL)
    c.roundRect(0, 4, 38, 28, 7, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.circle(8, 2, 3, fill=1, stroke=0)
    c.circle(30, 2, 3, fill=1, stroke=0)
    c.setStrokeColor(NAVY)
    c.setLineWidth(2)
    c.line(8, 32, 14, 43)
    c.line(14, 43, 34, 43)
    c.setFillColor(colors.white)
    p = c.beginPath()
    p.moveTo(15, 11)
    p.lineTo(15, 27)
    p.lineTo(28, 19)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(MINT)
    c.setLineWidth(2)
    c.circle(51, 23, 9, fill=0, stroke=1)
    c.setFillColor(MANGO)
    c.circle(51, 23, 2.8, fill=1, stroke=0)
    c.setStrokeColor(MANGO)
    c.setDash(3, 3)
    c.line(40, 31, 48, 46)
    c.line(48, 46, 64, 39)
    c.setDash()
    c.restoreState()


def header(c: canvas.Canvas, title: str, section: str = "") -> None:
    c.setFillColor(NAVY)
    c.rect(0, H - 54, W, 54, fill=1, stroke=0)
    draw_logo(c, M, H - 43, 0.55)
    c.setFillColor(colors.white)
    c.setFont(FONT_BOLD, 13)
    c.drawString(M + 52, H - 30, "BasketPilot AI")
    c.setFont(FONT, 8.5)
    c.setFillColor(colors.HexColor("#CCD5EA"))
    c.drawRightString(W - M, H - 30, section or title)


def footer(c: canvas.Canvas, page: int) -> None:
    c.setStrokeColor(colors.HexColor("#E6EAF3"))
    c.line(M, 30, W - M, 30)
    c.setFillColor(MUTED)
    c.setFont(FONT, 8)
    c.drawString(M, 18, "คู่มือการใช้งาน BasketPilot AI - Mock AI default / Safety Gate server-side")
    c.drawRightString(W - M, 18, f"หน้า {page}")


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill=colors.white, stroke=BORDER, radius: float = 14) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def pill(c: canvas.Canvas, text: str, x: float, y: float, fill, text_color=colors.white, size: float = 8.5) -> float:
    pad_x = 10
    width = text_width(text, FONT_BOLD, size) + pad_x * 2
    c.setFillColor(fill)
    c.roundRect(x, y - 3, width, 18, 9, fill=1, stroke=0)
    c.setFillColor(text_color)
    c.setFont(FONT_BOLD, size)
    c.drawString(x + pad_x, y + 2, text)
    return width


def title_page(c: canvas.Canvas) -> None:
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(INDIGO)
    c.circle(W - 90, H - 100, 160, fill=1, stroke=0)
    c.setFillColor(PURPLE)
    c.circle(80, 95, 140, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.circle(W - 80, 90, 80, fill=1, stroke=0)
    draw_logo(c, M + 8, H - 175, 1.75)
    c.setFillColor(colors.white)
    c.setFont(FONT_BOLD, 32)
    c.drawString(M, H - 235, "BasketPilot AI")
    c.setFont(FONT_BOLD, 18)
    c.setFillColor(MANGO)
    c.drawString(M, H - 268, "คู่มือการใช้งาน Step-by-Step")
    c.setFont(FONT, 13)
    y = H - 310
    y = draw_wrapped(c, "AI ผู้ช่วยปั้นคลิปรีวิว ให้พร้อมปักตะกร้าอย่างปลอดภัย", M, y, W - 2 * M, font=FONT_BOLD, size=14, color=colors.white, leading=22)
    y -= 18
    c.setFillColor(colors.HexColor("#FFFFFF"))
    c.setFont(FONT, 11)
    y = draw_wrapped(c, "เอกสารนี้อธิบายตั้งแต่การเข้า Shopee เพื่อคัดลอก/สร้างลิงก์ Affiliate ไปจนถึงการนำลิงก์เข้า BasketPilot AI สร้างโปรเจกต์ สคริปต์ ตรวจ Compliance เปิด AI label อนุมัติ และส่งเข้า Publishing Queue", M, y, W - 2 * M, font=FONT, size=11, color=colors.HexColor("#E9EDFF"), leading=18)
    y -= 15
    pill(c, "Mock AI default", M, y, MINT, NAVY)
    pill(c, "Safety Gate", M + 126, y, CORAL, colors.white)
    pill(c, "Shopee Affiliate", M + 232, y, MANGO, NAVY)
    c.setFont(FONT, 9)
    c.setFillColor(colors.HexColor("#B8C2DF"))
    c.drawString(M, 70, "ฉบับจัดทำสำหรับการทดสอบและใช้งาน MVP - ใช้ภาพหน้าจอจริงจาก Shopee Help Center และ BasketPilot AI QA")


def section_page(c: canvas.Canvas, page: int, title: str, subtitle: str, bullets: Sequence[str], accent=PURPLE) -> None:
    header(c, title, "ภาพรวม")
    c.setFillColor(LIGHT)
    c.rect(0, 0, W, H - 54, fill=1, stroke=0)
    c.setFillColor(accent)
    c.roundRect(M, H - 180, W - 2 * M, 92, 18, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(M + 24, H - 125, title)
    draw_wrapped(c, subtitle, M + 24, H - 150, W - 2 * M - 48, font=FONT, size=11, color=colors.white, leading=16)
    y = H - 230
    for i, b in enumerate(bullets, 1):
        card(c, M, y - 50, W - 2 * M, 62, fill=colors.white)
        c.setFillColor(accent)
        c.circle(M + 26, y - 18, 14, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 13)
        c.drawCentredString(M + 26, y - 23, str(i))
        draw_wrapped(c, b, M + 52, y - 8, W - 2 * M - 72, font=FONT, size=10.5, color=TEXT, leading=15)
        y -= 75
    footer(c, page)


def screenshot_block(c: canvas.Canvas, img: Img, x: float, y_top: float, w: float, h: float, *, note: str | None = None) -> float:
    path = preprocess_image(img.path)
    if not path:
        card(c, x, y_top - h, w, h, fill=colors.HexColor("#FFF4F0"), stroke=CORAL)
        draw_wrapped(c, f"ไม่พบภาพ: {img.path}", x + 12, y_top - 28, w - 24, font=FONT_BOLD, size=10, color=CORAL)
        return y_top - h
    with Image.open(path) as im:
        iw, ih = im.size
    caption_h = 48
    img_h = h - caption_h
    ratio = min((w - 18) / iw, (img_h - 18) / ih)
    dw, dh = iw * ratio, ih * ratio
    card(c, x, y_top - h, w, h, fill=colors.white, stroke=BORDER)
    c.drawImage(ImageReader(str(path)), x + (w - dw) / 2, y_top - 9 - dh, dw, dh, preserveAspectRatio=True, mask="auto")
    c.setFillColor(NAVY)
    c.setFont(FONT_BOLD, 10)
    c.drawString(x + 12, y_top - h + 31, img.title)
    c.setFont(FONT, 8.2)
    c.setFillColor(MUTED)
    draw_wrapped(c, note or img.caption, x + 12, y_top - h + 17, w - 24, font=FONT, size=8.2, color=MUTED, leading=10)
    return y_top - h


def step_page(c: canvas.Canvas, page: int, title: str, section: str, steps: Sequence[str], image_keys: Sequence[str], tips: Sequence[str] = (), warning: str | None = None) -> None:
    header(c, title, section)
    c.setFillColor(LIGHT)
    c.rect(0, 0, W, H - 54, fill=1, stroke=0)
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 20)
    c.drawString(M, H - 92, title)
    pill(c, section, M, H - 120, PURPLE)

    y = H - 155
    left_w = 215
    right_x = M + left_w + 20
    right_w = W - right_x - M
    for i, s in enumerate(steps, 1):
        c.setFillColor(CORAL if i == 1 else PURPLE)
        c.circle(M + 12, y - 4, 11, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 9)
        c.drawCentredString(M + 12, y - 8, str(i))
        y = draw_wrapped(c, s, M + 31, y + 4, left_w - 34, font=FONT, size=9.5, color=TEXT, leading=13.5) - 8
    if warning:
        y -= 4
        card(c, M, y - 72, left_w, 66, fill=colors.HexColor("#FFF4EA"), stroke=MANGO)
        c.setFillColor(CORAL)
        c.setFont(FONT_BOLD, 9.5)
        c.drawString(M + 12, y - 20, "ข้อควรระวัง")
        draw_wrapped(c, warning, M + 12, y - 35, left_w - 24, font=FONT, size=8.5, color=TEXT, leading=11)
        y -= 86
    if tips:
        card(c, M, max(54, y - 22 - len(tips) * 28), left_w, len(tips) * 26 + 24, fill=colors.HexColor("#F2FFF9"), stroke=MINT)
        c.setFillColor(NAVY)
        c.setFont(FONT_BOLD, 9.5)
        c.drawString(M + 12, y - 16, "เคล็ดลับ")
        ty = y - 32
        for tip in tips:
            ty = draw_wrapped(c, f"- {tip}", M + 12, ty, left_w - 24, font=FONT, size=8.5, color=TEXT, leading=11) - 3

    if len(image_keys) == 1:
        screenshot_block(c, IMAGES[image_keys[0]], right_x, H - 142, right_w, 610)
    else:
        each_h = 292
        y_img = H - 142
        for key in image_keys[:2]:
            screenshot_block(c, IMAGES[key], right_x, y_img, right_w, each_h)
            y_img -= each_h + 18
    footer(c, page)


def workflow_page(c: canvas.Canvas, page: int) -> None:
    header(c, "Workflow การใช้งาน", "ภาพรวม")
    c.setFillColor(LIGHT)
    c.rect(0, 0, W, H - 54, fill=1, stroke=0)
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 21)
    c.drawString(M, H - 92, "Workflow ตั้งแต่ลิงก์ Shopee ถึง Publishing Queue")
    stages = [
        ("1", "Shopee", "สร้าง/คัดลอกลิงก์ Affiliate"),
        ("2", "Product Import", "กรอกข้อมูลสินค้าและลิงก์"),
        ("3", "Project", "สร้างโปรเจกต์รีวิว"),
        ("4", "AI Brief", "วางมุมรีวิวและกลุ่มเป้าหมาย"),
        ("5", "Script", "สร้างสคริปต์พร้อม disclosure"),
        ("6", "Media", "เปิด AI label และสร้างสื่อ"),
        ("7", "Compliance", "ตรวจ PASS/WARNING/BLOCK"),
        ("8", "Approval", "คนตรวจและอนุมัติ"),
        ("9", "Queue", "ผ่าน Safety Gate พร้อมเผยแพร่"),
    ]
    x0, y0 = M, H - 150
    box_w, box_h = 156, 76
    gap_x, gap_y = 18, 30
    for idx, (num, name, desc) in enumerate(stages):
        row = idx // 3
        col = idx % 3
        x = x0 + col * (box_w + gap_x)
        y = y0 - row * (box_h + gap_y)
        fill = [colors.white, colors.HexColor("#FFF7F3"), colors.HexColor("#F4F1FF")][col % 3]
        card(c, x, y - box_h, box_w, box_h, fill=fill, stroke=BORDER)
        c.setFillColor(PURPLE if idx % 2 else CORAL)
        c.circle(x + 22, y - 22, 14, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 10)
        c.drawCentredString(x + 22, y - 26, num)
        c.setFillColor(TEXT)
        c.setFont(FONT_BOLD, 11)
        c.drawString(x + 44, y - 20, name)
        draw_wrapped(c, desc, x + 14, y - 43, box_w - 28, font=FONT, size=8.5, color=MUTED, leading=11)
    card(c, M, 86, W - 2 * M, 116, fill=colors.white, stroke=BORDER)
    c.setFillColor(NAVY)
    c.setFont(FONT_BOLD, 14)
    c.drawString(M + 18, 174, "Safety Gate สำคัญอย่างไร")
    y = 152
    for b in [
        "ระบบไม่ควรเชื่อสถานะที่ผู้ใช้ส่งจากหน้าเว็บโดยตรง ต้องอ่านผล Compliance, Approval, Disclosure และ AI Label จากฐานข้อมูลฝั่ง server",
        "โปรเจกต์จะเข้าคิวเผยแพร่ได้เมื่อ Final Compliance เป็น PASS, ผู้ใช้อนุมัติแล้ว, มี Affiliate Disclosure และเปิด AI Content Label ครบ",
        "ถ้ามีการแก้ Script หรือ Media ใหม่ ผลตรวจ/การอนุมัติเก่าควรหมดอายุ แล้วต้องตรวจใหม่ก่อน Queue",
    ]:
        y = draw_wrapped(c, f"- {b}", M + 18, y, W - 2 * M - 36, font=FONT, size=9.5, color=TEXT, leading=13) - 3
    footer(c, page)


def checklist_page(c: canvas.Canvas, page: int) -> None:
    header(c, "Checklist และแหล่งอ้างอิง", "ภาคผนวก")
    c.setFillColor(LIGHT)
    c.rect(0, 0, W, H - 54, fill=1, stroke=0)
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 20)
    c.drawString(M, H - 92, "Checklist ก่อนส่งเข้า Publishing Queue")
    left = [
        "ลิงก์ Affiliate เป็น URL ที่ BasketPilot AI รองรับ และไม่ใช่โดเมน spoof",
        "ข้อมูลสินค้า ชื่อ หมวดหมู่ ราคา/คอมมิชชัน และรูปภาพตรวจแล้ว",
        "สร้าง AI Brief แล้วและอ่านผลก่อนสร้างสคริปต์",
        "Script มี Affiliate disclosure ภาษาไทยครบถ้วน",
        "เปิด AI Content Label หากใช้เสียง ภาพ avatar หรือวิดีโอที่สร้างด้วย AI",
        "Final Compliance เป็น PASS และไม่มีคำเคลมต้องห้าม",
        "ผู้ใช้กด Approve ด้วยตนเองหลังตรวจ version ล่าสุด",
        "ส่งเข้า Publishing Queue สำเร็จและตรวจ AI Logs ได้",
    ]
    y = H - 130
    for item in left:
        c.setStrokeColor(MINT)
        c.setLineWidth(1.4)
        c.rect(M, y - 9, 11, 11, fill=0, stroke=1)
        y = draw_wrapped(c, item, M + 22, y, W - 2 * M - 22, font=FONT, size=10, color=TEXT, leading=14) - 8
    card(c, M, 132, W - 2 * M, 156, fill=colors.white, stroke=BORDER)
    c.setFillColor(NAVY)
    c.setFont(FONT_BOLD, 13)
    c.drawString(M + 16, 264, "แหล่งอ้างอิงภาพ/ข้อมูลในคู่มือนี้")
    refs = [
        "Shopee Affiliate Program: https://affiliate.shopee.co.th/",
        "Shopee Help Center - การสร้างลิงก์แชร์สินค้า: https://help.shopee.co.th/portal/10/article/123905",
        "Shopee Help Center - การสร้างลิงก์แบบ Batch/Custom: https://help.shopee.co.th/portal/10/article/123906",
        "BasketPilot AI QA screenshots: docs/qa/basketpilot-audit-2026-07-02/",
    ]
    ry = 242
    for ref in refs:
        ry = draw_wrapped(c, f"- {ref}", M + 16, ry, W - 2 * M - 32, font=FONT, size=8.8, color=MUTED, leading=12) - 2
    c.setFillColor(CORAL)
    c.setFont(FONT_BOLD, 12)
    c.drawString(M, 92, "หมายเหตุ")
    draw_wrapped(c, "คู่มือนี้ใช้ภาพหน้าจอจริงที่มีอยู่ในเครื่องและจากรอบ QA ของ BasketPilot AI หากต้องการภาพจากบัญชี Shopee Affiliate ที่ล็อกอินแล้ว สามารถเปิดหน้า Affiliate ในเบราว์เซอร์แล้วถ่ายเพิ่มเพื่อแทนภาพ Help Center ได้ภายหลัง", M, 74, W - 2 * M, font=FONT, size=9, color=MUTED, leading=12)
    footer(c, page)


def build_pdf() -> None:
    ensure_dirs()
    c = canvas.Canvas(str(PDF_PATH), pagesize=A4)
    page = 1
    title_page(c)
    c.showPage()

    page += 1
    section_page(
        c,
        page,
        "ก่อนเริ่มใช้งาน",
        "เตรียมบัญชีและข้อมูลให้ครบ เพื่อลดการย้อนกลับระหว่างสร้างโปรเจกต์",
        [
            "บัญชี Shopee Affiliate ที่เข้าใช้งานได้ และบัญชี BasketPilot AI ที่ล็อกอินสำเร็จ",
            "สินค้าที่ต้องการรีวิว พร้อมชื่อสินค้า หมวดหมู่ ราคาโดยประมาณ และรูปภาพสินค้า",
            "Affiliate link ที่คัดลอกจาก Shopee หรือแปลงลิงก์แล้ว ตรวจว่าโดเมนตรงกับที่ระบบรองรับ",
            "แนวทางคอนเทนต์ที่ปลอดภัย: หลีกเลี่ยงคำว่า หายขาด เห็นผลทันที ปลอดภัย 100% รับประกัน หรือคำเคลมเกินจริง",
        ],
        accent=INDIGO,
    )
    c.showPage()

    page += 1
    workflow_page(c, page)
    c.showPage()

    pages = [
        (
            "ขั้นที่ 1: เข้า Shopee Affiliate",
            "Shopee",
            [
                "เปิดหน้า Shopee Affiliate Program แล้วกดเข้าสู่ระบบด้วยบัญชี Shopee ของคุณ",
                "ถ้าระบบขอ OTP หรือ CAPTCHA ให้ผู้ใช้ดำเนินการเองบนหน้าเว็บ เพื่อความปลอดภัยของบัญชี",
                "เมื่อเข้าระบบได้แล้ว ให้ไปยังสินค้าหรือเครื่องมือสร้างลิงก์ที่ Shopee Affiliate เตรียมไว้",
            ],
            ["shopee_affiliate"],
            ["อย่าแชร์รหัสผ่านหรือ OTP ในแชต", "ใช้บัญชีที่ผูกกับโปรแกรม Affiliate อย่างถูกต้อง"],
            None,
        ),
        (
            "ขั้นที่ 2: สร้าง/คัดลอกลิงก์ Affiliate",
            "Shopee",
            [
                "เลือกสินค้าที่ต้องการรีวิวจาก Shopee หรือจากหน้าแนะนำสินค้าใน Affiliate Program",
                "กดปุ่มแชร์/สร้างลิงก์ตามคู่มือของ Shopee แล้วคัดลอกลิงก์ที่ได้",
                "หากใช้มือถือ ให้ตรวจว่าลิงก์ที่คัดลอกเป็นลิงก์ Affiliate ไม่ใช่ลิงก์สินค้าปกติ",
            ],
            ["shopee_help_link", "shopee_help_extra"],
            ["คัดลอกลิงก์ไว้ในโน้ตชั่วคราวก่อนนำเข้า BasketPilot AI"],
            "BasketPilot AI เวอร์ชันนี้ตรวจโดเมนแบบเข้มงวดเพื่อกัน spoof link โปรดใช้ลิงก์ที่ระบบรองรับ เช่น shp.ee หรือ shopee.co.th แบบ exact hostname",
        ),
        (
            "ขั้นที่ 3: ตรวจ/แปลงลิงก์ให้พร้อมใช้",
            "Shopee",
            [
                "ถ้าลิงก์ที่ได้ไม่ผ่านใน BasketPilot AI ให้ใช้เครื่องมือแปลงลิงก์ตามช่องทางทางการของ Shopee",
                "ตรวจว่า URL ขึ้นต้นด้วย https:// และโดเมนไม่ใช่โดเมนปลอม เช่น shopee.co.th.evil.example",
                "เมื่อพร้อมแล้ว ให้กลับไปที่ BasketPilot AI เพื่อกรอก Product Import",
            ],
            ["shopee_help_web", "shopee_convert"],
            ["ลิงก์สำหรับทดสอบในระบบ MVP ที่มักผ่าน validation: https://shp.ee/test123"],
            "ห้ามเดาหรือแก้โดเมนเอง หาก Shopee เปลี่ยนรูปแบบลิงก์ ควรอัปเดต allowlist ในระบบก่อนใช้งานจริง",
        ),
        (
            "ขั้นที่ 4: Login เข้า BasketPilot AI",
            "BasketPilot AI",
            [
                "เปิดเว็บ BasketPilot AI แล้วเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน",
                "หลังเข้าสู่ระบบสำเร็จ ระบบจะพาไป Dashboard เพื่อดูภาพรวมงาน",
                "ถ้าเข้า protected route โดยยังไม่ login ระบบควร redirect กลับหน้า Login",
            ],
            ["bp_login", "bp_dashboard"],
            ["ใช้บัญชีทดสอบแยกจากบัญชี production เมื่อทดลอง workflow"],
            None,
        ),
        (
            "ขั้นที่ 5: นำเข้าสินค้า",
            "Product Import",
            [
                "ไปที่เมนูสินค้า แล้วเลือกเพิ่มสินค้า/นำเข้าสินค้า",
                "กรอกชื่อสินค้า หมวดหมู่ Shopee Affiliate link และข้อมูลเสริม เช่น ราคา คอมมิชชัน หรือรูปภาพ",
                "กดบันทึกสินค้า หากลิงก์ไม่ผ่าน ระบบจะแสดง error ให้แก้ก่อนสร้างโปรเจกต์",
            ],
            ["bp_products"],
            ["ชื่อสินค้าและหมวดหมู่ควรเขียนให้ AI Brief เข้าใจง่าย", "ใช้ลิงก์ที่ตรวจแล้วเพื่อลด error หน้า form"],
            None,
        ),
        (
            "ขั้นที่ 6: สร้าง Review Project",
            "Project",
            [
                "เปิดหน้ารายละเอียดสินค้า แล้วกดสร้างโปรเจกต์รีวิว",
                "ระบบจะสร้างโปรเจกต์ที่ผูกกับสินค้าและเจ้าของบัญชีปัจจุบัน",
                "ในหน้า Project Overview ให้ตรวจสถานะ workflow และเลือกขั้นตอนถัดไป",
            ],
            ["bp_project"],
            ["ถ้าสร้างซ้ำโดยไม่ตั้งใจ ให้ใช้ archive/จัดการข้อมูลซ้ำแทนการลบข้อมูลจริง"],
            None,
        ),
        (
            "ขั้นที่ 7: Generate AI Brief",
            "AI Brief Studio",
            [
                "เข้า AI Brief Studio แล้วกด Generate Brief",
                "อ่าน product summary, target audience, pain points, benefits, content angles และ creator note",
                "หาก brief ยังไม่ตรง ให้ตรวจข้อมูลสินค้าแล้วสร้างเวอร์ชันใหม่อย่างตั้งใจ",
            ],
            ["bp_brief"],
            ["Mock AI เป็นค่าเริ่มต้น จึงใช้ทดสอบ workflow ได้โดยไม่เรียก OpenAI จริง"],
            None,
        ),
        (
            "ขั้นที่ 8: Generate Script",
            "Script Studio",
            [
                "เลือกความยาวสคริปต์ เช่น 15, 30, 60 หรือ 90 วินาที",
                "กด Generate Script แล้วตรวจ hook, problem, benefits, use case, CTA และ full script",
                "ตรวจว่ามี Affiliate disclosure: คลิปนี้มีลิงก์ Affiliate หากสั่งซื้อผ่านลิงก์ ผู้จัดทำอาจได้รับค่าคอมมิชชัน โดยไม่มีค่าใช้จ่ายเพิ่มเติมสำหรับผู้ซื้อ",
            ],
            ["bp_script"],
            ["หลีกเลี่ยงคำเคลมแน่นอนหรือเกินจริงตั้งแต่ขั้นเขียนสคริปต์"],
            None,
        ),
        (
            "ขั้นที่ 9: ตรวจ Preliminary Compliance",
            "Compliance",
            [
                "รัน Compliance รอบแรกหลังสร้าง Script เพื่อจับคำเสี่ยงก่อนทำสื่อ",
                "ถ้าได้ BLOCK ให้แก้สคริปต์ตาม suggested fixes และ safe rewrite ก่อนเดินหน้าต่อ",
                "ถ้าได้ WARNING ให้ตรวจ missing requirements เช่น disclosure, AI label หรือ limitation statement",
            ],
            ["bp_prelim"],
            ["ประโยคเสี่ยงเช่น สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100% ต้องถูก BLOCK"],
            "ผลตรวจรอบแรกยังไม่เพียงพอสำหรับ Approval หากมี Media/AI label ที่ต้องตรวจรอบสุดท้าย",
        ),
        (
            "ขั้นที่ 10: สร้าง Media และเปิด AI Label",
            "Media Studio",
            [
                "เข้า Media Studio เพื่อสร้าง voiceover, avatar, subtitle, preview หรือ rendered video แบบ placeholder",
                "ถ้าใช้เสียงหรือภาพที่สร้างด้วย AI ให้เปิด AI Content Label",
                "ตรวจข้อความ label: วิดีโอนี้มีการใช้เสียงหรือภาพที่สร้างด้วย AI เพื่อประกอบการนำเสนอสินค้า",
            ],
            ["bp_media"],
            ["หลังแก้ media หรือ label ควรตรวจ Final Compliance ใหม่"],
            None,
        ),
        (
            "ขั้นที่ 11: ตรวจ Final Compliance",
            "Compliance",
            [
                "กลับมารัน Compliance รอบ Final หลัง Media และ AI Label พร้อม",
                "ตรวจสถานะ PASS / WARNING / BLOCK พร้อมรายการ prohibited words, missing requirements และ safe rewrite",
                "ต้องได้ PASS ก่อนส่งให้ Human Approval และ Publishing Queue",
            ],
            ["bp_final"],
            ["ห้ามลดระดับ BLOCK ด้วย AI rewrite โดยไม่ผ่าน rule-based checker"],
            "ถ้า Script หรือ Media เปลี่ยน ผล Final Compliance เก่าควรถูก invalidate และต้องตรวจใหม่",
        ),
        (
            "ขั้นที่ 12: Human Approval",
            "Approval",
            [
                "ผู้ใช้ตรวจสคริปต์ ผล Compliance และ media version ล่าสุดด้วยตนเอง",
                "กด Approve เฉพาะเมื่อเนื้อหาปลอดภัยและข้อมูลสินค้าถูกต้อง",
                "ถ้าไม่ผ่าน ให้ Reject พร้อมเหตุผล แล้วกลับไปแก้ Script/Media/Compliance",
            ],
            ["bp_approval"],
            ["Approval ควรผูกกับ version ล่าสุด ไม่ใช่อนุมัติจากผลตรวจเก่า"],
            None,
        ),
        (
            "ขั้นที่ 13: ส่งเข้า Publishing Queue",
            "Publishing Queue",
            [
                "หลัง Final PASS และ Approve แล้ว ให้กดส่งเข้า Publishing Queue",
                "ระบบ Safety Gate จะตรวจจากฐานข้อมูลฝั่ง server เท่านั้น ไม่เชื่อค่าที่ browser ส่งมา",
                "ตรวจว่ารายการปรากฏใน Queue พร้อมสถานะ ready, scheduled, published, failed หรือ cancelled",
            ],
            ["bp_queue"],
            ["ถ้า Gate ไม่ผ่าน ให้ย้อนดู Checklist ในหน้า Approval/Compliance"],
            "เงื่อนไขขั้นต่ำ: Final Compliance PASS, Approval approved, มี Affiliate disclosure, เปิด AI Content Label และโปรเจกต์ไม่ถูก archive",
        ),
        (
            "ขั้นที่ 14: ตรวจ AI Logs และ Analytics",
            "Logs & Analytics",
            [
                "เข้า AI Logs เพื่อตรวจประวัติ task_type, provider, model, latency, status และ payload ที่ sanitize แล้ว",
                "ใช้ Export CSV เมื่อจำเป็นต้องส่งหลักฐานหรือวิเคราะห์ย้อนหลัง",
                "เข้า Analytics เพื่อดูภาพรวมโปรเจกต์ที่ approved, ready to publish, blocked และผล compliance ล่าสุด",
            ],
            ["bp_logs", "bp_analytics"],
            ["AI Logs ไม่ควรเก็บ password, token, payload Supabase ละเอียดอ่อน หรือข้อมูลฟอร์มที่ไม่จำเป็น"],
            None,
        ),
    ]

    for args in pages:
        page += 1
        step_page(c, page, *args)
        c.showPage()

    page += 1
    checklist_page(c, page)
    c.showPage()
    c.save()


def render_pdf() -> list[Path]:
    for old in TMP_DIR.glob("manual-render-*.png"):
        old.unlink()
    pdftoppm_candidates = [
        shutil.which("pdftoppm.exe"),
        shutil.which("pdftoppm"),
        r"C:\Users\VACHARAPOLVINAKA\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdftoppm.exe",
    ]
    pdftoppm = next((p for p in pdftoppm_candidates if p and Path(p).exists()), None)
    if not pdftoppm:
        return []
    subprocess.run([pdftoppm, "-png", "-r", "110", str(PDF_PATH), str(RENDER_PREFIX)], check=True)
    return sorted(TMP_DIR.glob("manual-render-*.png"))


def make_contact_sheet(images: Sequence[Path]) -> None:
    if not images:
        return
    thumbs: list[Image.Image] = []
    for p in images:
        im = Image.open(p).convert("RGB")
        im.thumbnail((260, 368), Image.Resampling.LANCZOS)
        canvas_img = Image.new("RGB", (280, 410), "white")
        x = (280 - im.width) // 2
        canvas_img.paste(im, (x, 12))
        d = ImageDraw.Draw(canvas_img)
        d.rectangle((0, 0, 279, 409), outline=(210, 218, 235), width=1)
        d.text((12, 384), p.stem.replace("manual-render-", "หน้า "), fill=(40, 48, 70))
        thumbs.append(canvas_img)
    cols = 3
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * 280, rows * 410), (246, 247, 251))
    for idx, im in enumerate(thumbs):
        sheet.paste(im, ((idx % cols) * 280, (idx // cols) * 410))
    sheet.save(CONTACT_SHEET)


if __name__ == "__main__":
    build_pdf()
    rendered = render_pdf()
    make_contact_sheet(rendered)
    print(PDF_PATH)
    print(CONTACT_SHEET if CONTACT_SHEET.exists() else "NO_CONTACT_SHEET")
