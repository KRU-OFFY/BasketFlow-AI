# BasketFlow AI

จัดการงานปักตะกร้าแบบครบขั้นตอน

BasketFlow AI ช่วยครีเอเตอร์ทำงานตั้งแต่นำเข้าสินค้า Shopee → สร้าง AI Brief/Script → ตรวจ Compliance → Media → Human Approval → Publishing Queue โดยมี Safety Gate ฝั่งเซิร์ฟเวอร์

## Brand direction

- ชื่อผลิตภัณฑ์: `BasketFlow AI`
- คำโปรย: `จัดการงานปักตะกร้าแบบครบขั้นตอน`
- แนวคิด: เปลี่ยนลิงก์สินค้าเป็นสคริปต์ คลิป ลิงก์ Affiliate และผลลัพธ์ในระบบเดียว
- สีหลัก: Navy, Blue, Cyan, Purple, Pink, Orange และ Green

## Tech stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Database, Storage-ready metadata, Server Actions และ Mock AI ที่พร้อมสลับเป็น OpenAI

## Local setup

```powershell
npm ci
npx supabase start
npx supabase db reset
npx supabase status -o env
```

นำค่า `API_URL` และ publishable/anon key จาก `supabase status` ใส่ `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service role key; server-only>
AI_PROVIDER=mock
```

จากนั้นรัน:

```powershell
npm run dev
```

## Verification

```powershell
npm test
npm run test:integration # requires SUPABASE_TEST_* variables from the local Supabase instance
npm run typecheck
npm run build
```

Safety test input: `สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%` ต้องได้ `BLOCK`

## Security model

- ทุกตาราง workflow เปิด RLS สำหรับการอ่านตาม `user_id` และถอนสิทธิ์เขียนของ browser JWT
- Server Actions ตรวจ user/ownership แล้วเรียก service-role RPC แบบ atomic เท่านั้น
- Compliance แยกเป็น Preliminary หลัง Script และ Final หลัง Media/AI label
- Approval และ Publishing Queue ผูกกับ Script, Final Compliance และ Media revision เดียวกัน
- Publishing Queue มี database trigger ตรวจ Safety Gate ซ้ำและไม่รับค่า PASS/approved จาก client
- ห้ามใส่ service-role/secret key ในตัวแปร `NEXT_PUBLIC_*`
- AI Logs ใช้ snake_case, ผูก `request_id`, sanitize payload และมี RPC ล้างข้อมูลอายุเกินค่า retention ซึ่งกำหนดเริ่มต้นไว้ 90 วัน

## Vercel

ตั้งค่า Supabase URL, publishable key, `SUPABASE_SERVICE_ROLE_KEY` แบบ Sensitive และ `AI_PROVIDER=mock` ใน Vercel Environment Variables แล้วทดสอบ Preview ก่อนเสมอ ต้องสำรองฐานข้อมูล Production ก่อน apply migration หรือ archive ข้อมูลซ้ำ OpenAI เป็น opt-in ด้วย `AI_PROVIDER=openai`, `OPENAI_MODEL` และ `OPENAI_API_KEY` ฝั่งเซิร์ฟเวอร์เท่านั้น

สคริปต์ `supabase/maintenance/20260703_archive_duplicate_projects.sql` ใช้สำหรับเก็บโปรเจกต์ซ้ำเดิมเข้าคลังแบบย้อนคืนได้ ห้ามรันก่อนสำรองข้อมูลและตรวจจำนวนเป้าหมายใน Preview/transaction test

## Datadog Error Tracking

Browser Error Tracking ใช้ Datadog RUM บน AP1 และจะเริ่มทำงานเฉพาะเมื่อกำหนด `NEXT_PUBLIC_DD_APPLICATION_ID` กับ `NEXT_PUBLIC_DD_CLIENT_TOKEN` ใน environment แล้วเท่านั้น

กำหนด `NEXT_PUBLIC_DD_ENV` และ `NEXT_PUBLIC_DD_VERSION` เพื่อแยก environment/release ได้ การตั้งค่าเริ่มต้นปิด Session Replay, user interaction และ resource tracking พร้อม mask input และลบ credential, JWT และอีเมลออกจาก URL/error ก่อนส่ง ห้ามใส่ Datadog API key หรือ secret key ใด ๆ ในตัวแปร `NEXT_PUBLIC_*`
