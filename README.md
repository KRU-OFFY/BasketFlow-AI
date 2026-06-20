# AI Product Review Video Bot

Production-ready MVP for Shopee Affiliate creators to create AI-assisted product review video projects: Login → Dashboard → Import Product → Project → AI Brief → Script → Compliance → Media → Human Approval → Publishing Queue → Analytics → AI Logs.

## Tech stack
Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Database/Storage-ready architecture, Server Actions, OpenAI-ready AI modules with mock mode by default, Vercel-ready deployment.

## Installation
```bash
npm install
npm run dev
```

## Environment variables
Copy `.env.example` to `.env.local` and set Supabase keys. AI runs in mock mode unless `AI_PROVIDER=openai` and `OPENAI_API_KEY` are present.

## Supabase setup
Run `supabase/schema.sql` in Supabase SQL editor. It creates all required tables, RLS owner policies, profile signup trigger, and updated_at triggers.

## Local development
```bash
npm run build
npx tsc --noEmit
```

## Vercel deployment
Import the repo into Vercel, configure environment variables from `.env.example`, and deploy. Supabase schema must be applied before live auth/database use.

## Manual test checklist
- Signup works
- Login works
- Protected routes redirect unauthenticated users when Supabase env is configured
- Product import validates Shopee links and risk categories
- Project creation starts as `product_imported`
- Brief generation works in mock mode
- Script generation includes Thai Affiliate disclosure
- Compliance checker blocks risky claims
- AI content label toggle architecture exists
- Approval gate exists
- Publishing Queue blocks unsafe projects with `canMoveToReadyToPublish`
- AI Logs list, detail, and CSV export routes exist

## Safety test checklist
Input: `สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%`
Expected: `status = BLOCK` from the rule-based compliance checker.
