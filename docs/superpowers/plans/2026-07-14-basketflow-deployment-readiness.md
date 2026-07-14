# BasketFlow AI Deployment Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BasketFlow AI safe to deploy to Vercel with an explicit environment contract, machine-readable health endpoint, automated deployment smoke test, and operational runbook.

**Architecture:** Keep deployment checks isolated from authentication and workflow logic. A pure health evaluator reads only the presence of required environment variables, the API route exposes that evaluator without secrets, and a standalone smoke script validates a deployed URL from outside the application.

**Tech Stack:** Next.js 16 App Router, TypeScript 6, Node.js 22, Supabase, Vercel, Node test runner.

## Global Constraints

- Do not change authentication, RLS, compliance, approval, publishing queue, or Safety Gate logic.
- Never expose Supabase service-role, OpenAI, Shopee, or Datadog secret values.
- Production uses the existing Supabase project `ccmrtdhbsxympgwpvqcq` in `ap-southeast-1`.
- `AI_PROVIDER=mock` remains the default until OpenAI credentials are explicitly configured.
- Verification commands are `npm test`, `npm run typecheck`, and `npm run build`.

---

### Task 1: Define the deployment health contract

**Files:**
- Create: `tests/deployment-readiness.test.ts`
- Create: `lib/deployment/health.ts`

**Interfaces:**
- Produces: `evaluateDeploymentHealth(env: NodeJS.ProcessEnv): DeploymentHealth`
- `DeploymentHealth` contains `status`, `service`, `environment`, `version`, and boolean checks only.

- [ ] Write tests proving complete configuration returns `ok` and HTTP-equivalent status `200`.
- [ ] Write tests proving missing public Supabase or service-role configuration returns `degraded` and status `503`.
- [ ] Implement the pure evaluator without network calls or secret values.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Add the health API route

**Files:**
- Create: `app/api/health/route.ts`

**Interfaces:**
- Consumes: `evaluateDeploymentHealth(process.env)`.
- Produces: `GET /api/health` with `Cache-Control: no-store` and JSON health output.

- [ ] Return `200` for ready environments and `503` for degraded environments.
- [ ] Include no credential values, hostnames, user data, or database contents.
- [ ] Run `npm run typecheck` and `npm run build`.

### Task 3: Add an external smoke test

**Files:**
- Create: `scripts/smoke-deployment.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `BASKETFLOW_BASE_URL`.
- Produces: process exit code `0` only when `/api/health` is ready and `/login` contains `BasketFlow AI`.

- [ ] Validate that the base URL is `http` or `https`.
- [ ] Fetch `/api/health` with redirects enabled and require status `200` plus `status: "ok"`.
- [ ] Fetch `/login` and require status `200` plus the active product name.
- [ ] Add `npm run smoke:deployment`.

### Task 4: Document the production environment contract

**Files:**
- Modify: `.env.example`
- Create: `docs/deployment/vercel.md`
- Modify: `README.md`

**Interfaces:**
- Documents required versus optional variables, Preview-first deployment, rollback, and smoke commands.

- [ ] Mark `NEXT_PUBLIC_SUPABASE_URL`, publishable key, and `SUPABASE_SERVICE_ROLE_KEY` as required.
- [ ] Document the existing Supabase project URL without writing any secret key.
- [ ] Document Preview verification before Production promotion.
- [ ] Document rollback to the previous Vercel deployment and database non-mutation requirement.

### Task 5: Verify and integrate

**Files:**
- Modify: Pull Request metadata only.

- [ ] Run GitHub Actions for `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`.
- [ ] Review the complete diff for secrets and protected workflow changes.
- [ ] Merge only after every check passes.
- [ ] After Vercel project creation, set environment variables and run `BASKETFLOW_BASE_URL=https://<deployment> npm run smoke:deployment`.
