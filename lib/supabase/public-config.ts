export const DEFAULT_SUPABASE_URL = 'https://ccmrtdhbsxympgwpvqcq.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_v7b1dNwv9e0hVeyAiiTeeQ_CZ10UawS';

export type SupabasePublicConfig = {
  url: string;
  key: string;
  source: 'environment' | 'default';
};

function value(input: string | undefined) {
  return input?.trim() || '';
}

export function resolveSupabasePublicConfig(env: NodeJS.ProcessEnv): SupabasePublicConfig | null {
  const url = value(env.NEXT_PUBLIC_SUPABASE_URL);
  const key = value(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || value(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url && !key) {
    return {
      url: DEFAULT_SUPABASE_URL,
      key: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
      source: 'default',
    };
  }

  if (!url || !key) return null;

  return { url, key, source: 'environment' };
}
