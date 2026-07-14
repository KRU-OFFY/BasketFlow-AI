# BasketFlow AI — Vercel Deployment Runbook

## Deployment targets

- GitHub repository: `KRU-OFFY/BasketFlow-AI`
- Production branch: `main`
- Vercel team: `kru-toffy-gpt-codex`
- Recommended Vercel project name: `basketflow-ai`
- Framework preset: Next.js
- Node.js: 22
- Supabase project: `ccmrtdhbsxympgwpvqcq`
- Supabase region: `ap-southeast-1` (Singapore)
- Supabase URL: `https://ccmrtdhbsxympgwpvqcq.supabase.co`

This phase does not apply database migrations or change production data.

## Required environment variables

Configure these variables in both **Preview** and **Production** before promoting a deployment.

| Variable | Visibility | Required | Purpose |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Yes | Existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Yes | Current enabled Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensitive, server-only | Yes | Server Actions and protected RPC operations |
| `AI_PROVIDER` | Server | Yes | Keep `mock` until OpenAI is explicitly enabled |
| `OPENAI_MODEL` | Server | Only for OpenAI | Model identifier |
| `OPENAI_API_KEY` | Sensitive, server-only | Only for OpenAI | OpenAI provider credential |
| `SHOPEE_OPEN_API_ENABLED` | Server | No | Keep `false` until access is approved |
| `SHOPEE_OPEN_API_PARTNER_ID` | Sensitive, server-only | Only for Shopee API | Partner identifier |
| `SHOPEE_OPEN_API_KEY` | Sensitive, server-only | Only for Shopee API | Partner secret |
| `NEXT_PUBLIC_DD_APPLICATION_ID` | Browser identifier | No | Datadog RUM application ID |
| `NEXT_PUBLIC_DD_CLIENT_TOKEN` | Browser identifier | No | Datadog RUM client token |
| `NEXT_PUBLIC_DD_ENV` | Browser-safe | No | Environment label |
| `NEXT_PUBLIC_DD_VERSION` | Browser-safe | No | Release version |

Never create a variable named `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_OPENAI_API_KEY`, or `NEXT_PUBLIC_SHOPEE_OPEN_API_KEY`.

## Import and Preview deployment

1. Import `KRU-OFFY/BasketFlow-AI` into the Vercel team.
2. Select Next.js and keep the repository root as the project root.
3. Set Node.js 22.
4. Add all required Preview environment variables.
5. Deploy the `main` branch or a deployment branch as Preview.
6. Confirm the build completes successfully.
7. Run the external smoke test from a trusted terminal:

```powershell
$env:BASKETFLOW_BASE_URL = "https://<preview-deployment>.vercel.app"
npm run smoke:deployment
```

Expected output includes:

```text
Smoke test passed
Health version: <commit SHA>
Environment: preview
```

The health endpoint is:

```text
GET /api/health
```

It returns HTTP `200` only when the public Supabase configuration, service-role configuration, and selected AI provider are ready. It returns HTTP `503` with boolean checks when configuration is incomplete. It never returns secret values.

## Authentication URL configuration

Before production login testing, update Supabase Authentication URL settings:

- Site URL: the final BasketFlow AI production URL.
- Additional redirect URLs: the production URL and the Vercel Preview pattern approved for this project.

Do not use unrestricted wildcard redirect URLs outside the controlled Vercel project domain.

## Production promotion gate

Promote to Production only when all conditions pass:

- GitHub Actions: `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`.
- Preview `/api/health` returns HTTP `200` and `status: "ok"`.
- Preview `/login` displays `BasketFlow AI`.
- Sign-up and sign-in complete without redirect errors.
- A test account can open the dashboard.
- No service-role or provider secret appears in browser source, logs, or exported responses.
- No database migration is pending for this deployment.

After promotion, run:

```powershell
$env:BASKETFLOW_BASE_URL = "https://<production-domain>"
npm run smoke:deployment
```

## Rollback

Because this phase does not mutate the database, application rollback is safe:

1. In Vercel, locate the previously verified Production deployment.
2. Promote or redeploy that deployment.
3. Run `npm run smoke:deployment` against the restored Production URL.
4. Check `/api/health` and Vercel runtime errors.
5. Do not rotate or delete Supabase keys during an application-only rollback unless a credential exposure is confirmed.

## Troubleshooting

### `/api/health` returns 503

Check the boolean `checks` object, then verify the variable exists in the correct Vercel environment and redeploy. Environment changes do not alter an already-built deployment.

### Build succeeds but login fails

Verify Supabase Site URL and Additional Redirect URLs, then inspect Auth logs. Confirm the public key is enabled and belongs to project `ccmrtdhbsxympgwpvqcq`.

### Server Actions report missing credentials

Verify `SUPABASE_SERVICE_ROLE_KEY` exists as a Sensitive server-only variable in both Preview and Production. Never expose the value in logs or issue comments.
