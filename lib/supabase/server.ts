import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

import { resolveSupabasePublicConfig } from './public-config';

export function getSupabaseConfig() {
  const config = resolveSupabasePublicConfig(process.env);
  if (!config) {
    throw new Error(
      'Supabase public configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL together with NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return { url: config.url, key: config.key };
}

export async function createServerSupabase() {
  await connection();
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The root Proxy refreshes them.
        }
      },
    },
  });
}

export async function getUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function requireUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Unauthorized');
  return { supabase, user: data.user };
}
