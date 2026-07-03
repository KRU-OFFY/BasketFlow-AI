import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './server';

export function createAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  return createClient(getSupabaseConfig().url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
