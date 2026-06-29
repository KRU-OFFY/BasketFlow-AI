# BasketPilot AI

- Do not rebuild the application from scratch; extend the existing Next.js App Router codebase.
- Keep all user-facing UI in Thai and preserve the BasketPilot AI brand and reusable inline SVG logo.
- Mock AI is the default. OpenAI must remain an explicit server-side opt-in.
- Keep the Publishing Safety Gate server-side. Never trust client-provided compliance, approval, disclosure, or AI-label state.
- Every insert into a Supabase owner-protected table must include the authenticated `user_id`.
- Verify ownership before reading or mutating products, projects, or related workflow rows.
- Always run `npm test`, `npx tsc --noEmit`, and `npm run build` after relevant changes.
