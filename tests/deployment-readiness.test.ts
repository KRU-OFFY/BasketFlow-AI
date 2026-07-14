import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateDeploymentHealth } from '../lib/deployment/health.ts';
import {
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_URL,
  resolveSupabasePublicConfig,
} from '../lib/supabase/public-config.ts';

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

test('explicit Supabase public environment variables override the safe defaults', () => {
  const result = resolveSupabasePublicConfig(completeEnv);

  assert.deepEqual(result, {
    url: 'https://example.supabase.co',
    key: 'sb_publishable_example',
    source: 'environment',
  });
});

test('the existing BasketFlow Supabase public configuration is used when both public variables are absent', () => {
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
    AI_PROVIDER: 'mock',
  };

  assert.deepEqual(resolveSupabasePublicConfig(env), {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    source: 'default',
  });

  const health = evaluateDeploymentHealth(env);
  assert.equal(health.status, 'ok');
  assert.equal(health.checks.supabasePublic, true);
});

test('legacy Supabase anon key remains an accepted public-key override', () => {
  const result = evaluateDeploymentHealth({
    ...completeEnv,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'legacy-anon-placeholder',
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.httpStatus, 200);
  assert.equal(result.checks.supabasePublic, true);
});

test('partial public Supabase overrides are rejected instead of mixing projects', () => {
  const env: NodeJS.ProcessEnv = {
    ...completeEnv,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  };

  assert.equal(resolveSupabasePublicConfig(env), null);

  const result = evaluateDeploymentHealth(env);
  assert.equal(result.status, 'degraded');
  assert.equal(result.httpStatus, 503);
  assert.equal(result.checks.supabasePublic, false);
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
