# BasketPilot AI — Combined UX / Accessibility Audit

วันที่ตรวจ: 2 กรกฎาคม 2569

ขอบเขต: Production baseline ก่อน PR 1 และ PR 2

ผลิตภัณฑ์: BasketPilot AI
ข้อจำกัด: การตรวจนี้เป็น UX/Accessibility audit แบบเจาะจงจากเส้นทางใช้งานจริงและภาพหน้าจอ ไม่ใช่การรับรอง WCAG หรือ penetration test เต็มรูปแบบ

## วิธีตรวจ

1. เปิดหน้า Login และตรวจโครงสร้างแบรนด์/ฟอร์ม
2. เข้าสู่ระบบด้วยบัญชีทดสอบเดิมของผู้ใช้
3. เปิดรายการโปรเจกต์และโปรเจกต์ที่คืบหน้ามากที่สุด
4. เดินเส้นทาง Brief → Script → Compliance → Media → Approval
5. บันทึกภาพสถานะจริงโดยไม่แก้ข้อมูล Production เพิ่ม
6. เปรียบเทียบสิ่งที่เห็นกับ Full Project Brief และกฎ Safety Gate

## หลักฐาน Baseline

| ลำดับ | หน้าจอ | หลักฐาน | ผลตรวจย่อ |
|---|---|---|---|
| 1 | Login | `baseline/01-login.png` | แบรนด์ชัดเจน แต่ช่องกรอกใช้ placeholder แทน label ที่มองเห็นได้ |
| 2 | Projects | `baseline/02-projects.png` | พบโปรเจกต์ชื่อเดียวกัน 9 รายการ; สถานะฐานข้อมูลยังเป็นภาษาอังกฤษ |
| 3 | Project overview | `baseline/03-project-overview.png` | Stepper ใช้ค่า raw status และไม่แสดงเหตุผลว่าขั้นใดถูกล็อก |
| 4 | AI Brief Studio | `baseline/04-brief.png` | ไม่มี CTA ไป Script Studio และปุ่มสร้างเวอร์ชันใหม่ไม่มี pending/confirmation |
| 5 | Script Studio | `baseline/05-script.png` | มี duration selector และ disclosure แต่ไม่มี navigation ร่วม/สถานะเวอร์ชัน |
| 6 | Compliance Center | `baseline/06-compliance.png` | มีผล PASS และ safe rewrite แต่ยังเป็นการตรวจรอบเดียวก่อน Media |
| 7 | Media Studio | `baseline/07-media.png` | AI label อยู่ในขั้น Media แต่การเปลี่ยน Media ทำให้ Compliance เดิมล้าสมัยโดย UI ไม่อธิบาย |
| 8 | Human Approval | `baseline/08-approval.png` | Checklist อ่านง่าย แต่ Approval ไม่ผูกกับ script/compliance/media revision เดียวกัน |

## จุดแข็ง

- BasketPilot AI มีเอกลักษณ์แบรนด์สม่ำเสมอทั้งโลโก้ สี Navy/Coral/Purple และ card system
- หน้า Project overview สรุป Compliance, Approval, Affiliate disclosure และ AI label ในจุดเดียว
- Script แสดง Affiliate disclosure ชัดเจน และ Compliance แสดง issues, suggested fixes และ safe rewrite
- Safety checklist ในหน้า Approval ทำให้ผู้ใช้เข้าใจเงื่อนไขหลักได้เร็ว

## ปัญหาที่ต้องแก้

### P0 — Security / Publishing integrity

- Browser JWT ยังเขียน workflow/safety tables ผ่าน Data API ได้โดยตรง จึงสามารถปลอมสถานะก่อนเข้า Queue ได้
- Approval และ Queue ไม่ได้ผูกกับ script, final compliance และ media revision เดียวกัน
- Compliance เป็นรอบเดียว จึงไม่สามารถยืนยันผลหลังสร้างหรือเปลี่ยน AI media ได้อย่างถูกต้อง

### P1 — Duplicate submission / State integrity

- พบโปรเจกต์ซ้ำ 9 รายการและ Brief จำนวนมากจากสินค้าเดียว สอดคล้องกับปุ่ม action ที่ไม่มี pending และ idempotency
- การสร้าง Script/Media ใหม่ควรทำให้ Final Compliance และ Approval เดิมหมดอายุแบบ transaction เดียว
- ไม่มีสถานะ version/superseded ที่ผู้ใช้เข้าใจได้ และยังไม่มี archive สำหรับซ่อนโปรเจกต์ซ้ำโดยไม่ลบประวัติ

### P1 — Workflow UX

- หน้า Brief ไม่มีปุ่ม “ไป Script Studio” หลังสร้างสำเร็จ
- หน้าย่อยไม่มี Project Workflow Navigation ร่วม ทำให้ผู้ใช้ต้องย้อนผ่าน browser หรือหน้า overview
- ลำดับเดิม Compliance → Media ทำให้ผู้ใช้ตรวจผ่านแล้วต้องย้อนมาตรวจใหม่หลัง Media โดยไม่มีคำอธิบาย
- WARNING/BLOCK และ action error ยังไม่มี inline recovery ที่ชัดเจน

### P2 — Accessibility / Responsive

- Login ใช้ placeholder แทน visible label; ต้องเพิ่ม label และข้อความ error ที่เชื่อมด้วย `aria-describedby`
- ปุ่ม Server Action ไม่มี pending state/disabled state และบริเวณ feedback ไม่มี `aria-live`
- Sidebar ต้องเพิ่ม `aria-current`; mobile navigation ต้องเข้าถึง AI Logs
- Toggle AI Content Label ต้องแสดง error และ rollback ที่ผู้ใช้รับรู้ได้
- ต้องตรวจ keyboard focus order, focus visibility, mobile reflow และ screen-reader announcements หลังแก้จริง

### P2 — Language / Information architecture

- หลายจุดยังใช้ชื่ออังกฤษและ raw database status เช่น `product_imported`, `compliance_checked`
- Stepper ไม่รองรับสถานะ `warning`, `blocked`, `approved`, `rejected` อย่างมีความหมาย
- Analytics ควรนับเฉพาะเวอร์ชัน Compliance ปัจจุบันต่อโปรเจกต์ และไม่รวมโปรเจกต์ที่ archive

## เกณฑ์ตรวจหลังแก้

- ทุก mutation สำคัญผ่าน server-only RPC และ browser JWT เขียน safety tables ไม่ได้
- Script → Preliminary Compliance → Media/AI Label → Final Compliance → Approval → Queue มี navigation และ gate reason ครบ
- การส่ง `request_id` ซ้ำสร้างผลลัพธ์ได้เพียงหนึ่งรายการ
- Approval อ้างถึง current script, final compliance และ media revision เดียวกัน
- ทุก action มี pending/success/error feedback และป้องกัน double submit
- สถานะทั้งหมดแปลไทยและ Stepper แยก completed/current/locked พร้อมเหตุผล
- Login, navigation, action feedback และ toggle ผ่าน keyboard/mobile smoke test

## สถานะ

- Baseline evidence: เสร็จแล้ว
- PR 1 Security/Data Integrity: กำลังดำเนินการ
- PR 2 Product Structure/UX: รอดำเนินการหลัง PR 1
- Post-fix evidence: ยังไม่บันทึก
