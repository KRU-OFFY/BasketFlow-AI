import { resolveSupabasePublicConfig } from '../supabase/public-config.ts';

export type DeploymentHealthStatus = 'ok' | 'degraded';

export type DeploymentHealth = {
  status: DeploymentHealthStatus;
  httpStatus: 200 | 503;
  service: 'basketflow-ai';
  environment: string;
  version: string;
  checks: {
    supabasePublic: boolean;
    supabaseServiceRole: boolean;
    aiProvider: boolean;
  };
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function isAiProviderReady(env: NodeJS.ProcessEnv) {
  const provider = env.AI_PROVIDER?.trim() || 'mock';
  if (provider === 'mock') return true;
  if (provider === 'openai') return hasValue(env.OPENAI_API_KEY);
  return false;
}

export function evaluateDeploymentHealth(env: NodeJS.ProcessEnv): DeploymentHealth {
  const checks = {
    supabasePublic: Boolean(resolveSupabasePublicConfig(env)),
    supabaseServiceRole: hasValue(env.SUPABASE_SERVICE_ROLE_KEY),
    aiProvider: isAiProviderReady(env),
  };

  const ready = Object.values(checks).every(Boolean);

  return {
    status: ready ? 'ok' : 'degraded',
    httpStatus: ready ? 200 : 503,
    service: 'basketflow-ai',
    environment: env.VERCEL_ENV?.trim() || env.NODE_ENV?.trim() || 'development',
    version: env.VERCEL_GIT_COMMIT_SHA?.trim() || env.NEXT_PUBLIC_DD_VERSION?.trim() || 'development',
    checks,
  };
}
