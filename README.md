# AI Product Review Video Bot

[![App CI](https://github.com/KRU-OFFY/AI/actions/workflows/python.yml/badge.svg)](https://github.com/KRU-OFFY/AI/actions/workflows/python.yml)

MVP สำหรับ Shopee Affiliate creators ที่ต้องการสร้างโปรเจกต์วิดีโอรีวิวสินค้าด้วย AI แบบเป็นขั้นตอน ตั้งแต่ Login → Dashboard → Import Product → Brief → Script → Compliance → Media → Approval → Publishing Queue → Analytics → AI Logs

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS + UI components แบบ shadcn-inspired
- Supabase Auth, Database และ Storage-ready architecture
- Server Actions
- OpenAI-ready AI architecture โดยใช้ `AI_PROVIDER=mock` เป็นค่าเริ่มต้น
- Vercel deployment ready

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=mock
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=
```

ระบบจะเรียก OpenAI เฉพาะเมื่อ `AI_PROVIDER=openai` และมี `OPENAI_API_KEY` เท่านั้น หากเรียกไม่สำเร็จจะ fallback เป็น mock output

## Supabase Setup

1. สร้าง Supabase project
2. เปิด SQL editor แล้วรันไฟล์ `supabase/schema.sql`
3. ตั้งค่า env vars ใน `.env.local` และ Vercel
4. ตรวจ RLS policies ว่าผู้ใช้เข้าถึงเฉพาะข้อมูลของตนเอง

SQL schema อยู่ที่ `supabase/schema.sql` และมีตาราง:
`profiles`, `products`, `review_projects`, `ai_briefs`, `scripts`, `compliance_checks`, `media_assets`, `approvals`, `posting_queue`, `analytics_events`, `ai_logs`

## Local Development

```bash
npm run dev
npm run build
npx tsc --noEmit
```

หากยังไม่ได้ตั้งค่า Supabase env ระบบจะแสดง demo data เพื่อให้ตรวจ UI ได้ แต่ protected routes จะ redirect จริงเมื่อมี Supabase env ครบ

## Vercel Deployment

1. Import repository เข้า Vercel
2. ตั้ง Environment Variables ทั้งหมด
3. Deploy ด้วยค่า default ของ Next.js
4. ตรวจ GitHub Actions และ Vercel build logs

## Manual Test Checklist

- Signup works
- Login works
- Protected routes redirect unauthenticated users
- Product import works
- Project creation works
- Brief generation works in mock mode
- Script generation works in mock mode
- Compliance checker blocks risky claims
- AI content label toggle works
- Approval works
- Publishing Queue blocks unsafe projects
- AI Logs are created
- AI Log detail page works
- CSV export works

## Safety Test Checklist

Input script:

```text
สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%
```

Expected result:

```text
status = BLOCK
```

## Legacy Thai DOCX Helper

หมายเหตุสำหรับ Next.js 16: โปรเจกต์นี้ใช้ `proxy.ts` สำหรับ protected routes แทน `middleware.ts` ตาม convention ล่าสุดของ Next/Vercel

ไฟล์ `Kru-Toffy/codex-python.py` ยังถูกเก็บไว้เป็นเครื่องมือเดิมสำหรับร่างบันทึกผลการจัดการเรียนรู้ภาษาไทยจาก DOCX/CSV/XLSX และมี unit tests ใน `tests/test_codex_python.py`
