# BasketPilot AI

AI ผู้ช่วยปั้นคลิปรีวิว ให้พร้อมปักตะกร้าอย่างปลอดภัย

BasketPilot AI ช่วยครีเอเตอร์ทำงานตั้งแต่นำเข้าสินค้า Shopee → สร้าง AI Brief/Script → ตรวจ Compliance → Media → Human Approval → Publishing Queue โดยมี Safety Gate ฝั่งเซิร์ฟเวอร์

## Tech stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Database, Storage-ready metadata, Server Actions และ Mock AI ที่พร้อมสลับเป็น OpenAI

## Local setup

```powershell
npm install
npx supabase start
npx supabase db reset
npx supabase status -o env
```

นำค่า `API_URL` และ publishable/anon key จาก `supabase status` ใส่ `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
AI_PROVIDER=mock
```

จากนั้นรัน:

```powershell
npm run dev
```

## Verification

```powershell
npm test
npx tsc --noEmit
npm run build
```

Safety test input: `สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%` ต้องได้ `BLOCK`

## Security model

- ทุกตาราง workflow เปิด RLS และจำกัดแถวด้วย authenticated `user_id`
- Server Actions ตรวจ user และ ownership ซ้ำเสมอ
- Publishing Queue อ่าน Compliance/Approval/disclosure/AI label จากฐานข้อมูล และเรียก atomic database RPC
- ห้ามใส่ service-role/secret key ในตัวแปร `NEXT_PUBLIC_*`
- AI Logs ใช้ snake_case และผูกกับผู้ใช้/โปรเจกต์

## Vercel

ตั้งค่า Supabase URL, publishable key และ `AI_PROVIDER=mock` ใน Vercel Environment Variables แล้ว apply migration ก่อน deploy ระบบจริง OpenAI เป็น opt-in ด้วย `AI_PROVIDER=openai`, `OPENAI_MODEL` และ `OPENAI_API_KEY` ฝั่งเซิร์ฟเวอร์เท่านั้น
