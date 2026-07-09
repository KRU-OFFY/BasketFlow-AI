# BasketPilot AI

## Working agreements

- Always communicate with the user in Thai unless they explicitly request another language.
- Do not rebuild the application from scratch; extend the existing Next.js App Router codebase.
- Keep all user-facing UI in Thai and preserve the BasketPilot AI brand and reusable inline SVG logo.
- Mock AI is the default. OpenAI must remain an explicit server-side opt-in.
- Keep the Publishing Safety Gate server-side. Never trust client-provided compliance, approval, disclosure, or AI-label state.
- Every insert into a Supabase owner-protected table must include the authenticated `user_id`.
- Verify ownership before reading or mutating products, projects, or related workflow rows.
- Prefer `pnpm` when installing dependencies.
- Ask for confirmation before adding new production dependencies.
- Always run `npm test`, `npx tsc --noEmit`, and `npm run build` after relevant JavaScript/TypeScript changes.

## Context7

Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- training data may not reflect recent changes. Prefer Context7 over web search for library docs.

Do not use Context7 for refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Development rules

- Inspect the current repository before changing files.
- Read the files related to the request before editing.
- Change only the files needed for the task.
- Preserve existing project structure and useful files.
- Do not remove tests to make a build pass.
- Do not commit `.env`, API keys, tokens, passwords, service role keys, or other secrets.
- Do not force push or delete branches/tags unless the user explicitly asks.
- If tests or builds are not run, clearly say why.

## Quality checklist

After relevant changes, run what applies:

1. `npm test`
2. `npx tsc --noEmit`
3. `npm run build`
4. `npm audit`

Report the real command output status; never claim a test passed without running it.

## Product guardrails

- Product name: BasketPilot AI
- Tagline: AI ผู้ช่วยปั้นคลิปรีวิว ให้พร้อมปักตะกร้าอย่างปลอดภัย
- Keep Thai-first UX.
- Keep mock AI default.
- Keep server-side Safety Gate.
- Publishing Queue must never trust client-provided gate state.
- CreatorOS AI is a future roadmap direction, not a replacement for BasketPilot AI in this MVP stabilization work.
