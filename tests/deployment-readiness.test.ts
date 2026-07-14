import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateDeploymentHealth } from '../lib/deployment/health.ts';

const completeEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
  AI_PROVIDER: 'mock',
  VERCEL_ENV: 'preview',
  VERCEL_GIT_COMMIT_SHA: 'abc123def456',
};

test('deployment health is ready when every required server configuration is present', () => {
  const result = evaluateDeploymentHealth(completeEnv);

  assert.equal(result.status, 'ok');
  assert.equal(result.httpStatus, 200);
  assert.equal(result.service, 'basketflow-ai');
  assert.equal(result.environment, 'preview');
  assert.equal(result.version, 'abc123def456');
  assert.deepEqual(result.checks, {
    supabasePublic: true,
    supabaseServiceRole: true,
    aiProvider: true,
  });
});

test('legacy Supabase anon key remains an accepted public-key fallback', () => {
  const result = evaluateDeploymentHealth({
    ...completeEnv,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'legacy-anon-placeholder',
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.httpStatus, 200);
  assert.equal(result.checks.supabasePublic, true);
});

test('deployment health is degraded when the service role is missing', () => {
  const result = evaluateDeploymentHealth({
    ...completeEnv,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
  });

  assert.equal(result.status, 'degraded');
  assert.equal(result.httpStatus, 503);
  assert.equal(result.checks.supabaseServiceRole, false);
});

test('deployment health is degraded when public Supabase configuration is incomplete', () => {
  const result = evaluateDeploymentHealth({
    ...completeEnv,
    NEXT_PUBLIC_SUPABASE_URL: undefined,
  });

  assert.equal(result.status, 'degraded');
  assert.equal(result.httpStatus, 503);
  assert.equal(result.checks.supabasePublic, false);
});

test('mock remains the safe AI provider default when AI_PROVIDER is unset', () => {
  const result = evaluateDeploymentHealth({
    ...completeEnv,
    AI_PROVIDER: undefined,
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.checks.aiProvider, true);
});

test('openai provider is degraded without a server API key', () => {
  const result = evaluateDeploymentHealth({
    ...completeEnv,
    AI_PROVIDER: 'openai',
    OPENAI_API_KEY: undefined,
  });

  assert.equal(result.status, 'degraded');
  assert.equal(result.httpStatus, 503);
  assert.equal(result.checks.aiProvider, false);
});
