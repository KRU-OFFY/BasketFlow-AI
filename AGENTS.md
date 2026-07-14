# BasketFlow AI

- Do not rebuild the application from scratch; extend the existing Next.js App Router codebase.
- Keep all user-facing UI in Thai and preserve the BasketFlow AI brand and reusable inline SVG logo.
- Use the approved vibrant palette: Navy, Blue, Cyan, Purple, Pink, Orange, and Green.
- Mock AI is the default. OpenAI must remain an explicit server-side opt-in.
- Keep the Publishing Safety Gate server-side. Never trust client-provided compliance, approval, disclosure, or AI-label state.
- Every insert into a Supabase owner-protected table must include the authenticated `user_id`.
- Verify ownership before reading or mutating products, projects, or related workflow rows.
- Keep branding changes isolated from authentication, RLS, compliance, approval, queue, and publishing logic.
- Always run `npm test`, `npm run typecheck`, and `npm run build` after relevant changes.
